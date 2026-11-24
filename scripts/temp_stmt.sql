-- 5. Service Listings for QuickFix Electricians
INSERT OR IGNORE INTO ServiceListing (
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
   79900, 119900, 'FIXED', 90, 0, 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);