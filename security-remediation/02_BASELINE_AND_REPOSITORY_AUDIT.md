# Everything Local — Phase 0: Baseline & Repository Security Audit

> **Branch:** `security/comprehensive-remediation`  
> **Source Commit:** `c1d8a319164d971cd81664ff38c185835704dfa5`  
> **Target Cloudflare Account:** `Kabirshah0021@gmail.com's Account` (`6ab31e6d677b2f74c2b27f217c2f4c9c`)  
> **Remediation Lead:** Principal Application Security Engineer  

---

## 1. Repository Inventory & Architecture Baseline

| Layer | Implementation Technologies | Entry Points & Components | Deployment Target |
|---|---|---|---|
| **API Backend (Local/Express)** | TypeScript, Express 4, Zod, Prisma 6.4 | `server/src/index.ts`, `server/src/routes/*` | Local Node.js (Port 4000) / Integration Tests |
| **API Backend (Cloudflare Edge)**| TypeScript, Hono 4, Prisma D1 Adapter | `server/src/worker.ts` | Cloudflare Workers (`everything-local-api`) |
| **Frontend Web** | React 18, Vite 6, TailwindCSS | `client/src/main.tsx`, `client/worker.ts` | Cloudflare Workers Static Assets (`everything-local-web`) |
| **Database** | SQLite (`dev.db`) / Cloudflare D1 | `prisma/schema.prisma`, `d1-migrations/` | D1 Database (`everything-local-db`) |
| **Object Storage** | Local Disk (`uploads/`) / Cloudflare R2 | `server/src/core/storage.ts` | R2 Bucket (`everything-local-media`) |
| **Cache & Sessions** | In-memory Maps / Cloudflare KV | `CACHE_KV` binding | KV Namespace (`everything-local-cache`) |
| **Mobile Apps** | Kotlin Native / Jetpack Compose | `android-native/` (`customer`, `merchant`, `delivery-partner`) | Android Release / APK |
| **Cross-Platform Mobile** | React Native / Expo 52 | `mobile/` | Expo Managed Workflow |

---

## 2. Verification of Critical P0 Vulnerabilities

| Finding ID | Reported Vulnerability | Verified Code Location | Verification Status | Exploitability & Architecture Risk |
|---|---|---|---|---|
| **VULN-001** | Client-Controlled Product Pricing in Multi-Store Checkout | `server/src/core/multiStoreOrderEngine.ts:96` & `server/src/routes/customer.ts:1124-1160` | **CONFIRMED** | High. Checkout ignores `product.pricePaise` from DB and uses client `unitPricePaise` and unvalidated `quantity`. |
| **VULN-002** | Hardcoded Fallback JWT Secret in Production Worker | `server/src/worker.ts:43-47` & `wrangler.toml:27-32` | **CONFIRMED** | High. Worker uses hardcoded fallback `'everything_local_indore_jwt_prod_key_2026_secured_cf'` if `env.JWT_SECRET` is unset. |
| **VULN-003** | Universal OTP Backdoor in Delivery Partner Auth | `server/src/routes/deliveryPartner.ts:74-80` | **CONFIRMED** | High. Any phone number can log in with OTP `123456` because `otp !== '123456'` check lacks environment restriction. |
| **VULN-004** | Prescription Path Traversal & Arbitrary File Read | `server/src/routes/pharmacy.ts:298, 505-527` | **CONFIRMED** | High. `storagePath` supplied in client JSON is piped through `path.join(SECURE_PRESCRIPTION_DIR, doc.storagePath)` without basename check. |

---

## 3. Existing Test Baseline & Environment

- **TypeScript Engine:** `v5.7.3`
- **Node.js Runtime:** `v24.22.0`
- **Test Framework:** Vitest `v3.2.7` with Supertest
- **Database:** Local SQLite (`dev.db` with 20 categories, 100 subcategories, 25 stores, 34 products, and ledger tables).
- **Cloudflare Account ID:** Explicitly locked to `6ab31e6d677b2f74c2b27f217c2f4c9c`. Zero access to legacy Gaming Uncut resources.
