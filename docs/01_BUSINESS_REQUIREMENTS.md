# 01. BUSINESS REQUIREMENTS DOCUMENT (BRD)
## Product: Everything Local
**Tagline:** Shop more. Save more. Live better.  
**Initial Market:** Indore, Madhya Pradesh, India  
**Target Radius:** 3 km hyper-local neighbourhood commerce  

---

## 1. Executive Summary
Everything Local is a hyper-local neighbourhood commerce and everyday-life platform engineered to empower local independent retailers while delivering an ultra-fast, transparent, and affordable shopping experience for households. 

Unlike conventional quick-commerce monopolies that burn capital on dark stores and charge heavy margins, Everything Local partners directly with neighborhood mom-and-pop stores (Kirana, bakeries, fresh produce, pharmacies, electronics, stationery, apparel) within a 3 km radius.

## 2. Market Scope & Launch Strategy
- **Primary Geography:** Indore, Madhya Pradesh (Pin codes covering Palasia, Vijay Nagar, Bhawarkua, Rajendra Nagar, Annapurna, Saket, etc.).
- **Initial Hyperlocal Radius:** 3.0 km store-to-customer radius validated server-side.
- **Minimum Order Value (MOV):** ₹299 (29,900 paise) configurable by platform administration.
- **Core Value Proposition:**
  - **Consumers:** Fresh, authentic local store goods, support for neighborhood retailers, competitive pricing, transparent delivery/pickup fees.
  - **Merchants:** Sustainable 3–4% commission (vs 18–30% on traditional aggregators), direct customer ownership, digitised inventory and billing.

## 3. Seven Master Ecosystems (Product Vision)
1. **Local Commerce:** Multi-category storefronts, discovery, cart, delivery & in-store pickup, real-time tracking, ratings.
2. **Smart Money:** Household budgeting, recurring expense tracking, price comparison, transparent savings.
3. **Personal AI:** Availability-aware natural-language search, voice-to-cart, recipe-to-list, basket optimization.
4. **Household OS:** Shared family lists, pantry inventory replenishment, recurring essentials.
5. **Local Community:** Local retailer stories, community group buying, neighborhood demand boards.
6. **Rewards & Benefits:** Transparent merchant-funded loyalty, referral rewards, premium membership pass.
7. **Life Planner:** Festival, wedding, school, and occasion-based checklists and curated shopping.

## 4. Business Rules & Financial Integrity
- **Currency Standard:** All calculations performed strictly in integer paise (1 INR = 100 paise) to prevent floating-point rounding errors.
- **Cart Rule:** Single-store checkout per order in Phase 1 (no mixed-store checkout).
- **Merchant Commission:** 3% - 4% baseline on order item subtotal (excluding tax and pass-through delivery fees).
- **Fulfillment Modes:** Customer Self-Pickup (₹0 delivery charge), Merchant-Managed Delivery, Platform-Assisted Delivery Adapter.
- **GMV vs Revenue:** Platform revenue strictly equals net earned commission + subscription fees + platform tech fees. Customer delivery fees passed to delivery drivers or merchants are accounted for as pass-through, never platform revenue.
