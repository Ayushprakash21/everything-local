# 11. SECURITY, PRIVACY AND COMPLIANCE
## Product: Everything Local

---

## 1. Security Architecture & Threat Model
- **Authentication:** Passwords hashed with bcrypt (minimum cost factor 10). Cryptographically signed JWT tokens with standard claims and short expiry.
- **Role-Based Access Control (RBAC):** Every API endpoint guarded by server-side middleware validating role hierarchy (`ADMIN`, `MERCHANT`, `CUSTOMER`).
- **Merchant Tenant Isolation:** All merchant product and order mutations scope database queries by `storeId` extracted directly from the verified session token, never from untrusted client query parameters.
- **Data Protection & PII:** Customer addresses and phone numbers masked in logs; sensitive financial details and tokens never recorded in plain-text telemetry.
- **Financial Compliance:** Stored-value unregulated closed wallets are strictly avoided. All transactions settle via direct bank transfer / UPI gateway webhook reconciliation.
- **Idempotency & Fraud Mitigation:** Unique UUID idempotency keys on checkout prevent duplicate payments and accidental double submissions.
