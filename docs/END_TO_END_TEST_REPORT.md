# Everything Local — End-to-End Scenario Test Report
**Release Version:** 2.0 (Pilot Candidate)  
**Target Delivery Date:** Sunday, 29 November 2026  
**Test Suite:** `tests/e2e-scenarios.test.ts` & Complete Suite (`21 Test Files / 173 Tests`)  
**Execution Timestamp:** 2026-11-23 23:35:15 IST  
**Environment:** Node.js v20 / SQLite (`prisma/dev.db`) / Vite 6.4 / Vitest 3.2  

---

## 1. Executive Summary

This report documents the rigorous verification of the **Four Application Portals** (Customer, Merchant, Rider, Admin) and **Twelve Critical Operational Scenarios** executed across the Everything Local codebase.

- **Total Test Suites Executed:** 21 files
- **Total Test Cases Passed:** 173 / 173 (100% pass rate)
- **Total Test Failures:** 0
- **Database Consistency:** Verified after each transaction (stock integrity, ledger balancing $\sum \text{Debits} \equiv \sum \text{Credits}$, parent-child order state).

---

## 2. Four Application Portals Verification

### 2.1 Customer Application
- **Registration & Authentication:** Secure customer login, password hashing via bcrypt (salt rounds 10), JWT bearer token generation.
- **Location & Serviceability:** Dynamic address selection, live GPS coordinate ingestion in `CartCheckoutDrawer.tsx`, 4-tier delivery feasibility checking (`EXPRESS_20`, `PRIORITY_40`, `STANDARD_60`, `SCHEDULED_120`).
- **Store Discovery & Product Search:** Multi-category storefront queries, keyword and barcode lookup, genuine social proof reviews (unreviewed stores display `"New store"`).
- **Multi-Store Unified Cart:** Shopping across unlimited stores without cart clearing or store-lockout alerts; persistent database cart storage.
- **Per-Merchant Minimum Order:** Independent MOV validation (`minOrderValuePaise` on `Store` model).
- **Checkout & Payment:** Unified `ParentOrder` generation, Razorpay cryptographic signature verification, test mode COD pathway.
- **Order Tracking & Cancellation:** Live status polling, merchant preparation progress, delivery OTP display.

### 2.2 Merchant Portal
- **Registration & Onboarding:** `/api/auth/register-merchant` supporting business name, locality, category, and automatic store profile creation.
- **Store & Multi-Branch Management:** Multi-store tenancy middleware (`requireMerchantTenant`) allowing one merchant owner to operate multiple stores; access strictly scoped via `x-store-id` header with HTTP 403 authorization guard.
- **Product Catalogue & Pricing:** Price updates, stock management, barcode catalogue queries.
- **Order Lifecycle Management:** Independent acceptance (`ACCEPTED`, `PREPARING`, `READY_FOR_PICKUP`) or rejection with statutory reason.
- **Settlement Visibility:** Automated deduction of platform commission, item refunds, and delivery pass-through; transparent net payable ledger records.

### 2.3 Delivery Partner (Rider) Application
- **Authentication & Availability:** Rider profile verification, status toggling (`isOnline: true/false`).
- **Task Assignment:** Real-time multi-stop task retrieval from `DeliveryTask` pool.
- **Store Arrival & Pickup Handover:** Rider marks arrived at store (`AT_STORE`), verifies 4-digit pickup OTP with merchant, child order transitions to `PICKED_UP`.
- **Customer Handover via OTP:** Delivery completed only upon entering verified customer delivery OTP (`DELIVERED`).
- **Earnings & Ledger:** Automatic transaction crediting rider base payout and multi-store additional pickup stop fees (`RiderEarningLedger`).

### 2.4 Administrative Console
- **Platform Metrics Overview:** Real-time GMV calculation, completed orders count, platform net revenue, active verified stores.
- **Merchant Onboarding Approval:** One-click store approval and verification toggle (`isVerified: true`).
- **Customer, Rider & Exception Management:** Unassigned delivery monitoring, rider profile management.
- **Financial Settlements & Audit Logs:** Super-admin bootstrap locking (`/api/auth/bootstrap-admin`), tamper-evident `AuditLog` trail.

---

## 3. End-to-End 12 Scenario Verification Matrix

| # | Scenario Description | Core Engine / Route Tested | Expected Outcome | Actual Verified Result | Status |
| :-: | :--- | :--- | :--- | :--- | :---: |
| **1** | Customer orders from one merchant | `MultiStoreOrderEngine.checkout` | 1 ParentOrder, 1 ChildOrder, stock decremented, 1 DeliveryTask | ParentOrder + 1 ChildOrder created; stock decremented from 100 to 98; OTP generated | **PASSED** |
| **2** | Customer orders from 3 merchants in 1 cart | `MultiStoreOrderEngine.checkout` | 1 ParentOrder, 3 ChildOrders, 3 DeliveryTasks, multi-stop routing | 1 ParentOrder + 3 ChildOrders created; 3 independent delivery tasks with OTPs | **PASSED** |
| **3** | Merchant B rejects order slice | `handlePartialMerchantRejection` | Store B REJECTED; Store A INTACT; Store B stock restored; refund calculated | Store B marked REJECTED; Store A remains PENDING_ACCEPTANCE; stock restored +2; Parent is PARTIALLY_FULFILLED | **PASSED** |
| **4** | Out of stock during checkout | `MultiStoreOrderEngine.checkout` | Order transaction aborted; zero partial records created | HTTP 400 Insufficient stock returned; zero orders created; DB state clean | **PASSED** |
| **5** | Product price changes before payment | `/api/customer/orders/quote` | Quote snapshot returns validUntil with 15-min guarantee | Returned `pricingVersion: '2.0'`, `validUntil` (+15 min), item subtotal validated | **PASSED** |
| **6** | Payment fails or is abandoned | `PaymentLifecycleEngine` | Webhook payment.failed records status FAILED; order remains unfulfilled | `status: 'FAILED'`, order remains unconfirmed, zero stock leakage | **PASSED** |
| **7** | Duplicate payment webhook | `PaymentLifecycleEngine` | First delivery processed; second marked duplicate idempotently | First webhook processed; second delivery returns `isDuplicate: true` with zero duplicate ledger entries | **PASSED** |
| **8** | Customer cancellation & partial refund | `FinancialEngine.calculateItemRefund` | Post-dispatch customer cancellation refunds items but retains delivery fee | Customer refund = ₹450 (items only); merchant-fault refund = ₹500 (items + delivery) | **PASSED** |
| **9** | Rider fails to accept task | `prisma.deliveryTask.update` | Task expires or cancels; queued for manual reassignment | Task status updated to `CANCELLED` / manual reassignment without order drop | **PASSED** |
| **10** | Merchant has multiple branches | `requireMerchantTenant` | `x-store-id` allows authorized branch access; rejects unauthorized store (HTTP 403) | Merchant access to owned store returns 200; access to unauthorized store returns HTTP 403 | **PASSED** |
| **11** | Customer outside delivery radius | `DeliveryPriorityEngine.calculateAllTiers` | Distant location flagged unserviceable | Ujjain coordinates (~55 km) rejected with `isServiceable: false` | **PASSED** |
| **12** | Race condition on final unit (Stock = 1) | `MultiStoreOrderEngine.checkout` (Concurrent) | Exactly 1 checkout succeeds; 1 fails; stock = 0 (never negative) | Exactly 1 winner (HTTP 201), 1 rejected (HTTP 400 Insufficient stock); final stock = 0 | **PASSED** |

---

## 4. Test Execution Evidence

```
 RUN  v3.2.7 D:/ANtigravity/Local Supply app

 ✓ tests/cart-quantity-controls.test.ts (10 tests) 2189ms
 ✓ tests/pharmacy-prescription.test.ts (16 tests) 4921ms
 ✓ tests/multi-store-cart.test.ts (8 tests) 4228ms
 ✓ tests/api-integration.test.ts (7 tests) 2254ms
 ✓ tests/version1-system.test.ts (18 tests) 3136ms
 ✓ tests/e2e-scenarios.test.ts (12 tests) 3649ms
 ✓ tests/services-booking.test.ts (10 tests) 2895ms
 ✓ tests/merchant-portal.test.ts (10 tests) 1184ms
 ✓ tests/catalogue.test.ts (4 tests) 730ms
 ✓ tests/advertising.test.ts (4 tests) 589ms
 ✓ tests/security.test.ts (10 tests) 396ms
 ✓ tests/upload.test.ts (4 tests) 75ms
 ✓ tests/location-engine.test.ts (11 tests) 102ms
 ✓ mobile/tests/mobile-navigation-state.test.ts (4 tests) 24ms
 ✓ tests/responsive-ui.test.ts (23 tests) 13ms
 ✓ tests/ledger-payment.test.ts (7 tests) 7ms
 ✓ tests/finance.test.ts (6 tests) 4ms
 ✓ tests/geospatial.test.ts (2 tests) 4ms
 ✓ tests/delivery.test.ts (4 tests) 5ms
 ✓ mobile/tests/mobile-loyalty.test.ts (2 tests) 3ms
 ✓ mobile/tests/mobile-household-ai.test.ts (1 test) 3ms

 Test Files  21 passed (21)
      Tests  173 passed (173)
   Duration  40.48s
```

---

## 5. Conclusion
The four application portals and twelve critical operational failure scenarios are verified, resilient under concurrency, and structurally sound for pilot deployment.
