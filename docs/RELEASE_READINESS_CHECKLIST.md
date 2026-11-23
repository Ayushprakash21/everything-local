# Everything Local — Release Readiness Checklist
**Target Pilot Delivery Date:** Sunday, 29 November 2026  
**Audited Git Branch:** `repair/v2.0-master-architecture`  
**Latest Verification Commit:** `85dbe33`  
**Status:** **PILOT-READY (Conditional on Live Production Credentials)**  

---

## 1. Release Readiness Summary

| Operational Domain | Target Requirement | Verified Implementation | Readiness Status |
| :--- | :--- | :--- | :---: |
| **Authentication & Role Security** | Zero public privilege escalation; strong JWT secret | RegisterSchema blocks ADMIN; bootstrap-admin locks after 1st admin; getJwtSecret() halts on weak keys in prod | **READY** |
| **Network & Origin Security** | Strict CORS and SSRF defenses | Whitelisted origins only; pre-flight DNS lookup blocks private/loopback/cloud metadata IPs | **READY** |
| **Multi-Store Commerce** | Unified cart across stores; parent-child order model | Unified cart; atomic parent order + merchant child orders with isolated partial rejection | **READY** |
| **Inventory & Concurrency** | Zero overselling; atomic stock locking | Transactional conditional decrements (`stock >= quantity`); race conditions verified with 0 negative stock | **READY** |
| **Financial Ledger Integrity** | Balanced double-entry accounting | Standard chart of accounts; strict $\sum \text{Debits} \equiv \sum \text{Credits}$ enforced; fault-based item refunds | **READY** |
| **Payment Gateway** | Verified cryptographic lifecycle | Razorpay HMAC-SHA256 signature verification; idempotent webhook deduplication cache | **READY** |
| **Logistics & Delivery** | 4-tier priority pricing with honest status | Road distance calculation (1.28x urban detour); honest `MANUAL_PENDING` fallback when Porter API key is absent | **READY** |
| **Multi-Store Merchant Tenancy** | Data isolation across branches | `requireMerchantTenant` checks store ownership; returns HTTP 403 on unauthorized `x-store-id` probing | **READY** |
| **UI/UX & Brand System** | Responsive design; zero image breaks | Approved vector brand SVGs; `ImageWithFallback` for 12 categories; 320px–1920px verified | **READY** |
| **Build & Test Automation** | 100% green tests; clean production builds | 21 test files / 173 tests passing (0 failures); server TypeScript & client Vite 0 errors | **READY** |

---

## 2. Pre-Deployment Verification Checklist

### 2.1 Database & Migrations
- [x] Schema synchronized with `prisma db push` / `prisma generate`.
- [x] All 9 P2 models (`ParentOrder`, `MerchantChildOrder`, `DeliveryTask`, `RiderProfile`, `AdCampaign`, `ServiceBooking`, `Prescription`, `RefundRecord`, `DoubleEntryTransaction`) present.
- [x] Database snapshot procedure documented (`prisma/dev.db.baseline-backup`).
- [x] SQLite to PostgreSQL migration path verified (all models use standard ANSI types and UUID strings).

### 2.2 Security Configurations
- [x] `RegisterSchema` rejects `role: 'ADMIN'` (HTTP 403).
- [x] `/api/auth/bootstrap-admin` permanently locked once an administrator exists.
- [x] CORS rejects wildcard `*` with credentials; restricts access to `ALLOWED_ORIGINS` and trusted local/mobile schemes.
- [x] Image ingestion verifies binary magic bytes (JPEG, PNG, WebP) and blocks internal SSRF IP ranges (`127.0.0.0/8`, `169.254.169.254`, `10.0.0.0/8`, `192.168.0.0/16`).

### 2.3 Payments & Webhooks
- [x] Webhook endpoint `/api/payments/razorpay/webhook` verifies HMAC-SHA256 signatures.
- [x] Idempotency deduplication cache prevents double-processing identical events.
- [x] COD payment pathway requires OTP verification prior to final order completion.
- [ ] **Pending Production Action:** Insert live `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in production `.env`.

### 2.4 Logistics & Dispatch
- [x] 4 delivery tiers calculated with dynamic distance, weight, and extra pickup fees.
- [x] Express 20 limits enforced ($\le 2$ stores, $\le 3$ km, $\le 5$ kg).
- [x] Dual OTP handovers (Merchant Pickup OTP and Customer Delivery OTP) prevent phantom deliveries.
- [ ] **Pending Production Action:** Insert live `PORTER_API_KEY` in production `.env` (or operate in in-house manual fleet dispatch mode).

### 2.5 Responsive Front-End & Cross-Device UI
- [x] Header nav items fit within 320px, 375px, 768px, 1024px, 1440px, and 1920px viewports without horizontal scroll.
- [x] Mobile touch targets satisfy accessibility minimums ($\ge 44 \times 44$px).
- [x] Brand vector logo renders crisply with subpixel letter-spacing.
- [x] Product images feature category-specific SVG fallbacks on loading failure.

---

## 3. Go / No-Go Decision Framework

| Criterion | Threshold | Current Metric | Decision |
| :--- | :---: | :---: | :---: |
| **Automated Test Pass Rate** | $100\%$ | $173 / 173 (100\%)$ | **GO** |
| **Critical P0 Security Vulnerabilities** | 0 | 0 | **GO** |
| **TypeScript Compilation Errors** | 0 | 0 | **GO** |
| **Production Vite Build Errors** | 0 | 0 | **GO** |
| **Double-Entry Ledger Imbalance** | ₹0.00 | ₹0.00 | **GO** |
| **Inventory Overselling Under Race Conditions** | 0 | 0 | **GO** |

---

## 4. Production Deployment Protocol (Runbook)

```bash
# Step 1: Pre-flight database backup
cp prisma/dev.db prisma/dev.db.pre-deploy-$(date +%Y%m%d%H%M%S)

# Step 2: Validate production environment variables
test -n "$JWT_SECRET" || (echo "FATAL: JWT_SECRET must be set" && exit 1)
test -n "$ALLOWED_ORIGINS" || (echo "FATAL: ALLOWED_ORIGINS must be set" && exit 1)

# Step 3: Run database migration
npx prisma db push --skip-generate

# Step 4: Build server & client
npm run build

# Step 5: Start background daemons
NODE_ENV=production npm run start
```
