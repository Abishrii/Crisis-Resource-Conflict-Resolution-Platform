import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

PASSWORD = "Resqsync#2026"


@pytest.fixture()
def settings(tmp_path):
    test_pg = os.environ.get("TEST_DATABASE_URL")
    if test_pg and "postgres" in test_pg.lower():
        schema = f"test_{uuid.uuid4().hex[:8]}"
        import psycopg

        raw_url = test_pg.replace("postgresql+psycopg://", "postgresql://")
        with psycopg.connect(raw_url) as conn:
            conn.execute(f"CREATE SCHEMA {schema}")
            conn.commit()

        sep = "&" if "?" in test_pg else "?"
        url_with_schema = f"{test_pg}{sep}options=-csearch_path%3D{schema}"

        st = Settings(
            env="test",
            database_url=url_with_schema,
            secret_key="t" * 40,
            upload_dir=tmp_path / "uploads",
            seed_demo_data=True,
            demo_password=PASSWORD,
            allow_demo_reset=True,
            frontend_dist=tmp_path / "nodist",
            login_max_failures=4,
        )
        yield st
        with psycopg.connect(raw_url) as conn:
            conn.execute(f"DROP SCHEMA {schema} CASCADE")
            conn.commit()
    else:
        yield Settings(
            env="test",
            database_url=f"sqlite:///{tmp_path / 'test.db'}",
            secret_key="t" * 40,
            upload_dir=tmp_path / "uploads",
            seed_demo_data=True,
            demo_password=PASSWORD,
            allow_demo_reset=True,
            frontend_dist=tmp_path / "nodist",
            login_max_failures=4,
        )


@pytest.fixture()
def app(settings):
    return create_app(settings)


@pytest.fixture()
def client(app):
    with TestClient(app, base_url="http://testserver") as c:
        yield c


def login(app, email, password=PASSWORD):
    c = TestClient(app, base_url="http://testserver")
    r = c.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return c


@pytest.fixture()
def admin(app, client):
    return login(app, "aditi@example.org")


@pytest.fixture()
def manager(app, client):
    return login(app, "arjun@example.org")


@pytest.fixture()
def coordinator(app, client):
    return login(app, "meera@example.org")


@pytest.fixture()
def viewer(app, client):
    return login(app, "rohan@example.org")


@pytest.fixture()
def seeker(app, client):
    return login(app, "seeker@example.org")


def res(snapshot, rid):
    return next(r for r in snapshot["resources"] if r["id"] == rid)


def crisis(snapshot, cid):
    return next(c for c in snapshot["crises"] if c["id"] == cid)
