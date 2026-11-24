# Pharmacy & Medical Security Architecture

## 1. Zero Public Storage Boundary

A critical security vulnerability in typical e-commerce implementations is storing sensitive prescription uploads in publicly accessible directories (e.g. `/uploads` or public S3 buckets with predictable UUID paths). Any party guessing or enumerating filenames could access confidential patient health records.

In **Everything Local**:
- Prescription documents are saved exclusively to `secure_storage/prescriptions/` located outside the static file webroot.
- Direct web access to `http://localhost:4000/secure_storage/...` returns **HTTP 404 Not Found**.
- Prescription documents can **only** be accessed via the authenticated streaming API endpoint:
  ```
  GET /api/pharmacy/prescriptions/:id/documents/:docId/view
  ```

---

## 2. Magic Byte Signature Verification

Attackers often bypass file-extension restrictions by renaming executable binaries (`.exe`, `.sh`, `.php`) or malicious HTML/JS scripts to `.jpg` or `.pdf`.

The Everything Local ingestion engine reads raw buffer magic bytes before accepting any document:
```typescript
const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
const isPdf = buffer.slice(0, 5).toString('ascii').startsWith('%PDF');
const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
```
Any upload where the magic bytes do not match a valid image or PDF format is rejected with **HTTP 400 Bad Request** (`INVALID_FILE_SIGNATURE`).

---

## 3. Strict Authorization Matrix

Access to prescription documents and clinical review operations is protected by multi-level authorization middleware:

| Role | Access Permissions |
| :--- | :--- |
| **Prescription Owner (Customer)** | Can view their own submitted prescriptions, download their documents, review quotations, confirm, or cancel. |
| **Unrelated Customer** | **HTTP 403 Forbidden**. Cannot view or download documents of other patients. |
| **Unrelated Merchant (Retail/Grocery)** | **HTTP 403 Forbidden**. Retail merchants cannot access or inspect prescriptions. |
| **Registered Pharmacist (Assigned Pharmacy)** | Can view inspection queue for prescriptions assigned to their store, view streaming documents, review, issue quotations, and record dispensing. |
| **Registered Pharmacist (Different Pharmacy)** | **HTTP 403 Forbidden**. Cannot inspect prescriptions assigned to a rival chemist. |
| **Platform Administrator** | Read-only compliance audit and pharmacy licence oversight. |

---

## 4. Immutable Audit Trail

Every clinical or administrative touchpoint logs a permanent record in `PrescriptionAuditEvent`:
- `prescriptionId`
- `action`: `UPLOAD`, `SUBMIT`, `REVIEW`, `QUOTATION_ISSUED`, `CUSTOMER_CONFIRMED`, `DISPENSED`, `CANCELLED`, `ADMIN_OVERRIDE`
- `performedById`
- `performedByRole`
- `ipAddress`
- `details` (JSON payload of status changes, notes, or rejection reasons)

Audit events are append-only and cannot be mutated or purged through the application layer.
