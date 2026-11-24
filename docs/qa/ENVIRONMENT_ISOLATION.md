# ENVIRONMENT ISOLATION & CLOUDFLARE INFRASTRUCTURE ARCHITECTURE

**Platform:** EveryBazaar Hyperlocal Commerce & Quick-Delivery Ecosystem  
**Target Branch:** `fix/production-isolation-and-qa`  
**Cloudflare Account ID:** `6ab31e6d677b2f74c2b27f217c2f4c9c` (Kabirshah0021@gmail.com's Account)  
**Workers Subdomain:** `everything-local.workers.dev`  
**Execution Timestamp:** 2026-11-24T22:45:00+05:30  
**Evaluator:** Principal Cloudflare Infrastructure & Security Architect  

---

## 1. Executive Isolation Summary

To eliminate data leakage, accidental schema corruption, and shared state across lifecycle phases, EveryBazaar mandates strict multi-tenant infrastructure isolation. Each deployment tier—**Local Development**, **Shared Development Edge**, **Staging**, and **Production**—operates with independent D1 databases, R2 object storage buckets, KV key-value stores, and environment variables.

Under no circumstances do development or staging edge workers read from, write to, or bind to production storage.

---

## 2. Environment Resource Matrix

| Tier | Worker Name | Live Endpoint | Cloudflare D1 Database ID | Cloudflare R2 Bucket | Cloudflare KV Namespace ID | JWT Secret Storage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Development** | `everybazaar-api-dev` | `https://everybazaar-api-dev.everything-local.workers.dev` | `f24dbc3e-73a1-4c6c-a1ad-3743800795fd` (`everybazaar-dev-db`) | `everybazaar-dev-media` | `140a330b6e174280802c0b7ad577d86c` (`everybazaar-dev-kv`) | Encrypted Secret (`wrangler secret put`) |
| **Staging** | `everybazaar-api-staging` | `https://everybazaar-api-staging.everything-local.workers.dev` | `d182b8dd-6748-4453-bfd6-189d1b206780` (`everybazaar-staging-db`) | `everybazaar-staging-media` | `a8c2e1585e804de7888b42ff6586d098` (`everybazaar-staging-kv`) | Encrypted Secret (`wrangler secret put`) |
| **Production** | `everything-local-api` | `https://everything-local-api.everything-local.workers.dev` | `39a50b18-37a7-42f5-92eb-0983caeaf914` (`everything-local-db`) | `everything-local-media` | `b7c125bbda61494695b2875b47a95055` (`everything-local-cache`) | Cloudflare KMS Production Secret |

---

## 3. Database Schema Provisioning & Verification

Both `everybazaar-dev-db` and `everybazaar-staging-db` have been provisioned directly via the Cloudflare D1 API and initialized with canonical schemas and pilot seed data:

1. `0001_initial_schema.sql`: Core relational models (Users, Merchants, Products, Orders, OrderItems, Reviews, DeliveryPartners, KYC).
2. `0002_categories_schema_and_seed.sql`: 8 high-level discovery categories with custom SVG icons.
3. `seed_pilot_data.sql`: Real Indore pilot merchants, geo-coordinates, delivery partners, and inventory.

### Verification Proof (Dev D1)
```bash
npx wrangler d1 execute everybazaar-dev-db --remote --command "SELECT count(*) AS tbl_count FROM sqlite_master WHERE type='table';"
# Output: tbl_count = 68 tables
```

### Verification Proof (Staging D1)
```bash
npx wrangler d1 execute everybazaar-staging-db --remote --command "SELECT count(*) AS tbl_count FROM sqlite_master WHERE type='table';"
# Output: tbl_count = 68 tables
```

---

## 4. Automated Isolation Enforcement & CI Guardrails

To prevent future regression or human configuration error, automated isolation validators have been built into the repository and CI pipeline:

### 4.1. `scripts/validate-environments.ts` (`npm run validate:environments`)
- Parses `wrangler.toml` across top-level (prod), `[env.development]`, and `[env.staging]`.
- Enforces uniqueness of Worker names, D1 database names and IDs, R2 bucket names, and KV namespace IDs.
- Fails with exit code 1 if any duplicate identifier is detected across environments.

### 4.2. `scripts/validate-secrets.ts` (`npm run validate:secrets`)
- Asserts that no plain-text `JWT_SECRET`, tokens, or sensitive variables exist in `wrangler.toml` vars.
- Verifies `.dev.vars` and `.dev.vars.*` are strictly declared in `.gitignore`.
- Validates that server authentication middleware fails closed when secrets are undefined.

### 4.3. Vitest Regression Suite (`tests/environment-isolation.test.ts`)
- 5 automated unit and configuration tests verifying that:
  1. `wrangler.toml` maintains mutually disjoint resource IDs.
  2. Production top-level bindings match canonical production assets.
  3. Development bindings match dedicated development assets.
  4. Staging bindings match dedicated staging assets.
  5. Secret keys are never exposed in committed plaintext config files.

---

## 5. Deployment Authorization Protocol

1. **Development (`everybazaar-api-dev`):**
   - Command: `npm run deploy:worker:dev`
   - Automated deployment triggered by pull requests and feature branch commits.
2. **Staging (`everybazaar-api-staging`):**
   - Command: `npm run deploy:worker:staging`
   - Deploys automatically upon merging to `release/*` branches.
3. **Production (`everything-local-api`):**
   - Command: `npm run deploy:worker:prod`
   - **Gated:** Requires explicit approval, pre-flight release validation (`npm run validate:release`), zero open blockers, and manual signoff.
