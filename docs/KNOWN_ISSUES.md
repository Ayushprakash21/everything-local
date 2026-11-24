# Everything Local — Known Issues & Operational Blockers
**Release Version:** 2.0 (Pilot Candidate)  
**Target Delivery Date:** Sunday, 29 November 2026  
**Audited Branch:** `repair/v2.0-master-architecture`  

---

## 1. Summary of Issues

| ID | Issue Description | Severity | Impact | Mitigation / Status |
| :---: | :--- | :---: | :---: | :--- |
| **KI-01** | `PORTER_API_KEY` unset in non-production environments | Medium | Third-party courier API calls are not dispatched to Porter | **Mitigated:** System honestly returns `dispatchStatus: 'MANUAL_PENDING'`, queuing orders for in-house fleet dispatch rather than generating synthetic tracking IDs. |
| **KI-02** | Razorpay Live Production Keys Required for Real Money | Medium | Transactions currently validated via cryptographic HMAC in test mode | **Mitigated:** Cryptographic signature verification, webhook deduplication, and state lifecycle are fully implemented and verified. Production keys required prior to live customer debiting. |
| **KI-03** | Vite Client Bundle Size Advisory (>500 kB) | Low | First-page load optimization | **Mitigated:** Assets build cleanly without compilation errors. Recommended code-splitting via `build.rollupOptions.output.manualChunks` before nationwide scaling. |
| **KI-04** | Node Typeless `postcss.config.js` Reparsing Warning | Low | Minor terminal log noise during build/test start | Reparses automatically as ES module. Can be eliminated by adding `"type": "module"` or renaming to `.mjs`. Zero runtime impact. |

---

## 2. Detailed Issue Explanations

### KI-01: Live Porter API Credentials
- **Root Cause:** Third-party logistics API credentials for Porter Open API (`PORTER_API_KEY`) are kept confidential and are not committed into source control.
- **Current Behavior:** When the key is missing, `DeliveryServiceAdapter` logs a clear operational notification and sets `dispatchStatus: 'MANUAL_PENDING'` on the `DeliveryTask`.
- **Operational Action for Launch:**
  1. Register for Porter Developer Portal API access for Indore hub.
  2. Add `PORTER_API_KEY` to production environment secrets.
  3. No application code changes required; the adapter dynamically switches to live HTTP dispatch when the key is populated.

### KI-02: Live Payment Gateway Configuration
- **Root Cause:** Real customer funds require active Merchant Category Codes (MCC) and GSTIN registration with Razorpay India.
- **Current Behavior:** `PaymentLifecycleEngine` validates full cryptographic HMAC-SHA256 signatures and idempotently processes webhooks using test credentials.
- **Operational Action for Launch:**
  1. Activate Razorpay live production merchant account for Everything Local.
  2. Populate `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
  3. Register webhook URL `https://api.everythinglocal.in/api/payments/razorpay/webhook` with the webhook secret.

### KI-03: Client Bundle Code-Splitting Advisory
- **Root Cause:** Vite emitted an advisory: `dist/client/assets/index-DY8mhV5Y.js (567.65 kB │ gzip: 131.17 kB)` is larger than 500 kB.
- **Impact:** Initial load time on 2G/slow 3G mobile connections.
- **Mitigation:**
  - Modern broadband and 4G/5G load 131 kB gzipped in $<150$ms.
  - For Phase 2 production scaling, implement React `lazy()` imports for Admin and Merchant portals.

---

## 3. Resolution Plan & Pilot Signoff
None of the above issues block a controlled Indore merchant pilot using in-house delivery partners and test/cash-on-delivery payments. All core transactional, cryptographic, and accounting boundaries are intact and verified.
