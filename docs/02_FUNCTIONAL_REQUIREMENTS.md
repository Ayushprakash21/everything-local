# 02. FUNCTIONAL REQUIREMENTS DOCUMENT (FRD)
## Product: Everything Local

---

## 1. Actor Profiles & Roles
- **Customer (CUST):** Discovers stores within 3 km, adds products from a single store, selects pickup or delivery, pays, tracks orders, reviews stores.
- **Merchant / Store Owner (MERCH):** Registers store, configures operating hours, manages catalogue and real-time inventory, accepts/rejects orders, marks ready for pickup/out for delivery, views ledger and commission statements.
- **Platform Admin (ADMIN):** Approves/suspends merchants, configures commission rates, monitors live orders, resolves delivery exceptions, oversees payments, manages refunds, views platform audit log.
- **System / Automated Engine (SYS):** Evaluates 3 km haversine serviceability, enforces ₹299 MOV, snapshots order financials, calculates commission in integer paise, generates settlement statements.

---

## 2. Customer Application Requirements
- **FR-CUST-001 Location & Serviceability:** Customer sets location (GPS or selected Indore neighborhood coordinates). System filters stores whose `serviceRadiusKm` covers the customer.
- **FR-CUST-002 Catalogue & Discovery:** Browse by category (Grocery, Produce, Bakery, Dairy, Electronics, Stationery, Beauty, Fashion) or search keywords.
- **FR-CUST-003 Storefront Page:** Displays store details, rating, distance (km), estimated prep time, operating hours, delivery vs pickup flags.
- **FR-CUST-004 Cart Management:** Only items from one store allowed at a time. If user adds from another store, prompt confirmation to clear cart.
- **FR-CUST-005 Minimum Order Value:** System enforces minimum order value (default 29,900 paise = ₹299). If subtotal < ₹299, checkout button is disabled with shortfall amount displayed.
- **FR-CUST-006 Fulfillment Selection:** User chooses between `PICKUP` (₹0 fee) and `DELIVERY` (dynamic or fixed fee based on distance/configuration).
- **FR-CUST-007 Order Placement & Idempotency:** Orders placed with unique client idempotency key to prevent double charging.
- **FR-CUST-008 Order Tracking:** Real-time state updates: `PLACED` -> `ACCEPTED` -> `PREPARING` -> `READY_FOR_PICKUP` / `OUT_FOR_DELIVERY` -> `DELIVERED` / `COLLECTED`.
- **FR-CUST-009 Order History & Invoices:** View past orders, immutable itemized receipt, download summary.

---

## 3. Merchant Application Requirements
- **FR-MERCH-001 Store Onboarding:** Input store name, category, legal trade name, address, coordinates (lat/lng), contact info, operating hours, and service radius.
- **FR-MERCH-002 Verification State:** Merchants start as `PENDING_VERIFICATION` until verified by Admin.
- **FR-MERCH-003 Product & Inventory Management:** Add/edit products (SKU, title, description, category, MRP paise, selling price paise, stock count, low stock alert, image URL, availability toggle).
- **FR-MERCH-004 Order Dispatch Console:** Real-time incoming order sound/alert, accept/reject within timer, mark preparation stages, handle handover.
- **FR-MERCH-005 Financial Statements:** Daily/weekly commission ledger: Gross sales, commission withheld, net payable, settlement status.

---

## 4. Admin Application Requirements
- **FR-ADMIN-001 Operational Overview:** Platform metrics: GMV, Net Revenue, Active Stores, Active Orders, Refund rates.
- **FR-ADMIN-002 Merchant Verification & Moderation:** Review submitted KYC/store details, approve, reject, or suspend stores.
- **FR-ADMIN-003 Commission Rule Config:** Set default commission percentage (e.g., 3.5%) or store-specific overrides.
- **FR-ADMIN-004 Financial Ledger & Settlement:** View all financial ledger rows, initiate and reconcile settlements.
- **FR-ADMIN-005 Refund Management:** Approve or decline customer refund requests with immutable accounting entries.
- **FR-ADMIN-006 Audit Trail:** Full audit log of admin and merchant configuration adjustments.
