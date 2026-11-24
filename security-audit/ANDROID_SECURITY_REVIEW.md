# Everything Local — Android Mobile Application Security Review

---

## 1. Mobile Ecosystem Architecture

The repository contains two mobile application codebases:
1. **Android Native Modules (`android-native/`):**
   - `customer/app` (Customer Hyperlocal Marketplace App)
   - `merchant/app` (Merchant Order & Catalogue Console)
   - `delivery-partner/app` (Delivery Partner Rider App)
   - `core/` (Authentication, Database, Network, DesignSystem, Models)
2. **React Native / Expo (`mobile/`):** Cross-platform mobile consumer experience.

---

## 2. Android Native Application Security Audit

### 2.1 Release Keystore & Signing Configuration
- **Location:** `android-native/keystore/`
- **Audit Findings:**
  - `everythinglocal-release.jks` and `keystore.properties` are stored in the local directory.
  - Verified `.gitignore`: `android-native/keystore/*.jks` and `android-native/keystore/keystore.properties` are ignored from git tracking. Only `keystore.properties.example` is committed.
  - **Verdict:** Secure. Private signing keys are not tracked in the public repository.

### 2.2 Network Security & TLS Configuration
- **Location:** `android-native/customer/app/src/main/res/xml/network_security_config.xml`
- **Audit Findings:**
  - `cleartextTrafficPermitted="false"` is strictly enforced for all base configs.
  - Plaintext HTTP requests are blocked by Android OS runtime.
  - **Verdict:** Pass. Cleartext traffic protection is active.

### 2.3 Application Backup & Sensitive Data Exposure (VULN-017)
- **Location:** `android-native/customer/app/src/main/AndroidManifest.xml`
- **Audit Findings:**
  - Line 10 sets `android:allowBackup="true"`.
  - In `SessionManager.kt`, session tokens (`auth_token`) are stored in unencrypted Jetpack Preferences DataStore (`everything_local_session`).
  - **Risk:** An attacker with device access or via `adb backup` can extract authentication tokens and session credentials.
  - **Verdict:** FAIL (MEDIUM). Must set `android:allowBackup="false"` or implement Android KeyStore-backed `EncryptedSharedPreferences`.

### 2.4 Arbitrary Custom Base URL Injection
- **Location:** `android-native/core/authentication/SessionManager.kt` (Lines 67-79)
- **Audit Findings:**
  - `KEY_CUSTOM_BASE_URL` allows setting an arbitrary API endpoint string without domain whitelisting.
  - **Recommendation:** Restrict custom base URLs to approved domains (`*.everythinglocal.in`, `*.workers.dev`) or restrict modification to debug builds (`BuildConfig.DEBUG`).

---

## 3. Expo / React Native Audit (`mobile/`)
- **Dependencies Audit:** 29 vulnerabilities identified in `mobile/package.json` (7 High, 3 Critical in build tools `tar`, `sucrase`, `xmldom`, `postcss`).
- **Remediation:** Update Expo SDK and run `npm audit fix` in the `mobile` workspace.
