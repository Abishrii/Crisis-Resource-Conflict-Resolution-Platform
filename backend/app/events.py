"""In-process and Redis-backed publish/subscribe for Server-Sent-Events.

Supports:
1. In-process local subscribers (asyncio.Queue).
2. Distributed Redis pub/sub when `redis_url` is provided.
3. Message replay buffer for robust Last-Event-ID catch-up on reconnect.
4. Thread-safe publishing from synchronous routes and background workers.
"""

from __future__ import annotations

import asyncio
import json
import logging
import threading
import uuid
from collections import deque

log = logging.getLogger("resqsync.events")

REDIS_CHANNEL = "resqsync:events"
REDIS_HISTORY_KEY = "resqsync:event_history"


class EventHub:
    def __init__(self, redis_url: str = "") -> None:
        self.redis_url = redis_url.strip() if redis_url else ""
        self._instance_id = uuid.uuid4().hex
        self._lock = threading.Lock()
        self._subs: set[tuple[asyncio.AbstractEventLoop, asyncio.Queue]] = set()
        self._history: deque[dict] = deque(maxlen=256)

        self._redis_client = None
        self._redis_sub_thread: threading.Thread | None = None
        self._stop_event = threading.Event()

        if self.redis_url:
            self._init_redis()

    def _init_redis(self) -> None:
        try:
            import redis

            self._redis_client = redis.Redis.from_url(
                self.redis_url,
                socket_timeout=5,
                socket_connect_timeout=5,
                decode_responses=True,
            )
            self._redis_client.ping()

            self._redis_sub_thread = threading.Thread(
                target=self._redis_listener,
                name="RedisEventHubListener",
                daemon=True,
            )
            self._redis_sub_thread.start()
            log.info(
                "EventHub connected to Redis pub/sub at %s (channel: %s)", self.redis_url.split("@")[-1], REDIS_CHANNEL
            )
        except Exception as e:
            log.warning(
                "Failed to connect EventHub to Redis at %s (%s). Falling back to in-process hub.", self.redis_url, e
            )
            self._redis_client = None

    def _redis_listener(self) -> None:
        while not self._stop_event.is_set():
            pubsub = None
            try:
                pubsub = self._redis_client.pubsub()
                pubsub.subscribe(REDIS_CHANNEL)
                for message in pubsub.listen():
                    if self._stop_event.is_set():
                        break
                    if message and message.get("type") == "message":
                        raw_data = message.get("data")
                        if not raw_data:
                            continue
                        try:
                            payload = json.loads(raw_data)
                            origin = payload.get("origin")
                            event_data = payload.get("data")
                            if origin != self._instance_id and isinstance(event_data, dict):
                                self._dispatch_local(event_data, record_history=True)
                        except Exception as e:
                            log.debug("Error processing Redis pub/sub message: %s", e)
            except Exception as e:
                if not self._stop_event.is_set():
                    log.debug("Redis pub/sub subscriber error: %s (reconnecting in 2s)", e)
                    self._stop_event.wait(2.0)
            finally:
                if pubsub:
                    try:
                        pubsub.close()
                    except Exception:
                        pass

    def subscribe(self) -> tuple[asyncio.AbstractEventLoop, asyncio.Queue]:
        sub = (asyncio.get_running_loop(), asyncio.Queue(maxsize=64))
        with self._lock:
            self._subs.add(sub)
        return sub

    def unsubscribe(self, sub: tuple[asyncio.AbstractEventLoop, asyncio.Queue]) -> None:
        with self._lock:
            self._subs.discard(sub)

    def _dispatch_local(self, message: dict, record_history: bool = True) -> None:
        with self._lock:
            if record_history:
                self._history.append(message)
            subs = list(self._subs)

        for loop, queue in subs:

            def _put(q=queue, m=message):
                if q.full():
                    try:
                        q.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                q.put_nowait(m)

            try:
                loop.call_soon_threadsafe(_put)
            except RuntimeError:  # loop closed
                self.unsubscribe((loop, queue))

    def publish(self, message: dict) -> None:
        # 1. Dispatch locally and buffer in memory
        self._dispatch_local(message, record_history=True)

        # 2. If Redis is active, broadcast to other worker processes
        if self._redis_client:
            try:
                payload = json.dumps({"origin": self._instance_id, "data": message})
                self._redis_client.publish(REDIS_CHANNEL, payload)
                self._redis_client.lpush(REDIS_HISTORY_KEY, json.dumps(message))
                self._redis_client.ltrim(REDIS_HISTORY_KEY, 0, 255)
            except Exception as e:
                log.warning("Failed to publish event to Redis: %s", e)

    def get_events_since(self, last_event_id: int) -> list[dict]:
        """Returns missed events since last_event_id (if available in buffer)."""
        with self._lock:
            missed = [e for e in self._history if e.get("revision", 0) > last_event_id]

        if not missed and self._redis_client:
            try:
                raw_items = self._redis_client.lrange(REDIS_HISTORY_KEY, 0, 100)
                redis_events = []
                for item in raw_items:
                    try:
                        ev = json.loads(item)
                        if ev.get("revision", 0) > last_event_id:
                            redis_events.append(ev)
                    except Exception:
                        pass
                redis_events.sort(key=lambda x: x.get("revision", 0))
                return redis_events
            except Exception:
                pass

        missed.sort(key=lambda x: x.get("revision", 0))
        return missed

    def close(self) -> None:
        self._stop_event.set()
        if self._redis_client:
            try:
                self._redis_client.close()
            except Exception:
                pass

    @property
    def count(self) -> int:
        with self._lock:
            return len(self._subs)

    @property
    def is_redis(self) -> bool:
        return self._redis_client is not None
