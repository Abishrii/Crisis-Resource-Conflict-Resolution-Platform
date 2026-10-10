import sys
import json
import time
import requests

BASE_BACKEND = "http://127.0.0.1:8000"
BASE_FRONTEND_PROXY = "http://localhost:5173/api"
PASSWORD = "Resqsync#2026"

def print_header(title):
    print("\n" + "=" * 65)
    print(f" {title}")
    print("=" * 65)

def test_health():
    print_header("1. Checking Backend Health & Connectivity")
    try:
        r = requests.get(f"{BASE_BACKEND}/health", timeout=5)
        print(f"Direct Backend Health ({BASE_BACKEND}/health): {r.status_code} -> {r.json()}")
        assert r.status_code == 200
    except Exception as e:
        print(f"FAILED to reach direct backend: {e}")
        return False

    try:
        r2 = requests.get(f"{BASE_FRONTEND_PROXY}/health", timeout=5)
        print(f"Vite Proxy Health ({BASE_FRONTEND_PROXY}/health): {r2.status_code} -> {r2.json()}")
        assert r2.status_code == 200
    except Exception as e:
        print(f"Vite Proxy check note: {e}")

    return True

def create_session(email, password=PASSWORD):
    s = requests.Session()
    r = s.post(f"{BASE_BACKEND}/api/auth/login", json={"email": email, "password": password}, timeout=5)
    if r.status_code != 200:
        raise RuntimeError(f"Login failed for {email} ({r.status_code}): {r.text}")
    data = r.json()
    user_info = data["user"]
    token = data.get("token")
    if token:
        s.headers["Authorization"] = f"Bearer {token}"
    return s, user_info

def run_tests():
    if not test_health():
        sys.exit(1)

    print_header("2. Verifying All Roles Can Authenticate & Obtain Real Database Context")
    roles = {
        "admin": "aditi@example.org",
        "crisis-manager": "arjun@example.org",
        "resource-coordinator": "meera@example.org",
        "viewer": "rohan@example.org",
        "help-seeker": "seeker@example.org"
    }
    
    sessions = {}
    for role_name, email in roles.items():
        sess, user = create_session(email)
        sessions[role_name] = sess
        print(f"  [OK] Authenticated '{role_name}' -> ID: {user['id']}, Name: {user['name']}, Email: {user['email']}, Role: {user['role']}")
        assert user["role"] == role_name, f"Expected role {role_name}, got {user['role']}"

    print_header("3. Verifying Live Real Data in Database (Not Mock or Static)")
    mgr_sess = sessions["crisis-manager"]
    ws_resp = mgr_sess.get(f"{BASE_BACKEND}/api/workspace", timeout=5)
    assert ws_resp.status_code == 200, f"Workspace fetch failed: {ws_resp.status_code}"
    ws = ws_resp.json()
    revision_start = ws.get('revision', 0)
    print(f"  Live Database Snapshot from backend:")
    print(f"    - Database Revision: {revision_start}")
    print(f"    - Crises Count: {len(ws.get('crises', []))}")
    print(f"    - Resource Pools: {len(ws.get('resources', []))}")
    print(f"    - Registered Users: {len(ws.get('users', []))}")
    print(f"    - Messages: {len(ws.get('messages', []))}")
    print(f"    - Audit Log Entries: {len(ws.get('audit', []))}")
    print(f"    - Active Resource Pool Example: {ws['resources'][0]['name']} (Total={ws['resources'][0]['total']}, Organization='{ws['resources'][0]['organization']}')")
    
    assert len(ws['crises']) > 0
    assert len(ws['resources']) > 0

    print_header("4. Live Cross-Role Lifecycle: Seeker -> Manager -> Coordinator -> Admin")
    seeker_sess = sessions["help-seeker"]
    coord_sess = sessions["resource-coordinator"]
    admin_sess = sessions["admin"]
    
    # Step A: Help Seeker raises a real emergency request
    test_ts = int(time.time())
    req_payload = {
        "name": "Kavita Menon",
        "phone": "+91 98470 00011",
        "address": f"14 Canal Road, Sector 3, Kochi {test_ts}",
        "brief": f"Ground floor flooded, 4 family members trapped on terrace ({test_ts})",
        "adults": 2,
        "children": 2
    }
    create_req = seeker_sess.post(f"{BASE_BACKEND}/api/help-requests", json=req_payload, timeout=5)
    assert create_req.status_code in (200, 201), f"Create help request failed: {create_req.status_code} {create_req.text}"
    req_data = create_req.json()
    req_id = req_data["id"]
    print(f"  [Step A] Help Seeker raised emergency request:")
    print(f"           ID: {req_id} | Status: {req_data['status']} | Address: {req_data['address']}")
    assert req_data["status"] == "opened"

    # Step B: Crisis Manager views queue and verifies request
    mgr_desk = mgr_sess.get(f"{BASE_BACKEND}/api/help-requests", timeout=5).json()
    found_mgr = next((r for r in mgr_desk if r["id"] == req_id), None)
    assert found_mgr is not None, f"Crisis Manager could not see new request {req_id}"
    print(f"  [Step B] Crisis Manager fetched queue -> Request {req_id} found (status={found_mgr['status']})")
    
    ver_resp = mgr_sess.post(f"{BASE_BACKEND}/api/help-requests/{req_id}/verify", json={}, timeout=5)
    assert ver_resp.status_code == 200, f"Verify failed: {ver_resp.text}"
    print(f"  [Step B] Crisis Manager verified request {req_id} -> Status: {ver_resp.json()['status']}")

    # Step C: Seeker's view immediately reflects verified
    seeker_view = seeker_sess.get(f"{BASE_BACKEND}/api/help-requests/{req_id}", timeout=5).json()
    print(f"  [Step C] Help Seeker queries own request -> Status is now '{seeker_view['status']}' (Reflected live!)")
    assert seeker_view["status"] == "verified"

    # Step D: Crisis Manager assigns an Ambulance pool (R-AMB)
    amb_before = mgr_sess.get(f"{BASE_BACKEND}/api/resources/R-AMB", timeout=5).json()
    used_before = amb_before["used"]
    avail_before = amb_before["available"]
    print(f"  [Step D] Ambulance pool (R-AMB) before assignment: Used={used_before}, Available={avail_before}")

    assign_resp = mgr_sess.post(f"{BASE_BACKEND}/api/help-requests/{req_id}/assign", json={"resourceId": "R-AMB"}, timeout=5)
    assert assign_resp.status_code == 200, f"Assign failed: {assign_resp.text}"
    print(f"  [Step D] Crisis Manager assigned R-AMB to request {req_id}.")

    # Step E: Resource Coordinator sees updated inventory and assigned queue
    coord_res = coord_sess.get(f"{BASE_BACKEND}/api/resources/R-AMB", timeout=5).json()
    print(f"  [Step E] Resource Coordinator queries R-AMB: Used={coord_res['used']}, Available={coord_res['available']}")
    assert coord_res["used"] == used_before + 1, f"Expected used {used_before + 1}, got {coord_res['used']}"
    print(f"           Live inventory deduction confirmed: Available decreased from {avail_before} to {coord_res['available']}.")

    # Step F: Resource Coordinator confirms dispatch
    dispatch_resp = coord_sess.post(f"{BASE_BACKEND}/api/help-requests/{req_id}/dispatch", json={}, timeout=5)
    assert dispatch_resp.status_code == 200, f"Dispatch failed: {dispatch_resp.text}"
    print(f"  [Step F] Resource Coordinator dispatched unit -> Status: {dispatch_resp.json()['status']}")

    # Step G: Seeker sees 'enroute'
    seeker_view2 = seeker_sess.get(f"{BASE_BACKEND}/api/help-requests/{req_id}", timeout=5).json()
    print(f"  [Step G] Help Seeker view reflects dispatch -> Status is now '{seeker_view2['status']}'")
    assert seeker_view2["status"] == "enroute"

    # Step H: Crisis Manager marks request resolved -> unit released back to pool
    resolve_resp = mgr_sess.post(f"{BASE_BACKEND}/api/help-requests/{req_id}/resolve", json={}, timeout=5)
    assert resolve_resp.status_code == 200, f"Resolve failed: {resolve_resp.text}"
    amb_after = mgr_sess.get(f"{BASE_BACKEND}/api/resources/R-AMB", timeout=5).json()
    print(f"  [Step H] Crisis Manager resolved request {req_id} -> Status: {resolve_resp.json()['status']}")
    print(f"           R-AMB used count returned to {amb_after['used']} (unit safely released back to available pool).")
    assert amb_after["used"] == used_before

    # Step I: Admin verifies complete activity audit trail
    admin_ws = admin_sess.get(f"{BASE_BACKEND}/api/workspace", timeout=5).json()
    latest_audits = admin_ws.get("audit", [])[:6]
    print(f"\n  [Step I] Admin views Activity Audit Log (Database Revision {admin_ws.get('revision')}):")
    for a in latest_audits:
        print(f"    - [{a.get('at', '')}] {a.get('actor')}: '{a.get('action')}' -> {a.get('detail')}")

    # Step J: Role Authorization Matrix & RBAC Enforcement
    print_header("5. Testing Role Authorization Enforcement (Security Guardrails)")
    viewer_sess = sessions["viewer"]
    
    # 1. Viewer cannot create crises (should return 403)
    bad_crisis = viewer_sess.post(f"{BASE_BACKEND}/api/crises", json={
        "title": "Unauthorized Crisis", "city": "Goa", "region": "Goa", 
        "category": "Flood", "severity": 1, "status": "active", 
        "population": 1, "lat": 15.0, "lng": 73.0
    })
    print(f"  [Test 1] Viewer tries creating crisis -> HTTP {bad_crisis.status_code} ({bad_crisis.text.strip()})")
    assert bad_crisis.status_code == 403, f"Expected 403 for viewer, got {bad_crisis.status_code}"

    # 2. Coordinator cannot approve crisis manager priority overrides (should return 403)
    bad_approve = coord_sess.post(f"{BASE_BACKEND}/api/allocations/approve/R-VENT", json={})
    print(f"  [Test 2] Resource Coordinator tries approving priority recommendation -> HTTP {bad_approve.status_code} ({bad_approve.text.strip()})")
    assert bad_approve.status_code in (403, 404, 405), f"Expected 403/Forbidden, got {bad_approve.status_code}"

    # 3. Seeker cannot access platform workspace internals (should return 403)
    bad_ws = seeker_sess.get(f"{BASE_BACKEND}/api/workspace")
    print(f"  [Test 3] Help Seeker tries accessing internal workspace -> HTTP {bad_ws.status_code} ({bad_ws.text.strip()})")
    assert bad_ws.status_code == 403, f"Expected 403 for seeker, got {bad_ws.status_code}"

    # 4. Crisis Manager creates real incident
    new_crisis_payload = {
        "title": f"Brahmaputra Flash Surge {test_ts}",
        "city": "Guwahati",
        "region": "Assam",
        "category": "Flood",
        "severity": 4,
        "status": "escalating",
        "population": 12500,
        "lat": 26.18,
        "lng": 91.75
    }
    create_c = mgr_sess.post(f"{BASE_BACKEND}/api/crises", json=new_crisis_payload, timeout=5)
    assert create_c.status_code in (200, 201), f"Create crisis failed: {create_c.text}"
    created_crisis = create_c.json()
    print(f"\n  [Test 4] Crisis Manager created real incident: ID={created_crisis['id']}, Title='{created_crisis['title']}'")

    # 5. Admin and Coordinator both see the new crisis immediately
    admin_crises = admin_sess.get(f"{BASE_BACKEND}/api/crises", timeout=5).json()
    assert any(c["id"] == created_crisis["id"] for c in admin_crises), "Admin cannot see crisis"
    coord_crises = coord_sess.get(f"{BASE_BACKEND}/api/crises", timeout=5).json()
    assert any(c["id"] == created_crisis["id"] for c in coord_crises), "Coordinator cannot see crisis"
    print(f"  [Test 5] Incident confirmed visible to Admin and Resource Coordinator in real time.")

    print_header("ALL LIVE BACKEND & ROLE INTERACTION CHECKS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_tests()
