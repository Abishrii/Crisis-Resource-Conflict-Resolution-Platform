import threading

from conftest import crisis, login, res


def snap(c):
    r = c.get("/api/workspace")
    assert r.status_code == 200, r.text
    return r.json()


def test_snapshot_matches_training_dataset(admin):
    s = snap(admin)
    assert len(s["crises"]) == 7 and len(s["resources"]) == 10
    assert s["metrics"]["active"] == 5 and s["metrics"]["escalating"] == 1
    assert s["metrics"]["conflicts"] == 4  # the "four resource pools" notice
    assert res(s, "R-OXY")["total"] == 24 and res(s, "R-KIT")["total"] == 1200
    assert set(s["plans"]) == {"R-TEAM", "R-BOAT", "R-VENT", "R-OXY"}


def test_priority_scoring_is_transparent_and_capped(admin):
    plan = snap(admin)["plans"]["R-VENT"]
    assert [(p["crisisId"], p["score"], p["allocation"]) for p in plan] == [
        ("C-ASM", 89, 4),
        ("C-DEL", 75, 6),
        ("C-WAY", 71, 0),
    ]
    assert sum(p["allocation"] for p in plan) <= 10


def test_approve_recommendation_moves_inventory_and_records_decision(manager):
    r = manager.post("/api/resources/R-VENT/approve")
    assert r.status_code == 200, r.text
    s = snap(manager)
    vent = res(s, "R-VENT")
    assert vent["used"] == 10 and vent["available"] == 0
    assert {a["crisisId"]: a["quantity"] for a in vent["allocations"]} == {"C-ASM": 4, "C-DEL": 6}
    assert any(d["type"] == "Recommendation approved" for d in s["decisions"])
    assert any("assigned from Ventilator reserve" in e["text"] for e in crisis(s, "C-ASM")["timeline"])
    # WAY's request stays visible and unmet
    assert any(q["resourceId"] == "R-VENT" and q["crisisId"] == "C-WAY" and q["quantity"] == 5 for q in s["requests"])
    assert manager.post("/api/resources/R-VENT/approve").status_code == 409  # nothing left to approve


def test_coordinator_cannot_approve_or_assign_into_contested_pool(coordinator):
    assert coordinator.post("/api/resources/R-VENT/approve").status_code == 403
    r = coordinator.post(
        "/api/allocations", json={"resourceId": "R-VENT", "crisisId": "C-DEL", "quantity": 1, "reason": "Need it now"}
    )
    assert r.status_code == 403 and "must approve" in r.json()["detail"]
    ok = coordinator.post(
        "/api/allocations",
        json={"resourceId": "R-KIT", "crisisId": "C-MUM", "quantity": 50, "reason": "Relief kits for camps"},
    )
    assert ok.status_code == 201  # uncontested pool: allowed


def test_override_requires_manager_and_reason_and_capacity(manager, coordinator):
    body = {
        "resourceId": "R-VENT",
        "crisisId": "C-WAY",
        "quantity": 3,
        "reason": "Landslide hospital cut off",
        "override": True,
    }
    assert coordinator.post("/api/allocations", json=body).status_code == 403
    assert manager.post("/api/allocations", json={**body, "reason": "short"}).status_code == 400
    assert (
        manager.post("/api/allocations", json={**body, "quantity": 11}).status_code == 409
    )  # capacity still limits overrides
    assert manager.post("/api/allocations", json=body).status_code == 201
    s = snap(manager)
    assert any(d["type"] == "Manual override" for d in s["decisions"])
    assert (
        next(q for q in s["requests"] if q["resourceId"] == "R-VENT" and q["crisisId"] == "C-WAY")["quantity"] == 2
    )  # demand reduced 5 -> 2


def test_assign_to_resolved_crisis_or_maintenance_pool_rejected(manager, admin):
    bad = {"resourceId": "R-KIT", "crisisId": "C-PUN", "quantity": 1, "reason": "x"}
    assert manager.post("/api/allocations", json=bad).status_code == 409
    gen = {"resourceId": "R-GEN", "crisisId": "C-MUM", "quantity": 1, "reason": "x"}
    assert manager.post("/api/allocations", json=gen).status_code == 409
    assert (
        manager.post(
            "/api/allocations", json={"resourceId": "NOPE", "crisisId": "C-MUM", "quantity": 1, "reason": "x"}
        ).status_code
        == 404
    )


def test_release_and_maintenance_rules(admin):
    assert admin.post("/api/resources/R-AMB/maintenance").status_code == 409  # still assigned
    assert admin.post("/api/resources/R-AMB/release", json={"crisisId": "C-MUM"}).json()["released"] == 2
    assert admin.post("/api/resources/R-AMB/release", json={"crisisId": "C-DEL"}).json()["released"] == 2
    assert admin.post("/api/resources/R-AMB/release", json={"crisisId": "C-DEL"}).status_code == 404
    assert admin.post("/api/resources/R-AMB/maintenance").json()["maintenance"] is True
    assert res(snap(admin), "R-AMB")["available"] == 0
    assert admin.post("/api/resources/R-AMB/maintenance").json()["maintenance"] is False
    assert res(snap(admin), "R-AMB")["available"] == 8


def test_resolving_crisis_releases_its_assignments(manager):
    before = res(snap(manager), "R-OXY")["available"]
    assert manager.patch("/api/crises/C-DEL", json={"status": "resolved"}).status_code == 200
    s = snap(manager)
    assert res(s, "R-OXY")["available"] == before + 8
    assert not any(a["crisisId"] == "C-DEL" for r in s["resources"] for a in r["allocations"])
    assert any("Status changed to resolved" in e["text"] for e in crisis(s, "C-DEL")["timeline"])
    assert not any(
        p["crisisId"] == "C-DEL" for plan in s["plans"].values() for p in plan
    )  # resolved incidents leave the queue


def test_crisis_create_validation_and_permissions(manager, coordinator, viewer):
    body = {
        "title": "Test flood",
        "city": "Patna",
        "region": "Bihar",
        "category": "Flood",
        "severity": 3,
        "status": "active",
        "population": 100,
        "lat": 25.6,
        "lng": 85.1,
    }
    assert coordinator.post("/api/crises", json=body).status_code == 403
    assert viewer.post("/api/crises", json=body).status_code == 403
    assert manager.post("/api/crises", json={**body, "lat": 60}).status_code == 400
    assert manager.post("/api/crises", json={**body, "severity": 9}).status_code == 422
    assert manager.post("/api/crises", json={**body, "category": "Zombies"}).status_code == 400
    assert manager.post("/api/crises", json={**body, "status": "resolved"}).status_code == 422
    r = manager.post("/api/crises", json=body)
    assert r.status_code == 201
    new = r.json()
    assert new["responseMinutes"] is None and new["timeline"][0]["text"] == "Incident created."
    # first assignment records response time
    manager.post(
        "/api/allocations", json={"resourceId": "R-KIT", "crisisId": new["id"], "quantity": 10, "reason": "Kits"}
    )
    assert crisis(snap(manager), new["id"])["responseMinutes"] >= 1


def test_resource_create_and_capacity_guard(coordinator, manager):
    body = {
        "name": "Drones",
        "type": "Equipment",
        "total": 5,
        "unit": "drones",
        "cost": 100,
        "organization": "Org",
        "capability": "Survey",
    }
    assert manager.post("/api/resources", json=body).status_code == 403
    rid = coordinator.post("/api/resources", json=body).json()["id"]
    assert coordinator.patch(f"/api/resources/{rid}", json={"total": 8}).status_code == 200
    assert coordinator.post("/api/resources", json={**body, "type": "Magic"}).status_code == 400
    coordinator.post(
        "/api/allocations", json={"resourceId": rid, "crisisId": "C-MUM", "quantity": 6, "reason": "Survey"}
    )
    assert coordinator.patch(f"/api/resources/{rid}", json={"total": 5}).status_code == 409


def test_demands_merge_and_get_filled(manager):
    d = {"resourceId": "R-KIT", "crisisId": "C-MUM", "quantity": 20, "reason": "Camp supplies"}
    manager.post("/api/demands", json=d)
    manager.post("/api/demands", json=d)
    s = snap(manager)
    assert next(q for q in s["requests"] if q["resourceId"] == "R-KIT")["quantity"] == 40
    manager.post(
        "/api/allocations", json={"resourceId": "R-KIT", "crisisId": "C-MUM", "quantity": 25, "reason": "Part fill"}
    )
    s = snap(manager)
    assert next(q for q in s["requests"] if q["resourceId"] == "R-KIT")["quantity"] == 15
    assert manager.post("/api/demands", json={**d, "crisisId": "C-PUN"}).status_code == 400


def test_negotiation_flow(coordinator, manager):
    nid = coordinator.post(
        "/api/negotiations", json={"resourceId": "R-BOAT", "proposal": "Share boats; Assam backfill later"}
    ).json()["id"]
    assert coordinator.post(f"/api/negotiations/{nid}/agree").status_code == 403
    assert manager.post(f"/api/negotiations/{nid}/agree").json()["status"] == "resolved"
    assert manager.post(f"/api/negotiations/{nid}/agree").status_code == 409
    n = next(n for n in snap(manager)["negotiations"] if n["id"] == nid)
    assert n["status"] == "resolved" and n["agreedBy"] == "Arjun Nair"


def test_concurrent_assignments_never_overallocate(app, client):
    clients = [login(app, "arjun@example.org") for _ in range(8)]
    results = []

    def go(c):
        results.append(
            c.post(
                "/api/allocations", json={"resourceId": "R-KIT", "crisisId": "C-MUM", "quantity": 400, "reason": "race"}
            ).status_code
        )

    threads = [threading.Thread(target=go, args=(c,)) for c in clients]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert results.count(201) == 2 and results.count(409) == 6
    kit = res(snap(clients[0]), "R-KIT")
    assert kit["used"] <= kit["total"]


def test_messages_threads_and_notifications(manager, viewer):
    assert viewer.post("/api/messages", json={"channel": "network", "text": "hello"}).status_code == 403
    assert manager.post("/api/messages", json={"channel": "C-NOPE", "text": "hello"}).status_code == 400
    assert manager.post("/api/messages", json={"channel": "C-MUM", "text": "Boats on the way"}).status_code == 201
    s = snap(manager)
    assert any(m["text"] == "Boats on the way" and m["author"] == "Arjun Nair" for m in s["messages"])
    assert any("comment was added" in e["text"] for e in crisis(s, "C-MUM")["timeline"])
    assert any(not n["read"] for n in s["notifications"])
    manager.post("/api/notifications/read")
    assert all(n["read"] for n in snap(manager)["notifications"])
    assert any(not n["read"] for n in snap(viewer)["notifications"])  # read state is per user


def test_attachments_roundtrip_and_validation(manager, viewer):
    f = {"file": ("plan.txt", b"evacuation plan", "text/plain")}
    r = manager.post("/api/attachments", data={"channel": "network"}, files=f)
    assert r.status_code == 201, r.text
    aid = r.json()["id"]
    dl = viewer.get(f"/api/attachments/{aid}/download")
    assert dl.status_code == 200 and dl.content == b"evacuation plan"
    assert "attachment" in dl.headers["content-disposition"] and dl.headers["x-content-type-options"] == "nosniff"
    assert (
        manager.post(
            "/api/attachments",
            data={"channel": "network"},
            files={"file": ("x.exe", b"MZ", "application/octet-stream")},
        ).status_code
        == 400
    )
    assert (
        manager.post(
            "/api/attachments", data={"channel": "network"}, files={"file": ("e.txt", b"", "text/plain")}
        ).status_code
        == 400
    )
    assert (
        manager.post(
            "/api/attachments",
            data={"channel": "network"},
            files={"file": ("big.txt", b"x" * (5 * 1024 * 1024 + 1), "text/plain")},
        ).status_code
        == 413
    )
    assert viewer.post("/api/attachments", data={"channel": "network"}, files=f).status_code == 403
    assert any(a["id"] == aid for a in snap(viewer)["attachments"])


def test_user_admin_rules(admin, manager):
    assert (
        manager.post(
            "/api/users", json={"name": "X", "email": "x@example.org", "organization": "O", "role": "viewer"}
        ).status_code
        == 403
    )
    r = admin.post(
        "/api/users",
        json={"name": "Priya Sen", "email": "priya@example.org", "organization": "Relief", "role": "viewer"},
    )
    assert r.status_code == 201 and r.json()["temporaryPassword"]
    temp = r.json()["temporaryPassword"]
    _c = login(admin.app if hasattr(admin, "app") else None, "priya@example.org", temp) if False else None
    assert (
        admin.post(
            "/api/users", json={"name": "Dup", "email": "PRIYA@example.org", "organization": "O", "role": "viewer"}
        ).status_code
        == 409
    )
    me_id = next(u for u in admin.get("/api/users").json() if u["email"] == "aditi@example.org")["id"]
    assert admin.patch(f"/api/users/{me_id}", json={"role": "viewer"}).status_code == 409  # last admin
    assert admin.patch(f"/api/users/{me_id}", json={"status": "disabled"}).status_code == 409
    uid = r.json()["user"]["id"]
    assert admin.patch(f"/api/users/{uid}", json={"role": "crisis-manager"}).json()["user"]["role"] == "crisis-manager"


def test_non_admin_sees_masked_emails(viewer, admin):
    assert all("***" in u["email"] for u in snap(viewer)["users"] if u["email"] != "rohan@example.org")
    assert all("***" not in u["email"] for u in snap(admin)["users"])


def test_simulation_is_pure_and_save_recomputes(manager, viewer):
    body = {"resourceId": "R-VENT", "capacity": 6, "cost": 5500, "weight": 65}
    before = snap(manager)
    r = manager.post("/api/simulations/run", json=body).json()
    assert r["demand"] == 15 and r["covered"] == 6 and [x["allocation"] for x in r["rows"]] == [4, 2, 0]
    assert snap(manager)["resources"] == before["resources"]  # nothing moved
    assert viewer.post("/api/simulations", json=body).status_code == 403
    saved = manager.post("/api/simulations", json=body).json()
    assert saved["covered"] == 6 and saved["actor"] == "Arjun Nair"
    assert manager.post("/api/simulations/run", json={**body, "weight": 95}).status_code == 422
    assert len(snap(manager)["simulations"]) == 1


def test_analytics_and_reports(admin):
    a = admin.get("/api/analytics?days=30").json()
    assert a["incidents"] == 7 and a["resolved"] == 2
    a7 = admin.get("/api/analytics?days=7").json()
    assert a7["incidents"] == 6 and a7["resolved"] == 1  # the 10-day-old drill falls outside a 7-day window
    assert len(a7["trend"]) == 7 and sum(t["count"] for t in a7["trend"]) == 6
    assert admin.get("/api/analytics?days=90").json()["incidents"] == 7
    assert sum(x["count"] for x in a["bySeverity"]) == a["incidents"]
    pdf = admin.get("/api/reports/export?format=pdf&days=30")
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF-1.4") and pdf.content.rstrip().endswith(b"%%EOF")
    xml = admin.get("/api/reports/export?format=xml&days=30")
    assert (
        xml.status_code == 200
        and b'<Worksheet ss:Name="Crisis records">' in xml.content
        and b"Mumbai monsoon flooding" in xml.content
    )
    assert admin.get("/api/reports/export?format=csv").status_code == 422


def test_audit_trail_records_actor(manager):
    manager.post(
        "/api/crises",
        json={
            "title": "Audit me",
            "city": "Pune",
            "region": "MH",
            "category": "Fire",
            "severity": 2,
            "status": "active",
            "population": 1,
            "lat": 18.5,
            "lng": 73.8,
        },
    )
    top = snap(manager)["audit"][0]
    assert top["actor"] == "Arjun Nair" and top["action"] == "Crisis created"


def test_reset_demo_admin_only_and_keeps_accounts(admin, manager):
    manager.post(
        "/api/crises",
        json={
            "title": "Temp",
            "city": "Pune",
            "region": "MH",
            "category": "Fire",
            "severity": 2,
            "status": "active",
            "population": 1,
            "lat": 18.5,
            "lng": 73.8,
        },
    )
    assert manager.post("/api/admin/reset-demo").status_code == 403
    assert admin.post("/api/admin/reset-demo").status_code == 200
    s = snap(admin)
    assert len(s["crises"]) == 7 and len(s["users"]) == 5


def test_revision_increments_on_change(manager):
    a = snap(manager)["revision"]
    manager.post("/api/messages", json={"channel": "network", "text": "ping"})
    assert snap(manager)["revision"] == a + 1
