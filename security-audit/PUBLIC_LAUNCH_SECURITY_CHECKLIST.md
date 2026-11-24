# Everything Local — Public Launch Security Checklist & Sign-Off Criteria

All criteria listed below must be validated before production DNS switch or public marketing launch.

---

## Mandatory Launch Gates (Zero-Tolerance)

- [ ] **P0.1: Client Price Tampering Eliminated**
  - Verify that `MultiStoreOrderEngine` ignores any client-supplied `unitPricePaise` and calculates subtotal strictly using database product records.
- [ ] **P0.2: Cloudflare Secret Injected & Fallback Removed**
  - Verify that `JWT_SECRET` is provisioned via `wrangler secret put JWT_SECRET` and fallback default strings are deleted from `server/src/worker.ts`.
- [ ] **P0.3: Master OTP Backdoor Removed**
  - Verify that `otp !== '123456'` bypass is deleted from `deliveryPartner.ts` and OTP verification requires authentic SMS gateway tokens.
- [ ] **P0.4: Prescription Path Traversal Fixed**
  - Verify that `storagePath` cannot traverse directories using `..` and only permitted safe filenames are loaded.
- [ ] **P1.1: Merchant Self-Verification Blocked**
  - Verify that `autoVerify` parameter cannot be passed in registration or store creation payloads.
- [ ] **P1.2: KYC Document IDOR Closed**
  - Verify that merchants cannot access another merchant's KYC files in Cloudflare Worker R2 storage.
- [ ] **P1.3: Product Mass Assignment Prevented**
  - Verify that `PUT /api/merchant/products/:id` validates fields against a partial Zod schema.
- [ ] **P1.4: Premature Settlements Prevented**
  - Verify that `READY_FOR_PICKUP` orders are not settled for payout until customer delivery confirmation.
- [ ] **P1.5: Production Bank Encryption Key Configured**
  - Verify that `BANK_ENCRYPTION_SECRET` is set in production environment variables with dynamic salts.
- [ ] **P2.1: Android Backup Flag Disabled**
  - Verify that `android:allowBackup="false"` is set in `AndroidManifest.xml` across all native apps.
- [ ] **P2.2: Rate Limiting Active on Auth**
  - Verify that rate limiting throttles excessive login and OTP attempts.
- [ ] **P3.1: Security Headers Configured on Frontend**
  - Verify that `everything-local-web` serves `Content-Security-Policy`, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.

---

## Sign-Off Matrix

| Role | Sign-Off Status | Signature / Date |
|---|---|---|
| **Principal Security Architect** | **REJECTED (Pre-Remediation)** | *Pending Remediation Review* |
| **Backend Engineering Lead** | *Pending* | — |
| **Mobile Lead** | *Pending* | — |
| **Platform Operations Lead** | *Pending* | — |
