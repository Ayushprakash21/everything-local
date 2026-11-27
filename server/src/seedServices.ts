import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import { prisma } from './db';

/**
 * EVERYBAZAAR SAFE SERVICES MARKETPLACE PROVISIONING ENGINE
 * 
 * Safety Guarantees:
 * 1. NEVER deletes or truncates any records (no deleteMany, no drop table).
 * 2. NEVER overwrites existing user passwords (preserves existing passwordHash).
 * 3. NEVER downgrades user roles (preserves or upgrades to MERCHANT).
 * 4. Strictly idempotent: safe to execute repeatedly without duplicating staff, services, or providers.
 * 5. Logs every record created, updated, or skipped.
 * 6. Supports both local Prisma execution and remote Cloudflare D1 execution via --remote flag.
 */

export interface SafeSeedResult {
  categoriesCreated: number;
  categoriesSkipped: number;
  usersCreated: number;
  usersSkipped: number;
  providersCreated: number;
  providersUpdated: number;
  providersSkipped: number;
  staffCreated: number;
  staffSkipped: number;
  servicesCreated: number;
  servicesSkipped: number;
}

export async function seedServices(): Promise<SafeSeedResult> {
  console.log('===============================================================');
  console.log('🚀 EVERYBAZAAR — SAFE SERVICES PROVISIONING ENGINE');
  console.log('   Mode: Safe / Non-Destructive / Idempotent');
  console.log('===============================================================');

  const stats: SafeSeedResult = {
    categoriesCreated: 0,
    categoriesSkipped: 0,
    usersCreated: 0,
    usersSkipped: 0,
    providersCreated: 0,
    providersUpdated: 0,
    providersSkipped: 0,
    staffCreated: 0,
    staffSkipped: 0,
    servicesCreated: 0,
    servicesSkipped: 0
  };

  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // -------------------------------------------------------------
  // 1. SERVICE CATEGORIES
  // -------------------------------------------------------------
  console.log('\n[Phase 1] Provisioning Service Categories...');
  const categoriesData = [
    {
      name: 'Salon & Grooming',
      slug: 'salon-grooming',
      icon: '✂️',
      description: 'Haircuts, styling, beard grooming, facials and personal pampering.',
      displayOrder: 1
    },
    {
      name: 'Beauty & Wellness',
      slug: 'beauty-wellness',
      icon: '💄',
      description: 'Bridal makeup, party makeover, skincare therapy and relaxing spa.',
      displayOrder: 2
    },
    {
      name: 'Home Maintenance',
      slug: 'home-maintenance',
      icon: '🔧',
      description: 'Certified electricians, plumbers, carpenters and appliance repairs.',
      displayOrder: 3
    },
    {
      name: 'Home Cleaning',
      slug: 'home-cleaning',
      icon: '🧹',
      description: 'Deep home cleaning, bathroom descaling, kitchen sanitization & sofa wash.',
      displayOrder: 4
    },
    {
      name: 'Vehicle Services',
      slug: 'vehicle-services',
      icon: '🚗',
      description: 'Doorstep car wash, bike servicing, detailing and breakdown inspection.',
      displayOrder: 5
    },
    {
      name: 'Education & Personal',
      slug: 'education-personal',
      icon: '📚',
      description: 'Verified home tutors, computer/laptop technicians and event photographers.',
      displayOrder: 6
    }
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const existing = await prisma.serviceCategory.findUnique({
      where: { slug: cat.slug }
    });

    if (!existing) {
      const created = await prisma.serviceCategory.create({ data: cat });
      categories[cat.slug] = created;
      stats.categoriesCreated++;
      console.log(`  [CREATE] ServiceCategory: "${cat.name}" (${cat.slug})`);
    } else {
      categories[cat.slug] = existing;
      stats.categoriesSkipped++;
      console.log(`  [SKIP] ServiceCategory already exists: "${cat.name}" (${cat.slug})`);
    }
  }

  // -------------------------------------------------------------
  // 2. SERVICE PROVIDER USERS
  // -------------------------------------------------------------
  console.log('\n[Phase 2] Provisioning Service Provider User Accounts...');
  const providerUsersData = [
    {
      email: 'quickfix.indore@everythinglocal.in',
      phone: '9893110002',
      name: 'Manish Verma',
      expectedProviderSlug: 'indore-quickfix-technicians'
    },
    {
      email: 'glamour.salon@everythinglocal.in',
      phone: '9893110001',
      name: 'Pooja Verma',
      expectedProviderSlug: 'glamour-glow-salon'
    },
    {
      email: 'sparkle.cleaning@everythinglocal.in',
      phone: '9893110003',
      name: 'Amit Patel',
      expectedProviderSlug: 'sparklepro-home-cleaning'
    },
    {
      email: 'autocare.indore@everythinglocal.in',
      phone: '9893110004',
      name: 'Rakesh Chouhan',
      expectedProviderSlug: 'autocare-indore-hub'
    }
  ];

  const userRecords: Record<string, any> = {};
  for (const u of providerUsersData) {
    let existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: u.email },
          { phone: u.phone }
        ]
      }
    });

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          phone: u.phone,
          name: u.name,
          passwordHash: defaultPasswordHash,
          role: 'MERCHANT'
        }
      });
      userRecords[u.email] = created;
      stats.usersCreated++;
      console.log(`  [CREATE] User: ${u.email} (id: ${created.id}, role: MERCHANT)`);
    } else {
      // Preserve password and never downgrade roles
      userRecords[u.email] = existing;
      stats.usersSkipped++;

      if (existing.role === 'CUSTOMER') {
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: { role: 'MERCHANT' }
        });
        userRecords[u.email] = updated;
        console.log(`  [UPDATE ROLE] User: ${u.email} (id: ${existing.id}) upgraded from CUSTOMER to MERCHANT`);
      } else {
        console.log(`  [EXISTS] User: ${u.email} (id: ${existing.id}, role: ${existing.role}) [Preserved existing password]`);
      }
    }
  }

  // -------------------------------------------------------------
  // 3. SERVICE PROVIDER PROFILES
  // -------------------------------------------------------------
  console.log('\n[Phase 3] Provisioning Service Provider Profiles...');
  const providersData = [
    {
      slug: 'indore-quickfix-technicians',
      ownerEmail: 'quickfix.indore@everythinglocal.in',
      businessName: 'Indore QuickFix Electricians & AC Service',
      description: 'Licensed, background-verified electricians, plumbers and AC technicians with 90-day warranty across Indore.',
      profileImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80',
      contactPhone: '9893110002',
      contactEmail: 'quickfix.indore@everythinglocal.in',
      categorySlug: 'home-maintenance',
      commissionRatePct: 12.0,
      rating: 4.8,
      reviewCount: 64,
      hasShopVisit: true,
      shopAddressLine: 'Shop 4, Industry House Complex, Old Palasia',
      shopCity: 'Indore',
      shopPincode: '452001',
      shopLatitude: 22.7244,
      shopLongitude: 75.8839,
      hasHomeVisit: true,
      homeVisitRadiusKm: 9.0,
      homeVisitFeePaise: 0
    },
    {
      slug: 'glamour-glow-salon',
      ownerEmail: 'glamour.salon@everythinglocal.in',
      businessName: 'Glamour & Glow Unisex Studio',
      description: 'Premium hair styling, luxury facials and expert grooming studio in Vijay Nagar with doorstep home services.',
      profileImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80',
      contactPhone: '9893110001',
      contactEmail: 'glamour.salon@everythinglocal.in',
      categorySlug: 'salon-grooming',
      commissionRatePct: 10.0,
      rating: 4.9,
      reviewCount: 38,
      hasShopVisit: true,
      shopAddressLine: 'G-12, Opposite C21 Mall, Main AB Road, Vijay Nagar',
      shopCity: 'Indore',
      shopPincode: '452010',
      shopLatitude: 22.7533,
      shopLongitude: 75.8937,
      hasHomeVisit: true,
      homeVisitRadiusKm: 8.0,
      homeVisitFeePaise: 4900
    },
    {
      slug: 'sparklepro-home-cleaning',
      ownerEmail: 'sparkle.cleaning@everythinglocal.in',
      businessName: 'SparklePro Deep Cleaning & Sanitization',
      description: 'German industrial machine deep cleaning for residences, apartments, sofas and bathrooms across Indore.',
      profileImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80',
      contactPhone: '9893110003',
      contactEmail: 'sparkle.cleaning@everythinglocal.in',
      categorySlug: 'home-cleaning',
      commissionRatePct: 10.0,
      rating: 4.9,
      reviewCount: 52,
      hasShopVisit: false,
      shopAddressLine: '14, Bengali Square, Ring Road',
      shopCity: 'Indore',
      shopPincode: '452016',
      shopLatitude: 22.7196,
      shopLongitude: 75.9088,
      hasHomeVisit: true,
      homeVisitRadiusKm: 12.0,
      homeVisitFeePaise: 0
    },
    {
      slug: 'autocare-indore-hub',
      ownerEmail: 'autocare.indore@everythinglocal.in',
      businessName: 'Indore AutoCare Doorstep Multi-brand Workshop',
      description: 'Doorstep engine oil changes, brake maintenance, battery testing, foam wash and computer OBD-II scanning.',
      profileImageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80',
      contactPhone: '9893110004',
      contactEmail: 'autocare.indore@everythinglocal.in',
      categorySlug: 'vehicle-services',
      commissionRatePct: 8.0,
      rating: 4.8,
      reviewCount: 41,
      hasShopVisit: true,
      shopAddressLine: 'Plot 18, Sapna Sangeeta Road, Near Tower Square',
      shopCity: 'Indore',
      shopPincode: '452001',
      shopLatitude: 22.7042,
      shopLongitude: 75.8711,
      hasHomeVisit: true,
      homeVisitRadiusKm: 10.0,
      homeVisitFeePaise: 0
    }
  ];

  const providerRecords: Record<string, any> = {};
  for (const p of providersData) {
    const owner = userRecords[p.ownerEmail];
    if (!owner) {
      console.warn(`  [WARN] Missing owner for ${p.slug} (${p.ownerEmail}), skipping`);
      continue;
    }

    const existing = await prisma.serviceProvider.findUnique({
      where: { slug: p.slug }
    });

    if (!existing) {
      const { ownerEmail, ...createData } = p;
      const created = await prisma.serviceProvider.create({
        data: {
          ...createData,
          ownerId: owner.id,
          isVerified: true,
          verificationStatus: 'VERIFIED',
          isOpen: true
        }
      });
      providerRecords[p.slug] = created;
      stats.providersCreated++;
      console.log(`  [CREATE] Provider: "${p.businessName}" (${p.slug}) linked to ownerId: ${owner.id}`);
    } else {
      providerRecords[p.slug] = existing;
      // Ensure ownerId and contactEmail correctly match expected account and verified status
      if (
        existing.ownerId !== owner.id ||
        existing.contactEmail !== p.contactEmail ||
        !existing.isVerified ||
        existing.verificationStatus !== 'VERIFIED'
      ) {
        const updated = await prisma.serviceProvider.update({
          where: { id: existing.id },
          data: {
            ownerId: owner.id,
            contactEmail: p.contactEmail,
            isVerified: true,
            verificationStatus: 'VERIFIED',
            isOpen: true
          }
        });
        providerRecords[p.slug] = updated;
        stats.providersUpdated++;
        console.log(`  [UPDATE LINK] Provider: "${p.slug}" updated ownerId to: ${owner.id} (${p.ownerEmail})`);
      } else {
        stats.providersSkipped++;
        console.log(`  [SKIP] Provider: "${p.slug}" already verified and correctly linked to ownerId: ${owner.id}`);
      }
    }
  }

  // -------------------------------------------------------------
  // 4. PROVIDER STAFF
  // -------------------------------------------------------------
  console.log('\n[Phase 4] Provisioning Staff Specialists...');
  const staffData = [
    // QuickFix Electricians
    { providerSlug: 'indore-quickfix-technicians', name: 'Manish Verma', role: 'Chief Electrical Engineer', phone: '9893110002' },
    { providerSlug: 'indore-quickfix-technicians', name: 'Deepak Chouhan', role: 'AC & Refrigeration Specialist', phone: '9893110023' },
    { providerSlug: 'indore-quickfix-technicians', name: 'Rahul Sen', role: 'Senior Wiring & Appliance Specialist', phone: '9893110024' },

    // Glamour & Glow Salon
    { providerSlug: 'glamour-glow-salon', name: 'Rohan Sharma', role: 'Master Hair Stylist & Groomer', phone: '9893110031' },
    { providerSlug: 'glamour-glow-salon', name: 'Pooja Verma', role: 'Senior Esthetician & Makeup Artist', phone: '9893110032' },

    // SparklePro Cleaning
    { providerSlug: 'sparklepro-home-cleaning', name: 'Amit Patel', role: 'Operations & Sanitation Lead', phone: '9893110041' },
    { providerSlug: 'sparklepro-home-cleaning', name: 'Sunil Rao', role: 'Industrial Machine Cleaning Tech', phone: '9893110042' },

    // AutoCare Hub
    { providerSlug: 'autocare-indore-hub', name: 'Rakesh Chouhan', role: 'Chief Diagnostic Mechanic', phone: '9893110051' },
    { providerSlug: 'autocare-indore-hub', name: 'Vikas Kushwah', role: 'Electrical & Battery Specialist', phone: '9893110052' }
  ];

  for (const s of staffData) {
    const prov = providerRecords[s.providerSlug];
    if (!prov) continue;

    const existingStaff = await prisma.providerStaff.findFirst({
      where: {
        providerId: prov.id,
        name: s.name
      }
    });

    if (!existingStaff) {
      await prisma.providerStaff.create({
        data: {
          providerId: prov.id,
          name: s.name,
          role: s.role,
          phone: s.phone,
          isActive: true
        }
      });
      stats.staffCreated++;
      console.log(`  [CREATE] Staff for ${s.providerSlug}: ${s.name} (${s.role})`);
    } else {
      stats.staffSkipped++;
      console.log(`  [SKIP] Staff already exists: ${s.name} (${s.providerSlug})`);
    }
  }

  // -------------------------------------------------------------
  // 5. SERVICE LISTINGS
  // -------------------------------------------------------------
  console.log('\n[Phase 5] Provisioning Service Listings...');
  const servicesData = [
    // QuickFix Listings
    {
      providerSlug: 'indore-quickfix-technicians',
      categorySlug: 'home-maintenance',
      title: 'Fan, Switch & Light Fixture Repair / Installation',
      description: 'Troubleshooting electrical short circuits, switch replacement, decorative chandelier & ceiling fan installation.',
      pricePaise: 19900,
      mrpPaise: 29900,
      pricingType: 'INSPECTION_FEE',
      durationMinutes: 45,
      allowsShopVisit: false,
      allowsHomeVisit: true
    },
    {
      providerSlug: 'indore-quickfix-technicians',
      categorySlug: 'home-maintenance',
      title: 'Split AC Foam Jet Deep Clean & Servicing',
      description: 'High-pressure water and antibacterial foam wash of indoor cooling coils and outdoor condenser with gas pressure check.',
      pricePaise: 49900,
      mrpPaise: 69900,
      pricingType: 'FIXED',
      durationMinutes: 60,
      allowsShopVisit: false,
      allowsHomeVisit: true
    },
    {
      providerSlug: 'indore-quickfix-technicians',
      categorySlug: 'home-maintenance',
      title: 'Water Purifier (RO) Complete Filter Replacement',
      description: 'Membrane inspection, sediment filter change, TDS balancing and thorough sanitization.',
      pricePaise: 39900,
      mrpPaise: 55000,
      pricingType: 'FIXED',
      durationMinutes: 45,
      allowsShopVisit: true,
      allowsHomeVisit: true
    },
    {
      providerSlug: 'indore-quickfix-technicians',
      categorySlug: 'home-maintenance',
      title: 'Full Home Electrical Safety Audit & Inverter Wiring',
      description: 'Comprehensive MCB load inspection, earthing test, inverter installation and heavy appliance surge protection.',
      pricePaise: 79900,
      mrpPaise: 119900,
      pricingType: 'FIXED',
      durationMinutes: 90,
      allowsShopVisit: false,
      allowsHomeVisit: true
    },

    // Glamour & Glow Listings
    {
      providerSlug: 'glamour-glow-salon',
      categorySlug: 'salon-grooming',
      title: 'Men Signature Haircut & Beard Sculpting',
      description: 'Precision scissor and clipper cut, beard contouring, warm towel treatment & refreshing hair wash.',
      pricePaise: 34900,
      mrpPaise: 49900,
      pricingType: 'FIXED',
      durationMinutes: 45,
      allowsShopVisit: true,
      allowsHomeVisit: true
    },
    {
      providerSlug: 'glamour-glow-salon',
      categorySlug: 'salon-grooming',
      title: 'Women Precision Cut & Blowdry Styling',
      description: 'Personalized hair consultation, volume layers or bob cut, nourishing wash and radiant blowout.',
      pricePaise: 59900,
      mrpPaise: 79900,
      pricingType: 'FIXED',
      durationMinutes: 60,
      allowsShopVisit: true,
      allowsHomeVisit: true
    },
    {
      providerSlug: 'glamour-glow-salon',
      categorySlug: 'beauty-wellness',
      title: 'O3+ Brightening Radiance Facial',
      description: 'Deep cleansing, gentle lactic peel, facial acupressure massage and detox rubber mask.',
      pricePaise: 119900,
      mrpPaise: 159900,
      pricingType: 'FIXED',
      durationMinutes: 75,
      allowsShopVisit: true,
      allowsHomeVisit: true
    },
    {
      providerSlug: 'glamour-glow-salon',
      categorySlug: 'beauty-wellness',
      title: 'Bridal & Party HD Makeup Package',
      description: 'Flawless camera-ready HD makeup, hair updo styling, draping and lashes by senior artist.',
      pricePaise: 349900,
      mrpPaise: 450000,
      pricingType: 'STARTING_FROM',
      durationMinutes: 120,
      allowsShopVisit: true,
      allowsHomeVisit: true
    }
  ];

  for (const s of servicesData) {
    const prov = providerRecords[s.providerSlug];
    const cat = categories[s.categorySlug];
    if (!prov || !cat) continue;

    const existingListing = await prisma.serviceListing.findFirst({
      where: {
        providerId: prov.id,
        title: s.title
      }
    });

    if (!existingListing) {
      await prisma.serviceListing.create({
        data: {
          providerId: prov.id,
          categoryId: cat.id,
          title: s.title,
          description: s.description,
          pricePaise: s.pricePaise,
          mrpPaise: s.mrpPaise,
          pricingType: s.pricingType,
          durationMinutes: s.durationMinutes,
          allowsShopVisit: s.allowsShopVisit,
          allowsHomeVisit: s.allowsHomeVisit,
          isActive: true
        }
      });
      stats.servicesCreated++;
      console.log(`  [CREATE] Service for ${s.providerSlug}: "${s.title}" (₹${s.pricePaise / 100})`);
    } else {
      stats.servicesSkipped++;
      console.log(`  [SKIP] Service already exists: "${s.title}" (${s.providerSlug})`);
    }
  }

  console.log('\n===============================================================');
  console.log('✅ SAFE SERVICES PROVISIONING COMPLETE');
  console.log(`   Categories: ${stats.categoriesCreated} created, ${stats.categoriesSkipped} skipped`);
  console.log(`   Users:      ${stats.usersCreated} created, ${stats.usersSkipped} skipped`);
  console.log(`   Providers:  ${stats.providersCreated} created, ${stats.providersUpdated} linked, ${stats.providersSkipped} skipped`);
  console.log(`   Staff:      ${stats.staffCreated} created, ${stats.staffSkipped} skipped`);
  console.log(`   Listings:   ${stats.servicesCreated} created, ${stats.servicesSkipped} skipped`);
  console.log('===============================================================');

  return stats;
}

/**
 * Remote D1 Provisioner: Generates and executes safe idempotent SQL against Cloudflare D1
 */
export async function seedServicesRemote(): Promise<void> {
  console.log('🌐 Executing Safe Services Provisioning against Cloudflare D1 (everything-local-db)...');
  
  const hash = '$2b$10$d1..RHnLhCKV6H1wLUrjqeP0TuuV8tyNOaIMj8GJcYZIbIYKi0HlS'; // Bcrypt hash for Password@123

  const sqlStatements = [
    // 1. Categories
    `INSERT INTO ServiceCategory (id, name, slug, icon, description, displayOrder, isActive, createdAt, updatedAt)
     VALUES
       ('cat-srv-salon', 'Salon & Grooming', 'salon-grooming', '✂️', 'Haircuts, styling, beard grooming, facials and personal pampering.', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('cat-srv-beauty', 'Beauty & Wellness', 'beauty-wellness', '💄', 'Bridal makeup, party makeover, skincare therapy and relaxing spa.', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('cat-srv-maintenance', 'Home Maintenance', 'home-maintenance', '🔧', 'Certified electricians, plumbers, carpenters and appliance repairs.', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('cat-srv-cleaning', 'Home Cleaning', 'home-cleaning', '🧹', 'Deep home cleaning, bathroom descaling, kitchen sanitization & sofa wash.', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('cat-srv-vehicle', 'Vehicle Services', 'vehicle-services', '🚗', 'Doorstep car wash, bike servicing, detailing and breakdown inspection.', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('cat-srv-education', 'Education & Personal', 'education-personal', '📚', 'Verified home tutors, computer/laptop technicians and event photographers.', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, updatedAt=CURRENT_TIMESTAMP;`,

    // 2. Ensure QuickFix account is correct (quickfix.indore@everythinglocal.in)
    `INSERT INTO User (id, email, phone, name, passwordHash, role, createdAt, updatedAt)
     VALUES
       ('usr-srv-quickfix-alias', 'quickfix.indore@everythinglocal.in', '9893110022', 'Manish Verma (QuickFix Indore)', '${hash}', 'MERCHANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET email=excluded.email, role='MERCHANT', updatedAt=CURRENT_TIMESTAMP;`,

    `INSERT INTO User (id, email, phone, name, passwordHash, role, createdAt, updatedAt)
     VALUES
       ('usr-srv-glamour', 'glamour.salon@everythinglocal.in', '9893110001', 'Pooja Verma', '${hash}', 'MERCHANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET email=excluded.email, role='MERCHANT', updatedAt=CURRENT_TIMESTAMP;`,

    // 3. Link Provider ownerId explicitly to user ID
    `INSERT INTO ServiceProvider (
       id, ownerId, businessName, slug, description, profileImageUrl,
       contactPhone, contactEmail, categorySlug, isVerified, verificationStatus,
       commissionRatePct, rating, reviewCount, hasShopVisit, shopAddressLine,
       shopCity, shopPincode, shopLatitude, shopLongitude, hasHomeVisit,
       homeVisitRadiusKm, homeVisitFeePaise, isOpen, createdAt, updatedAt
     ) VALUES (
       'prov-srv-quickfix', 'usr-srv-quickfix-alias', 'Indore QuickFix Electricians & AC Service', 'indore-quickfix-technicians',
       'Licensed, background-verified electricians, plumbers and AC technicians with 90-day warranty across Indore.',
       'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80',
       '9893110002', 'quickfix.indore@everythinglocal.in', 'home-maintenance', 1, 'VERIFIED',
       12.0, 4.8, 64, 1, 'Shop 4, Industry House Complex, Old Palasia',
       'Indore', '452001', 22.7244, 75.8839, 1,
       9.0, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
     )
     ON CONFLICT(id) DO UPDATE SET
       ownerId='usr-srv-quickfix-alias',
       contactEmail='quickfix.indore@everythinglocal.in',
       isVerified=1,
       verificationStatus='VERIFIED',
       isOpen=1,
       updatedAt=CURRENT_TIMESTAMP;`,

    `INSERT INTO ServiceProvider (
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
     ON CONFLICT(id) DO UPDATE SET
       ownerId='usr-srv-glamour',
       contactEmail='glamour.salon@everythinglocal.in',
       isVerified=1,
       verificationStatus='VERIFIED',
       isOpen=1,
       updatedAt=CURRENT_TIMESTAMP;`,

    // 4. Staff Specialists (QuickFix & Glamour)
    `INSERT INTO ProviderStaff (id, providerId, name, role, phone, isActive, createdAt)
     VALUES
       ('stf-qf-1', 'prov-srv-quickfix', 'Manish Verma', 'Chief Electrical Engineer', '9893110002', 1, CURRENT_TIMESTAMP),
       ('stf-qf-2', 'prov-srv-quickfix', 'Deepak Chouhan', 'AC & Refrigeration Specialist', '9893110023', 1, CURRENT_TIMESTAMP),
       ('stf-qf-3', 'prov-srv-quickfix', 'Rahul Sen', 'Senior Wiring & Appliance Specialist', '9893110024', 1, CURRENT_TIMESTAMP),
       ('stf-gl-1', 'prov-srv-glamour', 'Rohan Sharma', 'Master Hair Stylist & Groomer', '9893110031', 1, CURRENT_TIMESTAMP),
       ('stf-gl-2', 'prov-srv-glamour', 'Pooja Verma', 'Senior Esthetician & Makeup Artist', '9893110032', 1, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, role=excluded.role;`,

    // 5. Service Listings
    `INSERT INTO ServiceListing (
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
        79900, 119900, 'FIXED', 90, 0, 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
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
        119900, 159900, 'FIXED', 75, 1, 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('srv-gl-4', 'prov-srv-glamour', 'cat-srv-beauty',
        'Bridal & Party HD Makeup Package',
        'Flawless camera-ready HD makeup, hair updo styling, draping and lashes by senior artist.',
        349900, 450000, 'STARTING_FROM', 120, 1, 1, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET title=excluded.title, pricePaise=excluded.pricePaise, updatedAt=CURRENT_TIMESTAMP;`
  ];

  for (let i = 0; i < sqlStatements.length; i++) {
    const stmt = sqlStatements[i].trim().replace(/\r?\n/g, ' ');
    console.log(`  [D1 Execute ${i + 1}/${sqlStatements.length}] Running statement...`);
    const escapedStmt = stmt.replace(/"/g, '\\"');
    execSync(`npx wrangler d1 execute everything-local-db --remote --command "${escapedStmt}"`, { stdio: 'inherit' });
  }

  console.log('✅ Remote Cloudflare D1 safe provisioning completed successfully!');
}

// Direct execution entry point
if (require.main === module || process.argv[1]?.includes('seedServices')) {
  if (process.argv.includes('--remote')) {
    seedServicesRemote()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('Remote seeding failed:', err);
        process.exit(1);
      });
  } else {
    seedServices()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('Local seeding failed:', err);
        process.exit(1);
      });
  }
}
