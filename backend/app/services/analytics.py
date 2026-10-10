from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import RESOURCE_TYPES, AuditLog, Crisis, Resource
from app.services.common import js_round
from app.services.operations import SEVERITY_NAMES, demand_total

IST = ZoneInfo("Asia/Kolkata")
ALLOCATION_ACTIONS = ("Resource assigned", "Manual allocation approved", "Resource recommendation approved")


def _utilization(pools: list[Resource]) -> int:
    pools = [p for p in pools if not p.maintenance]
    return js_round(sum(p.used / p.total * 100 for p in pools) / len(pools)) if pools else 0


def metrics(db: Session) -> dict:
    resources = db.scalars(select(Resource)).all()
    crises = db.scalars(select(Crisis)).all()
    times = [c.response_minutes for c in crises if c.response_minutes is not None]
    return {
        "active": sum(1 for c in crises if c.status != "resolved"),
        "escalating": sum(1 for c in crises if c.status == "escalating"),
        "conflicts": sum(1 for r in resources if demand_total(db, r.id) > r.available),
        "utilization": _utilization(resources),
        "response": js_round(sum(times) / len(times)) if times else 0,
        "resourcesTracked": len(resources),
    }


def period_crises(db: Session, days: int) -> list[Crisis]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return list(db.scalars(select(Crisis).where(Crisis.created_at >= cutoff).order_by(Crisis.created_at.desc())))


def analytics(db: Session, days: int) -> dict:
    crises = period_crises(db, days)
    times = [c.response_minutes for c in crises if c.response_minutes is not None]
    resources = db.scalars(select(Resource)).all()

    span = min(days, 14)
    today = datetime.now(IST).replace(hour=0, minute=0, second=0, microsecond=0)
    trend = []
    for back in range(span - 1, -1, -1):
        start = today - timedelta(days=back)
        end = start + timedelta(days=1)
        count = sum(1 for c in crises if start <= c.created_at.astimezone(IST) < end)
        trend.append({"date": start.date().isoformat(), "count": count})

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    by_day: dict[str, int] = {}
    for at in db.scalars(select(AuditLog.at).where(AuditLog.at >= cutoff, AuditLog.action.in_(ALLOCATION_ACTIONS))):
        key = at.astimezone(IST).date().isoformat()
        by_day[key] = by_day.get(key, 0) + 1

    return {
        "days": days,
        "incidents": len(crises),
        "resolved": sum(1 for c in crises if c.status == "resolved"),
        "meanResponse": js_round(sum(times) / len(times)) if times else 0,
        "meanUtilization": metrics(db)["utilization"],
        "trend": trend,
        "bySeverity": [
            {"severity": s, "label": SEVERITY_NAMES[s], "count": sum(1 for c in crises if c.severity == s)}
            for s in (5, 4, 3, 2, 1)
        ],
        "byCategory": sorted(
            [
                {"category": cat, "count": sum(1 for c in crises if c.category == cat)}
                for cat in {c.category for c in crises}
            ],
            key=lambda x: (-x["count"], x["category"]),
        ),
        "utilization": [
            {"type": t, "percent": _utilization([r for r in resources if r.type == t])} for t in RESOURCE_TYPES
        ],
        "allocationsByDay": [{"date": d, "count": n} for d, n in sorted(by_day.items())],
        "responses": [
            {
                "id": c.id,
                "title": c.title,
                "city": c.city,
                "category": c.category,
                "status": c.status,
                "responseMinutes": c.response_minutes,
            }
            for c in crises
        ],
    }
