from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, UTCDateTime, utcnow


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (Index("ix_messages_channel_at", "channel", "at"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    channel: Mapped[str] = mapped_column(String(40), nullable=False)  # network | decisions | <crisis id>
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author: Mapped[str] = mapped_column(String(80), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    channel: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    content_type: Mapped[str] = mapped_column(String(80), nullable=False)
    storage_name: Mapped[str] = mapped_column(String(80), nullable=False)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author: Mapped[str] = mapped_column(String(80), nullable=False)
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String(30), nullable=False, default="In-app")
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow, index=True)


class NotificationRead(Base):
    __tablename__ = "notification_reads"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    notification_id: Mapped[str] = mapped_column(ForeignKey("notifications.id", ondelete="CASCADE"), primary_key=True)


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow, index=True)
    actor: Mapped[str] = mapped_column(String(80), nullable=False)
    type: Mapped[str] = mapped_column(String(80), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)


class Negotiation(Base):
    __tablename__ = "negotiations"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    proposal: Mapped[str] = mapped_column(String(350), nullable=False)
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow, index=True)
    actor: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(12), nullable=False, default="pending")  # pending | resolved
    agreed_by: Mapped[str | None] = mapped_column(String(80), nullable=True)


class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow, index=True)
    actor: Mapped[str] = mapped_column(String(80), nullable=False)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    resource_name: Mapped[str] = mapped_column(String(80), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    cost: Mapped[int] = mapped_column(Integer, nullable=False)
    weight: Mapped[int] = mapped_column(Integer, nullable=False)
    demand: Mapped[int] = mapped_column(Integer, nullable=False)
    covered: Mapped[int] = mapped_column(Integer, nullable=False)
    rows: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
