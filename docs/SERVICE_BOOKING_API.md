# Everything Local — Service Booking API Reference

Base URL: `http://localhost:4000/api/services` (or production configured URL)

All authenticated requests require the header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Public Discovery Endpoints

### 1.1 List Active Service Categories
- **Method**: `GET /api/services/categories`
- **Auth**: None (Public)
- **Response**:
```json
{
  "categories": [
    {
      "id": "cm...1",
      "name": "Salon & Grooming",
      "slug": "salon-grooming",
      "icon": "✂️",
      "description": "Haircuts, styling, beard grooming, facials and personal pampering.",
      "displayOrder": 1,
      "_count": { "services": 8 }
    }
  ]
}
```

---

### 1.2 Discover Service Providers
- **Method**: `GET /api/services/providers`
- **Auth**: None (Public)
- **Query Parameters**:
  - `q` (string, optional): Search keyword.
  - `category` (string, optional): Category slug (`salon-grooming`, `home-maintenance`, etc.).
  - `fulfillment` (string, optional): `ALL`, `SHOP_VISIT`, or `HOME_VISIT`.
  - `lat`, `lng` (float, optional): Customer coordinates for distance and serviceability calculation.
- **Response**:
```json
{
  "total": 4,
  "providers": [
    {
      "id": "cm...salon",
      "businessName": "Glamour & Glow Unisex Studio",
      "slug": "glamour-glow-salon",
      "description": "Premium hair styling and grooming studio in Vijay Nagar.",
      "categorySlug": "salon-grooming",
      "rating": 4.9,
      "reviewCount": 38,
      "hasShopVisit": true,
      "shopAddressLine": "G-12, Opposite C21 Mall, Main AB Road, Vijay Nagar",
      "hasHomeVisit": true,
      "homeVisitRadiusKm": 8.0,
      "homeVisitFeePaise": 4900,
      "distanceKm": 1.2,
      "isHomeVisitServiceable": true,
      "isShopVisitServiceable": true
    }
  ]
}
```

---

### 1.3 Get Full Provider Profile
- **Method**: `GET /api/services/providers/:id`
- **Auth**: None (Public)
- **Response**: Returns provider details, full active service catalogue with categories, staff members, and recent customer reviews.

---

### 1.4 Get Available Appointment Slots
- **Method**: `GET /api/services/slots?providerId=:providerId&date=YYYY-MM-DD`
- **Auth**: None (Public)
- **Response**:
```json
{
  "date": "2026-12-01",
  "slots": [
    { "timeSlot": "09:00 AM", "date": "2026-12-01", "isAvailable": true },
    { "timeSlot": "10:00 AM", "date": "2026-12-01", "isAvailable": false },
    { "timeSlot": "11:00 AM", "date": "2026-12-01", "isAvailable": true }
  ]
}
```

---

## 2. Customer Booking Endpoints

### 2.1 Create Service Booking
- **Method**: `POST /api/services/bookings`
- **Auth**: Required (`CUSTOMER`)
- **Body**:
```json
{
  "providerId": "cm...salon",
  "serviceId": "cm...haircut",
  "fulfillmentType": "SHOP_VISIT", // or "HOME_VISIT"
  "bookingDate": "2026-12-01",
  "timeSlot": "10:00 AM",
  "staffId": "cm...staff", // optional
  "customerAddressLine": "Flat 302, Silver Springs", // required for HOME_VISIT
  "customerLocality": "Palasia",
  "customerCity": "Indore",
  "customerLat": 22.7244,
  "customerLng": 75.8839,
  "instructions": "Need quiet service"
}
```
- **Response**: `201 Created` with full booking object, calculated fees, and initial status event.

---

### 2.2 List Customer Bookings
- **Method**: `GET /api/services/bookings`
- **Auth**: Required (`CUSTOMER`)
- **Response**:
```json
{
  "bookings": [
    {
      "id": "cm...bkg",
      "bookingNumber": "BKG-IND-234567-890",
      "status": "CONFIRMED",
      "bookingDate": "2026-12-01",
      "timeSlot": "10:00 AM",
      "fulfillmentType": "SHOP_VISIT",
      "serviceFeePaise": 49900,
      "travelFeePaise": 0,
      "totalAmountPaise": 49900,
      "provider": { "businessName": "Glamour & Glow Unisex Studio" },
      "service": { "title": "Men's Precision Fade & Beard Sculpting" }
    }
  ]
}
```

---

### 2.3 Cancel Booking
- **Method**: `POST /api/services/bookings/:id/cancel`
- **Auth**: Required (`CUSTOMER`)
- **Body**: `{ "reason": "Conflict with work meeting" }`
- **Response**: `200 OK` with updated booking and status `CANCELLED`.

---

### 2.4 Reschedule Booking
- **Method**: `POST /api/services/bookings/:id/reschedule`
- **Auth**: Required (`CUSTOMER`)
- **Body**: `{ "bookingDate": "2026-12-02", "timeSlot": "02:30 PM" }`
- **Response**: `200 OK` with updated booking.

---

### 2.5 Submit Service Review
- **Method**: `POST /api/services/bookings/:id/review`
- **Auth**: Required (`CUSTOMER`)
- **Body**: `{ "rating": 5, "comment": "Excellent haircut and punctual service!" }`
- **Response**: `201 Created` with saved review.

---

## 3. Service Provider Console Endpoints

### 3.1 Get Provider Console Data
- **Method**: `GET /api/services/provider/console`
- **Auth**: Required (Owner of `ServiceProvider`)
- **Response**: Returns provider profile, metrics (total bookings, revenue, pending action count), bookings list, staff, and earnings ledger.

---

### 3.2 Update Booking Status
- **Method**: `POST /api/services/provider/bookings/:id/status`
- **Auth**: Required (Owner of `ServiceProvider`)
- **Body**:
```json
{
  "status": "IN_PROGRESS", // "CONFIRMED", "PROVIDER_EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED", "REJECTED"
  "staffId": "cm...staff", // optional
  "note": "Specialist arrived at location"
}
```
- **Response**: `200 OK` with updated booking.

---

### 3.3 Create Service Offering
- **Method**: `POST /api/services/provider/services`
- **Auth**: Required (Owner of `ServiceProvider`)
- **Body**:
```json
{
  "title": "Deep Conditioning Hair Spa",
  "categoryId": "cm...cat",
  "description": "Nourishing argan oil hair spa with scalp massage.",
  "pricePaise": 79900,
  "mrpPaise": 119900,
  "durationMinutes": 60,
  "allowsShopVisit": true,
  "allowsHomeVisit": true
}
```
- **Response**: `201 Created` with new `ServiceListing`.

---

## 4. Platform Admin Endpoints

### 4.1 List All Providers
- **Method**: `GET /api/services/admin/providers`
- **Auth**: Required (`ADMIN`)

### 4.2 Verify / Moderate Provider
- **Method**: `POST /api/services/admin/providers/:id/verify`
- **Auth**: Required (`ADMIN`)
- **Body**: `{ "status": "VERIFIED" }` // or "SUSPENDED", "REJECTED"

### 4.3 Marketplace Bookings Monitor
- **Method**: `GET /api/services/admin/bookings`
- **Auth**: Required (`ADMIN`)
- **Response**: Returns all bookings with financial summaries (`totalGmvPaise`, `totalPlatformRevenuePaise`).
