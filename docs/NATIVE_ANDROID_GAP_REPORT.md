# Native Android Gap Report — Everything Local

**Scope:** Comparison of Existing React Native / Expo Implementation vs. Target Native Jetpack Compose Architecture  
**Document Version:** 1.0.0

---

## 1. Architectural Divergences & Replacement Strategy

| Component / Layer | Existing Expo Implementation | Pure Native Android Strategy | Resolution / Gap Fix |
| :--- | :--- | :--- | :--- |
| **Runtime & Framework** | React Native 0.76.9 / Hermes JS engine | Kotlin 1.9.24 / ART / Jetpack Compose | Native APK compilation; zero JavaScript bridge overhead; faster startup time |
| **Navigation** | Expo Router (file-based routing) | Android Navigation Compose (`NavHost`, `composable`) | Type-safe native screen navigation with deep links and backstack control |
| **API Client** | Fetch API wrapper (`mobile/src/api/client.ts`) | Retrofit 2.11 + OkHttp 4.12 + Kotlinx Serialization | Strong compile-time typing, OkHttp connection pooling, automatic token interception |
| **Token Storage** | `expo-secure-store` | Jetpack DataStore / EncryptedSharedPreferences | Native Android Keystore integration for secure JWT persistence |
| **Barcode Scanner** | `expo-camera` (`onBarcodeScanned`) | Google ML Kit (`com.google.mlkit:barcode-scanning`) | Ultra-fast native ML model execution for EAN-13, EAN-8, UPC, Code 128 |
| **Image Picker / Capture** | `expo-image-picker` | Android 13+ Photo Picker (`ActivityResultContracts.PickVisualMedia`) + CameraX | Zero extra permissions required on Android 13+ for gallery; native hardware camera pipeline |
| **Design System** | Tailwind CSS / React Native StyleSheet | Material 3 (`androidx.compose.material3`) + Custom Tokens | Warm amber (`#F59E0B`), forest green (`#064E3B`), off-white surfaces (`#F8FAFC`) |

---

## 2. Security & Merchant Tenant Isolation

1. **Role Enforcement**:
   - `Customer` application cannot access merchant endpoints; endpoints require `x-store-id` and merchant role JWT verification.
   - `Merchant` application requires user role `MERCHANT` and injects `x-store-id` on all store mutations.
2. **Cleartext Traffic Policy**:
   - For local development against `http://10.0.2.2:4000` or local LAN IP, an Android Network Security Config (`network_security_config.xml`) is configured allowing loopback/LAN cleartext HTTP while enforcing HTTPS for production domains.
3. **Integer Currency Consistency**:
   - All financial operations strictly use integer paise (INR ₹1.00 = 100 paise) across Room database, data classes, and calculations to prevent floating point inaccuracies.

---

## 3. Preserved Working Features

1. **Geospatial 3.0 km Radius**:
   - Preserved server-side filtering via `Haversine` formula.
2. **Single-Store-Per-Order Rule**:
   - Cart prevents mixing items from multiple distinct merchants; customer is prompted to clear or switch store.
3. **₹299 Minimum Order Value (MOV)**:
   - Order quote API validates MOV and calculates progress bar.
4. **Barcode Catalogue Search**:
   - Connects to `/api/merchant/catalogue/lookup` with Open Food Facts and internal cache.
5. **Image Upload Pipeline**:
   - Real multipart upload to `/api/upload/image` saving to `uploads/` directory on server.
