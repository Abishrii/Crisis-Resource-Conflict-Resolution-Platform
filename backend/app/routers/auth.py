from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import OutboxMessage, PasswordResetToken, User, UserSession
from app.roles import ALL_ROLES
from app.schemas.api import (
    DeleteAccountIn,
    DemoLoginIn,
    ForgotIn,
    LoginIn,
    PasswordIn,
    PhoneOtpSendIn,
    PhoneOtpVerifyIn,
    PreferencesIn,
    PushSubscriptionIn,
    RegisterIn,
    ResetIn,
)
from app.security import (
    actor_of,
    clear_session_cookie,
    create_token,
    current_user,
    current_user_w,
    get_db,
    get_write_db,
    hash_password,
    require,
    set_session_cookie,
    validate_password_strength,
    verify_password,
)
from app.services.common import audit, commit, deliver_outbox
from app.services.privacy import export_user_data, self_delete_user
from app.services.seed import demo_accounts
from app.services.serializers import me_json

router = APIRouter(prefix="/api", tags=["Auth"])


@router.get("/meta")
def meta(request: Request, db: Session = Depends(get_db)):
    s = request.app.state.settings
    demo = None
    if s.demo_login and not s.is_production:
        users = db.scalars(select(User).where(User.status == "active").order_by(User.id)).all()
        existing = {u.email.lower(): u for u in users}
        # Prefer the canonical demo account for each role, then fall back to any existing account.
        chosen: dict[str, User] = {}
        for candidate in demo_accounts(s):
            user = existing.get(candidate["email"].lower())
            if user and user.role not in chosen:
                chosen[user.role] = user
        for user in users:
            chosen.setdefault(user.role, user)
        accounts = [
            {"name": chosen[role].name, "email": chosen[role].email, "role": role}
            for role in ALL_ROLES
            if role in chosen
        ]
        if accounts:
            demo = {"accounts": accounts}
    return {
        "name": "ResQSync",
        "environment": s.env,
        "allowRegistration": s.allow_registration,
        "demo": demo,
    }


@router.post("/auth/register")
def register(body: RegisterIn, request: Request, response: Response, db: Session = Depends(get_write_db)):
    """Self-service sign-up always creates a help-seeker. Staff accounts are created by an admin."""
    s = request.app.state.settings
    if not s.allow_registration:
        raise HTTPException(403, "Self-registration is disabled. Ask an administrator for an account.")
    ip = request.client.host if request.client else "?"
    limiter = request.app.state.limiter
    allowed, retry_after = limiter.is_allowed(f"register:{ip}", s.rate_limit_register, 3600)
    if not allowed:
        raise HTTPException(
            429, "Too many registration attempts. Please try again later.", headers={"Retry-After": str(retry_after)}
        )

    email = body.email.lower()
    problem = validate_password_strength(body.password, email)
    if problem:
        raise HTTPException(422, problem)
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(409, "An account with that e-mail already exists.")

    now = datetime.now(timezone.utc)
    user = User(
        name=body.name,
        email=email,
        password_hash=hash_password(body.password),
        role="help-seeker",
        organization="Community",
        phone=body.phone,
        last_login_at=now,
    )
    db.add(user)
    db.flush()

    session_id = uuid.uuid4().hex
    user_agent = request.headers.get("user-agent", "")[:255]
    sess = UserSession(
        id=session_id,
        user_id=user.id,
        token_version=user.token_version,
        ip_address=ip,
        user_agent=user_agent,
        created_at=now,
        last_seen_at=now,
        revoked=False,
    )
    db.add(sess)

    audit(db, actor_of(user), "Account registered", f"{user.name} registered as a help seeker.")
    commit(request, db)
    set_session_cookie(response, create_token(user, s, session_id=session_id), s)
    return {"user": me_json(user)}


def _sign_in(
    db: Session,
    user: User,
    request: Request,
    response: Response,
    settings,
    action: str = "Signed in",
    detail: str = "",
) -> str:
    now = datetime.now(timezone.utc)
    user.last_login_at = now
    session_id = uuid.uuid4().hex
    ip = request.client.host if request.client else "?"
    user_agent = request.headers.get("user-agent", "")[:255]
    db.add(
        UserSession(
            id=session_id,
            user_id=user.id,
            token_version=user.token_version,
            ip_address=ip,
            user_agent=user_agent,
            created_at=now,
            last_seen_at=now,
            revoked=False,
        )
    )
    audit(db, actor_of(user), action, detail)
    db.commit()
    token = create_token(user, settings, session_id=session_id)
    set_session_cookie(response, token, settings)
    return token


@router.post("/auth/login")
def login(body: LoginIn, request: Request, response: Response, db: Session = Depends(get_write_db)):
    s = request.app.state.settings
    throttle = request.app.state.throttle
    ip = request.client.host if request.client else "?"
    email = body.email.lower()
    if throttle.blocked(ip, email):
        raise HTTPException(429, "Too many failed sign-in attempts. Wait a few minutes and try again.")
    user = db.scalar(select(User).where(User.email == email))
    ok = verify_password(body.password, user.password_hash if user else None)
    if not user or not ok or not user.active or user.role not in ALL_ROLES:
        throttle.fail(ip, email)
        raise HTTPException(401, "Invalid e-mail or password.")
    throttle.clear(ip, email)

    token = _sign_in(db, user, request, response, s)
    return {"user": me_json(user), "token": token}


@router.post("/auth/demo-login")
def demo_login(body: DemoLoginIn, request: Request, response: Response, db: Session = Depends(get_write_db)):
    """One-click sign-in used by the evaluation-mode role cards. Disabled outside demo mode."""
    s = request.app.state.settings
    if not s.demo_login or s.is_production:
        raise HTTPException(404, "Demo sign-in is not enabled.")
    ip = request.client.host if request.client else "?"
    allowed, retry_after = request.app.state.limiter.is_allowed(f"demo-login:{ip}", 120, 3600)
    if not allowed:
        raise HTTPException(429, "Too many demo sign-in attempts.", headers={"Retry-After": str(retry_after)})

    canonical = next((account for account in demo_accounts(s) if account["role"] == body.role), None)
    user = None
    if canonical:
        user = db.scalar(select(User).where(User.email == canonical["email"].lower()))
    if not user or not user.active:
        user = db.scalar(select(User).where(User.role == body.role, User.status == "active").order_by(User.id))
    if not user or user.role not in ALL_ROLES:
        raise HTTPException(404, "Demo account is not available.")

    _sign_in(db, user, request, response, s, "Signed in (demo)", f"Demo role: {body.role}.")
    return {"user": me_json(user)}


@router.post("/auth/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_write_db)):
    current_sid = getattr(request.state, "session_id", None)
    if current_sid:
        sess = db.get(UserSession, current_sid)
        if sess:
            sess.revoked = True
            db.commit()
    clear_session_cookie(response, request.app.state.settings)
    return {"ok": True}


@router.get("/auth/me")
def me(user: User = Depends(current_user)):
    return {"user": me_json(user)}


@router.post("/auth/change-password")
def change_password(
    body: PasswordIn,
    request: Request,
    response: Response,
    user: User = Depends(current_user_w),
    db: Session = Depends(get_write_db),
):
    if not verify_password(body.current, user.password_hash):
        raise HTTPException(403, "The current password is not correct.")
    problem = validate_password_strength(body.new, user.email)
    if problem:
        raise HTTPException(422, problem)
    user.password_hash = hash_password(body.new)
    user.must_change_password = False
    user.token_version += 1  # signs out every other session
    db.execute(update(UserSession).where(UserSession.user_id == user.id).values(revoked=True))

    now = datetime.now(timezone.utc)
    ip = request.client.host if request.client else "?"
    session_id = uuid.uuid4().hex
    user_agent = request.headers.get("user-agent", "")[:255]
    new_sess = UserSession(
        id=session_id,
        user_id=user.id,
        token_version=user.token_version,
        ip_address=ip,
        user_agent=user_agent,
        created_at=now,
        last_seen_at=now,
        revoked=False,
    )
    db.add(new_sess)

    audit(db, actor_of(user), "Password changed", "")
    commit(request, db)
    set_session_cookie(
        response, create_token(user, request.app.state.settings, session_id=session_id), request.app.state.settings
    )
    return {"ok": True}


@router.post("/auth/forgot")
def forgot_password(body: ForgotIn, request: Request, db: Session = Depends(get_write_db)):
    s = request.app.state.settings
    ip = request.client.host if request.client else "?"
    limiter = request.app.state.limiter
    allowed, retry_after = limiter.is_allowed(f"forgot:{ip}", s.rate_limit_forgot, 3600)
    if not allowed:
        raise HTTPException(
            429, "Too many password reset requests. Please try again later.", headers={"Retry-After": str(retry_after)}
        )

    email = body.email.lower()
    user = db.scalar(select(User).where(User.email == email))
    if user and user.active:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        now = datetime.now(timezone.utc)
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=token_hash,
                created_at=now,
                expires_at=now + timedelta(minutes=30),
                used=False,
            )
        )
        reset_url = f"{request.base_url}?reset_token={raw_token}"
        body_text = (
            f"Hello {user.name},\n\n"
            f"A password reset was requested for your ResQSync account.\n"
            f"To set a new password, click the link or copy the token into the app:\n\n"
            f"Reset Link: {reset_url}\n"
            f"Reset Token: {raw_token}\n\n"
            f"This token is valid for 30 minutes. If you did not make this request, you can safely ignore this email."
        )
        outbox = OutboxMessage(
            user_id=user.id,
            channel="email",
            recipient=user.email,
            subject="Reset your ResQSync password",
            body=body_text,
            status="queued",
        )
        db.add(outbox)
        audit(db, actor_of(user), "Password reset requested", f"Reset token queued for {user.email}.")
        commit(request, db)
        deliver_outbox(request.app.state.db, s)
    return {"message": "If that e-mail address is registered, a password reset link has been sent."}


@router.post("/auth/reset")
def reset_password(body: ResetIn, request: Request, db: Session = Depends(get_write_db)):
    problem = validate_password_strength(body.new_password)
    if problem:
        raise HTTPException(422, problem)
    raw_token = body.token.strip()
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    reset_tok = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used.is_(False),
            PasswordResetToken.expires_at > now,
        )
    )
    if not reset_tok:
        raise HTTPException(400, "Invalid or expired password reset token.")
    user = db.get(User, reset_tok.user_id)
    if not user or not user.active:
        raise HTTPException(400, "Invalid or expired password reset token.")

    reset_tok.used = True
    user.password_hash = hash_password(body.new_password)
    user.token_version += 1
    user.must_change_password = False
    db.execute(update(UserSession).where(UserSession.user_id == user.id).values(revoked=True))
    audit(db, actor_of(user), "Password reset completed", "Password was reset via single-use reset token.")
    commit(request, db)
    return {"ok": True, "message": "Password has been reset successfully. Please sign in with your new password."}


@router.get("/auth/sessions")
def list_sessions(request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)):
    current_sid = getattr(request.state, "session_id", None)
    sessions = db.scalars(
        select(UserSession)
        .where(
            UserSession.user_id == user.id,
            UserSession.revoked.is_(False),
            UserSession.token_version == user.token_version,
        )
        .order_by(UserSession.last_seen_at.desc())
    ).all()
    return {
        "sessions": [
            {
                "id": s.id,
                "ipAddress": s.ip_address,
                "userAgent": s.user_agent,
                "createdAt": s.created_at.isoformat(),
                "lastSeenAt": s.last_seen_at.isoformat(),
                "current": s.id == current_sid,
            }
            for s in sessions
        ]
    }


@router.post("/auth/logout-all")
def logout_all(
    request: Request, response: Response, user: User = Depends(current_user_w), db: Session = Depends(get_write_db)
):
    user.token_version += 1
    db.execute(update(UserSession).where(UserSession.user_id == user.id).values(revoked=True))
    audit(db, actor_of(user), "All sessions revoked", "User signed out of all devices.")
    commit(request, db)
    clear_session_cookie(response, request.app.state.settings)
    return {"ok": True, "message": "All active sessions have been signed out."}


@router.put("/me/preferences")
def preferences(
    body: PreferencesIn, request: Request, user: User = Depends(current_user_w), db: Session = Depends(get_write_db)
):
    if body.phone is not None and body.phone != user.phone:
        user.phone = body.phone or None
        user.phone_verified = False
        user.phone_otp_hash = None
        user.phone_otp_expires_at = None
    if body.sms and not user.phone_verified:
        raise HTTPException(400, "You must verify your phone number before enabling SMS alerts.")
    user.pref_email, user.pref_sms, user.pref_push = body.email, body.sms, body.push
    audit(
        db,
        actor_of(user),
        "Notification preference updated",
        f"email: {'on' if body.email else 'off'}, sms: {'on' if body.sms else 'off'}, push: {'on' if body.push else 'off'}.",
    )
    commit(request, db)
    return {
        "preferences": {"email": user.pref_email, "sms": user.pref_sms, "push": user.pref_push},
        "phoneVerified": user.phone_verified,
    }


@router.post("/me/phone/send-otp")
def send_phone_otp(
    request: Request,
    body: PhoneOtpSendIn | None = None,
    user: User = Depends(current_user_w),
    db: Session = Depends(get_write_db),
):
    limiter = request.app.state.limiter
    allowed, retry_after = limiter.is_allowed(f"phone_otp:{user.id}", 6, 3600)
    if not allowed:
        raise HTTPException(
            429, "Too many OTP requests. Please wait before trying again.", headers={"Retry-After": str(retry_after)}
        )

    phone = (body.phone.strip() if (body and body.phone) else user.phone) or ""
    if not phone:
        raise HTTPException(400, "Please provide a valid phone number.")
    if body and body.phone and body.phone != user.phone:
        user.phone = phone
        user.phone_verified = False

    otp = f"{secrets.randbelow(900000) + 100000}"
    user.phone_otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    user.phone_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Queue OTP SMS
    outbox = OutboxMessage(
        user_id=user.id,
        channel="sms",
        recipient=user.phone,
        subject="ResQSync Verification",
        body=f"Your ResQSync verification code is {otp}. Valid for 10 minutes.",
        status="queued",
    )
    db.add(outbox)
    commit(request, db)
    res = {"ok": True, "message": "Verification code sent to your phone."}
    if not request.app.state.settings.sms_enabled:
        res["otp"] = otp
    return res


@router.post("/me/phone/verify-otp")
def verify_phone_otp(
    body: PhoneOtpVerifyIn, request: Request, user: User = Depends(current_user_w), db: Session = Depends(get_write_db)
):
    if not user.phone_otp_hash or not user.phone_otp_expires_at:
        raise HTTPException(400, "No pending verification code. Request a new OTP.")
    if datetime.now(timezone.utc) > user.phone_otp_expires_at:
        user.phone_otp_hash = None
        user.phone_otp_expires_at = None
        db.commit()
        raise HTTPException(400, "Verification code has expired. Request a new OTP.")

    code_str = body.value
    if not code_str:
        raise HTTPException(400, "Verification code is required.")
    provided_hash = hashlib.sha256(code_str.encode()).hexdigest()
    if provided_hash != user.phone_otp_hash:
        raise HTTPException(400, "Invalid verification code.")

    user.phone_verified = True
    user.phone_otp_hash = None
    user.phone_otp_expires_at = None
    audit(db, actor_of(user), "Phone verified", f"Phone {user.phone} verified successfully.")
    commit(request, db)
    return {"ok": True, "message": "Phone number verified successfully.", "phoneVerified": True}


@router.post("/me/push-subscription")
def save_push_subscription(
    body: PushSubscriptionIn,
    request: Request,
    user: User = Depends(current_user_w),
    db: Session = Depends(get_write_db),
):
    user.push_subscription = body.subscription
    user.pref_push = True
    audit(db, actor_of(user), "Push subscription enabled", "")
    commit(request, db)
    return {"ok": True, "message": "Web push subscription saved."}


@router.get("/me/outbox")
def my_outbox(user: User = Depends(current_user), db: Session = Depends(get_db)):
    stmt = select(OutboxMessage).where(OutboxMessage.user_id == user.id).order_by(OutboxMessage.id.desc()).limit(50)
    messages = db.scalars(stmt).all()
    return {
        "messages": [
            {
                "id": m.id,
                "at": m.at.isoformat(),
                "channel": m.channel,
                "status": m.status,
                "deliveredAt": m.delivered_at.isoformat() if m.delivered_at else None,
                "error": m.error if m.status == "failed" else "",
            }
            for m in messages
        ]
    }


@router.get("/outbox")
def admin_outbox(user: User = Depends(require("users")), db: Session = Depends(get_db)):
    stmt = select(OutboxMessage).order_by(OutboxMessage.id.desc()).limit(100)
    messages = db.scalars(stmt).all()
    return {
        "messages": [
            {
                "id": m.id,
                "at": m.at.isoformat(),
                "channel": m.channel,
                "recipient": m.recipient,
                "subject": m.subject,
                "body": m.body,
                "status": m.status,
                "attempts": m.attempts,
                "maxAttempts": m.max_attempts,
                "error": m.error,
                "deliveredAt": m.delivered_at.isoformat() if m.delivered_at else None,
            }
            for m in messages
        ]
    }


@router.get("/me/data")
def download_my_data(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Data portability: returns complete JSON bundle of user profile, help requests, notifications, and logs."""
    return export_user_data(db, user)


@router.post("/me/delete-account")
def delete_my_account(
    body: DeleteAccountIn,
    request: Request,
    response: Response,
    user: User = Depends(current_user_w),
    db: Session = Depends(get_write_db),
):
    """Right to erasure: scrubs PII, invalidates active sessions, and anonymises user help requests."""
    s = request.app.state.settings
    self_delete_user(db, user, body.password, upload_dir=s.upload_dir)
    commit(request, db)
    clear_session_cookie(response, s)
    return {"ok": True, "message": "Your account and personal data have been anonymised."}
