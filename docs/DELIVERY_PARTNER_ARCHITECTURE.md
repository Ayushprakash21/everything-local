# EVERYTHING LOCAL — THREE-SIDED HYPERLOCAL DELIVERY ARCHITECTURE

## 1. Executive Summary & Ecosystem Overview

Everything Local has evolved into a fully synchronized, three-sided hyperlocal commerce ecosystem:
1. **Customer Web & Android Application** (`com.ayushp0021.everythinglocal`)
2. **Merchant Partner Portal & Android Application** (`com.ayushp0021.everythinglocal.merchant`)
3. **Delivery Partner Native Android Application** (`com.ayushp0021.everythinglocal.delivery`)
4. **Delivery Operations Control Tower** (Central Web Admin Console)

This architecture eliminates disjointed courier operations by providing an end-to-end, real-time dispatch, route tracking, OTP-secured handover, and financial settlement pipeline specifically tailored for the Indore market.

---

## 2. Domain Entities & Database Schema

The system extends the PostgreSQL/Prisma foundation without breaking legacy customer or merchant flows:

```
┌─────────────────────────────────┐
│           ParentOrder           │
└───────────────┬─────────────────┘
                │ 1..N
┌───────────────▼─────────────────┐       1..N      ┌─────────────────────────────┐
│       MerchantChildOrder        │─────────────────►│        DeliveryTask         │
└─────────────────────────────────┘                 └──────────────┬──────────────┘
                                                                   │ 0..1
                                                    ┌──────────────▼──────────────┐
                                                    │        RiderProfile         │
                                                    └──────┬────────┬─────────────┘
                                                           │        │
                                    ┌──────────────────────┘        └─────────────────────┐
                                    ▼                                                     ▼
                     ┌─────────────────────────────┐                       ┌─────────────────────────────┐
                     │   DeliveryPartnerDocument   │                       │    RiderEarningLedger       │
                     └─────────────────────────────┘                       └─────────────────────────────┘
```

### Key Models Added:
1. **`RiderProfile`**: Represents registered delivery partners with their unique code (`EL-RDR-IND-XXX`), vehicle type, statutory licences, rating, online duty state, and active GPS coordinates.
2. **`DeliveryTask`**: Core logistics trip entity managing optimistic locking (`version`), 45-second broadcast expiration, pickup coordinates, dropoff coordinates, payout breakdown, attempt-limited hashed OTP, and lifecycle states.
3. **`DeliveryPartnerDocument`**: Secure storage for statutory compliance (Driving Licence, Vehicle RC, PAN, Insurance). Aadhaar collection is legally excluded.
4. **`DeliveryPartnerVehicle`**: Multimodal vehicle specifications (Motorcycle, Scooter, EV Scooter, Bicycle).
5. **`DeliveryPartnerAvailability`**: Historical duty shifts tracking online/offline intervals and emergency exception logs.
6. **`DeliveryAssignment`**: Concurrency-protected task dispatch offers with 45-second countdown deadlines.
7. **`DeliveryLocation`**: Active trip GPS breadcrumbs recorded strictly during active duty for courier privacy.
8. **`DeliveryStatusHistory`**: Immutable state audit trail tracking transitions (`OFFERED` -> `ACCEPTED` -> `AT_STORE` -> `PICKED_UP` -> `EN_ROUTE` -> `DELIVERED`).
9. **`DeliveryProof`**: Cryptographic OTP records, delivery photos, customer handover signatures, and recipient notes.
10. **`DeliveryIncident`**: Exception workflow records (vehicle breakdowns, customer unreachable, emergency offline transitions).
11. **`RiderEarningLedger`**: Double-entry ledger tracking base payouts, multi-pickup bonuses, and peak hour surges.
12. **`RiderSettlement`**: Batch payout records tracking direct bank transfers and UPI disbursements.

---

## 3. Autonomous Dispatch & Proximity Engine

```
[Merchant: Order Ready]
          │
          ▼
[Proximity Candidate Discovery (Radius <= 4km, Online Only)]
          │
          ▼
[Sort by: Distance ASC -> Workload ASC -> Courier Rating DESC]
          │
          ▼
[Broadcast Task Offer with 45-Second Atomic Reservation]
          │
    ┌─────┴─────────────────────────────────┐
    ▼                                       ▼
[Partner Accepts]                     [45s Timeout / Reject]
    │                                       │
[Status: ACCEPTED]                    [Cascade to Next Candidate]
    │
[Active Order Lock Engaged]
```

### Dispatch Invariants:
- **Optimistic Concurrency Control**: Tasks use atomic `version` increments on acceptance to prevent duplicate claims by competing couriers.
- **Cascading Fallback**: If an offered courier does not respond within 45 seconds, the assignment is marked `EXPIRED` and offered to the next highest-ranking candidate in the Indore grid.
- **Manual Dispatch Override**: Platform administrators can intervene via the Delivery Operations Console to manually route high-priority or unassigned orders.

---

## 4. Security & Cryptographic Handover Protocol

### 1. Proof of Delivery OTP Verification:
- **Plaintext vs Hash**: The customer order details API provides the plaintext 4-digit OTP strictly to the authenticated order owner. The `DeliveryTask` database record stores a **salted SHA-256 hash** (`deliveryOtpHashed`).
- **Attempt Rate Limiting**: Maximum 5 attempts allowed (`deliveryOtpMaxAttempts`). Incorrect attempts increment `deliveryOtpAttempts` and return remaining attempts. Exceeding 5 attempts locks the task and triggers a customer support alert.
- **Expiration Window**: Delivery OTPs expire after 60 minutes.

### 2. Active Order Duty Lock:
- Couriers holding trips in `ACCEPTED`, `AT_STORE`, `PICKED_UP`, or `EN_ROUTE` are strictly barred from toggling offline.
- Attempting to go offline returns `400 Bad Request` with `ACTIVE_DELIVERY_IN_PROGRESS`.
- **Emergency Exception**: Couriers experiencing vehicle punctures or medical emergencies can submit an emergency reason. This automatically:
  1. Creates a `DeliveryIncident` with type `EMERGENCY_OFFLINE`.
  2. Disassociates the courier and reverts the task to `AVAILABLE` for immediate reassignment.
  3. Transitions the courier safely to offline.

### 3. Location Telemetry & Courier Privacy:
- Location breadcrumbs are accepted and stored **strictly while the courier is online and actively assigned to a delivery trip**.
- Requests to update location while offline are rejected with `403 Forbidden`.

---

## 5. Mobile Application Architecture (Pure Jetpack Compose)

The Delivery Partner app is located in `android-native/delivery-partner/app/`:
- **Package**: `com.ayushp0021.everythinglocal.delivery`
- **Language**: Kotlin 2.0 with Jetpack Compose (Material3)
- **Zero Expo / Zero WebView**: 100% native Android UI components.
- **Branding**: High-visibility courier blue (`#0284C7`) and amber (`#F59E0B`).
- **Navigation Graph**:
  - `DeliveryLoginScreen`: Phone + OTP authentication.
  - `DeliveryOnboardingScreen`: 4-step partner statutory registration.
  - `DeliveryDashboardScreen`: Real-time duty switch, earnings snapshot, active trip banner, and 45s offer cards.
  - `ActiveTripScreen`: Step-by-step merchant store navigation, pickup confirmation, customer dropoff navigation, and 4-digit OTP keypad.
  - `DeliveryEarningsScreen`: Detailed ledger breakdown and settlement batch history.
  - `DeliveryProfileScreen`: Courier badge, vehicle specs, and 24/7 SOS helpline.
