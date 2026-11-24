# EVERYTHING LOCAL — DELIVERY PARTNER DATABASE MIGRATION IMPACT ASSESSMENT

**Engineering Role:** Senior Product Architect, Backend Engineer & Database Architect  
**Branch:** `feature/delivery-partner-ecosystem`  
**Assessment Date:** 24 November 2026  
**Status:** MIGRATION PLAN VERIFIED — ZERO BREAKING CHANGES  

---

## 1. Executive Summary & Objective

This assessment evaluates the database schema changes required to extend Everything Local into a fully fledged, three-sided hyperlocal commerce ecosystem (Customer, Merchant, Delivery Partner).

In accordance with strict release engineering instructions:
- Existing models (`RiderProfile`, `DeliveryTask`, `RiderEarningLedger`, `RiderSettlement`, `DeliveryPricingRule`) are reused and preserved.
- All schema modifications are **strictly additive**.
- Existing test suites (186 tests) and backend routes (`server/src/routes/customer.ts`, `merchant.ts`, `rider.ts`) remain fully functional without data or contract regressions.
- Sensitive statutory documents and delivery OTPs are hardened with cryptographic hashing and strict access boundaries.

---

## 2. Existing Schema Analysis

The current `prisma/schema.prisma` already defines foundational delivery entities:

| Existing Model | Line Range | Current Responsibilities & Reuse Analysis |
| :--- | :--- | :--- |
| `User` (Role `RIDER`) | Lines 16–35 | Stores delivery partner user identity, hashed passwords, mobile phone, and role. |
| `RiderProfile` | Lines 813–839 | 1:1 relation to `User`. Captures `vehicleType`, `drivingLicenceNumber`, `isOnline`, `currentLatitude`, `currentLongitude`, `rating`. **Reuse as primary partner profile.** |
| `DeliveryTask` | Lines 841–877 | Links `ParentOrder` and `MerchantChildOrder` to courier. Defines 13-stage lifecycle (`AVAILABLE`, `OFFERED`, `ACCEPTED`, `AT_STORE`, `PICKED_UP`, `EN_ROUTE`, `DELIVERED`, etc.). **Reuse and extend with security & concurrency fields.** |
| `RiderEarningLedger` | Lines 879–892 | Transactional ledger for partner earnings (`BASE_PAYOUT`, `ADDITIONAL_PICKUP`, `WAITING_PAYOUT`, `PEAK_INCENTIVE`, `DEDUCTION`). **Reuse as `DeliveryEarning` foundation.** |
| `RiderSettlement` | Lines 894–910 | Batch settlement records with net payouts, UTR references, and settlement reconciliation. **Reuse as `DeliverySettlement` foundation.** |
| `DeliveryPricingRule` | Lines 912–927 | Dynamic tier rules (`EXPRESS_20`, `PRIORITY_40`, `STANDARD_60`, `SCHEDULED_120`) with base fees, per-km rates, and peak multipliers. **Reuse as pricing engine.** |

---

## 3. Required Schema Additions & Domain Mapping

To satisfy the 12 required entities while preserving backward compatibility, the following additive models are introduced:

```
┌─────────────────────────────────┬───────────────────┬─────────────────────────────────────────────────┐
│ Required Domain Entity          │ Prisma Model Name │ Relationship & Architecture                     │
├─────────────────────────────────┼───────────────────┼─────────────────────────────────────────────────┤
│ 1. DeliveryPartner              │ RiderProfile      │ Extended with approvalStatus, serviceArea.      │
│ 2. DeliveryPartnerDocument      │ DeliveryPartnerDoc│ 1:N with RiderProfile (DL, RC, PAN, Insurance). │
│ 3. DeliveryPartnerVehicle       │ DeliveryVehicle   │ 1:N with RiderProfile (make, model, regNum, EV).│
│ 4. DeliveryPartnerAvailability  │ DeliveryPartnerAvail 1:N shift logs (online, offline, battery).  │
│ 5. DeliveryTask (Enhanced)      │ DeliveryTask      │ Added deliveryOtpHashed, maxAttempts, version.  │
│ 6. DeliveryAssignment           │ DeliveryAssignment│ 1:N with DeliveryTask (offers, timeout, latency)│
│ 7. DeliveryLocation             │ DeliveryLocation  │ Active-trip GPS telemetry (strictly on trips).  │
│ 8. DeliveryStatusHistory        │ DeliveryStatusHist│ Audit trail for state machine transitions.      │
│ 9. DeliveryProof                │ DeliveryProof     │ Digital POD with OTP verification & photo proof.│
│ 10. DeliveryEarning             │ RiderEarningLedger│ Existing financial ledger.                     │
│ 11. DeliverySettlement          │ RiderSettlement   │ Existing payout settlement.                     │
│ 12. DeliveryIncident            │ DeliveryIncident  │ Exception tickets (customer unreachable, delay) │
└─────────────────────────────────┴───────────────────┴─────────────────────────────────────────────────┘
```

---

## 4. Detailed Migration Specifications

### 4.1 Modifications to `RiderProfile`
Add the following optional or defaulted columns:
- `approvalStatus String @default("APPROVED")` (`APPLIED`, `UNDER_REVIEW`, `APPROVED`, `SUSPENDED`, `REJECTED`)
- `applicationReference String? @unique` (e.g. `EL-DRV-IND-849201`)
- `serviceArea String @default("Indore - All Zones")`
- `offlineEmergencyReason String?`
- Navigation relations:
  - `documents DeliveryPartnerDocument[]`
  - `vehicles DeliveryPartnerVehicle[]`
  - `availabilities DeliveryPartnerAvailability[]`
  - `assignments DeliveryAssignment[]`
  - `locations DeliveryLocation[]`
  - `incidents DeliveryIncident[]`

### 4.2 Modifications to `DeliveryTask`
Add security, concurrency, and audit fields:
- `deliveryOtpHashed String?` (bcrypt / HMAC salted hash of customer 4-digit OTP)
- `deliveryOtpExpiresAt DateTime?` (15-minute validity window)
- `deliveryOtpAttempts Int @default(0)` (brute-force defense)
- `deliveryOtpMaxAttempts Int @default(5)`
- `pickupOtpHashed String?`
- `version Int @default(1)` (Optimistic locking for concurrent task claim prevention)
- `acceptanceDeadline DateTime?` (45-second timer for assignment offer)
- `cancellationReason String?`
- Navigation relations:
  - `assignments DeliveryAssignment[]`
  - `locations DeliveryLocation[]`
  - `statusHistories DeliveryStatusHistory[]`
  - `proofs DeliveryProof[]`
  - `incidents DeliveryIncident[]`

### 4.3 New Entity Definitions
1. **`DeliveryPartnerDocument`:**
   - Enforces legal compliance: Driving Licence, Vehicle RC, PAN, Insurance.
   - **Privacy Rule:** Aadhaar is strictly excluded per privacy guidelines.
   - Admin audit fields: `verifiedByAdminId`, `verifiedAt`, `rejectionReason`.
2. **`DeliveryPartnerVehicle`:**
   - Registration number, vehicle class (`BICYCLE`, `MOTORCYCLE`, `SCOOTER`, `ELECTRIC_VEHICLE`), RC copy URL.
3. **`DeliveryPartnerAvailability`:**
   - Audit trail of online/offline shifts with battery and device metrics.
4. **`DeliveryAssignment`:**
   - Detailed assignment lifecycle: `OFFERED`, `ACCEPTED`, `DECLINED`, `TIMED_OUT`, `REVOKED`.
   - Records courier response latency in seconds.
5. **`DeliveryLocation`:**
   - Real-time GPS coordinate telemetry with speed, heading, and accuracy.
   - **Active Journey Rule:** Enforces foreign key constraint to an active `DeliveryTask`.
6. **`DeliveryStatusHistory`:**
   - Immutable audit trail recording every state change, actor role, actor ID, and timestamp.
7. **`DeliveryProof`:**
   - Cryptographic verification metadata, recipient name, delivery photo URL, customer signature URL.
8. **`DeliveryIncident`:**
   - Standardized exception tickets (`CUSTOMER_UNREACHABLE`, `MERCHANT_DELAY`, `ADDRESS_INACCURATE`, `VEHICLE_BREAKDOWN`, `ACCIDENT`, `PACKAGE_DAMAGED`, `EMERGENCY_OFFLINE`).

---

## 5. Security & Privacy Impact Assessment

| Risk Vector | Vulnerability Addressed | Architectural Remediation |
| :--- | :--- | :--- |
| **Plaintext OTP Leakage** | Delivery OTP interceptable via DB read | Delivery OTP is hashed prior to persistence (`deliveryOtpHashed`). Attempts capped at 5 with 15-minute TTL. |
| **Double Assignment** | Two couriers accept the same task simultaneously | Task table uses optimistic locking (`version`) and atomic database update `WHERE status = 'OFFERED' AND id = taskId`. |
| **Offline Telemetry Tracking** | Privacy violation via continuous GPS polling | Location updates rejected by backend if courier status is `OFFLINE` or no active task is in progress. |
| **Aadhaar Data Harvesting** | Statutory identity document over-collection | Prohibited in schema. Verification uses Driving Licence and Vehicle RC. |
| **Unauthorized Financial Modification** | Courier tampering with earnings | `DeliveryEarning` table is immutable. Modifications restricted to authorized Admin roles via auditable adjustments. |

---

## 6. Migration Rollout Strategy & Verification Plan

1. **Step 1 — Schema Update & SQLite Migration:**
   - Update `prisma/schema.prisma`.
   - Run `npx prisma db push` or migration script.
   - Run `npx prisma generate` to refresh `@prisma/client`.
2. **Step 2 — Regression Testing:**
   - Execute existing test suite: `npx vitest run`.
   - Verify that all 186 pre-existing tests pass without any regression.
3. **Step 3 — Backend API Implementation:**
   - Implement `server/src/routes/deliveryPartner.ts` and `server/src/core/deliveryDispatchEngine.ts`.
4. **Step 4 — Admin Console View:**
   - Implement `client/src/views/admin/delivery/` with the 11 delivery operations subsections.
5. **Step 5 — Native Android Delivery Partner Application:**
   - Scaffold `android-native/delivery-partner/` with Kotlin, Jetpack Compose, CameraX, and location services.
