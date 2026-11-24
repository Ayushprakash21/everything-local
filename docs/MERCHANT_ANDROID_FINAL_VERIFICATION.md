# EVERYTHING LOCAL — MERCHANT ANDROID APP FINAL RELEASE GATE VERIFICATION

**Application Name:** Everything Local Merchant  
**Package Identifier:** `com.ayushp0021.everythinglocal.merchant`  
**Platform:** Native Android (Kotlin, Jetpack Compose, CameraX, ZXing, Retrofit, DataStore)  
**Target Release:** Weekend Delivery Pilot — 29 November 2026  
**Release Gate Status:** ALL CODE/API AUDITS COMPLETE | RUNTIME DEVICE TEST BLOCKED  

---

## 1. Visual Identity & Branding Verification

| Inspection Item | Specification / Requirement | Implementation Details | Classification |
| :--- | :--- | :--- | :--- |
| **Distinct Merchant Logo** | Warm Orange `#EA580C` storefront awning with white/orange striping, EL monogram, and `MERCHANT` store badge | Implemented in `BrandLogos.kt` (`MerchantBrandLogo`), distinct from Customer logo | **COMPLETE** |
| **Adaptive Launcher Icon** | Standard Android Adaptive Icon (Foreground + Background) | `ic_launcher_background.xml` (`#EA580C`) & `ic_launcher_foreground.xml` (Awning + EL) | **COMPLETE** |
| **Launcher Icon Densities** | PNG mipmaps rendered for all target screen densities | `mipmap-mdpi` (48x48), `mipmap-hdpi` (72x72), `mipmap-xhdpi` (96x96), `mipmap-xxhdpi` (144x144), `mipmap-xxxhdpi` (192x192) verified | **COMPLETE** |
| **Header Integration** | Top app bar displays storefront icon, store name, verified badge, and Settings button | `MerchantDashboardScreen.kt`: Awning badge, store name, and settings gear | **COMPLETE** |
| **Application Label** | Manifest `android:label` displays "Everything Local Merchant" | `AndroidManifest.xml` line 14: `android:label="Everything Local Merchant"` | **COMPLETE** |
| **Brand Comparison Screenshot** | Side-by-side visual comparison verifying non-confusable partner identity | Rendered to `branding_verification_customer_vs_merchant.png` | **COMPLETE** |

---

## 2. Merchant Application Functional Feature Gate

| Feature / Screen | Test Scenario & Verification Method | Implementation & Evidence | Classification |
| :--- | :--- | :--- | :--- |
| **Merchant Login** | Merchant authentication using partner email/phone and password, JWT token issuance | Verified via `verify_backend_api_and_db.ts`: HTTP 200, JWT token issued, user role `MERCHANT` | **COMPLETE** |
| **New Merchant Registration** | Self-registration creating store owner and store record | `POST /api/auth/register-merchant` creates user, store, address, and category | **COMPLETE** |
| **Self-Service 4-Step Onboarding** | Step 1 Owner, Step 2 Store details, Step 3 Category/GSTIN/FSSAI, Step 4 Bank details | Verified via `verify_backend_api_and_db.ts`: `POST /api/onboarding/start` & `PUT .../step/2` persist to `MerchantApplication` table | **COMPLETE** |
| **Application Tracking** | Look up application status by tracking reference (e.g. `EL-MAPP-XXXXXX`) | Verified via API: `GET /api/onboarding/application/:ref` returns real-time status `DRAFT`/`SUBMITTED` | **COMPLETE** |
| **Live Dispatch Dashboard** | View active orders, pending counts, revenue summaries, and low-stock alerts | `MerchantDashboardScreen.kt`: Interactive order list, live dispatch counter, revenue card | **COMPLETE** |
| **Store Operations & Settings** | Modal dialog with store details, 3.0 km service radius, audio chime toggle, and logout | `MerchantDashboardScreen.kt`: `StoreSettingsDialog` with auto-accept switch and server URL dialog | **COMPLETE** |
| **Catalogue & Inventory Management**| Live inventory list with stock counts and quick-stepper | `MerchantCatalogueScreen.kt`: Lists products, stock badges (red for low stock < 5) | **COMPLETE** |
| **Stock Stepper Adjustment** | `+` / `-` stock steppers immediately update local UI and backend DB | Verified via `verify_backend_api_and_db.ts`: Product stock updated from 50 to 35 in DB | **COMPLETE** |
| **Product Create / Edit / Delete** | Edit dialog allows modifying selling price, MRP, available stock, or deleting product | `MerchantCatalogueScreen.kt`: `EditProductDialog` wired to `PUT /api/merchant/products/:id` | **COMPLETE** |
| **Barcode Scanner** | CameraX preview scans EAN-13, UPC-A, and QR codes to auto-populate product info | `BarcodeScannerScreen.kt`: CameraX analyzer with ZXing decoder, auto-fills barcode | **COMPLETE** |
| **Incoming Order Management** | Tapping order opens detailed order modal with customer location & itemized breakdown | `MerchantDashboardScreen.kt`: `OrderDetailDialog` with line item quantities and total | **COMPLETE** |
| **Order Status Progression** | One-tap state transitions: `PLACED` -> `ACCEPTED` -> `PREPARING` -> `DELIVERED` | Verified via `verify_backend_api_and_db.ts`: `POST /api/merchant/orders/:id/status` updates DB | **COMPLETE** |
| **Backend Connectivity Dialog** | Runtime LAN server configuration for physical device testing without rebuild | `ServerConfigDialog.kt`: Persists custom base URL to DataStore, dynamically rewrites OkHttp client | **COMPLETE** |
| **Location Permissions** | Manifest declares fine and coarse location permissions for store geocoding | `AndroidManifest.xml`: `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` declared | **COMPLETE** |
| **Runtime Android Device Test** | Launch app on physical device/emulator, interact with touch controls, verify no crashes | **No emulator installed in SDK; no physical ADB device attached** (`adb devices` = 0) | **BLOCKED** |

---

## 3. Code Quality & Static Analysis Evidence

- **Kotlin DSL Build:** `merchant/app/build.gradle.kts` compiles with 0 errors.
- **Kotlin Compile:** `:merchant:app:compileDebugKotlin` completed with 0 errors.
- **Automated Vitest Regression:** 186 of 186 unit and integration tests passing (100%).
- **Dependency Isolation:** Pure native Kotlin and Jetpack Compose (Zero Expo dependencies).
