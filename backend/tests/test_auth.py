from dataclasses import replace

from conftest import PASSWORD, login


def test_demo_login_and_me(app, client):
    c = login(app, "aditi@example.org")
    me = c.get("/api/auth/me").json()["user"]
    assert me["role"] == "admin" and me["email"] == "aditi@example.org"
    assert "resqsync_session" in c.cookies


def test_bad_password_and_unknown_user_same_error(client):
    a = client.post("/api/auth/login", json={"email": "aditi@example.org", "password": "wrong-password"})
    b = client.post("/api/auth/login", json={"email": "nobody@example.org", "password": "wrong-password"})
    assert a.status_code == b.status_code == 401 and a.json() == b.json()


def test_login_throttle(client):
    for _ in range(4):
        assert (
            client.post(
                "/api/auth/login", json={"email": "aditi@example.org", "password": "nope-nope-nope"}
            ).status_code
            == 401
        )
    assert client.post("/api/auth/login", json={"email": "aditi@example.org", "password": PASSWORD}).status_code == 429


def test_meta_demo_accounts_only_include_known_demo_users(client):
    assert (
        client.post(
            "/api/auth/register",
            json={"name": "Meta User", "email": "meta-user@example.org", "password": "A-good-pass-1"},
        ).status_code
        == 200
    )
    accounts = client.get("/api/meta").json()["demo"]["accounts"]
    emails = {account["email"] for account in accounts}
    assert "meta-user@example.org" not in emails
    assert {"aditi@example.org", "arjun@example.org", "meera@example.org", "seeker@example.org"} <= emails
    assert all("password" not in account for account in accounts)


def test_demo_login_switches_roles(client):
    r = client.post("/api/auth/demo-login", json={"role": "crisis-manager"})
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "crisis-manager"
    assert client.get("/api/auth/me").json()["user"]["role"] == "crisis-manager"

    r = client.post("/api/auth/demo-login", json={"role": "help-seeker"})
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "help-seeker"
    assert client.get("/api/auth/me").json()["user"]["role"] == "help-seeker"


def test_demo_login_disabled_in_production(app, client):
    app.state.settings = replace(app.state.settings, env="production", demo_login=True)
    assert client.post("/api/auth/demo-login", json={"role": "admin"}).status_code == 404


def test_meta_hides_demo_block_in_production(app, client):
    app.state.settings = replace(app.state.settings, env="production", demo_login=True)
    assert client.get("/api/meta").json()["demo"] is None


def test_unauthenticated_requests_rejected(client):
    for path in ("/api/workspace", "/api/desk", "/api/crises", "/api/events"):
        assert client.get(path).status_code == 401


def test_register_creates_help_seeker_only(client):
    r = client.post(
        "/api/auth/register", json={"name": "New Person", "email": "new@example.org", "password": "A-good-pass-1"}
    )
    assert r.status_code == 200 and r.json()["user"]["role"] == "help-seeker"
    assert client.get("/api/workspace").status_code == 403  # seekers have no workspace access
    assert client.get("/api/desk").status_code == 200
    r2 = client.post(
        "/api/auth/register", json={"name": "Dup", "email": "NEW@example.org", "password": "A-good-pass-1"}
    )
    assert r2.status_code == 409


def test_register_cannot_choose_role(client):
    r = client.post(
        "/api/auth/register",
        json={"name": "Evil", "email": "e@example.org", "password": "A-good-pass-1", "role": "admin"},
    )
    assert r.status_code == 422


def test_weak_password_rejected(client):
    r = client.post("/api/auth/register", json={"name": "Weak", "email": "w@example.org", "password": "short1"})
    assert r.status_code == 422


def test_bearer_token_works(app, client):
    token = client.post("/api/auth/login", json={"email": "arjun@example.org", "password": PASSWORD}).json()["token"]
    from fastapi.testclient import TestClient

    fresh = TestClient(app)
    assert (
        fresh.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).json()["user"]["role"]
        == "crisis-manager"
    )
    assert fresh.get("/api/auth/me", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_logout_and_password_change_invalidate(app, admin):
    assert admin.post("/api/auth/change-password", json={"current": "bad", "new": "Another-pass-9"}).status_code == 403
    old = admin.cookies.get("resqsync_session")
    assert (
        admin.post("/api/auth/change-password", json={"current": PASSWORD, "new": "Another-pass-9"}).status_code == 200
    )
    from fastapi.testclient import TestClient

    stale = TestClient(app)
    assert stale.get("/api/auth/me", headers={"Authorization": f"Bearer {old}"}).status_code == 401
    assert admin.get("/api/auth/me").status_code == 200  # the changing session got a fresh token
    admin.post("/api/auth/logout")
    assert admin.get("/api/auth/me").status_code == 401


def test_cross_site_post_blocked(client):
    r = client.post(
        "/api/auth/login",
        json={"email": "aditi@example.org", "password": PASSWORD},
        headers={"Origin": "https://evil.example"},
    )
    assert r.status_code == 403


def test_disabled_user_cannot_use_existing_session(app, admin):
    uid = next(u for u in admin.get("/api/users").json() if u["email"] == "meera@example.org")["id"]
    v = login(app, "meera@example.org")
    assert v.get("/api/workspace").status_code == 200
    assert admin.patch(f"/api/users/{uid}", json={"status": "disabled"}).status_code == 200
    assert v.get("/api/workspace").status_code == 401
