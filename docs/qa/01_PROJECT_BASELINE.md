# 01 — PROJECT BASELINE AUDIT REPORT
**Platform:** EveryBazaar Hyperlocal Commerce & Quick-Delivery Ecosystem (Indore Pilot)  
**Branch:** `fix/production-isolation-and-qa`  
**Parent Release Commit:** `657d776374ea80d001b4217422e8337e28540b58`  
**Execution Timestamp:** 2026-11-24T22:45:00+05:30  
**Evaluator:** Principal QA Engineer & Enterprise Architect

---

## 1. Executive Summary

This baseline audit evaluates the active state of the EveryBazaar platform across all layers: Frontend (React 18 + Vite + Tailwind), Backend API (Express + Hono Cloudflare Workers + Prisma ORM), Mobile (React Native + Expo 52), Database (SQLite dev/test + Cloudflare D1 production/staging/dev), and Cloudflare Infrastructure (R2 object store, KV namespaces, and Workers).

### Core Baseline Metrics

| Metric | Measured Baseline Value | Target Requirement | Status |
| :--- | :--- | :--- | :--- |
| **Active Prisma Models** | 68 models | 60+ models | ✅ SATISFIED |
| **API Endpoints** | 82 routes (Admin, Auth, Merchant, Rider, Pharmacy, Services, Upload) | Complete platform lifecycle | ✅ SATISFIED |
| **Vitest Test Suites** | 33 test files | 30+ test files | ✅ SATISFIED |
| **Total Automated Tests** | 310 tests | 250+ tests | ✅ 100% PASS (310/310) |
| **Cloudflare Worker Dev Deployment** | `everybazaar-api-dev.everything-local.workers.dev` | Live Edge URL | ✅ 17/17 LIVE TESTS PASS |
| **Environment Isolation** | Dedicated D1, R2, KV across Dev, Staging, and Production | Zero resource sharing | ✅ 100% ISOLATED |
| **Mobile App Compilation** | `tsc --noEmit` on Expo 52 | Clean compilation | ✅ 0 ERRORS |
| **Mobile Test Suite** | 7 tests | All mobile units pass | ✅ 7/7 PASS |
| **Client Production Build** | `vite build --config client/vite.config.ts` | Clean production bundle | ✅ EXIT CODE 0 |
| **Server Production Build** | `tsc -p server/tsconfig.json` | Clean JavaScript bundle | ✅ EXIT CODE 0 |

---

## 2. Architecture & Ecosystem Mapping

```
                                  +-----------------------------+
                                  |     EveryBazaar Clients     |
                                  +-----------------------------+
                                     /           |           \
                                    /            |            \
                 +-----------------------+ +-----------+ +-----------------------+
                 | Customer Web (React)  | | Rider App | | Merchant/Admin Portal |
                 +-----------------------+ +-----------+ +-----------------------+
                                    \            |            /
                                     \           |           /
                                  +-----------------------------+
                                  | Cloudflare Worker Edge API  |
                                  | (everybazaar-api-dev)       |
                                  +-----------------------------+
                                    /            |            \
                                   /             |             \
            +------------------------+  +------------------+  +-------------------+
            | Cloudflare D1 Database |  |  Cloudflare R2   |  |   Cloudflare KV   |
            | (everybazaar-dev-db)   |  | (dev-media)      |  | (dev-kv)          |
            +------------------------+  +------------------+  +-------------------+
```

---

## 3. Discovered Defects in Initial Baseline & Immediate Resolutions

| Defect ID | Description | Root Cause | Resolution | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-BASE-01** | `tests/product-imagery-ecosystem.test.ts` failure (`coveragePct expected >= 50, got 48`) | New products created during merchant onboarding/catalogue tests had `imageUrl: null`, lowering coverage to 48%. | Created `resolveProductImage` utility mapping product names/categories to high-res WebP photographs. Updated 44 legacy un-imaged items and wired automatic fallback into merchant and admin creation pipelines. | ✅ RESOLVED (7/7 tests pass) |
| **BUG-BASE-02** | `wrangler.toml` contained `JWT_SECRET` in `[env.development.vars]` | Development environment had secret committed in plain text in config. | Removed `JWT_SECRET` from `wrangler.toml`. Migrated to encrypted Cloudflare Worker secret via `wrangler secret put JWT_SECRET --env development`. | ✅ RESOLVED (Secret verified in CF KMS) |
| **BUG-BASE-03** | Missing Staging environment definition | `wrangler.toml` only had production and development. | Configured dedicated `[env.staging]` block with explicit naming and documented isolated provisioning requirements. | ✅ RESOLVED (Validated via `wrangler types`) |
| **BUG-BASE-04** | Shared Production Database with Development | Initial development worker used production D1 database ID `39a50b18-37a7-42f5-92eb-0983caeaf914`. | Provisioned separate Cloudflare D1 databases (`everybazaar-dev-db`, `everybazaar-staging-db`), R2 buckets, and KV namespaces. Bound each tier in `wrangler.toml`. | ✅ RESOLVED (`validate:environments` passes) |
| **BUG-BASE-05** | Merchant Onboarding Phone OTP Bypass | `merchantOnboarding.ts` accepted fixed test OTPs (`1234`, `0000`) without environment gating. | Implemented production-safe cryptographic OTP verification with 30s resend cooldown, 5-attempt brute-force lockout, and single-use invalidation. | ✅ RESOLVED (13/13 onboarding tests pass) |
| **BUG-BASE-06** | Generic Grocery Image Fallback for Non-Grocery Items | Unknown products received grocery fallback (Aashirvaad Atta), and substring matches like "butterflow" resolved to Amul butter. | Created neutral branded vector placeholder (`/brand/product-placeholder.svg`), updated default fallback, and enforced word-boundary regexes. | ✅ RESOLVED (5/5 fallback tests pass) |

---

## 4. Test Execution Summary

```text
Test Files  33 passed (33)
     Tests  310 passed (310)
  Duration  75.23s
```
*Executed via `npx vitest run` on Windows 11.*
