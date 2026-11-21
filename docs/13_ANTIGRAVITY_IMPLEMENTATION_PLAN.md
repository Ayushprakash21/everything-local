# 13. ANTIGRAVITY IMPLEMENTATION PLAN
## Product: Everything Local

---

## 1. Phased Delivery Roadmap

### Phase 0: Discovery & Setup (Immediate)
- Inspect environment and set up source-of-truth documentation.
- Establish project monorepo / directory structure.
- Configure TypeScript, database schema, Prisma ORM, and test runner.

### Phase 1: Foundation (Core Backend, Auth & DB)
- Set up Prisma schema with relational models: User, Store, Product, Cart, Order, FinancialLedgerEntry, PlatformSetting.
- Implement server-side JWT authentication with password hashing (bcrypt).
- Build Role-Based Access Control (`CUSTOMER`, `MERCHANT`, `ADMIN`) and merchant tenant isolation middleware.
- Implement pure Financial Engine (integer paise calculations, commissions, refunds, snapshots).
- Implement Geospatial Engine (haversine 3km validation).
- Automated tests verifying auth, roles, financial formulas, and geospatial boundary calculations.

### Phase 2: Merchant Ecosystem
- Merchant onboarding & store setup API.
- Product catalogue management (CRUD, price in paise, stock, availability toggle).
- Store operating status (open/closed) and service radius management.
- Merchant frontend console for catalogue and real-time inventory management.

### Phase 3: Customer Marketplace
- Hyperlocal store discovery based on Indore coordinates (3 km radius filter).
- Storefront catalogue browsing, category filter, and product search.
- Shopping cart with single-store restriction and server-side ₹299 minimum order validation.
- Responsive mobile-first customer storefront UI.

### Phase 4: Checkout, Orders & Fulfillment
- Order quote calculation with pickup vs delivery options.
- Order placement with idempotency key and atomic inventory reservation.
- Merchant order dispatch console (Accept/Reject, Preparing, Ready for pickup / Out for delivery, Completed).
- Customer real-time order tracking and invoice receipt.

### Phase 5: Admin Operations & Financial Reconciliation
- Admin operational dashboard (GMV, platform commission, active stores).
- Merchant approval/suspension workflow.
- Financial double-entry ledger feed & commission statements.
- Refund processing workflow with ledger debit adjustments.

### Phase 6: Pilot Hardening & Verification
- End-to-end integration tests covering customer -> merchant -> admin journey.
- Verification of 100% test coverage for core business constraints (3km, ₹299, single-store, integer paise).
- Seed data for realistic pilot stores in Indore (Palasia, Vijay Nagar).
