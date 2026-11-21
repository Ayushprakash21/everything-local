# MOBILE MIGRATION AND IMPLEMENTATION GAP REPORT
## Everything Local — React Native & Expo Architecture
**Target Platforms:** Android (APK & AAB) & iOS (IPA / TestFlight)  
**Navigation Engine:** Expo Router v4 (File-based navigation)  
**Language:** TypeScript (Strict)  
**Architecture:** Shared Authoritative Backend + Native Customer & Seller Applications  

---

## 1. Inspection of Existing Repository Assets
The repository contains an authoritative, production-grade backend engine:
- **Server:** Node.js + Express with strict TypeScript interfaces.
- **Data Engine:** Relational schema managed via Prisma ORM (SQLite for local dev/testing with zero daemon barrier, seamless PostgreSQL upgrade path for production).
- **Financial Engine (`server/src/core/finance.ts`):** 100% integer paise arithmetic. 3.5% baseline commission calculation, ₹299 Minimum Order Value (MOV) validation, and financial snapshots.
- **Geospatial Engine (`server/src/core/geospatial.ts`):** Spherical Haversine distance formula with strict 3.0 km serviceability radius around Indore neighborhoods (Palasia, Vijay Nagar, Saket, Rajwada, Bhawarkua, Annapurna).
- **Delivery Adapter (`server/src/core/deliveryAdapter.ts`):** Decoupled fulfillment adapter supporting Store Pickup (₹0 fee), Merchant Delivery (₹25), and Platform Logistics (Porter/Dunzo adapter with safe manual fallback).
- **Security:** bcrypt password hashing, JWT authorization with RBAC, and merchant tenant data isolation (`server/src/middleware/tenant.ts`).
- **Tests:** 19 automated unit and integration tests passing in Vitest.

---

## 2. Gap Analysis for Native Mobile Deliverable
| Feature Area | Current Web State | Native Mobile Requirement | Gap / Action Required |
|---|---|---|---|
| **Runtime & Shell** | Vite React Web App | React Native + Expo (v52+) + TypeScript | Setup native `mobile/` app container with Expo Router |
| **Navigation** | React state portal tabs | Native Stack & Bottom Tabs via Expo Router | Implement `app/(customer)` and `app/(merchant)` layouts |
| **Credentials Storage** | Web `localStorage` | Encrypted Hardware KeyStore / Keychain | Implement `expo-secure-store` wrapper with memory fallback |
| **Device Location** | Mock/HTML5 Geolocation | Native GPS Location Permission & Watcher | Implement `expo-location` with Indore fallback coords |
| **Camera & Search** | Text search only | Visual / Image-based Search & Camera capture | Implement `expo-camera` / `expo-image-picker` native modal |
| **Push Notifications**| None | Push Notification Registration & Handlers | Implement `expo-notifications` token capture & server bridge |
| **Offline & Network**| Standard fetch errors | NetInfo connectivity monitoring & offline caching | Implement network banner, retry mechanism, and offline states |
| **Wishlist & Loyalty**| Not persisted in mobile | Persisted Wishlists, Referral codes, Loyalty points | Add dedicated mobile client state & backend endpoints |
| **Household Lists** | In BRD, not in mobile UI | Shared Family Shopping Lists & Voice/AI Assistant | Build native Household OS tab with smart list optimization |
| **Seller Console** | Web Merchant View | Mobile Order Dispatch & Live Stock Console | Build dedicated `app/(merchant)` native flow with sound/vibration |
| **Build Profiles** | `vite build` | EAS Build config for APK, AAB, and iOS IPA | Author `eas.json`, `app.json`, icons, and splash screens |

---

## 3. Native Architecture Plan

```
mobile/
├── app/
│   ├── _layout.tsx               # Root layout: Theme, AuthProvider, NotificationProvider
│   ├── index.tsx                 # Role gateway / Splash router
│   ├── auth/
│   │   ├── login.tsx             # Native mobile login with role tabs & biometric hook
│   │   └── register.tsx          # Native mobile registration (Customer or Merchant)
│   ├── (customer)/
│   │   ├── _layout.tsx           # Native Bottom Tabs: Discover, Search, Household/AI, Orders, Profile
│   │   ├── index.tsx             # Hyperlocal Store Discovery (3 km GPS, Indore neighborhoods)
│   │   ├── store/[id].tsx        # Storefront with product catalog & stock badges
│   │   ├── product/[id].tsx      # Product detail modal
│   │   ├── search.tsx            # Visual camera search + keyword + filters
│   │   ├── cart.tsx              # Single-store validation, ₹299 MOV progress, Pickup/Delivery
│   │   ├── checkout.tsx          # Native checkout with payment selection & idempotency
│   │   ├── orders/
│   │   │   ├── index.tsx         # Order history
│   │   │   └── [id].tsx          # Real-time order tracking & timeline
│   │   ├── household.tsx         # Shared family lists & AI shopping assistant
│   │   └── profile.tsx           # Profile, Loyalty Points, Referrals, Addresses
│   └── (merchant)/
│       ├── _layout.tsx           # Seller Bottom Tabs: Dispatch, Catalogue, Ledger, Store Profile
│       ├── index.tsx             # Live Order Dispatch Kan-ban with audio/vibration alerts
│       ├── catalogue.tsx         # Product manager with quick stock +/- and availability toggles
│       ├── product/add.tsx       # Add product screen with camera photo capture
│       ├── finance.tsx           # Daily/Weekly commission statements and net payable
│       └── settings.tsx          # Operating status toggle (OPEN/CLOSED) and service radius
├── src/
│   ├── api/                      # Typed API client connecting to backend
│   ├── context/                  # AuthContext, CartContext, LocationContext, NotificationContext
│   ├── components/               # Native UI: Button, Input, Card, Badge, EmptyState, OfflineBanner
│   └── utils/                    # SecureStore, formatPaise, Haversine, permissions
├── assets/                       # App icons, adaptive icons, splash screens
├── app.json                      # Expo app manifest (deep links, permissions, scheme)
└── eas.json                      # Build profiles: development, preview (APK), production (AAB/IPA)
```

---

## 4. Safety & Governance Commitments
- **Zero Cost Commitment:** We will not run paid cloud builds, nor publish to Google Play Console or Apple App Store without explicit user confirmation.
- **Backend Preservation:** The existing working backend (`server/`) and database (`prisma/dev.db`) will remain untouched except for additive, non-breaking endpoints for mobile notifications, wishlists, and loyalty.
- **Real Native UI:** No WebViews, no iframe wrappers, no PWAs disguised as native apps. Pure React Native primitives (`View`, `Text`, `FlatList`, `Pressable`, `Modal`, `Animated`).
