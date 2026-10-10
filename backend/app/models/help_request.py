from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UTCDateTime, utcnow

REQUEST_STATUSES = ("opened", "verified", "assigned", "enroute", "resolved")


class HelpRequest(Base):
    """An individual call for help (the 'help seeker' desk)."""

    __tablename__ = "help_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seq: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)  # public number: RSQ-0041
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str] = mapped_column(String(120), nullable=False)
    brief: Mapped[str] = mapped_column(Text, nullable=False)
    adults: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    children: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    photo_file: Mapped[str | None] = mapped_column(String(80), nullable=True)
    photo_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    status: Mapped[str] = mapped_column(String(12), nullable=False, default="opened", index=True)
    resource_id: Mapped[str | None] = mapped_column(ForeignKey("resources.id", ondelete="SET NULL"), nullable=True)
    crisis_id: Mapped[str | None] = mapped_column(ForeignKey("crises.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow, index=True)

    events: Mapped[list["HelpRequestEvent"]] = relationship(
        back_populates="request",
        cascade="all, delete-orphan",
        order_by="HelpRequestEvent.at, HelpRequestEvent.id",
        lazy="selectin",
    )

    @property
    def code(self) -> str:
        return f"RSQ-{self.seq:04d}"


class HelpRequestEvent(Base):
    __tablename__ = "help_request_events"
    __table_args__ = (Index("ix_hre_request_at", "request_id", "at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("help_requests.id", ondelete="CASCADE"), nullable=False)
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    actor: Mapped[str] = mapped_column(String(80), nullable=False, default="")

    request: Mapped[HelpRequest] = relationship(back_populates="events")
