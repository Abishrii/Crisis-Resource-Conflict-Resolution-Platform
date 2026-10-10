"""Turn ORM rows into the JSON shapes the browser interface renders."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import iso
from app.models import (
    Attachment,
    AuditLog,
    Crisis,
    Decision,
    Demand,
    HelpRequest,
    Message,
    Negotiation,
    Notification,
    NotificationRead,
    Resource,
    Simulation,
    User,
)
from app.roles import ADMIN, ROLE_LABELS, can
from app.services.analytics import metrics
from app.services.common import get_revision
from app.services.operations import open_demands, recommendation


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    return f"{local[:1]}***@{domain}" if domain else "***"


def user_json(u: User, viewer: User | None = None, full: bool = False) -> dict:
    reveal = full or viewer is None or viewer.id == u.id or viewer.role == ADMIN
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email if reveal else mask_email(u.email),
        "organization": u.organization,
        "role": u.role,
        "roleLabel": ROLE_LABELS.get(u.role, u.role),
        "status": "Active" if u.active else "Disabled",
        "createdAt": iso(u.created_at),
        "lastLoginAt": iso(u.last_login_at),
    }


def me_json(u: User) -> dict:
    data = user_json(u, full=True)
    data["preferences"] = {"email": u.pref_email, "sms": u.pref_sms, "push": u.pref_push}
    data["mustChangePassword"] = u.must_change_password
    data["phone"] = u.phone
    data["phoneVerified"] = u.phone_verified
    data["pushConfigured"] = bool(u.push_subscription)
    return data


def crisis_json(c: Crisis, timeline_limit: int | None = 50) -> dict:
    events = c.events if timeline_limit is None else c.events[:timeline_limit]
    return {
        "id": c.id,
        "title": c.title,
        "city": c.city,
        "region": c.region,
        "lat": c.lat,
        "lng": c.lng,
        "category": c.category,
        "severity": c.severity,
        "status": c.status,
        "population": c.population,
        "responseMinutes": c.response_minutes,
        "createdAt": iso(c.created_at),
        "timeline": [{"at": iso(e.at), "text": e.text, "actor": e.actor} for e in events],
    }


STAGING_DEPOTS = {
    "Western Response Collective": {"city": "Mumbai", "lat": 19.076, "lng": 72.8777},
    "Eastern Relief Network": {"city": "Guwahati", "lat": 26.1445, "lng": 91.7362},
    "Southern Response Collective": {"city": "Bengaluru", "lat": 12.9716, "lng": 77.5946},
    "Regional Trauma Consortium": {"city": "New Delhi", "lat": 28.6139, "lng": 77.2090},
}


def resource_json(r: Resource, history_limit: int | None = 50) -> dict:
    history = [e for e in r.events if e.kind == "history"]
    maintenance = [e for e in r.events if e.kind == "maintenance"]
    if history_limit is not None:
        history, maintenance = history[:history_limit], maintenance[:history_limit]
    staging = STAGING_DEPOTS.get(r.organization, {"city": "Staging Depot", "lat": 20.5937, "lng": 78.9629})
    low_stock = bool(r.available <= max(2, int(r.total * 0.25)) and not r.maintenance)
    return {
        "id": r.id,
        "name": r.name,
        "type": r.type,
        "total": r.total,
        "unit": r.unit,
        "organization": r.organization,
        "capability": r.capability,
        "cost": r.cost,
        "maintenance": r.maintenance,
        "used": r.used,
        "available": r.available,
        "lowStock": low_stock,
        "stagingPoint": staging,
        "allocations": [
            {
                "crisisId": a.crisis_id,
                "requestId": f"RSQ-{a.help_request_id:04d}" if a.help_request_id else None,
                "quantity": a.quantity,
                "at": iso(a.at),
                "actor": a.actor,
            }
            for a in r.allocations
        ],
        "history": [{"at": iso(e.at), "text": e.text, "actor": e.actor} for e in history],
        "maintenanceLog": [{"at": iso(e.at), "text": e.text, "actor": e.actor} for e in maintenance],
    }


def plan_json(items) -> list[dict]:
    return [
        {
            "id": i.demand_id,
            "resourceId": i.resource_id,
            "crisisId": i.crisis.id,
            "quantity": i.quantity,
            "score": i.score,
            "allocation": i.allocation,
            "crisis": {"id": i.crisis.id, "title": i.crisis.title, "city": i.crisis.city},
        }
        for i in items
    ]


def compute_duplicates_map(requests: list[HelpRequest]) -> dict[str, list[str]]:
    dup_map: dict[str, list[str]] = {}
    for i, r1 in enumerate(requests):
        for r2 in requests[i + 1 :]:
            diff = abs((r1.created_at - r2.created_at).total_seconds())
            if diff <= 3600:
                if (r1.phone and r1.phone == r2.phone) or (r1.address.strip().lower() == r2.address.strip().lower()):
                    dup_map.setdefault(r1.code, []).append(r2.code)
                    dup_map.setdefault(r2.code, []).append(r1.code)
    return dup_map


def request_json(
    req: HelpRequest,
    resources: dict[str, Resource] | None = None,
    crises: dict[str, Crisis] | None = None,
    viewer_id: int | None = None,
    duplicates: dict[str, list[str]] | None = None,
) -> dict:
    res = (resources or {}).get(req.resource_id) if req.resource_id else None
    cri = (crises or {}).get(req.crisis_id) if req.crisis_id else None
    dup_list = (duplicates or {}).get(req.code, [])
    return {
        "id": req.code,
        "name": req.name,
        "address": req.address,
        "phone": req.phone,
        "brief": req.brief,
        "adults": req.adults,
        "children": req.children,
        "photo": f"/api/help-requests/{req.code}/photo" if req.photo_file else None,
        "status": req.status,
        "createdAt": iso(req.created_at),
        "resource": res.name if res else None,
        "resourceId": req.resource_id,
        "crisisId": req.crisis_id,
        "crisisTitle": cri.title if cri else None,
        "mine": viewer_id is not None and req.owner_id == viewer_id,
        "duplicateWarning": bool(dup_list),
        "duplicateCodes": dup_list,
        "history": [{"at": iso(e.at), "label": e.label} for e in req.events],
    }


def workspace_snapshot(db: Session, user: User, settings: Settings) -> dict:
    crises = list(db.scalars(select(Crisis).order_by(Crisis.created_at.desc(), Crisis.id)))
    resources = list(db.scalars(select(Resource).order_by(Resource.created_at, Resource.id)))
    demands = db.execute(select(Demand).order_by(Demand.created_at, Demand.id)).scalars().all()
    read_ids = set(db.scalars(select(NotificationRead.notification_id).where(NotificationRead.user_id == user.id)))
    notes = list(db.scalars(select(Notification).order_by(Notification.at.desc()).limit(80)))
    plans = {}
    for r in resources:
        if sum(d.quantity for d, _ in open_demands(db, r.id)) > r.available:
            plans[r.id] = plan_json(recommendation(db, r))
    messages = list(db.scalars(select(Message).order_by(Message.at.desc(), Message.id).limit(500)))[::-1]
    return {
        "version": 4,
        "revision": get_revision(db),
        "me": me_json(user),
        "config": {
            "allowDemoReset": settings.allow_demo_reset,
            "emailDelivery": settings.email_enabled,
            "smsDelivery": settings.sms_enabled,
            "pushDelivery": settings.push_enabled,
            "maxAttachmentBytes": settings.max_attachment_bytes,
            "dataRetentionDays": settings.data_retention_days,
        },
        "crises": [crisis_json(c) for c in crises],
        "resources": [resource_json(r) for r in resources],
        "requests": [
            {"id": d.id, "resourceId": d.resource_id, "crisisId": d.crisis_id, "quantity": d.quantity} for d in demands
        ],
        "users": [user_json(u, user) for u in db.scalars(select(User).order_by(User.id))],
        "messages": [
            {"id": m.id, "channel": m.channel, "author": m.author, "text": m.text, "at": iso(m.at)} for m in messages
        ],
        "notifications": [
            {"id": n.id, "text": n.text, "at": iso(n.at), "read": n.id in read_ids, "channel": n.channel} for n in notes
        ],
        "attachments": [
            {
                "id": a.id,
                "name": a.name,
                "size": a.size,
                "type": a.content_type,
                "at": iso(a.at),
                "author": a.author,
                "channel": a.channel,
            }
            for a in db.scalars(select(Attachment).order_by(Attachment.at))
        ],
        "decisions": [
            {"id": d.id, "at": iso(d.at), "actor": d.actor, "type": d.type, "text": d.text}
            for d in db.scalars(select(Decision).order_by(Decision.at.desc()).limit(50))
        ],
        "negotiations": [
            {
                "id": n.id,
                "resourceId": n.resource_id,
                "proposal": n.proposal,
                "at": iso(n.at),
                "actor": n.actor,
                "status": n.status,
                "agreedBy": n.agreed_by,
            }
            for n in db.scalars(select(Negotiation).order_by(Negotiation.at.desc()).limit(50))
        ],
        "simulations": [
            simulation_json(s) for s in db.scalars(select(Simulation).order_by(Simulation.at.desc()).limit(20))
        ],
        "preferences": {"email": user.pref_email, "sms": user.pref_sms, "push": user.pref_push},
        "audit": [
            audit_json(a)
            for a in db.scalars(select(AuditLog).order_by(AuditLog.at.desc(), AuditLog.id.desc()).limit(200))
        ],
        "plans": plans,
        "metrics": metrics(db),
    }


def simulation_json(s: Simulation) -> dict:
    return {
        "id": s.id,
        "at": iso(s.at),
        "actor": s.actor,
        "resourceId": s.resource_id,
        "resourceName": s.resource_name,
        "capacity": s.capacity,
        "cost": s.cost,
        "weight": s.weight,
        "demand": s.demand,
        "covered": s.covered,
        "rows": s.rows,
    }


def audit_json(a: AuditLog) -> dict:
    return {"id": a.id, "at": iso(a.at), "actor": a.actor, "role": a.actor_role, "action": a.action, "detail": a.detail}


def desk_snapshot(db: Session, user: User) -> dict:
    query = select(HelpRequest).order_by(HelpRequest.created_at.desc(), HelpRequest.id.desc())
    if not can(user.role, "request.view_all"):
        query = query.where(HelpRequest.owner_id == user.id)
    requests = list(db.scalars(query))
    resources = list(db.scalars(select(Resource).order_by(Resource.created_at, Resource.id)))
    crises = {c.id: c for c in db.scalars(select(Crisis))}
    by_id = {r.id: r for r in resources}
    staff = can(user.role, "request.view_all")
    dup_map = compute_duplicates_map(requests) if staff else {}
    return {
        "revision": get_revision(db),
        "requests": [request_json(r, by_id, crises, user.id, dup_map) for r in requests],
        "resources": [
            {
                "id": r.id,
                "name": r.name,
                "type": r.type,
                "total": r.total,
                "assigned": r.used,
                "available": r.available,
                "maintenance": r.maintenance,
            }
            for r in resources
        ]
        if staff
        else [],
        "incidents": [{"id": c.id, "title": c.title, "city": c.city} for c in crises.values() if c.status != "resolved"]
        if staff
        else [],
        "audit": [
            {"at": iso(a.at), "actor": a.actor, "action": a.action + (f" — {a.detail}" if a.detail else "")}
            for a in db.scalars(select(AuditLog).order_by(AuditLog.at.desc(), AuditLog.id.desc()).limit(200))
        ]
        if user.role == ADMIN
        else [],
    }
