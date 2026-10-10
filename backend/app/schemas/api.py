from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["admin", "crisis-manager", "resource-coordinator", "viewer", "help-seeker"]


class In(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class RegisterIn(In):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    phone: str | None = Field(default=None, max_length=30)


class LoginIn(In):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class PasswordIn(In):
    current: str = Field(min_length=1, max_length=128)
    new: str = Field(min_length=1, max_length=128)


class ForgotIn(In):
    email: EmailStr


class ResetIn(In):
    token: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=1, max_length=128)


class PreferencesIn(In):
    email: bool
    sms: bool
    push: bool
    phone: str | None = Field(default=None, max_length=30)


class PhoneOtpSendIn(In):
    phone: str | None = Field(default=None, max_length=30)


class PhoneOtpVerifyIn(In):
    code: str | None = Field(default=None, min_length=4, max_length=10)
    otp: str | None = Field(default=None, min_length=4, max_length=10)

    @property
    def value(self) -> str:
        return (self.code or self.otp or "").strip()


class PushSubscriptionIn(In):
    subscription: str = Field(min_length=10, max_length=4000)


class UserCreateIn(In):
    name: str = Field(min_length=1, max_length=65)
    email: EmailStr
    organization: str = Field(min_length=1, max_length=75)
    role: Role
    password: str | None = Field(default=None, max_length=128)


class UserPatchIn(In):
    role: Role | None = None
    status: Literal["active", "disabled"] | None = None
    reset_password: bool = False


class CrisisIn(In):
    title: str = Field(min_length=1, max_length=90)
    city: str = Field(min_length=1, max_length=60)
    region: str = Field(min_length=1, max_length=60)
    category: str
    severity: int = Field(ge=1, le=5)
    status: Literal["active", "escalating"] = "active"
    population: int = Field(ge=0, le=1_000_000)
    lat: float
    lng: float


class CrisisPatchIn(In):
    status: Literal["active", "escalating", "resolved"] | None = None
    severity: int | None = Field(default=None, ge=1, le=5)
    category: str | None = None


class ResourceIn(In):
    name: str = Field(min_length=1, max_length=80)
    type: str
    total: int = Field(ge=1, le=1_000_000)
    unit: str = Field(min_length=1, max_length=30)
    cost: int = Field(ge=0, le=10_000_000)
    organization: str = Field(min_length=1, max_length=70)
    capability: str = Field(min_length=1, max_length=350)


class ResourcePatchIn(In):
    total: int | None = Field(default=None, ge=1, le=1_000_000)
    name: str | None = Field(default=None, min_length=1, max_length=80)
    capability: str | None = Field(default=None, min_length=1, max_length=350)
    cost: int | None = Field(default=None, ge=0, le=10_000_000)


class AllocationIn(In):
    resource_id: str = Field(alias="resourceId")
    crisis_id: str = Field(alias="crisisId")
    quantity: int = Field(ge=1, le=1_000_000)
    reason: str = Field(min_length=1, max_length=250)
    override: bool = False
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, populate_by_name=True)


class ReleaseIn(In):
    crisis_id: str = Field(alias="crisisId")
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class DemandIn(In):
    resource_id: str = Field(alias="resourceId")
    crisis_id: str = Field(alias="crisisId")
    quantity: int = Field(ge=1, le=1_000_000)
    reason: str = Field(min_length=1, max_length=200)
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, populate_by_name=True)


class NegotiationIn(In):
    resource_id: str = Field(alias="resourceId")
    proposal: str = Field(min_length=5, max_length=350)
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, populate_by_name=True)


class MessageIn(In):
    channel: str = Field(min_length=1, max_length=40)
    text: str = Field(min_length=2, max_length=1200)


class SimulationIn(In):
    resource_id: str = Field(alias="resourceId")
    capacity: int = Field(ge=0, le=1_000_000)
    cost: int = Field(ge=0, le=10_000_000)
    weight: int = Field(ge=20, le=90)
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class HelpRequestIn(In):
    name: str = Field(min_length=1, max_length=60)
    phone: str = Field(min_length=5, max_length=20)
    address: str = Field(min_length=1, max_length=120)
    brief: str = Field(min_length=3, max_length=240)
    adults: int = Field(ge=0, le=500)
    children: int = Field(ge=0, le=500)
    photo: str | None = Field(default=None, description="data: URL of an image (JPEG/PNG/WebP/GIF), max 2 MB")


class VerifyIn(In):
    crisis_id: str | None = Field(default=None, alias="crisisId")
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class AssignRequestIn(In):
    resource_id: str = Field(alias="resourceId")
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class StockMovementIn(In):
    movement_type: Literal["stock_in", "stock_out"] = Field(alias="movementType")
    quantity: int = Field(ge=1, le=1_000_000)
    reason: str = Field(min_length=2, max_length=250)
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, populate_by_name=True)


class HelpRequestUpdateIn(In):
    text: str = Field(min_length=2, max_length=500)


class HelpRequestCancelIn(In):
    reason: str = Field(min_length=2, max_length=250)


class HelpRequestReassignIn(In):
    resource_id: str = Field(alias="resourceId")
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class DeleteAccountIn(In):
    password: str = Field(min_length=1, max_length=128)
    confirm: bool = True


class RetentionRunIn(In):
    days: int | None = Field(default=None, ge=1, le=3650, alias="retentionDays")
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
