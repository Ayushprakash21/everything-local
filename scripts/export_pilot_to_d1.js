const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function exportPilotData() {
  // 1. Get stores
  const stores = await prisma.store.findMany({ take: 25 });
  const ownerIds = Array.from(new Set(stores.map(s => s.ownerId)));
  
  // 2. Get owners and customer users
  const owners = await prisma.user.findMany({ where: { id: { in: ownerIds } } });
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 10 });
  const allUsersMap = new Map();
  owners.forEach(u => allUsersMap.set(u.id, u));
  customers.forEach(u => allUsersMap.set(u.id, u));
  const allUsers = Array.from(allUsersMap.values());

  // 3. Get products for these stores
  const storeIds = stores.map(s => s.id);
  const products = await prisma.product.findMany({ where: { storeId: { in: storeIds } } });
  
  console.log('Exporting:', { users: allUsers.length, stores: stores.length, products: products.length });
  
  const sqlStatements = [];
  
  // Users first to satisfy FKs
  for (const u of allUsers) {
    const email = u.email.replace(/'/g, "''");
    const name = u.name.replace(/'/g, "''");
    const phone = u.phone ? `'${u.phone}'` : 'NULL';
    sqlStatements.push(`INSERT OR IGNORE INTO "User" ("id", "email", "phone", "name", "passwordHash", "role", "createdAt", "updatedAt") VALUES ('${u.id}', '${email}', ${phone}, '${name}', '${u.passwordHash}', '${u.role}', datetime('now'), datetime('now'));`);
  }
  
  // Then stores
  for (const s of stores) {
    const name = s.name.replace(/'/g, "''");
    const slug = s.slug.replace(/'/g, "''");
    const desc = s.description ? `'${s.description.replace(/'/g, "''")}'` : 'NULL';
    const addr = s.addressLine.replace(/'/g, "''");
    sqlStatements.push(`INSERT OR IGNORE INTO "Store" ("id", "ownerId", "name", "slug", "description", "category", "addressLine", "city", "pincode", "latitude", "longitude", "serviceRadiusKm", "isOpen", "isVerified", "commissionRatePct", "createdAt", "updatedAt") VALUES ('${s.id}', '${s.ownerId}', '${name}', '${slug}', ${desc}, '${s.category}', '${addr}', '${s.city}', '${s.pincode}', ${s.latitude}, ${s.longitude}, ${s.serviceRadiusKm}, ${s.isOpen ? 1 : 0}, ${s.isVerified ? 1 : 0}, ${s.commissionRatePct}, datetime('now'), datetime('now'));`);
  }
  
  // Then products
  for (const p of products) {
    const name = p.name.replace(/'/g, "''");
    const desc = p.description ? `'${p.description.replace(/'/g, "''")}'` : 'NULL';
    const img = p.imageUrl ? `'${p.imageUrl.replace(/'/g, "''")}'` : 'NULL';
    const sku = p.sku ? `'${p.sku}'` : 'NULL';
    const brand = p.brand ? `'${p.brand.replace(/'/g, "''")}'` : 'NULL';
    const pkg = p.packageSize ? `'${p.packageSize.replace(/'/g, "''")}'` : 'NULL';
    sqlStatements.push(`INSERT OR IGNORE INTO "Product" ("id", "storeId", "name", "description", "category", "mrpPaise", "pricePaise", "stock", "isAvailable", "imageUrl", "sku", "brand", "packageSize", "createdAt", "updatedAt") VALUES ('${p.id}', '${p.storeId}', '${name}', ${desc}, '${p.category}', ${p.mrpPaise}, ${p.pricePaise}, ${p.stock}, ${p.isAvailable ? 1 : 0}, ${img}, ${sku}, ${brand}, ${pkg}, datetime('now'), datetime('now'));`);
  }

  fs.writeFileSync('d1-migrations/seed_pilot_data.sql', sqlStatements.join('\n'), 'utf8');
  console.log('Saved d1-migrations/seed_pilot_data.sql with', sqlStatements.length, 'statements');
}

exportPilotData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
