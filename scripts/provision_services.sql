
-- 1. Service Categories
INSERT INTO ServiceCategory (id, name, slug, icon, description, displayOrder, isActive, createdAt, updatedAt) VALUES
  ('cat-srv-salon', 'Salon & Grooming', 'salon-grooming', '✂️', 'Haircuts, styling, beard grooming, facials and personal pampering.', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-srv-beauty', 'Beauty & Wellness', 'beauty-wellness', '💄', 'Bridal makeup, party makeover, skincare therapy and relaxing spa.', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-srv-maintenance', 'Home Maintenance', 'home-maintenance', '🔧', 'Certified electricians, plumbers, carpenters and appliance repairs.', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-srv-cleaning', 'Home Cleaning', 'home-cleaning', '🧹', 'Deep home cleaning, bathroom descaling, kitchen sanitization & sofa wash.', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-srv-vehicle', 'Vehicle Services', 'vehicle-services', '🚗', 'Doorstep car wash, bike servicing, detailing and breakdown inspection.', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat-srv-education', 'Education & Personal', 'education-personal', '📚', 'Verified home tutors, computer/laptop technicians and event photographers.', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, updatedAt=CURRENT_TIMESTAMP;

-- 2. Provider Users
INSERT INTO User (id, email, phone, name, passwordHash, role, createdAt, updatedAt) VALUES
  ('usr-srv-quickfix', 'quickfix.electric@everythinglocal.in', '9893110002', 'Manish Verma', '$2b$10$8DVDwr9vEYbu5v/5u.reMOo.OiTYoekXrko.ZnO83MBdGMK0WgoA.', 'MERCHANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-srv-quickfix-alias', 'quickfix.indore@everythinglocal.in', '9893110022', 'Manish Verma (Indore Desk)', '$2b$10$8DVDwr9vEYbu5v/5u.reMOo.OiTYoekXrko.ZnO83MBdGMK0WgoA.', 'MERCHANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-srv-glamour', 'glamour.salon@everythinglocal.in', '9893110001', 'Pooja Verma', '$2b$10$8DVDwr9vEYbu5v/5u.reMOo.OiTYoekXrko.ZnO83MBdGMK0WgoA.', 'MERCHANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-srv-sparkle', 'sparkle.cleaning@everythinglocal.in', '9893110003', 'Amit Patel', '$2b$10$8DVDwr9vEYbu5v/5u.reMOo.OiTYoekXrko.ZnO83MBdGMK0WgoA.', 'MERCHANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr-srv-autocare', 'autocare.indore@everythinglocal.in', '9893110004', 'Rakesh Chouhan', '$2b$10$8DVDwr9vEYbu5v/5u.reMOo.OiTYoekXrko.ZnO83MBdGMK0WgoA.', 'MERCHANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET passwordHash=excluded.passwordHash, updatedAt=CURRENT_TIMESTAMP;

-- 3. Service Providers
INSERT INTO ServiceProvider (
  id, ownerId, businessName, slug, description, profileImageUrl,
  contactPhone, contactEmail, categorySlug, isVerified, verificationStatus,
  commissionRatePct, rating, reviewCount, hasShopVisit, shopAddressLine,
  shopCity, shopPincode, shopLatitude, shopLongitude, hasHomeVisit,
  homeVisitRadiusKm, homeVisitFeePaise, isOpen, createdAt, updatedAt
) VALUES (
  'prov-srv-quickfix', 'usr-srv-quickfix', 'Indore QuickFix Electricians & AC Service', 'indore-quickfix-technicians',
  'Licensed, background-verified electricians, plumbers and AC technicians with 90-day warranty across Indore.',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80',
  '9893110002', 'quickfix.electric@everythinglocal.in', 'home-maintenance', 1, 'VERIFIED',
  12.0, 4.8, 64, 1, 'Shop 4, Industry House Complex, Old Palasia',
  'Indore', '452001', 22.7244, 75.8839, 1,
  9.0, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT(id) DO UPDATE SET businessName=excluded.businessName, updatedAt=CURRENT_TIMESTAMP;

INSERT INTO ServiceProvider (
  id, ownerId, businessName, slug, description, profileImageUrl,
  contactPhone, contactEmail, categorySlug, isVerified, verificationStatus,
  commissionRatePct, rating, reviewCount, hasShopVisit, shopAddressLine,
  shopCity, shopPincode, shopLatitude, shopLongitude, hasHomeVisit,
  homeVisitRadiusKm, homeVisitFeePaise, isOpen, createdAt, updatedAt
) VALUES (
  'prov-srv-glamour', 'usr-srv-glamour', 'Glamour & Glow Unisex Studio', 'glamour-glow-salon',
  'Premium hair styling, luxury facials and expert grooming studio in Vijay Nagar with doorstep home services.',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80',
  '9893110001', 'glamour.salon@everythinglocal.in', 'salon-grooming', 1, 'VERIFIED',
  10.0, 4.9, 38, 1, 'G-12, Opposite C21 Mall, Main AB Road, Vijay Nagar',
  'Indore', '452010', 22.7533, 75.8937, 1,
  8.0, 4900, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT(id) DO UPDATE SET businessName=excluded.businessName, updatedAt=CURRENT_TIMESTAMP;

-- 4. Provider Staff for QuickFix Electricians
INSERT INTO ProviderStaff (id, providerId, name, role, phone, isActive, createdAt) VALUES
  ('stf-qf-1', 'prov-srv-quickfix', 'Manish Verma', 'Chief Electrical Engineer', '9893110002', 1, CURRENT_TIMESTAMP),
  ('stf-qf-2', 'prov-srv-quickfix', 'Deepak Chouhan', 'AC & Refrigeration Specialist', '9893110023', 1, CURRENT_TIMESTAMP),
  ('stf-qf-3', 'prov-srv-quickfix', 'Rahul Sen', 'Senior Wiring & Appliance Specialist', '9893110024', 1, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET name=excluded.name;

-- 5. Service Listings for QuickFix Electricians
INSERT INTO ServiceListing (
  id, providerId, categoryId, title, description,
  pricePaise, mrpPaise, pricingType, durationMinutes, allowsShopVisit,
  allowsHomeVisit, materialIncluded, isActive, createdAt, updatedAt
) VALUES
  ('srv-qf-1', 'prov-srv-quickfix', 'cat-srv-maintenance',
   'Fan, Switch & Light Fixture Repair / Installation',
   'Troubleshooting electrical short circuits, switch replacement, decorative chandelier & ceiling fan installation.',
   19900, 29900, 'INSPECTION_FEE', 45, 0, 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('srv-qf-2', 'prov-srv-quickfix', 'cat-srv-maintenance',
   'Split AC Foam Jet Deep Clean & Servicing',
   'High-pressure water and antibacterial foam wash of indoor cooling coils and outdoor condenser with gas pressure check.',
   49900, 69900, 'FIXED', 60, 0, 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('srv-qf-3', 'prov-srv-quickfix', 'cat-srv-maintenance',
   'Water Purifier (RO) Complete Filter Replacement',
   'Membrane inspection, sediment filter change, TDS balancing and thorough sanitization.',
   39900, 55000, 'FIXED', 45, 1, 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('srv-qf-4', 'prov-srv-quickfix', 'cat-srv-maintenance',
   'Full Home Electrical Safety Audit & Inverter Wiring',
   'Comprehensive MCB load inspection, earthing test, inverter installation and heavy appliance surge protection.',
   79900, 119900, 'FIXED', 90, 0, 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET title=excluded.title, updatedAt=CURRENT_TIMESTAMP;

-- 6. Service Listings for Glamour & Glow Salon
INSERT INTO ServiceListing (
  id, providerId, categoryId, title, description,
  pricePaise, mrpPaise, pricingType, durationMinutes, allowsShopVisit,
  allowsHomeVisit, materialIncluded, isActive, createdAt, updatedAt
) VALUES
  ('srv-gl-1', 'prov-srv-glamour', 'cat-srv-salon',
   'Men Signature Haircut & Beard Sculpting',
   'Precision scissor and clipper cut, beard contouring, warm towel treatment & refreshing hair wash.',
   34900, 49900, 'FIXED', 45, 1, 1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('srv-gl-2', 'prov-srv-glamour', 'cat-srv-salon',
   'Women Precision Cut & Blowdry Styling',
   'Personalized hair consultation, volume layers or bob cut, nourishing wash and radiant blowout.',
   59900, 79900, 'FIXED', 60, 1, 1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('srv-gl-3', 'prov-srv-glamour', 'cat-srv-beauty',
   'O3+ Brightening Radiance Facial',
   'Deep cleansing, gentle lactic peel, facial acupressure massage and detox rubber mask.',
   119900, 159900, 'FIXED', 75, 1, 1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET title=excluded.title, updatedAt=CURRENT_TIMESTAMP;

-- 7. Realistic Demo Bookings for QuickFix Electricians (Indore)
INSERT INTO ServiceBooking (
  id, bookingNumber, customerId, providerId, serviceId, staffId,
  fulfillmentType, bookingDate, timeSlot, status, customerAddressLine,
  customerLocality, customerCity, customerPincode, customerLat, customerLng,
  instructions, serviceFeePaise, travelFeePaise, materialFeePaise, discountPaise,
  totalAmountPaise, commissionPaise, providerPayablePaise, platformRevenuePaise,
  paymentStatus, createdAt, updatedAt
) VALUES
  ('bk-srv-001', 'EB-SRV-2026-1001', 'usr-demo-customer-ayush', 'prov-srv-quickfix', 'srv-qf-2', 'stf-qf-2',
   'HOME_VISIT', '2026-11-24', '10:00 AM - 11:00 AM', 'COMPLETED', 'Flat 402, Royal Residency, Saket Nagar',
   'Saket Nagar', 'Indore', '452018', 22.7244, 75.8839,
   'Please call 10 minutes prior to arrival. AC outdoor unit on 4th floor balcony.',
   49900, 0, 0, 0, 49900, 5988, 43912, 5988, 'PAID', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bk-srv-002', 'EB-SRV-2026-1002', 'usr-demo-customer-ayush', 'prov-srv-quickfix', 'srv-qf-1', 'stf-qf-1',
   'HOME_VISIT', '2026-11-25', '02:00 PM - 03:00 PM', 'CONFIRMED', '142 Greater Kailash Road, Old Palasia',
   'Old Palasia', 'Indore', '452001', 22.7244, 75.8839,
   'Ceiling fan making clicking sound in drawing room.',
   19900, 0, 0, 0, 19900, 2388, 17512, 2388, 'PAID', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bk-srv-003', 'EB-SRV-2026-1003', 'usr-demo-customer-ayush', 'prov-srv-quickfix', 'srv-qf-3', 'stf-qf-3',
   'HOME_VISIT', '2026-11-25', '04:30 PM - 05:30 PM', 'PENDING_CONFIRMATION', 'Plot 28, Scheme 54, Vijay Nagar',
   'Vijay Nagar', 'Indore', '452010', 22.7533, 75.8937,
   'RO filter change and water TDS check.',
   39900, 0, 0, 0, 39900, 4788, 35112, 4788, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET status=excluded.status, updatedAt=CURRENT_TIMESTAMP;

-- 8. Provider Earnings Record for QuickFix Electricians
INSERT INTO ProviderEarning (
  id, providerId, bookingId, amountPaise, commissionPaise, netEarningPaise,
  payoutStatus, reference, createdAt
) VALUES (
  'earn-qf-001', 'prov-srv-quickfix', 'bk-srv-001', 49900, 5988, 43912,
  'SETTLED', 'IMPS-SETTLE-INDORE-SRV-001', CURRENT_TIMESTAMP
)
ON CONFLICT(id) DO UPDATE SET payoutStatus=excluded.payoutStatus;
