"""Phase 8 Verification Script: Observability, Metrics, Request-ID, Ruff, CI, and Drift Checks."""

import os
import subprocess
import sys
import urllib.request

BASE_URL = "http://127.0.0.1:8000"


def log_step(name: str):
    print(f"\n[PHASE 8 CHECK] {name}")


def check_request_id():
    log_step("Verifying Request-ID propagation and auto-generation...")
    custom_id = "phase8-trace-custom-98765"
    req = urllib.request.Request(
        f"{BASE_URL}/api/meta", headers={"X-Request-ID": custom_id}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        hdr = resp.headers.get("X-Request-ID")
        assert hdr == custom_id, f"Expected {custom_id}, got {hdr}"
    print(f"  [PASS] Custom X-Request-ID propagated correctly: {hdr}")

    req_auto = urllib.request.Request(f"{BASE_URL}/api/meta")
    with urllib.request.urlopen(req_auto) as resp:
        assert resp.status == 200
        hdr_auto = resp.headers.get("X-Request-ID")
        assert hdr_auto and len(hdr_auto) >= 16, f"Invalid auto request ID: {hdr_auto}"
    print(f"  [PASS] Auto-generated X-Request-ID present: {hdr_auto}")


def check_prometheus_metrics():
    log_step("Verifying Prometheus 0.0.4 text /metrics endpoint...")
    req = urllib.request.Request(f"{BASE_URL}/metrics")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        ct = resp.headers.get("Content-Type", "")
        assert "text/plain" in ct and "version=0.0.4" in ct, (
            f"Expected Prometheus 0.0.4 header, got {ct}"
        )
        body = resp.read().decode("utf-8")

    assert "# HELP resqsync_http_requests_total" in body, (
        "Missing resqsync_http_requests_total HELP"
    )
    assert "# TYPE resqsync_http_requests_total counter" in body, (
        "Missing resqsync_http_requests_total TYPE"
    )
    assert "# HELP resqsync_uptime_seconds" in body, (
        "Missing resqsync_uptime_seconds HELP"
    )
    assert "# HELP resqsync_active_crises_total" in body, (
        "Missing resqsync_active_crises_total HELP"
    )
    assert "# HELP resqsync_resources_total" in body, (
        "Missing resqsync_resources_total HELP"
    )
    assert "# HELP resqsync_demands_total" in body, (
        "Missing resqsync_demands_total HELP"
    )
    assert "# HELP resqsync_help_requests_total" in body, (
        "Missing resqsync_help_requests_total HELP"
    )
    assert "# HELP resqsync_outbox_messages_total" in body, (
        "Missing resqsync_outbox_messages_total HELP"
    )
    assert body.endswith("\n"), "Prometheus format must end with newline"
    print(
        f"  [PASS] Prometheus 0.0.4 metrics valid ({len(body.splitlines())} lines rendered)"
    )


def check_ruff():
    log_step("Verifying Ruff linter and formatter compliance on backend/...")
    ruff_cmd = None
    for candidate in [
        [sys.executable, "-m", "ruff"],
        ["py", "-m", "ruff"],
        ["python", "-m", "ruff"],
        ["ruff"],
    ]:
        try:
            res = subprocess.run(
                candidate + ["--version"], capture_output=True, text=True
            )
            if res.returncode == 0:
                ruff_cmd = candidate
                break
        except Exception:
            continue
    assert ruff_cmd is not None, (
        "Ruff could not be found via sys.executable, py, python, or PATH"
    )

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    check = subprocess.run(
        ruff_cmd + ["check", "backend"], cwd=root_dir, capture_output=True, text=True
    )
    assert check.returncode == 0, f"Ruff check failed: {check.stdout}\n{check.stderr}"
    print("  [PASS] Ruff check: zero lint warnings/errors")

    fmt = subprocess.run(
        ruff_cmd + ["format", "--check", "backend"],
        cwd=root_dir,
        capture_output=True,
        text=True,
    )
    assert fmt.returncode == 0, f"Ruff format check failed: {fmt.stdout}\n{fmt.stderr}"
    print("  [PASS] Ruff format --check: 100% formatted")


def check_ci_workflow():
    log_step("Verifying GitHub Actions CI workflow config...")
    ci_path = os.path.join(
        os.path.dirname(__file__), "..", ".github", "workflows", "ci.yml"
    )
    assert os.path.isfile(ci_path), f"ci.yml not found at {ci_path}"
    with open(ci_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "backend-lint:" in content, "Missing backend-lint job in ci.yml"
    assert "backend-tests:" in content, "Missing backend-tests job in ci.yml"
    assert "db: [sqlite, postgres]" in content, "Missing db matrix in ci.yml"
    assert "frontend:" in content, "Missing frontend job in ci.yml"
    assert "e2e-live:" in content, "Missing e2e-live job in ci.yml"
    assert "sync-archive.cjs" in content, "Missing drift check in ci.yml"
    print("  [PASS] GitHub Actions CI workflow complete and valid")


def check_archive_sync():
    log_step(
        "Verifying sync-archive drift between public/archive/index.html and src/..."
    )
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
    run_sync = subprocess.run(
        ["node", "scripts/sync-archive.cjs"],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
    )
    assert run_sync.returncode == 0, f"sync-archive.cjs failed: {run_sync.stderr}"
    print("  [PASS] Frontend archive sync executed cleanly with zero drift")


def main():
    print("==================================================")
    print("      ResQSync Phase 8 Verification Suite         ")
    print("==================================================")
    check_request_id()
    check_prometheus_metrics()
    check_ruff()
    check_ci_workflow()
    check_archive_sync()
    print("\n==================================================")
    print("  ALL PHASE 8 QUALITY & OBSERVABILITY CHECKS PASSED")
    print("==================================================")


if __name__ == "__main__":
    main()
