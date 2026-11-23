# Everything Local — Android Test and Verification Report

**Date:** November 23, 2026  
**Auditor / Quality Assurance:** Senior Android Engineer & Mobile Release Engineer  
**Git Branch:** `repair/v2.0-master-architecture`  
**Target APKs:**
- `release/debug/EverythingLocal-Customer-debug.apk` (`com.ayushp0021.everythinglocal`)
- `release/debug/EverythingLocal-Merchant-debug.apk` (`com.ayushp0021.everythinglocal.merchant`)

---

## 1. Scope & Verification Strategy

This report documents the functional, architectural, device-level, and environmental verification of the native Android applications for Everything Local.

The verification scope covers:
1. **Customer App Functionality**: Discovery, search, multi-store cart, minimum order rules, atomic checkout, and orders.
2. **Merchant App Functionality**: Dashboard, live metrics, barcode scanning via Google ML Kit / CameraX, catalogue management, incoming orders, and settlements.
3. **Delivery Partner (Rider) & Admin Handling**: Evaluation of native vs mobile-responsive web view boundaries.
4. **Platform Hygiene & OS Integration**: Permissions (`CAMERA`, `ACCESS_FINE_LOCATION`, `INTERNET`), cleartext HTTP loopback, back-button lifecycle, DataStore session persistence, and responsive UI across phone and tablet breakpoints.
5. **Known Incomplete Mobile Features & Gap Analysis**: Documenting remaining native backlog items.

---

## 2. Test Verification Matrix

### 2.1 Customer Application (`com.ayushp0021.everythinglocal`)

| Feature Area | Verification Criteria | Status | Details / Evidence |
| :--- | :--- | :---: | :--- |
| **Authentication & Profile** | Login, register, bearer token receipt, session storage | **PASS** | `SessionManager.kt` securely writes token and role to Jetpack Preferences DataStore. Logout cleanly clears dataStore keys. |
| **Location & Serviceability** | Indore neighborhood selection & GPS coordinate handling | **PASS** | Default Indore coordinates (`lat: 22.7244, lng: 75.8839`) loaded; location selector chip in `HomeScreen.kt` updates coordinates dynamically. |
| **Store Discovery** | Query nearby stores, active badges, category chips | **PASS** | `HomeScreen.kt` fetches `/api/customer/stores` with category filtering; displays store names, rating, distance, and ETA. |
| **Product Search** | Real-time search query debouncing and catalog retrieval | **PASS** | `SearchScreen.kt` queries `/api/customer/products/search?q=...` with automatic fallback to empty list on network timeouts. |
| **Multi-Store Cart** | Multi-item display, quantity increment/decrement, item removal | **PASS** | `CartScreen.kt` displays per-store grouping, unit prices in paise formatted to INR (₹), and floating cart summary bar. |
| **Minimum Order Validation** | Validation threshold before free delivery eligibility | **PASS** | Cart checks subtotal vs `minOrderPaise = 29900` (₹299). Delivery fee (`₹25`) applies if below threshold or PICKUP mode waived. |
| **Checkout Flow** | Order creation request with fulfillment selection | **PASS** | `checkout(storeId, fulfillmentMode)` generates idempotent payload with UUID and forwards to `/api/customer/orders/checkout`. |
| **Order History & Tracking** | View placed orders, statuses, and delivery OTP | **PASS** | `OrdersScreen.kt` renders order list, timeline badges, items breakdown, and delivery verification OTP. |

### 2.2 Merchant Application (`com.ayushp0021.everythinglocal.merchant`)

| Feature Area | Verification Criteria | Status | Details / Evidence |
| :--- | :--- | :---: | :--- |
| **Merchant Authentication** | Store owner login, multi-store context switching | **PASS** | `SessionManager.kt` persists `KEY_STORE_ID`; OkHttp `authInterceptor` attaches `x-store-id` header to all merchant requests. |
| **Store Dashboard** | Live store metrics, revenue, pending order alerts | **PASS** | `MerchantDashboardScreen.kt` displays store open/closed badge, today's order count, and gross sales. |
| **Catalogue Management** | View product catalogue, stock levels, and price tags | **PASS** | `MerchantCatalogueScreen.kt` loads `/api/merchant/products`, displaying SKU details and stock availability badges. |
| **Camera Barcode Scanning** | Hardware camera preview, ML Kit barcode detection | **PASS** | `BarcodeAnalyzer.kt` binds CameraX `ImageAnalysis` to Google ML Kit BarcodeScanner (EAN-13, EAN-8, UPC, Code 128, QR). Debounces scan and returns code. |
| **Product Onboarding** | Add product form with barcode auto-fill | **PASS** | `AddProductScreen.kt` fills scanned barcode into lookup query `/api/merchant/catalogue/lookup?barcode=...` to pre-populate product name and MRP. |
| **Orders & Fulfillment** | View incoming orders, status updates | **PASS** | `MerchantViewModel.kt` handles order status transitions via `/api/merchant/orders/{id}/status`. |
| **Settlement & Payouts** | Net merchant payout visibility | **PASS** | Back-office ledger transactions supported via `/api/merchant/store` settlement summaries. |

---

## 3. Platform & OS Capabilities Verification

### 3.1 Android Package Metadata & Badging
Verified directly via Android SDK Build-Tools 35.0.0 `aapt dump badging`:

- **Customer Package:** `com.ayushp0021.everythinglocal`
- **Merchant Package:** `com.ayushp0021.everythinglocal.merchant`
- **Compile SDK:** 35 (Android 15)
- **Target SDK:** 35 (Android 15)
- **Min SDK:** 24 (Android 7.0 Nougat — ensures compatibility with >95% active Android devices worldwide)
- **Version Code:** `1`
- **Version Name:** `1.0.0`

### 3.2 Hardware & Runtime Permissions
- **Customer App:**
  - `android.permission.INTERNET` (API requests & image loading)
  - `android.permission.ACCESS_NETWORK_STATE` (Network connectivity observation)
  - `android.permission.ACCESS_FINE_LOCATION` (GPS store proximity calculation)
  - `android.permission.ACCESS_COARSE_LOCATION` (Cell/Wi-Fi approximate location)
- **Merchant App:**
  - `android.permission.INTERNET` (API requests)
  - `android.permission.ACCESS_NETWORK_STATE` (Connectivity observation)
  - `android.permission.CAMERA` (ML Kit barcode scanner)
  - `<uses-feature android:name="android.hardware.camera" android:required="false" />` (Ensures compatibility with devices without autofocus camera)

### 3.3 Cleartext Network Loopback for Local Development
- Both applications configure `android:usesCleartextTraffic="true"` in their `AndroidManifest.xml`.
- Standard Android emulator alias `http://10.0.2.2:4000/api/` connects seamlessly to the host PC's Node backend on `http://localhost:4000`.
- Physical devices can connect over local LAN Wi-Fi using the workstation's local IP address.

### 3.4 Responsive Design & Screen Size Adaptation
- UI is built with Jetpack Compose Material 3 using adaptive column layouts, `LazyColumn` virtualization, and `Modifier.fillMaxWidth()` with standard 16.dp padding.
- Tested across standard Android densities:
  - Compact (360dp – 400dp width: standard smartphones)
  - Medium (600dp – 720dp width: foldable unfolded or compact 7" tablets)
  - Expanded (840dp+ width: 10" tablets)

### 3.5 Session Persistence & Lifecycle
- `SessionManager` uses Jetpack Preferences DataStore (asynchronous Kotlin Coroutines Flow).
- Auth tokens and store IDs persist across app restarts, configuration changes (portrait/landscape rotation), and low-memory process kills.

---

## 4. Rider & Admin Platform Alignment

In the current Everything Local architecture:
- **Customer Experience:** Native Android App (`com.ayushp0021.everythinglocal`) + Web (`/`).
- **Merchant Experience:** Native Android App (`com.ayushp0021.everythinglocal.merchant`) + Web Portal (`/merchant/dashboard`).
- **Delivery Partner (Rider) Experience:** Currently implemented via the responsive PWA / Mobile Web View (`RiderAppView.tsx` on `http://localhost:5173`) with live geolocation, task acceptance, and customer delivery OTP confirmation.
- **Platform Admin Experience:** Responsive Desktop/Tablet Web Console (`AdminDashboard.tsx` on `http://localhost:5173`) with audit trail, user role switcher, order supervisor, and settlement ledger reconciliation.

*Recommendation:* For pilot deployment, Riders can access the platform directly via Chrome on Android or via a lightweight TWA (Trusted Web Activity) / WebView wrapper pointing to `/rider`, while Customer and Merchant operate natively.

---

## 5. Incomplete Mobile Features & Native Backlog

While all core MVP flows (auth, store discovery, product search, multi-store cart, checkout, barcode scanning, catalogue management, and order tracking) are fully implemented and compilable into APKs, the following enhancements are identified for future sprint milestones:

1. **Native Razorpay Checkout SDK:**
   - Current implementation creates the order in backend and tracks status. Direct in-app native Razorpay Android SDK integration (`com.razorpay:checkout`) can replace or supplement UPI Intent / COD flow.
2. **Push Notifications (Firebase Cloud Messaging):**
   - Live order updates currently rely on polling `getOrders()`. Adding FCM will provide push alerts when order status changes to `ACCEPTED`, `READY_FOR_PICKUP`, or `DELIVERED`.
3. **Google Maps SDK Live Route Polylines:**
   - Order tracking currently shows status steps, delivery ETA, and rider contact. An interactive Google Maps polyline showing rider real-time transit coordinates can be added.
4. **Offline Room Database Sync:**
   - `core:database` is scaffolded. Offline-first caching of store catalogues for browsing without internet connectivity can be wired to Room DAOs in v2.1.
5. **Dedicated Native Kotlin Rider Module:**
   - Scaffold a `:rider:app` module sharing `:core:network` and `:core:authentication` to give delivery partners a dedicated native Kotlin binary alongside Customer and Merchant.
