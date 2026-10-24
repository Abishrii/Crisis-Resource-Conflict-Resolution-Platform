from __future__ import annotations

import logging
import re
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import Settings, get_settings
from app.database import Database
from app.errors import DomainError
from app.events import EventHub
from app.logging_utils import get_error_reporter, log_structured, request_id_var, setup_pii_logging
from app.metrics import metrics_store
from app.metrics import router as metrics_router
from app.rate_limit import RateLimiter
from app.routers import auth, events, help_requests, workspace
from app.security import LoginThrottle
from app.services.delivery import DeliveryService
from app.services.outbox_worker import OutboxWorker
from app.services.seed import seed_all

log = logging.getLogger("resqsync")
UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}


class SecurityMiddleware(BaseHTTPMiddleware):
    """Reject cross-site state changes and add baseline security headers."""

    BASE_CSP = (
        "default-src 'self'; script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: blob: https://images.pexels.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org; "
        "media-src 'self' https://videos.pexels.com; connect-src 'self'; object-src 'none'; "
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    )
    # The standalone archive source embeds its controller inline; only relax that one static page.
    ARCHIVE_CSP = BASE_CSP.replace("script-src 'self';", "script-src 'self' 'unsafe-inline';")

    async def dispatch(self, request: Request, call_next):
        if request.method in UNSAFE:
            origin = request.headers.get("origin")
            if origin:
                settings: Settings = request.app.state.settings
                same_host = origin.split("://", 1)[-1] == request.headers.get("host", "")
                if not same_host and origin.rstrip("/") not in settings.cors_origins:
                    return JSONResponse({"detail": "Cross-site request blocked."}, status_code=403)
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "same-origin")
        archive_page = request.url.path.rstrip("/").endswith("/archive/index.html")
        response.headers.setdefault(
            "Content-Security-Policy",
            self.ARCHIVE_CSP if archive_page else self.BASE_CSP,
        )
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(self), microphone=(), camera=(), payment=()",
        )
        settings: Settings = request.app.state.settings
        if (
            settings.is_production
            or request.url.scheme == "https"
            or request.headers.get("x-forwarded-proto") == "https"
        ):
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        if request.url.path.startswith("/api/"):
            response.headers.setdefault("Cache-Control", "no-store")
        return response


class ObservabilityMiddleware:
    """Enforce request IDs (X-Request-ID), emit structured JSON access logs, and record telemetry via ASGI."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        req_id = ""
        for k, v in headers.items():
            if k.lower() == b"x-request-id":
                val = v.decode("latin1", errors="ignore")
                if re.match(r"^[A-Za-z0-9\-_]{1,64}$", val):
                    req_id = val
                break
        if not req_id:
            req_id = uuid.uuid4().hex

        token = request_id_var.set(req_id)
        start_time = time.perf_counter()
        status_code = 200
        client = scope.get("client")
        client_ip = client[0] if client else "unknown"
        path = scope.get("path", "")
        method = scope.get("method", "GET")

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 200)
                msg_headers = list(message.get("headers", []))
                msg_headers.append((b"x-request-id", req_id.encode("latin1")))
                message["headers"] = msg_headers
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
            duration = time.perf_counter() - start_time
            metrics_store.record_request(
                method=method,
                path=path,
                status_code=status_code,
                duration_seconds=duration,
            )
            log_structured(
                level="INFO",
                message=f"{method} {path} {status_code}",
                request_id=req_id,
                method=method,
                path=path,
                status_code=status_code,
                duration_ms=round(duration * 1000, 2),
                client_ip=client_ip,
            )
        except Exception as exc:
            duration = time.perf_counter() - start_time
            metrics_store.record_request(
                method=method,
                path=path,
                status_code=500,
                duration_seconds=duration,
            )
            context = {
                "request_id": req_id,
                "method": method,
                "path": path,
                "client_ip": client_ip,
            }
            get_error_reporter().report_error(exc, context)
            log_structured(
                level="ERROR",
                message=f"Unhandled exception during {method} {path}: {exc}",
                request_id=req_id,
                method=method,
                path=path,
                status_code=500,
                duration_ms=round(duration * 1000, 2),
                client_ip=client_ip,
                error=str(exc),
            )
            raise exc
        finally:
            request_id_var.reset(token)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    setup_pii_logging()
    database = Database(settings.database_url)
    delivery_svc = DeliveryService()
    worker = OutboxWorker(database, settings, delivery_svc)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        database.create_all()
        session = database.write_session()
        try:
            seed_all(session, settings)
        finally:
            session.close()
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        worker.start()
        yield
        worker.stop()
        if hasattr(app.state, "hub"):
            app.state.hub.close()
        database.dispose()

    app = FastAPI(
        title="ResQSync - Crisis Resource Conflict Resolution Platform",
        description="Backend API for crisis coordination, resource allocation and conflict resolution.",
        version="2.0.0",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.db = database
    app.state.hub = EventHub(settings.redis_url)
    app.state.throttle = LoginThrottle(settings.redis_url, settings.login_max_failures, settings.login_window_seconds)
    app.state.limiter = RateLimiter(settings.redis_url)
    app.state.delivery_service = delivery_svc
    app.state.outbox_worker = worker

    app.add_middleware(SecurityMiddleware)
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(settings.cors_origins),
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    app.add_middleware(ObservabilityMiddleware)

    @app.exception_handler(DomainError)
    async def _domain(_req: Request, exc: DomainError):
        return JSONResponse({"detail": exc.message}, status_code=exc.status)

    @app.exception_handler(RequestValidationError)
    async def _validation(_req: Request, exc: RequestValidationError):
        first = exc.errors()[0] if exc.errors() else {}
        field = ".".join(str(p) for p in first.get("loc", []) if p not in ("body", "query", "path"))
        msg = first.get("msg", "Invalid input").removeprefix("Value error, ")
        return JSONResponse({"detail": f"{field}: {msg}" if field else msg}, status_code=422)

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception):
        if isinstance(exc, HTTPException):
            return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
        req_id = getattr(request.state, "request_id", "") or uuid.uuid4().hex
        context = {
            "request_id": req_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else "unknown",
        }
        get_error_reporter().report_error(exc, context)
        headers = {"X-Request-ID": req_id}
        return JSONResponse(
            {"detail": "Internal server error", "request_id": req_id},
            status_code=500,
            headers=headers,
        )

    for router in (auth.router, workspace.router, help_requests.router, events.router, metrics_router):
        app.include_router(router)

    @app.get("/health", tags=["System"])
    @app.get("/api/health", tags=["System"])
    def health():
        session = database.read_session()
        try:
            session.execute(text("SELECT 1"))
        finally:
            session.close()
        return {"status": "healthy"}

    dist = settings.frontend_dist
    if (dist / "index.html").is_file():
        # Serve the built interface from the same origin so the session cookie works without any CORS setup.
        if (dist / "assets").is_dir():
            app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

        @app.get("/{path:path}", include_in_schema=False)
        def spa(path: str):
            if path.startswith("api/"):
                raise HTTPException(404, "Not found")
            candidate = (dist / path).resolve()
            if path and candidate.is_file() and dist.resolve() in candidate.parents:
                return FileResponse(candidate)
            return FileResponse(dist / "index.html")
    else:

        @app.get("/", tags=["System"])
        def root():
            return {"message": "ResQSync API", "docs": "/docs"}

    return app


app = create_app()
