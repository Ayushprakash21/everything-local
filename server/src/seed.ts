import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { GeospatialEngine } from './core/geospatial';

async function seed() {
  console.log('🌱 Seeding Everything Local (Indore pilot data)...');

  // Clear existing data safely
  await prisma.review.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.financialLedgerEntry.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Admin Account
  const admin = await prisma.user.create({
    data: {
      email: 'admin@everythinglocal.in',
      phone: '9893000001',
      name: 'Super Admin',
      passwordHash,
      role: 'ADMIN'
    }
  });

  // 2. Customer Account
  const customer = await prisma.user.create({
    data: {
      email: 'ayush@example.com',
      phone: '9893000002',
      name: 'Ayush Sharma',
      passwordHash,
      role: 'CUSTOMER',
      addresses: {
        create: {
          label: 'Home',
          addressLine: 'Flat 302, Silver Springs, Palasia',
          landmark: 'Near 56 Dukan',
          city: 'Indore',
          pincode: '452001',
          latitude: GeospatialEngine.INDORE_LANDMARKS.PALASIA.latitude,
          longitude: GeospatialEngine.INDORE_LANDMARKS.PALASIA.longitude,
          isDefault: true
        }
      }
    }
  });

  // 3. Merchant 1: Sharma Kirana Store (Palasia, Indore)
  const merchantUser1 = await prisma.user.create({
    data: {
      email: 'sharma.kirana@everythinglocal.in',
      phone: '9893000003',
      name: 'Ramesh Sharma',
      passwordHash,
      role: 'MERCHANT'
    }
  });

  const store1 = await prisma.store.create({
    data: {
      ownerId: merchantUser1.id,
      name: 'Sharma Kirana Store',
      slug: 'sharma-kirana-palasia',
      description: 'Your trusted neighborhood grocery store in Old Palasia since 1994.',
      category: 'grocery',
      addressLine: '14/2 Greater Kailash Road, Old Palasia',
      city: 'Indore',
      pincode: '452001',
      latitude: GeospatialEngine.INDORE_LANDMARKS.PALASIA.latitude,
      longitude: GeospatialEngine.INDORE_LANDMARKS.PALASIA.longitude,
      serviceRadiusKm: 3.0,
      isOpen: true,
      isVerified: true,
      commissionRatePct: 3.5,
      products: {
        create: [
          {
            name: 'Aashirvaad Shudh Chakki Atta 5kg',
            description: '100% whole wheat flour with natural dietary fibres.',
            category: 'Flour & Grains',
            mrpPaise: 26000,
            pricePaise: 23500, // ₹235.00
            stock: 35,
            isAvailable: true,
            sku: 'KIR-ATT-001'
          },
          {
            name: 'Fortune Sunlite Refined Sunflower Oil 1L',
            description: 'Pure and light cooking oil enriched with vitamins.',
            category: 'Edible Oils',
            mrpPaise: 16500,
            pricePaise: 14500, // ₹145.00
            stock: 40,
            isAvailable: true,
            sku: 'KIR-OIL-002'
          },
          {
            name: 'Tata Salt Vacuum Evaporated 1kg',
            description: 'Desh Ka Namak with essential iodine.',
            category: 'Spices & Seasoning',
            mrpPaise: 3000,
            pricePaise: 2800, // ₹28.00
            stock: 100,
            isAvailable: true,
            sku: 'KIR-SLT-003'
          },
          {
            name: 'Madhur Pure & Hygienic Sugar 1kg',
            description: 'Sulphur-free refined crystalline sugar.',
            category: 'Grocery Staples',
            mrpPaise: 6000,
            pricePaise: 5400, // ₹54.00
            stock: 50,
            isAvailable: true,
            sku: 'KIR-SGR-004'
          },
          {
            name: 'India Gate Basmati Rice Feast Rozzana 1kg',
            description: 'Aromatic basmati rice grains perfect for daily meals.',
            category: 'Rice & Grains',
            mrpPaise: 12000,
            pricePaise: 9900, // ₹99.00
            stock: 25,
            isAvailable: true,
            sku: 'KIR-RIC-005'
          }
        ]
      }
    }
  });

  // 4. Merchant 2: Apna Fresh Produce (Vijay Nagar, Indore)
  const merchantUser2 = await prisma.user.create({
    data: {
      email: 'apna.fresh@everythinglocal.in',
      phone: '9893000004',
      name: 'Sunil Patidar',
      passwordHash,
      role: 'MERCHANT'
    }
  });

  await prisma.store.create({
    data: {
      ownerId: merchantUser2.id,
      name: 'Apna Fresh Fruits & Veg',
      slug: 'apna-fresh-vijay-nagar',
      description: 'Farm-fresh daily vegetables and seasonal fruits sourced from Malwa mandis.',
      category: 'produce',
      addressLine: 'Plot 45, Scheme 54, Vijay Nagar',
      city: 'Indore',
      pincode: '452010',
      latitude: GeospatialEngine.INDORE_LANDMARKS.VIJAY_NAGAR.latitude,
      longitude: GeospatialEngine.INDORE_LANDMARKS.VIJAY_NAGAR.longitude,
      serviceRadiusKm: 3.5,
      isOpen: true,
      isVerified: true,
      commissionRatePct: 3.5,
      products: {
        create: [
          {
            name: 'Fresh Malwa Potatoes 1kg',
            description: 'Locally grown crisp new-crop potatoes.',
            category: 'Vegetables',
            mrpPaise: 4000,
            pricePaise: 3000, // ₹30.00
            stock: 80,
            isAvailable: true,
            sku: 'VEG-POT-001'
          },
          {
            name: 'Red Hybrid Onions 1kg',
            description: 'Pungent, dry, medium sized onions.',
            category: 'Vegetables',
            mrpPaise: 4500,
            pricePaise: 3800, // ₹38.00
            stock: 60,
            isAvailable: true,
            sku: 'VEG-ONI-002'
          },
          {
            name: 'Ripe Country Tomatoes 1kg',
            description: 'Juicy, naturally ripened country tomatoes.',
            category: 'Vegetables',
            mrpPaise: 5000,
            pricePaise: 4000, // ₹40.00
            stock: 45,
            isAvailable: true,
            sku: 'VEG-TOM-003'
          },
          {
            name: 'Shimla Royal Delicious Apples 1kg',
            description: 'Sweet, crisp red apples directly from Himachal orchards.',
            category: 'Fruits',
            mrpPaise: 22000,
            pricePaise: 18000, // ₹180.00
            stock: 20,
            isAvailable: true,
            sku: 'FRT-APL-004'
          }
        ]
      }
    }
  });

  // 5. Merchant 3: Bake Well Artisan Confectionery (Saket, Indore)
  const merchantUser3 = await prisma.user.create({
    data: {
      email: 'bakewell@everythinglocal.in',
      phone: '9893000005',
      name: 'Anand Mehta',
      passwordHash,
      role: 'MERCHANT'
    }
  });

  await prisma.store.create({
    data: {
      ownerId: merchantUser3.id,
      name: 'Bake Well Bakery & Dairy',
      slug: 'bakewell-saket',
      description: 'Fresh milk loaves, eggless cakes, artisanal sourdough, and Sanchi dairy milk.',
      category: 'bakery',
      addressLine: 'Shop 8, Saket Main Square',
      city: 'Indore',
      pincode: '452018',
      latitude: GeospatialEngine.INDORE_LANDMARKS.SAKET.latitude,
      longitude: GeospatialEngine.INDORE_LANDMARKS.SAKET.longitude,
      serviceRadiusKm: 3.0,
      isOpen: true,
      isVerified: true,
      commissionRatePct: 3.5,
      products: {
        create: [
          {
            name: 'Fresh Whole Wheat Sandwich Bread 400g',
            description: 'Daily baked soft multigrain loaf with zero preservatives.',
            category: 'Bread & Buns',
            mrpPaise: 5500,
            pricePaise: 5000, // ₹50.00
            stock: 30,
            isAvailable: true,
            sku: 'BAK-BRD-001'
          },
          {
            name: 'Amul Pasteurised Salted Butter 500g',
            description: 'Utterly butterly delicious fresh butter.',
            category: 'Dairy',
            mrpPaise: 29500,
            pricePaise: 28500, // ₹285.00
            stock: 20,
            isAvailable: true,
            sku: 'DAI-BUT-002'
          },
          {
            name: 'Sanchi Gold Full Cream Milk 500ml',
            description: 'Fresh pasteurized full cream milk from MP state dairy coop.',
            category: 'Dairy',
            mrpPaise: 3400,
            pricePaise: 3400, // ₹34.00
            stock: 60,
            isAvailable: true,
            sku: 'DAI-MLK-003'
          }
        ]
      }
    }
  });

  console.log('✅ Seed completed successfully:');
  console.log(' - Admin: admin@everythinglocal.in (Password@123)');
  console.log(' - Customer: ayush@example.com (Password@123)');
  console.log(' - Merchant 1: sharma.kirana@everythinglocal.in (Password@123)');
  console.log(' - Merchant 2: apna.fresh@everythinglocal.in (Password@123)');
  console.log(' - Merchant 3: bakewell@everythinglocal.in (Password@123)');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
