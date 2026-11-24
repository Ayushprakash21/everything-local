import fs from 'fs';
import path from 'path';
import { prisma } from '../server/src/db';

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${val.toString().replace(/'/g, "''")}'`;
}

async function exportSeed() {
  console.log('Exporting categories, catalogue products, demo stores, and offers from dev.db to D1 SQL seed...');

  const categories = await prisma.productCategory.findMany();
  const catalogueProducts = await prisma.catalogueProduct.findMany({ where: { environment: 'DEMO' } });
  const demoSlugs = [
    'agarwal-super-mart-palasia',
    'apna-fresh-mandi-vijay-nagar',
    'malwa-handlooms-fashion-saket',
    'indore-beauty-wellness-studio',
    'ujjaini-home-decor-utensils',
    'rajesh-electronics-electricals',
    'kundan-silver-house-sarafa',
    'step-in-footwear-travel-bags',
    'sanjeevani-medicos-wellness-otc',
    'quickpro-local-services-laundry'
  ];
  const demoStores = await prisma.store.findMany({ where: { slug: { in: demoSlugs } } });
  const storeIds = demoStores.map(s => s.id);
  const demoProducts = await prisma.product.findMany({ where: { storeId: { in: storeIds }, environment: 'DEMO' } });

  console.log(`Found ${categories.length} categories, ${catalogueProducts.length} catalogue products, ${demoStores.length} stores, ${demoProducts.length} offers.`);

  const sqlStatements: string[] = [];

  // Top level categories first
  const parentCats = categories.filter(c => !c.parentId);
  const childCats = categories.filter(c => !!c.parentId);

  for (const c of parentCats) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO ProductCategory (id, name, slug, description, imageUrl, bannerUrl, displayOrder, isActive, isHomepageVisible, department, parentId, createdAt, updatedAt) ` +
      `VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.slug)}, ${escapeSql(c.description)}, ${escapeSql(c.imageUrl)}, ${escapeSql(c.bannerUrl)}, ${escapeSql(c.displayOrder)}, ${escapeSql(c.isActive)}, ${escapeSql(c.isHomepageVisible)}, ${escapeSql(c.department)}, NULL, ${escapeSql(c.createdAt)}, ${escapeSql(c.updatedAt)});`
    );
  }

  for (const c of childCats) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO ProductCategory (id, name, slug, description, imageUrl, bannerUrl, displayOrder, isActive, isHomepageVisible, department, parentId, createdAt, updatedAt) ` +
      `VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.slug)}, ${escapeSql(c.description)}, ${escapeSql(c.imageUrl)}, ${escapeSql(c.bannerUrl)}, ${escapeSql(c.displayOrder)}, ${escapeSql(c.isActive)}, ${escapeSql(c.isHomepageVisible)}, ${escapeSql(c.department)}, ${escapeSql(c.parentId)}, ${escapeSql(c.createdAt)}, ${escapeSql(c.updatedAt)});`
    );
  }

  // Catalogue products
  for (const cp of catalogueProducts) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO CatalogueProduct (id, sku, name, slug, brand, shortDescription, description, categoryName, categoryId, subcategoryId, department, unit, packageSize, variantsJson, specificationsJson, searchKeywords, tags, imageUrl, additionalImagesJson, taxClassification, mrpPaise, targetPricePaise, isPrescriptionRequired, isService, status, environment, createdAt, updatedAt) ` +
      `VALUES (${escapeSql(cp.id)}, ${escapeSql(cp.sku)}, ${escapeSql(cp.name)}, ${escapeSql(cp.slug)}, ${escapeSql(cp.brand)}, ${escapeSql(cp.shortDescription)}, ${escapeSql(cp.description)}, ${escapeSql(cp.categoryName)}, ${escapeSql(cp.categoryId)}, ${escapeSql(cp.subcategoryId)}, ${escapeSql(cp.department)}, ${escapeSql(cp.unit)}, ${escapeSql(cp.packageSize)}, ${escapeSql(cp.variantsJson)}, ${escapeSql(cp.specificationsJson)}, ${escapeSql(cp.searchKeywords)}, ${escapeSql(cp.tags)}, ${escapeSql(cp.imageUrl)}, ${escapeSql(cp.additionalImagesJson)}, ${escapeSql(cp.taxClassification)}, ${escapeSql(cp.mrpPaise)}, ${escapeSql(cp.targetPricePaise)}, ${escapeSql(cp.isPrescriptionRequired)}, ${escapeSql(cp.isService)}, ${escapeSql(cp.status)}, ${escapeSql(cp.environment)}, ${escapeSql(cp.createdAt)}, ${escapeSql(cp.updatedAt)});`
    );
  }

  // Demo Stores
  for (const s of demoStores) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO Store (id, ownerId, name, slug, description, category, addressLine, city, pincode, latitude, longitude, serviceRadiusKm, isOpen, isVerified, commissionRatePct, createdAt, updatedAt) ` +
      `VALUES (${escapeSql(s.id)}, ${escapeSql(s.ownerId)}, ${escapeSql(s.name)}, ${escapeSql(s.slug)}, ${escapeSql(s.description)}, ${escapeSql(s.category)}, ${escapeSql(s.addressLine)}, ${escapeSql(s.city)}, ${escapeSql(s.pincode)}, ${escapeSql(s.latitude)}, ${escapeSql(s.longitude)}, 15.0, 1, 1, ${escapeSql(s.commissionRatePct)}, ${escapeSql(s.createdAt)}, ${escapeSql(s.updatedAt)});`
    );
  }

  // Demo Offers
  for (const p of demoProducts) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO Product (id, storeId, catalogueProductId, name, description, category, categoryId, subcategoryId, mrpPaise, pricePaise, stock, isAvailable, minOrderQty, imageUrl, sku, barcode, brand, packageSize, variantsJson, environment, createdAt, updatedAt) ` +
      `VALUES (${escapeSql(p.id)}, ${escapeSql(p.storeId)}, ${escapeSql(p.catalogueProductId)}, ${escapeSql(p.name)}, ${escapeSql(p.description)}, ${escapeSql(p.category)}, ${escapeSql(p.categoryId)}, ${escapeSql(p.subcategoryId)}, ${escapeSql(p.mrpPaise)}, ${escapeSql(p.pricePaise)}, ${escapeSql(p.stock)}, ${escapeSql(p.isAvailable)}, ${escapeSql(p.minOrderQty)}, ${escapeSql(p.imageUrl)}, ${escapeSql(p.sku)}, ${escapeSql(p.barcode)}, ${escapeSql(p.brand)}, ${escapeSql(p.packageSize)}, ${escapeSql(p.variantsJson)}, ${escapeSql(p.environment)}, ${escapeSql(p.createdAt)}, ${escapeSql(p.updatedAt)});`
    );
  }

  const outPath = path.resolve(__dirname, '../d1-migrations/seed_500_catalogue.sql');
  fs.writeFileSync(outPath, sqlStatements.join('\n'), 'utf-8');
  console.log(`Successfully generated ${sqlStatements.length} SQL statements in ${outPath}`);
}

exportSeed().finally(() => prisma.$disconnect());
