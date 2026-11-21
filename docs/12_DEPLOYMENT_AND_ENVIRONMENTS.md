# 12. DEPLOYMENT AND ENVIRONMENTS
## Product: Everything Local

---

## 1. Environments Overview
- **Local Development (`development`):**
  - Database: SQLite with WAL mode (`prisma/dev.db`)
  - Server: Express API on `http://localhost:4000`
  - Client: Vite React on `http://localhost:5173`
- **Testing & CI (`test`):**
  - In-memory SQLite (`:memory:`) or dedicated test file (`prisma/test.db`)
  - Automated test runner with zero external daemon requirements
- **Production (`production`):**
  - Relational Database: PostgreSQL with PostGIS extension (e.g. Supabase, AWS RDS, Neon)
  - Backend: Containerized Node.js (Docker / Cloud Run / VPS)
  - Frontend: CDN edge hosting (Vercel / Cloudflare Pages / Nginx static)

---

## 2. Environment Configuration Matrix
| Variable | Description | Local Default | Production Target |
|---|---|---|---|
| `PORT` | API Port | `4000` | `8080` / `4000` |
| `NODE_ENV` | Runtime stage | `development` | `production` |
| `DATABASE_URL` | Prisma DB connection string | `file:./dev.db` | `postgresql://...` |
| `JWT_SECRET` | Secret for token signing | Local test secret | High-entropy secret |
| `MIN_ORDER_VALUE_PAISE` | Global minimum order in paise | `29900` (₹299) | `29900` |
| `DEFAULT_COMMISSION_PCT`| Baseline platform commission | `3.5` | `3.5` |
| `DEFAULT_RADIUS_KM` | Service radius in km | `3.0` | `3.0` |
