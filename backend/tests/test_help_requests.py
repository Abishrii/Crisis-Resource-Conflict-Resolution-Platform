import base64

PNG = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"\x00" * 40).decode()
BODY = {
    "name": "Test Person",
    "phone": "+91 99999 00000",
    "address": "1 Test Road, Patna",
    "brief": "Water at the door",
    "adults": 2,
    "children": 1,
}


def desk(c):
    return c.get("/api/desk").json()


def test_seeded_requests_use_shared_inventory(admin):
    d = desk(admin)
    assert [r["id"] for r in d["requests"]] == ["RSQ-0043", "RSQ-0042", "RSQ-0041"]
    boat = next(r for r in d["resources"] if r["id"] == "R-BOAT")
    assert boat["assigned"] == 3  # 2 to Assam + 1 to RSQ-0041
    assert len(d["audit"]) > 0


def test_full_lifecycle_and_inventory_effects(app, seeker, manager, coordinator, admin):
    r = seeker.post("/api/help-requests", json={**BODY, "photo": f"data:image/png;base64,{PNG}"})
    assert r.status_code == 201, r.text
    req = r.json()
    code = req["id"]
    assert code == "RSQ-0044" and req["status"] == "opened" and req["photo"] and req["mine"] is True
    assert seeker.get(req["photo"]).headers["content-type"] == "image/png"

    before = next(x for x in desk(manager)["resources"] if x["id"] == "R-AMB")
    # order is enforced
    assert manager.post(f"/api/help-requests/{code}/assign", json={"resourceId": "R-AMB"}).status_code == 409
    assert seeker.post(f"/api/help-requests/{code}/verify").status_code == 403
    assert coordinator.post(f"/api/help-requests/{code}/verify").status_code == 403
    assert manager.post(f"/api/help-requests/{code}/verify", json={"crisisId": "C-MUM"}).json()["status"] == "verified"
    assert manager.post(f"/api/help-requests/{code}/verify").status_code == 409
    assert (
        manager.post(f"/api/help-requests/{code}/assign", json={"resourceId": "R-GEN"}).status_code == 409
    )  # maintenance pool
    a = manager.post(f"/api/help-requests/{code}/assign", json={"resourceId": "R-AMB"}).json()
    assert a["status"] == "assigned" and a["resource"] == "ALS ambulance pool"
    mid = next(x for x in desk(manager)["resources"] if x["id"] == "R-AMB")
    assert mid["assigned"] == before["assigned"] + 1
    assert manager.post(f"/api/help-requests/{code}/dispatch").status_code == 403
    assert coordinator.post(f"/api/help-requests/{code}/dispatch").json()["status"] == "enroute"
    assert manager.post(f"/api/help-requests/{code}/resolve").json()["status"] == "resolved"
    after = next(x for x in desk(manager)["resources"] if x["id"] == "R-AMB")
    assert after["assigned"] == before["assigned"]  # unit returned
    labels = [h["label"] for h in admin.get(f"/api/help-requests/{code}").json()["history"]]
    assert labels[0] == "Request opened" and labels[-1] == "Marked resolved" and "Dispatch confirmed" in labels
    wc = admin.get("/api/workspace").json()
    assert any(
        "Help request RSQ-0044 verified" in e["text"]
        for e in next(c for c in wc["crises"] if c["id"] == "C-MUM")["timeline"]
    )


def test_seeker_sees_only_own_requests(app, seeker, client):
    seeker.post("/api/help-requests", json=BODY)
    assert [r["id"] for r in desk(seeker)["requests"]] == ["RSQ-0044"]
    other = client.post(
        "/api/auth/register", json={"name": "Other One", "email": "other@example.org", "password": "A-good-pass-1"}
    )
    assert other.status_code == 200
    assert desk(client)["requests"] == []
    assert client.get("/api/help-requests/RSQ-0044").status_code == 404
    assert client.get("/api/help-requests/RSQ-0041").status_code == 404
    assert desk(client)["resources"] == [] and desk(client)["audit"] == []


def test_viewer_cannot_raise_or_see_requests(viewer):
    assert viewer.post("/api/help-requests", json=BODY).status_code == 403
    assert viewer.get("/api/help-requests").json() == []


def test_photo_validation(seeker):
    assert seeker.post("/api/help-requests", json={**BODY, "photo": "data:text/html;base64,PGI+"}).status_code == 400
    fake = base64.b64encode(b"not really a png at all").decode()
    assert seeker.post("/api/help-requests", json={**BODY, "photo": f"data:image/png;base64,{fake}"}).status_code == 400
    huge = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"0" * (2 * 1024 * 1024 + 10)).decode()
    assert seeker.post("/api/help-requests", json={**BODY, "photo": f"data:image/png;base64,{huge}"}).status_code == 413


def test_request_validation(seeker):
    assert seeker.post("/api/help-requests", json={**BODY, "adults": -1}).status_code == 422
    assert seeker.post("/api/help-requests", json={**BODY, "brief": ""}).status_code == 422
    assert seeker.post("/api/help-requests", json={**BODY, "owner_id": 1}).status_code == 422


def test_cannot_assign_beyond_capacity(manager):
    # exhaust R-COMM (6 total, 1 used) with direct allocations, then a request assignment must fail
    assert (
        manager.post(
            "/api/allocations", json={"resourceId": "R-COMM", "crisisId": "C-MUM", "quantity": 5, "reason": "all of it"}
        ).status_code
        == 201
    )
    code = manager.post("/api/help-requests", json=BODY).json()["id"]
    manager.post(f"/api/help-requests/{code}/verify")
    r = manager.post(f"/api/help-requests/{code}/assign", json={"resourceId": "R-COMM"})
    assert r.status_code == 409 and "No available capacity" in r.json()["detail"]


def test_live_event_hub_receives_commits(app, manager):
    got = []
    import asyncio

    async def run():
        sub = app.state.hub.subscribe()
        await asyncio.get_running_loop().run_in_executor(
            None, lambda: manager.post("/api/messages", json={"channel": "network", "text": "evt"})
        )
        got.append(await asyncio.wait_for(sub[1].get(), 3))

    asyncio.run(run())
    assert got[0]["type"] == "change" and got[0]["revision"] >= 2
