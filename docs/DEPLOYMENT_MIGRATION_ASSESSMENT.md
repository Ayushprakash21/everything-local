# Everything Local — Deployment Migration Assessment
## Migration from Cloudflare to Free-Tier Multi-Cloud Architecture
**Target Platforms:** Netlify (Frontend) • Google Cloud Run (Backend) • Neon (PostgreSQL) • External Object Storage  
**Date:** November 24, 2026  
**Auditor / DevOps Architect:** Principal DevOps & Full-Stack Deployment Engineer  
**Git Branch:** `repair/v2.0-master-architecture`  

---

## 1. Executive Summary

This assessment evaluates the architectural feasibility and readiness for migrating the Everything Local hyperlocal commerce platform away from Cloudflare to a production-grade, zero-cost (free tier) multi-cloud deployment:

1. **Frontend:** **Netlify** — Hosting the React 18 / Vite 6 Single Page Application (SPA) with automated build pipeline, global CDN edge, and reverse proxy redirects.
2. **Backend:** **Google Cloud Run** — Fully managed serverless container runtime executing the Express/Node.js API, scaling down to 0 instances when idle to eliminate compute costs.
3. **Database:** **Neon Serverless PostgreSQL** — Managed PostgreSQL with connection pooling (PgBouncer), replacing the local SQLite file (`dev.db`).
4. **Persistent Object Storage:** External persistent storage (evaluating Google Cloud Storage, Cloudinary, and Supabase Storage) replacing ephemeral container file writes.

**Key Finding:** The codebase is exceptionally well-suited for containerized deployment on Google Cloud Run and static hosting on Netlify. It has **zero dependencies on proprietary Cloudflare Workers runtime APIs** (no `wrangler.toml`, no `@cloudflare/workers-types`, no Durable Objects). The application is entirely stateless, with no long-lived WebSockets or in-process background daemons, and its Prisma schema is already 100% ANSI-compliant.

---

## 2. Phase 1: Repository Inspection Findings

### 2.1 Workspace Scripts & Dependencies (`package.json`)
- **Server Build:** `npm run build:server` executes `tsc -p server/tsconfig.json` outputting compiled JavaScript to `dist/server`.
- **Client Build:** `npm run build:client` executes `vite build --config client/vite.config.ts` outputting bundled HTML/CSS/JS to `dist/client`.
- **Combined Build:** `npm run build` runs both server and client builds sequentially without error.
- **Runtime Dependencies:**
  - `express`: ^4.21.2
  - `@prisma/client`: ^6.4.1
  - `cors`: ^2.8.5
  - `jsonwebtoken`: ^9.0.2
  - `bcryptjs`: ^3.0.2
  - `zod`: ^3.24.2
  - `multer`: ^2.5.0
  - `@aws-sdk/client-s3`: ^3.1175.0 (Already present for S3-compatible APIs)
- **Cloudflare Dependencies:** Zero Cloudflare npm packages or CLI tools exist in `package.json`. No `wrangler.toml` or Cloudflare Pages configuration was detected in the active repository tree.

### 2.2 Frontend Build & API Routing (`client/vite.config.ts` & `client/src/api/client.ts`)
- **Vite Configuration:**
  - Root: `client/`
  - Output directory: `../dist/client`
  - Local dev proxy: `/api` forwarded to `http://localhost:4000`.
- **API Request Engine (`client/src/api/client.ts`):**
  - Current base URL: `const BASE_URL = '/api';`.
  - All network calls use relative paths (e.g., `/api/customer/stores`, `/api/auth/login`).
  - **Netlify Reverse Proxy Advantage:** When deployed on Netlify, configuring a simple proxy redirect in `netlify.toml` (`/api/* -> https://<cloud-run-url>/api/:splat`) allows the frontend to communicate with Cloud Run as a same-origin request. This eliminates CORS preflight latency (`OPTIONS` overhead) and prevents third-party cookie restrictions.

### 2.3 Server Entry Point & Host Binding (`server/src/index.ts`)
- **Port Ingestion:**
  - `const PORT = process.env.PORT || 4000;`
  - Cloud Run injects `$PORT` (typically 8080) automatically. Express correctly references `process.env.PORT`.
- **Host Binding Requirement:**
  - Currently, `app.listen(PORT)` is invoked without an explicit hostname parameter. In Docker on Linux, this must explicitly bind to `0.0.0.0` (`app.listen(Number(PORT), '0.0.0.0')`) so Cloud Run's external ingress proxy can reach the container.
- **Health Check Endpoint:**
  - `GET /api/health` exists and returns HTTP 200 with JSON payload `{ status: 'HEALTHY', ... }`. Perfect for Cloud Run startup and liveness probes.
- **Graceful Shutdown:**
  - Currently missing explicit `SIGTERM` / `SIGINT` handlers. When Cloud Run scales down or rolls out a new revision, it sends `SIGTERM` followed by a grace period (10–30s). Adding graceful shutdown ensures in-flight transactions and Prisma connections close cleanly.

### 2.4 CORS Configuration
- **Current Setup (`server/src/index.ts`):**
  - Reads `ALLOWED_ORIGINS` from environment variables, splitting on commas.
  - Rejects unauthorized origins with an explicit error.
  - Permits requests with no origin header (required for native Android apps, server-to-server calls, and cURL).
  - Configured allowed headers: `['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key']`.
  - **Adjustment Needed:** Must include `x-store-id` in `allowedHeaders` so merchant portal multi-branch switching operates without CORS preflight rejection when invoked cross-origin.

### 2.5 Prisma Schema & Database Engine (`prisma/schema.prisma`)
- **Current Datasource:**
  ```prisma
  datasource db {
    provider = "sqlite"
    url      = env("DATABASE_URL")
  }
  ```
- **ANSI & Data Type Compatibility:**
  - **Zero Database-Specific Decorators:** No SQLite-specific `@db` annotations exist.
  - **Primary Keys:** All models use UUID strings `@id @default(uuid())`, which are standard VARCHAR/TEXT in PostgreSQL.
  - **Numeric Fields:** All currencies are integer paise (`Int`), preventing float precision errors in both SQLite and PostgreSQL.
  - **No Unsupported Types:** No raw `Json` or binary types that require schema restructuring.
  - **Foreign Key Constraints & Cascades:** All `@relation` definitions with `onDelete: Cascade` are fully compliant with PostgreSQL foreign key syntax.
  - **Migration Mechanism:** The project has been managed using `prisma db push` and `prisma generate`. Migrating to Neon PostgreSQL requires only changing `provider = "postgresql"` and pointing `DATABASE_URL` to the Neon connection string.

### 2.6 File Uploads & Object Storage (`server/src/core/storage.ts`)
- **Current Behavior:**
  - Supports Cloudflare R2 if `R2_*` environment variables are present.
  - Falls back to writing files to the local disk at `uploads/`.
- **Cloud Run Implication:**
  - Cloud Run container file systems are **strictly ephemeral and held in memory**. Any file written to `uploads/` will vanish when the container scales to zero, restarts, or deploys a new revision.
  - Therefore, images must be offloaded to persistent external object storage.

### 2.7 Real-Time Communication & Schedulers
- **WebSockets / Subscriptions:** Checked codebase (`server/` and `client/`). Found **0 WebSocket or Socket.io dependencies**. All client views use stateless REST polling.
- **Background Schedulers:** Checked for `cron`, `node-cron`, `bull`, or `setInterval`. Found **0 persistent daemons**. All order workflows, quotes, reservations, and ledger postings are transactional and triggered per request.
- **Fit for Cloud Run:** Because there are no long-running stateful socket connections or continuous background worker loops, Cloud Run can safely scale to 0 instances when traffic is idle.

---

## 3. Phase 2: Google Cloud Run Compatibility Assessment

| Dimension | Cloud Run Requirement | Current Application State | Action Required |
| :--- | :--- | :--- | :--- |
| **Container Port** | Must listen on `$PORT` | `process.env.PORT || 4000` | Supported out of the box. |
| **Network Binding** | Must bind to `0.0.0.0` | Default Node binding | Update `app.listen(Number(PORT), '0.0.0.0')`. |
| **Health Check** | HTTP probe response | `GET /api/health` returns 200 | Configure Cloud Run startup & liveness probe path to `/api/health`. |
| **Lifecycle Signals** | Handle `SIGTERM` within deadline | No process signal handlers | Add `process.on('SIGTERM')` to close server and disconnect Prisma. |
| **Statelessness** | No persistent local disk state | Writes to local `uploads/` and `dev.db` | Connect to Neon PostgreSQL and external Object Storage. |
| **Connection Pooling** | Manage pool size under concurrency | Single Prisma client instance | Use Neon's PgBouncer pooled endpoint (`-pooler` on port 5432) with `connection_limit=5`. |
| **Concurrency & Scaling** | Limit concurrency & instances | Express handles concurrent async I/O | Set max instances to 1 and concurrency to 80 for free tier safety. |

---

## 4. Phase 3: External Object Storage Free-Tier Analysis

Because Cloud Run has an ephemeral disk, product and store images require persistent cloud object storage:

| Provider | Free-Tier Limits | S3-Compatible API | Best Use Case / Recommendation |
| :--- | :--- | :---: | :--- |
| **Google Cloud Storage (GCS)** | • 5 GB-months standard storage<br>• 5,000 Class A (PUT) ops/mo<br>• 50,000 Class B (GET) ops/mo<br>• 1 GB egress/mo | Yes (via XML API or `@google-cloud/storage`) | **Recommended Option A:** Same GCP ecosystem as Cloud Run; authenticates via Cloud Run default service account without secret keys. |
| **Cloudinary** | • 25 "credits" / month (~25 GB storage or 25,000 image transformations) | No (Custom REST API / SDK) | **Recommended Option B:** Outstanding automatic image resizing, WebP conversion, and global CDN delivery on free tier. |
| **Supabase Storage** | • 1 GB storage<br>• 2 GB bandwidth / month | Yes (S3-compatible) | Viable alternative if Supabase is already utilized. |
| **Backblaze B2** | • 10 GB storage<br>• 1 GB/day egress | Yes (S3-compatible) | High storage, but egress bandwidth requires Cloudflare Bandwidth Alliance (which we are avoiding). |

---

## 5. Phase 4: Database Migration Strategy (SQLite $\rightarrow$ Neon PostgreSQL)

### 5.1 Neon Compatibility Matrix
- **Neon Architecture:** Serverless Postgres built on compute/storage separation.
- **Connection Modes:**
  1. *Direct Connection:* `postgresql://user:pass@ep-xyz.aws.neon.tech/dbname?sslmode=require` (Used for running migrations).
  2. *Pooled Connection (PgBouncer):* `postgresql://user:pass@ep-xyz-pooler.aws.neon.tech/dbname?sslmode=require&pgbouncer=true` (Used by Cloud Run container at runtime to conserve connections).

### 5.2 Step-by-Step Migration Plan
1. **Schema Provider Update:**
   Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Schema Push to Neon:**
   Execute `npx prisma db push` targeting the Neon connection string to generate all 27 tables, foreign key constraints, and unique indices.
3. **Data Export & Import:**
   - Seed baseline pilot data using `npm run seed` or export existing SQLite records via script into PostgreSQL.
4. **Verification:**
   - Run Vitest integration suite against the PostgreSQL database to confirm parent-child transactions, inventory atomic updates, and double-entry ledger balance.

---

## 6. Phase 5: Cost & Free-Tier Guardrails

To strictly guarantee zero unplanned hosting charges:

### 6.1 Google Cloud Run Guardrails
- **Max Instances:** Set `--max-instances=1` (Prevents runaway auto-scaling).
- **Concurrency:** Set `--concurrency=80` (Single container handles up to 80 simultaneous requests).
- **CPU Allocation:** Set to *CPU only allocated during request processing* (`--no-cpu-throttling=false`), ensuring CPU drops to 0 when idle.
- **Free Monthly Quota:**
  - 2,000,000 requests per month free.
  - 360,000 GB-seconds memory per month free.
  - 180,000 vCPU-seconds per month free.
  - For Everything Local's initial pilot, traffic will comfortably consume $<5\%$ of the monthly free allotment.
- **Budget Alerts:** Configure a \$0.01 / \$5.00 budget alert in Google Cloud Billing Console with email notifications.

### 6.2 Netlify Free-Tier Guardrails
- **Bandwidth:** 100 GB / month free.
- **Build Minutes:** 300 minutes / month free.
- **Sites:** Unlimited public/private repository deployments.

### 6.3 Neon Free-Tier Guardrails
- **Compute:** 0.5 vCPU shared, autosuspending after 5 minutes of inactivity.
- **Storage:** 0.5 GB included free (Enough for tens of thousands of orders and products).

---

## 7. Recommended Next Actions & Approvals Required

Before modifying code or initiating deployments, the following architectural approvals are requested:

1. **Host Binding & Graceful Shutdown:** Approve adding `'0.0.0.0'` binding and `SIGTERM` listener to `server/src/index.ts`.
2. **CORS Header Inclusion:** Approve adding `x-store-id` to CORS `allowedHeaders` in `server/src/index.ts`.
3. **Frontend API Strategy:** Confirm whether to use **Pattern A (Netlify Reverse Proxy `/api/*`)** (recommended, zero client code change) or **Pattern B (Direct Cross-Origin `VITE_API_BASE_URL`)**.
4. **Object Storage Selection:** Confirm preferred persistent storage provider (**Google Cloud Storage** or **Cloudinary**).
5. **Database Migration Trigger:** Confirm when to provision the Neon PostgreSQL database URL and push the Prisma schema.
