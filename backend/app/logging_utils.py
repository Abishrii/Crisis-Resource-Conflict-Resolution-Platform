"""Logging utilities, structured JSON logging, PII masking, and error reporting."""

from __future__ import annotations

import json
import logging
import re
import sys
import traceback
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Callable

PATTERNS = [
    # Passwords & secrets
    (
        re.compile(r'(?i)("(?:password|secret|current|new|new_password|newPassword)")\s*:\s*"[^"]+"'),
        r'\1: "[REDACTED]"',
    ),
    (re.compile(r"(?i)(password|secret)=[^\s&]+"), r"\1=[REDACTED]"),
    # JWT tokens & bearer headers
    (re.compile(r"(?i)Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+"), "Bearer [REDACTED_TOKEN]"),
    (re.compile(r"eyJ[A-Za-z0-9\-_]{15,}\.[A-Za-z0-9\-_]{15,}\.[A-Za-z0-9\-_]{15,}"), "[REDACTED_JWT]"),
    # Phone numbers (India + international)
    (re.compile(r"(\+?91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}"), "[REDACTED_PHONE]"),
    (re.compile(r"\+?\d{1,3}[\-\s]?\(?\d{2,4}\)?[\-\s]?\d{3,4}[\-\s]?\d{3,4}"), "[REDACTED_PHONE]"),
    # Full physical street addresses
    (
        re.compile(
            r"\b\d{1,4}[A-Za-z0-9\s,\.\-]+(?:Road|Street|Nagar|Colony|Lane|Avenue|Marg|Sector|Ghat|Bazaar|Path|Circle|Cross|Main)\b",
            re.IGNORECASE,
        ),
        "[REDACTED_ADDRESS]",
    ),
]

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def mask_pii(text: str) -> str:
    """Mask sensitive PII fields (passwords, tokens, phone numbers, addresses)."""
    if not isinstance(text, str):
        text = str(text)
    for pattern, repl in PATTERNS:
        text = pattern.sub(repl, text)
    return text


class PIIMaskingFilter(logging.Filter):
    """Filter that intercepts log records and redacts sensitive PII from message and arguments."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = mask_pii(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: mask_pii(v) if isinstance(v, str) else v for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple(mask_pii(a) if isinstance(a, str) else a for a in record.args)
        return True


class JSONFormatter(logging.Formatter):
    """Formats log records as structured single-line JSON with PII masking."""

    def format(self, record: logging.LogRecord) -> str:
        req_id = getattr(record, "request_id", None) or request_id_var.get("")
        msg = record.getMessage()
        if isinstance(msg, str):
            msg = mask_pii(msg)

        data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": msg,
        }
        if req_id:
            data["request_id"] = req_id

        for attr in ("method", "path", "status_code", "duration_ms", "client_ip", "error"):
            val = getattr(record, attr, None)
            if val is not None:
                data[attr] = val

        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)

        return json.dumps(data)


class ErrorReporter:
    """Error reporting hook registry and circular error buffer."""

    def __init__(self, max_history: int = 50) -> None:
        self.hooks: list[Callable[[Exception, dict[str, Any]], None]] = []
        self.history: list[dict[str, Any]] = []
        self.max_history = max_history

    def register_hook(self, hook: Callable[[Exception, dict[str, Any]], None]) -> None:
        self.hooks.append(hook)

    def report_error(self, exc: Exception, context: dict[str, Any] | None = None) -> dict[str, Any]:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "exception_type": type(exc).__name__,
            "message": mask_pii(str(exc)),
            "traceback": mask_pii(traceback.format_exc()),
            "context": context or {},
        }
        self.history.append(entry)
        if len(self.history) > self.max_history:
            self.history.pop(0)

        for hook in self.hooks:
            try:
                hook(exc, context or {})
            except Exception as hook_err:
                log = logging.getLogger("resqsync.error_reporter")
                log.warning("Error hook failed: %s", hook_err)

        return entry

    def get_recent_errors(self, limit: int = 20) -> list[dict[str, Any]]:
        return list(reversed(self.history[-limit:]))

    def clear(self) -> None:
        self.history.clear()


_error_reporter = ErrorReporter()


def get_error_reporter() -> ErrorReporter:
    return _error_reporter


def log_structured(
    level: str,
    message: str,
    request_id: str = "",
    **extra: Any,
) -> None:
    """Emit a structured log message under logger 'resqsync.access'."""
    logger = logging.getLogger("resqsync.access")
    num_level = getattr(logging, level.upper(), logging.INFO)
    extra_dict = {"request_id": request_id, **extra}
    logger.log(num_level, message, extra=extra_dict)


def setup_pii_logging():
    """Attach the PII masking filter to all primary loggers and configure JSON formatter for structured logs."""
    pii_filter = PIIMaskingFilter()
    for name in ("", "resqsync", "resqsync.access", "uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        logger = logging.getLogger(name)
        if not any(isinstance(f, PIIMaskingFilter) for f in logger.filters):
            logger.addFilter(pii_filter)

    # Attach JSON formatter to resqsync.access logger
    access_logger = logging.getLogger("resqsync.access")
    access_logger.setLevel(logging.INFO)
    if not any(isinstance(getattr(h, "formatter", None), JSONFormatter) for h in access_logger.handlers):
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        handler.setFormatter(JSONFormatter())
        handler.addFilter(pii_filter)
        access_logger.addHandler(handler)
        access_logger.propagate = False
