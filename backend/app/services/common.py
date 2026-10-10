from __future__ import annotations

import math
import secrets
import threading

from fastapi import Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import AuditLog, Meta, Notification, OutboxMessage, User
from app.security import Actor


def new_id(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(4).upper()}"


def js_round(value: float) -> int:
    """Math.round semantics (halves round up) so server scores match the numbers the interface has always shown."""
    return int(math.floor(value + 0.5))


def audit(db: Session, actor: Actor | None, action: str, detail: str = "") -> None:
    db.add(
        AuditLog(
            actor_id=actor.id if actor and actor.id else None,
            actor=actor.name if actor else "System",
            actor_role=actor.role if actor else "",
            action=action[:120],
            detail=detail,
        )
    )


def notify(db: Session, message: str) -> Notification:
    """Record an in-app notice and queue e-mail / SMS / push for users who opted in."""
    note = Notification(id=new_id("N"), text=message, channel="In-app")
    db.add(note)
    users = db.scalars(
        select(User).where(User.status == "active", (User.pref_email | User.pref_sms | User.pref_push))
    ).all()
    for u in users:
        if u.pref_email:
            db.add(
                OutboxMessage(user_id=u.id, channel="email", recipient=u.email, subject="ResQSync notice", body=message)
            )
        if u.pref_sms:
            db.add(OutboxMessage(user_id=u.id, channel="sms", recipient=u.phone or "", subject="", body=message))
        if u.pref_push:
            db.add(OutboxMessage(user_id=u.id, channel="push", recipient="", subject="", body=message))
    return note


def get_revision(db: Session) -> int:
    row = db.get(Meta, "revision")
    return row.value if row else 0


def commit(request: Request, db: Session) -> int:
    """Commit a write transaction, bump the change counter, tell connected browsers, and flush the outbox."""
    row = db.get(Meta, "revision")
    if row is None:
        db.add(Meta(key="revision", value=1))
    else:
        db.execute(update(Meta).where(Meta.key == "revision").values(value=Meta.value + 1))
    db.flush()
    revision = db.scalar(select(Meta.value).where(Meta.key == "revision"))
    pending = db.scalar(select(OutboxMessage.id).where(OutboxMessage.status == "queued").limit(1)) is not None
    db.commit()
    request.app.state.hub.publish({"type": "change", "revision": revision})
    if pending:
        worker = getattr(request.app.state, "outbox_worker", None)
        if worker:
            worker.trigger()
        else:
            delivery_svc = getattr(request.app.state, "delivery_service", None)
            from app.services.outbox_worker import process_outbox_batch

            threading.Thread(
                target=process_outbox_batch,
                args=(request.app.state.db, request.app.state.settings, delivery_svc),
                daemon=True,
            ).start()
    return revision


def deliver_outbox(database, settings: Settings, delivery_service=None) -> None:
    """Flush pending messages using multi-channel delivery worker."""
    from app.services.outbox_worker import process_outbox_batch

    process_outbox_batch(database, settings, delivery_service)
