# Everything Local — Dynamic Indore Location & Serviceability Engine

## 1. Architectural Overview

Everything Local's Location and Serviceability Engine replaces hardcoded location assumptions with an interactive, multi-tiered location discovery and fulfillment verification system specifically built for Indore, Madhya Pradesh.

The engine separates three distinct concepts:
1. **Customer's Physical/Geographical Coordinates** (via Browser/Device GPS or Geocoded Address).
2. **Customer's Selected Delivery Address & Label** (Saved Home, Work, Other).
3. **Store Fulfillment & Delivery Coverage** (Haversine great-circle calculation against store-specific service radii).

---

## 2. Dynamic Location Detection & Geocoding Provider

### A. Automatic Browser & Device GPS
- Invokes `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true` and a 10-second timeout.
- Coordinate results are sent to `/api/location/reverse?lat=<lat>&lng=<lng>`.
- The server checks against local high-precision Indore landmarks (< 0.8 km) or queries OpenStreetMap Nominatim reverse geocoding with server-side caching.
- If GPS permission is denied or unsupported, the user is never stuck on an assumed location. The interactive **Location Selection Modal** opens immediately, allowing manual locality or PIN code search.

### B. Two-Tiered Geocoding & Address Lookup
1. **Tier 1 — High-Speed Local Knowledge Base (`server/src/core/locationEngine.ts`)**:
   - Covers 30+ primary Indore hubs, colonies, residential schemes, and industrial zones:
     - *Central*: Palasia, New Palasia, Old Palasia, Rajwada, Sarafa, Geeta Bhawan, South Tukoganj, Juni Indore.
     - *East*: Vijay Nagar, Scheme 54, Scheme 78, Saket Nagar, Bengali Square, Khajrana, Mahalaxmi Nagar, Nipania, Bicholi Mardana, LIG Colony, MIG Colony.
     - *South & South-West*: Bhawarkua, Sapna Sangeeta, Tower Square, Annapurna, Sudama Nagar, Rau, Silicon City.
     - *West & North*: Airport Road, Super Corridor, Chandan Nagar, MR 10, Dewas Naka, Sanwer Road Industrial Area, Musakhedi.
   - Comprehensive PIN code index: `452001`, `452002`, `452005`, `452007`, `452009`, `452010`, `452011`, `452014`, `452015`, `452016`, `452018`, `453331`.
2. **Tier 2 — OpenStreetMap Nominatim Provider (Throttled & Cached)**:
   - Queries are routed through the backend (`/api/location/search?q=...`) to avoid exposing frontend API tokens.
   - Includes custom `User-Agent: EverythingLocal-HyperlocalApp/1.0`.
   - Bounded to the Indore geographical bounding box (`22.5 <= lat <= 22.9`, `75.6 <= lon <= 76.1`).
   - Strict 1 req/sec server rate-limiting safeguard and in-memory LRU caching.

---

## 3. Database Schema & Customer Address Management

The `CustomerAddress` model is backed by Prisma:

```prisma
model CustomerAddress {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label       String   @default("Home") // Home, Work, Other
  addressLine String
  landmark    String?
  city        String   @default("Indore")
  pincode     String
  latitude    Float
  longitude   Float
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

### Endpoints
- `GET /api/customer/addresses` – Lists saved addresses for authenticated customer.
- `POST /api/customer/addresses` – Saves an address with label and coordinates.
- `PUT /api/customer/addresses/:id/default` – Atomically updates the customer's default address.
- `DELETE /api/customer/addresses/:id` – Removes a saved address.

---

## 4. Hyperlocal Serviceability & Fulfillment Rules

Fulfillment logic enforces genuine physical distance using spherical Haversine trigonometry:

$$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
$$d = R \cdot \Delta\sigma \quad (R = 6371.0 \text{ km})$$

### Delivery Rules:
- **Service Radius:** Configurable per store (defaults to 3.0 km, up to 3.5 km for specialized grocers).
- **Serviceability Evaluation:**
  - $d \le 1.2\text{ km}$: Estimated delivery in **15–20 min**.
  - $1.2\text{ km} < d \le 2.5\text{ km}$: Estimated delivery in **20–30 min**.
  - $2.5\text{ km} < d \le \text{serviceRadiusKm}$: Estimated delivery in **25–35 min**.
  - $d > \text{serviceRadiusKm}$: Delivery is **unserviceable**; store status is set to **"Store Pickup Only (Outside Delivery Radius)"**.
- **Minimum Order Value (MOV):** Strict ₹299.00 item subtotal required for delivery checkout.
- **In-Store Pickup:** Always permitted ($0 delivery fee) across all licensed Indore merchants regardless of customer distance.

---

## 5. UI/UX Redesign Highlights

1. **Top Header & Location Selector:**
   - Monogram EL logo mark with crisp typography.
   - 1-Tap Location Pill Button showing detected locality and real-time delivery ETA.
   - Opens the dedicated **LocationModal** with instant search, GPS detection button, recently selected locations, and saved home/work addresses.
2. **Notification Panel:**
   - Popover anchored under the bell icon with click-outside event listeners, maximum viewport boundaries, and internal scrolling.
3. **Hero Banner & Typography:**
   - Flexible responsive container with no horizontal overflow.
   - Dynamic copy adapting to the customer's detected Indore locality (e.g., *"Farm Direct to Vijay Nagar"*).
4. **12 Quick-Commerce Category Grid:**
   - Illustrated pastel category cards linking to instant filters.
5. **Product Grids:**
   - Mobile: 2-column (`grid-cols-2`).
   - Tablet: 3-column (`sm:grid-cols-3`).
   - Desktop: 4–5 columns (`lg:grid-cols-4 xl:grid-cols-5`).
   - Displays real images, pack sizes, verified MRP discounts, and responsive "+ Add" buttons.

---

## 6. Verification Scenarios & Automated Test Suite

Tested in `tests/location-engine.test.ts` (11 tests) and `tests/api-integration.test.ts` (7 tests):
1. **Palasia** (`22.7244, 75.8839`): Reverse-geocoded to Palasia 452001; 3 stores serviceable; ETA 15–20 min.
2. **Vijay Nagar** (`22.7533, 75.8937`): Reverse-geocoded to Vijay Nagar 452010; 1 store serviceable; ETA 15–20 min.
3. **Bhawarkua** (`22.6926, 75.8676`): Reverse-geocoded to Bhawarkua 452014; nearest store 3.91 km away; delivery unserviceable; Store Pickup Only.
4. **Rau** (`22.6288, 75.8115`): Reverse-geocoded to Rau 453331; nearest store 12.97 km away; delivery unserviceable; Store Pickup Only.
5. **Arbitrary Search**: Verified searches for "Bengali Square", "Scheme 54", "Khajrana", "Super Corridor", "Sudama Nagar".
6. **PIN Code Search**: Verified queries for "452010" and "452001".
7. **GPS Denial**: Verified fallback flow opening LocationModal without throwing unhandled exceptions.
