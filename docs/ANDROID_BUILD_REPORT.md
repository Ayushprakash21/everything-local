# Everything Local — Android Build Report

**Date:** November 23, 2026  
**Auditor / Build Engineer:** Senior Android Engineer & Mobile Release Engineer  
**Git Branch:** `repair/v2.0-master-architecture`  
**Native Source Directory:** `android-native/`  
**Release Output Directory:** `release/debug/`  

---

## 1. Executive Summary

A native Android compilation was executed using the first-class multi-module Jetpack Compose & Kotlin project located in `android-native/`. Both the **Customer Application** and the **Merchant Application** were successfully compiled into debug APKs using Gradle 8.10.2 and Android Gradle Plugin (AGP) 8.6.0.

No Expo framework or React Native wrappers were introduced; the native build pipeline operates cleanly on modern Android 15 (API level 35) target SDK and Android 7.0 (API level 24) minimum SDK.

---

## 2. Build Environment & Toolchain

| Component | Specification / Path |
| :--- | :--- |
| **Operating System** | Windows 11 Pro (x64) |
| **Java Development Kit** | OpenJDK 21.0.12.1 LTS (`C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot`) |
| **Android SDK** | `C:\Users\Ayush\AppData\Local\Android\Sdk` |
| **Compile SDK / Target SDK** | API Level 35 (Android 15) |
| **Minimum SDK** | API Level 24 (Android 7.0 Nougat) |
| **Build Tools** | 35.0.0 (`aapt`, `d8`, `zipalign`, `apksigner`) |
| **Gradle** | 8.10.2 (Gradle Wrapper `gradlew.bat`) |
| **Android Gradle Plugin (AGP)** | 8.6.0 |
| **Kotlin Version** | 2.0.0 |
| **Jetpack Compose BOM** | 2024.09.00 |

---

## 3. Compiled Artifacts & Package Badging

### 3.1 Customer Application Debug APK
- **Application Label:** `Everything Local`
- **Package ID:** `com.ayushp0021.everythinglocal`
- **Version Code:** `1`
- **Version Name:** `1.0.0`
- **File Name:** `EverythingLocal-Customer-debug.apk`
- **File Size:** `18,583,926 bytes` (~17.72 MB)
- **SHA-256 Checksum:**  
  `095B5BFB2654CEE61A764E822B32852C45C8EDC31A93DC0EE80BB80C00FF98B3`
- **Output Path (Native Gradle):**  
  `android-native/customer/app/build/outputs/apk/debug/app-debug.apk`
- **Distribution Path:**  
  `release/debug/EverythingLocal-Customer-debug.apk`

### 3.2 Merchant Application Debug APK
- **Application Label:** `Everything Local Merchant`
- **Package ID:** `com.ayushp0021.everythinglocal.merchant`
- **Version Code:** `1`
- **Version Name:** `1.0.0`
- **File Name:** `EverythingLocal-Merchant-debug.apk`
- **File Size:** `42,603,235 bytes` (~40.63 MB)
- **SHA-256 Checksum:**  
  `FA7BDF6AFD70674DC86CCEF51E0E269DE66E3F37394275A463B75B33A7392EF4`
- **Output Path (Native Gradle):**  
  `android-native/merchant/app/build/outputs/apk/debug/app-debug.apk`
- **Distribution Path:**  
  `release/debug/EverythingLocal-Merchant-debug.apk`

---

## 4. Multi-Module Native Architecture

The native project divides responsibility cleanly across shared core libraries and individual app modules:

```
android-native/
├── settings.gradle.kts           # Root: "everything-local-native"
├── build.gradle.kts              # Root AGP & Kotlin configuration
├── core/
│   ├── common/                   # Resource utilities, Dispatchers, Paise formatting
│   ├── models/                   # Shared Kotlinx Serialization models (User, Store, Product, Cart, Order)
│   ├── network/                  # Retrofit 2, OkHttp, Auth interceptor, EverythingLocalApi
│   ├── database/                 # Local caching and Room persistence
│   ├── authentication/           # Encrypted SessionManager & DataStore token lifecycle
│   └── designsystem/             # Material 3 tokens, brand colors (Navy #0B1F3A, Amber #F5B82E, Green #10B981)
├── customer/
│   └── app/                      # Customer UI: Home, Search, Cart, Orders, Profile
└── merchant/
    └── app/                      # Merchant UI: Dashboard, Catalogue, Barcode Scanner, Orders, Settlement
```

---

## 5. Build Reproduction Commands

To reproduce the debug APK builds from the repository root:

```powershell
# 1. Ensure JAVA_HOME is configured for JDK 21
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"

# 2. Navigate to native android workspace
cd "android-native"

# 3. Clean and build Customer Debug APK
.\gradlew.bat :customer:app:assembleDebug

# 4. Clean and build Merchant Debug APK
.\gradlew.bat :merchant:app:assembleDebug
```

---

## 6. Network & Environment Configuration

1. **Local Emulator Communication:**
   - Both applications default to `http://10.0.2.2:4000/api/` in `NetworkClient.kt`, allowing Android emulators to communicate directly with the backend API running on the host machine (`http://localhost:4000`).
2. **Physical Device Communication:**
   - On physical test devices connected over local Wi-Fi, change the base URL in `core:network` or pass your machine's local LAN IP (e.g., `http://192.168.1.X:4000/api/`).
3. **Cleartext HTTP:**
   - Both `customer/app/src/main/AndroidManifest.xml` and `merchant/app/src/main/AndroidManifest.xml` have `android:usesCleartextTraffic="true"` configured, allowing unencrypted HTTP traffic during local development and testing.
