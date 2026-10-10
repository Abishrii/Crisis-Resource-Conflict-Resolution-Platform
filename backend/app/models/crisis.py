from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UTCDateTime, utcnow

CATEGORIES = ("Flood", "Fire", "Medical", "Landslide", "Storm", "Earthquake", "Other")
CRISIS_STATUSES = ("active", "escalating", "resolved")


class Crisis(Base):
    __tablename__ = "crises"
    __table_args__ = (
        CheckConstraint("severity BETWEEN 1 AND 5", name="ck_crisis_severity"),
        CheckConstraint("status IN ('active','escalating','resolved')", name="ck_crisis_status"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(90), nullable=False)
    city: Mapped[str] = mapped_column(String(60), nullable=False)
    region: Mapped[str] = mapped_column(String(60), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    severity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    population: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    response_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow, index=True)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    events: Mapped[list["CrisisEvent"]] = relationship(
        back_populates="crisis",
        cascade="all, delete-orphan",
        order_by="desc(CrisisEvent.at), desc(CrisisEvent.id)",
        lazy="selectin",
    )


class CrisisEvent(Base):
    __tablename__ = "crisis_events"
    __table_args__ = (Index("ix_crisis_events_crisis_at", "crisis_id", "at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    crisis_id: Mapped[str] = mapped_column(ForeignKey("crises.id", ondelete="CASCADE"), nullable=False)
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    actor: Mapped[str] = mapped_column(String(80), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    crisis: Mapped[Crisis] = relationship(back_populates="events")
