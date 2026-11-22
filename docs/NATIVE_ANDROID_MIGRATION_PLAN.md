# Native Android Migration Plan — Everything Local

**Document Version:** 1.0.0  
**Target Platform:** Pure Native Android (Kotlin, Jetpack Compose, Material 3)  
**Architecture:** Multi-module Android Project with Independent Application Targets  
**Prohibited Technologies:** React Native, Expo, EAS Build, WebView Wrappers, Capacitor, Cloud APK Builders

---

## 1. Executive Summary & Goals

Everything Local is transitioning from an Expo/hybrid mobile architecture to **two completely independent, production-grade native Android applications**:
1. **Everything Local — Customer App** (`com.ayushp0021.everythinglocal`)
2. **Everything Local Merchant — Seller App** (`com.ayushp0021.everythinglocal.merchant`)

Both native applications directly interface with the existing Everything Local Node.js/TypeScript backend (`http://localhost:4000` or local network/production IP) using standardized HTTP REST/JSON contracts, retaining all existing business logic, validation rules, financial precision (integer paise), and 3.0 km geospatial constraints.

---

## 2. Target Directory & Multi-Module Architecture

The native Android project is rooted in `android-native/` with Gradle Kotlin DSL:

```
android-native/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
├── gradlew
├── gradlew.bat
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── core/
│   ├── common/             # Utilities, Result wrapper, paise formatters, DispatcherProvider
│   ├── models/             # Shared Kotlin data models & Kotlinx.serialization DTOs
│   ├── network/            # Retrofit, OkHttp, AuthInterceptor, NetworkException handler
│   ├── database/           # Room DB, DAOs, offline cache entities
│   ├── authentication/     # TokenManager (EncryptedDataStore / DataStore), session state
│   └── designsystem/       # Material 3 Color palette, Typography, Brand components
├── customer/
│   └── app/                # Everything Local Customer Application (Application ID: com.ayushp0021.everythinglocal)
│       ├── build.gradle.kts
│       └── src/main/java/com/ayushp0021/everythinglocal/
│           ├── MainActivity.kt
│           ├── navigation/ # Compose Navigation Graph
│           ├── ui/         # Home, Categories, Search, ProductDetail, Cart, Checkout, Orders, Profile
│           └── viewmodels/
└── merchant/
    └── app/                # Everything Local Merchant Application (Application ID: com.ayushp0021.everythinglocal.merchant)
        ├── build.gradle.kts
        └── src/main/java/com/ayushp0021/everythinglocal/merchant/
            ├── MainActivity.kt
            ├── navigation/ # Compose Navigation Graph
            ├── ui/         # Dashboard, Products, AddProduct, BarcodeScanner (ML Kit), Orders, Inventory, Profile
            └── viewmodels/
```

---

## 3. Technology Stack & Dependencies

| Layer | Library / Tool | Rationale |
| :--- | :--- | :--- |
| **Language** | Kotlin 1.9.24+ | Modern, concise, null-safe native Android development |
| **UI Framework** | Jetpack Compose + Material 3 | Declarative UI, state management, warm amber & forest green design |
| **Networking** | Retrofit 2.11.0 + OkHttp 4.12.0 | High performance HTTP/REST client, multipart upload, auth interceptors |
| **Serialization** | Kotlinx Serialization | Type-safe JSON parser without reflection overhead |
| **Asynchrony** | Kotlin Coroutines & Flow | Non-blocking I/O, reactive UI state streams |
| **Persistence** | Jetpack DataStore Preferences + Room | Secure token storage and offline caching |
| **Image Loading** | Coil Compose | Fast, asynchronous image loading with placeholder fallbacks |
| **Barcode Scanner**| Google ML Kit Barcode Scanning | Ultra-fast on-device EAN-13, EAN-8, UPC-A, UPC-E, Code 128 detection |
| **Image Capture** | CameraX / Android Photo Picker | Direct hardware camera access and modern gallery integration |

---

## 4. Key Milestones

1. **Phase 1: Architecture & Audit (Current)**
   - Complete repository audit, API endpoint mappings, gap analysis, and migration blueprint.
2. **Phase 2: Project Scaffold & Core Modules**
   - Gradle build scripts (`settings.gradle.kts`, root `build.gradle.kts`).
   - `core:models`, `core:network`, `core:authentication`, `core:designsystem`.
3. **Phase 3: Customer Application Implementation**
   - Location discovery, home feeds, category navigation, real-time search, cart drawer, checkout stepper, orders tracking.
4. **Phase 4: Merchant Application Implementation**
   - Merchant authentication, live dispatch console, catalogue management, stock updates.
5. **Phase 5: Native Device Features**
   - ML Kit live barcode scanner with manual fallback.
   - Native camera capture & gallery image picker with multipart upload to `/api/upload/image`.
6. **Phase 6: Local Gradle Builds & Release Artifacts**
   - Scripted automated build via `scripts/build-android.ps1`.
   - Production of `release/customer/EverythingLocal-Customer.apk` and `release/merchant/EverythingLocal-Merchant.apk`.
