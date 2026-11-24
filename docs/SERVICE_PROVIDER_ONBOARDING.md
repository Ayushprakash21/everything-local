# Everything Local — Service Provider Onboarding & Management

## 1. Onboarding Requirements for Service Partners
Everything Local maintains rigorous standards for verified service partners in Indore. Before taking live customer bookings, providers must submit credentials for central administrator audit:

1. **Business Identity**: Registered legal entity name, trade name, GSTIN (if applicable), and physical workshop/salon address.
2. **Category Classification**: Assigned primary sector (`salon-grooming`, `beauty-wellness`, `home-maintenance`, `home-cleaning`, `vehicle-services`, `education-personal`).
3. **Location & Geospatial Coordinates**: Exact shop latitude and longitude in Indore for distance calculation and map routing.
4. **Coverage Radius**: Maximum operational radius for home visits (e.g. 8 km for salons, 10–12 km for deep cleaners and car washes).
5. **Staff Certifications**: Specialist certifications, background check disclosures, and professional experience years.

---

## 2. Service Catalogue Management

Providers can configure standardized or tiered service offerings directly from the **Service Partner Console**:

- **Service Title**: Clear, customer-friendly service name (e.g., *Men's Precision Fade & Beard Sculpting*, *Split AC Comprehensive Jet Service*).
- **Service Description**: Detailed breakdown of inclusions, steps, and materials used.
- **Duration**: Expected time in minutes (multiples of 15 minutes, typically 30 to 120 mins).
- **Pricing**:
  - `pricePaise`: Standard customer service charge in integer paise.
  - `mrpPaise`: Optional original price for showing discount percentage.
- **Fulfillment Permissions**:
  - `allowsShopVisit` (boolean): Whether customer can visit shop for this service.
  - `allowsHomeVisit` (boolean): Whether provider offers this service as a doorstep visit.

---

## 3. Team & Specialist Management (`ProviderStaff`)

Providers can register their team of specialists to optimize appointment routing:
- **Name & Mobile**: Specialist direct contact.
- **Role / Specialty**: Senior Stylist, Certified HVAC Technician, Master Groomer, etc.
- **Experience**: Total years of practical industry experience.
- **Photo URL**: Professional headshot displayed to customer during booking and dispatch.
- **Assignment**: Providers can assign specific staff members to confirmed bookings or allow automated assignment.

---

## 4. Commission Model & Provider Settlement

Everything Local charges a sustainable, transparent platform commission on completed service bookings:

- **Default Platform Commission Rate**: Configured per provider (typically 8.0% to 12.0%, depending on sector).
- **Earning Creation**: When a booking is confirmed, a corresponding `ProviderEarning` record is initialized in `PENDING` payout status.
- **Payout Release**: Once the booking reaches `COMPLETED` status, the payout transitions to `PROCESSED`.
- **Deductions Transparency**: The provider console displays gross booking value, commission deducted, and net payable earnings for every appointment.

### Example Settlement Calculation
- Service Fee: ₹499 (49,900 paise)
- Doorstep Travel Fee: ₹49 (4,900 paise)
- Total Amount: ₹548 (54,800 paise)
- Commission Rate: 10.0%
- Platform Commission: ₹54.80 (5,480 paise)
- **Net Provider Payable**: ₹493.20 (49,320 paise)

---

## 5. Administrative Moderation & Governance

Platform administrators retain full governance over provider listings:
- **Verification Review**: Admins review provider details in the Admin Console (`/admin`) under the **Services Marketplace** tab.
- **Status Toggles**:
  - `VERIFIED`: Provider is active, discoverable in search, and eligible to accept bookings.
  - `SUSPENDED`: Provider profile is paused and hidden from customer discovery due to policy violation or investigation.
  - `REJECTED`: Provider application denied during credential audit.
- **Marketplace Monitoring**: Centralized monitoring of active bookings, total GMV, platform revenue, and service completion ratios across Indore.
