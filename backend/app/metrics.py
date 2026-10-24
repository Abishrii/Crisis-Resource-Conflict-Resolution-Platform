"""Prometheus metrics collector, exporter, and access control for ResQSync."""

from __future__ import annotations

import threading
import time
from typing import Dict, Tuple

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import Crisis, Demand, HelpRequest, OutboxMessage, Resource, User
from app.roles import ADMIN
from app.security import _token_from_request, get_db

router = APIRouter(tags=["Observability"])


class MetricsStore:
    """Thread-safe store for HTTP traffic metrics and runtime counters."""

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.start_time = time.time()
        self.http_requests_total: Dict[Tuple[str, str, int], int] = {}
        self.http_request_duration_count = 0
        self.http_request_duration_sum = 0.0

    def record_request(self, method: str, path: str, status_code: int, duration_seconds: float) -> None:
        norm_path = self._normalize_path(path)
        with self.lock:
            key = (method, norm_path, status_code)
            self.http_requests_total[key] = self.http_requests_total.get(key, 0) + 1
            self.http_request_duration_count += 1
            self.http_request_duration_sum += duration_seconds

    @staticmethod
    def _normalize_path(path: str) -> str:
        parts = path.strip("/").split("/")
        norm_parts = []
        for p in parts:
            if p.isdigit() or len(p) > 24:
                norm_parts.append("{id}")
            else:
                norm_parts.append(p)
        return "/" + "/".join(norm_parts) if norm_parts else "/"

    def reset_for_tests(self) -> None:
        with self.lock:
            self.http_requests_total.clear()
            self.http_request_duration_count = 0
            self.http_request_duration_sum = 0.0


metrics_store = MetricsStore()


def verify_metrics_access(request: Request, db: Session) -> None:
    """Verify that the caller is from an internal loopback network or has an active ADMIN session."""
    settings: Settings = request.app.state.settings
    client_host = request.client.host if request.client else ""
    in_production = getattr(settings, "env", "") == "production"
    if not in_production and client_host in ("127.0.0.1", "::1", "localhost", "testclient"):
        return

    token = _token_from_request(request, settings)
    if token:
        try:
            claims = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
            user_id = int(claims.get("sub", 0))
            user = db.get(User, user_id)
            if user and user.active and user.role == ADMIN:
                return
        except Exception:
            pass

    raise HTTPException(
        status_code=403,
        detail="Access to metrics is restricted to internal callers or administrators.",
    )


def generate_prometheus_output(db: Session | None = None) -> str:
    """Serialize system and business telemetry into Prometheus 0.0.4 text format."""
    lines: list[str] = []

    # HTTP requests total
    lines.append("# HELP resqsync_http_requests_total Total number of HTTP requests processed.")
    lines.append("# TYPE resqsync_http_requests_total counter")
    with metrics_store.lock:
        reqs = list(metrics_store.http_requests_total.items())
        dur_count = metrics_store.http_request_duration_count
        dur_sum = metrics_store.http_request_duration_sum
        uptime = time.time() - metrics_store.start_time

    for (m, p, s), count in sorted(reqs):
        lines.append(f'resqsync_http_requests_total{{method="{m}",path="{p}",status="{s}"}} {count}')
    if not reqs:
        lines.append('resqsync_http_requests_total{method="GET",path="/health",status="200"} 0')

    # Request duration summary
    lines.append("# HELP resqsync_http_request_duration_seconds Latency of HTTP requests in seconds.")
    lines.append("# TYPE resqsync_http_request_duration_seconds summary")
    lines.append(f"resqsync_http_request_duration_seconds_count {dur_count}")
    lines.append(f"resqsync_http_request_duration_seconds_sum {dur_sum:.6f}")

    # Process uptime
    lines.append("# HELP resqsync_uptime_seconds Process uptime in seconds.")
    lines.append("# TYPE resqsync_uptime_seconds counter")
    lines.append(f"resqsync_uptime_seconds {uptime:.2f}")

    # Database Gauges
    if db is not None:
        try:
            # Active Crises
            active_crises = db.scalar(select(func.count(Crisis.id)).where(Crisis.status != "RESOLVED")) or 0
            lines.append("# HELP resqsync_active_crises_total Total number of active crises.")
            lines.append("# TYPE resqsync_active_crises_total gauge")
            lines.append(f"resqsync_active_crises_total {active_crises}")

            # Registered Resources
            resources_count = db.scalar(select(func.count(Resource.id))) or 0
            lines.append("# HELP resqsync_resources_total Total number of registered resources.")
            lines.append("# TYPE resqsync_resources_total gauge")
            lines.append(f"resqsync_resources_total {resources_count}")

            # Pending/Uncovered Demands
            demands_count = db.scalar(select(func.count(Demand.id))) or 0
            demands_qty = db.scalar(select(func.sum(Demand.quantity))) or 0
            lines.append("# HELP resqsync_demands_total Total number of active demands.")
            lines.append("# TYPE resqsync_demands_total gauge")
            lines.append(f"resqsync_demands_total {demands_count}")
            lines.append("# HELP resqsync_uncovered_demands_units Total units of uncovered resource demands.")
            lines.append("# TYPE resqsync_uncovered_demands_units gauge")
            lines.append(f"resqsync_uncovered_demands_units {demands_qty}")

            # Help Requests by Status
            lines.append("# HELP resqsync_help_requests_total Total help requests partitioned by status.")
            lines.append("# TYPE resqsync_help_requests_total gauge")
            hr_stats = db.execute(
                select(HelpRequest.status, func.count(HelpRequest.id)).group_by(HelpRequest.status)
            ).all()
            if hr_stats:
                for status_name, count in hr_stats:
                    lines.append(f'resqsync_help_requests_total{{status="{status_name}"}} {count}')
            else:
                lines.append('resqsync_help_requests_total{status="OPEN"} 0')

            # Outbox Messages by Status
            lines.append("# HELP resqsync_outbox_messages_total Total outbox messages partitioned by status.")
            lines.append("# TYPE resqsync_outbox_messages_total gauge")
            outbox_stats = db.execute(
                select(OutboxMessage.status, func.count(OutboxMessage.id)).group_by(OutboxMessage.status)
            ).all()
            if outbox_stats:
                for status_name, count in outbox_stats:
                    lines.append(f'resqsync_outbox_messages_total{{status="{status_name}"}} {count}')
            else:
                lines.append('resqsync_outbox_messages_total{status="PENDING"} 0')

        except Exception as exc:
            lines.append(f"# Error collecting database telemetry: {exc}")

    lines.append("")
    return "\n".join(lines)


@router.get("/metrics")
@router.get("/api/metrics")
def get_metrics(request: Request, db: Session = Depends(get_db)):
    """Prometheus 0.0.4 metrics scrape endpoint restricted to internal callers or administrators."""
    verify_metrics_access(request, db)
    payload = generate_prometheus_output(db)
    return Response(content=payload, media_type="text/plain; version=0.0.4; charset=utf-8")
