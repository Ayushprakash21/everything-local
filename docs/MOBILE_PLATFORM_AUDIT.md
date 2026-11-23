# Everything Local — Mobile Platform Technical Audit Report

**Date:** November 23, 2026  
**Auditor:** Senior Android Engineer & Mobile Application Release Engineer  
**Repository:** Everything Local (`repair/v2.0-master-architecture`)  
**Native Android Workspace:** `android-native/`  

---

## 1. Executive Summary

A comprehensive architectural audit was conducted across all mobile directories (`android-native/`, `mobile/`, `release/`) in the repository.

### Key Finding:
The repository contains a **first-class native Android multi-module project** in `android-native/` utilizing **modern Kotlin 2.0, Jetpack Compose, Material 3, Coroutines, Retrofit, and OkHttp**. While legacy Expo/React Native files exist in `mobile/`, the canonical native implementation is located in `android-native/`, which builds directly via Gradle wrapper (`Gradle 8.10.2` and Android Gradle Plugin `8.6.0`).

The host environment has a complete, working Android build chain:
- **JDK:** OpenJDK 21.0.12.1 LTS (`C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot`)
- **Android SDK:** Installed at `C:\Users\Ayush\AppData\Local\Android\Sdk`
- **Target / Compile SDK:** Android 35 (API level 35)
- **Minimum SDK:** Android 24 (API level 24 / Android 7.0 Nougat)
- **Build Tools:** 35.0.0 and 34.0.0

---

## 2. Technology & Architecture Breakdown

### 2.1 Multi-Module Project Structure (`android-native/settings.gradle.kts`)
```
android-native/
├── settings.gradle.kts          # Root project: "everything-local-native"
├── build.gradle.kts             # AGP 8.6.0, Kotlin 2.0.0, Compose 2.0.0
├── gradle.properties            # JVM args, AndroidX enabled
├── local.properties             # sdk.dir configured to C:\Users\Ayush\AppData\Local\Android\Sdk
├── gradlew / gradlew.bat        # Gradle Wrapper (v8.10.2)
│
├── core/
│   ├── common/                  # Resource utilities, Dispatchers, Result wrappers
│   ├── models/                  # Shared data models (User, Store, Product, Cart, Order)
│   ├── network/                 # Retrofit 2, OkHttp, Kotlinx Serialization, Auth interceptors
│   ├── database/                # Local cache & room persistence
│   ├── authentication/          # Encrypted token storage & session lifecycle
│   └── designsystem/            # Material 3 tokens, brand colors, typography, common widgets
│
├── customer/
│   └── app/                     # Customer Android Application (:customer:app)
│       └── src/main/
│           ├── AndroidManifest.xml   # Package: com.ayushp0021.everythinglocal
│           ├── java/                 # Jetpack Compose UI (Home, Search, Cart, Orders, Profile)
│           └── res/                  # Mipmap icons, strings, vector drawables
│
└── merchant/
    └── app/                     # Merchant Android Application (:merchant:app)
        └── src/main/
            ├── AndroidManifest.xml   # Package: com.ayushp0021.everythinglocal.merchant
            ├── java/                 # Compose UI (Dashboard, Catalogue, Barcode, Orders, Settlement)
            └── res/                  # Merchant brand icons & drawables
```

---

## 3. Platform Capabilities & Feature Mapping

### 3.1 Customer Application (`:customer:app`)
- **Package ID:** `com.ayushp0021.everythinglocal`
- **Permissions:** `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- **Implemented Screens:**
  1. `HomeScreen`: Locality chip, delivery tier badges, category pills, nearby store discovery.
  2. `SearchScreen`: Real-time product search with keyword query debounce.
  3. `CartScreen`: Multi-store cart items breakdown, quantities, delivery fees, atomic checkout button.
  4. `OrdersScreen`: Customer order tracking, status badges, delivery OTP display.
  5. `ProfileScreen`: Authentication state, saved addresses, logout.

### 3.2 Merchant Application (`:merchant:app`)
- **Package ID:** `com.ayushp0021.everythinglocal.merchant`
- **Permissions:** `INTERNET`, `ACCESS_NETWORK_STATE`, `CAMERA` (for barcode scanning)
- **Implemented Screens:**
  1. `DashboardScreen`: Live store metrics, pending orders count, quick toggle store Open/Closed.
  2. `CatalogueScreen`: Product inventory management, stock counts, price updates.
  3. `BarcodeScanner`: Camera-based physical barcode scanner for rapid catalog additions.
  4. `OrdersScreen`: Incoming merchant child orders with Accept/Reject actions.
  5. `SettlementScreen`: Transparent payout statements and commission calculations.
  6. `StoreScreen`: Multi-store branch selector supporting `x-store-id` switching.

---

## 4. Networking & Backend Connectivity

- **Client:** OkHttp with custom `authInterceptor` adding:
  - `Authorization: Bearer <token>`
  - `x-store-id: <storeId>`
- **Serialization:** `kotlinx.serialization` with `Json { ignoreUnknownKeys = true; isLenient = true }`
- **Base URL:**
  - Default: `http://10.0.2.2:4000/api/` (standard Android emulator loopback to host PC)
  - Physical Device: `http://<HOST_LAN_IP>:4000/api/` (cleartext traffic permitted via `android:usesCleartextTraffic="true"`)

---

## 5. Inspection of Existing Release Artifacts

| Artifact Path | Size | Description |
| :--- | :---: | :--- |
| `release/customer/EverythingLocal-Customer.apk` | 18.58 MB | Pre-existing Customer Release APK |
| `release/merchant/EverythingLocal-Merchant.apk` | 42.60 MB | Pre-existing Merchant Release APK |
| `mobile/release/EverythingLocal.apk` | 18.58 MB | Legacy React Native bundle archive |

*Note: Per requirements, existing artifacts will be preserved while new fresh DEBUG APKs are compiled from the native Kotlin source tree.*

---

## 6. Build Prerequisites Verification

- [x] Gradle wrapper executable (`Gradle 8.10.2` verified)
- [x] Java JDK 21 installed and configured (`JAVA_HOME` pointing to Microsoft OpenJDK 21)
- [x] Android SDK 35 installed at `C:\Users\Ayush\AppData\Local\Android\Sdk`
- [x] Android Build-Tools 35.0.0 installed
- [x] Native Gradle build tasks identified:
  - Customer: `:customer:app:assembleDebug`
  - Merchant: `:merchant:app:assembleDebug`
