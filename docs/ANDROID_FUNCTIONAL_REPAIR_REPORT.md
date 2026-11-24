# EVERYTHING LOCAL — ANDROID FUNCTIONAL REPAIR & UX RESTORATION REPORT

**Engineering Role:** Senior Android & Mobile Release Engineer  
**Sprint Window:** 22–24 November 2026  
**Status:** COMPLETED & VERIFIED  

---

## 1. Problem Statement & Root Cause Diagnosis

Manual testing of the Android Debug APKs revealed that key user actions did not trigger any UI feedback:
1. **Unresponsive Profile / Settings in Customer App:**
   - In `ProfileScreen.kt`, row elements (`AccountOptionRow`) were rendered without interactive `Modifier.clickable` wrappers or state handlers.
   - Users could not view or edit delivery addresses, configure UPI payment methods, adjust notification toggles, or contact support.
2. **Inert Store & Product Cards:**
   - In `HomeScreen.kt`, `StoreItemCard` lacked click listeners to view store-specific catalogues.
   - `ProductCard.kt` had a dummy no-op lambda (`onClick = {}`), preventing inspection of MRP savings, pack sizes, and fulfillment details.
3. **Unresponsive Merchant Operations Console:**
   - In `MerchantDashboardScreen.kt`, tapping the header or settings did not open store controls or configuration.
   - Incoming orders only listed brief text without an itemized breakdown, customer delivery details, or fulfillment confirmation.
   - KPI metrics were static and could not be clicked to transition to the inventory list.
4. **Network & Host Binding Failures:**
   - Hardcoded emulator URL (`10.0.2.2:4000`) caused silent failures or infinite loaders on physical Android hardware and Wi-Fi networks.

---

## 2. Source Code Changes & Files Modified

### Core Design System & Network Architecture
- `android-native/core/designsystem/src/main/java/.../BrandLogos.kt`:
  - Implemented `CustomerBrandLogo` (Official squircle, golden shopping basket, EL monogram, and brand taglines).
  - Implemented `MerchantBrandLogo` (Distinct storefront awning in warm orange `#EA580C`, striping, and `MERCHANT` store badge).
- `android-native/core/network/src/main/java/.../NetworkClient.kt`:
  - Added dynamic base URL rewrite interceptor reading custom user-defined IP from DataStore.
  - Implemented friendly `BackendUnavailableException` socket/timeout error handling.
- `android-native/core/authentication/src/main/java/.../SessionManager.kt`:
  - Added DataStore persistence for `custom_base_url` allowing on-the-fly network switching.

### Customer App Remediation
- `customer/app/.../ui/ProfileScreen.kt`:
  - Wired interactive modal sheets for Saved Addresses (Palasia, Saket Nagar, Vijay Nagar, Bhanwarkua).
  - Added Payment Methods & UPI Sheet (Google Pay, PhonePe, COD).
  - Added Notification Preferences Sheet (SMS/WhatsApp and Promotional toggles).
  - Added Help & Support Sheet with Indore helpline (`+91 731-498-2100`) and WhatsApp support.
  - Added "Become a Merchant Partner" informational sheet.
  - Bound profile header to real session info with Login / Switch Account modal and working Logout.
- `customer/app/.../ui/HomeScreen.kt`:
  - Integrated `CustomerBrandLogo(variant = LogoVariant.COMPACT)`.
  - Made `StoreItemCard` clickable (`onClick = { selectedStore = store }`), opening `StoreCatalogueSheet`.
  - Made `ProductCard` clickable (`onClick = { selectedProduct = product }`), opening `ProductDetailSheet`.
  - Added Backend Connectivity Alert banner with "Retry Connection" button.
- `customer/app/.../ui/SearchScreen.kt`:
  - Added `selectedProduct` state so tapping search results opens `ProductDetailSheet`.

### Merchant App Remediation
- `merchant/app/.../ui/MerchantDashboardScreen.kt`:
  - Added `StoreSettingsDialog` (store operational status, 3.0 km radius, commission tier, notification toggles, auto-accept orders toggle, backend server shortcut, and logout).
  - Added `OrderDetailDialog` (customer fulfillment mode, store location, line item price/qty breakdown, order total, and status progression buttons).
  - Made KPI cards clickable: Tapping "Active Catalogue" or "Low Stock Alert" navigates directly to the inventory screen.
  - Made order cards clickable: Tapping any card opens `OrderDetailDialog`.
- `merchant/app/.../ui/MerchantLoginScreen.kt`:
  - Integrated `MerchantBrandLogo(showTagline = true)`.
  - Integrated `ServerConfigDialog` shortcut.
- `merchant/app/.../ui/MerchantCatalogueScreen.kt`:
  - Added quick-stepper stock adjustment (`+` / `-`).
  - Added Edit Product Dialog (price, MRP, stock units, and delete action).
- `merchant/app/.../navigation/MerchantNavGraph.kt`:
  - Added `onNavigateToInventory` parameter and route links.

---

## 3. Functional Verification Results

| Test Scenario | Action Performed | Result |
| :--- | :--- | :--- |
| **Profile Settings Click** | User taps "Saved Addresses" | Bottom sheet opens displaying saved Indore addresses |
| **Payment Preferences** | User taps "Payment Methods" | Bottom sheet opens with UPI & COD options |
| **Helpline Dialing** | User taps "Help & Support" | Bottom sheet opens with phone number +91 731-498-2100 |
| **Store Inspection** | User taps Store Card on Home | Bottom sheet opens with store catalog & Add to Cart |
| **Product Inspection** | User taps Product Card | Product sheet opens with MRP savings & quantity stepper |
| **Search Interaction** | User clicks search result item | Product sheet opens with store details & Add to Cart |
| **Merchant Settings** | Merchant taps Top Bar Settings | Dialog opens with operational toggles & server config |
| **Order Inspection** | Merchant taps Order Card | Dialog opens with items, total, and status update actions |
| **Inventory Navigation**| Merchant taps "Low Stock Alert" | App navigates directly to Inventory screen |
| **Stock Stepper** | Merchant taps `+` on item stock | Stock updates immediately and sends API request |
