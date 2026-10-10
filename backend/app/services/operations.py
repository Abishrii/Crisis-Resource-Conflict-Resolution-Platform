"""Business rules for crises, resources, allocations, conflicts, decisions and negotiations."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import utcnow
from app.errors import DomainError, Forbidden, NotFound
from app.models import (
    CATEGORIES,
    RESOURCE_TYPES,
    Allocation,
    Crisis,
    CrisisEvent,
    Decision,
    Demand,
    Negotiation,
    Resource,
    ResourceEvent,
)
from app.roles import can
from app.security import Actor
from app.services.common import audit, js_round, new_id, notify

SEVERITY_NAMES = {1: "Low", 2: "Moderate", 3: "Elevated", 4: "High", 5: "Critical"}


def _crisis_event(db: Session, crisis: Crisis, actor: str, text: str, at: datetime | None = None) -> None:
    db.add(CrisisEvent(crisis_id=crisis.id, actor=actor, text=text, at=at or utcnow()))
    db.flush()


def _resource_event(db: Session, resource: Resource, actor: str, text: str, kind: str = "history") -> None:
    db.add(ResourceEvent(resource_id=resource.id, actor=actor, text=text, kind=kind, at=utcnow()))
    db.flush()


def get_crisis(db: Session, crisis_id: str) -> Crisis:
    crisis = db.get(Crisis, crisis_id)
    if crisis is None:
        raise NotFound("That incident does not exist.")
    return crisis


def get_resource(db: Session, resource_id: str, lock: bool = False) -> Resource:
    resource = db.get(Resource, resource_id, with_for_update=lock or None)
    if resource is None:
        raise NotFound("That resource pool does not exist.")
    if lock:
        db.refresh(resource, ["allocations"])
    return resource


# ------------------------------------------------------------------ crises
def create_crisis(
    db: Session, actor: Actor, *, title, city, region, category, severity, status, population, lat, lng
) -> Crisis:
    if category not in CATEGORIES:
        raise DomainError("Choose a valid incident category.")
    if not (6 <= lat <= 37 and 67 <= lng <= 98):
        raise DomainError("Coordinates must fall inside the India footprint (6-37 N, 67-98 E).")
    crisis = Crisis(
        id=new_id("C"),
        title=title,
        city=city,
        region=region,
        lat=lat,
        lng=lng,
        category=category,
        severity=severity,
        status=status,
        population=population,
        response_minutes=None,
        created_by_id=actor.id,
    )
    db.add(crisis)
    db.flush()
    _crisis_event(db, crisis, actor.name, "Incident created.", crisis.created_at)
    audit(db, actor, "Crisis created", f"{title} / {city}.")
    notify(db, f"New incident: {title}.")
    return crisis


def release_capacity(db: Session, resource: Resource, crisis_id: str, actor: Actor) -> int:
    rows = [a for a in resource.allocations if a.crisis_id == crisis_id]
    amount = sum(a.quantity for a in rows)
    if not amount:
        return 0
    for row in rows:
        resource.allocations.remove(row)
    db.flush()
    crisis = db.get(Crisis, crisis_id)
    _resource_event(
        db, resource, actor.name, f"Released {amount} {resource.unit} from {crisis.title if crisis else crisis_id}."
    )
    if crisis:
        _crisis_event(db, crisis, actor.name, f"Released {amount} {resource.unit} to {resource.name}.")
    return amount


def update_crisis(db: Session, actor: Actor, crisis_id: str, *, status=None, severity=None, category=None) -> Crisis:
    crisis = get_crisis(db, crisis_id)
    if status is not None and status != crisis.status:
        crisis.status = status
        _crisis_event(db, crisis, actor.name, f"Status changed to {status}.")
        if status == "resolved":
            for resource in db.scalars(
                select(Resource).join(Allocation).where(Allocation.crisis_id == crisis.id).with_for_update()
            ).unique():
                release_capacity(db, resource, crisis.id, actor)
        audit(db, actor, "Crisis status updated", f"{crisis.title}: {status}.")
        notify(db, f"{crisis.title} is now {status}.")
    if severity is not None and severity != crisis.severity:
        crisis.severity = severity
        detail = f"Severity changed to {SEVERITY_NAMES[severity]}."
        _crisis_event(db, crisis, actor.name, detail)
        audit(db, actor, "Crisis classification updated", f"{crisis.title}: {detail}")
        notify(db, f"{crisis.title}: {detail}")
    if category is not None and category != crisis.category:
        if category not in CATEGORIES:
            raise DomainError("Choose a valid incident category.")
        crisis.category = category
        detail = f"Category changed to {category}."
        _crisis_event(db, crisis, actor.name, detail)
        audit(db, actor, "Crisis classification updated", f"{crisis.title}: {detail}")
        notify(db, f"{crisis.title}: {detail}")
    db.flush()
    return crisis


# ------------------------------------------------------------------ resources
def create_resource(db: Session, actor: Actor, *, name, type, total, unit, cost, organization, capability) -> Resource:
    if type not in RESOURCE_TYPES:
        raise DomainError("Choose a valid resource type.")
    resource = Resource(
        id=new_id("R"),
        name=name,
        type=type,
        total=total,
        unit=unit,
        cost=cost,
        organization=organization,
        capability=capability,
    )
    db.add(resource)
    db.flush()
    _resource_event(db, resource, actor.name, "Inventory pool created.")
    audit(db, actor, "Resource inventory created", f"{name}: {total} {unit}.")
    return resource


def set_maintenance(db: Session, actor: Actor, resource_id: str) -> Resource:
    resource = get_resource(db, resource_id, lock=True)
    if not resource.maintenance and resource.used > 0:
        raise DomainError("Release current assignments before putting this pool into maintenance.", 409)
    resource.maintenance = not resource.maintenance
    message = (
        "Pool placed in maintenance; capacity unavailable."
        if resource.maintenance
        else "Maintenance cleared; pool returned to available inventory."
    )
    _resource_event(db, resource, actor.name, message, kind="maintenance")
    _resource_event(db, resource, actor.name, message)
    audit(db, actor, "Maintenance status changed", f"{resource.name}: {message}")
    notify(db, f"{resource.name}: {message}")
    return resource


def update_resource(
    db: Session,
    actor: Actor,
    resource_id: str,
    *,
    total: int | None = None,
    name: str | None = None,
    capability: str | None = None,
    cost: int | None = None,
) -> Resource:
    resource = get_resource(db, resource_id, lock=True)
    changes = []
    if total is not None and total != resource.total:
        if total < resource.used:
            raise DomainError(
                f"{resource.used} {resource.unit} are currently assigned; the total cannot drop below that.", 409
            )
        old = resource.total
        resource.total = total
        changes.append(f"Capacity changed from {old} to {total} {resource.unit}")
    if name is not None and name != resource.name:
        resource.name = name
        changes.append(f"Name updated to {name}")
    if capability is not None and capability != resource.capability:
        resource.capability = capability
        changes.append("Capability updated")
    if cost is not None and cost != resource.cost:
        resource.cost = cost
        changes.append(f"Cost updated to {cost}")
    if changes:
        detail = "; ".join(changes) + "."
        _resource_event(db, resource, actor.name, detail)
        audit(db, actor, "Resource updated", f"{resource.name}: {detail}")
    db.flush()
    db.refresh(resource, ["events"])
    return resource


def update_resource_total(db: Session, actor: Actor, resource_id: str, total: int) -> Resource:
    return update_resource(db, actor, resource_id, total=total)


def record_stock_movement(
    db: Session, actor: Actor, resource_id: str, movement_type: str, quantity: int, reason: str
) -> Resource:
    if quantity < 1:
        raise DomainError("Movement quantity must be at least 1.")
    resource = get_resource(db, resource_id, lock=True)
    if movement_type == "stock_in":
        resource.total += quantity
        _resource_event(
            db,
            resource,
            actor.name,
            f"Stock-in (+{quantity} {resource.unit}): {reason}. Total capacity now {resource.total} {resource.unit}.",
        )
        audit(db, actor, "Stock-in recorded", f"{resource.name}: +{quantity} {resource.unit} ({reason})")
        notify(db, f"Stock-in for {resource.name}: +{quantity} {resource.unit}")
    elif movement_type == "stock_out":
        if quantity > resource.available:
            raise DomainError(
                f"Cannot stock out {quantity} {resource.unit}; only {resource.available} {resource.unit} currently available.",
                409,
            )
        if resource.total - quantity < resource.used:
            raise DomainError(
                f"{resource.used} {resource.unit} are currently assigned; total capacity cannot drop below that.", 409
            )
        resource.total -= quantity
        _resource_event(
            db,
            resource,
            actor.name,
            f"Stock-out (-{quantity} {resource.unit}): {reason}. Total capacity now {resource.total} {resource.unit}.",
        )
        audit(db, actor, "Stock-out recorded", f"{resource.name}: -{quantity} {resource.unit} ({reason})")
        notify(db, f"Stock-out for {resource.name}: -{quantity} {resource.unit}")
    else:
        raise DomainError(f"Invalid movement type '{movement_type}'.")

    if resource.available <= max(2, int(resource.total * 0.25)) and not resource.maintenance:
        notify(db, f"⚠️ Low-stock alert: {resource.name} has only {resource.available} {resource.unit} available!")
    db.flush()
    db.refresh(resource, ["events"])
    return resource


# ------------------------------------------------------------------ demand & recommendation
@dataclass
class PlanItem:
    demand_id: str
    resource_id: str
    crisis: Crisis
    quantity: int
    score: int
    allocation: int = 0


def open_demands(db: Session, resource_id: str) -> list[tuple[Demand, Crisis]]:
    rows = db.execute(
        select(Demand, Crisis)
        .join(Crisis, Crisis.id == Demand.crisis_id)
        .where(Demand.resource_id == resource_id, Demand.quantity > 0, Crisis.status != "resolved")
        .order_by(Demand.created_at, Demand.id)
    ).all()
    return [(d, c) for d, c in rows]


def demand_total(db: Session, resource_id: str) -> int:
    return sum(d.quantity for d, _ in open_demands(db, resource_id))


def recommendation(db: Session, resource: Resource, capacity: int | None = None, weight: int = 65) -> list[PlanItem]:
    """Rank open requests by severity (weight %) and response readiness (100-weight %), then fill from capacity.
    A transparent, deterministic heuristic: a person always makes the final call."""
    capacity = resource.available if capacity is None else capacity
    items = []
    for demand, crisis in open_demands(db, resource.id):
        readiness = max(0, 60 - (crisis.response_minutes if crisis.response_minutes is not None else 30)) / 60
        score = js_round(crisis.severity / 5 * weight + readiness * (100 - weight))
        items.append(PlanItem(demand.id, resource.id, crisis, demand.quantity, score))
    items.sort(key=lambda i: (-i.score, i.crisis.created_at))
    remaining = max(0, int(capacity))
    for item in items:
        item.allocation = min(item.quantity, remaining)
        remaining -= item.allocation
    return items


def add_demand(db: Session, actor: Actor, *, resource_id: str, crisis_id: str, quantity: int, reason: str) -> Demand:
    resource, crisis = get_resource(db, resource_id), get_crisis(db, crisis_id)
    if crisis.status == "resolved":
        raise DomainError("Choose a valid resource and active crisis, and enter a positive quantity.")
    existing = db.scalar(select(Demand).where(Demand.resource_id == resource.id, Demand.crisis_id == crisis.id))
    if existing:
        if existing.quantity + quantity > 1_000_000:
            raise DomainError("Requested quantity exceeds the limit of 1,000,000.")
        existing.quantity += quantity
        existing.updated_at = utcnow()
        demand = existing
    else:
        demand = Demand(id=new_id("Q"), resource_id=resource.id, crisis_id=crisis.id, quantity=quantity)
        db.add(demand)
    audit(
        db, actor, "Resource request added", f"{crisis.title}: {quantity} {resource.unit} / {resource.name}. {reason}"
    )
    notify(db, f"New competing request: {resource.name} / {crisis.city}.")
    db.flush()
    return demand


# ------------------------------------------------------------------ allocation
def assign_capacity(db: Session, resource: Resource, crisis: Crisis, quantity: int, reason: str, actor: Actor) -> None:
    if crisis.status == "resolved":
        raise DomainError("That incident is resolved; resources can only be assigned to open incidents.", 409)
    if resource.maintenance:
        raise DomainError("That pool is in maintenance and cannot be assigned.", 409)
    if quantity < 1:
        raise DomainError("Enter a quantity of at least 1.")
    if quantity > resource.available:
        raise DomainError(f"Only {resource.available} {resource.unit} are available in {resource.name}.", 409)
    now = utcnow()
    existing = next((a for a in resource.allocations if a.crisis_id == crisis.id), None)
    if existing:
        existing.quantity += quantity
        existing.at, existing.actor = now, actor.name
    else:
        resource.allocations.append(Allocation(crisis_id=crisis.id, quantity=quantity, at=now, actor=actor.name))
    db.flush()
    _resource_event(db, resource, actor.name, f"{quantity} {resource.unit} assigned to {crisis.title}. {reason}")
    _crisis_event(db, crisis, actor.name, f"{quantity} {resource.unit} assigned from {resource.name}. {reason}")
    if crisis.response_minutes is None:
        elapsed = (datetime.now(timezone.utc) - crisis.created_at).total_seconds() / 60
        crisis.response_minutes = max(1, js_round(elapsed))
    filled = quantity
    for demand in db.scalars(
        select(Demand).where(Demand.resource_id == resource.id, Demand.crisis_id == crisis.id, Demand.quantity > 0)
    ):
        consumed = min(filled, demand.quantity)
        demand.quantity -= consumed
        filled -= consumed
        if demand.quantity == 0:
            db.delete(demand)
    db.flush()


def allocate(
    db: Session, actor: Actor, *, resource_id: str, crisis_id: str, quantity: int, reason: str, override: bool
) -> Resource:
    """Manual assignment. An override (or any assignment into a contested pool) needs approval rights and leaves a decision record."""
    if override and not can(actor.role, "approve"):
        raise Forbidden("Only a crisis manager or admin can record an override.")
    resource = get_resource(db, resource_id, lock=True)
    crisis = get_crisis(db, crisis_id)
    contested = demand_total(db, resource.id) > resource.available
    if contested and not can(actor.role, "approve"):
        raise Forbidden(
            "This pool has competing or uncovered demand. A manager or admin must approve the allocation in Conflict Resolution."
        )
    assign_capacity(db, resource, crisis, quantity, reason, actor)
    message = f"{resource.name}: {quantity} {resource.unit} to {crisis.city}. {reason}"
    if override or contested:
        db.add(
            Decision(
                id=new_id("D"),
                actor=actor.name,
                type="Manual override" if override else "Manual allocation under demand pressure",
                text=message,
            )
        )
    audit(db, actor, "Manual allocation approved" if (override or contested) else "Resource assigned", message)
    notify(db, f"Assignment: {message}")
    return resource


def release(db: Session, actor: Actor, resource_id: str, crisis_id: str) -> int:
    resource = get_resource(db, resource_id, lock=True)
    amount = release_capacity(db, resource, crisis_id, actor)
    if not amount:
        raise DomainError("That resource has no assignment to release for this incident.", 404)
    audit(db, actor, "Assignment released", f"{amount} {resource.unit} returned to {resource.name}.")
    notify(db, f"{resource.name}: {amount} {resource.unit} returned to the available pool.")
    return amount


def approve_pool(db: Session, actor: Actor, resource_id: str) -> str:
    resource = get_resource(db, resource_id, lock=True)
    plan = [p for p in recommendation(db, resource) if p.allocation > 0]
    if not plan:
        raise DomainError("No available capacity. Arrange backfill or release existing assignments first.", 409)
    summary = []
    for item in plan:
        assign_capacity(
            db, resource, item.crisis, item.allocation, f"Priority score {item.score}; recommendation approved.", actor
        )
        summary.append(f"{item.crisis.city}: {item.allocation} {resource.unit}")
    message = f"{resource.name} / {'; '.join(summary)}. Unmet requests remain visible."
    db.add(Decision(id=new_id("D"), actor=actor.name, type="Recommendation approved", text=message))
    audit(db, actor, "Resource recommendation approved", message)
    notify(db, f"Approval recorded: {message}")
    return message


# ------------------------------------------------------------------ negotiation
def add_negotiation(db: Session, actor: Actor, resource_id: str, proposal: str) -> Negotiation:
    resource = get_resource(db, resource_id)
    item = Negotiation(id=new_id("G"), resource_id=resource.id, proposal=proposal, actor=actor.name, status="pending")
    db.add(item)
    audit(db, actor, "Negotiation proposal recorded", f"{resource.name}: {proposal}")
    notify(db, f"Compromise proposal recorded for {resource.name}.")
    db.flush()
    return item


def agree_negotiation(db: Session, actor: Actor, negotiation_id: str) -> Negotiation:
    item = db.get(Negotiation, negotiation_id)
    if item is None:
        raise NotFound("That proposal does not exist.")
    if item.status == "resolved":
        raise DomainError("That proposal has already been agreed.", 409)
    item.status, item.agreed_by = "resolved", actor.name
    audit(db, actor, "Compromise agreement recorded", item.proposal)
    notify(db, f"Agreement: {item.proposal}. Resource assignment is still a separate action.")
    return item


def total_allocated(db: Session, resource_id: str) -> int:
    return (
        db.scalar(select(func.coalesce(func.sum(Allocation.quantity), 0)).where(Allocation.resource_id == resource_id))
        or 0
    )
