"""Privacy and data governance services: data retention, user anonymisation, account deletion, and data export."""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.database import iso, utcnow
from app.errors import DomainError
from app.models import (
    AuditLog,
    HelpRequest,
    HelpRequestEvent,
    OutboxMessage,
    PasswordResetToken,
    User,
    UserSession,
)
from app.roles import ADMIN
from app.security import Actor, actor_of, verify_password
from app.services.common import audit


def anonymise_help_request_record(
    db: Session, req: HelpRequest, upload_dir: Path | None = None, reason_event: str = "Personal data anonymised"
) -> None:
    """Anonymises identifiable attributes on a help request and removes uploaded photo files."""
    if upload_dir and req.photo_file:
        try:
            photo_path = upload_dir / req.photo_file
            if photo_path.is_file():
                photo_path.unlink(missing_ok=True)
        except OSError:
            pass
    req.name = "[Anonymised]"
    req.phone = "***"
    req.address = "[Anonymised]"
    req.photo_file = None
    req.photo_type = None
    db.add(HelpRequestEvent(request_id=req.id, label=reason_event, actor="Privacy Governance", at=utcnow()))


def anonymise_user(db: Session, admin_actor: Actor, target_user: User, upload_dir: Path | None = None) -> User:
    """Admin-initiated privacy erasure for a user. Scrubs PII, disables account, revokes sessions, and preserves audit trail."""
    if admin_actor.id is not None and admin_actor.id == target_user.id:
        raise DomainError("You cannot anonymise your own administrator account.", 409)

    admins = db.scalar(select(func.count(User.id)).where(User.role == ADMIN, User.status == "active")) or 0
    if target_user.role == ADMIN and target_user.active and admins <= 1:
        raise DomainError("At least one active admin must remain.", 409)

    # Anonymise user profile
    orig_name = target_user.name
    target_user.name = "[Anonymised User]"
    target_user.email = f"anon-{target_user.id}@anonymised.local"
    target_user.phone = None
    target_user.phone_verified = False
    target_user.phone_otp_hash = None
    target_user.phone_otp_expires_at = None
    target_user.push_subscription = None
    target_user.pref_email = False
    target_user.pref_sms = False
    target_user.pref_push = False
    target_user.status = "disabled"
    target_user.token_version += 1

    # Revoke sessions
    db.execute(update(UserSession).where(UserSession.user_id == target_user.id).values(revoked=True))

    # Invalidate reset tokens
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == target_user.id))

    # Anonymise associated help requests
    owned_requests = db.scalars(select(HelpRequest).where(HelpRequest.owner_id == target_user.id)).all()
    for req in owned_requests:
        anonymise_help_request_record(
            db, req, upload_dir=upload_dir, reason_event="Personal data anonymised on privacy erasure request"
        )

    audit(
        db,
        admin_actor,
        "User anonymised",
        f"User id={target_user.id} ({orig_name}) anonymised on privacy erasure request.",
    )
    return target_user


def self_delete_user(db: Session, user: User, password: str, upload_dir: Path | None = None) -> None:
    """User-initiated account deletion and data scrubbing. Invalids sessions and anonymises requests."""
    if not verify_password(password, user.password_hash):
        raise HTTPException(403, "The password provided is incorrect.")

    admins = db.scalar(select(func.count(User.id)).where(User.role == ADMIN, User.status == "active")) or 0
    if user.role == ADMIN and user.active and admins <= 1:
        raise DomainError("Cannot delete account: at least one active administrator must remain.", 409)

    user_actor = actor_of(user)

    user.name = "[Deleted User]"
    user.email = f"deleted-{user.id}@anonymised.local"
    user.phone = None
    user.phone_verified = False
    user.phone_otp_hash = None
    user.phone_otp_expires_at = None
    user.push_subscription = None
    user.pref_email = False
    user.pref_sms = False
    user.pref_push = False
    user.status = "disabled"
    user.token_version += 1

    db.execute(update(UserSession).where(UserSession.user_id == user.id).values(revoked=True))
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id))

    owned_requests = db.scalars(select(HelpRequest).where(HelpRequest.owner_id == user.id)).all()
    for req in owned_requests:
        anonymise_help_request_record(
            db, req, upload_dir=upload_dir, reason_event="Personal data anonymised on user account self-deletion"
        )

    audit(db, user_actor, "Account deleted", f"User id={user.id} self-deleted account and requested data erasure.")


def export_user_data(db: Session, user: User) -> dict:
    """Produces a structured JSON export of all personal data held for the user."""
    requests = db.scalars(
        select(HelpRequest).where(HelpRequest.owner_id == user.id).order_by(HelpRequest.created_at.desc())
    ).all()
    outbox = db.scalars(
        select(OutboxMessage).where(OutboxMessage.user_id == user.id).order_by(OutboxMessage.at.desc())
    ).all()
    audit_entries = db.scalars(select(AuditLog).where(AuditLog.actor_id == user.id).order_by(AuditLog.at.desc())).all()
    sessions = db.scalars(
        select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.created_at.desc())
    ).all()

    return {
        "exportFormat": "ResQSync-Data-Portability-v1",
        "exportedAt": iso(utcnow()),
        "platform": "ResQSync Emergency Resource Platform",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "phoneVerified": user.phone_verified,
            "role": user.role,
            "organization": user.organization,
            "status": user.status,
            "createdAt": iso(user.created_at),
            "lastLoginAt": iso(user.last_login_at),
            "preferences": {
                "email": user.pref_email,
                "sms": user.pref_sms,
                "push": user.pref_push,
            },
        },
        "helpRequests": [
            {
                "id": r.code,
                "name": r.name,
                "phone": r.phone,
                "address": r.address,
                "brief": r.brief,
                "adults": r.adults,
                "children": r.children,
                "status": r.status,
                "resourceId": r.resource_id,
                "crisisId": r.crisis_id,
                "createdAt": iso(r.created_at),
                "events": [{"at": iso(e.at), "label": e.label, "actor": e.actor} for e in r.events],
            }
            for r in requests
        ],
        "notifications": [
            {
                "id": m.id,
                "channel": m.channel,
                "recipient": m.recipient,
                "subject": m.subject,
                "body": m.body,
                "status": m.status,
                "at": iso(m.at),
                "deliveredAt": iso(m.delivered_at) if m.delivered_at else None,
            }
            for m in outbox
        ],
        "auditTrail": [
            {
                "id": a.id,
                "at": iso(a.at),
                "action": a.action,
                "detail": a.detail,
            }
            for a in audit_entries
        ],
        "sessions": [
            {
                "id": s.id,
                "ipAddress": s.ip_address,
                "userAgent": s.user_agent,
                "createdAt": iso(s.created_at),
                "lastSeenAt": iso(s.last_seen_at),
                "revoked": s.revoked,
            }
            for s in sessions
        ],
        "disclaimer": "This portable export contains all identifiable data currently associated with your account in the active ResQSync database.",
    }


def run_retention_cleanup(
    db: Session, retention_days: int, upload_dir: Path | None = None, actor_name: str = "System Retention"
) -> dict:
    """Auto-anonymises resolved help requests older than retention_days."""
    if retention_days <= 0:
        return {
            "scanned": 0,
            "anonymised": 0,
            "retentionDays": retention_days,
            "message": "Data retention auto-anonymisation is currently disabled (retention_days <= 0).",
        }

    cutoff = utcnow() - timedelta(days=retention_days)
    stmt = select(HelpRequest).where(
        HelpRequest.status == "resolved", HelpRequest.created_at <= cutoff, HelpRequest.name != "[Anonymised]"
    )
    resolved_old_requests = db.scalars(stmt).all()
    count = 0
    for req in resolved_old_requests:
        anonymise_help_request_record(
            db,
            req,
            upload_dir=upload_dir,
            reason_event=f"Personal data auto-anonymised per {retention_days}-day retention policy",
        )
        count += 1

    if count > 0:
        audit(
            db,
            Actor(id=None, name=actor_name, role="system"),
            "Data retention cleanup",
            f"Auto-anonymised {count} resolved help requests older than {retention_days} days.",
        )

    return {
        "scanned": len(resolved_old_requests),
        "anonymised": count,
        "retentionDays": retention_days,
        "cutoff": iso(cutoff),
        "message": f"Successfully processed retention policy: {count} request(s) anonymised.",
    }


def get_privacy_notice() -> dict:
    """Returns technical data governance disclosure information."""
    data_collected = [
        {
            "category": "Identity Information",
            "name": "Identity Information",
            "items": ["Full Name", "Contact Phone Number", "E-mail Address"],
            "description": "Full Name, Contact Phone Number, E-mail Address — Used for account creation, identity authentication, notification dispatch, and crisis help seeker verification.",
            "purpose": "Account creation, identity authentication, notification dispatch, and crisis help seeker verification.",
        },
        {
            "category": "Emergency & Crisis Details",
            "name": "Emergency & Crisis Details",
            "items": [
                "Physical Address / Location",
                "Urgent Needs & Description",
                "Family Demographics (Adults & Children counts)",
                "Verification Incident Photos",
            ],
            "description": "Physical Address / Location, Urgent Needs & Description, Family Demographics, Verification Photos — Used for rescue prioritization, unit dispatch coordination, and relief payload allocation.",
            "purpose": "Rescue prioritization, unit dispatch coordination, and relief payload allocation.",
        },
        {
            "category": "Operational & Security Logs",
            "name": "Operational & Security Logs",
            "items": ["Client IP Address", "Browser User-Agent", "Session Tokens", "Audit Trail Action Logs"],
            "description": "Client IP Address, Browser User-Agent, Session Tokens, Audit Trail Action Logs — Used for session security, rate-limiting, brute-force protection, and immutable operational auditing.",
            "purpose": "Session security, rate-limiting, brute-force protection, and immutable operational auditing.",
        },
    ]
    gov_controls = [
        {
            "control": "Data Portability (Download My Data)",
            "description": "Any registered user or help seeker can instantly export all their stored profile data, help requests, notification history, and audit entries as structured JSON.",
        },
        {
            "control": "Right to Erasure (Delete My Account)",
            "description": "Users can self-delete their accounts. This scrubs all PII, scrambles email and name, clears phone records, invalidates all active sessions, and anonymises associated help requests.",
        },
        {
            "control": "Data Retention Setting",
            "description": "Configurable automated data retention (DATA_RETENTION_DAYS). When active, resolved help requests older than N days have their names, phone numbers, addresses, and uploaded photos automatically erased.",
        },
        {
            "control": "Administrative On-Demand Anonymisation",
            "description": "Designated administrators can anonymise any user on request in response to data erasure notices, keeping operational audit trails intact without retaining PII.",
        },
        {
            "control": "Immutable Audit Trail",
            "description": "Audit logs are strictly write-only / append-only. No modification (PUT/PATCH) or deletion (DELETE) endpoints exist on the audit log.",
        },
    ]
    disclaimer_text = "This document outlines the operational data architecture and privacy governance technical controls of ResQSync. It is intended for technical demonstration and transparency. It does NOT constitute formal legal advice or a certified compliance guarantee (under GDPR, DPDP Act 2023, HIPAA, or other jurisdictions). Deploying organizations must conduct formal legal and regulatory review prior to live operational deployment."

    return {
        "title": "ResQSync Privacy & Data Governance Notice",
        "lastUpdated": "2026-10-10",
        "purpose": "Emergency response coordination, life-safety resource dispatch, and operational conflict resolution.",
        "purposes": [
            "Emergency response coordination, life-safety resource dispatch, and operational conflict resolution.",
            "User identity authentication and multi-factor session validation.",
            "Resource allocation and automated conflict resolution recommendations.",
            "Immutable audit trail logging and system security enforcement.",
        ],
        "categories": data_collected,
        "dataCollected": data_collected,
        "governanceControls": gov_controls,
        "governance_controls": [f"{gc['control']}: {gc['description']}" for gc in gov_controls],
        "retention_policy": "Resolved emergency requests older than the configured threshold (DATA_RETENTION_DAYS) have names, phones, addresses, and photos automatically sanitized.",
        "retentionPolicy": "Resolved emergency requests older than the configured threshold (DATA_RETENTION_DAYS) have names, phones, addresses, and photos automatically sanitized.",
        "disclaimer": disclaimer_text,
        "legalDisclaimer": disclaimer_text,
    }
