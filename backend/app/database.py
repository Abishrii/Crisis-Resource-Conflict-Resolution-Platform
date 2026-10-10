"""Engine / session management.

SQLite is the zero-config default; set DATABASE_URL to a PostgreSQL URL for multi-process production use.

Write safety: resource allocation reads capacity and then writes, so two concurrent requests must never
both see the same free capacity. On SQLite, write sessions open with BEGIN IMMEDIATE (serialising
writers); on PostgreSQL the allocation code takes row locks with SELECT ... FOR UPDATE.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.types import TypeDecorator


class Base(DeclarativeBase):
    pass


class UTCDateTime(TypeDecorator):
    """Stores naive UTC, always returns timezone-aware UTC datetimes."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    def process_result_value(self, value, dialect):
        return value.replace(tzinfo=timezone.utc) if value is not None else None


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime | None) -> str | None:
    """ISO-8601 with millisecond precision and a trailing Z (what Date.parse in the browser expects)."""
    if value is None:
        return None
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + f"{value.microsecond // 1000:03d}Z"


def build_engine(url: str) -> Engine:
    sqlite = url.startswith("sqlite")
    kwargs: dict = {}
    if sqlite:
        kwargs["connect_args"] = {"check_same_thread": False, "timeout": 15}
    else:
        kwargs["pool_pre_ping"] = True
    engine = create_engine(url, **kwargs)

    if sqlite:

        @event.listens_for(engine, "connect")
        def _sqlite_connect(dbapi_connection, _record):  # pragma: no cover - trivial
            dbapi_connection.isolation_level = None  # we emit BEGIN ourselves (see below)
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA busy_timeout=15000")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()

        @event.listens_for(engine, "begin")
        def _sqlite_begin(conn):
            immediate = conn.get_execution_options().get("immediate", False)
            conn.exec_driver_sql("BEGIN IMMEDIATE" if immediate else "BEGIN")

    return engine


class Database:
    """Holds the engine plus read and write session factories."""

    def __init__(self, url: str):
        self.url = url
        self.engine = build_engine(url)
        self._read = sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=False)
        self._write = sessionmaker(
            bind=self.engine.execution_options(immediate=True), autoflush=False, expire_on_commit=False
        )

    def read_session(self) -> Session:
        return self._read()

    def write_session(self) -> Session:
        return self._write()

    def create_all(self) -> None:
        if self.url.startswith("postgresql"):
            try:
                import os

                from alembic.config import Config

                from alembic import command

                ini_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
                if os.path.exists(ini_path):
                    cfg = Config(ini_path)
                    cfg.set_main_option("sqlalchemy.url", self.url)
                    command.upgrade(cfg, "head")
                    return
            except Exception as e:
                import logging

                logging.getLogger("uvicorn.error").warning(
                    "Alembic auto-upgrade failed, falling back to create_all: %s", e
                )

        from sqlalchemy import inspect, text

        from app import models  # noqa: F401  (register tables)

        Base.metadata.create_all(self.engine)

        with self.engine.begin() as conn:
            inspector = inspect(conn)
            tables = inspector.get_table_names()
            if "users" in tables:
                cols = {c["name"] for c in inspector.get_columns("users")}
                if "phone_verified" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT 0"))
                if "phone_otp_hash" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone_otp_hash VARCHAR(128)"))
                if "phone_otp_expires_at" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone_otp_expires_at DATETIME"))
                if "push_subscription" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN push_subscription TEXT"))
            if "outbox" in tables:
                cols = {c["name"] for c in inspector.get_columns("outbox")}
                if "attempts" not in cols:
                    conn.execute(text("ALTER TABLE outbox ADD COLUMN attempts INTEGER DEFAULT 0"))
                if "max_attempts" not in cols:
                    conn.execute(text("ALTER TABLE outbox ADD COLUMN max_attempts INTEGER DEFAULT 3"))
                if "next_attempt_at" not in cols:
                    conn.execute(text("ALTER TABLE outbox ADD COLUMN next_attempt_at DATETIME"))
                if "delivered_at" not in cols:
                    conn.execute(text("ALTER TABLE outbox ADD COLUMN delivered_at DATETIME"))

    def dispose(self) -> None:
        self.engine.dispose()
