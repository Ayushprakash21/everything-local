# Everything Local
> **Tagline:** Shop more. Save more. Live better.  
> **Initial Launch Market:** Indore, Madhya Pradesh, India  
> **Hyperlocal Service Radius:** 3.0 km target serviceability  
> **Minimum Order Value:** ₹299 (29,900 paise)  

Everything Local is a hyper-local neighbourhood commerce and everyday-life platform connecting local independent retailers directly with neighborhood consumers.

---

## Architecture Overview
The platform consists of a single high-performance production codebase with three specialized interfaces powered by an authoritative backend:
1. **Customer Web App:** Mobile-first responsive shopping experience for local store discovery, live stock verification, ₹299 minimum order validation, pickup/delivery choice, and order tracking.
2. **Merchant Portal:** Simple, high-contrast store operations console for catalog management, live stock availability, and 1-click order acceptance/dispatch.
3. **Admin Console:** Governance, merchant KYC verification, commission configuration, and double-entry financial ledger monitoring.

## Core Engineering Principles
- **Integer Paise Arithmetic:** Zero floating-point drift in monetary operations.
- **Geospatial Serviceability:** Haversine formula distance verification enforcing store-specific delivery radii.
- **Strict Tenant Isolation:** Cryptographically verified merchant data boundaries.
- **Atomic Concurrency Control:** Inventory decrement inside serializable transactions.
