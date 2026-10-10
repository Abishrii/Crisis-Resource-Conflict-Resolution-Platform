"""Tests for Phase 5: Scale-Out Live Updates with Redis pub/sub and SSE reconnect catch-up."""

import asyncio
import json
import os
import time

import pytest
from starlette.requests import Request

from app.events import EventHub
from app.routers.events import events
from app.services.common import commit


def test_in_process_fallback_event_hub():
    """EventHub falls back cleanly to purely in-process queues when no redis_url is provided."""
    hub = EventHub(redis_url="")
    assert not hub.is_redis

    async def _test():
        sub = hub.subscribe()
        q = sub[1]

        hub.publish({"type": "change", "revision": 101, "item": "test_inproc"})
        msg = await asyncio.wait_for(q.get(), timeout=2.0)
        assert msg["type"] == "change"
        assert msg["revision"] == 101
        assert msg["item"] == "test_inproc"

        hub.unsubscribe(sub)
        assert hub.count == 0

    asyncio.run(_test())
    hub.close()


def test_redis_pubsub_cross_distribution():
    """Two EventHub instances sharing Redis pub/sub propagate events across worker boundaries."""
    redis_url = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0")
    try:
        import redis

        r = redis.Redis.from_url(redis_url, socket_timeout=2)
        r.ping()
    except Exception:
        pytest.skip(f"Redis not available at {redis_url}")

    hub_a = EventHub(redis_url=redis_url)
    hub_b = EventHub(redis_url=redis_url)

    assert hub_a.is_redis
    assert hub_b.is_redis

    time.sleep(0.2)  # Allow pub/sub listener threads to establish subscriptions

    async def _test():
        sub_a = hub_a.subscribe()
        sub_b = hub_b.subscribe()

        q_a = sub_a[1]
        q_b = sub_b[1]

        # Publish on Hub A (simulating worker A handling a mutation)
        test_payload = {"type": "change", "revision": 202, "crisisId": "C-TEST"}
        hub_a.publish(test_payload)

        # 1. Local subscriber on Hub A should receive it directly
        msg_a = await asyncio.wait_for(q_a.get(), timeout=2.0)
        assert msg_a["revision"] == 202

        # 2. Remote subscriber on Hub B should receive it via Redis pub/sub
        msg_b = await asyncio.wait_for(q_b.get(), timeout=3.0)
        assert msg_b["type"] == "change"
        assert msg_b["revision"] == 202
        assert msg_b["crisisId"] == "C-TEST"

        # 3. Ensure Hub A does not receive a second echoed copy from Redis
        await asyncio.sleep(0.3)
        assert q_a.empty(), "Hub A should not receive duplicate echo from Redis"

        hub_a.unsubscribe(sub_a)
        hub_b.unsubscribe(sub_b)

    try:
        asyncio.run(_test())
    finally:
        hub_a.close()
        hub_b.close()


def test_event_history_ring_buffer():
    """EventHub history buffer returns ordered events since a requested revision."""
    hub = EventHub(redis_url="")
    hub._history.clear()

    hub.publish({"type": "change", "revision": 10})
    hub.publish({"type": "change", "revision": 11})
    hub.publish({"type": "change", "revision": 12})

    missed = hub.get_events_since(10)
    assert len(missed) == 2
    assert [e["revision"] for e in missed] == [11, 12]

    none_missed = hub.get_events_since(12)
    assert len(none_missed) == 0

    hub.close()


def test_sse_reconnect_last_event_id_header(app, manager):
    """Clients reconnecting with Last-Event-ID header receive replayed revision events."""

    async def _run():
        session = app.state.db.write_session()
        req = Request(scope={"type": "http", "app": app, "headers": [(b"last-event-id", b"1")]})
        commit(req, session)
        commit(req, session)
        session.close()

        db_read = app.state.db.read_session()
        resp = await events(req, last_event_id=None, user=None, db=db_read)
        it = resp.body_iterator

        retry = await anext(it)
        assert "retry: 2000" in retry

        hello = await anext(it)
        assert "event: hello" in hello

        replayed = await anext(it)
        assert "event: change" in replayed
        data = json.loads(replayed.split("data: ")[1].strip())
        assert data.get("type") == "change"
        assert data.get("revision") >= 2

        await it.aclose()

    asyncio.run(_run())


def test_sse_reconnect_last_event_id_query_param(app, manager):
    """Clients reconnecting with last_event_id query param receive replayed revision events."""

    async def _run():
        session = app.state.db.write_session()
        req = Request(scope={"type": "http", "app": app, "headers": []})
        commit(req, session)
        session.close()

        db_read = app.state.db.read_session()
        resp = await events(req, last_event_id=1, user=None, db=db_read)
        it = resp.body_iterator

        retry = await anext(it)
        assert "retry: 2000" in retry

        hello = await anext(it)
        assert "event: hello" in hello

        replayed = await anext(it)
        assert "event: change" in replayed
        data = json.loads(replayed.split("data: ")[1].strip())
        assert data.get("revision") >= 2

        await it.aclose()

    asyncio.run(_run())


def test_sse_dropped_connection_and_catchup_flow(app, manager):
    """Simulate a dropped connection where a write happens while client is disconnected."""

    async def _run():
        session = app.state.db.write_session()
        req = Request(scope={"type": "http", "app": app, "headers": []})
        commit(req, session)
        session.close()

        # 1. Initial connect: receive initial hello revision
        db1 = app.state.db.read_session()
        r1 = await events(req, last_event_id=None, user=None, db=db1)
        it1 = r1.body_iterator
        _ = await anext(it1)
        hello = await anext(it1)
        initial_rev = json.loads(hello.split("data: ")[1].strip())["revision"]
        await it1.aclose()

        # 2. Disconnected state: another mutation occurs
        session2 = app.state.db.write_session()
        commit(req, session2)
        session2.close()

        # 3. Reconnect with Last-Event-ID set to initial_rev
        req_reconnect = Request(
            scope={"type": "http", "app": app, "headers": [(b"last-event-id", str(initial_rev).encode())]}
        )
        db2 = app.state.db.read_session()
        r2 = await events(req_reconnect, last_event_id=None, user=None, db=db2)
        it2 = r2.body_iterator
        _ = await anext(it2)
        hello2 = await anext(it2)
        hello_rev = json.loads(hello2.split("data: ")[1].strip())["revision"]
        assert hello_rev > initial_rev

        # Missed change is replayed immediately
        replayed = await anext(it2)
        assert "event: change" in replayed
        event_data = json.loads(replayed.split("data: ")[1].strip())
        assert event_data["type"] == "change"
        assert event_data["revision"] == hello_rev
        await it2.aclose()

    asyncio.run(_run())
