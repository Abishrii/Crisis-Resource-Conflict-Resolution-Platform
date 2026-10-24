<div align="center">

# ResQSync

### Multi-Agency Crisis Resource Coordination & Conflict Resolution Platform

<p>
  <strong>Deterministic triage · Shared emergency inventory · Zero-trust role workspaces · Real-time event streaming</strong>
</p>

<p>
  A unified command and resource coordination platform designed for high-stress disaster response networks.<br/>
  ResQSync resolves concurrent allocation conflicts, unifies field help-requests, enforces server-grade RBAC,
  and maintains an immutable, compliance-ready audit trail across emergency agencies.
</p>

<p>
  <a href="https://github.com/Abishrii/Crisis-Resource-Conflict-Resolution-Platform/actions/workflows/ci.yml">
    <img src="https://github.com/Abishrii/Crisis-Resource-Conflict-Resolution-Platform/actions/workflows/ci.yml/badge.svg" alt="CI Pipeline Status">
  </a>
  <img src="https://img.shields.io/badge/Tests-80%20passed%20%7C%201%20skipped-2ea44f?logo=pytest&logoColor=white" alt="Test Suite">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" alt="Python 3.12">
  <img src="https://img.shields.io/badge/FastAPI-0.141-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 16">
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis 7">
  <img src="https://img.shields.io/badge/Reverse%20Proxy-Caddy-1F88C0?logo=caddy&logoColor=white" alt="Caddy">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose">
  <img src="https://img.shields.io/badge/Status-Academic%20Evaluation-6C5CE7" alt="Academic Project">
</p>

<p>
  <a href="#system-overview">Overview</a> •
  <a href="#core-problem--solution">Problem & Solution</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#faculty--evaluator-walkthrough">Faculty Walkthrough</a> •
  <a href="#architecture--system-design">Architecture</a> •
  <a href="#the-seven-core-modules">Modules</a> •
  <a href="#rbac--security-matrix">RBAC Matrix</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#docker-deployment">Docker</a> •
  <a href="#api-reference">API</a> •
  <a href="#testing--verification">Testing</a> •
  <a href="#troubleshooting">Troubleshooting</a>
</p>

</div>

---

> [!NOTE]
> **Academic Project & Evaluation Notice:** ResQSync was engineered for a comprehensive university capstone evaluation. All incidents, locations, personnel, distress calls, and inventory records in the default seeded dataset are **entirely fictional**. For demonstration convenience, a secure evaluation **Demo Mode** is active in development environments and hard-disabled in production.

---

## System Overview

During large-scale humanitarian crises and natural disasters (e.g., floods, earthquakes, industrial accidents), disaster response networks suffer from **severe coordination failures**:

```
[ Multiple Emergencies ] ──> Competing for ──> [ Scarce Critical Stock ]
     (Hospital A & B)                          (ICU Beds, Oxygen, Boats)
            │                                              │
            ▼                                              ▼
   Information Silos ─────────── Lack of Triage ────> Allocation Bottlenecks
   & Voice Calls Only            Auditability           & Delayed Dispatch
```

ResQSync eliminates this breakdown by providing an integrated, multi-tenant emergency workspace that balances **deterministic algorithmic triage** with **human-in-the-loop managerial governance**.

### Key Value Pillars

1. **Deterministic Conflict Arbitration:** When multiple incidents demand the same scarce resource pool, ResQSync mathematically ranks competing claims by severity, urgency, vulnerable populations, and transit ETA. Manual overrides require a mandatory, permanently logged operational justification.
2. **Zero-Trust Role Workspaces:** Distinct, ergonomically tailored interfaces for **Administrators**, **Crisis Managers**, **Resource Coordinators**, and **Citizen Help Seekers**. UI visibility controls are purely cosmetic; all permissions are independently validated on the server.
3. **Live Distributed Synchronization:** Leverages Server-Sent Events (SSE) to broadcast live updates (incident state transitions, stock changes, new SOS calls) to all connected consoles within milliseconds without requiring browser refreshes.
4. **Resilient Transactional Outbox:** Automated alerts and notifications are queued in an atomic outbox table and dispatched asynchronously with exponential backoff, preventing message loss during external SMS/SMTP gateway failures.
5. **Auditable Governance & Privacy:** Immutable audit trail documenting every sign-in, permission elevation, allocation override, and data deletion. Full compliance with data protection principles through self-service PII export and cryptographic account anonymisation.

---

## Screenshots

<div align="center">

| Light Mode Interface | Dark Mode Interface |
|:---:|:---:|
| <img src="docs/screenshots/login-light.jpg" alt="ResQSync Light Mode Sign-in" width="460"/><br/><sub><b>Sign In (Light)</b> — 1-click evaluation cards with explicit role-capability hints</sub> | <img src="docs/screenshots/login-dark.jpg" alt="ResQSync Dark Mode Sign-in" width="460"/><br/><sub><b>Sign In (Dark)</b> — High-contrast tactical theme for low-light command operations</sub> |

| Incident Command & Admin Workspace | Public Help-Seeker Request Desk |
|:---:|:---:|
| <img src="docs/screenshots/workspace-admin.jpg" alt="Admin Command Workspace" width="460"/><br/><sub><b>Incident Command Center</b> — Live metrics, resource health, and active conflict monitors</sub> | <img src="docs/screenshots/desk-seeker.jpg" alt="Help-Seeker Request Desk" width="460"/><br/><sub><b>Citizen SOS Desk</b> — Step-by-step dispatch tracking from verification to resolution</sub> |

<p>
  <img src="docs/screenshots/login-mobile.jpg" width="280" alt="ResQSync Mobile Responsive View"/><br/>
  <sub><b>Field Mobile Optimization</b> — Direct responsive access optimized for frontline tablets and smartphones (tested at 390 px)</sub>
</p>

</div>

---

## Faculty & Evaluator Walkthrough

To facilitate immediate examination without requiring manual registration or credential lookup, ResQSync includes a **zero-configuration Demo Mode** in development.

### Pre-Seeded Evaluation Personas

| Evaluation Persona | Assigned Role | Landing Workspace | Primary Evaluation Focus |
|---|---|---|---|
| `aditi@example.org` | **Administrator** | Master Workspace + Audit | Full system oversight, user management, audit logs, outbox queue |
| `arjun@example.org` | **Crisis Manager** | Incident Command Center | Incident creation, severity assessment, conflict resolution & override |
| `meera@example.org` | **Resource Coordinator** | Logistics & Dispatch Queue | Fleet management, warehouse inventory, dispatch dispatching |
| `seeker@example.org` | **Help Seeker** | Citizen SOS Portal | Distress ticket submission, location pinning, live status tracking |

*All seeded demo accounts share the evaluation password:* **`Resqsync#2026`**

### Recommended 5-Minute Evaluation Script

```mermaid
journey
    title 5-Minute Faculty Evaluation Journey
    section 1. Command Overview
      Sign in as Admin (Aditi): 5: Admin
      Inspect incident board & live stock: 5: Admin
      View audit trail & system metrics: 5: Admin
    section 2. Triage & Arbitration
      Switch to Crisis Manager (Arjun): 5: Crisis Manager
      Review competing incident requests: 5: Crisis Manager
      Resolve resource conflict with logged reason: 5: Crisis Manager
    section 3. Field Logistics
      Switch to Resource Coordinator (Meera): 5: Resource Coordinator
      Inspect inventory health & maintenance: 5: Resource Coordinator
      Dispatch allocated ambulance/boat: 5: Resource Coordinator
    section 4. Citizen Experience
      Switch to Help Seeker (Citizen): 5: Help Seeker
      Submit SOS request with urgency rating: 5: Help Seeker
      Observe live state change (Verified -> Dispatched): 5: Help Seeker
    section 5. Audit Verification
      Switch back to Admin: 5: Admin
      Verify tamper-evident audit logs: 5: Admin
```

1. **Step 1: Sign in as Admin (`aditi@example.org`)**
   - Click the first direct-access demo card on the sign-in page.
   - Inspect the **Overview** dashboard: operational incidents, live inventory metrics, active alerts, and system health.
2. **Step 2: Switch Role to Crisis Manager**
   - Click the in-workspace **Demo Role** dropdown in the top navigation bar and select **Crisis Manager**.
   - Navigate to **Conflict Resolution**: examine how overlapping resource demands are scored and approve an allocation.
3. **Step 3: Switch Role to Resource Coordinator**
   - Switch to **Resource Coordinator** via the header switcher.
   - Inspect **Resource Management**: review warehouse inventory, equipment maintenance statuses, and dispatch the approved units.
4. **Step 4: Citizen SOS Submission & Live Tracking**
   - Switch to **Help Seeker**: submit a new distress ticket specifying category, urgency, and headcount.
   - Observe how the state updates in real time through `Opened → Verified → Assigned → En Route → Resolved`.
5. **Step 5: Audit Verification**
   - Switch back to **Admin**: open the **Audit Trail** and observe that all evaluation interactions, role elevations, allocations, and demo sign-ins have been recorded with exact timestamps and actor identifiers.

> [!TIP]
> The **DEMO MODE** badge in the header highlights evaluation features. In production (`ENV=production` or `DEMO_LOGIN=false`), both the demo endpoints and the UI switcher are hard-disabled at the FastAPI dependency level.

---

## Architecture & System Design

ResQSync is structured as a resilient 3-tier architecture with clean separation of concerns, containerized micro-services, and edge caching:

```mermaid
flowchart TD
    subgraph Clients["Frontend Clients"]
        SPA["React 18 + Vite SPA<br/>TypeScript · Modular Controllers"]
        Mobile["Mobile Web Browser<br/>Responsive Touch View"]
    end

    subgraph Edge["Edge & Reverse Proxy"]
        Caddy["Caddy Server<br/>TLS / HSTS · Gzip & Zstd · Rate Limiting · Static Asset Cache"]
    end

    subgraph AppTier["FastAPI Application Core"]
        Auth["Authentication & Session Service<br/>Argon2id · JWT in HttpOnly Cookie"]
        RBAC["Server-Side RBAC Guard<br/>Strict Roles Table Enforcement"]
        TriageEngine["Conflict Arbitration Engine<br/>Deterministic Scoring & Override Audit"]
        SSEHub["Live Event Hub<br/>Server-Sent Events /api/events"]
        OutboxWorker["Transactional Outbox Worker<br/>Asynchronous Retry & Delivery"]
    end

    subgraph DataTier["Persistence & Cache"]
        Postgres[("PostgreSQL 16<br/>Relational Data & Alembic Migrations")]
        RedisDB[("Redis 7<br/>Sliding-Window Rate Limits & Event Bus")]
        SQLiteDev[("SQLite 3<br/>Zero-Config Development Engine")]
    end

    subgraph External["External Gateways (Optional)"]
        SMTP["SMTP Gateway"]
        SMS["SMS Provider (MSG91 / Twilio)"]
        Push["WebPush (VAPID)"]
    end

    SPA -->|HTTPS / WSS| Caddy
    Mobile -->|HTTPS / WSS| Caddy
    Caddy -->|Internal Proxy :8000| Auth
    Auth --> RBAC
    RBAC --> TriageEngine
    TriageEngine --> Postgres
    TriageEngine --> RedisDB
    RBAC --> SQLiteDev
    TriageEngine -.-> SSEHub
    SSEHub -.->|Live Stream| Caddy
    TriageEngine --> OutboxWorker
    OutboxWorker --> Postgres
    OutboxWorker -.-> External
```

### Request & State Transition Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant Edge as Caddy Reverse Proxy
    participant API as FastAPI Backend
    participant RBAC as Permission Guard
    participant DB as Database (Postgres/SQLite)
    participant Outbox as Outbox Queue
    participant SSE as Connected Consoles

    User->>Edge: POST /api/help-requests (Session Cookie)
    Edge->>API: Proxy Request (Validate TLS & Headers)
    API->>RBAC: Validate Session (jti, ver, role permission)
    RBAC-->>API: Authorized
    API->>API: Run Input Sanitization & Duplicate Detection
    rect rgb(240, 248, 255)
        Note over API,DB: Atomic Database Transaction
        API->>DB: INSERT help_request record
        API->>DB: INSERT audit_log entry
        API->>Outbox: INSERT notification_outbox event
        DB-->>API: Transaction Committed
    end
    API-->>User: 201 Created (JSON Response)
    API-)SSE: Broadcast state_change event
    SSE-)User: Live update delivered via Server-Sent Events
```

---

## The Seven Core Modules

| # | Module | Key Capabilities | Primary Role |
|:---:|---|---|:---:|
| **01** | 🚨 **Crisis Management** | Creates and classifies disaster events, manages geographical coordinates, assigns operational threat levels, and tracks incident status progression (`active`, `contained`, `resolved`). | Crisis Manager, Admin |
| **02** | 📦 **Resource Management** | Centralized inventory of emergency assets across four categories (Personnel, Equipment, Supplies, Facilities). Tracks availability, maintenance schedules, depot locations, and capacity. | Resource Coordinator, Admin |
| **03** | ⚖️ **Conflict Resolution** | Real-time arbitration engine. Flags pools where aggregate demands exceed available stock, runs deterministic multi-attribute scoring, and logs managerial overrides with required justification. | Crisis Manager, Admin |
| **04** | 👥 **People & Access** | Full user lifecycle management, account activation/suspension, dynamic role assignment, multi-session tracking, and security posture monitoring. | Admin |
| **05** | 💬 **Communications** | Dedicated communication channels per active incident, structured file attachments, broadcast notifications, and alert banner dispatches. | All Staff Roles |
| **06** | 📊 **Analytics & Reporting** | Live operational metrics, resource utilization rates, response time averages, and automated report exports in PDF, XML, and CSV formats. | Crisis Manager, Admin |
| **07** | 🧭 **Decision Support** | Scenario simulation engine modeling hypotheticals (e.g., sudden inflow of 500 casualties, localized flood cutoff), generating asset coverage assessments and mitigation recommendations. | Crisis Manager, Admin |

---

## RBAC & Security Matrix

Security in ResQSync is designed around a **Zero-Trust Server Boundary**. The frontend interface dynamically adapts to hide or disable unauthorized buttons, but the FastAPI backend enforces strict cryptographic and role checks on every single HTTP route via dependency injection (`backend/app/roles.py`).

| Operation / Endpoint Capability | Admin | Crisis Manager | Resource Coordinator | Help Seeker |
|---|:---:|:---:|:---:|:---:|
| **View Incidents, Stock & Analytics** | 🟢 Full | 🟢 Full | 🟢 Full | 🔴 Denied |
| **Create & Update Crises** | 🟢 Full | 🟢 Full | 🔴 Denied | 🔴 Denied |
| **Manage Inventory & Maintenance** | 🟢 Full | 🔴 Read-only | 🟢 Full | 🔴 Denied |
| **Allocate Stock to Incidents** | 🟢 Full | 🟢 Full | 🟢 Full | 🔴 Denied |
| **Arbitrate & Override Conflicts** | 🟢 Full | 🟢 Full | 🔴 Denied | 🔴 Denied |
| **User Administration & Role Assignment** | 🟢 Full | 🔴 Denied | 🔴 Denied | 🔴 Denied |
| **Verify & Review Citizen Help Requests** | 🟢 Full | 🟢 Full | 🔴 Denied | 🔴 Denied |
| **Dispatch Field Units** | 🟢 Full | 🔴 Denied | 🟢 Full | 🔴 Denied |
| **Submit Citizen SOS Requests** | 🟢 Full | 🟢 Full | 🔴 Denied | 🟢 Full |
| **Access System Audit Logs & Outbox** | 🟢 Full | 🔴 Denied | 🔴 Denied | 🔴 Denied |
| **Trigger Privacy Data Retention / Anonymisation** | 🟢 Full | 🔴 Denied | 🔴 Denied | 🔴 Denied |

<details>
<summary><b>Server-Side Permission Key Reference (backend/app/roles.py)</b></summary>

```python
PERMISSIONS: dict[str, frozenset[str]] = {
    "view": frozenset({"admin", "crisis-manager", "resource-coordinator"}),
    "crisis": frozenset({"admin", "crisis-manager"}),
    "resource": frozenset({"admin", "resource-coordinator"}),
    "allocate": frozenset({"admin", "crisis-manager", "resource-coordinator"}),
    "approve": frozenset({"admin", "crisis-manager"}),
    "users": frozenset({"admin"}),
    "message": frozenset({"admin", "crisis-manager", "resource-coordinator"}),
    "save": frozenset({"admin", "crisis-manager", "resource-coordinator"}),
    "request.raise": frozenset({"help-seeker", "crisis-manager", "admin"}),
    "request.review": frozenset({"admin", "crisis-manager"}),
    "request.dispatch": frozenset({"admin", "resource-coordinator"}),
    "request.view_all": frozenset({"admin", "crisis-manager", "resource-coordinator"}),
}
```

</details>

---

## Quick Start

### System Prerequisites

* **Python:** 3.12 or higher
* **Node.js:** 20.x or higher (`npm` 10+)
* **Docker & Compose:** (Optional) for full-stack multi-container deployment

---

### Method A: Local Development Setup (Quickest)

#### 1. Backend Service
```bash
# Clone the repository and navigate to backend
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Linux / macOS:
source .venv/bin/activate
# On Windows PowerShell:
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server with auto-reload
uvicorn app.main:app --reload --port 8000
```
> *On initial boot, ResQSync automatically initializes `backend/resqsync.db` (SQLite) and seeds all demo roles, crisis scenarios, inventory, and mock help-requests.*  
> *Interactive Swagger documentation is instantly available at: **http://localhost:8000/docs***

#### 2. Frontend Interface
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install clean dependencies
npm ci

# Start the Vite development server
npm run dev
```
> *Open your browser to: **http://localhost:5173***  
> *Vite automatically proxies `/api` and `/health` requests to `127.0.0.1:8000`, ensuring cross-origin cookies work smoothly.*

---

### Method B: Unified Single-Port Serving

You can also have the FastAPI server build and host the compiled frontend bundle directly:

```bash
# Build the production frontend bundle
cd frontend
npm ci
npm run build

# Start the unified backend server
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
> *Access the complete application from a single origin at: **http://localhost:8000***

---

## Docker Deployment

For staging and production deployments, ResQSync includes a hardened, multi-stage Docker setup orchestrated by Docker Compose:

```
┌────────────────────────────────────────────────────────┐
│ Caddy Reverse Proxy (:80, :443)                        │
│   ├── Auto HTTPS / TLS Certificate Management          │
│   ├── Compression (zstd, gzip)                         │
│   └── Path Routing (/api/* -> FastAPI, /* -> SPA)      │
└───────────┬────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ FastAPI Application Container (:8000 internal)         │
│   ├── Non-root unprivileged runtime user               │
│   ├── Production session verification                  │
│   └── Background Outbox Dispatch Worker                │
└───────┬───────────────────────────────┬────────────────┘
        │                               │
        ▼                               ▼
┌───────────────────────┐       ┌────────────────────────┐
│ PostgreSQL 16 Service │       │ Redis 7 Service        │
│ Persistent Data Vol   │       │ Rate Limiting & PubSub │
└───────────────────────┘       └────────────────────────┘
```

### Launching the Stack

```bash
# Copy and configure environment secrets
cp .env.example .env

# Start all services in the background
docker compose up -d --build
```

### Production Security Checklist

* [ ] Set a secure `POSTGRES_PASSWORD` (database is isolated on internal Docker network).
* [ ] Generate a 32+ character random `SECRET_KEY` for JWT signatures.
* [ ] Configure `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (initializes master administrator).
* [ ] Configure `SITE_ADDRESS=resqsync.yourdomain.org` to allow Caddy to auto-provision Let's Encrypt TLS.
* [ ] Set `COOKIE_SECURE=true` once running over HTTPS.

---

## Configuration Reference

Key environment variables configurable in `.env`:

| Variable | Default (Dev) | Production Recommendation | Description |
|---|---|---|---|
| `ENV` | `development` | `production` | Environment mode. `production` enforces strict security constraints. |
| `SECRET_KEY` | Auto-generated | 64-char random hex string | Cryptographic key used to sign session JWTs. |
| `DATABASE_URL` | `sqlite:///./resqsync.db` | `postgresql+psycopg2://user:pass@postgres:5432/resqsync` | Primary persistence connection string. |
| `REDIS_URL` | *(empty)* | `redis://redis:6379/0` | Enables cluster rate-limiting and cross-worker SSE events. |
| `COOKIE_SECURE` | `false` | `true` | Enforces `Secure` flag on session cookies (requires HTTPS). |
| `DEMO_LOGIN` | `true` | `false` | Enables one-click evaluation cards. Hard-blocked in production. |
| `SEED_DEMO_DATA` | `true` | `false` | Seeds fictional demo data on initial database creation. |
| `LOGIN_MAX_FAILURES` | `6` | `5` | Maximum failed password attempts before account cooldown. |
| `LOGIN_WINDOW_SECONDS`| `900` | `900` | Sliding window duration (15 minutes) for login throttling. |
| `DATA_RETENTION_DAYS` | `0` *(disabled)* | `90` | Automatic retention pass to purge/anonymise resolved SOS records. |

---

## API Reference

The ResQSync REST API adheres to JSON API standards with full OpenAPI 3.0 documentation generated automatically.

Interactive Swagger Explorer: **`/docs`** | ReDoc Alternative: **`/redoc`**

### Route Groups

* **Authentication & Identity:**
  * `POST /api/auth/login` — Authenticate with email and password (sets HttpOnly cookie)
  * `POST /api/auth/demo-login` — Instant evaluation role sign-in *(dev only)*
  * `GET  /api/auth/me` — Retrieve active session profile and permissions
  * `POST /api/auth/logout` — Invalidate session and clear cookie
  * `POST /api/auth/logout-all` — Revoke all active sessions across all devices
  * `POST /api/auth/forgot` & `POST /api/auth/reset` — Secure tokenized password recovery
* **Emergency Incidents & Resources:**
  * `GET/POST/PATCH /api/crises` — Crisis lifecycle management and classification
  * `GET/POST/PATCH /api/resources` — Emergency equipment, personnel, and fleet assets
  * `GET/POST /api/allocations` — Commit and release assets to/from active incidents
  * `GET/POST /api/demands` — Incident resource demand requests
* **Triage & Conflict Resolution:**
  * `GET/POST /api/negotiations` — Competing claim tracking and arbitration logs
  * `GET/POST /api/decisions` — Managerial resolution records with recorded reasons
* **Citizen Help-Seeker Desk:**
  * `POST /api/help-requests` — Submit public distress ticket (headcount, category, GPS)
  * `GET  /api/help-requests/{code}` — Check real-time status of submitted ticket
  * `POST /api/help-requests/{code}/verify` — Incident Commander ticket verification
  * `POST /api/help-requests/{code}/dispatch` — Logistics field dispatch
  * `POST /api/help-requests/{code}/resolve` — Mark rescue complete
* **Operational Analytics & Exports:**
  * `GET  /api/reports/export?format=pdf` — Compiled tactical situation report (PDF)
  * `GET  /api/reports/export?format=xml` — Machine-readable emergency schema (XML)
  * `GET  /api/exports/*.csv` — Data exports (Crises, Resources, Help Requests, Audit)
* **System Observability & Real-Time:**
  * `GET  /api/events` — Server-Sent Events (SSE) live data stream
  * `GET  /api/health` — Comprehensive health check (Database, Redis, Disk)
  * `GET  /metrics` — Prometheus-compatible metrics endpoint

---

## Security, Privacy & Compliance

ResQSync incorporates enterprise-grade defensive patterns:

```
                  ┌──────────────────────────────────────────────┐
                  │          Incoming Client Request             │
                  └──────────────────────┬───────────────────────┘
                                         │
                 [1. Security Headers (CSP, HSTS, X-Frame) ]
                                         │
                 [2. Redis Sliding-Window Rate Limiting   ]
                                         │
                 [3. Argon2id / JWT Session Verification  ]
                                         │
                 [4. Server-Side RBAC Permission Guard    ]
                                         │
                 [5. PII Masking & EXIF Scrubbing         ]
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       Business Logic & Immutable Audit       │
                  └──────────────────────────────────────────────┘
```

* **Password Hashing:** Implemented with **Argon2id** via `pwdlib`, resisting GPU/ASIC brute-force attacks.
* **Session Invalidation:** JWT session tokens carry a unique session identifier (`jti`) and a token version (`ver`). Changing a password, revoking access, or suspending an account immediately invalidates all active sessions globally.
* **Upload Sanitization:** User-uploaded attachments and SOS field photos undergo strict MIME-type validation, size restrictions, and **automatic EXIF/GPS metadata stripping** before storage to protect citizen privacy.
* **PII Redaction in Application Logs:** An operational log filter automatically masks passwords, session tokens, phone numbers, and physical street addresses prior to disk writes.
* **Data Subject Rights:** Full self-service data export (`GET /api/me/data`) and account deletion with anonymisation (`POST /api/me/delete-account`).

---

## Testing & Verification

The test suite validates algorithmic arbitration, security barriers, rate limiting, and end-to-end workflows:

```bash
# Run backend pytest suite (80 passed, 1 skipped)
cd backend
python -m pytest -q

# Run code style & linting checks
ruff check .
ruff format --check .

# Run frontend TypeScript type checking
cd ../frontend
npm run typecheck

# Validate build & frontend bundle integrity
npm run build

# Run jsdom controller regression checks
node scripts/archive-startup-check.cjs

# Run end-to-end live multi-user verification
node scripts/live-e2e-check.cjs
```

### Automated CI Pipeline

Every pull request and merge triggers the GitHub Actions workflow (`.github/workflows/ci.yml`):
* **Backend Lint & Static Analysis:** Ruff linting and formatting validation.
* **Pytest SQLite Matrix:** Core business logic, RBAC, and triage verification.
* **Pytest PostgreSQL 16 Matrix:** Transactional concurrency, outbox queues, and schema migrations.
* **Frontend Typecheck & Build:** TypeScript verification and Vite compilation.
* **Live Integration E2E Check:** Boots a temporary live stack and verifies multi-role workflows.

---

## Project Structure

```text
Crisis-Resource-Conflict-Resolution-Platform/
├── backend/
│   ├── alembic/                 # Database schema migrations
│   ├── app/
│   │   ├── models/              # SQLAlchemy relational models
│   │   ├── routers/             # API route controllers (auth, crises, resources, help)
│   │   ├── schemas/             # Pydantic v2 validation contracts
│   │   ├── services/            # Seeding, serializers, privacy, outbox worker
│   │   ├── config.py            # Typed settings & environment parsing
│   │   ├── database.py          # SQLAlchemy session & connection pooling
│   │   ├── main.py              # Application factory, middleware & routing
│   │   ├── rate_limit.py        # Redis sliding-window rate limiter
│   │   ├── roles.py             # Server-side RBAC definitions
│   │   └── security.py          # Argon2id hashing & JWT authentication
│   ├── tests/                   # Pytest test suite (80+ test cases)
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Backend environment template
├── frontend/
│   ├── public/
│   │   ├── archive/index.html   # Standalone UI source of truth
│   │   └── theme-boot.js        # Instant theme hydration (avoids theme flash)
│   ├── scripts/                 # Sync scripts and E2E browser checkers
│   ├── src/                     # React shell & generated archive controller
│   ├── index.html               # Vite HTML entry point
│   ├── package.json             # Node dependencies and build scripts
│   └── tsconfig.json            # Strict TypeScript configuration
├── docs/
│   └── screenshots/             # README visual gallery
├── tools/                       # Database backup, restore, and load-test utilities
├── Caddyfile                    # Production edge reverse proxy configuration
├── Dockerfile                   # Hardened multi-stage container build
├── docker-compose.yml           # Multi-container orchestration (App, DB, Redis, Caddy)
├── .env.example                 # Compose environment configuration template
├── .github/workflows/ci.yml     # Automated multi-job CI pipeline
└── README.md                    # Project documentation
```

---

## Troubleshooting

| Symptom | Probable Cause | Recommended Resolution |
|---|---|---|
| **Demo role cards are missing on login** | `DEMO_LOGIN=false` or `ENV=production`. | Set `DEMO_LOGIN=true` and `ENV=development` in your `.env` file and restart. |
| **Login fails for demo accounts** | Database was initialized without demo seed or password was altered. | Default password is `Resqsync#2026`. To re-seed, stop backend, delete `backend/resqsync.db`, and restart. |
| **Session cookie rejected in Docker** | `COOKIE_SECURE=true` while browsing via unencrypted HTTP. | Set `COOKIE_SECURE=false` for plain HTTP testing, or configure a domain with TLS in Caddy. |
| **Docker Compose fails with missing variable** | `.env` file is missing required secrets. | Copy `.env.example` to `.env` and configure `POSTGRES_PASSWORD`, `SECRET_KEY`, and bootstrap admin credentials. |
| **Frontend cannot communicate with API** | Vite dev proxy misconfiguration. | Ensure the backend is listening on `127.0.0.1:8000`. To customize the target, set `VITE_BACKEND_URL`. |
| **Generated frontend drift reported by CI** | `public/archive/index.html` was edited without syncing. | Run `cd frontend && npm run sync` and commit the updated `src/archive-controller.ts` file. |

---

## Evaluation Credits & Acknowledgements

* **Typography:** [Inter](https://fonts.google.com/specimen/Inter) and [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) via Google Fonts.
* **Photography:** Field emergency photography courtesy of verified [Pexels](https://www.pexels.com/) contributors.
* **Core Technologies:** FastAPI, SQLAlchemy, Alembic, Pydantic, PostgreSQL, Redis, React, Vite, Caddy, and Docker.
* **Dataset:** All incident scenarios, logistical assets, distress calls, and personnel names are synthetic and designed exclusively for academic evaluation.

---

## License

This repository is developed as an academic capstone evaluation project. All underlying libraries, fonts, and assets retain their respective original licenses.
