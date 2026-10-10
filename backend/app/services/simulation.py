from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Simulation
from app.security import Actor
from app.services.common import audit, new_id
from app.services.operations import get_resource, recommendation


def run(db: Session, resource_id: str, capacity: int, cost: int, weight: int) -> dict:
    """What-if only: nothing is written and no inventory moves."""
    resource = get_resource(db, resource_id)
    plan = recommendation(db, resource, capacity, weight)
    return {
        "resourceId": resource.id,
        "resourceName": resource.name,
        "capacity": capacity,
        "cost": cost,
        "weight": weight,
        "demand": sum(i.quantity for i in plan),
        "covered": sum(i.allocation for i in plan),
        "rows": [
            {
                "title": i.crisis.title,
                "city": i.crisis.city,
                "quantity": i.quantity,
                "allocation": i.allocation,
                "score": i.score,
            }
            for i in plan
        ],
    }


def save(db: Session, actor: Actor, resource_id: str, capacity: int, cost: int, weight: int) -> Simulation:
    result = run(db, resource_id, capacity, cost, weight)  # recomputed server-side so a saved scenario cannot be forged
    sim = Simulation(
        id=new_id("S"),
        actor=actor.name,
        resource_id=result["resourceId"],
        resource_name=result["resourceName"],
        capacity=capacity,
        cost=cost,
        weight=weight,
        demand=result["demand"],
        covered=result["covered"],
        rows=result["rows"],
    )
    db.add(sim)
    db.flush()
    keep = [s.id for s in db.scalars(select(Simulation).order_by(Simulation.at.desc(), Simulation.id.desc()).limit(20))]
    for old in db.scalars(select(Simulation).where(Simulation.id.not_in(keep))):
        db.delete(old)
    audit(db, actor, "Scenario saved", f"{sim.resource_name}: {sim.covered} of {sim.demand} requested units proposed.")
    return sim
