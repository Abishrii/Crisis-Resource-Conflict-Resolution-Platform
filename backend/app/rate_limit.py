"""Rate limiting with multi-worker support.

When REDIS_URL is configured, rate limits are coordinated across multiple uvicorn workers
via Redis keys with TTLs. When REDIS_URL is not set, rate limiting falls back to an
in-memory thread-safe sliding window per worker process.
"""

from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict, deque
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass

log = logging.getLogger("resqsync.rate_limit")


class RateLimiter:
    """Sliding-window rate limiter with Redis backend and in-memory fallback."""

    def __init__(self, redis_url: str = "") -> None:
        self.redis_url = redis_url
        self._redis_client = None
        self._lock = threading.Lock()
        self._memory_store: dict[str, deque[float]] = defaultdict(deque)

        if redis_url:
            try:
                import redis

                self._redis_client = redis.from_url(redis_url, decode_responses=True, socket_timeout=2.0)
                self._redis_client.ping()
                log.info("Rate limiter connected to Redis: %s", redis_url)
            except Exception as e:
                log.warning(
                    "Could not connect to Redis at %s (%s). Falling back to in-memory rate limiting.", redis_url, e
                )
                self._redis_client = None

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        """Check if request is allowed. Returns (allowed, retry_after_seconds)."""
        if self._redis_client:
            try:
                now = time.time()
                redis_key = f"rl:{key}"
                pipe = self._redis_client.pipeline()
                pipe.zremrangebyscore(redis_key, 0, now - window_seconds)
                pipe.zcard(redis_key)
                pipe.zadd(redis_key, {str(now): now})
                pipe.expire(redis_key, window_seconds + 5)
                results = pipe.execute()
                current_count = results[1]

                if current_count >= max_requests:
                    # Remove the tentatively added element
                    self._redis_client.zrem(redis_key, str(now))
                    return False, window_seconds
                return True, 0
            except Exception as e:
                log.error("Redis rate limit error: %s. Falling back to memory.", e)

        # In-memory sliding window fallback (per-worker)
        now = time.monotonic()
        with self._lock:
            q = self._memory_store[key]
            while q and now - q[0] > window_seconds:
                q.popleft()
            if len(q) >= max_requests:
                oldest = q[0]
                retry_after = max(1, int(window_seconds - (now - oldest)))
                return False, retry_after
            q.append(now)
            return True, 0

    def is_blocked(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check whether a key has already reached its limit without recording a new attempt."""
        if self._redis_client:
            try:
                now = time.time()
                redis_key = f"rl:{key}"
                pipe = self._redis_client.pipeline()
                pipe.zremrangebyscore(redis_key, 0, now - window_seconds)
                pipe.zcard(redis_key)
                results = pipe.execute()
                return results[1] >= max_requests
            except Exception as e:
                log.error("Redis rate limit error: %s. Falling back to memory.", e)

        now = time.monotonic()
        with self._lock:
            q = self._memory_store[key]
            while q and now - q[0] > window_seconds:
                q.popleft()
            return len(q) >= max_requests

    def reset(self, key: str) -> None:
        """Reset a rate limit key (e.g. for testing)."""
        with self._lock:
            self._memory_store.pop(key, None)
        if self._redis_client:
            try:
                self._redis_client.delete(f"rl:{key}")
            except Exception:
                pass
