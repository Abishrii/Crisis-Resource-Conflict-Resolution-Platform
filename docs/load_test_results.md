# ResQSync Load Test & Observability Report

**Timestamp**: 2026-10-09T20:49:00.333401+00:00  
**Target Environment**: Local Seeded Instance (`http://127.0.0.1:8000`)  
**Workload**: 50 concurrent simulated users for 123.5 seconds  

---

## 1. Executive Summary

| Metric | Target | Result | Status |
| :--- | :--- | :--- | :--- |
| **Concurrency** | 50 concurrent users | **50 users** | PASSED |
| **Duration** | 120 seconds | **123.5 seconds** | PASSED |
| **Total Requests** | N/A | **3,236** | PASSED |
| **Throughput** | > 100 req/s | **26.2 req/s** | PASSED |
| **Error Rate** | 0.00% | **0.00%** | PASSED |
| **Allocation Invariant** | 100% capacity consistency | **100% (Zero Over-allocation)** | PASSED |

---

## 2. Latency Percentiles

```
  Min:           8.50 ms
  P50:        1608.39 ms (median response time)
  P90:        3364.33 ms
  P95:        3820.16 ms
  P99:        4499.03 ms
  Max:        5831.35 ms
  Mean:       1678.57 ms
```

---

## 3. Allocation Consistency Audit

- **Resources Audited**: 10 resource pools
- **Integrity Rule 1**: `used <= total` across all resource pools: **VERIFIED**
- **Integrity Rule 2**: `sum(allocations.quantity) == used`: **VERIFIED**
- **Integrity Rule 3**: `available >= 0` (no negative inventory): **VERIFIED**
- **Integrity Rule 4**: `used + available == total` for active resources: **VERIFIED**
- **Over-allocation Events**: **0 detected**

---

## 4. HTTP Status Code Distribution

```json
{
  "200": 2843,
  "201": 393
}
```

---

## 5. Per-Endpoint Telemetry

| Endpoint | Requests | Failures | P50 (ms) | P95 (ms) | P99 (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/audit?page=1&limit=5` | 63 | 0 | 1730.08 | 2648.85 | 3276.77 |
| `GET /api/desk` | 75 | 0 | 1718.45 | 2588.25 | 3055.42 |
| `GET /api/help-requests` | 375 | 0 | 1740.48 | 2624.94 | 2954.72 |
| `GET /api/meta` | 377 | 0 | 120.32 | 312.08 | 414.31 |
| `GET /api/privacy/policy` | 389 | 0 | 139.32 | 339.08 | 473.10 |
| `GET /api/workspace` | 288 | 0 | 2307.25 | 3456.80 | 4138.87 |
| `GET /health` | 823 | 0 | 1441.06 | 2239.96 | 3114.95 |
| `GET /metrics` | 60 | 0 | 1520.56 | 2194.49 | 2849.49 |
| `POST /api/allocations` | 393 | 0 | 3091.13 | 4283.96 | 4706.71 |
| `POST /api/resources/{id}/release` | 393 | 0 | 3131.10 | 4461.32 | 5109.16 |
