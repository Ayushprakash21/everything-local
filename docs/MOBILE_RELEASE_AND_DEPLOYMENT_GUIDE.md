# EVERYTHING LOCAL — MOBILE RELEASE AND DEPLOYMENT GUIDE
## Native React Native & Expo Mobile Application (Android & iOS)

**App Name:** Everything Local  
**Package / Bundle ID:** `in.everythinglocal.app`  
**Deep Link Scheme:** `everythinglocal://`  
**Expo SDK:** v52.0  
**Navigation Engine:** Expo Router v4  

---

## 1. Architecture Overview
Everything Local Mobile is a genuine, high-performance native application engineered with React Native, Expo, and TypeScript. It is **not** a website inside a WebView, nor a Progressive Web App (PWA).

Both Customer Marketplace and Seller (Merchant) Consoles run natively within a single binary using role-based routing (`app/(customer)` and `app/(merchant)`). The application connects to the authoritative, integer-paise Everything Local backend server (`server/`).

### Device Capabilities Implemented:
- **Encrypted Credential Storage:** `expo-secure-store` encrypts user JWTs and session data using hardware-backed iOS Keychain and Android KeyStore.
- **GPS Hyperlocal Discovery:** `expo-location` requests device GPS permissions to query stores within a 3.0 km radius, with graceful fallback to Indore pilot coordinates (Palasia).
- **Camera & Visual Search:** `expo-camera` and `expo-image-picker` enable instant photo packaging search and seller product photo capture.
- **Push Notifications:** `expo-notifications` registers device push tokens and triggers native notifications on order placement and dispatch events.
- **Offline & Network Resilience:** `@react-native-community/netinfo` monitors connectivity with dynamic offline warning banners and persistent cache via `@react-native-async-storage/async-storage`.
- **Keyboard Safety & Navigation:** Platform-specific `KeyboardAvoidingView`, `SafeAreaProvider`, and native Android back button event handlers.

---

## 2. Development Setup

### Pre-requisites:
- Node.js v20+ / v24 LTS
- npm v10+
- Android Studio (for Android Emulator) or Physical Android Device (with USB debugging / Expo Go)
- Xcode (macOS only, for iOS Simulator)

### Running Locally:
```bash
# 1. Start the authoritative backend server (Port 4000)
npm run dev:server

# 2. In another terminal, start the Expo development server
cd mobile
npm start

# 3. Press 'a' to open on Android Emulator, or 'i' to open on iOS Simulator
# Or scan the QR code with Expo Go on a physical device
```

---

## 3. Build & Release Profiles (`mobile/eas.json`)

The repository includes a complete EAS (Expo Application Services) build configuration in `mobile/eas.json`.

### A. Android Installable APK (For Direct Device Testing)
To generate an installable standalone `.apk` for team and merchant device testing without requiring Google Play Store submission:

```bash
# Install EAS CLI globally if not already installed
npm install -g eas-cli

# Run internal preview build (Generates installable APK)
cd mobile
eas build --platform android --profile preview
```
*Output: Standalone `EverythingLocal.apk` directly downloadable and installable on any Android device.*

### B. Android Signed AAB (For Google Play Store Submission)
To generate a production signed Android App Bundle (AAB):

```bash
cd mobile
eas build --platform android --profile production
```
*Output: Signed `.aab` file ready for upload to Google Play Console.*

### C. iOS TestFlight / App Store Build
To generate an iOS production archive for Apple TestFlight:

```bash
cd mobile
eas build --platform ios --profile production
```
*Output: Signed `.ipa` submitted directly to Apple App Store Connect / TestFlight.*

### D. Local Bare React Native Build (No Cloud Dependency)
If you prefer building without EAS Cloud servers, generate the native Android and iOS source directories:

```bash
cd mobile
npx expo prebuild

# For Android:
cd android
./gradlew assembleRelease  # Generates release APK in android/app/build/outputs/apk/release/
```

---

## 4. Deep Links & App Links

The application registers the URL scheme `everythinglocal://` in `mobile/app.json`:
- `everythinglocal://` -> Opens App / Role Gateway
- `everythinglocal://store/:id` -> Directly opens Storefront
- `everythinglocal://orders/:id` -> Directly opens Order Tracking

---

## 5. Security & Safety Commitments
1. **No External Store Publishing Without Approval:** As requested, builds are not published to the Google Play Store or Apple App Store without explicit user authorization.
2. **Zero Paid Services Incurred:** Build configs run under standard free-tier development profiles.
3. **Backend & Data Preservation:** The backend database (`prisma/dev.db`), core financial engine (`server/src/core/finance.ts`), and geospatial engine remain authoritative and untouched.
4. **Zero Secrets in Binary:** API keys, database URLs, and JWT secrets are kept strictly server-side; the mobile client only receives signed ephemeral tokens.
