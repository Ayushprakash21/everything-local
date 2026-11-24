-- Migration 0003: Catalogue & Environment Management

-- Update Product table with catalogue relations and environment flag
ALTER TABLE "Product" ADD COLUMN "catalogueProductId" TEXT;
ALTER TABLE "Product" ADD COLUMN "minOrderQty" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Product" ADD COLUMN "variantsJson" TEXT;
ALTER TABLE "Product" ADD COLUMN "environment" TEXT NOT NULL DEFAULT 'DEMO';

-- CreateTable CatalogueProduct
CREATE TABLE IF NOT EXISTS "CatalogueProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT,
    "shortDescription" TEXT,
    "description" TEXT,
    "categoryName" TEXT NOT NULL,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "department" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'piece',
    "packageSize" TEXT,
    "variantsJson" TEXT,
    "specificationsJson" TEXT,
    "searchKeywords" TEXT,
    "tags" TEXT,
    "imageUrl" TEXT NOT NULL,
    "additionalImagesJson" TEXT,
    "taxClassification" TEXT DEFAULT 'GST_5',
    "mrpPaise" INTEGER NOT NULL,
    "targetPricePaise" INTEGER,
    "isPrescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
    "isService" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "environment" TEXT NOT NULL DEFAULT 'DEMO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogueProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CatalogueProduct_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "ProductCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable MerchantProductRequest
CREATE TABLE IF NOT EXISTS "MerchantProductRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "categoryName" TEXT NOT NULL,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'piece',
    "imageUrl" TEXT,
    "proposedPricePaise" INTEGER,
    "proposedMrpPaise" INTEGER,
    "variantsJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "catalogueProductId" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'DEMO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantProductRequest_catalogueProductId_fkey" FOREIGN KEY ("catalogueProductId") REFERENCES "CatalogueProduct" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable CatalogueAuditLog
CREATE TABLE IF NOT EXISTS "CatalogueAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "environment" TEXT NOT NULL,
    "detailsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique and index constraints
CREATE UNIQUE INDEX IF NOT EXISTS "CatalogueProduct_sku_key" ON "CatalogueProduct"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "CatalogueProduct_slug_key" ON "CatalogueProduct"("slug");
CREATE INDEX IF NOT EXISTS "CatalogueProduct_categoryId_idx" ON "CatalogueProduct"("categoryId");
CREATE INDEX IF NOT EXISTS "CatalogueProduct_subcategoryId_idx" ON "CatalogueProduct"("subcategoryId");
CREATE INDEX IF NOT EXISTS "CatalogueProduct_environment_idx" ON "CatalogueProduct"("environment");
CREATE INDEX IF NOT EXISTS "CatalogueProduct_status_idx" ON "CatalogueProduct"("status");

CREATE INDEX IF NOT EXISTS "Product_catalogueProductId_idx" ON "Product"("catalogueProductId");
CREATE INDEX IF NOT EXISTS "Product_environment_idx" ON "Product"("environment");

CREATE INDEX IF NOT EXISTS "MerchantProductRequest_storeId_idx" ON "MerchantProductRequest"("storeId");
CREATE INDEX IF NOT EXISTS "MerchantProductRequest_status_idx" ON "MerchantProductRequest"("status");
CREATE INDEX IF NOT EXISTS "MerchantProductRequest_environment_idx" ON "MerchantProductRequest"("environment");

CREATE INDEX IF NOT EXISTS "CatalogueAuditLog_environment_idx" ON "CatalogueAuditLog"("environment");
CREATE INDEX IF NOT EXISTS "CatalogueAuditLog_action_idx" ON "CatalogueAuditLog"("action");
CREATE INDEX IF NOT EXISTS "CatalogueAuditLog_createdAt_idx" ON "CatalogueAuditLog"("createdAt");
