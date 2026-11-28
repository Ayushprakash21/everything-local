import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';

/**
 * Safe, non-destructive Wholesale Marketplace provisioning script for remote D1.
 * Usage: npx tsx server/src/seedWholesale.ts --remote
 */
async function seedWholesaleRemote() {
  console.log('🚀 Provisioning EveryBazaar Wholesale Marketplace on remote D1...');

  const passwordHash = await bcrypt.hash('Password@123', 10);
  const escapedHash = passwordHash.replace(/'/g, "''");

  const sqlStatements = [
    // 1. Demo Wholesaler User Account (preserves existing password if already present)
    `INSERT OR IGNORE INTO "User" (
      id, email, phone, name, passwordHash, role, createdAt, updatedAt
    ) VALUES (
      'usr-whs-malwa', 'wholesaler@everythinglocal.in', '9893220001',
      'Rajesh Agrawal (Malwa Agro & FMCG)', '${escapedHash}', 'WHOLESALER',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );`,

    // 2. Approved Wholesaler Profiles
    `INSERT OR IGNORE INTO "WholesalerProfile" (
      id, userId, businessName, legalBusinessName, slug, businessType,
      hasGst, gstin, panNumber, businessAddress, city, state, pincode,
      contactName, contactPhone, contactEmail, serviceableRegions, paymentPreferences,
      verificationStatus, isVerified, approvedAt, createdAt, updatedAt
    ) VALUES (
      'whs-prof-malwa', 'usr-whs-malwa',
      'Malwa Agro & FMCG Distributors', 'Malwa Agro & FMCG Trading Pvt. Ltd.',
      'malwa-agro-fmcg', 'DISTRIBUTOR', 1, '23AABCM1234F1Z5', 'AABCM1234F',
      'Plot 18, Siyaganj Wholesale Mandi, Indore', 'Indore', 'Madhya Pradesh', '452007',
      'Rajesh Agrawal', '9893220001', 'wholesaler@everythinglocal.in',
      '["Indore","Bhopal","Ujjain","Dewas","Ratlam","Madhya Pradesh"]',
      '["UPI","BANK_TRANSFER","ONLINE"]',
      'APPROVED', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );`,

    // 3. Default Warehouse
    `INSERT OR IGNORE INTO "WholesaleWarehouse" (
      id, wholesalerId, name, addressLine, city, state, pincode, contactPhone, isDefault, isActive, createdAt, updatedAt
    ) VALUES (
      'whs-wh-siyaganj', 'whs-prof-malwa',
      'Siyaganj Central Godown #1', 'Plot 18, Siyaganj Wholesale Mandi, Indore',
      'Indore', 'Madhya Pradesh', '452007', '9893220001', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );`,

    // 4. Wholesale Products across multiple categories
    `INSERT OR IGNORE INTO "WholesaleProduct" (
      id, wholesalerId, categoryId, warehouseId, title, slug, brand, description,
      mainImageUrl, sku, hsnCode, unitOfMeasurement, packageSize, moq,
      basePricePaise, listingType, dispatchTime, shippingRegionsJson, taxClassification,
      status, approvalStatus, createdAt, updatedAt
    ) VALUES
      ('wprod-atta-50kg', 'whs-prof-malwa', 'wcat-grocery-fmcg', 'whs-wh-siyaganj',
       'MP Sharbati Chakki Atta — 25kg Bulk Commercial Sack', 'mp-sharbati-atta-25kg-bulk', 'Malwa Gold',
       'Freshly stone-milled Sehore Sharbati whole wheat flour packed in moisture-resistant 25kg commercial sacks for kirana stores, hotels, and caterers.',
       '/product-images/groceries/aashirvaad-atta.webp', 'WHS-ATTA-25KG', '11010000', 'sacks', '25 kg Sack', 10,
       92000, 'TIERED', '24 Hours', '["Indore","Ujjain","Dewas","Bhopal","MP"]', 'GST_0',
       'ACTIVE', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

      ('wprod-oil-15l', 'whs-prof-malwa', 'wcat-grocery-fmcg', 'whs-wh-siyaganj',
       'Kachi Ghani Pure Mustard Oil — 15L Tin Box', 'kachi-ghani-mustard-oil-15l-tin', 'Fortune / Malwa',
       'Cold-pressed Grade-A Kachi Ghani mustard oil in sealed 15-Litre commercial tin containers. High pungency and zero adulteration.',
       '/product-images/groceries/mustard-oil.webp', 'WHS-OIL-15L', '15141190', 'tins', '15 Litre Tin', 5,
       215000, 'TIERED', '24-48 Hours', '["Indore","Bhopal","Ujjain","Madhya Pradesh"]', 'GST_5',
       'ACTIVE', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

      ('wprod-sugar-50kg', 'whs-prof-malwa', 'wcat-grocery-fmcg', 'whs-wh-siyaganj',
       'M-30 Refined White Crystal Sugar — 50kg Bag', 'm30-refined-sugar-50kg-bag', 'Madhur / Malwa',
       'Sulphur-free sparkling white M-30 grade crystal sugar in 50kg PP woven bags. Ideal for sweet shops, bakeries, and retail resellers.',
       '/product-images/groceries/madhur-sugar.webp', 'WHS-SUG-50KG', '17019990', 'bags', '50 kg Bag', 10,
       210000, 'TIERED', '24 Hours', '["Indore","Dewas","Ujjain","Madhya Pradesh"]', 'GST_5',
       'ACTIVE', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

      ('wprod-salt-master', 'whs-prof-malwa', 'wcat-grocery-fmcg', 'whs-wh-siyaganj',
       'Iodized Vacuum Evaporated Salt — Master Carton (50 x 1kg)', 'iodized-salt-master-carton-50kg', 'Tata Salt',
       'Original vacuum evaporated iodized salt in 50kg master bales (50 packs of 1kg each). Factory-direct distributor pricing.',
       '/product-images/groceries/tata-salt.webp', 'WHS-SALT-50PK', '25010010', 'cartons', '50 x 1kg Master Pack', 10,
       118000, 'TIERED', '24 Hours', '["Indore","Madhya Pradesh"]', 'GST_0',
       'ACTIVE', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

      ('wprod-packaging-boxes', 'whs-prof-malwa', 'wcat-packaging-materials', 'whs-wh-siyaganj',
       '5-Ply Heavy Duty Corrugated Shipping Cartons (18x14x12 in)', '5ply-corrugated-cartons-18x14x12', 'PackPro India',
       'High burst-strength 5-ply kraft corrugated boxes for e-commerce, FMCG, and industrial dispatch. Custom printing available on RFQ.',
       '/brand/product-placeholder.svg', 'WHS-BOX-5PLY', '48191010', 'pieces', 'Bundle of 50', 50,
       4200, 'NEGOTIABLE', '2-3 Business Days', '["Pan India","Madhya Pradesh"]', 'GST_18',
       'ACTIVE', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

      ('wprod-led-batten', 'whs-prof-malwa', 'wcat-electrical-lighting', 'whs-wh-siyaganj',
       '20W LED Tube Batten 4ft Cool Daylight — Contractor Lot', '20w-led-batten-4ft-bulk', 'Syska / Havells',
       '20W high-lumen 6500K LED batten lights with surge protection up to 4kV. Bulk contractor & electrical shop carton of 20 units.',
       '/brand/product-placeholder.svg', 'WHS-LED-20W', '94054090', 'units', 'Master Box of 20', 20,
       14500, 'TIERED', '24-48 Hours', '["Indore","Bhopal","Madhya Pradesh"]', 'GST_18',
       'ACTIVE', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,

    // 5. Tiered Pricing Breaks
    `INSERT OR IGNORE INTO "WholesalePriceTier" (id, productId, minQty, maxQty, pricePaise) VALUES
      ('wtier-atta-1', 'wprod-atta-50kg', 10, 49, 92000),
      ('wtier-atta-2', 'wprod-atta-50kg', 50, 99, 89000),
      ('wtier-atta-3', 'wprod-atta-50kg', 100, NULL, 85500),

      ('wtier-oil-1', 'wprod-oil-15l', 5, 19, 215000),
      ('wtier-oil-2', 'wprod-oil-15l', 20, 49, 208000),
      ('wtier-oil-3', 'wprod-oil-15l', 50, NULL, 199000),

      ('wtier-sug-1', 'wprod-sugar-50kg', 10, 49, 210000),
      ('wtier-sug-2', 'wprod-sugar-50kg', 50, 199, 204000),
      ('wtier-sug-3', 'wprod-sugar-50kg', 200, NULL, 198000),

      ('wtier-salt-1', 'wprod-salt-master', 10, 49, 118000),
      ('wtier-salt-2', 'wprod-salt-master', 50, NULL, 112000),

      ('wtier-box-1', 'wprod-packaging-boxes', 50, 249, 4200),
      ('wtier-box-2', 'wprod-packaging-boxes', 250, 999, 3600),
      ('wtier-box-3', 'wprod-packaging-boxes', 1000, NULL, 3100),

      ('wtier-led-1', 'wprod-led-batten', 20, 99, 14500),
      ('wtier-led-2', 'wprod-led-batten', 100, 499, 13200),
      ('wtier-led-3', 'wprod-led-batten', 500, NULL, 11900);`,

    // 6. Wholesale Inventory
    `INSERT OR IGNORE INTO "WholesaleInventory" (id, productId, warehouseId, availableQty, reservedQty, lowStockThreshold) VALUES
      ('winv-atta', 'wprod-atta-50kg', 'whs-wh-siyaganj', 450, 0, 30),
      ('winv-oil', 'wprod-oil-15l', 'whs-wh-siyaganj', 280, 0, 20),
      ('winv-sug', 'wprod-sugar-50kg', 'whs-wh-siyaganj', 600, 0, 40),
      ('winv-salt', 'wprod-salt-master', 'whs-wh-siyaganj', 320, 0, 25),
      ('winv-box', 'wprod-packaging-boxes', 'whs-wh-siyaganj', 5000, 0, 200),
      ('winv-led', 'wprod-led-batten', 'whs-wh-siyaganj', 1200, 0, 50);`
  ];

  for (let i = 0; i < sqlStatements.length; i++) {
    const stmt = sqlStatements[i].trim().replace(/\r?\n/g, ' ');
    console.log(`  [D1 Execute ${i + 1}/${sqlStatements.length}] Provisioning...`);
    const escapedStmt = stmt.replace(/"/g, '\\"');
    execSync(`npx wrangler d1 execute everything-local-db --remote --command "${escapedStmt}"`, { stdio: 'inherit' });
  }

  console.log('✅ Wholesale Marketplace remote D1 provisioning complete!');
}

if (process.argv.includes('--remote')) {
  seedWholesaleRemote()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Wholesale remote seed failed:', err);
      process.exit(1);
    });
}
