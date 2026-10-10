"""The seven workspace modules: crises, resources, allocations/conflicts, people, collaboration, analytics, decision support."""

from __future__ import annotations

import csv
import io
import mimetypes
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.errors import DomainError, NotFound
from app.models import (
    Attachment,
    AuditLog,
    Crisis,
    Decision,
    HelpRequest,
    Message,
    Notification,
    NotificationRead,
    Resource,
    User,
)
from app.roles import ADMIN, can
from app.schemas import api as S
from app.security import (
    actor_of,
    current_user,
    get_db,
    get_write_db,
    hash_password,
    require,
    validate_password_strength,
)
from app.services import analytics as analytics_svc
from app.services import operations as ops
from app.services import reports, serializers, simulation
from app.services.antivirus import scan_bytes
from app.services.common import audit, commit, new_id, notify
from app.services.image_sanitize import sanitize_image
from app.services.seed import reset_demo

router = APIRouter(prefix="/api", tags=["Workspace"])

ALLOWED_UPLOADS = {"pdf", "csv", "txt", "json", "png", "jpg", "jpeg"}


def _csv_response(filename: str, headers: list[str], rows: list[list]) -> Response:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return Response(
        content=buf.getvalue().encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ------------------------------------------------------------------ snapshot
@router.get("/workspace")
def workspace(request: Request, user: User = Depends(require("view")), db: Session = Depends(get_db)):
    return serializers.workspace_snapshot(db, user, request.app.state.settings)


# ------------------------------------------------------------------ crises
@router.get("/crises")
def list_crises(
    status: str | None = None,
    category: str | None = None,
    q: str | None = None,
    page: int | None = Query(None, ge=1),
    limit: int | None = Query(None, ge=1, le=1000),
    user: User = Depends(require("view")),
    db: Session = Depends(get_db),
):
    query = select(Crisis).order_by(Crisis.created_at.desc())
    if status and status != "all":
        query = query.where(Crisis.status == status)
    if category and category != "all":
        query = query.where(Crisis.category == category)
    rows = db.scalars(query).all()
    if q:
        needle = q.lower()
        rows = [c for c in rows if needle in f"{c.title} {c.city} {c.region} {c.category}".lower()]
    items = [serializers.crisis_json(c) for c in rows]
    if page is None and limit is None:
        return items
    p = page or 1
    l = limit or 20
    total = len(items)
    offset = (p - 1) * l
    return {
        "items": items[offset : offset + l],
        "total": total,
        "page": p,
        "pageSize": l,
        "limit": l,
        "totalPages": (total + l - 1) // l if total > 0 else 1,
    }


@router.get("/crises/{crisis_id}")
def get_crisis(crisis_id: str, user: User = Depends(require("view")), db: Session = Depends(get_db)):
    crisis = ops.get_crisis(db, crisis_id)
    data = serializers.crisis_json(crisis, None)
    data["assigned"] = [
        {"resourceId": r.id, "resource": r.name, "unit": r.unit, "quantity": a.quantity}
        for r in db.scalars(select(Resource))
        for a in r.allocations
        if a.crisis_id == crisis.id
    ]
    return data


@router.post("/crises", status_code=201)
def create_crisis(
    body: S.CrisisIn,
    request: Request,
    user: User = Depends(require("crisis", write=True)),
    db: Session = Depends(get_write_db),
):
    crisis = ops.create_crisis(db, actor_of(user), **body.model_dump())
    commit(request, db)
    return serializers.crisis_json(crisis)


@router.patch("/crises/{crisis_id}")
def patch_crisis(
    crisis_id: str,
    body: S.CrisisPatchIn,
    request: Request,
    user: User = Depends(require("crisis", write=True)),
    db: Session = Depends(get_write_db),
):
    crisis = ops.update_crisis(db, actor_of(user), crisis_id, **body.model_dump())
    commit(request, db)
    return serializers.crisis_json(crisis)


# ------------------------------------------------------------------ resources
@router.get("/resources")
def list_resources(
    type: str | None = None,
    q: str | None = None,
    page: int | None = Query(None, ge=1),
    limit: int | None = Query(None, ge=1, le=1000),
    user: User = Depends(require("view")),
    db: Session = Depends(get_db),
):
    query = select(Resource).order_by(Resource.created_at, Resource.id)
    if type and type != "all":
        query = query.where(Resource.type == type)
    rows = db.scalars(query).all()
    if q:
        needle = q.lower()
        rows = [r for r in rows if needle in f"{r.name} {r.organization} {r.capability}".lower()]
    items = [serializers.resource_json(r) for r in rows]
    if page is None and limit is None:
        return items
    p = page or 1
    l = limit or 20
    total = len(items)
    offset = (p - 1) * l
    return {
        "items": items[offset : offset + l],
        "total": total,
        "page": p,
        "pageSize": l,
        "limit": l,
        "totalPages": (total + l - 1) // l if total > 0 else 1,
    }


@router.get("/resources/{resource_id}")
def get_resource(resource_id: str, user: User = Depends(require("view")), db: Session = Depends(get_db)):
    return serializers.resource_json(ops.get_resource(db, resource_id), None)


@router.post("/resources", status_code=201)
def create_resource(
    body: S.ResourceIn,
    request: Request,
    user: User = Depends(require("resource", write=True)),
    db: Session = Depends(get_write_db),
):
    resource = ops.create_resource(db, actor_of(user), **body.model_dump())
    commit(request, db)
    return serializers.resource_json(resource)


@router.patch("/resources/{resource_id}")
def patch_resource(
    resource_id: str,
    body: S.ResourcePatchIn,
    request: Request,
    user: User = Depends(require("resource", write=True)),
    db: Session = Depends(get_write_db),
):
    resource = ops.update_resource(
        db, actor_of(user), resource_id, total=body.total, name=body.name, capability=body.capability, cost=body.cost
    )
    commit(request, db)
    return serializers.resource_json(resource)


@router.post("/resources/{resource_id}/stock-movement")
def stock_movement(
    resource_id: str,
    body: S.StockMovementIn,
    request: Request,
    user: User = Depends(require("resource", write=True)),
    db: Session = Depends(get_write_db),
):
    resource = ops.record_stock_movement(
        db, actor_of(user), resource_id, body.movement_type, body.quantity, body.reason
    )
    commit(request, db)
    return serializers.resource_json(resource)


@router.post("/resources/{resource_id}/maintenance")
def toggle_maintenance(
    resource_id: str,
    request: Request,
    user: User = Depends(require("resource", write=True)),
    db: Session = Depends(get_write_db),
):
    resource = ops.set_maintenance(db, actor_of(user), resource_id)
    commit(request, db)
    message = (
        "Pool placed in maintenance; capacity unavailable."
        if resource.maintenance
        else "Maintenance cleared; pool returned to available inventory."
    )
    return {"maintenance": resource.maintenance, "message": message}


# ------------------------------------------------------------------ allocations & conflicts
@router.post("/allocations", status_code=201)
def create_allocation(
    body: S.AllocationIn,
    request: Request,
    user: User = Depends(require("allocate", write=True)),
    db: Session = Depends(get_write_db),
):
    if body.override and len(body.reason) < 8:
        raise DomainError("An override needs a recorded reason of at least 8 characters.")
    resource = ops.allocate(
        db,
        actor_of(user),
        resource_id=body.resource_id,
        crisis_id=body.crisis_id,
        quantity=body.quantity,
        reason=body.reason,
        override=body.override,
    )
    commit(request, db)
    return {
        "resourceId": resource.id,
        "available": resource.available,
        "message": "Assignment recorded. Availability, requests, and the incident timeline have been updated.",
    }


@router.post("/resources/{resource_id}/release")
def release_allocation(
    resource_id: str,
    body: S.ReleaseIn,
    request: Request,
    user: User = Depends(require("allocate", write=True)),
    db: Session = Depends(get_write_db),
):
    amount = ops.release(db, actor_of(user), resource_id, body.crisis_id)
    commit(request, db)
    return {"released": amount}


@router.post("/resources/{resource_id}/approve")
def approve_recommendation(
    resource_id: str,
    request: Request,
    user: User = Depends(require("approve", write=True)),
    db: Session = Depends(get_write_db),
):
    message = ops.approve_pool(db, actor_of(user), resource_id)
    commit(request, db)
    return {"message": message}


@router.get("/conflicts")
def conflicts(user: User = Depends(require("view")), db: Session = Depends(get_db)):
    out = []
    for r in db.scalars(select(Resource).order_by(Resource.created_at, Resource.id)):
        demand = ops.demand_total(db, r.id)
        if demand > r.available:
            out.append(
                {
                    "resourceId": r.id,
                    "resource": r.name,
                    "unit": r.unit,
                    "demand": demand,
                    "available": r.available,
                    "shortfall": demand - r.available,
                    "plan": serializers.plan_json(ops.recommendation(db, r)),
                }
            )
    return out


@router.post("/demands", status_code=201)
def create_demand(
    body: S.DemandIn,
    request: Request,
    user: User = Depends(require("allocate", write=True)),
    db: Session = Depends(get_write_db),
):
    demand = ops.add_demand(
        db,
        actor_of(user),
        resource_id=body.resource_id,
        crisis_id=body.crisis_id,
        quantity=body.quantity,
        reason=body.reason,
    )
    commit(request, db)
    return {"id": demand.id, "quantity": demand.quantity}


@router.post("/negotiations", status_code=201)
def create_negotiation(
    body: S.NegotiationIn,
    request: Request,
    user: User = Depends(require("allocate", write=True)),
    db: Session = Depends(get_write_db),
):
    item = ops.add_negotiation(db, actor_of(user), body.resource_id, body.proposal)
    commit(request, db)
    return {"id": item.id}


@router.post("/negotiations/{negotiation_id}/agree")
def agree_negotiation(
    negotiation_id: str,
    request: Request,
    user: User = Depends(require("approve", write=True)),
    db: Session = Depends(get_write_db),
):
    item = ops.agree_negotiation(db, actor_of(user), negotiation_id)
    commit(request, db)
    return {"id": item.id, "status": item.status}


@router.get("/decisions")
def decisions(user: User = Depends(require("view")), db: Session = Depends(get_db)):
    return [
        {"id": d.id, "at": serializers.iso(d.at), "actor": d.actor, "type": d.type, "text": d.text}
        for d in db.scalars(select(Decision).order_by(Decision.at.desc()).limit(200))
    ]


# ------------------------------------------------------------------ people
@router.get("/users")
def list_users(user: User = Depends(require("view")), db: Session = Depends(get_db)):
    return [serializers.user_json(u, user) for u in db.scalars(select(User).order_by(User.id))]


def _temp_password() -> str:
    return secrets.token_urlsafe(9) + "a1!"


@router.post("/users", status_code=201)
def create_user(
    body: S.UserCreateIn,
    request: Request,
    user: User = Depends(require("users", write=True)),
    db: Session = Depends(get_write_db),
):
    email = body.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise DomainError("An account already exists with that e-mail.", 409)
    generated = body.password is None
    password = body.password or _temp_password()
    problem = validate_password_strength(password, email)
    if problem:
        raise DomainError(problem, 422)
    new = User(
        name=body.name,
        email=email,
        organization=body.organization,
        role=body.role,
        password_hash=hash_password(password),
        must_change_password=True,
    )
    db.add(new)
    db.flush()
    audit(db, actor_of(user), "User account created", f"{new.name} / {new.organization} / {new.role}.")
    commit(request, db)
    return {"user": serializers.user_json(new, user), "temporaryPassword": password if generated else None}


@router.patch("/users/{user_id}")
def patch_user(
    user_id: int,
    body: S.UserPatchIn,
    request: Request,
    user: User = Depends(require("users", write=True)),
    db: Session = Depends(get_write_db),
):
    target = db.get(User, user_id)
    if target is None:
        raise NotFound("That user does not exist.")
    admins = db.scalar(select(func.count(User.id)).where(User.role == ADMIN, User.status == "active")) or 0
    losing_admin = (
        target.role == ADMIN
        and target.active
        and ((body.role is not None and body.role != ADMIN) or body.status == "disabled")
    )
    if losing_admin and admins <= 1:
        raise DomainError("At least one active admin must remain.", 409)
    if target.id == user.id and body.status == "disabled":
        raise DomainError("You cannot disable your own account.", 409)
    temp = None
    if body.role is not None and body.role != target.role:
        audit(db, actor_of(user), "User role changed", f"{target.name}: {target.role} -> {body.role}.")
        target.role = body.role
        target.token_version += 1
    if body.status is not None and body.status != target.status:
        target.status = body.status
        target.token_version += 1
        audit(db, actor_of(user), "User status changed", f"{target.name}: {body.status}.")
    if body.reset_password:
        temp = _temp_password()
        target.password_hash = hash_password(temp)
        target.must_change_password = True
        target.token_version += 1
        audit(db, actor_of(user), "User password reset", target.name)
    commit(request, db)
    return {"user": serializers.user_json(target, user), "temporaryPassword": temp}


@router.post("/users/{user_id}/anonymise")
def anonymise_user_endpoint(
    user_id: int,
    request: Request,
    user: User = Depends(require("users", write=True)),
    db: Session = Depends(get_write_db),
):
    target = db.get(User, user_id)
    if target is None:
        raise NotFound("That user does not exist.")
    from app.services.privacy import anonymise_user

    s = request.app.state.settings
    anonymise_user(db, actor_of(user), target, upload_dir=s.upload_dir)
    commit(request, db)
    return {"ok": True, "user": serializers.user_json(target, user)}


# ------------------------------------------------------------------ collaboration
def _valid_channel(db: Session, channel: str) -> None:
    if channel in ("network", "decisions"):
        return
    if db.get(Crisis, channel) is None:
        raise DomainError("That discussion thread does not exist.")


@router.get("/messages")
def list_messages(
    channel: str,
    q: str | None = None,
    page: int | None = Query(None, ge=1),
    limit: int | None = Query(None, ge=1, le=1000),
    user: User = Depends(require("view")),
    db: Session = Depends(get_db),
):
    query = select(Message).where(Message.channel == channel).order_by(Message.at, Message.id)
    rows = db.scalars(query).all()
    if q:
        needle = q.lower()
        rows = [m for m in rows if needle in f"{m.author} {m.text}".lower()]
    items = [
        {"id": m.id, "channel": m.channel, "author": m.author, "text": m.text, "at": serializers.iso(m.at)}
        for m in rows
    ]
    if page is None and limit is None:
        return items[:500]
    p = page or 1
    l = limit or 50
    total = len(items)
    offset = (p - 1) * l
    return {
        "items": items[offset : offset + l],
        "total": total,
        "page": p,
        "pageSize": l,
        "limit": l,
        "totalPages": (total + l - 1) // l if total > 0 else 1,
    }


@router.post("/messages", status_code=201)
def post_message(
    body: S.MessageIn,
    request: Request,
    user: User = Depends(require("message", write=True)),
    db: Session = Depends(get_write_db),
):
    _valid_channel(db, body.channel)
    msg = Message(id=new_id("M"), channel=body.channel, author_id=user.id, author=user.name, text=body.text)
    db.add(msg)
    crisis = db.get(Crisis, body.channel)
    if crisis:
        ops._crisis_event(db, crisis, user.name, "A comment was added to the incident thread.")
    label = (
        "network coordination"
        if body.channel == "network"
        else "decision discussion"
        if body.channel == "decisions"
        else (crisis.title if crisis else "the thread")
    )
    audit(db, actor_of(user), "Message posted", f"{body.channel}: {body.text[:100]}")
    notify(db, f"New comment in {label}.")
    commit(request, db)
    return {"id": msg.id}


@router.post("/notifications/read")
def mark_notifications_read(
    request: Request, user: User = Depends(require("view", write=True)), db: Session = Depends(get_write_db)
):
    already = set(db.scalars(select(NotificationRead.notification_id).where(NotificationRead.user_id == user.id)))
    for nid in db.scalars(select(Notification.id)):
        if nid not in already:
            db.add(NotificationRead(user_id=user.id, notification_id=nid))
    commit(request, db)
    return {"ok": True}


@router.post("/attachments", status_code=201)
async def upload_attachment(
    request: Request,
    channel: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(require("message", write=True)),
    db: Session = Depends(get_write_db),
):
    settings = request.app.state.settings
    limiter = request.app.state.limiter
    allowed, retry_after = limiter.is_allowed(f"upload:{user.id}", settings.rate_limit_upload, 3600)
    if not allowed:
        raise DomainError("Upload rate limit exceeded. Please try again later.", 429)
    _valid_channel(db, channel)
    name = Path(file.filename or "").name[:200]
    ext = name.lower().rsplit(".", 1)[-1] if "." in name else ""
    if ext not in ALLOWED_UPLOADS:
        raise DomainError("Choose a PDF, CSV, text, JSON, PNG or JPG file.")
    data = await file.read(settings.max_attachment_bytes + 1)
    if not data:
        raise DomainError("That file is empty.")
    if len(data) > settings.max_attachment_bytes:
        raise DomainError(f"Files can be at most {settings.max_attachment_bytes // (1024 * 1024)} MB.", 413)
    scan_bytes(data, settings)
    ctype = mimetypes.guess_type(name)[0] or "application/octet-stream"
    if ext in ("png", "jpg", "jpeg", "webp"):
        data = sanitize_image(data, ctype)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    storage = f"{secrets.token_hex(16)}.{ext}"
    (settings.upload_dir / storage).write_bytes(data)
    att = Attachment(
        id=new_id("F"),
        channel=channel,
        name=name,
        size=len(data),
        content_type=ctype,
        storage_name=storage,
        author_id=user.id,
        author=user.name,
    )
    db.add(att)
    audit(db, actor_of(user), "Document attached", f"{name} / {channel}.")
    try:
        commit(request, db)
    except Exception:
        (settings.upload_dir / storage).unlink(missing_ok=True)
        raise
    return {"id": att.id}


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: str, request: Request, user: User = Depends(require("view")), db: Session = Depends(get_db)
):
    att = db.get(Attachment, attachment_id)
    path = request.app.state.settings.upload_dir / (att.storage_name if att else "missing")
    if att is None or not path.is_file():
        raise NotFound("That file is not available.")
    return FileResponse(
        path,
        media_type=att.content_type,
        filename=att.name,
        content_disposition_type="attachment",
        headers={"X-Content-Type-Options": "nosniff"},
    )


# ------------------------------------------------------------------ analytics & reports
@router.get("/analytics")
def get_analytics(
    days: int = Query(30, ge=1, le=365), user: User = Depends(require("view")), db: Session = Depends(get_db)
):
    return analytics_svc.analytics(db, days)


@router.get("/reports/export")
def export_report(
    request: Request,
    format: str = Query(..., pattern="^(pdf|xml)$"),
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(require("view", write=True)),
    db: Session = Depends(get_write_db),
):
    sheets = reports.export_data(db, days)
    audit(db, actor_of(user), "Report exported", f"{format.upper()} / last {days} days.")
    commit(request, db)
    if format == "pdf":
        return Response(
            reports.build_pdf(db, days, sheets),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="ResQSync-report.pdf"'},
        )
    return Response(
        reports.build_xml(sheets),
        media_type="application/vnd.ms-excel",
        headers={"Content-Disposition": 'attachment; filename="ResQSync-report.xml"'},
    )


# ------------------------------------------------------------------ decision support
@router.post("/simulations/run")
def run_simulation(body: S.SimulationIn, user: User = Depends(require("view")), db: Session = Depends(get_db)):
    return simulation.run(db, body.resource_id, body.capacity, body.cost, body.weight)


@router.post("/simulations", status_code=201)
def save_simulation(
    body: S.SimulationIn,
    request: Request,
    user: User = Depends(require("save", write=True)),
    db: Session = Depends(get_write_db),
):
    sim = simulation.save(db, actor_of(user), body.resource_id, body.capacity, body.cost, body.weight)
    commit(request, db)
    return serializers.simulation_json(sim)


@router.get("/simulations")
def list_simulations(user: User = Depends(require("view")), db: Session = Depends(get_db)):
    from app.models import Simulation

    return [
        serializers.simulation_json(s) for s in db.scalars(select(Simulation).order_by(Simulation.at.desc()).limit(20))
    ]


@router.get("/audit")
def get_audit(
    q: str | None = None,
    action: str | None = None,
    page: int | None = Query(None, ge=1),
    limit: int = Query(100, ge=1, le=1000),
    user: User = Depends(require("view")),
    db: Session = Depends(get_db),
):
    query = select(AuditLog).order_by(AuditLog.at.desc(), AuditLog.id.desc())
    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))
    rows = db.scalars(query).all()
    if q:
        needle = q.lower()
        rows = [a for a in rows if needle in f"{a.actor} {a.actor_role} {a.action} {a.detail}".lower()]
    items = [serializers.audit_json(a) for a in rows]
    if page is None:
        return items[:limit]
    p = page or 1
    total = len(items)
    offset = (p - 1) * limit
    return {
        "items": items[offset : offset + limit],
        "total": total,
        "page": p,
        "pageSize": limit,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit if total > 0 else 1,
    }


# ------------------------------------------------------------------ exports
@router.get("/exports/crises.csv")
def export_crises_csv(user: User = Depends(require("view")), db: Session = Depends(get_db)):
    rows = db.scalars(select(Crisis).order_by(Crisis.created_at.desc())).all()
    headers = [
        "id",
        "title",
        "city",
        "region",
        "category",
        "severity",
        "status",
        "population",
        "lat",
        "lng",
        "created_at",
    ]
    data = [
        [
            c.id,
            c.title,
            c.city,
            c.region,
            c.category,
            c.severity,
            c.status,
            c.population,
            c.lat,
            c.lng,
            serializers.iso(c.created_at),
        ]
        for c in rows
    ]
    return _csv_response("crises.csv", headers, data)


@router.get("/exports/resources.csv")
def export_resources_csv(user: User = Depends(require("view")), db: Session = Depends(get_db)):
    rows = db.scalars(select(Resource).order_by(Resource.created_at, Resource.id)).all()
    headers = [
        "id",
        "name",
        "type",
        "total",
        "available",
        "used",
        "unit",
        "organization",
        "cost",
        "maintenance",
        "created_at",
    ]
    data = [
        [
            r.id,
            r.name,
            r.type,
            r.total,
            r.available,
            r.used,
            r.unit,
            r.organization,
            r.cost,
            r.maintenance,
            serializers.iso(r.created_at),
        ]
        for r in rows
    ]
    return _csv_response("resources.csv", headers, data)


@router.get("/exports/help-requests.csv")
def export_help_requests_csv(user: User = Depends(current_user), db: Session = Depends(get_db)):
    query = select(HelpRequest).order_by(HelpRequest.created_at.desc(), HelpRequest.id.desc())
    if not can(user.role, "request.view_all"):
        query = query.where(HelpRequest.owner_id == user.id)
    rows = db.scalars(query).all()
    mask = user.role != ADMIN
    headers = [
        "id",
        "name",
        "phone",
        "address",
        "brief",
        "adults",
        "children",
        "status",
        "resource_id",
        "crisis_id",
        "created_at",
    ]
    data = []
    for r in rows:
        phone = r.phone
        if mask and len(phone) >= 7:
            phone = phone[:3] + "****" + phone[-4:]
        elif mask:
            phone = "***"
        data.append(
            [
                r.code,
                r.name,
                phone,
                r.address,
                r.brief,
                r.adults,
                r.children,
                r.status,
                r.resource_id or "",
                r.crisis_id or "",
                serializers.iso(r.created_at),
            ]
        )
    return _csv_response("help_requests.csv", headers, data)


@router.get("/exports/audit.csv")
def export_audit_csv(user: User = Depends(require("users")), db: Session = Depends(get_db)):
    rows = db.scalars(select(AuditLog).order_by(AuditLog.at.desc(), AuditLog.id.desc()).limit(5000)).all()
    headers = ["id", "timestamp", "actor", "actor_role", "action", "detail"]
    data = [[a.id, serializers.iso(a.at), a.actor, a.actor_role, a.action, a.detail] for a in rows]
    return _csv_response("audit.csv", headers, data)


# ------------------------------------------------------------------ admin
@router.post("/admin/reset-demo")
def admin_reset(
    request: Request, user: User = Depends(require("users", write=True)), db: Session = Depends(get_write_db)
):
    if not request.app.state.settings.allow_demo_reset:
        raise HTTPException(403, "Resetting data is disabled on this deployment.")
    reset_demo(db)
    audit(db, actor_of(user), "Demo data reset", "Training dataset restored.")
    commit(request, db)
    return {"ok": True}


@router.post("/admin/privacy/retention-run")
def admin_retention_run(
    request: Request,
    body: S.RetentionRunIn | None = None,
    user: User = Depends(require("users", write=True)),
    db: Session = Depends(get_write_db),
):
    s = request.app.state.settings
    days = body.days if (body and body.days is not None) else s.data_retention_days
    if days <= 0:
        raise HTTPException(400, "Retention days must be greater than 0 to execute retention pass.")
    from app.services.privacy import run_retention_cleanup

    result = run_retention_cleanup(db, days, upload_dir=s.upload_dir, actor_name=user.name)
    commit(request, db)
    return result


@router.get("/privacy/policy")
def privacy_policy():
    from app.services.privacy import get_privacy_notice

    return get_privacy_notice()
