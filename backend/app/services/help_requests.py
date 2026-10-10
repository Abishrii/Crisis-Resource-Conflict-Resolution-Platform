"""The help-request desk: opened -> verified -> assigned -> enroute -> resolved."""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import utcnow
from app.errors import DomainError, NotFound
from app.models import Allocation, HelpRequest, HelpRequestEvent, Resource
from app.roles import can
from app.security import Actor
from app.services.common import audit, notify
from app.services.operations import get_crisis, get_resource


def _event(db: Session, req: HelpRequest, label: str, actor: Actor | None) -> None:
    db.add(HelpRequestEvent(request_id=req.id, label=label, actor=actor.name if actor else "", at=utcnow()))
    db.flush()
    db.refresh(req, ["events"])


def get_request(db: Session, code: str, lock: bool = False) -> HelpRequest:
    code = (code or "").upper()
    if not code.startswith("RSQ-") or not code[4:].isdigit():
        raise NotFound("That request does not exist.")
    req = db.scalar(
        select(HelpRequest).where(HelpRequest.seq == int(code[4:])).with_for_update()
        if lock
        else select(HelpRequest).where(HelpRequest.seq == int(code[4:]))
    )
    if req is None:
        raise NotFound("That request does not exist.")
    return req


def ensure_visible(req: HelpRequest, actor: Actor) -> None:
    if can(actor.role, "request.view_all"):
        return
    if req.owner_id is not None and req.owner_id == actor.id:
        return
    raise NotFound("That request does not exist.")


def create_request(
    db: Session, actor: Actor, *, name, phone, address, brief, adults, children, photo_file=None, photo_type=None
) -> HelpRequest:
    for attempt in range(5):
        try:
            with db.begin_nested():
                seq = (db.scalar(select(func.max(HelpRequest.seq))) or 0) + 1
                req = HelpRequest(
                    seq=seq,
                    owner_id=actor.id,
                    name=name,
                    phone=phone,
                    address=address,
                    brief=brief,
                    adults=adults,
                    children=children,
                    photo_file=photo_file,
                    photo_type=photo_type,
                    status="opened",
                )
                db.add(req)
                db.flush()
            break
        except IntegrityError:
            if attempt == 4:
                raise DomainError("Could not allocate a request number. Try again.", 503)
    _event(db, req, "Request opened", actor)
    audit(db, actor, f"Raised {req.code}", f"{brief[:120]} ({address})")
    notify(db, f"New help request {req.code}: {brief[:90]}")
    return req


def verify(db: Session, actor: Actor, code: str, crisis_id: str | None) -> HelpRequest:
    req = get_request(db, code, lock=True)
    if req.status != "opened":
        raise DomainError("That request is not awaiting verification.", 409)
    label = "Verified by crisis manager"
    if crisis_id:
        crisis = get_crisis(db, crisis_id)
        if crisis.status == "resolved":
            raise DomainError("Link the request to an open incident.", 409)
        req.crisis_id = crisis.id
        label += f" · linked to {crisis.title}"
        from app.services.operations import _crisis_event

        _crisis_event(db, crisis, actor.name, f"Help request {req.code} verified and linked.")
    req.status = "verified"
    _event(db, req, label, actor)
    audit(db, actor, f"Verified {req.code}", label)
    return req


def assign(db: Session, actor: Actor, code: str, resource_id: str) -> HelpRequest:
    req = get_request(db, code, lock=True)
    if req.status != "verified":
        raise DomainError("Verify the request before assigning a resource.", 409)
    resource = get_resource(db, resource_id, lock=True)
    if resource.maintenance or resource.available < 1:
        raise DomainError("No available capacity in that pool.", 409)
    resource.allocations.append(Allocation(help_request_id=req.id, quantity=1, actor=actor.name, at=utcnow()))
    db.flush()
    req.resource_id, req.status = resource.id, "assigned"
    from app.services.operations import _resource_event

    _resource_event(db, resource, actor.name, f"1 {resource.unit} assigned to help request {req.code}.")
    _event(db, req, f"{resource.name} assigned", actor)
    audit(db, actor, f"Assigned {resource.name} to {req.code}", "")
    return req


def dispatch(db: Session, actor: Actor, code: str) -> HelpRequest:
    req = get_request(db, code, lock=True)
    if req.status != "assigned":
        raise DomainError("Only assigned requests can be dispatched.", 409)
    req.status = "enroute"
    _event(db, req, "Dispatch confirmed", actor)
    audit(db, actor, f"Confirmed dispatch for {req.code}", "")
    return req


def resolve(db: Session, actor: Actor, code: str) -> HelpRequest:
    req = get_request(db, code, lock=True)
    if req.status not in ("enroute", "assigned"):
        raise DomainError("Only assigned or en-route requests can be resolved.", 409)
    if req.resource_id:
        resource = db.get(Resource, req.resource_id, with_for_update=True)
        if resource is not None:
            db.refresh(resource, ["allocations"])
            row = next((a for a in resource.allocations if a.help_request_id == req.id), None)
            if row:
                resource.allocations.remove(row)
                db.flush()
                from app.services.operations import _resource_event

                _resource_event(db, resource, actor.name, f"1 {resource.unit} returned from help request {req.code}.")
    req.status = "resolved"
    _event(db, req, "Marked resolved", actor)
    audit(db, actor, f"Resolved {req.code}", "")
    return req


def find_duplicates(
    db: Session, phone: str, address: str, created_at: datetime, exclude_id: int | None = None
) -> list[str]:
    window_start = created_at - timedelta(hours=1)
    window_end = created_at + timedelta(hours=1)
    norm_addr = address.strip().lower()
    stmt = select(HelpRequest).where(
        (HelpRequest.created_at >= window_start) & (HelpRequest.created_at <= window_end),
        (HelpRequest.phone == phone) | (func.lower(HelpRequest.address) == norm_addr),
    )
    if exclude_id is not None:
        stmt = stmt.where(HelpRequest.id != exclude_id)
    matches = db.scalars(stmt).all()
    return [m.code for m in matches]


def add_update(db: Session, actor: Actor, code: str, text: str) -> HelpRequest:
    req = get_request(db, code, lock=True)
    ensure_visible(req, actor)
    if req.status in ("resolved", "cancelled"):
        raise DomainError("Updates cannot be added to resolved or cancelled requests.", 409)
    _event(db, req, f"Update: {text}", actor)
    audit(db, actor, f"Added update to {req.code}", text[:100])
    notify(db, f"Update on help request {req.code}: {text[:80]}")
    return req


def cancel_request(db: Session, actor: Actor, code: str, reason: str) -> HelpRequest:
    req = get_request(db, code, lock=True)
    ensure_visible(req, actor)
    if req.status in ("resolved", "cancelled"):
        raise DomainError("This request is already closed.", 409)
    if req.resource_id:
        resource = db.get(Resource, req.resource_id, with_for_update=True)
        if resource is not None:
            db.refresh(resource, ["allocations"])
            row = next((a for a in resource.allocations if a.help_request_id == req.id), None)
            if row:
                resource.allocations.remove(row)
                db.flush()
                from app.services.operations import _resource_event

                _resource_event(
                    db, resource, actor.name, f"1 {resource.unit} auto-released: help request {req.code} cancelled."
                )
        req.resource_id = None
    req.status = "cancelled"
    _event(db, req, f"Request cancelled: {reason}", actor)
    audit(db, actor, f"Cancelled {req.code}", reason[:120])
    notify(db, f"Help request {req.code} cancelled.")
    return req


def reassign(db: Session, actor: Actor, code: str, resource_id: str) -> HelpRequest:
    req = get_request(db, code, lock=True)
    if req.status not in ("verified", "assigned", "enroute"):
        raise DomainError("Only verified or assigned requests can be reassigned.", 409)
    if req.resource_id:
        old_res = db.get(Resource, req.resource_id, with_for_update=True)
        if old_res is not None:
            db.refresh(old_res, ["allocations"])
            row = next((a for a in old_res.allocations if a.help_request_id == req.id), None)
            if row:
                old_res.allocations.remove(row)
                db.flush()
                from app.services.operations import _resource_event

                _resource_event(
                    db, old_res, actor.name, f"1 {old_res.unit} released: help request {req.code} reassigned."
                )
    new_res = get_resource(db, resource_id, lock=True)
    if new_res.maintenance or new_res.available < 1:
        raise DomainError("No available capacity in that pool.", 409)
    new_res.allocations.append(Allocation(help_request_id=req.id, quantity=1, actor=actor.name, at=utcnow()))
    db.flush()
    req.resource_id = new_res.id
    req.status = "assigned"
    from app.services.operations import _resource_event

    _resource_event(db, new_res, actor.name, f"1 {new_res.unit} assigned to help request {req.code}.")
    _event(db, req, f"Reassigned to {new_res.name}", actor)
    audit(db, actor, f"Reassigned {req.code} to {new_res.name}", "")
    return req


def release_unit(db: Session, actor: Actor, code: str) -> HelpRequest:
    req = get_request(db, code, lock=True)
    if not req.resource_id:
        raise DomainError("No resource is currently assigned to this request.", 409)
    resource = db.get(Resource, req.resource_id, with_for_update=True)
    if resource is not None:
        db.refresh(resource, ["allocations"])
        row = next((a for a in resource.allocations if a.help_request_id == req.id), None)
        if row:
            resource.allocations.remove(row)
            db.flush()
            from app.services.operations import _resource_event

            _resource_event(
                db, resource, actor.name, f"1 {resource.unit} released by manager from help request {req.code}."
            )
    req.resource_id = None
    req.status = "verified"
    _event(db, req, "Resource released by manager (request remains open)", actor)
    audit(db, actor, f"Released resource for {req.code}", "")
    return req
