# Pharmacy & Medical Module REST API Specification

Base URL: `/api/pharmacy`

---

## 1. Discovery & Medicine Catalogue

### 1.1 List Licensed Pharmacies
- **Endpoint**: `GET /api/pharmacy/stores`
- **Auth**: Public (Optional Coordinates)
- **Query Parameters**:
  - `lat` (number): Customer latitude
  - `lng` (number): Customer longitude
- **Response `200 OK`**:
```json
{
  "pharmacies": [
    {
      "id": "cl...",
      "name": "Apollo Pharmacy Palasia",
      "address": "5/1 New Palasia, Main Road",
      "distanceKm": 0.42,
      "deliveryEtaMinutes": 18,
      "is24x7": true,
      "licences": [
        { "formType": "FORM_20", "licenceNumber": "MP-IND-20-49201" },
        { "formType": "FORM_21", "licenceNumber": "MP-IND-21-49202" }
      ],
      "pharmacists": [
        { "name": "Pooja Verma, B.Pharm", "registrationNumber": "MPPC-48291" }
      ]
    }
  ]
}
```

### 1.2 Search Medicines Catalogue
- **Endpoint**: `GET /api/pharmacy/medicines`
- **Auth**: Public
- **Query Parameters**:
  - `q` (string): Search query (brand name or active salt)
  - `schedule` (string): Classification code (`OTC`, `SCHEDULE_H`, `SCHEDULE_H1`)
  - `category` (string): Category slug (`medicines`, `wellness`, `devices`, `first-aid`)
- **Response `200 OK`**:
```json
{
  "medicines": [
    {
      "id": "med-dolo-650",
      "name": "Dolo 650mg Tablet",
      "genericName": "Paracetamol 650mg",
      "manufacturer": "Micro Labs Ltd",
      "packaging": "Strip of 15 tablets",
      "mrpPaise": 3415,
      "sellingPricePaise": 3074,
      "requiresPrescription": false,
      "classificationCode": "OTC"
    }
  ]
}
```

---

## 2. Customer Prescription Workflows

### 2.1 Upload Prescription Document
- **Endpoint**: `POST /api/pharmacy/prescriptions/upload`
- **Auth**: Bearer Token (Customer)
- **Content-Type**: `multipart/form-data`
- **Body**: `prescription` (file: JPEG, PNG, PDF, WebP up to 10MB)
- **Response `200 OK`**:
```json
{
  "success": true,
  "file": {
    "fileKey": "rx-doc-1732239481234.pdf",
    "fileName": "Prescription_DrSharma.pdf",
    "mimeType": "application/pdf",
    "fileSizeBytes": 142091
  }
}
```

### 2.2 Submit Full Prescription
- **Endpoint**: `POST /api/pharmacy/prescriptions`
- **Auth**: Bearer Token (Customer)
- **Body**:
```json
{
  "pharmacyId": "pharmacy-apollo-palasia",
  "patientName": "Sunita Verma",
  "patientAge": 54,
  "patientGender": "FEMALE",
  "relationship": "MOTHER",
  "deliveryAddress": "Flat 302, Scheme 54, Vijay Nagar, Indore",
  "customerNotes": "Please deliver evening doses before 7 PM",
  "documents": [
    {
      "fileKey": "rx-doc-1732239481234.pdf",
      "fileName": "Prescription_DrSharma.pdf",
      "mimeType": "application/pdf",
      "fileSizeBytes": 142091
    }
  ]
}
```
- **Response `201 Created`**: Returns created `Prescription` object in `SUBMITTED` status.

### 2.3 List Customer Prescriptions
- **Endpoint**: `GET /api/pharmacy/prescriptions/my`
- **Auth**: Bearer Token (Customer)
- **Response `200 OK`**: Array of user's prescriptions with active status, quotation details, and tracking events.

### 2.4 Cancel Prescription
- **Endpoint**: `POST /api/pharmacy/prescriptions/:id/cancel`
- **Auth**: Bearer Token (Owner Customer)
- **Response `200 OK`**: Status updated to `CANCELLED`.

### 2.5 View Secure Document
- **Endpoint**: `GET /api/pharmacy/prescriptions/:id/documents/:docId/view`
- **Auth**: Bearer Token (Prescription Owner, Assigned Pharmacist, or Admin)
- **Response**: Binary stream of image or PDF with `Content-Type` and `Content-Disposition: inline`.

---

## 3. Pharmacist Clinical Review & Dispensing

### 3.1 List Inspection Queue
- **Endpoint**: `GET /api/pharmacy/console/prescriptions`
- **Auth**: Bearer Token (Registered Pharmacist)
- **Response `200 OK`**: List of assigned prescriptions with patient metadata, documents, and audit history.

### 3.2 Submit Clinical Review
- **Endpoint**: `POST /api/pharmacy/console/prescriptions/:id/review`
- **Auth**: Bearer Token (Registered Pharmacist)
- **Body**:
```json
{
  "decision": "APPROVED", // "APPROVED" | "PARTIALLY_APPROVED" | "ADDITIONAL_INFO_REQUIRED" | "REJECTED"
  "doctorName": "Dr. R. K. Mishra, MD",
  "doctorRegNo": "MP-MC-18294",
  "reviewNotes": "Valid prescription issued within 30 days. All doses clear.",
  "rejectionReason": null
}
```

### 3.3 Issue Quotation
- **Endpoint**: `POST /api/pharmacy/console/prescriptions/:id/quotation`
- **Auth**: Bearer Token (Registered Pharmacist)
- **Body**:
```json
{
  "items": [
    {
      "medicineId": "med-aug-625",
      "prescribedName": "Augmentin 625 Duo Tablet",
      "dispensedName": "Augmentin 625 Duo Tablet (Amoxycillin + Clavulanate)",
      "quantity": 10,
      "unitPricePaise": 2045,
      "isAvailable": true,
      "dosageInstructions": "1 tablet twice daily after meals for 5 days"
    }
  ],
  "deliveryFeePaise": 2900
}
```
- **Response `200 OK`**: Returns `PharmacyQuotation` with calculated subtotal, 5% GST (`taxPaise`), and final `totalPaise`. Prescription transitions to `AWAITING_CUSTOMER_CONFIRMATION`.

### 3.4 Customer Quotation Confirmation
- **Endpoint**: `POST /api/pharmacy/quotations/:id/confirm`
- **Auth**: Bearer Token (Customer)
- **Body**:
```json
{
  "paymentMethod": "COD" // "COD" | "UPI" | "CARD"
}
```
- **Response `200 OK`**: Creates `PharmacyOrder` (`ORDER_CREATED`).

### 3.5 Dispense Order
- **Endpoint**: `POST /api/pharmacy/console/orders/:id/dispense`
- **Auth**: Bearer Token (Registered Pharmacist)
- **Body**:
```json
{
  "dispenseItems": [
    {
      "medicineId": "med-aug-625",
      "batchNumber": "AUG-98214",
      "expiryDate": "2027-04-30",
      "quantity": 10
    }
  ]
}
```
- **Response `200 OK`**: Order updated to `DISPENSED` and statutory dispensing records logged.

---

## 4. Admin Pharmacy Governance

### 4.1 List Pharmacies for Governance
- **Endpoint**: `GET /api/pharmacy/admin/pharmacies`
- **Auth**: Bearer Token (Admin)

### 4.2 Verify / Suspend Pharmacy
- **Endpoint**: `POST /api/pharmacy/admin/pharmacies/:id/verify`
- **Auth**: Bearer Token (Admin)
- **Body**:
```json
{
  "isVerified": true
}
```
