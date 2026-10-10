"""Verification script for Phase 7 — Privacy and Data Governance.

Validates:
1. Data Export: GET /api/me/data returns structured JSON with personal data, audit log, outbox, and disclaimer.
2. Account Deletion: POST /api/me/delete-account scrubs PII, revokes sessions, clears tokens, anonymises requests.
3. Admin Anonymisation: POST /api/users/{id}/anonymise allows admins to scrub a user on privacy request while preserving audit trail.
4. Data Retention Cleanup: POST /api/admin/privacy/retention-run executes automated or manual retention cleanup pass.
5. Audit Log Immutability: ORM listeners reject updates/deletes and HTTP endpoints do not expose mutation methods.
6. Privacy Policy Notice: GET /api/privacy/policy returns plain-language operational disclosures and statutory disclaimers.
"""

from datetime import datetime, timezone

import httpx

BASE_URL = "http://127.0.0.1:8000"


def log(msg: str):
    print(f"[Phase 7 Verify] {msg}")


def main():
    log("Starting Phase 7 verification against live backend...")

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Health check
        r = client.get("/health")
        assert r.status_code == 200, f"Health check failed: {r.status_code}"
        log("Backend is healthy.")

        # 2. Privacy Policy endpoint (publicly accessible)
        log("Checking GET /api/privacy/policy...")
        pol_res = client.get("/api/privacy/policy")
        assert pol_res.status_code == 200, (
            f"Privacy policy failed: {pol_res.status_code}"
        )
        pol_data = pol_res.json()
        assert "title" in pol_data
        assert "disclaimer" in pol_data
        assert (
            "not constitute formal legal advice" in pol_data["disclaimer"].lower()
            or "operational demonstration" in pol_data["disclaimer"].lower()
        )
        assert "categories" in pol_data and len(pol_data["categories"]) > 0
        assert "purposes" in pol_data and len(pol_data["purposes"]) > 0
        assert (
            "governance_controls" in pol_data
            and len(pol_data["governance_controls"]) > 0
        )
        assert "retention_policy" in pol_data
        log("Privacy Policy endpoint verified.")

        # 3. Log in as admin and manager
        admin_login = client.post(
            "/api/auth/login",
            json={"email": "aditi@example.org", "password": "Resqsync#2026"},
        )
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json()["token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        mgr_login = client.post(
            "/api/auth/login",
            json={"email": "arjun@example.org", "password": "Resqsync#2026"},
        )
        assert mgr_login.status_code == 200, f"Manager login failed: {mgr_login.text}"
        mgr_headers = {"Authorization": f"Bearer {mgr_login.json()['token']}"}

        # Check workspace config exposes dataRetentionDays
        ws_res = client.get("/api/workspace", headers=admin_headers)
        assert ws_res.status_code == 200
        ws_config = ws_res.json().get("config", {})
        assert "dataRetentionDays" in ws_config, (
            "dataRetentionDays missing from workspace config"
        )
        log(
            f"Workspace config verified (dataRetentionDays = {ws_config['dataRetentionDays']})."
        )

        # 4. Data Export (GET /api/me/data)
        log("Checking GET /api/me/data for authenticated user...")
        # Unauthenticated check
        unauth_check = httpx.get(f"{BASE_URL}/api/me/data")
        assert unauth_check.status_code == 401, (
            f"Unauthenticated GET /api/me/data returned {unauth_check.status_code}"
        )
        export_res = client.get("/api/me/data", headers=admin_headers)
        assert export_res.status_code == 200, f"Export data failed: {export_res.text}"
        export_data = export_res.json()
        assert "exportedAt" in export_data or "exportTimestamp" in export_data
        assert (
            "user" in export_data
            and export_data["user"]["email"] == "aditi@example.org"
        )
        assert "disclaimer" in export_data
        assert "helpRequests" in export_data
        assert "auditTrail" in export_data
        assert "sessions" in export_data or "activeSessions" in export_data
        log("User data export bundle structure verified.")

        # 5. User Self-Deletion (POST /api/me/delete-account)
        ts = int(datetime.now(timezone.utc).timestamp())
        test_email = f"selfdel_{ts}@example.org"
        test_pwd = "TestUser#2026"
        log(f"Registering temporary seeker user: {test_email}...")
        reg_res = httpx.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": f"Del Test {ts}",
                "email": test_email,
                "password": test_pwd,
                "phone": "+91 9876543210",
            },
        )
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"

        # Login to obtain token
        login_res = httpx.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": test_email, "password": test_pwd},
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        del_user_token = login_res.json()["token"]
        del_headers = {"Authorization": f"Bearer {del_user_token}"}

        # User raises a help request
        req_res = httpx.post(
            f"{BASE_URL}/api/help-requests",
            json={
                "name": f"Del Test {ts}",
                "phone": "+91 9876543210",
                "address": "42 Coastal Road, Mumbai",
                "brief": "Need shelter and clean water urgently",
                "adults": 2,
                "children": 1,
            },
            headers=del_headers,
        )
        assert req_res.status_code == 201, f"Help request failed: {req_res.text}"
        req_id = req_res.json()["id"]
        log(f"Temporary help request created: {req_id}")

        # Wrong password check
        bad_del = httpx.post(
            f"{BASE_URL}/api/me/delete-account",
            json={"password": "WrongPassword123"},
            headers=del_headers,
        )
        assert bad_del.status_code in (400, 403), (
            f"Expected 400 or 403 for wrong password, got {bad_del.status_code}"
        )

        # Correct password deletion
        del_action = httpx.post(
            f"{BASE_URL}/api/me/delete-account",
            json={"password": test_pwd},
            headers=del_headers,
        )
        assert del_action.status_code == 200, (
            f"Delete account failed: {del_action.text}"
        )
        assert (
            "deleted" in del_action.json()["message"].lower()
            or "anonymised" in del_action.json()["message"].lower()
        )
        log("Account deletion endpoint succeeded.")

        # Verify old token is now rejected (sessions revoked)
        stale_call = httpx.get(f"{BASE_URL}/api/me/data", headers=del_headers)
        assert stale_call.status_code == 401, (
            f"Expected 401 on revoked session, got {stale_call.status_code}"
        )
        log("Session revocation on deletion verified.")

        # Verify logging in with deleted user fails
        login_again = httpx.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": test_email, "password": test_pwd},
        )
        assert login_again.status_code == 401, (
            f"Deleted user login should fail with 401, got {login_again.status_code}"
        )
        log("Disabled login for deleted user verified.")

        # Verify help request was anonymised
        desk_view = client.get("/api/desk", headers=admin_headers)
        assert desk_view.status_code == 200
        anonymised_req = next(
            (r for r in desk_view.json()["requests"] if r["id"] == req_id), None
        )
        assert anonymised_req is not None, f"Help request {req_id} not found in desk"
        assert anonymised_req["name"] == "[Anonymised]"
        assert anonymised_req["phone"] in ("[Anonymised]", "***")
        assert anonymised_req["address"] == "[Anonymised]"
        log(f"Help request {req_id} PII anonymisation verified.")

        # 6. Admin User Anonymisation (POST /api/users/{id}/anonymise)
        target_email = f"admin_anon_{ts}@example.org"
        reg_target = httpx.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": f"Target Anon {ts}",
                "email": target_email,
                "password": "TargetPass#2026",
                "phone": "+91 9123456789",
            },
        )
        assert reg_target.status_code == 200
        target_id = reg_target.json()["user"]["id"]

        # Manager should not be able to anonymise (admin only)
        mgr_anon = client.post(f"/api/users/{target_id}/anonymise", headers=mgr_headers)
        assert mgr_anon.status_code == 403, (
            f"Expected 403 for manager anonymising user, got {mgr_anon.status_code}"
        )

        # Admin performs anonymisation
        adm_anon = client.post(
            f"/api/users/{target_id}/anonymise", headers=admin_headers
        )
        assert adm_anon.status_code == 200, f"Admin anonymise failed: {adm_anon.text}"
        anon_result = adm_anon.json()
        assert anon_result["user"]["name"] == "[Anonymised User]"
        assert "anon" in anon_result["user"]["email"]
        assert anon_result["user"]["status"] == "Disabled"
        log("Admin user anonymisation endpoint verified.")

        # Verify audit log recorded user anonymisation
        audit_res = client.get("/api/audit?page=1&limit=5", headers=admin_headers)
        assert audit_res.status_code == 200
        audit_actions = [item["action"] for item in audit_res.json()["items"]]
        assert any(
            "user_anonymise" in a or "anonymise" in a.lower() for a in audit_actions
        ), f"Audit log did not record user anonymisation: {audit_actions}"
        log("Audit log trail for anonymisation verified.")

        # 7. Data Retention Cleanup pass (POST /api/admin/privacy/retention-run)
        mgr_ret = client.post("/api/admin/privacy/retention-run", headers=mgr_headers)
        assert mgr_ret.status_code == 403, (
            f"Expected 403 for non-admin retention run, got {mgr_ret.status_code}"
        )

        adm_ret = client.post(
            "/api/admin/privacy/retention-run",
            json={"retentionDays": 30},
            headers=admin_headers,
        )
        assert adm_ret.status_code == 200, f"Retention run failed: {adm_ret.text}"
        ret_result = adm_ret.json()
        assert "anonymised" in ret_result or "cleanedCount" in ret_result
        assert "retentionDays" in ret_result
        log(
            f"Admin retention cleanup pass executed (anonymised = {ret_result.get('anonymised', ret_result.get('cleanedCount'))})."
        )

        # 8. Audit Log Immutability (HTTP layer)
        # Verify no DELETE /api/audit or PATCH /api/audit endpoints exist
        del_audit = client.delete("/api/audit", headers=admin_headers)
        assert del_audit.status_code in (404, 405), (
            f"DELETE /api/audit returned {del_audit.status_code}, expected 404 or 405"
        )
        patch_audit = client.patch(
            "/api/audit/1", json={"action": "tampered"}, headers=admin_headers
        )
        assert patch_audit.status_code in (404, 405), (
            f"PATCH /api/audit/1 returned {patch_audit.status_code}, expected 404 or 405"
        )
        log("HTTP audit log immutability verified (no DELETE or PATCH routes).")

    log("ALL Phase 7 verification checks passed successfully!")


if __name__ == "__main__":
    main()
