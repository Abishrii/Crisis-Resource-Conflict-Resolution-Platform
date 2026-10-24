# ResQSync — Crisis Resource Conflict Resolution Platform

A crisis-coordination platform for Indian emergency response: incidents, shared resource inventory,
automatic conflict detection with transparent priority ranking, manager overrides with a recorded
rationale, a help-request desk, messaging, analytics and reports.

* **Backend** — FastAPI + SQLAlchemy (SQLite by default, PostgreSQL supported). Real accounts, role-based
  access enforced on the server, transactional allocation, audit trail, live updates (Server-Sent Events).
* **Frontend** — React shell around the archive interface in `frontend/public/archive/index.html`
  (source of truth; `node scripts/sync-archive.cjs` regenerates `src/archive-*.ts`). All data now comes from the API.

## Run it (development)

```bash
# 1) backend  (Python 3.12+)
cd backend
python -m venv venv && source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                    # optional; defaults work for development
uvicorn app.main:app --reload --port 8000

# 2) frontend (second terminal)
cd frontend
npm install
npm run dev                                             # http://localhost:5173  (proxies /api to :8000)
```

On first start the database `backend/resqsync.db` is created and filled with the fictional India training
dataset and demo accounts. **If you used the previous skeleton, delete the old `crisis_platform.db`**; the schema changed.

| Demo account (development only) | Role | Lands on |
|---|---|---|
| aditi@example.org | Admin | full workspace + audit |
| arjun@example.org | Crisis manager | workspace; request desk |
| meera@example.org | Resource coordinator | workspace; dispatch queue |
| seeker@example.org | Help seeker | request desk |

Password for all: `Resqsync#2026`. Anyone can also create a **help-seeker** account from the sign-in dialog;
staff accounts are created by an admin (People & access → Add a user; a temporary password is shown once).

With `DEMO_LOGIN=true` (development default) the sign-in dialog shows one-click role cards, and the
workspace header has a **Demo role** switcher so you can move between roles without signing out. Both use
`POST /api/auth/demo-login` and are disabled in production.

## Run it as one server (production-style)

```bash
cd frontend && npm run build
cd ../backend && ENV=production SECRET_KEY=... BOOTSTRAP_ADMIN_EMAIL=you@org BOOTSTRAP_ADMIN_PASSWORD=... \
  SEED_DEMO_DATA=false uvicorn app.main:app --host 0.0.0.0 --port 8000
```
FastAPI serves `frontend/dist` from the same origin, so the HTTP-only session cookie needs no CORS setup.
Put it behind HTTPS (the cookie is `Secure` in production). See `backend/.env.example` for every setting.

## What the backend does

| Area | Behaviour |
|---|---|
| Auth | e-mail + password (Argon2), JWT in an HTTP-only SameSite cookie (or `Authorization: Bearer`), login throttling, password change, sessions end on role change / disable |
| Roles | admin, crisis-manager, resource-coordinator, help-seeker — permission table in `app/roles.py`, enforced per endpoint |
| Conflicts | pools whose open requests exceed free stock are ranked by severity (65%) and response readiness (35%); filling never exceeds capacity |
| Allocation | manual assign, override (manager/admin, reason required), approve-recommendation; contested pools need approval rights; row-locked / `BEGIN IMMEDIATE` so concurrent requests cannot over-allocate |
| Shared inventory | incident allocations and individual help-request assignments draw from the same pools |
| Help requests | opened → verified → assigned → en route → resolved, role-gated; seekers see only their own; photo upload validated by content |
| Records | crisis timelines, resource history + maintenance log, decisions, negotiations, saved scenarios, audit trail |
| Collaboration | channel messages, document upload/download (5 MB, allow-listed types, served as attachment) |
| Reports | `GET /api/reports/export?format=pdf|xml&days=30` generated on the server |
| Live updates | `GET /api/events` (SSE) — other users' screens refresh when anything changes |
| Notifications | in-app always; e-mail via SMTP when configured; SMS/push are recorded in the `outbox` table as `not_configured` (no provider is connected) |

Interactive API docs: `http://localhost:8000/docs`.

## Tests

```bash
cd backend && pytest                       # 41 tests: rules, permissions, concurrency, uploads, reports
cd frontend
node scripts/sync-archive.cjs && npx vite build
node scripts/archive-startup-check.cjs     # needs: npm i -D jsdom
# Live browser run against a FRESH, seeded backend that serves the built UI (needs playwright-core + @sparticuz/chromium):
node scripts/live-e2e-check.cjs            # multi-user flows, live updates, permissions
node scripts/live-session-check.cjs        # reload keeps session, sign-out
```

## Security Architecture & Threat Model

* **Authentication & Session Lifecycle**:
  - Passwords hashed using Argon2 (`pwdlib`).
  - Strict password policy enforced (minimum 10 chars, complexity validation).
  - JWT tokens embed session identifiers (`jti`) and token versions (`ver`).
  - Active device tracking in `user_sessions` table with IP, User-Agent, and timestamps.
  - Multi-device instant session revocation via `POST /api/auth/logout-all` and upon password change/reset.
* **Enumeration Resistance & Password Reset**:
  - Password reset requests (`POST /api/auth/forgot`) return a constant timing-safe HTTP 200 message regardless of account existence.
  - High-entropy cryptographic reset tokens (32 bytes base64url) stored solely as SHA-256 hashes with a strict 30-minute expiry and single-use enforcement.
* **Rate Limiting & Anti-Abuse**:
  - Multi-worker sliding-window rate limiter (`RateLimiter`) with Redis coordination when `REDIS_URL` is set, and thread-safe in-memory sliding-window fallback per worker.
  - Dedicated rate limits for user registration (`RATE_LIMIT_REGISTER`), password reset (`RATE_LIMIT_FORGOT`), login attempts (`LOGIN_MAX_FAILURES`), and file uploads (`RATE_LIMIT_UPLOAD`).
  - Returns HTTP 429 with `Retry-After` header when thresholds are exceeded.
* **Content Security & Browser Protection**:
  - `Content-Security-Policy`: Restricts scripts and framing (`frame-ancestors 'none'`), allows fonts from Google Fonts and approved image CDNs (Pexels).
  - `Permissions-Policy`: Blocks microphone, camera, and payment APIs; restricts geolocation.
  - `Strict-Transport-Security` (HSTS): Enabled in production and over HTTPS (`max-age=31536000; includeSubDomains`).
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`.
  - `Cache-Control: no-store` on all `/api/` endpoints to prevent sensitive emergency data leakage into shared browser caches.
* **Malware Defense & Metadata Sanitization**:
  - ClamAV TCP daemon scanner integration via `INSTREAM` protocol (`scan_bytes`) with fail-safe quarantine.
  - Pure-Python EXIF/GPS metadata scrubber (`image_sanitize.py`) stripping APP1/eXIf/tEXt chunks from uploaded JPEG, PNG, and WebP images to protect vulnerable help-seekers' physical locations.
* **PII Redaction in Observability**:
  - Centralized `PIIMaskingFilter` attached to standard loggers redacting passwords, tokens, phone numbers, and physical street addresses from log outputs.

## Notification Providers & Dispatch Configuration

ResQSync uses an asynchronous transactional outbox worker (`OutboxWorker`) to decouple crisis actions from external message transmission. In-app alerts are instantaneous; external dispatches are persisted to the `outbox` table and processed with exponential back-off (`2^attempts * 5s`, up to 3 retries). If external providers are unconfigured, messages are safely marked `not_configured` without failing transaction execution.

### Phone Verification Policy
To prevent abuse, emergency dispatch alerts via SMS are strictly blocked until the account holder verifies their mobile phone number via a 6-digit OTP (`POST /api/me/phone/send-otp` and `POST /api/me/phone/verify-otp`).

### Provider Settings & Environment Variables

Configure the following variables in `backend/.env` according to your organization's infrastructure:

#### 1. Email (SMTP)
* `SMTP_HOST`: Mail server hostname (e.g., `smtp.mailgun.org`, `smtp.sendgrid.net`).
* `SMTP_PORT`: SMTP port (default `587` with STARTTLS, or `465` with SSL).
* `SMTP_USER`: Authentication user.
* `SMTP_PASSWORD`: Authentication token or password.
* `SMTP_FROM`: Validated sender email address (e.g., `alerts@resqsync.org`).
* `SMTP_STARTTLS`: Set `true` for port 587 (default `true`).

#### 2. SMS (MSG91 or Twilio)
Set `SMS_PROVIDER=msg91` or `SMS_PROVIDER=twilio`:
* **MSG91 (India DLT Compliant)**:
  - `MSG91_AUTH_KEY`: MSG91 API auth key.
  - `MSG91_SENDER_ID`: 6-character registered DLT Sender ID.
  - `MSG91_TEMPLATE_ID`: Approved DLT template ID.
* **Twilio**:
  - `TWILIO_ACCOUNT_SID`: Twilio account SID.
  - `TWILIO_AUTH_TOKEN`: Twilio auth token.
  - `TWILIO_FROM_NUMBER`: Registered Twilio phone number in E.164 format (e.g., `+1234567890`).

#### 3. Web Push (VAPID)
* `VAPID_PUBLIC_KEY`: Application Server Public Key (Base64url).
* `VAPID_PRIVATE_KEY`: Application Server Private Key (Base64url).
* `VAPID_CLAIM_EMAIL`: Operator contact identifier (e.g., `mailto:admin@resqsync.org`).

#### 4. Outbox Worker Lifecycle
* `OUTBOX_WORKER_INTERVAL_SECONDS`: Polling interval for queued outbox retries (default `3.0` seconds).


## Deployment & Container Orchestration

ResQSync includes production container orchestration files for turnkey deployment:

### 1. Docker & Docker Compose
* **Multi-stage Dockerfile**: Builds the React/Vite SPA bundle with Node 20 in Stage 1, and packages the FastAPI ASGI backend inside a secure Python 3.12 slim runner executing as a non-privileged system user (`appuser`).
* **docker-compose.yml**:
  - `postgres`: PostgreSQL 16 Alpine with a health check (`pg_isready`) and persistent named volume `postgres_data`. It is **not** published to the host.
  - `redis`: Redis 7 for shared rate limiting and cross-worker live updates (not published to the host).
  - `api`: Containerized backend running with auto-run Alembic migrations on startup, health checks via `/api/health`, and persistent volume `uploads_data`.
  - `reverse-proxy`: Caddy with gzip/zstd and routing. Set `SITE_ADDRESS` to a real domain to enable automatic HTTPS; the default `:80` serves plain HTTP.

Compose requires `POSTGRES_PASSWORD`, `SECRET_KEY`, `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`. Copy the template and fill it in:
```bash
cp .env.example .env
# edit .env: set strong database, JWT and admin credentials
docker compose up -d --build
```
Demo accounts and the one-click login cards are development conveniences. Keep `SEED_DEMO_DATA=false` and `DEMO_LOGIN=false` in production. If you serve HTTPS through a domain, also set `COOKIE_SECURE=true`.

### 2. Database Migrations (Alembic)
Database schemas are version-controlled via Alembic. On startup with a PostgreSQL `DATABASE_URL`, the application automatically applies pending migrations to `head`.

To manage migrations manually:
```bash
cd backend
# Check migration status
alembic current
# Upgrade to latest revision
alembic upgrade head
# Generate a new migration
alembic revision --autogenerate -m "description_of_changes"
```

### 3. Disaster Recovery & Backup Tooling
Automated, engine-agnostic backup and restore utilities support both SQLite and PostgreSQL instances:

* **Create Backup**:
  ```bash
  python tools/backup.py --out ./backups
  ```
  Creates a timestamped `.tar.gz` archive containing:
  - `manifest.json`: Metadata, table record counts, and SHA-256 checksums of all files.
  - `data.json`: Engine-agnostic database records.
  - `database.sql`: Native SQL dump.
  - `uploads/`: Complete copy of uploaded binary attachments.

* **Restore Backup**:
  ```bash
  python tools/restore.py ./backups/resqsync-backup-YYYYMMDD_HHMMSS.tar.gz
  ```
  Validates SHA-256 checksums, clears existing tables in dependency order, restores rows and binary files, and validates final counts against the manifest.

* **Automated Verification**:
  ```bash
  python tools/test_backup_restore.py
  ```

---

## Production Checklist

* [x] **Container Isolation**: Run with multi-stage Docker; backend runs as non-root `appuser`.
* [x] **Environment Security**: Set `ENV=production`, configure a high-entropy 32+ character `SECRET_KEY`, set a strong `BOOTSTRAP_ADMIN_PASSWORD`, and leave `SEED_DEMO_DATA=false` / `DEMO_LOGIN=false`.
* [x] **Database Scale & Concurrency**: Use PostgreSQL for multi-worker deployments; write transactions utilize `SELECT ... FOR UPDATE` row locks.
* [x] **Schema Management**: Alembic migrations applied to `head` (`alembic upgrade head`).
* [x] **Reverse Proxy & TLS**: Set `SITE_ADDRESS` to a real domain so Caddy provisions HTTPS, then set `COOKIE_SECURE=true`; HSTS is sent automatically once the request is HTTPS.
* [x] **Backup Verification**: Schedule periodic execution of `tools/backup.py` to off-site object storage and routinely test recovery via `tools/test_backup_restore.py`.
* [x] **Malware & Metadata Filtering**: Ensure ClamAV scanner daemon is reachable and EXIF scrubber is active for all crisis photo uploads.
* [x] **Notification Deliverability**: Verify mobile numbers before granting SMS dispatch permissions and monitor the transactional outbox worker.
* [x] **Decision Transparency**: Priority ranking is a transparent heuristic to aid human dispatchers, not an automated black box.
