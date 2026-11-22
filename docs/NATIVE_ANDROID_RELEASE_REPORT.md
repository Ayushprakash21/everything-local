# Everything Local — Native Android Multi-Application Delivery Report

**Release Date:** 2026-11-22  
**Platform:** Pure Native Android (Kotlin, Jetpack Compose, Material 3)  
**SDK Target:** Android 15 (API level 35), Min SDK: Android 7.0 (API level 24)  
**Architecture:** Multi-Project Gradle Build with Modular Core Libraries

---

## 1. Executive Summary

In accordance with the Master Engineering Prompt, Everything Local has been completely transitioned to **two independently installable, genuine native Android applications** built with modern Kotlin, Jetpack Compose, Material 3, and Gradle Kotlin DSL:

1. **Everything Local — Customer Application**
   - **Application ID:** `com.ayushp0021.everythinglocal`
   - **Artifact Location:** `release/customer/EverythingLocal-Customer.apk`
   - **Binary Size:** 17.72 MB (18,583,926 bytes)
   - **Primary Capabilities:** Geolocation discovery within 3.0 km service radius, live search, 12 department categories, promotional carousel, product cards with MRP/discount badges, single-store cart with ₹299 MOV progress bar, store pickup vs delivery toggle, live order history.

2. **Everything Local Merchant — Seller Application**
   - **Application ID:** `com.ayushp0021.everythinglocal.merchant`
   - **Artifact Location:** `release/merchant/EverythingLocal-Merchant.apk`
   - **Binary Size:** 40.63 MB (42,603,235 bytes, includes Google ML Kit barcode models)
   - **Primary Capabilities:** Store dispatch console (Accept, Preparing, Ready, Delivered), catalogue management, stock adjustment steppers (+/-), live on-device Barcode Scanning via Google ML Kit and CameraX (EAN-13, EAN-8, UPC-A, UPC-E, Code 128), and native gallery/camera image upload (`POST /api/upload/image`).

---

## 2. Multi-Module Project Architecture

```
android-native/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
├── local.properties
├── gradlew.bat
├── core/
│   ├── common/              # NetworkResult, paise formatters, distance formatters
│   ├── models/              # Kotlinx.serialization DTOs (User, Store, Product, Cart, Order)
│   ├── network/             # Retrofit 2.11, OkHttp 4.12, Auth & Tenant Interceptors
│   ├── database/            # Room database and offline cache entities
│   ├── authentication/      # Jetpack DataStore session manager (Token, Role, StoreId)
│   └── designsystem/        # Material 3 Warm Amber & Forest Green Theme, ProductCard, CategoryTile
├── customer/
│   └── app/                 # com.ayushp0021.everythinglocal (Customer App)
└── merchant/
    └── app/                 # com.ayushp0021.everythinglocal.merchant (Merchant App)
```

---

## 3. Native Features & Device Integrations

### A. On-Device Barcode Scanner (ML Kit)
- **Engine:** Google ML Kit Barcode Scanning (`com.google.mlkit:barcode-scanning:17.3.0`)
- **Camera Pipeline:** CameraX (`androidx.camera:camera-camera2:1.3.4`)
- **Supported Symbologies:** EAN-13, EAN-8, UPC-A, UPC-E, Code 128, QR Code
- **Integration:** Directly auto-populates product details via `/api/merchant/catalogue/lookup?barcode=...` with Open Food Facts and internal catalog fallback.

### B. Native Image Upload
- **Engine:** Android Photo Picker (`ActivityResultContracts.GetContent`)
- **Backend API:** `POST /api/upload/image` (multipart/form-data, Bearer token authentication)
- **Storage:** Persisted to server storage and immediately available via HTTPS / HTTP URLs.

### C. Design System
- **Theme:** Warm Amber primary (`#F59E0B`, `#D97706`), Deep Forest Green secondary (`#064E3B`, `#047857`), clean off-white background (`#F8FAFC`).
- **Typography & Components:** High-density e-commerce layouts, rounded cards (`rounded-2xl`), responsive quantity steppers, and floating bottom cart bars.

---

## 4. Local Build Script

Run the automated build script in PowerShell from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/build-android.ps1"
```

The script:
1. Validates OpenJDK version (`openjdk 21.0.12.1`).
2. Validates Android SDK platforms (`android-35`) and build tools.
3. Compiles the Customer application (`:customer:app:assembleDebug`).
4. Compiles the Merchant application (`:merchant:app:assembleDebug`).
5. Places both output APKs in `release/customer/` and `release/merchant/`.

---

## 5. Phone Installation Guide

### Via ADB (USB Debugging):
```bash
# 1. Install Customer App
adb install -r release/customer/EverythingLocal-Customer.apk

# 2. Install Merchant App
adb install -r release/merchant/EverythingLocal-Merchant.apk
```

### Via Direct Transfer:
1. Copy the APK files to your Android phone via USB, Google Drive, or local file share.
2. Open Files / File Manager on your phone.
3. Tap each APK to install ("Allow from this source" when prompted).
