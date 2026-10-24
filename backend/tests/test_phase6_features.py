"""Tests for Phase 6 product gap features:
- Pagination, search & filters on crises, resources, help requests, audit, messages
- Resource capacity PATCH and stock movements (stock-in/stock-out) with history
- Help seeker updates and cancellation with auto-release
- Manager reassignments and release-unit without resolving
- Duplicate request detection within 1 hour
- CSV exports for crises, resources, help requests (PII masked), and audit (RBAC enforced)
"""

from __future__ import annotations

import csv
import io


def test_pagination_and_filters(admin, coordinator, seeker):
    # 1. Crises pagination and filters
    res = admin.get("/api/crises?page=1&limit=2")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data and "total" in data and "totalPages" in data
    assert len(data["items"]) == 2
    assert data["total"] >= 2
    assert data["page"] == 1
    assert data["pageSize"] == 2

    # Filter by category
    flood_res = admin.get("/api/crises?category=Flood")
    assert flood_res.status_code == 200
    flood_items = flood_res.json()
    assert all(c["category"] == "Flood" for c in flood_items)

    # Search by keyword
    search_res = admin.get("/api/crises?q=mumbai")
    assert search_res.status_code == 200
    assert any("mumbai" in c["title"].lower() or "mumbai" in c["city"].lower() for c in search_res.json())

    # 2. Resources pagination and filters
    res_page = admin.get("/api/resources?page=1&limit=3")
    assert res_page.status_code == 200
    r_data = res_page.json()
    assert len(r_data["items"]) == 3
    assert r_data["total"] >= 3

    # Filter resources by type
    supplies = admin.get("/api/resources?type=Supplies")
    assert supplies.status_code == 200
    assert all(r["type"] == "Supplies" for r in supplies.json())

    # 3. Audit pagination and search
    audit_page = admin.get("/api/audit?page=1&limit=5")
    assert audit_page.status_code == 200
    a_data = audit_page.json()
    assert "items" in a_data and len(a_data["items"]) <= 5

    # 4. Messages pagination
    msg_page = admin.get("/api/messages?channel=network&page=1&limit=5")
    assert msg_page.status_code == 200
    m_data = msg_page.json()
    assert "items" in m_data


def test_resource_patch_and_stock_movements(admin, coordinator):
    # Create test resource
    create_res = coordinator.post(
        "/api/resources",
        json={
            "name": "Emergency Blankets Reserve",
            "type": "Supplies",
            "total": 100,
            "unit": "bundles",
            "cost": 500,
            "organization": "Western Response Collective",
            "capability": "Thermal insulation blankets for displaced populations",
        },
    )
    assert create_res.status_code == 201
    r_id = create_res.json()["id"]

    # PATCH resource capacity and details
    patch_res = coordinator.patch(
        f"/api/resources/{r_id}", json={"total": 120, "name": "Updated Blankets Reserve", "cost": 550}
    )
    assert patch_res.status_code == 200
    p_data = patch_res.json()
    assert p_data["total"] == 120
    assert p_data["name"] == "Updated Blankets Reserve"
    assert p_data["cost"] == 550

    # Stock-in movement
    stock_in = coordinator.post(
        f"/api/resources/{r_id}/stock-movement",
        json={"movementType": "stock_in", "quantity": 30, "reason": "New delivery from central warehouse"},
    )
    assert stock_in.status_code == 200
    s_data = stock_in.json()
    assert s_data["total"] == 150
    assert s_data["available"] == 150
    # Check history event
    assert any("Stock-in (+30 bundles)" in h["text"] for h in s_data["history"])

    # Stock-out movement
    stock_out = coordinator.post(
        f"/api/resources/{r_id}/stock-movement",
        json={"movementType": "stock_out", "quantity": 20, "reason": "Transferred to remote district post"},
    )
    assert stock_out.status_code == 200
    so_data = stock_out.json()
    assert so_data["total"] == 130
    assert so_data["available"] == 130
    assert any("Stock-out (-20 bundles)" in h["text"] for h in so_data["history"])

    # Stock-out exceeding available fails
    bad_out = coordinator.post(
        f"/api/resources/{r_id}/stock-movement",
        json={"movementType": "stock_out", "quantity": 500, "reason": "Excessive request"},
    )
    assert bad_out.status_code == 409


def test_help_seeker_update_and_cancellation(seeker, admin, coordinator):
    # Raise a help request
    req_res = seeker.post(
        "/api/help-requests",
        json={
            "name": "Aarav Sharma",
            "phone": "+919876543210",
            "address": "42 Marine Drive, Flat 3B, Mumbai",
            "brief": "Family stranded on first floor due to water ingress",
            "adults": 3,
            "children": 1,
        },
    )
    assert req_res.status_code == 201
    code = req_res.json()["id"]

    # Seeker adds an update
    upd_res = seeker.post(
        f"/api/help-requests/{code}/update",
        json={"text": "Water levels receding slightly but drinking water exhausted"},
    )
    assert upd_res.status_code == 200
    upd_data = upd_res.json()
    assert any("Water levels receding" in h["label"] for h in upd_data["history"])

    # Verify and assign a resource to it
    admin.post(f"/api/help-requests/{code}/verify", json={"crisisId": "C-MUM"})
    admin.post(f"/api/help-requests/{code}/assign", json={"resourceId": "R-BOAT"})

    # Check that resource is assigned
    r_before = admin.get("/api/resources/R-BOAT").json()
    used_before = r_before["used"]

    # Seeker cancels the request -> MUST auto-release the assigned resource!
    cancel_res = seeker.post(
        f"/api/help-requests/{code}/cancel",
        json={"reason": "Rescued by local neighbors boat, no further assistance needed"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Verify resource was auto-released
    r_after = admin.get("/api/resources/R-BOAT").json()
    assert r_after["used"] == used_before - 1


def test_manager_reassign_and_release_unit(admin, seeker):
    # Create request
    req_res = seeker.post(
        "/api/help-requests",
        json={
            "name": "Devi Prasad",
            "phone": "+919811223344",
            "address": "12 Linking Road, Bandra, Mumbai",
            "brief": "Elderly citizen requires oxygen assistance",
            "adults": 2,
            "children": 0,
        },
    )
    assert req_res.status_code == 201
    code = req_res.json()["id"]

    # Verify and assign R-AMB
    admin.post(f"/api/help-requests/{code}/verify", json={"crisisId": "C-MUM"})
    assign1 = admin.post(f"/api/help-requests/{code}/assign", json={"resourceId": "R-AMB"})
    assert assign1.status_code == 200
    assert assign1.json()["resourceId"] == "R-AMB"

    # Manager reassigns to R-OXY
    reassign_res = admin.post(f"/api/help-requests/{code}/reassign", json={"resourceId": "R-OXY"})
    assert reassign_res.status_code == 200
    assert reassign_res.json()["resourceId"] == "R-OXY"

    # Manager releases unit without resolving request
    release_res = admin.post(f"/api/help-requests/{code}/release-unit")
    assert release_res.status_code == 200
    rel_data = release_res.json()
    assert rel_data["resourceId"] is None
    assert rel_data["status"] == "verified"  # Request remains open!


def test_duplicate_request_detection(seeker, admin):
    # Raise first request
    res1 = seeker.post(
        "/api/help-requests",
        json={
            "name": "Kavita Roy",
            "phone": "+919999888877",
            "address": "100 Park Street, Kolkata",
            "brief": "Power line down near entrance",
            "adults": 2,
            "children": 0,
        },
    )
    assert res1.status_code == 201
    code1 = res1.json()["id"]

    # Raise second request within 1 hour with SAME phone number
    res2 = seeker.post(
        "/api/help-requests",
        json={
            "name": "Kavita Roy (Family)",
            "phone": "+919999888877",
            "address": "100 Park Street, Kolkata",
            "brief": "Followup: sparking wire",
            "adults": 2,
            "children": 0,
        },
    )
    assert res2.status_code == 201
    code2 = res2.json()["id"]

    # Admin checks desk -> duplicate warning must be flagged
    desk = admin.get("/api/desk").json()
    req2_view = next((r for r in desk["requests"] if r["id"] == code2), None)
    assert req2_view is not None
    assert req2_view["duplicateWarning"] is True
    assert code1 in req2_view["duplicateCodes"]


def test_csv_exports(admin, coordinator, seeker):
    # 1. Crises CSV
    crises_csv = admin.get("/api/exports/crises.csv")
    assert crises_csv.status_code == 200
    assert crises_csv.headers["content-type"].startswith("text/csv")
    reader = csv.reader(io.StringIO(crises_csv.text))
    header = next(reader)
    assert "title" in header and "severity" in header and "lat" in header

    # 2. Resources CSV
    res_csv = admin.get("/api/exports/resources.csv")
    assert res_csv.status_code == 200
    reader = csv.reader(io.StringIO(res_csv.text))
    header = next(reader)
    assert "name" in header and "total" in header and "available" in header

    # 3. Help Requests CSV - non-admin sees PII masked
    # Non-admin export
    viewer_csv = coordinator.get("/api/exports/help-requests.csv")
    assert viewer_csv.status_code == 200
    reader = csv.reader(io.StringIO(viewer_csv.text))
    header = next(reader)
    phone_idx = header.index("phone")
    for row in reader:
        # Non-admin sees masked phone (contains '****' or '***')
        assert "****" in row[phone_idx] or row[phone_idx] == "***"

    # 4. Audit CSV - Admin allowed, non-admin denied
    audit_admin = admin.get("/api/exports/audit.csv")
    assert audit_admin.status_code == 200
    assert b"timestamp" in audit_admin.content

    audit_viewer = coordinator.get("/api/exports/audit.csv")
    assert audit_viewer.status_code in (401, 403)
