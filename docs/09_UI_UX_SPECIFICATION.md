# 09. UI/UX SPECIFICATION
## Product: Everything Local
**Tagline:** Shop more. Save more. Live better.  

---

## 1. Brand Guidelines & Design System
- **Tone:** Friendly, trustworthy, local, efficient, approachable.
- **Color Palette:**
  - Emerald Green (`#059669` / `#10B981`): Freshness, trust, local commerce.
  - Saffron Amber (`#D97706` / `#F59E0B`): Warmth, Indian neighborhood energy.
  - Slate Dark (`#0F172A` / `#1E293B`): Modern typography and high-contrast readability.
  - Soft White / Cream (`#F8FAFC` / `#FFFFFF`): Clean layouts and breathable whitespace.
- **Typography:** Modern clean sans-serif (Inter / System UI font stack). High readability on mobile devices.

---

## 2. Customer Mobile-First Design
- **Header:** Location selector (e.g., "Palasia, Indore (22.7196, 75.8577)"), active search bar, and cart badge with item count and subtotal.
- **Category Carousel:** Quick pills for Grocery, Fruits & Veg, Bakery, Dairy, Snacks, Stationery, Pharmacy, Household.
- **Nearby Stores Feed:** Store cards highlighting:
  - Store Name & Category
  - Distance badge: "1.2 km away" (green if < 3km)
  - Estimated prep time: "15-25 mins"
  - Rating: "★ 4.8 (120+)"
  - Pickup Available & Delivery badges
- **Storefront View:** Store banner, category tabs, product cards with clean image thumbnails, MRP with strikethrough, selling price, and high-visibility "+ ADD" stepper button.
- **Cart & Checkout Drawer:**
  - Single-store rule indicator ("Ordering from Sharma Kirana Store")
  - Progress bar for Minimum Order Value (₹299): "Add ₹45 more to checkout"
  - Radio toggle for `Pickup (FREE)` vs `Delivery (₹25)`
  - Clear itemized price breakdown in ₹ (rupees and paise)
  - Clear, prominent "Place Order" CTA.

---

## 3. Merchant Dashboard Experience
- High contrast, large touch targets for store counters.
- Prominent toggle: `Store Status: OPEN / CLOSED`.
- Audio/Visual alert banner for new incoming orders with quick action buttons: `[Accept Order]` and `[Reject Order]`.
- Active Order Kan-ban: `New Orders` -> `Preparing` -> `Ready for Pickup / Out for Delivery` -> `Completed`.
- Simple Inventory Table with quick stock count increment/decrement and availability switch.
- Earnings summary card: Today's Orders, Today's Sales, Commission Withheld, Net Payout Due.

---

## 4. Admin Operations Portal
- Central KPI cards: GMV, Platform Net Commission, Active Stores, Active Deliveries.
- Merchant Approvals Table with one-click verification and commission rate editor.
- Live Order Stream with status filters, search by order number, and exception highlights.
- Financial Ledger viewer with date filters and CSV export.
- Platform Settings modal to adjust minimum order value and default delivery rates.
