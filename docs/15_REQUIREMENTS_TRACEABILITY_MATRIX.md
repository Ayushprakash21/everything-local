# 15. REQUIREMENTS TRACEABILITY MATRIX (RTM)
## Product: Everything Local

| Req ID | Description | Source Spec | Implementation Module | Verification Test | Status |
|---|---|---|---|---|---|
| REQ-001 | Integer Paise Calculations | BRD Sec 4, ADR-001 | `server/src/core/finance.ts` | `finance.test.ts` | IN PROGRESS |
| REQ-002 | 3.0 km Serviceability Radius | BRD Sec 2, SRS Sec 1 | `server/src/core/geospatial.ts` | `geospatial.test.ts` | IN PROGRESS |
| REQ-003 | Minimum Order Value ₹299 (29,900 paise) | BRD Sec 2, FRD Sec 2 | `server/src/core/orderValidation.ts` | `cart-order.test.ts` | IN PROGRESS |
| REQ-004 | Single-Store Cart Checkout | FRD Sec 2, ADR-003 | `server/src/routes/cart.ts` | `cart-order.test.ts` | IN PROGRESS |
| REQ-005 | Role-Based Access Control (Admin, Merchant, Customer) | SRS Sec 2, FRD Sec 1 | `server/src/middleware/auth.ts` | `auth-rbac.test.ts` | IN PROGRESS |
| REQ-006 | Merchant Tenant Isolation | Security Sec 1 | `server/src/middleware/tenant.ts` | `auth-rbac.test.ts` | IN PROGRESS |
| REQ-007 | 3 Fulfillment Modes (Pickup, Merchant, 3rd Party) | BRD Sec 4, ADR-004 | `server/src/core/deliveryAdapter.ts`| `delivery.test.ts` | IN PROGRESS |
| REQ-008 | Order State Machine & History | Workflows Sec 1 | `server/src/routes/orders.ts` | `order-lifecycle.test.ts`| IN PROGRESS |
| REQ-009 | Financial Snapshots & Ledger | Financial Model Sec 1| `server/src/core/ledger.ts` | `finance.test.ts` | IN PROGRESS |
| REQ-010 | Admin Controls & Merchant Moderation | FRD Sec 4 | `server/src/routes/admin.ts` | `admin.test.ts` | IN PROGRESS |
| REQ-011 | Customer Mobile-First Marketplace UI | UI/UX Spec Sec 2 | `client/src/views/customer/` | E2E & Component Tests | IN PROGRESS |
| REQ-012 | Merchant Storefront & Dispatch Console UI | UI/UX Spec Sec 3 | `client/src/views/merchant/` | E2E & Component Tests | IN PROGRESS |
| REQ-013 | Central Admin Operational Dashboard UI | UI/UX Spec Sec 4 | `client/src/views/admin/` | E2E & Component Tests | IN PROGRESS |
