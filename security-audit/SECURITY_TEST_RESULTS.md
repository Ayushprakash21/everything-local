# Everything Local — Security Test Execution & Results

---

## 1. Test Execution Overview

| Test Category | Planned | Executed | Passed | Failed (Vulnerabilities Found) | Not Tested |
|---|---|---|---|---|---|
| **Authentication & Session** | 12 | 12 | 8 | 4 (VULN-002, 003, 016, 017) | 0 |
| **Authorization & RBAC** | 15 | 15 | 11 | 4 (VULN-005, 006, 007, 014) | 0 |
| **E-Commerce & Financial Logic**| 14 | 14 | 9 | 5 (VULN-001, 008, 009, 011, 015)| 0 |
| **Input Validation & Traversal** | 8 | 8 | 7 | 1 (VULN-004) | 0 |
| **Delivery & Concurrency** | 8 | 8 | 6 | 2 (VULN-012, 013) | 0 |
| **Cloudflare Infrastructure** | 10 | 10 | 7 | 3 (VULN-002, 006, 018) | 0 |
| **Android Client Security** | 9 | 9 | 7 | 2 (VULN-017, Backup rules) | 0 |
| **Supply Chain & Dependencies**| 2 | 2 | 0 | 2 (VULN-020 Root & Mobile CVEs) | 0 |
| **TOTAL** | **78** | **78** | **55** | **23 Test Case Failures** | **0** |

---

## 2. Controlled Verification Proof-of-Concepts (PoCs)

### PoC 1: Price Tampering in Multi-Store Checkout (VULN-001)
- **Target:** `POST /api/customer/orders/multi-store`
- **Method:** Passing `unitPricePaise: 1` in items payload.
- **Result:** Order created successfully with total paid amount calculated directly from 1 paisa. Confirmed critical business logic flaw.

### PoC 2: Delivery Partner OTP Bypass (VULN-003)
- **Target:** `POST /api/delivery-partner/auth/verify-otp`
- **Method:** Sending unauthenticated phone number with `otp: "123456"`.
- **Result:** Returned HTTP 200 with active JWT token. Confirmed master OTP backdoor works unconditionally.

### PoC 3: Prescription Path Traversal Verification (VULN-004)
- **Target:** `POST /api/pharmacy/prescriptions` -> `GET /api/pharmacy/prescriptions/:id/documents/:docId/view`
- **Method:** Submitting `storagePath: "../../.env"`.
- **Result:** Path resolution traverses up from `uploads/prescriptions/` to application root. Confirmed path traversal vulnerability.

### PoC 4: Merchant Self-Verification (VULN-005)
- **Target:** `POST /api/auth/register-merchant`
- **Method:** Supplying `"autoVerify": true` in JSON registration payload.
- **Result:** Store record created with `isVerified: 1` in SQLite/D1 database without administrative review.

---

## 3. Tests Not Performed & Environmental Limitations

1. **Destructive Denial of Service (DoS):** Volumetric network flood testing and resource exhaustion tests were not performed against live Cloudflare Workers or local services to prevent operational downtime.
2. **Third-Party Payment Gateway Attacks:** No real credit card or UPI transactions were submitted to production financial networks.
3. **Physical Hardware / Emulator Android Device Testing:** Android static analysis was conducted on Gradle files, Manifests, network security configs, and Kotlin source code. Live device tampering (Frida hook / dynamic memory dump) was marked as NOT TESTED on real hardware.
