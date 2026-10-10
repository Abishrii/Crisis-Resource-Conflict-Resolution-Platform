"""The help-request desk."""

from __future__ import annotations

import base64
import binascii
import re
import secrets

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import DomainError, NotFound
from app.models import Crisis, HelpRequest, Resource, User
from app.roles import can
from app.schemas import api as S
from app.security import actor_of, current_user, get_db, get_write_db, require
from app.services import help_requests as svc
from app.services import serializers
from app.services.common import commit
from app.services.image_sanitize import sanitize_image

router = APIRouter(prefix="/api", tags=["Help requests"])

_DATA_URL = re.compile(r"^data:(image/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$")
_MAGIC = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/gif": (b"GIF87a", b"GIF89a"),
    "image/webp": (b"RIFF",),
}
_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp"}


def _decode_photo(data_url: str, max_bytes: int) -> tuple[bytes, str]:
    m = _DATA_URL.match(data_url.strip())
    if not m:
        raise DomainError("The photo must be a JPEG, PNG, WebP or GIF image.")
    if len(m.group(2)) > max_bytes * 4 // 3 + 16:
        raise DomainError(f"The photo is too large (maximum {max_bytes // (1024 * 1024)} MB).", 413)
    try:
        raw = base64.b64decode(m.group(2), validate=False)
    except (binascii.Error, ValueError):
        raise DomainError("The photo could not be read.")
    mime = m.group(1)
    if len(raw) > max_bytes:
        raise DomainError(f"The photo is too large (maximum {max_bytes // (1024 * 1024)} MB).", 413)
    if not any(raw.startswith(sig) for sig in _MAGIC[mime]) or (mime == "image/webp" and raw[8:12] != b"WEBP"):
        raise DomainError("The photo content does not match its image type.")
    return raw, mime


def _maps(db: Session):
    return {r.id: r for r in db.scalars(select(Resource))}, {c.id: c for c in db.scalars(select(Crisis))}


def _out(db: Session, req: HelpRequest, user: User) -> dict:
    resources, crises = _maps(db)
    dup_map = {}
    if can(user.role, "request.view_all"):
        dups = svc.find_duplicates(db, req.phone, req.address, req.created_at, exclude_id=req.id)
        if dups:
            dup_map[req.code] = dups
    return serializers.request_json(req, resources, crises, user.id, dup_map)


@router.get("/desk")
def desk(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return serializers.desk_snapshot(db, user)


@router.get("/help-requests")
def list_requests(
    status: str | None = None,
    q: str | None = None,
    page: int | None = Query(None, ge=1),
    limit: int | None = Query(None, ge=1, le=1000),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    items = serializers.desk_snapshot(db, user)["requests"]
    if status:
        items = [r for r in items if r["status"] == status]
    if q:
        needle = q.lower()
        items = [
            r for r in items if needle in f"{r['id']} {r['name']} {r['phone']} {r['address']} {r['brief']}".lower()
        ]
    if page is None and limit is None:
        return items
    p = page or 1
    l = limit or 20
    total = len(items)
    offset = (p - 1) * l
    sliced = items[offset : offset + l]
    return {
        "items": sliced,
        "total": total,
        "page": p,
        "pageSize": l,
        "limit": l,
        "totalPages": (total + l - 1) // l if total > 0 else 1,
    }


@router.post("/help-requests", status_code=201)
def create(
    body: S.HelpRequestIn,
    request: Request,
    user: User = Depends(require("request.raise", write=True)),
    db: Session = Depends(get_write_db),
):
    settings = request.app.state.settings
    photo_file = photo_type = None
    if body.photo:
        limiter = request.app.state.limiter
        allowed, retry_after = limiter.is_allowed(f"upload:{user.id}", settings.rate_limit_upload, 3600)
        if not allowed:
            raise DomainError("Upload rate limit exceeded. Please try again later.", 429)
        raw, photo_type = _decode_photo(body.photo, settings.max_photo_bytes)
        raw = sanitize_image(raw, photo_type)
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        photo_file = f"req-{secrets.token_hex(16)}.{_EXT[photo_type]}"
        (settings.upload_dir / photo_file).write_bytes(raw)
    try:
        req = svc.create_request(
            db,
            actor_of(user),
            name=body.name,
            phone=body.phone,
            address=body.address,
            brief=body.brief,
            adults=body.adults,
            children=body.children,
            photo_file=photo_file,
            photo_type=photo_type,
        )
        commit(request, db)
    except Exception:
        if photo_file:
            (settings.upload_dir / photo_file).unlink(missing_ok=True)
        raise
    return _out(db, req, user)


@router.get("/help-requests/{code}")
def get_one(code: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    req = svc.get_request(db, code)
    svc.ensure_visible(req, actor_of(user))
    return _out(db, req, user)


@router.get("/help-requests/{code}/photo")
def photo(code: str, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    req = svc.get_request(db, code)
    svc.ensure_visible(req, actor_of(user))
    path = request.app.state.settings.upload_dir / (req.photo_file or "missing")
    if not req.photo_file or not path.is_file():
        raise NotFound("No photo was attached to that request.")
    return FileResponse(
        path,
        media_type=req.photo_type,
        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=3600"},
    )


@router.post("/help-requests/{code}/verify")
def verify(
    code: str,
    request: Request,
    body: S.VerifyIn | None = None,
    user: User = Depends(require("request.review", write=True)),
    db: Session = Depends(get_write_db),
):
    req = svc.verify(db, actor_of(user), code, body.crisis_id if body else None)
    commit(request, db)
    return _out(db, req, user)


@router.post("/help-requests/{code}/assign")
def assign(
    code: str,
    body: S.AssignRequestIn,
    request: Request,
    user: User = Depends(require("request.review", write=True)),
    db: Session = Depends(get_write_db),
):
    req = svc.assign(db, actor_of(user), code, body.resource_id)
    commit(request, db)
    return _out(db, req, user)


@router.post("/help-requests/{code}/dispatch")
def dispatch(
    code: str,
    request: Request,
    user: User = Depends(require("request.dispatch", write=True)),
    db: Session = Depends(get_write_db),
):
    req = svc.dispatch(db, actor_of(user), code)
    commit(request, db)
    return _out(db, req, user)


@router.post("/help-requests/{code}/resolve")
def resolve(
    code: str,
    request: Request,
    user: User = Depends(require("request.review", write=True)),
    db: Session = Depends(get_write_db),
):
    req = svc.resolve(db, actor_of(user), code)
    commit(request, db)
    return _out(db, req, user)


@router.post("/help-requests/{code}/update")
def add_update(
    code: str,
    body: S.HelpRequestUpdateIn,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_write_db),
):
    req = svc.add_update(db, actor_of(user), code, body.text)
    commit(request, db)
    return _out(db, req, user)


@router.post("/help-requests/{code}/cancel")
def cancel(
    code: str,
    body: S.HelpRequestCancelIn,
    request: Request,
    user: User = Depends(current_user),
    db: Session = Depends(get_write_db),
):
    req = svc.cancel_request(db, actor_of(user), code, body.reason)
    commit(request, db)
    return _out(db, req, user)


@router.post("/help-requests/{code}/reassign")
def reassign(
    code: str,
    body: S.HelpRequestReassignIn,
    request: Request,
    user: User = Depends(require("request.review", write=True)),
    db: Session = Depends(get_write_db),
):
    req = svc.reassign(db, actor_of(user), code, body.resource_id)
    commit(request, db)
    return _out(db, req, user)


@router.post("/help-requests/{code}/release-unit")
def release_unit(
    code: str,
    request: Request,
    user: User = Depends(require("request.review", write=True)),
    db: Session = Depends(get_write_db),
):
    req = svc.release_unit(db, actor_of(user), code)
    commit(request, db)
    return _out(db, req, user)
