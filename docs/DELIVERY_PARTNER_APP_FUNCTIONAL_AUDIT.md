# EVERYTHING LOCAL — DELIVERY PARTNER NATIVE ANDROID APP AUDIT

## 1. Application Identity & Build Configuration

- **Application Module**: `android-native/delivery-partner/app/`
- **Application ID**: `com.ayushp0021.everythinglocal.delivery`
- **Platform**: Native Android (Kotlin 2.0 / Jetpack Compose Material3)
- **Minimum SDK**: 24 (Android 7.0 Nougat)
- **Target SDK**: 35 (Android 15)
- **Compilation Status**: `:delivery-partner:app:compileDebugKotlin` — **BUILD SUCCESSFUL (0 errors)**

---

## 2. Branding & Visual Identity

### Visual Scheme
- **Primary Color**: High-Visibility Courier Blue (`#0284C7`)
- **Accent Color**: Rapid Transit Amber (`#F59E0B`)
- **Duty Indicators**: Active Emerald (`#10B981`) / Inactive Slate (`#94A3B8`)

### Resource Assets Generated
- `res/drawable/ic_launcher_delivery_background.xml`: Two-tone courier sky-blue vector.
- `res/drawable/ic_launcher_delivery_foreground.xml`: Electric scooter symbol with amber speed halo.
- `res/mipmap-anydpi-v26/ic_launcher.xml`: Adaptive icon definition.
- `res/mipmap-anydpi-v26/ic_launcher_round.xml`: Round adaptive icon definition.

---

## 3. Screen-by-Screen Functional Audit

### 1. `DeliveryLoginScreen.kt`
- **Phone Input**: Formats 10-digit mobile number with phone validation.
- **OTP Verification**: Numeric keypad with 6-digit verification.
- **State Handling**: Automatic routing to Onboarding wizard if profile is incomplete/draft, or Dashboard if verified.

### 2. `DeliveryOnboardingScreen.kt`
- **Section 1**: Full legal name, emergency contact name, and emergency phone.
- **Section 2**: Vehicle plate registration number, driving licence number, and optional PAN for tax withholding.
- **Section 3**: Bank account number and IFSC code for direct payouts.
- **Privacy Enforcement**: Notice explicitly informing courier that Aadhaar is legally excluded.

### 3. `DeliveryDashboardScreen.kt`
- **Online / Offline Switch**: Top prominent toggle.
- **Active Trip Lock**: Intercepts attempts to go offline while an active trip is assigned; launches emergency exception dialog.
- **Live Metrics Strip**: Completed trips count, courier rating (★), and unsettled balance in ₹.
- **45-Second Task Offer Cards**: Shows pickup store, dropoff customer address, estimated travel duration, and guaranteed payout in ₹.

### 4. `ActiveTripScreen.kt`
- **Merchant Store Arrival**: 1-click button to notify merchant (`AT_STORE`).
- **Handover Confirmation**: Verifies pickup handover and initiates customer transit.
- **Customer Dropoff Keypad**: Dedicated 4-digit PIN input for customer delivery OTP.
- **Incident & SOS Button**: Quick-access header icon for road emergencies, punctures, or customer unreachable reports.

### 5. `DeliveryEarningsScreen.kt`
- **Total Balance**: Real-time aggregated payout balance.
- **Ledger Entries**: Detailed breakdown displaying base pay, multi-pickup bonuses, and peak surges.
- **Settlement Batches**: Processed bank transfer records.

### 6. `DeliveryProfileScreen.kt`
- **Courier Badge**: Unique ID (`EL-RDR-IND-XXX`), verification chip, and vehicle specs.
- **Indore Grid Service Area**: Active operating zone.
- **Emergency Helpline**: Direct SOS dialer (1800-LOCAL-HELP).
- **Session Logout**: Secure credential revocation.

---

## 4. Hardware & Runtime Testing Gate

> [!IMPORTANT]
> **Runtime Device Testing Gate: EXPLICITLY BLOCKED**
> 
> The development environment lacks a local Android emulator binary and connected physical hardware (`adb devices` returns 0 connected devices).
> While the native source code compiles with **zero errors** and all backend APIs are 100% verified via automated integration tests, runtime physical execution remains marked **BLOCKED** until device sideloading is performed.
