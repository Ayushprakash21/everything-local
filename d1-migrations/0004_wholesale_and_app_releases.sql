-- Migration 0004: Wholesale Marketplace & App Download Centre
-- Non-destructive additive migration

CREATE TABLE IF NOT EXISTS "WholesaleCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "icon" TEXT,
    "imageUrl" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WholesaleCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesaleCategory_parentId_idx" ON "WholesaleCategory"("parentId");
CREATE INDEX IF NOT EXISTS "WholesaleCategory_isActive_sortOrder_idx" ON "WholesaleCategory"("isActive", "sortOrder");

CREATE TABLE IF NOT EXISTS "WholesalerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "businessName" TEXT NOT NULL,
    "legalBusinessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "businessType" TEXT NOT NULL DEFAULT 'WHOLESALER',
    "hasGst" BOOLEAN NOT NULL DEFAULT false,
    "gstin" TEXT,
    "panNumber" TEXT,
    "businessAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Indore',
    "state" TEXT NOT NULL DEFAULT 'Madhya Pradesh',
    "pincode" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "serviceableRegions" TEXT NOT NULL DEFAULT '[]',
    "paymentPreferences" TEXT NOT NULL DEFAULT '[]',
    "documentsJson" TEXT NOT NULL DEFAULT '[]',
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesalerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesalerProfile_verificationStatus_idx" ON "WholesalerProfile"("verificationStatus");
CREATE INDEX IF NOT EXISTS "WholesalerProfile_city_idx" ON "WholesalerProfile"("city");

CREATE TABLE IF NOT EXISTS "WholesaleWarehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wholesalerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "contactPhone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleWarehouse_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "WholesalerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesaleWarehouse_wholesalerId_idx" ON "WholesaleWarehouse"("wholesalerId");

CREATE TABLE IF NOT EXISTS "WholesaleProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wholesalerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "warehouseId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "brand" TEXT,
    "description" TEXT NOT NULL,
    "mainImageUrl" TEXT NOT NULL,
    "galleryImagesJson" TEXT NOT NULL DEFAULT '[]',
    "specificationsJson" TEXT NOT NULL DEFAULT '{}',
    "sku" TEXT NOT NULL,
    "hsnCode" TEXT,
    "unitOfMeasurement" TEXT NOT NULL DEFAULT 'pieces',
    "packageSize" TEXT,
    "moq" INTEGER NOT NULL DEFAULT 10,
    "basePricePaise" INTEGER NOT NULL,
    "listingType" TEXT NOT NULL DEFAULT 'TIERED',
    "dispatchTime" TEXT NOT NULL DEFAULT '24-48 Hours',
    "shippingRegionsJson" TEXT NOT NULL DEFAULT '[]',
    "taxClassification" TEXT NOT NULL DEFAULT 'GST_5',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "moderationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleProduct_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "WholesalerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WholesaleProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WholesaleCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WholesaleProduct_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "WholesaleCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WholesaleProduct_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "WholesaleWarehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesaleProduct_wholesalerId_idx" ON "WholesaleProduct"("wholesalerId");
CREATE INDEX IF NOT EXISTS "WholesaleProduct_categoryId_idx" ON "WholesaleProduct"("categoryId");
CREATE INDEX IF NOT EXISTS "WholesaleProduct_approvalStatus_status_idx" ON "WholesaleProduct"("approvalStatus", "status");

CREATE TABLE IF NOT EXISTS "WholesalePriceTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "maxQty" INTEGER,
    "pricePaise" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesalePriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "WholesaleProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesalePriceTier_productId_minQty_idx" ON "WholesalePriceTier"("productId", "minQty");

CREATE TABLE IF NOT EXISTS "WholesaleInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "availableQty" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 20,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "WholesaleProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WholesaleInventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "WholesaleWarehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WholesaleInventory_productId_warehouseId_key" ON "WholesaleInventory"("productId", "warehouseId");
CREATE INDEX IF NOT EXISTS "WholesaleInventory_productId_idx" ON "WholesaleInventory"("productId");

CREATE TABLE IF NOT EXISTS "WholesaleCartItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleCartItem_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WholesaleCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "WholesaleProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WholesaleCartItem_buyerId_productId_key" ON "WholesaleCartItem"("buyerId", "productId");
CREATE INDEX IF NOT EXISTS "WholesaleCartItem_buyerId_idx" ON "WholesaleCartItem"("buyerId");

CREATE TABLE IF NOT EXISTS "WholesaleOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "buyerId" TEXT NOT NULL,
    "wholesalerId" TEXT NOT NULL,
    "quotationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'ONLINE',
    "fulfillmentMethod" TEXT NOT NULL DEFAULT 'TRANSPORTER',
    "subtotalPaise" INTEGER NOT NULL,
    "taxPaise" INTEGER NOT NULL DEFAULT 0,
    "shippingPaise" INTEGER NOT NULL DEFAULT 0,
    "discountPaise" INTEGER NOT NULL DEFAULT 0,
    "totalPaise" INTEGER NOT NULL,
    "shippingAddressJson" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "cancellationReason" TEXT,
    "auditHistoryJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WholesaleOrder_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "WholesalerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesaleOrder_buyerId_idx" ON "WholesaleOrder"("buyerId");
CREATE INDEX IF NOT EXISTS "WholesaleOrder_wholesalerId_idx" ON "WholesaleOrder"("wholesalerId");
CREATE INDEX IF NOT EXISTS "WholesaleOrder_status_idx" ON "WholesaleOrder"("status");

CREATE TABLE IF NOT EXISTS "WholesaleOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "unitOfMeasurement" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "agreedUnitPricePaise" INTEGER NOT NULL,
    "tierAppliedJson" TEXT,
    "taxRatePct" REAL NOT NULL DEFAULT 5.0,
    "taxPaise" INTEGER NOT NULL DEFAULT 0,
    "lineTotalPaise" INTEGER NOT NULL,
    CONSTRAINT "WholesaleOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WholesaleOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WholesaleOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "WholesaleProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesaleOrderItem_orderId_idx" ON "WholesaleOrderItem"("orderId");

CREATE TABLE IF NOT EXISTS "WholesaleQuotationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqNumber" TEXT NOT NULL UNIQUE,
    "buyerId" TEXT NOT NULL,
    "wholesalerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requestedQty" INTEGER NOT NULL,
    "deliveryCity" TEXT NOT NULL,
    "deliveryState" TEXT NOT NULL,
    "deliveryPincode" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "expectedDeliveryDate" TEXT,
    "requirements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleQuotationRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WholesaleQuotationRequest_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "WholesalerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WholesaleQuotationRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "WholesaleProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesaleQuotationRequest_buyerId_idx" ON "WholesaleQuotationRequest"("buyerId");
CREATE INDEX IF NOT EXISTS "WholesaleQuotationRequest_wholesalerId_idx" ON "WholesaleQuotationRequest"("wholesalerId");
CREATE INDEX IF NOT EXISTS "WholesaleQuotationRequest_status_idx" ON "WholesaleQuotationRequest"("status");

CREATE TABLE IF NOT EXISTS "WholesaleQuotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT NOT NULL,
    "wholesalerId" TEXT NOT NULL,
    "quotedUnitPricePaise" INTEGER NOT NULL,
    "quotedQty" INTEGER NOT NULL,
    "deliveryChargePaise" INTEGER NOT NULL DEFAULT 0,
    "taxPaise" INTEGER NOT NULL DEFAULT 0,
    "totalPaise" INTEGER NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "termsAndConditions" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleQuotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "WholesaleQuotationRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WholesaleQuotation_wholesalerId_fkey" FOREIGN KEY ("wholesalerId") REFERENCES "WholesalerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesaleQuotation_rfqId_idx" ON "WholesaleQuotation"("rfqId");
CREATE INDEX IF NOT EXISTS "WholesaleQuotation_wholesalerId_idx" ON "WholesaleQuotation"("wholesalerId");

CREATE TABLE IF NOT EXISTS "WholesaleShipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "fulfillmentMethod" TEXT NOT NULL DEFAULT 'TRANSPORTER',
    "carrierName" TEXT,
    "trackingNumber" TEXT,
    "lrNumber" TEXT,
    "vehicleDetails" TEXT,
    "dispatchedAt" DATETIME,
    "estimatedDeliveryAt" DATETIME,
    "deliveredAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PREPARING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WholesaleShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WholesaleOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesaleShipment_orderId_idx" ON "WholesaleShipment"("orderId");

CREATE TABLE IF NOT EXISTS "AppRelease" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appType" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "versionCode" INTEGER NOT NULL,
    "releaseNotes" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "sha256Checksum" TEXT,
    "minAndroidVersion" TEXT DEFAULT '7.0 (API 24)',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppRelease_appType_versionCode_key" ON "AppRelease"("appType", "versionCode");
CREATE INDEX IF NOT EXISTS "AppRelease_appType_status_isLatest_idx" ON "AppRelease"("appType", "status", "isLatest");

CREATE TABLE IF NOT EXISTS "AppDownloadEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "releaseId" TEXT NOT NULL,
    "appType" TEXT NOT NULL,
    "clientIpHash" TEXT,
    "userAgent" TEXT,
    "downloadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppDownloadEvent_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "AppRelease" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AppDownloadEvent_releaseId_downloadedAt_idx" ON "AppDownloadEvent"("releaseId", "downloadedAt");
CREATE INDEX IF NOT EXISTS "AppDownloadEvent_appType_downloadedAt_idx" ON "AppDownloadEvent"("appType", "downloadedAt");

-- Seed 22 Initial Wholesale Categories (Idempotent)
INSERT OR IGNORE INTO "WholesaleCategory" ("id", "name", "slug", "description", "icon", "sortOrder", "isActive") VALUES
('wcat-grocery-fmcg', 'Grocery & FMCG', 'grocery-fmcg', 'Staples, grains, pulses, edible oils, and packaged FMCG in bulk', 'Package', 1, 1),
('wcat-food-beverages', 'Food & Beverages', 'food-beverages', 'Bulk snacks, beverages, tea, coffee, spices, and dry fruits', 'Coffee', 2, 1),
('wcat-fruits-vegetables', 'Fruits & Vegetables', 'fruits-vegetables', 'Farm-direct crates and sacks of fresh produce', 'Apple', 3, 1),
('wcat-clothing-textiles', 'Clothing & Textiles', 'clothing-textiles', 'Apparel, fabrics, sarees, kurtis, and readymade garments', 'Shirt', 4, 1),
('wcat-footwear', 'Footwear', 'footwear', 'Men, women, and kids footwear in carton lots', 'Footprints', 5, 1),
('wcat-fashion-accessories', 'Fashion Accessories', 'fashion-accessories', 'Belts, watches, sunglasses, and hair accessories', 'Sparkles', 6, 1),
('wcat-jewellery', 'Jewellery', 'jewellery', 'Imitation, ethnic, and fashion jewellery in bulk sets', 'Gem', 7, 1),
('wcat-beauty-cosmetics', 'Beauty & Cosmetics', 'beauty-cosmetics', 'Skincare, makeup, and salon bulk supplies', 'Palette', 8, 1),
('wcat-personal-care', 'Personal Care', 'personal-care', 'Soaps, shampoos, hygiene, and grooming essentials', 'Heart', 9, 1),
('wcat-home-kitchen', 'Home & Kitchen', 'home-kitchen', 'Cookware, steelware, storage, and home utility', 'Home', 10, 1),
('wcat-furniture-decor', 'Furniture & Decor', 'furniture-decor', 'Home furnishings, curtains, lighting decor, and furniture', 'Sofa', 11, 1),
('wcat-electronics', 'Electronics', 'electronics', 'Mobile accessories, audio, small appliances, and gadgets', 'Cpu', 12, 1),
('wcat-electrical-lighting', 'Electrical & Lighting', 'electrical-lighting', 'LED bulbs, switches, wires, fans, and industrial electricals', 'Zap', 13, 1),
('wcat-hardware-building', 'Hardware & Building Materials', 'hardware-building-materials', 'Tools, fasteners, plumbing, paints, and construction supplies', 'Hammer', 14, 1),
('wcat-industrial-supplies', 'Industrial Supplies', 'industrial-supplies', 'Safety gear, machinery spares, and factory consumables', 'Factory', 15, 1),
('wcat-packaging-materials', 'Packaging Materials', 'packaging-materials', 'Corrugated boxes, tapes, pouches, and shipping supplies', 'Box', 16, 1),
('wcat-stationery-office', 'Stationery & Office Supplies', 'stationery-office-supplies', 'Paper reams, pens, files, and school/office wholesale', 'FileText', 17, 1),
('wcat-toys-baby', 'Toys & Baby Products', 'toys-baby-products', 'Educational toys, baby care, and kids essentials', 'Baby', 18, 1),
('wcat-agriculture', 'Agriculture Supplies', 'agriculture-supplies', 'Seeds, fertilizers, agri-tools, and irrigation supplies', 'Sprout', 19, 1),
('wcat-automotive', 'Automotive Accessories', 'automotive-accessories', 'Two-wheeler and four-wheeler spares, lubricants, and care', 'Car', 20, 1),
('wcat-bags-luggage', 'Bags & Luggage', 'bags-luggage', 'Backpacks, school bags, travel luggage, and handbags', 'Briefcase', 21, 1),
('wcat-other', 'Other Categories', 'other-categories', 'General wholesale merchandise and permitted trade goods', 'Layers', 22, 1);
