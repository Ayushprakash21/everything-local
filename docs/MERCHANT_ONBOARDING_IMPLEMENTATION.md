# EVERYTHING LOCAL — MERCHANT ONBOARDING & STATUTORY VERIFICATION SYSTEM
## Production Architectural Specification & Implementation Document

**Version:** 2.0  
**Status:** IMPLEMENTED & VERIFIED  
**Audited Branch:** `repair/v2.0-master-architecture`  
**Target Market:** Indore, Madhya Pradesh, India  
**Date:** November 2026  

---

## 1. Executive Summary

The **Everything Local Merchant Partner Onboarding & Statutory Verification System** provides a complete, self-service, audit-compliant onboarding workflow for local businesses across Indore. It connects customer-facing discovery, native Android apps, a responsive web onboarding wizard, a dedicated merchant dashboard, and a central administrative verification desk (Control Tower).

### Core Pillars
1. **Zero Privilege Leakage:** Registration establishes user accounts with `CUSTOMER` authority only. Elevation to `MERCHANT` occurs strictly upon administrative approval and store activation.
2. **Statutory Integrity:** Indian regulatory requirements (FSSAI for Food/Grocery, GSTIN format validation, CDSCO/State Drug Licenses for Pharmacy) are enforced at the API layer prior to submission.
3. **MIME & Magic Bytes Security:** Uploaded statutory documents (PDF, JPEG, PNG, WebP) are validated at byte level; files are stored securely with path-traversal prevention and served solely through authenticated endpoints with applicant/admin authorization checks.
4. **Transparent Commission & Settlement:** Progressive commission tiers by category (e.g. 2.5% Pharmacy, 3.5% Grocery, 4.0% Electronics) and settlement schedules (T+1 Daily Payouts) are cryptographically accepted and logged with IP and user-agent audits.
5. **Multi-Platform Support:** Full parity across web (React 19 + TypeScript + Tailwind CSS) and Android native (Kotlin + Jetpack Compose + Retrofit).

---

## 2. Architecture & Data Model

The system introduces 6 relational models in `prisma/schema.prisma` integrated into the existing Postgres/Prisma database without creating detached schemas:

```
+--------------------+        +---------------------+        +--------------------+
|        User        |------->| MerchantApplication |------->|       Store        |
| (CUSTOMER/MERCHANT)| 1    * | (Reference, Status) | 1    1 | (Activated Store)  |
+--------------------+        +---------------------+        +--------------------+
                                      |      |
                    +-----------------+      +----------------+
                    |                                         |
            1       v *                               1       v 1
+--------------------------+                      +-----------------------+
|     MerchantDocument     |                      |  MerchantBankAccount  |
| (MIME, Magic Bytes, Path)|                      | (Masked, IFSC, Status)|
+--------------------------+                      +-----------------------+
                    |                                         |
            1       v *                               1       v *
+--------------------------+                      +-----------------------+
| MerchantAgreementAccept. |                      | OnboardingHistory     |
| (Rate %, Timestamp, IP)  |                      | (State Audit Trail)   |
+--------------------------+                      +-----------------------+
```

### Relational Schema Details

- **`MerchantApplication`**:
  - `applicationReference`: Unique identifier formatted as `EL-MAPP-XXXX` (e.g., `EL-MAPP-9842`).
  - `status`: Enum representing lifecycle state: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `DOCUMENTS_REQUIRED`, `APPROVED`, `REJECTED`, `SUSPENDED`, `WITHDRAWN`, `ACTIVE`.
  - `ownerId`: Foreign key to `User`.
  - `businessName`, `legalEntityName`, `businessType` (Proprietorship, Partnership, Pvt Ltd, LLP).
  - `gstin`, `panNumber`, `fssaiNumber`, `drugLicenseNumber`, `tradeLicenseNumber`.
  - `storeName`, `category`, `subCategory`, `address`, `city`, `pincode`, `latitude`, `longitude`.
  - `adminFeedback`, `rejectionReason`, `approvedAt`, `activatedStoreId`.
- **`MerchantDocument`**:
  - `docType`: `BUSINESS_PAN`, `GST_CERTIFICATE`, `FSSAI_LICENSE`, `DRUG_LICENSE`, `CANCELLED_CHEQUE`, `STOREFRONT_PHOTO`, `IDENTITY_PROOF`.
  - `filePath`, `originalName`, `mimeType`, `fileSizeBytes`, `magicBytesVerified`.
  - `verificationStatus`: `PENDING`, `VERIFIED`, `REJECTED`.
- **`MerchantBankAccount`**:
  - `accountHolderName`, `bankName`, `ifscCode`, `accountType`.
  - `accountNumberMasked`: Securely masked for display (`•••• •••• 1234`).
  - `verificationStatus`: `UNVERIFIED`, `PENNY_DROP_SUCCESS`, `VERIFIED`.
- **`MerchantAgreement` & `MerchantAgreementAcceptance`**:
  - Versioned legal contracts detailing category commission rates and settlement terms.
  - Audit trail with IP address, user agent, and timestamp.
- **`MerchantOnboardingHistory`**:
  - Complete state-transition journal recording `fromStatus`, `toStatus`, `changedByRole`, and reviewer `notes`.

---

## 3. Entry Points

Clear separation between consumer actions and merchant partner entry points:

1. **Website Footer (`client/src/App.tsx`):**
   - Direct link: *"Become a Merchant Partner"* linking to `/merchant/portal?mode=wizard`.
   - Partner highlights: *"Indore Quick Onboarding • Zero Setup Fee • Daily T+1 Payouts"*.
2. **Top Navigation User Menu (`client/src/components/Navbar.tsx`):**
   - Added *"Become a Merchant Partner"* button next to user profile.
3. **Merchant Portal (`client/src/views/merchant/MerchantPortalView.tsx`):**
   - Two distinct entry modes:
     - **Existing Merchant Login:** Direct credential authentication.
     - **Register Your Business:** Launches the multi-step onboarding wizard.
     - **Track Application Status:** Direct lookup using reference number.
4. **Android Native Customer App (`android-native/customer/.../ProfileScreen.kt`):**
   - Prominent card: *"Partner With Everything Local — Grow your retail business in Indore"*.
5. **Android Native Merchant App (`android-native/merchant/.../MerchantNavGraph.kt`):**
   - Registered `"onboarding"` route rendering `MerchantOnboardingScreen`.

---

## 4. Multi-Step Onboarding Wizard Workflow

The web wizard (`client/src/views/merchant/MerchantOnboardingWizard.tsx`) implements an 8-step responsive flow:

| Step | Section | Capabilities & Enforcement |
|------|---------|----------------------------|
| **1** | **Owner Details** | Full name, verified email, 10-digit mobile number, secure password. Generates `EL-MAPP-XXXX` reference and draft token. |
| **2** | **Business Profile** | Trade name, registered legal entity, constitution type (Proprietorship, Pvt Ltd, etc.). PAN & GSTIN formatting validation. |
| **3** | **Store Configuration** | Indore locality selection (Saket Nagar, Vijay Nagar, Palasia, Rajwada, Bhanwarkua), address, coordinates, category selection. |
| **4** | **Statutory Compliance** | Mandatory FSSAI for Grocery/Food; mandatory Drug License number for Pharmacy & Wellness. |
| **5** | **Delivery & Operations** | Delivery radius (km), operational hours, self-delivery vs. Everything Local logistics fleet fleet. |
| **6** | **Bank Details** | Bank name, IFSC code, account holder, account number with confirmation. Real-time masking to protect sensitive financial data. |
| **7** | **Document Upload** | Statutory documents upload. Real-time client preview, server-side magic byte inspection. |
| **8** | **Agreement & Submit** | Category commission schedule display, legally binding terms acceptance, comprehensive summary check, and submission. |

---

## 5. Document Upload Security & Magic Bytes Detection

File uploads to `/api/onboarding/application/:ref/documents` undergo rigorous validation:

1. **Storage Isolation:** Uploads are written to protected `uploads/documents/` outside public web directories.
2. **Magic Bytes Verification:** Inspects binary headers to prevent MIME spoofing:
   - **PDF:** `%PDF-` (`0x25 0x50 0x44 0x46`)
   - **JPEG:** `\xFF\xD8\xFF` (`0xFF 0xD8 0xFF`)
   - **PNG:** `\x89PNG\r\n\x1a\n` (`0x89 0x50 0x4E 0x47`)
   - **WebP:** `RIFF....WEBP` (`0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50`)
3. **Protected Retrieval:** Documents are downloaded via `/api/onboarding/application/:ref/documents/file/:filename`.
   - Rejects path-traversal tokens (`..`, `/`, `\`).
   - Requires valid JWT. Only the applicant who owns the application or an `ADMIN` can retrieve files.

---

## 6. Admin Control Tower & Verification Desk

Administrators manage applications via `AdminMerchantOnboardingView.tsx` within the Control Tower:

1. **Application Queue:** Real-time filtering by status (`ALL`, `SUBMITTED`, `UNDER_REVIEW`, `DOCUMENTS_REQUIRED`, `APPROVED`, `REJECTED`).
2. **Verification Modal:**
   - Full view of applicant profile, business identity, statutory licenses, and delivery parameters.
   - Secure document previews (PAN card, GST certificate, drug license).
   - Masked bank account verification.
3. **Administrative Actions:**
   - **Request Documents:** Changes status to `DOCUMENTS_REQUIRED` and attaches reviewer feedback.
   - **Reject:** Requires a mandatory statutory reason (e.g. invalid FSSAI, mismatched GST).
   - **Approve & Activate:**
     - Elevates user role from `CUSTOMER` to `MERCHANT`.
     - Automatically creates and activates the `Store` record.
     - Sets the store commission rate according to category standards.
     - Writes complete audit logs in `MerchantOnboardingHistory` and `AuditLog`.

---

## 7. API Endpoints Specification

### Applicant Endpoints (`/api/onboarding/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/agreements/current` | Returns active Indore merchant agreement & category commission table. |
| `POST` | `/start` | Step 1 owner info, creates draft application, returns JWT & reference. |
| `POST` | `/verify-phone-otp` | Verifies phone number OTP. |
| `GET` | `/application/:ref` | Fetches application state, documents, bank details, and history. |
| `PUT` | `/application/:ref/step/:stepNum` | Progressively saves steps 2 through 7. |
| `POST` | `/application/:ref/documents` | Uploads statutory document with magic byte inspection. |
| `GET` | `/application/:ref/documents/file/:filename` | Authenticated, traversal-safe document download. |
| `POST` | `/application/:ref/submit` | Final validation of required statutory fields and submission. |
| `POST` | `/application/:ref/withdraw` | Voluntarily withdraws application. |

### Administrative Endpoints (`/api/admin/onboarding/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/applications` | Lists all applications with status, category, and search filters. |
| `GET` | `/applications/:id` | Returns complete application dossier with documents and bank info. |
| `POST` | `/applications/:id/action` | Executes `APPROVE`, `REJECT`, `REQUEST_DOCUMENTS`, `SUSPEND`. |

---

## 8. Android Native Parity

Implemented in `android-native/`:
- **Models:** Added `MerchantApplicationDto`, `StartOnboardingRequest`, `StartOnboardingResponse`, `VerifyPhoneOtpRequest`, `ApplicationResponse` in `:core:models`.
- **Network Interface:** Added onboarding endpoints to `EverythingLocalApi.kt` in `:core:network`.
- **Repository:** Coroutine methods `startOnboarding()`, `getApplication()`, `saveStep()`, `submitApplication()` in `:merchant:app:MerchantRepository.kt`.
- **UI:** Multi-step Jetpack Compose wizard in `:merchant:app:MerchantOnboardingScreen.kt`.
- **Navigation:** Routed under `"onboarding"` in `MerchantNavGraph.kt`.
- **Customer Entry:** "Become a Merchant Partner" banner in `:customer:app:ProfileScreen.kt`.
- **Artifacts:** Debug APKs built and verified in `release/debug/`.
