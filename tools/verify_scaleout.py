"""Verification script for Phase 5: Scale-Out Live Updates.

Proves:
1. Two independent Uvicorn server processes (Worker A on port 8008, Worker B on port 8009)
   share state via a database and distributed Redis Pub/Sub.
2. A mutation applied to Worker A is delivered in real-time to an SSE client connected to Worker B.
3. SSE reconnect with Last-Event-ID on Worker B catches up on mutations made while disconnected.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


def log(msg: str) -> None:
    print(f"[verify_scaleout] {msg}", flush=True)


def wait_for_health(port: int, timeout: float = 15.0) -> bool:
    deadline = time.time() + timeout
    url = f"http://127.0.0.1:{port}/health"
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.3)
    return False


def http_post_json(url: str, data: dict, cookies: str = "") -> tuple[int, dict, str]:
    payload = json.dumps(data).encode("utf-8")
    parsed = urllib.parse.urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Cookie": cookies,
            "Origin": origin,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            cookie_hdr = resp.headers.get("Set-Cookie", "")
            return resp.status, body, cookie_hdr
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode("utf-8"))
        return e.code, body, ""


def main() -> int:
    log("Checking Redis availability...")
    redis_url = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0")
    try:
        import redis

        r = redis.Redis.from_url(redis_url, socket_timeout=3)
        assert r.ping() is True
        log(f"Redis is reachable at {redis_url}")
    except Exception as e:
        log(f"ERROR: Redis is not reachable at {redis_url}: {e}")
        return 1

    temp_dir = Path(tempfile.mkdtemp(prefix="resqsync_scaleout_"))
    db_file = temp_dir / "scaleout.db"
    db_url = f"sqlite:///{db_file.as_posix()}"
    log(f"Using shared test database at {db_url}")

    root_dir = Path(__file__).resolve().parent.parent
    backend_dir = root_dir / "backend"
    python_exe = sys.executable

    # Pre-initialize database so concurrent worker startup does not race on SQLite DDL
    log("Pre-initializing shared database schema...")
    sys.path.insert(0, str(backend_dir))
    from app.config import Settings
    from app.database import Database
    from app.services.seed import seed_all

    init_st = Settings(database_url=db_url, demo_password="Resqsync#2026")
    init_db = Database(db_url)
    init_db.create_all()
    init_sess = init_db.write_session()
    seed_all(init_sess, init_st)
    init_sess.close()
    init_db.dispose()
    log("Shared database schema pre-initialized.")

    common_env = os.environ.copy()
    common_env.update(
        {
            "DATABASE_URL": db_url,
            "REDIS_URL": redis_url,
            "SECRET_KEY": "scaleout-verification-secret-key-32chars!",
            "ENV": "development",
            "SEED_DEMO_DATA": "false",
            "SEED_DEMO_PASSWORD": "Resqsync#2026",
            "PYTHONPATH": str(backend_dir),
        }
    )

    log_a = open(temp_dir / "worker_a.log", "w", encoding="utf-8")
    log_b = open(temp_dir / "worker_b.log", "w", encoding="utf-8")

    log("Starting Worker A on port 8008...")
    proc_a = subprocess.Popen(
        [
            python_exe,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8008",
        ],
        cwd=str(backend_dir),
        env=common_env,
        stdout=log_a,
        stderr=subprocess.STDOUT,
    )

    log("Starting Worker B on port 8009...")
    proc_b = subprocess.Popen(
        [
            python_exe,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8009",
        ],
        cwd=str(backend_dir),
        env=common_env,
        stdout=log_b,
        stderr=subprocess.STDOUT,
    )

    try:
        if not wait_for_health(8008):
            log("Worker A failed to start.")
            proc_a.terminate()
            log_a.flush()
            log(
                f"Worker A log: {(temp_dir / 'worker_a.log').read_text(encoding='utf-8')}"
            )
            return 1
        if not wait_for_health(8009):
            log("Worker B failed to start.")
            proc_b.terminate()
            log_b.flush()
            log(
                f"Worker B log: {(temp_dir / 'worker_b.log').read_text(encoding='utf-8')}"
            )
            return 1
        log("Both Worker A (8008) and Worker B (8009) are healthy!")

        # Log into Worker A and Worker B
        log("Authenticating demo user on Worker A and Worker B...")
        login_payload = {"email": "arjun@example.org", "password": "Resqsync#2026"}
        status_a, _, cookie_a = http_post_json(
            "http://127.0.0.1:8008/api/auth/login", login_payload
        )
        status_b, _, cookie_b = http_post_json(
            "http://127.0.0.1:8009/api/auth/login", login_payload
        )
        assert status_a == 200, "Worker A login failed"
        assert status_b == 200, "Worker B login failed"
        cookie_b_header = cookie_b.split(";")[0]

        # 1. Connect SSE to Worker B
        log("Connecting SSE client to Worker B (port 8009)...")
        req_b = urllib.request.Request(
            "http://127.0.0.1:8009/api/events",
            headers={"Cookie": cookie_b_header, "Accept": "text/event-stream"},
        )
        sse_conn_b = urllib.request.urlopen(req_b, timeout=10)

        # Read initial hello
        initial_revision = None
        for _ in range(10):
            line = sse_conn_b.readline().decode("utf-8").strip()
            if line.startswith("data:"):
                hello_data = json.loads(line[5:].strip())
                initial_revision = hello_data["revision"]
                break

        log(f"Worker B SSE connected! Initial revision: {initial_revision}")
        assert initial_revision is not None, (
            "Failed to read initial hello event from Worker B"
        )

        # 2. Trigger mutation on Worker A
        log("Emitting mutation on Worker A (port 8008: POST /api/messages)...")
        cookie_a_header = cookie_a.split(";")[0]
        status, msg_res, _ = http_post_json(
            "http://127.0.0.1:8008/api/messages",
            {
                "channel": "network",
                "text": "Worker A to Worker B cross-worker sync verification",
            },
            cookies=cookie_a_header,
        )
        assert status == 201, f"Failed to post message on Worker A: {msg_res}"
        log(f"Mutation committed on Worker A (message id: {msg_res.get('id')})")

        # 3. Read cross-worker change event on Worker B's SSE stream
        log("Awaiting live 'change' event on Worker B's SSE stream...")
        received_change = None
        for _ in range(10):
            line = sse_conn_b.readline().decode("utf-8").strip()
            if line.startswith("data:"):
                data = json.loads(line[5:].strip())
                if data.get("type") == "change":
                    received_change = data
                    break

        sse_conn_b.close()
        assert received_change is not None, (
            "Worker B did not receive change event from Worker A"
        )
        log(
            f"SUCCESS: Worker B received live event from Worker A! Revision: {received_change.get('revision')}"
        )
        assert received_change["revision"] > initial_revision

        # 4. Test dropped connection and Last-Event-ID reconnect on Worker B
        last_seen_revision = received_change["revision"]
        log(
            f"Simulating dropped connection. Disconnected at revision {last_seen_revision}."
        )

        # Advance state on Worker A while client is disconnected
        log(
            "Triggering second mutation on Worker A while Worker B client is disconnected..."
        )
        status, msg_res2, _ = http_post_json(
            "http://127.0.0.1:8008/api/messages",
            {"channel": "network", "text": "Mutation during disconnected window"},
            cookies=cookie_a_header,
        )
        assert status == 201
        log("Second mutation committed on Worker A.")

        # Reconnect to Worker B with Last-Event-ID header
        log(f"Reconnecting to Worker B with Last-Event-ID: {last_seen_revision}...")
        reconnect_req = urllib.request.Request(
            "http://127.0.0.1:8009/api/events",
            headers={
                "Cookie": cookie_b_header,
                "Accept": "text/event-stream",
                "Last-Event-ID": str(last_seen_revision),
            },
        )
        reconnect_conn = urllib.request.urlopen(reconnect_req, timeout=10)

        replayed_event = None
        for _ in range(15):
            line = reconnect_conn.readline().decode("utf-8").strip()
            if line.startswith("data:"):
                ev = json.loads(line[5:].strip())
                if (
                    ev.get("type") == "change"
                    and ev.get("revision") > last_seen_revision
                ):
                    replayed_event = ev
                    break

        reconnect_conn.close()
        assert replayed_event is not None, (
            "Worker B failed to replay missed event on reconnect"
        )
        log(
            f"SUCCESS: Worker B replayed missed mutation! Revision: {replayed_event.get('revision')}"
        )

        log("=================================================================")
        log("ALL SCALE-OUT LIVE UPDATE CHECKS PASSED SUCCESSFULLY!")
        log("1. Redis Pub/Sub propagated events across independent workers.")
        log("2. Cross-worker live delivery verified (Worker A -> Worker B).")
        log("3. SSE Last-Event-ID catch-up after dropped connection verified.")
        log("=================================================================")
        return 0

    finally:
        log("Cleaning up worker processes...")
        proc_a.terminate()
        proc_b.terminate()
        try:
            proc_a.wait(timeout=3)
        except Exception:
            proc_a.kill()
        try:
            proc_b.wait(timeout=3)
        except Exception:
            proc_b.kill()
        try:
            log_a.close()
            log_b.close()
        except Exception:
            pass
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass


if __name__ == "__main__":
    sys.exit(main())
