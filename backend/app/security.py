from __future__ import annotations

import hashlib
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request, Response
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import User, UserSession
from app.roles import PERMISSIONS, can

_hasher = PasswordHash.recommended()
# Verified when the e-mail is unknown so response time does not reveal which accounts exist.
_DUMMY_HASH = _hasher.hash("not-a-real-password")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str | None) -> bool:
    try:
        return _hasher.verify(password, hashed or _DUMMY_HASH) and hashed is not None
    except Exception:
        return False


def validate_password_strength(password: str, email: str = "") -> str | None:
    if len(password) < 10:
        return "Use at least 10 characters for the password."
    if len(password) > 128:
        return "The password is too long (128 characters maximum)."
    if password.lower() == email.lower():
        return "The password must not be the same as the e-mail address."
    if not any(c.isalpha() for c in password) or not any(c.isdigit() or not c.isalnum() for c in password):
        return "Use letters plus at least one number or symbol."
    return None


# ---------------------------------------------------------------- tokens
def create_token(user: User, settings: Settings, session_id: str | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "ver": user.token_version,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_minutes)).timestamp()),
    }
    if session_id:
        payload["jti"] = session_id
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        settings.cookie_name,
        token,
        max_age=settings.access_token_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(settings.cookie_name, path="/")


def _token_from_request(request: Request, settings: Settings) -> str | None:
    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip() or None
    return request.cookies.get(settings.cookie_name)


# ---------------------------------------------------------------- dependencies
@dataclass
class Actor:
    id: int
    name: str
    role: str
    email: str = ""
    organization: str = ""


def actor_of(user: User) -> Actor:
    return Actor(user.id, user.name, user.role, user.email, user.organization)


def get_db(request: Request):
    session = request.app.state.db.read_session()
    try:
        yield session
    finally:
        session.close()


def get_write_db(request: Request):
    session = request.app.state.db.write_session()
    try:
        yield session
    finally:
        session.close()


def _resolve_user(request: Request, db: Session) -> User:
    settings: Settings = request.app.state.settings
    token = _token_from_request(request, settings)
    if not token:
        raise HTTPException(401, "Sign in to continue.")
    try:
        claims = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id = int(claims["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(401, "Your session has expired. Sign in again.")
    user = db.get(User, user_id)
    if user is None or not user.active or user.token_version != claims.get("ver"):
        raise HTTPException(401, "Your session is no longer valid. Sign in again.")
    jti = claims.get("jti")
    if jti:
        session_record = db.get(UserSession, jti)
        if session_record:
            if session_record.revoked or session_record.token_version != user.token_version:
                raise HTTPException(401, "Your session is no longer valid. Sign in again.")
        request.state.session_id = jti
    return user


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    return _resolve_user(request, db)


def current_user_w(request: Request, db: Session = Depends(get_write_db)) -> User:
    return _resolve_user(request, db)


def require(permission: str, write: bool = False):
    """Dependency factory: authenticate and authorise in one step."""
    assert permission in PERMISSIONS, permission

    def dependency(user: User = Depends(current_user_w if write else current_user)) -> User:
        if not can(user.role, permission):
            raise HTTPException(403, "Your role cannot make that change." if write else "Your role cannot view that.")
        return user

    return dependency


# ---------------------------------------------------------------- login throttling
class LoginThrottle:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    @staticmethod
    def _key(ip: str, email: str) -> str:
        return hashlib.sha256(f"{ip}|{email.lower()}".encode()).hexdigest()

    def blocked(self, ip: str, email: str, settings: Settings) -> bool:
        key, now = self._key(ip, email), time.monotonic()
        with self._lock:
            q = self._failures[key]
            while q and now - q[0] > settings.login_window_seconds:
                q.popleft()
            return len(q) >= settings.login_max_failures

    def fail(self, ip: str, email: str) -> None:
        with self._lock:
            self._failures[self._key(ip, email)].append(time.monotonic())

    def clear(self, ip: str, email: str) -> None:
        with self._lock:
            self._failures.pop(self._key(ip, email), None)
