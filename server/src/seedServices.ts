import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { GeospatialEngine } from './core/geospatial';

export async function seedServices() {
  console.log('Seeding Everything Local Services Marketplace...');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Service Categories
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
    const record = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat
    });
    categories[cat.slug] = record;
  }

  // 2. Providers
  // Provider 1: Glamour & Glow Unisex Salon (Vijay Nagar)
  const salonOwner = await prisma.user.upsert({
    where: { email: 'glamour.salon@everythinglocal.in' },
    update: {},
    create: {
      email: 'glamour.salon@everythinglocal.in',
      phone: '9893110001',
      name: 'Pooja Verma',
      passwordHash,
      role: 'MERCHANT'
    }
  });

  const salonProvider = await prisma.serviceProvider.upsert({
    where: { slug: 'glamour-glow-salon' },
    update: {},
    create: {
      ownerId: salonOwner.id,
      businessName: 'Glamour & Glow Unisex Studio',
      slug: 'glamour-glow-salon',
      description: 'Premium hair styling, luxury facials and expert grooming studio in Vijay Nagar with doorstep home services.',
      profileImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80',
      contactPhone: '9893110001',
      contactEmail: 'glamour.salon@everythinglocal.in',
      categorySlug: 'salon-grooming',
      isVerified: true,
      verificationStatus: 'VERIFIED',
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
      homeVisitFeePaise: 4900 // ₹49 visit fee
    }
  });

  // Salon Staff
  await prisma.providerStaff.createMany({
    data: [
      { providerId: salonProvider.id, name: 'Rohan Sharma', role: 'Master Hair Stylist & Groomer' },
      { providerId: salonProvider.id, name: 'Pooja Verma', role: 'Senior Esthetician & Makeup Artist' }
    ]
  }).catch(() => {});

  // Salon Services
  const salonServicesData = [
    {
      providerId: salonProvider.id,
      categoryId: categories['salon-grooming'].id,
      title: 'Men Signature Haircut & Beard Sculpting',
      description: 'Precision scissor and clipper cut, beard contouring, warm towel treatment & hair wash.',
      pricePaise: 34900, // ₹349
      mrpPaise: 49900,
      durationMinutes: 45,
      allowsShopVisit: true,
      allowsHomeVisit: true
    },
    {
      providerId: salonProvider.id,
      categoryId: categories['salon-grooming'].id,
      title: 'Women Precision Cut & Blowdry Styling',
      description: 'Personalized hair consultation, volume layers or bob, nourishing wash and radiant blowout.',
      pricePaise: 59900, // ₹599
      mrpPaise: 79900,
      durationMinutes: 60,
      allowsShopVisit: true,
      allowsHomeVisit: true
    },
    {
      providerId: salonProvider.id,
      categoryId: categories['beauty-wellness'].id,
      title: 'O3+ Brightening Radiance Facial',
      description: 'Deep cleansing, gentle lactic peel, facial acupressure massage and detox rubber mask.',
      pricePaise: 119900, // ₹1,199
      mrpPaise: 159900,
      durationMinutes: 75,
      allowsShopVisit: true,
      allowsHomeVisit: true
    },
    {
      providerId: salonProvider.id,
      categoryId: categories['beauty-wellness'].id,
      title: 'Bridal & Party HD Makeup Package',
      description: 'Flawless camera-ready HD makeup, hair updo styling, draping and lashes by senior artist.',
      pricePaise: 349900, // ₹3,499
      mrpPaise: 450000,
      pricingType: 'STARTING_FROM',
      durationMinutes: 120,
      allowsShopVisit: true,
      allowsHomeVisit: true
    }
  ];

  for (const s of salonServicesData) {
    const existing = await prisma.serviceListing.findFirst({
      where: { providerId: s.providerId, title: s.title }
    });
    if (!existing) {
      await prisma.serviceListing.create({ data: s });
    }
  }

  // Provider 2: Indore QuickFix Electricians & Appliance Repairs (Palasia)
  const quickFixOwner = await prisma.user.upsert({
    where: { email: 'quickfix.indore@everythinglocal.in' },
    update: {},
    create: {
      email: 'quickfix.indore@everythinglocal.in',
      phone: '9893110002',
      name: 'Manish Verma',
      passwordHash,
      role: 'MERCHANT'
    }
  });

  const quickFixProvider = await prisma.serviceProvider.upsert({
    where: { slug: 'indore-quickfix-technicians' },
    update: {},
    create: {
      ownerId: quickFixOwner.id,
      businessName: 'Indore QuickFix Electricians & AC Service',
      slug: 'indore-quickfix-technicians',
      description: 'Licensed, background-verified electricians, plumbers and AC technicians with 90-day warranty.',
      profileImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80',
      contactPhone: '9893110002',
      contactEmail: 'quickfix.indore@everythinglocal.in',
      categorySlug: 'home-maintenance',
      isVerified: true,
      verificationStatus: 'VERIFIED',
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
      homeVisitFeePaise: 0 // Free visit fee
    }
  });

  await prisma.providerStaff.createMany({
    data: [
      { providerId: quickFixProvider.id, name: 'Manish Verma', role: 'Chief Electrical Engineer' },
      { providerId: quickFixProvider.id, name: 'Deepak Chouhan', role: 'AC & Refrigeration Specialist' }
    ]
  }).catch(() => {});

  const quickFixServices = [
    {
      providerId: quickFixProvider.id,
      categoryId: categories['home-maintenance'].id,
      title: 'Fan, Switch & Light Fixture Repair / Installation',
      description: 'Troubleshooting electrical short circuits, switch replacement, decorative chandelier & fan installation.',
      pricePaise: 19900, // ₹199
      mrpPaise: 29900,
      pricingType: 'INSPECTION_FEE',
      durationMinutes: 45,
      allowsShopVisit: false,
      allowsHomeVisit: true
    },
    {
      providerId: quickFixProvider.id,
      categoryId: categories['home-maintenance'].id,
      title: 'Split AC Foam Jet Deep Clean & Servicing',
      description: 'High-pressure water and antibacterial foam wash of indoor cooling coils and outdoor condenser.',
      pricePaise: 49900, // ₹499
      mrpPaise: 69900,
      durationMinutes: 60,
      allowsShopVisit: false,
      allowsHomeVisit: true
    },
    {
      providerId: quickFixProvider.id,
      categoryId: categories['home-maintenance'].id,
      title: 'Water Purifier (RO) Complete Filter Replacement',
      description: 'Membrane inspection, sediment filter change, TDS balancing and sanitization.',
      pricePaise: 39900, // ₹399
      mrpPaise: 55000,
      durationMinutes: 45,
      allowsShopVisit: true,
      allowsHomeVisit: true
    }
  ];

  for (const s of quickFixServices) {
    const existing = await prisma.serviceListing.findFirst({
      where: { providerId: s.providerId, title: s.title }
    });
    if (!existing) {
      await prisma.serviceListing.create({ data: s });
    }
  }

  // Provider 3: SparklePro Home Deep Cleaning (Saket / Bengali Square)
  const cleaningOwner = await prisma.user.upsert({
    where: { email: 'sparkle.cleaning@everythinglocal.in' },
    update: {},
    create: {
      email: 'sparkle.cleaning@everythinglocal.in',
      phone: '9893110003',
      name: 'Amit Patel',
      passwordHash,
      role: 'MERCHANT'
    }
  });

  const cleaningProvider = await prisma.serviceProvider.upsert({
    where: { slug: 'sparklepro-home-cleaning' },
    update: {},
    create: {
      ownerId: cleaningOwner.id,
      businessName: 'SparklePro Deep Cleaning & Sanitization',
      slug: 'sparklepro-home-cleaning',
      description: 'German industrial machine deep cleaning for residences, apartments, sofas and bathrooms across Indore.',
      profileImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80',
      contactPhone: '9893110003',
      contactEmail: 'sparkle.cleaning@everythinglocal.in',
      categorySlug: 'home-cleaning',
      isVerified: true,
      verificationStatus: 'VERIFIED',
      commissionRatePct: 10.0,
      rating: 4.9,
      reviewCount: 52,
      hasShopVisit: false,
      shopAddressLine: '12 Anand Bazar Road, Saket Nagar',
      shopCity: 'Indore',
      shopPincode: '452018',
      shopLatitude: 22.7208,
      shopLongitude: 75.8942,
      hasHomeVisit: true,
      homeVisitRadiusKm: 12.0, // Wide coverage
      homeVisitFeePaise: 0
    }
  });

  const cleaningServices = [
    {
      providerId: cleaningProvider.id,
      categoryId: categories['home-cleaning'].id,
      title: 'Full Home Deep Cleaning (2BHK / 3BHK)',
      description: 'Floor single-disc scrubbing, balcony wash, window glass cleaning, bathroom limescale treatment & kitchen degreasing.',
      pricePaise: 249900, // ₹2,499
      mrpPaise: 320000,
      pricingType: 'STARTING_FROM',
      durationMinutes: 180,
      allowsShopVisit: false,
      allowsHomeVisit: true
    },
    {
      providerId: cleaningProvider.id,
      categoryId: categories['home-cleaning'].id,
      title: 'Bathroom Intensive Scrub & Descaling',
      description: 'Hard water tile stain removal, mirror buffing, sanitaryware sanitization and drain declogging.',
      pricePaise: 44900, // ₹449
      mrpPaise: 60000,
      durationMinutes: 60,
      allowsShopVisit: false,
      allowsHomeVisit: true
    },
    {
      providerId: cleaningProvider.id,
      categoryId: categories['home-cleaning'].id,
      title: '5-Seater Fabric Sofa Shampoo & Vacuum',
      description: 'Deep moisture extraction, organic stain removal and fabric conditioning.',
      pricePaise: 69900, // ₹699
      mrpPaise: 95000,
      durationMinutes: 90,
      allowsShopVisit: false,
      allowsHomeVisit: true
    }
  ];

  for (const s of cleaningServices) {
    const existing = await prisma.serviceListing.findFirst({
      where: { providerId: s.providerId, title: s.title }
    });
    if (!existing) {
      await prisma.serviceListing.create({ data: s });
    }
  }

  // Provider 4: AutoCare Doorstep Car & Bike (AB Road / Bhawarkua)
  const autoOwner = await prisma.user.upsert({
    where: { email: 'autocare.indore@everythinglocal.in' },
    update: {},
    create: {
      email: 'autocare.indore@everythinglocal.in',
      phone: '9893110004',
      name: 'Rakesh Chouhan',
      passwordHash,
      role: 'MERCHANT'
    }
  });

  const autoProvider = await prisma.serviceProvider.upsert({
    where: { slug: 'autocare-doorstep-wash' },
    update: {},
    create: {
      ownerId: autoOwner.id,
      businessName: 'AutoCare Express Doorstep Vehicle Care',
      slug: 'autocare-doorstep-wash',
      description: 'High-pressure foam wash, interior vacuuming and two-wheeler general servicing at your parking lot.',
      profileImageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=500&auto=format&fit=crop&q=80',
      contactPhone: '9893110004',
      contactEmail: 'autocare.indore@everythinglocal.in',
      categorySlug: 'vehicle-services',
      isVerified: true,
      verificationStatus: 'VERIFIED',
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
  });

  const autoServices = [
    {
      providerId: autoProvider.id,
      categoryId: categories['vehicle-services'].id,
      title: 'Complete Doorstep Car Foam Wash & Interior Vacuum',
      description: 'Snow foam shampoo, high pressure rinse, tyre shine, dashboard polish and thorough interior vacuum.',
      pricePaise: 49900, // ₹499
      mrpPaise: 65000,
      durationMinutes: 60,
      allowsShopVisit: true,
      allowsHomeVisit: true
    },
    {
      providerId: autoProvider.id,
      categoryId: categories['vehicle-services'].id,
      title: 'Motorcycle / Scooter General Servicing',
      description: 'Brake inspection, chain lubrication, spark plug clean, electrical check and wash.',
      pricePaise: 39900, // ₹399
      mrpPaise: 50000,
      durationMinutes: 60,
      allowsShopVisit: true,
      allowsHomeVisit: true
    }
  ];

  for (const s of autoServices) {
    const existing = await prisma.serviceListing.findFirst({
      where: { providerId: s.providerId, title: s.title }
    });
    if (!existing) {
      await prisma.serviceListing.create({ data: s });
    }
  }

  console.log('✅ Services Marketplace successfully seeded with verified Indore providers!');
}
