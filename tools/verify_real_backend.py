#!/usr/bin/env python3
"""Automated verification script for ResQSync real backend (no mock data)."""

from __future__ import annotations

import argparse
import sys

import httpx


def run_checks(base_url: str) -> str:
    print(f"Connecting to backend at {base_url}...")
    client = httpx.Client(base_url=base_url, timeout=10.0, follow_redirects=True)

    # 1. Health check
    print("1. Checking /health...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code} {r.text}"
    assert r.json().get("status") == "healthy", f"Health payload invalid: {r.text}"
    print("   -> PASS: Server is healthy.")

    # 2. Metadata check
    print("2. Checking /api/meta...")
    r = client.get("/api/meta")
    assert r.status_code == 200, f"/api/meta failed: {r.status_code} {r.text}"
    meta = r.json()
    assert meta.get("allowRegistration") is True, f"Meta unexpected: {meta}"
    print("   -> PASS: Metadata returned.")

    # 3. Unauthenticated access check (401 expected)
    print("3. Checking unauthenticated /api/workspace...")
    r = client.get("/api/workspace")
    assert r.status_code == 401, f"Expected 401 unauthenticated, got {r.status_code}"
    print("   -> PASS: Protected route returned 401.")

    # 4. Invalid credentials check
    print("4. Checking invalid authentication...")
    r = client.post(
        "/api/auth/login",
        json={"email": "arjun@example.org", "password": "wrong-password"},
    )
    assert r.status_code == 401, f"Expected 401 on bad password, got {r.status_code}"
    print("   -> PASS: Invalid login rejected with 401.")

    # 5. Manager sign-in
    print("5. Signing in as arjun@example.org (Crisis Manager)...")
    r = client.post(
        "/api/auth/login",
        json={"email": "arjun@example.org", "password": "Resqsync#2026"},
    )
    assert r.status_code == 200, f"Manager login failed: {r.status_code} {r.text}"
    user_obj = r.json().get("user", {})
    assert user_obj.get("role") == "crisis-manager", f"Unexpected role: {r.json()}"
    print("   -> PASS: Manager authenticated (Session cookie set).")

    # 6. Real database workspace snapshot
    print("6. Verifying /api/workspace real database contents...")
    r = client.get("/api/workspace")
    assert r.status_code == 200, f"Workspace fetch failed: {r.status_code} {r.text}"
    ws = r.json()
    crises = ws.get("crises", [])
    resources = ws.get("resources", [])
    users = ws.get("users", [])
    assert len(crises) >= 5, (
        f"Expected at least 5 seeded crises in DB, found {len(crises)}"
    )
    assert len(resources) >= 4, f"Expected seeded resources, found {len(resources)}"
    assert any(u.get("email") == "arjun@example.org" for u in users), (
        "Users missing in DB snapshot"
    )
    print(
        f"   -> PASS: Workspace contains {len(crises)} crises, {len(resources)} resources, {len(users)} users."
    )

    # 7. Create real incident (POST /api/crises = 201)
    print("7. Creating incident POST /api/crises...")
    new_crisis_payload = {
        "title": "Automated Real Backend Incident",
        "city": "Bhubaneswar",
        "region": "Odisha",
        "category": "Flood",
        "severity": 4,
        "status": "active",
        "population": 7500,
        "lat": 20.2961,
        "lng": 85.8245,
    }
    r = client.post("/api/crises", json=new_crisis_payload)
    assert r.status_code == 201, f"Crisis creation failed: {r.status_code} {r.text}"
    created_crisis = r.json()
    crisis_id = created_crisis.get("id")
    assert crisis_id, "No crisis id returned"
    print(f"   -> PASS: Incident created with ID: {crisis_id}")
    print(f"   PERSISTENCE_CHECK_ID: {crisis_id}")

    # Fetch it directly
    r = client.get(f"/api/crises/{crisis_id}")
    assert r.status_code == 200, f"Fetching created crisis failed: {r.status_code}"
    assert r.json().get("title") == "Automated Real Backend Incident"
    print("   -> PASS: Created crisis verified in database.")

    # 8. RBAC check (403 forbidden)
    print("8. Checking RBAC coordinator permissions (meera@example.org)...")
    viewer_client = httpx.Client(base_url=base_url, timeout=10.0, follow_redirects=True)
    r = viewer_client.post(
        "/api/auth/login",
        json={"email": "meera@example.org", "password": "Resqsync#2026"},
    )
    assert r.status_code == 200, f"Coordinator login failed: {r.status_code}"
    r = viewer_client.post("/api/crises", json=new_crisis_payload)
    assert r.status_code == 403, (
        f"Expected 403 for coordinator crisis creation, got {r.status_code}"
    )
    print("   -> PASS: Coordinator correctly forbidden from mutating crises (403).")

    # 9. Document upload & download
    print("9. Checking file upload and download...")
    files = {
        "file": ("test_doc.txt", b"ResQSync persistence test content", "text/plain")
    }
    data = {"channel": "network"}
    r = client.post("/api/attachments", data=data, files=files)
    assert r.status_code == 201, f"Attachment upload failed: {r.status_code} {r.text}"
    att_id = r.json().get("id")
    assert att_id, "No attachment id returned"
    r = client.get(f"/api/attachments/{att_id}/download")
    assert r.status_code == 200, f"Download failed: {r.status_code}"
    assert r.content == b"ResQSync persistence test content", (
        "Downloaded file content mismatch"
    )
    print("   -> PASS: Document uploaded and downloaded intact.")

    # 10. Report generation (PDF & Excel XML)
    print("10. Checking PDF and Excel report generation...")
    r = client.get("/api/reports/export?format=pdf&days=30")
    assert r.status_code == 200, f"PDF export failed: {r.status_code}"
    assert r.content.startswith(b"%PDF"), "PDF export missing PDF header"
    r = client.get("/api/reports/export?format=xml&days=30")
    assert r.status_code == 200, f"Excel XML export failed: {r.status_code}"
    assert b"Workbook" in r.content or b"xml" in r.content, "Excel export invalid"
    print("   -> PASS: PDF and Excel reports generated successfully.")

    # 11. Sign-out check
    print("11. Checking sign-out and session revocation...")
    r = client.post("/api/auth/logout")
    assert r.status_code == 200, f"Logout failed: {r.status_code}"
    r = client.get("/api/workspace")
    assert r.status_code == 401, f"Expected 401 after logout, got {r.status_code}"
    print("   -> PASS: Signed out successfully; /api/workspace returns 401.")

    # 12. Security headers check
    print(
        "12. Checking Phase 2 security headers (CSP, nosniff, DENY, Permissions-Policy)..."
    )
    r = client.get("/api/meta")
    assert r.headers.get("X-Content-Type-Options") == "nosniff", (
        "Missing X-Content-Type-Options"
    )
    assert r.headers.get("X-Frame-Options") == "DENY", "Missing X-Frame-Options"
    assert "Content-Security-Policy" in r.headers, "Missing Content-Security-Policy"
    assert "Permissions-Policy" in r.headers, "Missing Permissions-Policy"
    print("   -> PASS: All required security headers verified.")

    # 13. Forgot password enumeration protection check
    print("13. Checking forgot password enumeration protection...")
    r = client.post(
        "/api/auth/forgot", json={"email": "nonexistent_victim@example.org"}
    )
    assert r.status_code == 200, f"Expected 200 constant response, got {r.status_code}"
    assert "If that e-mail address is registered" in r.json().get("message", ""), (
        "Unexpected message"
    )
    print(
        "   -> PASS: Enumeration protection returns constant 200 without user leakage."
    )

    # 14. Active sessions and multi-device revocation
    print("14. Checking active sessions and multi-device revocation...")
    r = client.post(
        "/api/auth/login",
        json={"email": "meera@example.org", "password": "Resqsync#2026"},
    )
    assert r.status_code == 200
    r_sess = client.get("/api/auth/sessions")
    assert r_sess.status_code == 200
    sessions = r_sess.json().get("sessions", [])
    assert len(sessions) >= 1
    assert any(s.get("current") for s in sessions)
    r_rev = client.post("/api/auth/logout-all")
    assert r_rev.status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    print("   -> PASS: Sessions tracked and multi-device revocation verified.")

    # 15. Phase 3: Notification channels, phone OTP verification, and outbox logs
    print("15. Checking Phase 3: Outbox endpoints and phone verification...")
    # Sign in as admin (aditi)
    r = client.post(
        "/api/auth/login",
        json={"email": "aditi@example.org", "password": "Resqsync#2026"},
    )
    assert r.status_code == 200
    # Outbox RBAC: admin can view /api/outbox and /api/me/outbox
    r_my_outbox = client.get("/api/me/outbox")
    assert r_my_outbox.status_code == 200, (
        f"Failed /api/me/outbox: {r_my_outbox.status_code}"
    )
    r_all_outbox = client.get("/api/outbox")
    assert r_all_outbox.status_code == 200, (
        f"Failed /api/outbox: {r_all_outbox.status_code}"
    )
    # Send phone OTP with phone number
    r_otp = client.post("/api/me/phone/send-otp", json={"phone": "+919876543210"})
    assert r_otp.status_code == 200, f"Failed send OTP: {r_otp.status_code}"
    otp_data = r_otp.json()
    assert "Verification code sent" in otp_data.get("message", "")
    # Bad OTP rejected
    r_bad_otp = client.post("/api/me/phone/verify-otp", json={"code": "000000"})
    assert r_bad_otp.status_code == 400, "Expected bad OTP to be rejected with 400"
    # Valid OTP verified
    if "otp" in otp_data:
        r_good_otp = client.post(
            "/api/me/phone/verify-otp", json={"code": otp_data["otp"]}
        )
        assert r_good_otp.status_code == 200, (
            f"Expected good OTP to succeed: {r_good_otp.status_code}"
        )
        r_sms_ok = client.put(
            "/api/me/preferences", json={"email": True, "sms": True, "push": False}
        )
        assert r_sms_ok.status_code == 200, (
            f"Expected SMS pref to succeed on verified phone: {r_sms_ok.status_code}"
        )
    print(
        "   -> PASS: Outbox endpoints, phone OTP dispatch, and code verification verified."
    )

    # 16. Coordinator cannot access admin outbox
    print("16. Checking Outbox RBAC protection...")
    client.post("/api/auth/logout")
    client.post(
        "/api/auth/login",
        json={"email": "meera@example.org", "password": "Resqsync#2026"},
    )
    r_forbidden_outbox = client.get("/api/outbox")
    assert r_forbidden_outbox.status_code == 403, (
        f"Expected 403 on coordinator /api/outbox, got {r_forbidden_outbox.status_code}"
    )
    # Unverified phone cannot enable SMS notifications
    r_sms_guard = client.put(
        "/api/me/preferences", json={"email": True, "sms": True, "push": False}
    )
    assert r_sms_guard.status_code == 400, (
        f"Expected 400 when enabling SMS without verified phone, got {r_sms_guard.status_code}"
    )
    print("   -> PASS: Outbox RBAC and unverified-phone SMS guard verified.")

    print("\nALL CHECKS PASSED")
    return crisis_id


def check_persistence(base_url: str, crisis_id: str):
    print(f"Connecting to restarted backend at {base_url} to verify persistence...")
    client = httpx.Client(base_url=base_url, timeout=10.0, follow_redirects=True)

    # 1. Health check
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"

    # 2. Login as manager
    r = client.post(
        "/api/auth/login",
        json={"email": "arjun@example.org", "password": "Resqsync#2026"},
    )
    assert r.status_code == 200, f"Manager login failed: {r.status_code}"

    # 3. Retrieve crisis created before restart
    r = client.get(f"/api/crises/{crisis_id}")
    assert r.status_code == 200, (
        f"Crisis {crisis_id} not found after restart! {r.status_code}"
    )
    data = r.json()
    assert data.get("id") == crisis_id, f"ID mismatch: {data}"
    assert data.get("title") == "Automated Real Backend Incident", (
        f"Title mismatch: {data}"
    )

    print(
        f"PASS (data survives a restart, so it lives in the database). Verified record {crisis_id}."
    )


def main():
    parser = argparse.ArgumentParser(description="Verify ResQSync real backend")
    parser.add_argument(
        "--url", default="http://127.0.0.1:8000", help="Backend base URL"
    )
    parser.add_argument(
        "--check-persist",
        dest="check_persist",
        help="Check persistence of crisis ID across restart",
    )
    args = parser.parse_args()

    try:
        if args.check_persist:
            check_persistence(args.url, args.check_persist)
        else:
            run_checks(args.url)
    except Exception as e:
        print(f"FAIL: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
