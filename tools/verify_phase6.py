"""Verification script for Phase 6 — Product Gaps.

Validates:
1. Leaflet vendor assets serving
2. Server-side pagination, search & filters (crises, resources, audit, messages, help-requests)
3. Resource capacity editing (PATCH) and stock movements (stock_in, stock_out)
4. Help seeker workflows (add update, cancel) and manager workflows (reassign, release unit)
5. Duplicate request detection within 1 hour
6. CSV exports with RBAC and PII masking
"""

import sys

import httpx

BASE_URL = "http://127.0.0.1:8000"


def log(msg: str):
    print(f"[Phase 6 Verify] {msg}")


def main():
    log("Starting Phase 6 verification against live backend...")

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Health check
        r = client.get("/health")
        assert r.status_code == 200, f"Health check failed: {r.status_code}"
        log("Backend is healthy.")

        # 2. Leaflet assets
        r = client.get("/vendor/leaflet/leaflet.css")
        assert r.status_code == 200, f"Leaflet CSS not served: {r.status_code}"
        assert "leaflet" in r.text.lower(), "Leaflet CSS content invalid"
        r = client.get("/vendor/leaflet/leaflet.js")
        assert r.status_code == 200, f"Leaflet JS not served: {r.status_code}"
        log("Leaflet assets served successfully.")

        # 3. Log in as admin, manager, coordinator, and seeker
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
        mgr_token = mgr_login.json()["token"]
        mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

        coord_login = client.post(
            "/api/auth/login",
            json={"email": "meera@example.org", "password": "Resqsync#2026"},
        )
        assert coord_login.status_code == 200, (
            f"Coordinator login failed: {coord_login.text}"
        )
        coord_token = coord_login.json()["token"]
        coord_headers = {"Authorization": f"Bearer {coord_token}"}

        seeker_login = client.post(
            "/api/auth/login",
            json={"email": "seeker@example.org", "password": "Resqsync#2026"},
        )
        assert seeker_login.status_code == 200, (
            f"Seeker login failed: {seeker_login.text}"
        )
        seeker_token = seeker_login.json()["token"]
        seeker_headers = {"Authorization": f"Bearer {seeker_token}"}

        viewer_login = client.post(
            "/api/auth/login",
            json={"email": "rohan@example.org", "password": "Resqsync#2026"},
        )
        assert viewer_login.status_code == 200, (
            f"Viewer login failed: {viewer_login.text}"
        )
        viewer_headers = {"Authorization": f"Bearer {viewer_login.json()['token']}"}

        log("Role authentication successful.")

        # 4. Pagination, search, and filtering
        crises_p = client.get("/api/crises?page=1&limit=3", headers=mgr_headers)
        assert crises_p.status_code == 200
        cp_data = crises_p.json()
        assert "items" in cp_data and "total" in cp_data and "page" in cp_data
        assert cp_data["page"] == 1 and cp_data["limit"] == 3
        log("Crises pagination verified.")

        res_p = client.get("/api/resources?page=1&limit=5", headers=coord_headers)
        assert res_p.status_code == 200
        res_data = res_p.json()
        assert "items" in res_data
        sample_res = res_data["items"][0]
        assert "lowStock" in sample_res
        assert "stagingPoint" in sample_res
        log("Resources pagination and lowStock/stagingPoint serialization verified.")

        audit_p = client.get("/api/audit?page=1&limit=4", headers=admin_headers)
        assert audit_p.status_code == 200
        assert "items" in audit_p.json()
        log("Audit pagination verified.")

        msg_p = client.get(
            "/api/messages?channel=network&page=1&limit=5", headers=mgr_headers
        )
        assert msg_p.status_code == 200
        assert "items" in msg_p.json()
        log("Messages pagination verified.")

        # 5. Resource capacity editing and stock movements
        res_id = sample_res["id"]
        orig_total = sample_res["total"]
        patch_res = client.patch(
            f"/api/resources/{res_id}",
            json={"total": orig_total + 10},
            headers=coord_headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["total"] == orig_total + 10
        log(
            f"Resource PATCH total capacity verified ({orig_total} -> {orig_total + 10})."
        )

        stock_in = client.post(
            f"/api/resources/{res_id}/stock-movement",
            json={
                "movementType": "stock_in",
                "quantity": 5,
                "reason": "Central warehouse transfer",
            },
            headers=coord_headers,
        )
        assert stock_in.status_code == 200
        assert stock_in.json()["total"] == orig_total + 15
        log("Resource stock_in movement verified.")

        stock_out = client.post(
            f"/api/resources/{res_id}/stock-movement",
            json={
                "movementType": "stock_out",
                "quantity": 3,
                "reason": "Damaged unit write-off",
            },
            headers=coord_headers,
        )
        assert stock_out.status_code == 200
        assert stock_out.json()["total"] == orig_total + 12
        log("Resource stock_out movement verified.")

        # 6. Help Seeker Workflows & Duplicate Detection
        req_payload = {
            "name": "Phase 6 Seeker",
            "phone": "+91 98888 11111",
            "address": "Bandra East, Mumbai",
            "brief": "Water stagnation and food required",
            "adults": 3,
            "children": 1,
        }
        create_req1 = client.post(
            "/api/help-requests", json=req_payload, headers=seeker_headers
        )
        assert create_req1.status_code in (200, 201), (
            f"Create help-request failed: {create_req1.text}"
        )
        req1 = create_req1.json()
        req1_code = req1["id"]
        log(f"Help request 1 created: {req1_code}")

        # Seeker status update
        update_r = client.post(
            f"/api/help-requests/{req1_code}/update",
            json={"text": "Water level is steady now"},
            headers=seeker_headers,
        )
        assert update_r.status_code == 200, (
            f"Update help-request failed: {update_r.text}"
        )
        assert any(
            "Water level is steady now" in h["label"]
            for h in update_r.json()["history"]
        )
        log(f"Seeker update posted to {req1_code}.")

        # Manager verifies and assigns
        client.post(
            f"/api/help-requests/{req1_code}/verify", json={}, headers=mgr_headers
        )
        assign_r = client.post(
            f"/api/help-requests/{req1_code}/assign",
            json={"resourceId": res_id},
            headers=mgr_headers,
        )
        assert assign_r.status_code == 200, f"Assign failed: {assign_r.text}"
        assert assign_r.json()["status"] == "assigned"
        log(f"Manager verified and assigned {req1_code}.")

        # Manager releases unit without resolving
        rel_r = client.post(
            f"/api/help-requests/{req1_code}/release-unit", headers=mgr_headers
        )
        assert rel_r.status_code == 200, f"Release unit failed: {rel_r.text}"
        assert rel_r.json()["status"] == "verified"
        assert rel_r.json()["resource"] is None
        log(f"Manager released unit from {req1_code} back to pool.")

        # Reassign again and cancel
        client.post(
            f"/api/help-requests/{req1_code}/assign",
            json={"resourceId": res_id},
            headers=mgr_headers,
        )
        cancel_r = client.post(
            f"/api/help-requests/{req1_code}/cancel",
            json={"reason": "Evacuated to higher ground"},
            headers=seeker_headers,
        )
        assert cancel_r.status_code == 200, f"Cancel failed: {cancel_r.text}"
        assert cancel_r.json()["status"] == "cancelled"
        log(f"Seeker cancelled request {req1_code} with auto-release.")

        # Create duplicate request (same phone & address) within 1 hour
        create_req2 = client.post(
            "/api/help-requests", json=req_payload, headers=seeker_headers
        )
        assert create_req2.status_code in (200, 201), (
            f"Create duplicate help-request failed: {create_req2.text}"
        )
        req2_code = create_req2.json()["id"]
        log(f"Help request 2 created: {req2_code}")

        # Inspect duplicate detection via desk
        desk_r = client.get("/api/desk", headers=mgr_headers)
        assert desk_r.status_code == 200
        desk_reqs = {r["id"]: r for r in desk_r.json()["requests"]}
        assert desk_reqs[req2_code]["duplicateWarning"] is True
        assert req1_code in desk_reqs[req2_code]["duplicateCodes"]
        log(
            f"Duplicate request detection verified: {req2_code} flagged against {req1_code}."
        )

        # 7. CSV Exports
        crises_csv = client.get("/api/exports/crises.csv", headers=viewer_headers)
        assert crises_csv.status_code == 200, f"Crises CSV failed: {crises_csv.text}"
        assert "text/csv" in crises_csv.headers["content-type"]
        assert "id,title,city,region" in crises_csv.text
        log("Crises CSV export verified.")

        res_csv = client.get("/api/exports/resources.csv", headers=viewer_headers)
        assert res_csv.status_code == 200, f"Resources CSV failed: {res_csv.text}"
        assert "text/csv" in res_csv.headers["content-type"]
        assert "id,name,type,total" in res_csv.text
        log("Resources CSV export verified.")

        req_csv_admin = client.get(
            "/api/exports/help-requests.csv", headers=admin_headers
        )
        assert req_csv_admin.status_code == 200, (
            f"Admin Help requests CSV failed: {req_csv_admin.text}"
        )
        assert "+91 98888 11111" in req_csv_admin.text  # Admin sees unmasked phone
        log("Help requests CSV export (admin unmasked) verified.")

        req_csv_viewer = client.get(
            "/api/exports/help-requests.csv", headers=viewer_headers
        )
        assert req_csv_viewer.status_code == 200, (
            f"Viewer Help requests CSV failed: {req_csv_viewer.text}"
        )
        assert "+91 98888 11111" not in req_csv_viewer.text  # Viewer PII masked
        log("Help requests CSV export (viewer PII masked) verified.")

        audit_csv_admin = client.get("/api/exports/audit.csv", headers=admin_headers)
        assert audit_csv_admin.status_code == 200, (
            f"Audit CSV failed: {audit_csv_admin.text}"
        )
        assert "id,timestamp,actor" in audit_csv_admin.text
        log("Audit CSV export (admin RBAC) verified.")

        audit_csv_denied = client.get("/api/exports/audit.csv", headers=viewer_headers)
        assert audit_csv_denied.status_code == 403
        log("Audit CSV export non-admin 403 RBAC verified.")

    log("ALL PHASE 6 VERIFICATIONS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)
