from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.models import User
from app.security import current_user, get_db
from app.services.common import get_revision

router = APIRouter(prefix="/api", tags=["Live updates"])


@router.get("/events")
async def events(
    request: Request,
    last_event_id: int | None = None,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Server-Sent Events: a small 'change' message with the new revision whenever any user commits a change.

    Supports Last-Event-ID header and query param for reconnect catch-up.
    """
    # 1. Resolve reconnect Last-Event-ID from header or query param
    header_last_id = request.headers.get("last-event-id")
    effective_last_id = last_event_id
    if effective_last_id is None and header_last_id is not None:
        try:
            effective_last_id = int(header_last_id.strip())
        except ValueError:
            effective_last_id = None

    revision = get_revision(db)
    db.close()  # do not hold a database connection for the life of the stream

    hub = request.app.state.hub
    sub = hub.subscribe()
    queue = sub[1]

    async def stream():
        try:
            yield "retry: 2000\n"
            yield f"id: {revision}\nevent: hello\ndata: {json.dumps({'revision': revision})}\n\n"

            # 2. Replay missed events if client reconnected with an older revision ID
            if effective_last_id is not None and effective_last_id < revision:
                missed = hub.get_events_since(effective_last_id)
                if missed:
                    for ev in missed:
                        rev = ev.get("revision", revision)
                        yield f"id: {rev}\nevent: change\ndata: {json.dumps(ev)}\n\n"
                else:
                    # Gapped revision older than history window: trigger direct catch-up sync
                    yield f"id: {revision}\nevent: change\ndata: {json.dumps({'revision': revision, 'catchup': True})}\n\n"

            # 3. Stream ongoing live events
            while not await request.is_disconnected():
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=15)
                    rev = message.get("revision", revision)
                    yield f"id: {rev}\nevent: change\ndata: {json.dumps(message)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            hub.unsubscribe(sub)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
