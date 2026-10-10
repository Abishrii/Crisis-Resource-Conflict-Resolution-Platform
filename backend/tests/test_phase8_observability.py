"""Tests for Phase 8: Observability, Request IDs, Structured Logging, Error Reporting, and Prometheus Metrics."""

import json
import logging
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from starlette.testclient import TestClient

from app.logging_utils import JSONFormatter, get_error_reporter
from app.metrics import metrics_store, verify_metrics_access


def test_request_id_middleware_and_header(client: TestClient):
    # 1. Custom Request ID should be preserved
    r1 = client.get("/api/meta", headers={"X-Request-ID": "custom-trace-uuid-12345"})
    assert r1.status_code == 200
    assert r1.headers.get("X-Request-ID") == "custom-trace-uuid-12345"

    # 2. Automatically generated Request ID when omitted
    r2 = client.get("/api/meta")
    assert r2.status_code == 200
    req_id = r2.headers.get("X-Request-ID")
    assert req_id is not None
    assert len(req_id) >= 16


def test_structured_json_formatter():
    formatter = JSONFormatter()
    record = logging.LogRecord(
        name="resqsync.test",
        level=logging.INFO,
        pathname="test.py",
        lineno=42,
        msg='User authenticated with {"password": "SuperSecretPassword123!"}',
        args=(),
        exc_info=None,
    )
    record.request_id = "test-req-id-777"
    record.duration_ms = 12.34
    record.status_code = 200

    formatted = formatter.format(record)
    data = json.loads(formatted)

    assert data["level"] == "INFO"
    assert data["logger"] == "resqsync.test"
    assert data["request_id"] == "test-req-id-777"
    assert data["duration_ms"] == 12.34
    assert data["status_code"] == 200
    # PII masking check
    assert "SuperSecretPassword123!" not in data["message"]
    assert "[REDACTED]" in data["message"]


def test_error_reporter_hook():
    reporter = get_error_reporter()
    reporter.clear()

    captured = []

    def hook(exc: Exception, ctx: dict):
        captured.append((str(exc), ctx))

    reporter.register_hook(hook)

    full_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    test_exc = ValueError(f"Simulated system failure with token {full_jwt}")
    context = {"request_id": "err-trace-123", "method": "POST", "path": "/api/test"}

    reporter.report_error(test_exc, context)

    assert len(captured) == 1
    assert captured[0][1]["request_id"] == "err-trace-123"

    recent = reporter.get_recent_errors(limit=5)
    assert len(recent) >= 1
    assert recent[0]["exception_type"] == "ValueError"
    assert "[REDACTED_JWT]" in recent[0]["message"]


def test_prometheus_metrics_endpoint_internal_access(client: TestClient):
    # TestClient connects as internal loopback / testclient
    r = client.get("/metrics")
    assert r.status_code == 200
    assert "text/plain" in r.headers["Content-Type"]
    assert "version=0.0.4" in r.headers["Content-Type"]

    body = r.text
    assert "# HELP resqsync_http_requests_total" in body
    assert "# TYPE resqsync_http_requests_total counter"
    assert "# HELP resqsync_uptime_seconds" in body
    assert "# TYPE resqsync_uptime_seconds counter"
    assert "# HELP resqsync_active_crises_total" in body
    assert "# TYPE resqsync_resources_total" in body
    assert body.endswith("\n")


def test_prometheus_metrics_access_control():
    # 1. External IP without authentication is rejected with 403
    mock_req_ext = MagicMock()
    mock_req_ext.client.host = "203.0.113.195"
    mock_req_ext.headers = {}
    mock_req_ext.cookies = {}
    mock_db = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        verify_metrics_access(mock_req_ext, mock_db)
    assert exc_info.value.status_code == 403

    # 2. Internal loopback caller is granted access without token
    mock_req_int = MagicMock()
    mock_req_int.client.host = "127.0.0.1"
    verify_metrics_access(mock_req_int, mock_db)

    # 3. External IP with valid ADMIN token is granted access
    import jwt

    settings = MagicMock()
    settings.secret_key = "test-secret-key-at-least-32-bytes-long!"
    settings.cookie_name = "resq_session"
    mock_req_ext.app.state.settings = settings
    admin_token = jwt.encode({"sub": "1", "ver": 1}, settings.secret_key, algorithm="HS256")
    mock_req_ext.headers = {"authorization": f"Bearer {admin_token}"}

    admin_user = MagicMock()
    admin_user.active = True
    admin_user.role = "ADMIN"
    mock_db.get.return_value = admin_user

    verify_metrics_access(mock_req_ext, mock_db)


def test_metrics_store_recording():
    metrics_store.reset_for_tests()
    metrics_store.record_request("GET", "/api/crises/42", 200, 0.015)
    metrics_store.record_request("POST", "/api/crises", 201, 0.045)

    assert metrics_store.http_request_duration_count == 2
    assert metrics_store.http_request_duration_sum >= 0.05
    # Key normalization: /api/crises/42 -> /api/crises/{id}
    assert ("GET", "/api/crises/{id}", 200) in metrics_store.http_requests_total
    assert ("POST", "/api/crises", 201) in metrics_store.http_requests_total
