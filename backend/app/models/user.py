from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, UTCDateTime, utcnow


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    organization: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    phone_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    phone_otp_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    phone_otp_expires_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    push_subscription: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")  # active | disabled
    must_change_password: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pref_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pref_sms: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pref_push: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    last_login_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)

    @property
    def active(self) -> bool:
        return self.status == "active"


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False, default="")
    user_agent: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
