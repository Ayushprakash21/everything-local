# 04 — MERCHANT JOURNEY QA REPORT
**Platform:** EveryBazaar Hyperlocal Commerce Platform  
**Branch:** `release/production-readiness`  

---

## 1. Test Overview

The Merchant Journey QA validates the full business lifecycle:
1. Self-Service Onboarding Wizard (4 Steps)
2. KYC Document Uploads & statutory data capture
3. Bank Account Configuration & Penny Drop simulation
4. Tenant Isolation & IDOR Protection (Merchants cannot access another store's records)
5. Product Management & Image Fallbacks
6. Order Processing: Acceptance, Preparation, Dispatch
7. Settlement Reconciliation & Payouts

---

## 2. Test Execution Log

| Test ID | Feature | Preconditions | Steps | Expected Result | Actual Result | Status | Evidence Commit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MERCH-01** | Step 1 Owner Info | Clean user account | `POST /api/merchant-onboarding/save-step` (step 1) | Draft application created with unique `EL-MAPP-` reference | Reference generated, status `DRAFT` | **PASS** | `7bdddec` |
| **TC-MERCH-02** | Step 2 Statutory & GST | Application exists | `POST /api/merchant-onboarding/save-step` (step 2) with GSTIN/PAN | Business details saved with validation of PAN/GST format | Saved successfully | **PASS** | `7bdddec` |
| **TC-MERCH-03** | Step 3 Store & Location | Step 2 completed | Submit Indore address, lat/lng, and operating hours | Location geocoded and saved with 3.0km service radius | Valid store details stored | **PASS** | `7bdddec` |
| **TC-MERCH-04** | Pharmacy Category Licensing | Merchant selects Pharmacy | Attempt submit without Drug License number | Rejected with statutory requirement error | Rejected with mandatory license error | **PASS** | `7bdddec` |
| **TC-MERCH-05** | Final Application Submission | All steps completed | Submit application for review | Status transitions to `SUBMITTED`, user notified | Status is `SUBMITTED`, visible in admin queue | **PASS** | `7bdddec` |
| **TC-MERCH-06** | Admin Approval & Store Activation | Admin role token | Admin approves merchant application | User role elevated to `MERCHANT`, store `isVerified: true`, draft catalogue published | Role elevated, store active, products published | **PASS** | `7bdddec` |
| **TC-MERCH-07** | Tenant IDOR Protection | Merchant A token | Merchant A attempts to fetch or update Merchant B's orders/products | Request rejected with HTTP 403 Forbidden | Blocked by tenant middleware | **PASS** | `0630fb0` |
| **TC-MERCH-08** | Product Creation Image Resolution | Merchant adds product without photo | `POST /api/merchant/products` with `imageUrl: null` | `resolveProductImage` assigns matching WebP image | Realistic WebP image populated automatically | **PASS** | `7bdddec` |
| **TC-MERCH-09** | T+1 Settlement Calculation | Completed delivered orders exist | Run `MerchantSettlementEngine.calculateSettlement` | Order GMV minus platform commission equals net payout | Exact ledger reconciliation matches | **PASS** | `7bdddec` |

---

## 3. Journey Verdict
**Verdict:** **PASS** — Verified across `tests/merchant-onboarding.test.ts`, `tests/merchant-kyc-bank-payout.test.ts`, and `security-remediation/tests/p1-high-remediation.test.ts`.
