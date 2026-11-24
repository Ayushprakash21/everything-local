# Everything Local — Full Security Audit & Technical Vulnerability Report
**Detailed Vulnerability Dossier, Exploitation Mechanics & Technical Evidence**

---

### VULN-001: Arbitrary Client-Controlled Price & Negative Quantity in Multi-Store Checkout
- **Severity:** `CRITICAL`
- **CVSS v3.1:** 9.8 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:H`)
- **CWE:** CWE-472 (External Control of Assumed-Immutable Web Parameter), CWE-20 (Improper Input Validation)
- **OWASP:** API8:2023 Security Misconfiguration / Business Logic Flaw
- **Affected File:** `server/src/core/multiStoreOrderEngine.ts` (Lines 80-97, 132-164) & `server/src/routes/customer.ts` (Lines 1124-1160)
- **Description:**
  When customers checkout via `POST /api/customer/orders/multi-store`, the endpoint accepts an array of `items` containing `unitPricePaise` and `quantity`. While the database queries `product = await tx.product.findUnique({ where: { id: item.productId } })`, line 96 computes subtotal as:
  ```typescript
  totalSubtotalPaise += item.unitPricePaise * item.quantity;
  ```
  It completely ignores `product.pricePaise` from the database. Furthermore, `unitPricePaise` and `quantity` are not validated against negative numbers or upper bounds.
- **Reproducible Test Case / Attack Vector:**
  Send `POST /api/customer/orders/multi-store` with body:
  ```json
  {
    "deliveryAddress": "Palasia, Indore",
    "deliveryTier": "STANDARD_60",
    "paymentMethod": "ONLINE",
    "items": [
      {
        "productId": "valid-expensive-product-id",
        "storeId": "valid-store-id",
        "unitPricePaise": 1,
        "quantity": 1
      }
    ]
  }
  ```
- **Actual Behavior:** Parent order and child orders are created with `totalPaidPaise = 1 + deliveryFeePaise`. The customer pays ₹0.01 for a ₹500 item, and the ledger balances around the fraudulent ₹0.01 credit.
- **Expected Behavior:** Server must strictly resolve `unitPricePaise` from `product.pricePaise` in the database, rejecting any client-supplied prices. `quantity` must be a strictly positive integer (`min(1)`).
- **Remediation:** Enforce database price synchronization and add strict Zod schema validation in `customer.ts`.

---

### VULN-002: Hardcoded Default JWT Secret in Production Cloudflare Worker & Missing Variable
- **Severity:** `CRITICAL`
- **CVSS v3.1:** 9.8 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`)
- **CWE:** CWE-798 (Use of Hard-coded Credentials), CWE-321 (Use of Hard-coded Cryptographic Key)
- **OWASP:** A02:2021 Cryptographic Failures
- **Affected File:** `server/src/worker.ts` (Lines 43-47) & `wrangler.toml` (Lines 27-32)
- **Description:**
  In `server/src/worker.ts`, line 43 declares:
  ```typescript
  const DEFAULT_SECRET = 'everything_local_indore_jwt_prod_key_2026_secured_cf';
  function getSecret(env: Bindings): string {
    return env.JWT_SECRET || DEFAULT_SECRET;
  }
  ```
  In `wrangler.toml`, `JWT_SECRET` is neither defined under `[vars]` nor stored in Cloudflare Secrets. As a result, the live Cloudflare Worker falls back to `DEFAULT_SECRET`.
- **Reproducible Test Case / Attack Vector:**
  An attacker crafts a JWT token signed with HMAC SHA256 using key `'everything_local_indore_jwt_prod_key_2026_secured_cf'` with payload:
  ```json
  {
    "userId": "attacker-id",
    "email": "attacker@evil.com",
    "role": "ADMIN"
  }
  ```
  Attacker sends `Authorization: Bearer <forged-token>` to `https://everything-local-api.everything-local.workers.dev/api/admin/metrics`.
- **Actual Behavior:** The Cloudflare Worker verifies the token successfully and elevates the attacker to full administrative privileges.
- **Expected Behavior:** Worker runtime must fail securely on startup (`throw new Error(...)`) if `JWT_SECRET` is missing, and never contain hardcoded fallback keys in source code.
- **Remediation:** Remove hardcoded string, enforce mandatory secret presence, and provision via `wrangler secret put JWT_SECRET`.

---

### VULN-003: Hardcoded Master OTP Backdoor in Delivery Partner Authentication
- **Severity:** `CRITICAL`
- **CVSS v3.1:** 9.8 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`)
- **CWE:** CWE-287 (Improper Authentication), CWE-798 (Use of Hard-coded Credentials)
- **OWASP:** A07:2021 Identification and Authentication Failures
- **Affected File:** `server/src/routes/deliveryPartner.ts` (Lines 73-82)
- **Description:**
  In `POST /api/delivery-partner/auth/verify-otp`, lines 74-80 execute:
  ```typescript
  const stored = otpStore.get(phone);
  if (!stored || stored.otp !== otp || stored.expiresAt < new Date()) {
    // In non-production testing, also accept standard master OTP 123456
    if (otp !== '123456') {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }
  }
  ```
  The code omits any `process.env.NODE_ENV !== 'production'` check. In production, anyone supplying `otp: "123456"` bypasses OTP verification for any phone number.
- **Reproducible Test Case / Attack Vector:**
  Send `POST /api/delivery-partner/auth/verify-otp` with:
  ```json
  {
    "phone": "9826011111",
    "otp": "123456"
  }
  ```
- **Actual Behavior:** Returns HTTP 200 with an authenticated JWT token for the target rider.
- **Expected Behavior:** Hardcoded OTPs must be strictly removed in production builds.

---

### VULN-004: Arbitrary File Read & Path Traversal in Prescription Document Streaming
- **Severity:** `CRITICAL`
- **CVSS v3.1:** 9.1 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N`)
- **CWE:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory), CWE-73 (External Control of File Name or Path)
- **OWASP:** A01:2021 Broken Access Control
- **Affected File:** `server/src/routes/pharmacy.ts` (Lines 298, 505-527)
- **Description:**
  When a prescription is submitted via `POST /api/pharmacy/prescriptions`, the client submits document metadata in the body:
  ```json
  "documents": [{ "storagePath": "../../../.env", "fileName": "secret.txt", ... }]
  ```
  When viewing via `GET /api/pharmacy/prescriptions/:id/documents/:docId/view`, line 505 runs:
  ```typescript
  const filePath = path.join(SECURE_PRESCRIPTION_DIR, doc.storagePath);
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  ```
  Because `path.join` resolves `..` segments and does not call `path.basename` or verify containment within `SECURE_PRESCRIPTION_DIR`, arbitrary files on the filesystem (such as `.env`, source files, and database files) can be streamed to the client.
- **Reproducible Test Case / Attack Vector:**
  Create a prescription with `storagePath: "../../.env"`, then stream `/prescriptions/:id/documents/:docId/view`.
- **Actual Behavior:** Streams the server's `.env` configuration including database keys and secrets.
- **Expected Behavior:** `storagePath` must be generated server-side only, and filename resolution must strictly enforce `path.basename` and whitelist checking.

---

### VULN-005: Merchant Self-Verification & Statutory KYC Bypass
- **Severity:** `HIGH`
- **CVSS v3.1:** 8.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:L`)
- **CWE:** CWE-276 (Incorrect Default Permissions), CWE-639 (Authorization Bypass Through User-Controlled Key)
- **OWASP:** API3:2023 Broken Object Property Level Authorization
- **Affected Files:**
  - `server/src/routes/auth.ts` (Lines 35, 104)
  - `server/src/routes/merchant.ts` (Line 126)
- **Description:**
  In `POST /api/auth/register-merchant` and `POST /api/merchant/store`, the application sets:
  ```typescript
  isVerified: autoVerify === true // or req.body.autoVerify === true
  ```
  This allows anyone registering a store to pass `autoVerify: true` and immediately publish products, sell to consumers, and bypass mandatory KYC verification, GSTIN matching, and admin approval.
- **Remediation:** Remove `autoVerify` from client-facing schemas. `isVerified` must only be modifiable by authorized administrators via `/api/admin/merchants/:id/verify`.

---

### VULN-006: Insecure Direct Object Reference (IDOR) on Private KYC Documents in Cloudflare Worker
- **Severity:** `HIGH`
- **CVSS v3.1:** 7.7 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N`)
- **CWE:** CWE-639 (BOLA/IDOR), CWE-285 (Improper Authorization)
- **OWASP:** API1:2023 Broken Object Level Authorization
- **Affected File:** `server/src/worker.ts` (Lines 591-610)
- **Description:**
  The private KYC endpoint in Cloudflare Worker checks only:
  ```typescript
  if (user.role !== 'ADMIN' && user.role !== 'MERCHANT') {
    return c.text('Forbidden: Unauthorized KYC Access', 403);
  }
  const path = c.req.path.replace('/media/kyc/', 'kyc/');
  const object = await c.env.MEDIA_BUCKET.get(path);
  ```
  Any authenticated merchant can view any other merchant's uploaded identity documents, bank cheques, and PAN records by requesting `/media/kyc/<key>`.
- **Remediation:** Validate that the requested document key belongs to the authenticated user's store before streaming.

---

### VULN-007: Mass Assignment in Merchant Product Update Endpoint
- **Severity:** `HIGH`
- **CVSS v3.1:** 7.5 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N`)
- **CWE:** CWE-915 (Improperly Controlled Modification of Dynamically Determined Object Attributes)
- **OWASP:** API3:2023 Broken Object Property Level Authorization
- **Affected File:** `server/src/routes/merchant.ts` (Lines 261-264)
- **Description:**
  In `PUT /api/merchant/products/:id`:
  ```typescript
  const updated = await prisma.product.update({
    where: { id },
    data: req.body
  });
  ```
  The entire raw `req.body` is forwarded to Prisma without validation. A merchant can transfer products into another store (`storeId`), manipulate internal product IDs, or overwrite audit tracking attributes.
- **Remediation:** Validate `req.body` with `ProductSchema.partial()` and explicitly whitelist allowed fields (`name`, `pricePaise`, `stock`, `description`, etc.).

---

### VULN-008: Merchant Can Fraudulently Trigger Payouts by Unilaterally Marking Orders as DELIVERED
- **Severity:** `HIGH`
- **CVSS v3.1:** 8.1 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N`)
- **CWE:** CWE-840 (Business Logic Flaw)
- **Affected File:** `server/src/routes/merchant.ts` (Lines 366-391)
- **Description:**
  In `POST /api/merchant/orders/:id/status`, if a merchant sets `status: 'DELIVERED'`, the system writes credit entries to `FinancialLedger` for merchant payable amounts immediately:
  ```typescript
  if ((status === 'DELIVERED' || status === 'COLLECTED') && order.status !== 'DELIVERED' && order.status !== 'COLLECTED') {
    await tx.financialLedgerEntry.create({ entryType: 'ORDER_SALE', amountPaise: order.merchantPayablePaise ... });
  }
  ```
  For delivery orders, merchants should only be permitted to update status up to `READY`. `DELIVERED` must strictly be confirmed by the delivery rider via Customer Delivery OTP. A rogue merchant can mark unfulfilled orders as delivered to extract cash payouts.

---

### VULN-009: Premature Financial Settlement of READY_FOR_PICKUP Orders
- **Severity:** `HIGH`
- **CVSS v3.1:** 7.5 (`CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:N`)
- **CWE:** CWE-840 (Business Logic Flaw)
- **Affected File:** `server/src/core/merchantSettlementEngine.ts` (Line 29)
- **Description:**
  `calculateSettlement` aggregates child orders with status:
  ```typescript
  status: { in: ['DELIVERED', 'COMPLETED', 'READY_FOR_PICKUP'] }
  ```
  Orders merely "Ready for pickup" that were never picked up or customer-received are settled and paid out. If customer cancels or merchant defaults, funds are already disbursed.

---

### VULN-010: Hardcoded Encryption Key & Static Salt for Bank Account Numbers at Rest
- **Severity:** `HIGH`
- **CVSS v3.1:** 7.4 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N`)
- **CWE:** CWE-321 (Use of Hard-coded Cryptographic Key), CWE-328 (Static Salt)
- **Affected File:** `server/src/core/bankVerificationService.ts` (Lines 4-6)
- **Description:**
  ```typescript
  const ENCRYPTION_SECRET = process.env.BANK_ENCRYPTION_SECRET || 'everything-local-indore-fintech-sec-2026';
  const KEY = crypto.scryptSync(ENCRYPTION_SECRET, 'salt-el-merchant', 32);
  ```
  If `BANK_ENCRYPTION_SECRET` is unset, bank account numbers are encrypted using the public fallback key. The salt is static and hardcoded.

---

### VULN-011: In-Memory Webhook Deduplication and Missing Signature Enforcement
- **Severity:** `HIGH`
- **CVSS v3.1:** 7.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N`)
- **CWE:** CWE-302 (Authentication Bypass by Assumed-Immutable Data), CWE-287 (Improper Authentication)
- **Affected File:** `server/src/core/paymentLifecycleEngine.ts` (Lines 54, 93)
- **Description:**
  `processedEventIds` is held in an in-memory `Set`. Across multi-worker or serverless edge restarts, deduplication state is lost, permitting duplicate webhook replays. Furthermore, if `webhookSecret` is undefined, signature checks are bypassed entirely.

---

### VULN-012: Concurrency TOCTOU Race Condition in Delivery Task Acceptance
- **Severity:** `MEDIUM`
- **CVSS v3.1:** 5.3 (`CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:L/A:L`)
- **CWE:** CWE-367 (Time-of-check Time-of-use Race Condition)
- **Affected File:** `server/src/routes/rider.ts` (Lines 185-204)
- **Description:**
  `findUnique` checks `task.status === 'AVAILABLE'`, followed by a separate `update`. Two riders accepting concurrently both pass the check; the second rider overwrites the first rider's assignment.

---

### VULN-013: Missing Rider Ownership Verification on Delivery Completion Handover
- **Severity:** `MEDIUM`
- **CVSS v3.1:** 6.5 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N`)
- **CWE:** CWE-285 (Improper Authorization)
- **Affected File:** `server/src/routes/rider.ts` (Lines 281-285)
- **Description:**
  In `POST /tasks/:id/deliver`, the endpoint verifies the customer OTP against `task.deliveryOtp`, but never verifies that `task.riderId` matches the currently authenticated rider. Any authenticated user with knowledge of the OTP can trigger completion on any rider's task.

---

### VULN-014: Widespread Broken Object Level Authorization (BOLA/IDOR) in Household Management
- **Severity:** `MEDIUM`
- **CVSS v3.1:** 6.5 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N`)
- **CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)
- **OWASP:** API1:2023 Broken Object Level Authorization
- **Affected File:** `server/src/routes/household.ts` (Lines 64, 89, 133, 147)
- **Description:**
  Endpoints `/items`, `/items/:id/toggle`, `/items/:id` (delete), and `/budget` update or delete records without validating that the authenticated user is an owner or member of the target household.

---

### VULN-015: Negative Quantity and Integer Underflow in Community Campaigns
- **Severity:** `MEDIUM`
- **CVSS v3.1:** 5.3 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N`)
- **CWE:** CWE-840 (Business Logic Error)
- **Affected File:** `server/src/routes/community.ts` (Lines 30-45)
- **Description:**
  `POST /api/community/campaigns/:id/pledge` accepts negative quantities, corrupting total pledged counters and resetting campaign targets.

---

### VULN-016: Missing Rate Limiting & Account Lockout on Authentication Endpoints
- **Severity:** `MEDIUM`
- **CVSS v3.1:** 5.3 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`)
- **CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)
- **OWASP:** API4:2023 Unrestricted Resource Consumption
- **Affected Files:** `server/src/routes/auth.ts` (Line 351) & `server/src/routes/deliveryPartner.ts` (Line 36)
- **Description:**
  Endpoints `/login` and `/auth/send-otp` lack IP and account-based rate limiting, enabling credential stuffing and OTP brute-forcing.

---

### VULN-017: Insecure Session Storage & Enabled Device Backup in Android Native App
- **Severity:** `MEDIUM`
- **CVSS v3.1:** 5.5 (`CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N`)
- **CWE:** CWE-312 (Cleartext Storage of Sensitive Information)
- **OWASP:** MASVS-STORAGE
- **Affected Files:**
  - `android-native/core/authentication/SessionManager.kt` (Line 13)
  - `android-native/customer/app/src/main/AndroidManifest.xml` (Line 10)
- **Description:**
  JWT tokens are persisted in unencrypted Preferences DataStore. With `android:allowBackup="true"`, any device backup extracts raw tokens via ADB.

---

### VULN-018: Missing HTTP Security Headers & Content Security Policy (CSP)
- **Severity:** `LOW`
- **CVSS v3.1:** 4.3 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N`)
- **CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers or Frames)
- **OWASP:** A05:2021 Security Misconfiguration
- **Affected Files:** `client/worker.ts` & `server/src/index.ts`
- **Description:**
  The frontend and backend workers omit CSP, HSTS, `X-Frame-Options`, and `X-Content-Type-Options`, increasing exposure to Clickjacking and MIME confusion attacks.

---

### VULN-019: Cloudflare Edge Runtime Incompatibility with Node.js Filesystem Writes
- **Severity:** `MEDIUM`
- **CVSS v3.1:** 5.3 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L`)
- **CWE:** CWE-754 (Improper Check for Unusual or Exceptional Conditions)
- **Affected Files:** `server/src/routes/merchantOnboarding.ts` (Line 1181) & `server/src/routes/pharmacy.ts` (Line 14)
- **Description:**
  `fs.writeFileSync` is called in merchant onboarding and pharmacy routes. When deployed to Cloudflare Workers, filesystem writes fail with unhandled exceptions. R2 object storage must be used uniformly.

---

### VULN-020: High/Critical Vulnerabilities in Transitive Node Dependencies
- **Severity:** `LOW / SUPPLY CHAIN`
- **CVSS v3.1:** 6.5 (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L`)
- **CWE:** CWE-1395 (Dependency on Vulnerable Third-Party Component)
- **Affected Files:** `package.json`, `package-lock.json`, `mobile/package.json`
- **Description:**
  `npm audit` identified 8 vulnerabilities in root (2 critical in `tinypool`, 5 high in `zod`, `deepmerge-ts`, `effect`), and 29 vulnerabilities in `mobile` (including `tar` path traversal and `xmldom` injection).
