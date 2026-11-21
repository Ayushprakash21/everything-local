# 14. ARCHITECTURE DECISION RECORDS (ADR)
## Product: Everything Local

---

## ADR-001: Integer Paise for All Monetary Values
- **Status:** ACCEPTED
- **Context:** Floating-point arithmetic in JavaScript/SQL causes precision loss (e.g., `0.1 + 0.2 !== 0.3`). This is unacceptable for commercial transactions, tax calculations, and merchant payouts.
- **Decision:** Every monetary amount in the database, API payloads, and internal services will be stored and calculated as an integer representing paise (1 INR = 100 paise). The UI formats this to `₹(paise / 100).toFixed(2)` for display only.
- **Consequences:** Eliminates rounding discrepancy bugs completely.

---

## ADR-002: SQLite with Prisma ORM for Dev & Test, Seamless Postgres for Production
- **Status:** ACCEPTED
- **Context:** Fast, reproducible, self-contained local development and automated CI testing without external daemon dependencies.
- **Decision:** Use Prisma ORM with SQLite for local execution and automated testing. All queries use standard relational paradigms (foreign keys, transactions, indexes) easily portable to PostgreSQL/PostGIS in production environments.
- **Consequences:** Tests run rapidly in-memory or against local file DB; zero barrier to development on Windows.

---

## ADR-003: Single-Store Checkout Constraint in MVP
- **Status:** ACCEPTED
- **Context:** Cross-store multi-cart checkout introduces complex multi-merchant dispatch synchronization, multiple delivery fee splits, and confusing customer pickup logistics.
- **Decision:** Restrict shopping cart and checkout to items from a single merchant store.
- **Consequences:** Simplifies merchant dispatch, inventory reservation, and delivery logistics for Indore pilot.

---

## ADR-004: Delivery Adapter Pattern for 3 Fulfillment Modes
- **Status:** ACCEPTED
- **Context:** The platform must support Customer Pickup, Merchant-Managed delivery, and Third-Party delivery (e.g. Porter) without hardcoding third-party APIs.
- **Decision:** Implement a `DeliveryService` adapter interface with clear strategy implementations (`PickupStrategy`, `MerchantDeliveryStrategy`, `ThirdPartyDeliveryStrategy`).
- **Consequences:** Allows instant fallback to merchant delivery or manual dispatch if external logistics APIs are not configured or fail.
