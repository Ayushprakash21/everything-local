# 10. TEST AND ACCEPTANCE PLAN
## Product: Everything Local

---

## 1. Automated Test Scope & Strategy
All critical business rules and financial formulas must be verified through automated unit and integration tests before deployment.

### Core Test Suites:
1. **Financial Engine Tests (`finance.test.ts`):**
   - Correct conversion of rupee values to integer paise.
   - Exact 3.5% commission calculations without floating point drift.
   - Separation of item subtotal from delivery fee and taxes.
   - Merchant net payable calculations.
   - Refund ledger debit adjustments.
2. **Geospatial & Serviceability Tests (`geospatial.test.ts`):**
   - Haversine distance accuracy between Indore landmarks (e.g. Palasia to Rajwada ~3.2km; Vijay Nagar to Palasia ~4.1km).
   - Strict 3.0 km serviceability cutoff: stores at 2.9 km are serviceable; stores at 3.1 km are marked out-of-range for delivery.
   - Customer pickup allowed even when beyond delivery radius.
3. **Cart & Order Validation Tests (`cart-order.test.ts`):**
   - Single-store enforcement: adding an item from Store B when Cart has Store A items triggers conflict error.
   - Minimum Order Value enforcement: order with subtotal 28,000 paise (₹280) fails checkout against 29,900 paise (₹299) rule.
   - Real-time inventory deduction and rollback on cancellation.
   - Idempotency key handling to prevent duplicate orders.
4. **Auth, RBAC & Tenant Isolation Tests (`auth-rbac.test.ts`):**
   - Merchant token cannot access or modify another merchant's store products or orders.
   - Customer token cannot view another customer's orders or admin ledger.
   - Unauthenticated requests rejected with 401.

---

## 2. Acceptance Criteria Checklist
- [ ] Authentication passes for Customer, Merchant, Admin.
- [ ] Merchant can create store, add product with price and stock.
- [ ] Customer discovers store within 3 km of coordinates in Indore.
- [ ] Cart prevents multi-store items.
- [ ] Checkout enforces ₹299 minimum order.
- [ ] Pickup fulfillment charges ₹0 delivery fee.
- [ ] Merchant can accept order, progress status to preparing and ready.
- [ ] Financial snapshot correctly records subtotal, commission, and merchant payable in paise.
- [ ] Admin can view platform metrics and audit ledger.
