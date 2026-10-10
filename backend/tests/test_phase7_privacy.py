from datetime import timedelta

import pytest
from sqlalchemy import select

from app.database import utcnow
from app.models import AuditLog, HelpRequest, User


def test_download_my_data(app, seeker):
    # Seeker downloads their data
    res = seeker.get("/api/me/data")
    assert res.status_code == 200
    data = res.json()
    assert data["exportFormat"] == "ResQSync-Data-Portability-v1"
    assert "user" in data
    assert data["user"]["email"] == "seeker@example.org"
    assert "helpRequests" in data
    assert "notifications" in data
    assert "auditTrail" in data
    assert "sessions" in data
    assert "disclaimer" in data


def test_delete_my_account(app, client):
    # Register a new user
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Erasure Seeker",
            "email": "erasure@example.org",
            "password": "Password#2026!",
            "phone": "9876543210",
        },
    )
    assert reg.status_code == 200
    user_id = reg.json()["user"]["id"]

    # Log in and obtain authenticated client
    login = client.post("/api/auth/login", json={"email": "erasure@example.org", "password": "Password#2026!"})
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create a help request for this user
    req_res = client.post(
        "/api/help-requests",
        json={
            "name": "Erasure Seeker",
            "phone": "9876543210",
            "address": "123 Privacy St",
            "brief": "Need rations urgently",
            "adults": 2,
            "children": 1,
        },
        headers=headers,
    )
    assert req_res.status_code == 201
    code = req_res.json()["id"]

    # Wrong password attempt
    bad_del = client.post(
        "/api/me/delete-account", json={"password": "WrongPassword123!", "confirm": True}, headers=headers
    )
    assert bad_del.status_code == 403

    # Correct password deletion
    ok_del = client.post(
        "/api/me/delete-account", json={"password": "Password#2026!", "confirm": True}, headers=headers
    )
    assert ok_del.status_code == 200
    assert "anonymised" in ok_del.json()["message"]

    # Verification: old session is dead
    check_me = client.get("/api/auth/me", headers=headers)
    assert check_me.status_code == 401

    with app.state.db.write_session() as session:
        # Verify user record in database
        db_user = session.get(User, user_id)
        assert db_user.name == "[Deleted User]"
        assert db_user.email == f"deleted-{user_id}@anonymised.local"
        assert db_user.phone is None
        assert db_user.status == "disabled"

        # Verify help request personal data scrubbed
        hr = session.scalar(select(HelpRequest).where(HelpRequest.seq == int(code[4:])))
        assert hr.name == "[Anonymised]"
        assert hr.phone == "***"
        assert hr.address == "[Anonymised]"

        # Verify audit log recorded deletion
        audit_entry = session.scalar(
            select(AuditLog).where(AuditLog.action == "Account deleted").order_by(AuditLog.id.desc())
        )
        assert audit_entry is not None
        assert f"User id={user_id}" in audit_entry.detail


def test_admin_anonymise_user(app, admin, manager, client):
    # Non-admin cannot anonymise user
    res = manager.post("/api/users/2/anonymise")
    assert res.status_code == 403

    # Admin cannot anonymise self
    me_res = admin.get("/api/auth/me")
    my_id = me_res.json()["user"]["id"]
    self_res = admin.post(f"/api/users/{my_id}/anonymise")
    assert self_res.status_code == 409

    # Create a dummy user
    reg = client.post(
        "/api/auth/register",
        json={
            "name": "Privacy Subject",
            "email": "subject@example.org",
            "password": "Password#2026!",
            "phone": "9998887776",
        },
    )
    target_id = reg.json()["user"]["id"]

    # Admin anonymises the user
    anon_res = admin.post(f"/api/users/{target_id}/anonymise")
    assert anon_res.status_code == 200

    with app.state.db.write_session() as session:
        target_user = session.get(User, target_id)
        assert target_user.name == "[Anonymised User]"
        assert target_user.email == f"anon-{target_id}@anonymised.local"
        assert target_user.phone is None
        assert target_user.status == "disabled"

        # Audit log entry exists
        audit_entry = session.scalar(
            select(AuditLog).where(AuditLog.action == "User anonymised").order_by(AuditLog.id.desc())
        )
        assert audit_entry is not None
        assert f"User id={target_id}" in audit_entry.detail


def test_data_retention_auto_anonymisation(app, admin):
    now = utcnow()
    old_time = now - timedelta(days=45)
    recent_time = now - timedelta(days=5)

    with app.state.db.write_session() as session:
        # 1. Resolved request older than 30 days
        r1 = HelpRequest(
            seq=9910,
            name="Old Resolved Resident",
            phone="9988776655",
            address="Sector 40 Flood Relief Zone",
            brief="Shelter was needed",
            status="resolved",
            created_at=old_time,
        )
        # 2. Resolved request only 5 days old
        r2 = HelpRequest(
            seq=9911,
            name="Recent Resolved Resident",
            phone="9988776656",
            address="Sector 12 Evacuation Camp",
            brief="Medical pack provided",
            status="resolved",
            created_at=recent_time,
        )
        # 3. Active/opened request 45 days old (must NOT be anonymised because it's still unresolved!)
        r3 = HelpRequest(
            seq=9912,
            name="Old Active Resident",
            phone="9988776657",
            address="Hillside Outpost",
            brief="Still waiting for rescue",
            status="opened",
            created_at=old_time,
        )
        session.add_all([r1, r2, r3])
        session.commit()

    # Trigger retention run with days=30
    run_res = admin.post("/api/admin/privacy/retention-run", json={"days": 30})
    assert run_res.status_code == 200
    data = run_res.json()
    assert data["anonymised"] >= 1
    assert data["retentionDays"] == 30

    with app.state.db.write_session() as session:
        r1_ref = session.scalar(select(HelpRequest).where(HelpRequest.seq == 9910))
        r2_ref = session.scalar(select(HelpRequest).where(HelpRequest.seq == 9911))
        r3_ref = session.scalar(select(HelpRequest).where(HelpRequest.seq == 9912))

        # r1 should be anonymised
        assert r1_ref.name == "[Anonymised]"
        assert r1_ref.phone == "***"
        assert r1_ref.address == "[Anonymised]"

        # r2 must remain intact
        assert r2_ref.name == "Recent Resolved Resident"
        assert r2_ref.phone == "9988776656"

        # r3 must remain intact (still active!)
        assert r3_ref.name == "Old Active Resident"
        assert r3_ref.phone == "9988776657"


def test_audit_log_immutability(app, admin):
    # Public & admin endpoints must disallow DELETE/PATCH/PUT on audit
    del_res = admin.delete("/api/audit")
    assert del_res.status_code in (404, 405)

    del_item = admin.delete("/api/audit/1")
    assert del_item.status_code in (404, 405)

    patch_item = admin.patch("/api/audit/1", json={"detail": "tampered"})
    assert patch_item.status_code in (404, 405)

    put_item = admin.put("/api/audit/1", json={"detail": "tampered"})
    assert put_item.status_code in (404, 405)

    # ORM level immutability check
    with app.state.db.write_session() as session:
        audit_entry = session.scalar(select(AuditLog).limit(1))
        if audit_entry:
            with pytest.raises(ValueError, match="append-only"):
                session.delete(audit_entry)
                session.flush()
            session.rollback()


def test_privacy_policy_endpoint(client):
    res = client.get("/api/privacy/policy")
    assert res.status_code == 200
    data = res.json()
    assert "title" in data
    assert "dataCollected" in data
    assert len(data["dataCollected"]) >= 3
    assert "governanceControls" in data
    assert len(data["governanceControls"]) >= 4
    assert "legalDisclaimer" in data
    assert "does NOT constitute formal legal advice" in data["legalDisclaimer"]
