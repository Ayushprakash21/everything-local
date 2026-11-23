# EVERYTHING LOCAL — MERCHANT ANDROID APP FUNCTIONAL AUDIT & REMEDIATION REPORT

**Application ID:** `com.ayushp0021.everythinglocal.merchant`  
**Platform:** Native Android (Kotlin, Jetpack Compose, CameraX, ZXing, Retrofit, KotlinX Serialization, DataStore)  
**Date:** 24 November 2026  
**Status:** FULLY REPAIRED & VERIFIED  

---

## 1. Executive Summary & Audit Context

Initial testing of `EverythingLocal-Merchant-debug.apk` demonstrated that the merchant partner user experience was broken:
- Tapping on dashboard cards or settings headers did not respond.
- Tapping on orders did not open full details or customer delivery info.
- Tapping KPI metrics did not take the merchant to the corresponding tab.
- Unauthenticated launches left the user stranded on an empty dashboard without a clear, prominent pathway to sign in or register their store.
- Backend was hardcoded to `10.0.2.2`, preventing live testing on physical Android devices.
- Manifest lacked location permissions required for Indore store geocoding and delivery radius calculations.
- Merchant branding was generic and lacked distinct visual identity from the customer application.

All deficiencies have been comprehensively remediated.

---

## 2. Screen-by-Screen Functional Audit & Repairs

### 2.1 Distinct Merchant Branding & Header
- **Composable:** `MerchantBrandLogo.kt` & `MerchantDashboardScreen.kt`
- **Prior State (Defective):** Reused generic icons or plain text without distinct partner identity.
- **Remediated State (Interactive):**
  - **Awning Icon Badge:** Warm orange (#EA580C) storefront awning badge with white/orange striping and golden EL monogram.
  - **Partner Sub-Badge:** High-contrast `MERCHANT` pill badge distinguishing partner builds from customer builds.
  - **Adaptive Launcher Icons:** Generated custom vector adaptive icons (`ic_launcher.xml`, `ic_launcher_round.xml`) and 5 density PNGs (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi).

### 2.2 Merchant Login & Partner Portal (`MerchantLoginScreen.kt`)
- **Route:** `"login"`
- **Prior State (Defective):** Generic login screen with dead server configuration options.
- **Remediated State (Interactive):**
  - Prominent `MerchantBrandLogo` banner.
  - Server configuration shortcut button (`Dns` icon) opening `ServerConfigDialog` to switch backend targets (Localhost emulator, LAN IP, Staging HTTPS, Production HTTPS).
  - Clean authentication fields with error feedback.
  - Two distinct onboarding pathways: "Register New Store" and "Track Existing Application".

### 2.3 Self-Service Merchant Onboarding (`MerchantOnboardingScreen.kt`)
- **Route:** `"onboarding"`
- **Prior State (Defective):** Missing in original APK audit.
- **Remediated State (Interactive):**
  - 4-step progressive wizard: Business Profile, Store Location & Delivery Radius, Legal Documents (GSTIN/FSSAI/PAN), and Bank Account Settlement.
  - Validates all fields and submits to `POST /api/merchant-onboarding/submit`.
  - Generates a verified tracking reference (`EL-IND-XXXXXX`) and provides a one-tap jump to the live application tracker.

### 2.4 Application Tracking (`MerchantApplicationTrackingScreen.kt`)
- **Route:** `"tracking"` & `"tracking/{ref}"`
- **Prior State (Defective):** Missing in original APK audit.
- **Remediated State (Interactive):**
  - Allows merchants to check real-time verification status (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`).
  - Fetches live data from `GET /api/merchant-onboarding/status/:reference`.
  - Shows stage completion progress and approval credentials.

### 2.5 Live Dashboard & Operations Console (`MerchantDashboardScreen.kt`)
- **Route:** `"dashboard"`
- **Prior State (Defective):**
  - Settings panel was non-clickable.
  - Unauthenticated error banner lacked actionable sign-in buttons.
  - KPI cards were inert.
  - Orders showed limited summary text with no detail modal.
- **Remediated State (Interactive):**
  - **Store Operations & Settings Dialog (`StoreSettingsDialog`):** Tapping the store header or the top bar settings icon opens a dedicated modal with store status, operational radius, notification toggles, auto-accept order switches, server configuration, and secure sign-out.
  - **Clickable KPI Cards:**
    - "Active Catalogue" & "Low Stock Alert" tap directly into the Inventory management screen (`onNavigateToInventory`).
    - Visual indicators for low-stock warnings.
  - **Interactive Order Details Dialog (`OrderDetailDialog`):** Tapping any order card opens an itemized dialogue showing items, quantities, line totals, fulfillment mode, store location, and one-tap status transitions (`Accept`, `Start Preparing`, `Ready for Pickup / Out for Delivery`, `Complete & Fulfill`).
  - **Dynamic Action Buttons:** Quick-action buttons directly on the cards allow one-tap state changes without leaving the live dispatch list.

### 2.6 Catalogue & Inventory Management (`MerchantCatalogueScreen.kt`)
- **Route:** `"inventory"`
- **Prior State:** List rendered items, but editing details or stock adjustments was cumbersome.
- **Remediated State (Interactive):**
  - Quick-stepper stock adjustment (`+` / `-`) with instant local update and backend sync (`PATCH /api/merchant/inventory/:id/stock`).
  - Tapping any product opens the Edit Product Modal allowing price adjustment, MRP update, stock modification, and catalog deletion.
  - Low-stock badge highlighting items with under 5 units.

### 2.7 Add Product & Barcode Scanner (`AddProductScreen.kt` & `BarcodeScannerScreen.kt`)
- **Route:** `"add_product"` & `"barcode_scanner"`
- **State & Interactivity:**
  - Fast product creation with category selection, price in paise/rupees, MRP, brand, and package size.
  - CameraX-powered live Barcode Scanner: detects EAN-13, UPC-A, and QR codes instantly, auto-filling barcode and querying local catalog for auto-population.

---

## 3. Merchant App Verification Matrix

| Screen / Feature | Route / Composable | Click Handlers Wired | API Connected | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Distinct Merchant Branding** | `BrandLogos.kt` | Yes (Awning + Merchant Pill) | Local Asset | **VERIFIED** |
| **Store Operations & Settings**| `StoreSettingsDialog`| Yes (Toggles, Server URL, Logout)| SessionManager | **VERIFIED** |
| **Server Configuration Modal**| `ServerConfigDialog` | Yes (Custom IP, presets) | DataStore / NetworkClient| **VERIFIED** |
| **Interactive KPI Navigation** | `KpiCard` | Yes (Clicks jump to Inventory)| Local NavHost | **VERIFIED** |
| **Order Details Modal** | `OrderDetailDialog` | Yes (Line items, total, actions)| `PATCH /api/merchant/orders/:id/status`| **VERIFIED** |
| **Live Order Dispatch** | `MerchantOrderCard` | Yes (Accept, Prepare, Deliver) | WebSocket / REST | **VERIFIED** |
| **Self-Service Onboarding** | `MerchantOnboardingScreen`| Yes (4-step form submit) | `POST /api/merchant-onboarding/submit`| **VERIFIED** |
| **Application Tracking** | `MerchantApplicationTrackingScreen`| Yes (Lookup by reference) | `GET /api/merchant-onboarding/status/:ref`| **VERIFIED** |
| **Inventory Quick Stepper** | `MerchantCatalogueScreen.kt`| Yes (Increment / Decrement stock)| `PATCH /api/merchant/inventory/:id/stock`| **VERIFIED** |
| **Product Detail Edit Modal** | `MerchantCatalogueScreen.kt`| Yes (Price, MRP, Stock, Delete)| `PUT/DELETE /api/merchant/products/:id`| **VERIFIED** |
| **Barcode Scanner** | `BarcodeScannerScreen.kt` | Yes (CameraX MLKit/ZXing detection)| Local Camera / ViewModel | **VERIFIED** |
| **Location Permissions** | `AndroidManifest.xml` | Yes (Fine + Coarse location) | Android System | **VERIFIED** |
