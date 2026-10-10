import hashlib
import re
from datetime import datetime, timezone

from sqlalchemy import select

from app.logging_utils import mask_pii
from app.models import OutboxMessage, PasswordResetToken
from app.services.image_sanitize import strip_jpeg_exif, strip_png_metadata

PASSWORD = "Resqsync#2026"


def test_security_headers(client):
    r = client.get("/api/meta")
    assert r.status_code == 200
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    assert r.headers["X-Frame-Options"] == "DENY"
    assert r.headers["Referrer-Policy"] == "same-origin"
    assert "Content-Security-Policy" in r.headers
    assert "default-src 'self'" in r.headers["Content-Security-Policy"]
    assert "images.pexels.com" in r.headers["Content-Security-Policy"]
    assert "Permissions-Policy" in r.headers
    assert r.headers["Cache-Control"] == "no-store"


def test_forgot_password_enumeration_resistance(client, app):
    # Non-existent user
    r = client.post("/api/auth/forgot", json={"email": "nobody@example.org"})
    assert r.status_code == 200
    assert "If that e-mail address is registered" in r.json()["message"]

    # Verify no tokens or outbox queued
    session = app.state.db.read_session()
    try:
        tokens = session.scalars(select(PasswordResetToken)).all()
        assert len(tokens) == 0
        outbox = session.scalars(select(OutboxMessage)).all()
        assert len(outbox) == 0
    finally:
        session.close()


def test_password_reset_lifecycle(client, app):
    # 1. Request reset for aditi
    r = client.post("/api/auth/forgot", json={"email": "aditi@example.org"})
    assert r.status_code == 200
    assert "If that e-mail address is registered" in r.json()["message"]

    # 2. Extract token from outbox
    session = app.state.db.read_session()
    try:
        outbox_msg = session.scalars(
            select(OutboxMessage).where(OutboxMessage.recipient == "aditi@example.org")
        ).first()
        assert outbox_msg is not None
        match = re.search(r"Token:\s*([A-Za-z0-9_-]+)", outbox_msg.body)
        assert match is not None
        raw_token = match.group(1)

        # Verify hashed token stored in DB
        expected_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        tok_record = session.scalars(
            select(PasswordResetToken).where(PasswordResetToken.token_hash == expected_hash)
        ).first()
        assert tok_record is not None
        assert not tok_record.used
        assert tok_record.expires_at > datetime.now(timezone.utc)
    finally:
        session.close()

    # 3. Invalid token fails
    r_bad = client.post(
        "/api/auth/reset", json={"token": "invalid-token-12345", "new_password": "NewSecurePassword#99"}
    )
    assert r_bad.status_code == 400

    # 4. Weak password fails
    r_weak = client.post("/api/auth/reset", json={"token": raw_token, "new_password": "short"})
    assert r_weak.status_code == 422

    # 5. Successful reset
    r_ok = client.post("/api/auth/reset", json={"token": raw_token, "new_password": "NewSecurePassword#99"})
    assert r_ok.status_code == 200
    assert r_ok.json()["ok"] is True

    # 6. Single-use: Reusing the same token fails
    r_reuse = client.post("/api/auth/reset", json={"token": raw_token, "new_password": "AnotherPassword#123"})
    assert r_reuse.status_code == 400

    # 7. Old password no longer works
    r_old = client.post("/api/auth/login", json={"email": "aditi@example.org", "password": PASSWORD})
    assert r_old.status_code == 401

    # 8. New password works
    r_new = client.post("/api/auth/login", json={"email": "aditi@example.org", "password": "NewSecurePassword#99"})
    assert r_new.status_code == 200


def test_rate_limiting_forgot(client):
    # Limit is 5 per hour
    for i in range(5):
        r = client.post("/api/auth/forgot", json={"email": f"user{i}@example.org"})
        assert r.status_code == 200
    # 6th attempt is throttled
    r_blocked = client.post("/api/auth/forgot", json={"email": "another@example.org"})
    assert r_blocked.status_code == 429
    assert "Retry-After" in r_blocked.headers


def test_rate_limiting_register(client):
    # Limit is 10 per hour
    for i in range(10):
        r = client.post(
            "/api/auth/register",
            json={
                "name": f"User {i}",
                "email": f"testuser_{i}@example.org",
                "password": "Password#2026",
            },
        )
        assert r.status_code in (200, 409)
    # 11th attempt is throttled
    r_blocked = client.post(
        "/api/auth/register",
        json={
            "name": "User 11",
            "email": "testuser_11@example.org",
            "password": "Password#2026",
        },
    )
    assert r_blocked.status_code == 429
    assert "Retry-After" in r_blocked.headers


def test_sessions_and_logout_all(client):
    # Login as aditi
    r_login = client.post("/api/auth/login", json={"email": "aditi@example.org", "password": PASSWORD})
    assert r_login.status_code == 200

    # Check sessions
    r_sessions = client.get("/api/auth/sessions")
    assert r_sessions.status_code == 200
    sessions = r_sessions.json()["sessions"]
    assert len(sessions) >= 1
    assert any(s["current"] is True for s in sessions)

    # Logout all
    r_logout_all = client.post("/api/auth/logout-all")
    assert r_logout_all.status_code == 200
    assert r_logout_all.json()["ok"] is True

    # Subsequent request using same client cookie fails
    r_me = client.get("/api/auth/me")
    assert r_me.status_code == 401


def test_image_metadata_stripping():
    # Construct a valid minimal JPEG with APP1 (EXIF) segment
    # SOI (FF D8) + APP1 (FF E1 00 0E "Exif\0\0" + dummy) + DQT (FF DB 00 04 00 00) + EOI (FF D9)
    fake_exif = b"Exif\x00\x00GPS-COORDINATES-LAT-12.97-LON-77.59"
    app1_len = len(fake_exif) + 2
    jpeg_with_exif = b"\xff\xd8\xff\xe1" + app1_len.to_bytes(2, "big") + fake_exif + b"\xff\xdb\x00\x04\x00\x00\xff\xd9"
    assert b"GPS-COORDINATES" in jpeg_with_exif
    cleaned = strip_jpeg_exif(jpeg_with_exif)
    assert b"GPS-COORDINATES" not in cleaned
    assert cleaned.startswith(b"\xff\xd8")
    assert cleaned.endswith(b"\xff\xd9")

    # Construct a minimal PNG with eXIf chunk
    png_header = b"\x89PNG\r\n\x1a\n"
    ihdr = b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    exif_chunk = b"\x00\x00\x00\x10eXIfCAMERA-SERIAL-12345678"
    iend = b"\x00\x00\x00\x00IEND\xaeB`\x82"
    png_with_exif = png_header + ihdr + exif_chunk + iend
    assert b"CAMERA-SERIAL" in png_with_exif
    cleaned_png = strip_png_metadata(png_with_exif)
    assert b"CAMERA-SERIAL" not in cleaned_png
    assert cleaned_png.startswith(png_header)


def test_pii_masking_filter():
    msg = 'Sign in failed for {"password": "SuperSecret123!", "email": "user@test.org"}'
    masked = mask_pii(msg)
    assert "SuperSecret123!" not in masked
    assert "[REDACTED]" in masked

    phone_msg = "Call coordinator at +91 98765 43210 immediately."
    masked_phone = mask_pii(phone_msg)
    assert "98765 43210" not in masked_phone
    assert "[REDACTED_PHONE]" in masked_phone
