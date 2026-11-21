# 03. SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Product: Everything Local

---

## 1. System Architecture & Tech Stack Selection
- **Runtime Environment:** Node.js v24 LTS + TypeScript.
- **Backend Architecture:** Modular Express / REST API with strict domain separation, middleware pipeline for JWT auth, RBAC, tenant isolation, and validation via Zod schemas.
- **Frontend Architecture:** Single Page / Responsive Multi-portal Web App (React 18 + Vite + Tailwind CSS + Lucide Icons), supporting three views:
  1. `/` - Customer Marketplace (Mobile-first shopping interface)
  2. `/merchant` - Merchant Console (Simplified retailer dashboard)
  3. `/admin` - Central Ops Dashboard (Platform governance & ledger)
- **Database Layer:** SQLite with WAL mode + Prisma ORM (providing 100% portable relational transactions, foreign keys, and indexes for local dev & automated CI testing, with zero-friction migration path to PostgreSQL/PostGIS in production).
- **Unit & Integration Testing:** Vitest / Node test runner with in-memory / test SQLite databases and supertest.

---

## 2. Non-Functional Requirements
- **NFR-PERF-001 Latency:** API response time < 150ms for catalogue queries within local market.
- **NFR-SEC-001 Authentication:** Salted bcrypt hashing for passwords; signed JSON Web Tokens (JWT) with expiry and role verification.
- **NFR-SEC-002 Tenant Isolation:** Merchant endpoints strictly enforce `storeId` ownership derived from token claims, blocking cross-store data leakage.
- **NFR-FIN-001 Integer Arithmetic:** Zero floating-point operations for money. All monetary amounts stored and computed in integer paise.
- **NFR-AUD-001 Immutability:** Financial snapshots attached to orders cannot be updated once created; ledger entries are append-only.
- **NFR-REL-001 Concurrency Control:** Inventory decrement operations executed within serializable database transactions to prevent overselling.
