from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UTCDateTime, utcnow

RESOURCE_TYPES = ("Personnel", "Equipment", "Supplies", "Facilities")


class Resource(Base):
    __tablename__ = "resources"
    __table_args__ = (CheckConstraint("total >= 1", name="ck_resource_total"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    organization: Mapped[str] = mapped_column(String(70), nullable=False)
    capability: Mapped[str] = mapped_column(Text, nullable=False, default="")
    cost: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    maintenance: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)

    allocations: Mapped[list["Allocation"]] = relationship(
        back_populates="resource", cascade="all, delete-orphan", order_by="Allocation.id", lazy="selectin"
    )
    events: Mapped[list["ResourceEvent"]] = relationship(
        back_populates="resource",
        cascade="all, delete-orphan",
        order_by="desc(ResourceEvent.at), desc(ResourceEvent.id)",
        lazy="selectin",
    )

    @property
    def used(self) -> int:
        return sum(a.quantity for a in self.allocations)

    @property
    def available(self) -> int:
        return 0 if self.maintenance else max(0, self.total - self.used)


class ResourceEvent(Base):
    """Usage history (kind='history') and maintenance log (kind='maintenance')."""

    __tablename__ = "resource_events"
    __table_args__ = (Index("ix_resource_events_resource_at", "resource_id", "at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    kind: Mapped[str] = mapped_column(String(12), nullable=False, default="history")
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    actor: Mapped[str] = mapped_column(String(80), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    resource: Mapped[Resource] = relationship(back_populates="events")


class Allocation(Base):
    """Units of a resource committed to either an incident or an individual help request."""

    __tablename__ = "allocations"
    __table_args__ = (
        CheckConstraint("quantity >= 1", name="ck_allocation_quantity"),
        CheckConstraint("(crisis_id IS NOT NULL) <> (help_request_id IS NOT NULL)", name="ck_allocation_target"),
        UniqueConstraint("resource_id", "crisis_id", name="uq_allocation_resource_crisis"),
        UniqueConstraint("resource_id", "help_request_id", name="uq_allocation_resource_request"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    crisis_id: Mapped[str | None] = mapped_column(
        ForeignKey("crises.id", ondelete="CASCADE"), nullable=True, index=True
    )
    help_request_id: Mapped[int | None] = mapped_column(
        ForeignKey("help_requests.id", ondelete="CASCADE"), nullable=True, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    actor: Mapped[str] = mapped_column(String(80), nullable=False)

    resource: Mapped[Resource] = relationship(back_populates="allocations")


class Demand(Base):
    """A pending (unfilled) request for units of a resource on behalf of an incident."""

    __tablename__ = "demands"
    __table_args__ = (
        CheckConstraint("quantity >= 1", name="ck_demand_quantity"),
        UniqueConstraint("resource_id", "crisis_id", name="uq_demand_resource_crisis"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    crisis_id: Mapped[str] = mapped_column(ForeignKey("crises.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow, onupdate=utcnow)
