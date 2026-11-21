# 05. SYSTEM ARCHITECTURE
## Product: Everything Local

---

## 1. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                                CLIENT APPLICATIONS                                 |
|                                                                                   |
|  [ Customer Mobile Web App ]     [ Merchant Web Console ]    [ Admin Web Portal ] |
|  - Discovery, Search, Cart       - Inventory, Catalog        - Operations, Ledger |
|  - Checkout, Order Tracking      - Order Dispatch Console    - Approvals, Audit   |
+-----------------------------------------------------------------------------------+
                                          |
                                    HTTPS / JSON
                                          v
+-----------------------------------------------------------------------------------+
|                             API GATEWAY & MIDDLEWARE                              |
|                                                                                   |
|  - CORS & Rate Limiter           - JWT Auth & Session Mgr    - Zod Validation     |
|  - Tenant Isolation Enforcer     - Request Idempotency Key   - Audit Log Tracing  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                              CORE BUSINESS SERVICES                               |
|                                                                                   |
|  +------------------------+  +------------------------+  +----------------------+ |
|  | Geospatial Engine      |  | Inventory & Cart Svc   |  | Order State Engine   | |
|  | - Haversine 3km Check  |  | - Single-store check   |  | - State Transitions  | |
|  | - Coordinate Distance  |  | - Concurrency reserve  |  | - Event notifications| |
|  +------------------------+  +------------------------+  +----------------------+ |
|  +------------------------+  +------------------------+  +----------------------+ |
|  | Financial Engine       |  | Delivery Adapter       |  | Auth & RBAC Service  | |
|  | - Integer paise engine |  | - Pickup / Merchant    |  | - Password hashing   | |
|  | - Commission calc      |  | - 3rd Party Provider   |  | - Multi-role tokens  | |
|  | - Ledger entries       |  |   (Porter Adapter)     |  | - Tenant isolation   | |
|  +------------------------+  +------------------------+  +----------------------+ |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                PERSISTENCE LAYER                                  |
|                                                                                   |
|  - SQLite (WAL mode) / PostgreSQL relational schema via Prisma ORM                 |
|  - Foreign keys, unique constraints, compound indexes, serializable transactions  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Decoupling
1. **Financial Engine:** Completely isolated pure functional service that takes order line items, discounts, delivery mode, and merchant commission rates, returning a validated, immutable `OrderFinancialSnapshot` in integer paise.
2. **Geospatial Service:** Encapsulates the Haversine formula to compute great-circle distance between `(storeLat, storeLng)` and `(customerLat, customerLng)` in kilometers. Enforces the strict initial 3.0 km serviceability rule.
3. **Delivery Adapter Interface:** Standardizes dispatch calls across:
   - `PICKUP` (Self-service, fee = 0)
   - `MERCHANT_MANAGED` (Merchant rider/staff, configurable delivery fee)
   - `PLATFORM_THIRD_PARTY` (Extensible interface for Porter/Dunzo with graceful manual fallback when external API keys are unavailable).
