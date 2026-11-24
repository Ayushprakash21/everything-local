const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.productCategory.findMany({ orderBy: { displayOrder: 'asc' } });
  let sql = '-- D1 Migration: Add ProductCategory table and seed categories\n\n';
  sql += 'CREATE TABLE IF NOT EXISTS "ProductCategory" (\n';
  sql += '    "id" TEXT NOT NULL PRIMARY KEY,\n';
  sql += '    "name" TEXT NOT NULL,\n';
  sql += '    "slug" TEXT NOT NULL,\n';
  sql += '    "description" TEXT,\n';
  sql += '    "imageUrl" TEXT NOT NULL,\n';
  sql += '    "bannerUrl" TEXT,\n';
  sql += '    "displayOrder" INTEGER NOT NULL DEFAULT 0,\n';
  sql += '    "isActive" BOOLEAN NOT NULL DEFAULT 1,\n';
  sql += '    "isHomepageVisible" BOOLEAN NOT NULL DEFAULT 1,\n';
  sql += '    "department" TEXT NOT NULL DEFAULT \'GROCERY\',\n';
  sql += '    "metaTitle" TEXT,\n';
  sql += '    "metaDescription" TEXT,\n';
  sql += '    "parentId" TEXT,\n';
  sql += '    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n';
  sql += '    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n';
  sql += '    FOREIGN KEY ("parentId") REFERENCES "ProductCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE\n';
  sql += ');\n\n';
  sql += 'CREATE UNIQUE INDEX IF NOT EXISTS "ProductCategory_slug_key" ON "ProductCategory"("slug");\n';
  sql += 'CREATE INDEX IF NOT EXISTS "ProductCategory_parentId_idx" ON "ProductCategory"("parentId");\n';
  sql += 'CREATE INDEX IF NOT EXISTS "ProductCategory_department_idx" ON "ProductCategory"("department");\n';
  sql += 'CREATE INDEX IF NOT EXISTS "ProductCategory_isActive_isHomepageVisible_displayOrder_idx" ON "ProductCategory"("isActive", "isHomepageVisible", "displayOrder");\n\n';

  // Seed categories: parents first, then children
  const parents = categories.filter(c => !c.parentId);
  const children = categories.filter(c => c.parentId);

  for (const c of parents) {
    const desc = c.description ? `'${c.description.replace(/'/g, "''")}'` : 'NULL';
    const banner = c.bannerUrl ? `'${c.bannerUrl.replace(/'/g, "''")}'` : 'NULL';
    sql += `INSERT OR IGNORE INTO "ProductCategory" ("id", "name", "slug", "description", "imageUrl", "bannerUrl", "displayOrder", "isActive", "isHomepageVisible", "department", "parentId") VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.slug}', ${desc}, '${c.imageUrl}', ${banner}, ${c.displayOrder}, 1, 1, '${c.department}', NULL);\n`;
  }

  for (const c of children) {
    const desc = c.description ? `'${c.description.replace(/'/g, "''")}'` : 'NULL';
    const banner = c.bannerUrl ? `'${c.bannerUrl.replace(/'/g, "''")}'` : 'NULL';
    sql += `INSERT OR IGNORE INTO "ProductCategory" ("id", "name", "slug", "description", "imageUrl", "bannerUrl", "displayOrder", "isActive", "isHomepageVisible", "department", "parentId") VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.slug}', ${desc}, '${c.imageUrl}', ${banner}, ${c.displayOrder}, 1, 1, '${c.department}', '${c.parentId}');\n`;
  }

  // Update existing products with category IDs
  const products = await prisma.product.findMany({
    where: { categoryId: { not: null } },
    select: { id: true, categoryId: true, subcategoryId: true }
  });

  sql += '\n-- Update Products with category IDs\n';
  for (const p of products) {
    const subCatVal = p.subcategoryId ? `'${p.subcategoryId}'` : 'NULL';
    sql += `UPDATE "Product" SET "categoryId" = '${p.categoryId}', "subcategoryId" = ${subCatVal} WHERE "id" = '${p.id}';\n`;
  }

  fs.writeFileSync('d1-migrations/0002_categories_schema_and_seed.sql', sql);
  console.log(`Generated d1-migrations/0002_categories_schema_and_seed.sql with ${categories.length} categories and ${products.length} product category mappings.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
