# 03 — CUSTOMER JOURNEY QA REPORT
**Platform:** EveryBazaar Hyperlocal Commerce Platform  
**Branch:** `release/production-readiness`  

---

## 1. Test Overview

The Customer Journey QA validates the entire end-to-end user experience from first touch to delivery confirmation:
1. Account Creation & Auth
2. Location Detection & Hyperlocal Store Discovery
3. Category Navigation (20 Departments)
4. Multi-Merchant Cart Aggregation
5. Stepper Quantity Mutation & Real-Time Recalculation
6. Unified Checkout with MOV Validation (₹299 minimum)
7. Order Placement & Child Order Split
8. Real-Time Tracking & Delivery OTP Verification

---

## 2. Test Execution Log

| Test ID | Feature | Preconditions | Steps | Expected Result | Actual Result | Status | Evidence Commit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-CUST-01** | Customer Registration | Clean phone/email | `POST /api/auth/register` with valid phone & password | User created in DB with role `CUSTOMER`, password hashed with bcrypt, JWT issued | Returned HTTP 201, token generated, password not exposed | **PASS** | `7bdddec` |
| **TC-CUST-02** | Geofence Serviceability | User sets coordinates (Indore 22.7533, 75.8937) | `POST /api/location/serviceability` | Returns service status `SERVICEABLE` with active stores count >= 1 | Status `SERVICEABLE`, returned 25 operational stores | **PASS** | `7bdddec` |
| **TC-CUST-03** | 20-Category Discovery | System seeded | `GET /api/categories/homepage` | Returns 20 primary categories with SVGs and child subcategories | 20 categories returned with valid SVG image paths | **PASS** | `7bdddec` |
| **TC-CUST-04** | Multi-Store Cart Assembly | Products from Store A and Store B available | Add item from Store A, then item from Store B | Cart contains items from both stores with independent store groupings | Items retained without single-store constraint error | **PASS** | `7bdddec` |
| **TC-CUST-05** | Quantity Stepper Controls | Cart has 1 item | Tap [+] to increment, tap [-] to decrement | Quantity increases to 2, subtotal doubles; decrementing from 1 removes item | Line item updated dynamically, removed when quantity reaches 0 | **PASS** | `7bdddec` |
| **TC-CUST-06** | Minimum Order Value (MOV) Gate | Cart total = ₹150 (< ₹299 threshold) | Attempt `POST /api/customer/orders` | Checkout rejected with HTTP 400 stating ₹299 minimum threshold | Blocked with descriptive MOV error message | **PASS** | `7bdddec` |
| **TC-CUST-07** | Atomic Parent-Child Order Split | Cart has Store A (₹300) and Store B (₹400) | Submit checkout with address and payment method | 1 `ParentOrder` and 2 `MerchantChildOrder` records created in single DB transaction | Atomic transaction succeeded with matching parent total (₹700) | **PASS** | `7bdddec` |
| **TC-CUST-08** | Customer Delivery OTP Display | Order in `OUT_FOR_DELIVERY` | Customer views tracking screen | 4-digit alphanumeric customer OTP displayed clearly for rider verification | Valid OTP displayed, verified on rider handover | **PASS** | `7bdddec` |

---

## 3. Journey Verdict
**Verdict:** **PASS** — All 8 critical customer journey test scenarios verified and passing automated regression suites (`tests/multi-store-cart.test.ts`, `tests/cart-quantity-controls.test.ts`, `tests/api-integration.test.ts`).
