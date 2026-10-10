"""Background outbox worker with retries, exponential back-off, and provider routing."""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlalchemy import or_, select

from app.models import OutboxMessage, User
from app.services.delivery import DeliveryService, NotConfiguredError

if TYPE_CHECKING:
    from app.config import Settings
    from app.database import Database

log = logging.getLogger("resqsync.outbox_worker")


def process_outbox_batch(
    database: Database,
    settings: Settings,
    delivery_service: DeliveryService | None = None,
    limit: int = 50,
) -> int:
    """Process a batch of queued outbox messages with retries and exponential back-off."""
    svc = delivery_service or DeliveryService()
    session = database.write_session()
    now = datetime.now(timezone.utc)
    processed = 0

    try:
        stmt = (
            select(OutboxMessage)
            .where(
                OutboxMessage.status == "queued",
                or_(
                    OutboxMessage.next_attempt_at.is_(None),
                    OutboxMessage.next_attempt_at <= now,
                ),
            )
            .order_by(OutboxMessage.id)
            .limit(limit)
        )
        messages = session.scalars(stmt).all()
        if not messages:
            return 0

        for msg in messages:
            processed += 1
            user = session.get(User, msg.user_id) if msg.user_id else None

            # Channel 1: Email
            if msg.channel == "email":
                try:
                    svc.send_email(msg.recipient, msg.subject, msg.body, settings)
                    msg.status = "sent"
                    msg.delivered_at = datetime.now(timezone.utc)
                    msg.error = ""
                except NotConfiguredError as exc:
                    msg.status = "not_configured"
                    msg.error = str(exc)
                except Exception as exc:
                    _handle_retry_failure(msg, exc)

            # Channel 2: SMS (enforce verified phone check)
            elif msg.channel == "sms":
                is_otp = "verification code" in msg.body.lower() or "otp" in msg.body.lower()
                if user and not user.phone_verified and not is_otp:
                    msg.status = "failed"
                    msg.error = "SMS delivery blocked: user phone number is not verified."
                    continue

                try:
                    svc.send_sms(msg.recipient, msg.body, settings)
                    msg.status = "sent"
                    msg.delivered_at = datetime.now(timezone.utc)
                    msg.error = ""
                except NotConfiguredError as exc:
                    msg.status = "not_configured"
                    msg.error = str(exc)
                except Exception as exc:
                    _handle_retry_failure(msg, exc)

            # Channel 3: Web Push
            elif msg.channel == "push":
                sub_json = user.push_subscription if user else msg.recipient
                try:
                    svc.send_push(sub_json or "", msg.subject, msg.body, settings)
                    msg.status = "sent"
                    msg.delivered_at = datetime.now(timezone.utc)
                    msg.error = ""
                except NotConfiguredError as exc:
                    msg.status = "not_configured"
                    msg.error = str(exc)
                except Exception as exc:
                    _handle_retry_failure(msg, exc)

            else:
                msg.status = "failed"
                msg.error = f"Unsupported notification channel: {msg.channel}"

        session.commit()
    except Exception as exc:
        session.rollback()
        log.error("Outbox batch processing error: %s", exc)
    finally:
        session.close()

    return processed


def _handle_retry_failure(msg: OutboxMessage, exc: Exception) -> None:
    """Apply exponential back-off or mark as failed if max_attempts exceeded."""
    msg.attempts += 1
    if msg.attempts >= msg.max_attempts:
        msg.status = "failed"
        msg.error = f"Exceeded max attempts ({msg.max_attempts}): {exc}"
        log.warning("Outbox message %s permanently failed: %s", msg.id, exc)
    else:
        backoff_seconds = (2**msg.attempts) * 5
        msg.status = "queued"
        msg.next_attempt_at = datetime.now(timezone.utc) + timedelta(seconds=backoff_seconds)
        msg.error = f"Attempt {msg.attempts} failed: {exc}"
        log.info("Outbox message %s queued for retry in %ss", msg.id, backoff_seconds)


class OutboxWorker:
    """Background worker daemon thread that drains the outbox queue."""

    def __init__(self, database: Database, settings: Settings, delivery_service: DeliveryService | None = None) -> None:
        self.database = database
        self.settings = settings
        self.delivery_service = delivery_service or DeliveryService()
        self._stop_event = threading.Event()
        self._wake_event = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, name="resqsync-outbox-worker", daemon=True)
        self._thread.start()
        log.info("Outbox worker started.")

    def stop(self) -> None:
        self._stop_event.set()
        self._wake_event.set()
        if self._thread:
            self._thread.join(timeout=3.0)
            log.info("Outbox worker stopped.")

    def trigger(self) -> None:
        """Wake up worker immediately to process new messages."""
        self._wake_event.set()

    def _run(self) -> None:
        interval = max(1, self.settings.outbox_worker_interval_seconds)
        while not self._stop_event.is_set():
            try:
                process_outbox_batch(self.database, self.settings, self.delivery_service)
            except Exception as exc:
                log.error("Error in outbox worker loop: %s", exc)
            self._wake_event.wait(timeout=interval)
            self._wake_event.clear()
