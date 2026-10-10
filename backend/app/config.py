"""Runtime configuration, read from environment variables (and an optional backend/.env file)."""

from __future__ import annotations

import os
import secrets
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BACKEND_DIR.parent


def _load_dotenv(path: Path) -> None:
    """Tiny .env loader. Real environment variables always win."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        os.environ.setdefault(key, value)


def _bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, "") or default)
    except ValueError:
        return default


def _dev_secret() -> str:
    """Stable per-checkout secret for development so sessions survive restarts."""
    path = BACKEND_DIR / ".dev_secret"
    try:
        if path.is_file():
            value = path.read_text(encoding="utf-8").strip()
            if len(value) >= 32:
                return value
        value = secrets.token_urlsafe(48)
        path.write_text(value, encoding="utf-8")
        return value
    except OSError:
        return secrets.token_urlsafe(48)


@dataclass(frozen=True)
class Settings:
    env: str = "development"  # development | production | test
    database_url: str = f"sqlite:///{BACKEND_DIR / 'resqsync.db'}"
    secret_key: str = ""
    access_token_minutes: int = 60 * 12
    cookie_name: str = "resqsync_session"
    cookie_secure: bool = False
    cors_origins: tuple[str, ...] = ()
    upload_dir: Path = BACKEND_DIR / "uploads"
    max_attachment_bytes: int = 5 * 1024 * 1024
    max_photo_bytes: int = 2 * 1024 * 1024
    seed_demo_data: bool = True
    demo_password: str = "Resqsync#2026"
    allow_demo_reset: bool = True
    allow_registration: bool = True
    bootstrap_admin_email: str = ""
    bootstrap_admin_password: str = ""
    bootstrap_admin_name: str = "Platform Administrator"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_starttls: bool = True
    frontend_dist: Path = PROJECT_DIR / "frontend" / "dist"
    login_max_failures: int = 6
    login_window_seconds: int = 900
    redis_url: str = ""
    clamav_enabled: bool = False
    clamav_host: str = "127.0.0.1"
    clamav_port: int = 3310
    rate_limit_register: int = 10
    rate_limit_forgot: int = 5
    rate_limit_upload: int = 20
    sms_provider: str = ""  # msg91 | twilio | ""
    msg91_auth_key: str = ""
    msg91_sender_id: str = ""
    msg91_template_id: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_claim_email: str = ""
    outbox_worker_interval_seconds: int = 5
    data_retention_days: int = 0
    extra: dict = field(default_factory=dict)

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @property
    def email_enabled(self) -> bool:
        return bool(self.smtp_host and self.smtp_from)

    @property
    def sms_enabled(self) -> bool:
        if self.sms_provider == "msg91":
            return bool(self.msg91_auth_key)
        if self.sms_provider == "twilio":
            return bool(self.twilio_account_sid and self.twilio_auth_token and self.twilio_from_number)
        return False

    @property
    def push_enabled(self) -> bool:
        return bool(self.vapid_public_key and self.vapid_private_key and self.vapid_claim_email)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    _load_dotenv(BACKEND_DIR / ".env")
    env = os.environ.get("ENV", "development").strip().lower()
    production = env == "production"

    secret = os.environ.get("SECRET_KEY", "").strip()
    if production and len(secret) < 32:
        raise RuntimeError("SECRET_KEY must be set to a random string of at least 32 characters when ENV=production.")
    if not secret:
        secret = _dev_secret() if env == "development" else secrets.token_urlsafe(48)

    demo_password = os.environ.get("SEED_DEMO_PASSWORD", "").strip()
    seed_default = not production
    seed_demo = _bool("SEED_DEMO_DATA", seed_default)
    if production and seed_demo and not demo_password:
        raise RuntimeError(
            "Refusing to seed demo accounts in production with the built-in demo password. Set SEED_DEMO_PASSWORD or SEED_DEMO_DATA=false."
        )

    origins = tuple(o.strip().rstrip("/") for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip())
    return Settings(
        env=env,
        database_url=os.environ.get("DATABASE_URL", Settings.database_url),
        secret_key=secret,
        access_token_minutes=_int("ACCESS_TOKEN_MINUTES", Settings.access_token_minutes),
        cookie_secure=_bool("COOKIE_SECURE", production),
        cors_origins=origins,
        upload_dir=Path(os.environ.get("UPLOAD_DIR", str(Settings.upload_dir))),
        seed_demo_data=seed_demo,
        demo_password=demo_password or Settings.demo_password,
        allow_demo_reset=_bool("ALLOW_DEMO_RESET", not production),
        allow_registration=_bool("ALLOW_REGISTRATION", True),
        bootstrap_admin_email=os.environ.get("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower(),
        bootstrap_admin_password=os.environ.get("BOOTSTRAP_ADMIN_PASSWORD", ""),
        bootstrap_admin_name=os.environ.get("BOOTSTRAP_ADMIN_NAME", Settings.bootstrap_admin_name),
        smtp_host=os.environ.get("SMTP_HOST", "").strip(),
        smtp_port=_int("SMTP_PORT", 587),
        smtp_user=os.environ.get("SMTP_USER", "").strip(),
        smtp_password=os.environ.get("SMTP_PASSWORD", ""),
        smtp_from=os.environ.get("SMTP_FROM", "").strip(),
        smtp_starttls=_bool("SMTP_STARTTLS", True),
        frontend_dist=Path(os.environ.get("FRONTEND_DIST", str(Settings.frontend_dist))),
        login_max_failures=_int("LOGIN_MAX_FAILURES", Settings.login_max_failures),
        login_window_seconds=_int("LOGIN_WINDOW_SECONDS", Settings.login_window_seconds),
        redis_url=os.environ.get("REDIS_URL", "").strip(),
        clamav_enabled=_bool("CLAMAV_ENABLED", False),
        clamav_host=os.environ.get("CLAMAV_HOST", "127.0.0.1").strip(),
        clamav_port=_int("CLAMAV_PORT", 3310),
        rate_limit_register=_int("RATE_LIMIT_REGISTER", Settings.rate_limit_register),
        rate_limit_forgot=_int("RATE_LIMIT_FORGOT", Settings.rate_limit_forgot),
        rate_limit_upload=_int("RATE_LIMIT_UPLOAD", Settings.rate_limit_upload),
        sms_provider=os.environ.get("SMS_PROVIDER", "").strip().lower(),
        msg91_auth_key=os.environ.get("MSG91_AUTH_KEY", "").strip(),
        msg91_sender_id=os.environ.get("MSG91_SENDER_ID", "").strip(),
        msg91_template_id=os.environ.get("MSG91_TEMPLATE_ID", "").strip(),
        twilio_account_sid=os.environ.get("TWILIO_ACCOUNT_SID", "").strip(),
        twilio_auth_token=os.environ.get("TWILIO_AUTH_TOKEN", "").strip(),
        twilio_from_number=os.environ.get("TWILIO_FROM_NUMBER", "").strip(),
        vapid_public_key=os.environ.get("VAPID_PUBLIC_KEY", "").strip(),
        vapid_private_key=os.environ.get("VAPID_PRIVATE_KEY", "").strip(),
        vapid_claim_email=os.environ.get("VAPID_CLAIM_EMAIL", "").strip(),
        outbox_worker_interval_seconds=_int("OUTBOX_WORKER_INTERVAL_SECONDS", Settings.outbox_worker_interval_seconds),
        data_retention_days=_int("DATA_RETENTION_DAYS", Settings.data_retention_days),
    )
