# Everything Local — Prioritised Security Remediation Roadmap

---

## Phase P0: Immediate Launch Blockers (Must Fix Immediately)

### 1. Fix Arbitrary Price & Quantity Injection (VULN-001)
- **Why It Matters:** Any user can purchase any inventory item for ₹0.01 or negative price, causing catastrophic financial loss.
- **Affected Files:** `server/src/core/multiStoreOrderEngine.ts`, `server/src/routes/customer.ts`
- **Solution:** 
  - Add strict Zod schema for `POST /api/customer/orders/multi-store` validating `quantity >= 1`.
  - In `MultiStoreOrderEngine.checkout`, resolve `unitPricePaise` strictly from `tx.product.findUnique()`. Discard client-provided prices completely.
- **Regression Risk:** Low. Legitimate checkouts will now use canonical DB catalog pricing.
- **Acceptance Criteria:** Attempting checkout with modified `unitPricePaise` results in order created strictly at database price.

### 2. Remove Hardcoded JWT Secret & Enforce Production Cloudflare Secrets (VULN-002)
- **Why It Matters:** Attacker can forge valid `ADMIN` tokens and take over all database records.
- **Affected Files:** `server/src/worker.ts`, `wrangler.toml`
- **Solution:**
  - Remove `DEFAULT_SECRET` fallback in `server/src/worker.ts`.
  - Throw fatal runtime error on Worker initialization if `c.env.JWT_SECRET` is missing.
  - Set strong random 64-character secret via `npx wrangler secret put JWT_SECRET`.
- **Regression Risk:** Existing active tokens will be invalidated upon rotation (expected).
- **Acceptance Criteria:** Cloudflare Worker rejects forged tokens and crashes securely if `JWT_SECRET` is unset.

### 3. Remove Hardcoded Master OTP Backdoor in Rider Auth (VULN-003)
- **Why It Matters:** Complete authentication bypass allowing takeover of any delivery partner account using OTP `123456`.
- **Affected Files:** `server/src/routes/deliveryPartner.ts`
- **Solution:** Delete lines 75-79 (`if (otp !== '123456')`) and enforce genuine OTP verification.
- **Regression Risk:** Test scripts relying on `123456` must pass mock OTP provider in `test` environment only.
- **Acceptance Criteria:** OTP `123456` is rejected with HTTP 400 in all environments unless explicitly mocked under `NODE_ENV === 'test'`.

### 4. Patch Path Traversal in Prescription Streaming (VULN-004)
- **Why It Matters:** Arbitrary file read of server environment variables, source code, and secrets.
- **Affected Files:** `server/src/routes/pharmacy.ts`
- **Solution:**
  - In `POST /prescriptions`, do not trust client `storagePath`. Generate server-side UUID keys.
  - In `GET /prescriptions/:id/documents/:docId/view`, enforce `path.basename(doc.storagePath)` and verify `filePath.startsWith(SECURE_PRESCRIPTION_DIR)`.
- **Acceptance Criteria:** Submitting `storagePath: "../../../.env"` fails or normalizes safely without reading parent directories.

---

## Phase P1: Before Public Launch (Essential Platform Integrity)

### 5. Remove `autoVerify` Parameter from Merchant Registration (VULN-005)
- **Files:** `server/src/routes/auth.ts`, `server/src/routes/merchant.ts`
- **Solution:** Remove `autoVerify` from `MerchantRegisterSchema` and `CreateStoreSchema`. Enforce `isVerified: false` by default. Only admin verification can toggle this flag.

### 6. Enforce Merchant Tenant Isolation on KYC R2 Storage (VULN-006)
- **Files:** `server/src/worker.ts`
- **Solution:** Parse merchant store ID from the KYC key path (e.g. `kyc/{storeId}/...`) and verify `user.role === 'ADMIN' || user.storeId === requestedStoreId`.

### 7. Whitelist Allowed Fields on Product Update (VULN-007)
- **Files:** `server/src/routes/merchant.ts`
- **Solution:** Parse `req.body` with `ProductSchema.partial()` and pass only sanitized fields to `prisma.product.update`.

### 8. Restrict Order Status Transitions to Verified Lifecycle (VULN-008 & VULN-009)
- **Files:** `server/src/routes/merchant.ts`, `server/src/core/merchantSettlementEngine.ts`
- **Solution:** 
  - Restrict merchant status updates to `ACCEPTED`, `PREPARING`, `READY`, `REJECTED`.
  - Disallow merchant setting `DELIVERED` directly for delivery orders (rider OTP required).
  - Exclude `READY_FOR_PICKUP` orders from financial settlements until customer receipt is verified.

### 9. Secure Bank Account Encryption with Environment Key & Dynamic Salt (VULN-010)
- **Files:** `server/src/core/bankVerificationService.ts`
- **Solution:** Require `BANK_ENCRYPTION_SECRET` in production and use unique merchant ID as salt derivation parameter.

### 10. Persistent Webhook Deduplication and Mandatory Secret (VULN-011)
- **Files:** `server/src/core/paymentLifecycleEngine.ts`
- **Solution:** Store processed webhook event IDs in Cloudflare D1 or KV with TTL, and throw an error if `webhookSecret` is not configured.

---

## Phase P2: Before Scaling (Operational Reliability & Hardening)

- **VULN-012:** Refactor delivery task acceptance to atomic `prisma.deliveryTask.updateMany({ where: { id, status: 'AVAILABLE' } })`.
- **VULN-013:** Verify `task.riderId === req.user.riderId` before customer delivery OTP confirmation.
- **VULN-014:** Enforce `household.members.some(m => m.userId === user.id)` across all household operations.
- **VULN-015:** Validate `quantity >= 1` on community campaign pledges.
- **VULN-016:** Implement `express-rate-limit` (10 requests/minute) on `/auth/login` and `/auth/send-otp`.
- **VULN-017:** Switch Android `SessionManager` to `EncryptedSharedPreferences` and set `android:allowBackup="false"`.
- **VULN-019:** Migrate local filesystem operations (`uploads/`) to Cloudflare R2 bucket (`MEDIA_BUCKET`) uniformly.

---

## Phase P3: Continuous Improvement (Hardening & Maintenance)

- **VULN-018:** Add Helmet middleware to Express and CSP / HSTS headers in `client/worker.ts`.
- **VULN-020:** Run `npm audit fix` and update outdated packages with compatibility checks.
