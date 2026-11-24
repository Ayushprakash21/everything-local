# Everything Local — Security Architecture Recommendations
**Target Architecture, Trust Boundaries & Defense-in-Depth Guidelines**

---

## 1. Trust Boundaries & Security Zones

```mermaid
flowchart TD
    subgraph UntrustedZone [Untrusted Zone - Public Internet]
        BrowserClient["React Web Client"]
        MobileClient["Android Apps"]
        Attacker["Potential Malicious Actor"]
    end

    subgraph EdgeBoundary [Cloudflare Edge Perimeter]
        CFWaf["Cloudflare WAF & DDoS"]
        CFWorkerWeb["everything-local-web (Static Assets + CSP)"]
        CFWorkerAPI["everything-local-api (Hono + Secret JWT)"]
        KVStore["KV Cache & Rate Limiting"]
    end

    subgraph SecureBackend [Core Transaction & Data Fabric]
        D1DB[("Cloudflare D1 Database (Encrypted at Rest)")]
        R2Media[("Cloudflare R2 Bucket (Private KYC & Public Media)")]
        LedgerCore["Double-Entry Ledger Engine"]
    end

    BrowserClient -->|HTTPS + CSP| CFWorkerWeb
    MobileClient -->|Enforce TLS / Pinning| CFWorkerAPI
    Attacker -.->|Blocked by Rate Limits| CFWorkerAPI
    CFWorkerAPI -->|Parametrized Queries| D1DB
    CFWorkerAPI -->|Authenticated S3 API| R2Media
    CFWorkerAPI -->|Immutable Audit Log| LedgerCore
```

---

## 2. Authentication Architecture Overhaul

1. **Short-Lived Access Tokens + Refresh Token Rotation:**
   - Reduce JWT expiration from `7d` to `15m`.
   - Issue cryptographically random refresh tokens stored in HTTP-only, Secure, SameSite cookies or secure mobile keystore.
   - Store active refresh token hashes in D1 / KV to support immediate server-side revocation on logout.

2. **Defense Against Brute-Force & Credential Stuffing:**
   - Integrate Cloudflare Turnstile or rate limiting on `POST /api/auth/login` (max 5 failed attempts per IP/username per 15 minutes).
   - Implement temporary account lockout with exponential backoff.

3. **Production SMS Gateway Integration:**
   - Replace in-memory `Map` OTP store in `deliveryPartner.ts` with Cloudflare KV / Redis.
   - Enforce 3-minute OTP expiry and maximum 3 verification attempts per OTP.

---

## 3. Financial Integrity & Ledger Hardening

1. **Strict Canonical Pricing Enforcement:**
   - Never accept `unitPricePaise` from client requests.
   - Checkouts must lock item prices from the database inside atomic transactions.
2. **Delivery OTP Handshake for Settlement:**
   - Deliveries must only settle when the recipient confirms delivery via OTP.
   - Remove merchant self-delivery transitions for platform-dispatched orders.
3. **Double-Entry Reconciliation Checks:**
   - Schedule automated daily reconciliation jobs comparing total captured online payments against total merchant payouts and platform commission debits.
