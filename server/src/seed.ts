import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { GeospatialEngine } from './core/geospatial';
import { seedServices } from './seedServices';

async function seed() {
  console.log('🌱 Seeding Everything Local (Indore pilot data)...');

  // Clear existing data safely
  await prisma.dispensingRecord.deleteMany();
  await prisma.prescriptionAuditEvent.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.pharmacyQuotation.deleteMany();
  await prisma.pharmacyOrder.deleteMany();
  await prisma.prescriptionDocument.deleteMany();
  await prisma.prescriptionReview.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.pharmacyInventory.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.medicineClassification.deleteMany();
  await prisma.registeredPharmacist.deleteMany();
  await prisma.pharmacyLicence.deleteMany();
  await prisma.pharmacy.deleteMany();

  // Service ecosystem tables
  await prisma.servicePayment.deleteMany();
  await prisma.serviceReview.deleteMany();
  await prisma.bookingStatusEvent.deleteMany();
  await prisma.providerEarning.deleteMany();
  await prisma.appointmentSlot.deleteMany();
  await prisma.serviceBooking.deleteMany();
  await prisma.serviceListing.deleteMany();
  await prisma.providerStaff.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.providerAvailability.deleteMany();
  await prisma.serviceProvider.deleteMany();

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

  // ====================================================
  // 6. PHARMACY & MEDICAL MARKETPLACE SEED DATA
  // ====================================================
  console.log('💊 Seeding Pharmacy, Medicines & Registered Pharmacists...');

  // Medicine Classifications
  await prisma.medicineClassification.createMany({
    data: [
      {
        code: 'OTC',
        name: 'Over-the-Counter Essentials',
        requiresPrescription: false,
        isOnlineSalePermitted: true,
        description: 'General wellness, first aid, oral rehydration and mild pain relievers.'
      },
      {
        code: 'SCHEDULE_H',
        name: 'Schedule H Prescription Drugs',
        requiresPrescription: true,
        isOnlineSalePermitted: true,
        description: 'Caution: Not to be sold without prescription of a Registered Medical Practitioner.',
        regulatoryNotes: 'Dispensing requires registered pharmacist verification under Rule 65 of Drugs and Cosmetics Rules, 1945.'
      },
      {
        code: 'SCHEDULE_H1',
        name: 'Schedule H1 Restrictive Antibiotics',
        requiresPrescription: true,
        isOnlineSalePermitted: true,
        description: 'Strict statutory register maintained for batch number, prescriber and patient details.'
      },
      {
        code: 'SCHEDULE_X',
        name: 'Schedule X Psychotropic & Controlled Drugs',
        requiresPrescription: true,
        isOnlineSalePermitted: false,
        description: 'Online sale and delivery strictly prohibited under Indian law.'
      },
      {
        code: 'MEDICAL_DEVICE',
        name: 'Medical Diagnostics & Healthcare Devices',
        requiresPrescription: false,
        isOnlineSalePermitted: true,
        description: 'Blood glucose monitors, BP monitors, thermometers, pulse oximeters.'
      },
      {
        code: 'FIRST_AID',
        name: 'First Aid & Wound Care',
        requiresPrescription: false,
        isOnlineSalePermitted: true,
        description: 'Bandages, antiseptic liquids, pain sprays and dressings.'
      }
    ]
  });

  // Master Medicines
  const medicinesData = [
    {
      name: 'Dolo 650 Tablet',
      brand: 'Micro Labs',
      genericName: 'Paracetamol (650mg)',
      strength: '650mg',
      dosageForm: 'Tablet',
      packSize: '15 Tablets per strip',
      manufacturer: 'Micro Labs Ltd',
      mrpPaise: 3350,
      sellingPricePaise: 3100, // ₹31.00
      classification: 'OTC',
      requiresPrescription: false,
      storageRequirement: 'Store below 30°C in a dry place',
      barcode: '8901148201201'
    },
    {
      name: 'Digene Antacid Gel Orange 200ml',
      brand: 'Abbott',
      genericName: 'Magnesium Hydroxide + Simethicone + Aluminium Hydroxide',
      strength: '200ml',
      dosageForm: 'Syrup',
      packSize: '200ml Bottle',
      manufacturer: 'Abbott India Ltd',
      mrpPaise: 15500,
      sellingPricePaise: 14000, // ₹140.00
      classification: 'OTC',
      requiresPrescription: false,
      storageRequirement: 'Store below 25°C',
      barcode: '8901034002341'
    },
    {
      name: 'Augmentin 625 Duo Tablet',
      brand: 'GSK',
      genericName: 'Amoxycillin (500mg) + Clavulanic Acid (125mg)',
      strength: '625mg',
      dosageForm: 'Tablet',
      packSize: '10 Tablets per strip',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
      mrpPaise: 22350,
      sellingPricePaise: 20100, // ₹201.00
      classification: 'SCHEDULE_H',
      requiresPrescription: true,
      storageRequirement: 'Store in airtight container below 25°C',
      barcode: '8901043004523'
    },
    {
      name: 'Azithral 500 Tablet',
      brand: 'Alembic',
      genericName: 'Azithromycin (500mg)',
      strength: '500mg',
      dosageForm: 'Tablet',
      packSize: '5 Tablets per strip',
      manufacturer: 'Alembic Pharmaceuticals Ltd',
      mrpPaise: 13200,
      sellingPricePaise: 11900, // ₹119.00
      classification: 'SCHEDULE_H',
      requiresPrescription: true,
      storageRequirement: 'Store protected from light and moisture',
      barcode: '8901235006742'
    },
    {
      name: 'Pantocid 40 Tablet',
      brand: 'Sun Pharma',
      genericName: 'Pantoprazole (40mg)',
      strength: '40mg',
      dosageForm: 'Tablet',
      packSize: '15 Tablets per strip',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      mrpPaise: 17500,
      sellingPricePaise: 15500, // ₹155.00
      classification: 'SCHEDULE_H',
      requiresPrescription: true,
      storageRequirement: 'Store below 25°C',
      barcode: '8901117008924'
    },
    {
      name: 'Telma 40 Tablet',
      brand: 'Glenmark',
      genericName: 'Telmisartan (40mg)',
      strength: '40mg',
      dosageForm: 'Tablet',
      packSize: '30 Tablets per strip',
      manufacturer: 'Glenmark Pharmaceuticals Ltd',
      mrpPaise: 24500,
      sellingPricePaise: 22000, // ₹220.00
      classification: 'SCHEDULE_H',
      requiresPrescription: true,
      storageRequirement: 'Store below 30°C',
      barcode: '8901222009112'
    },
    {
      name: 'Cefix 200 Tablet',
      brand: 'Cipla',
      genericName: 'Cefixime (200mg)',
      strength: '200mg',
      dosageForm: 'Tablet',
      packSize: '10 Tablets per strip',
      manufacturer: 'Cipla Ltd',
      mrpPaise: 11500,
      sellingPricePaise: 9800, // ₹98.00
      classification: 'SCHEDULE_H1',
      requiresPrescription: true,
      storageRequirement: 'Store in cool dry place',
      barcode: '8901111003425'
    },
    {
      name: 'Accu-Chek Active Blood Glucose Monitor Kit',
      brand: 'Roche',
      genericName: 'Blood Glucose Monitoring System with 10 Test Strips',
      strength: 'Kit',
      dosageForm: 'Device',
      packSize: '1 Meter + 10 Strips + Lancing Device',
      manufacturer: 'Roche Diabetes Care India',
      mrpPaise: 169900,
      sellingPricePaise: 144900, // ₹1,449.00
      classification: 'MEDICAL_DEVICE',
      requiresPrescription: false,
      storageRequirement: 'Store between 2°C and 30°C',
      barcode: '8901999001001'
    },
    {
      name: 'Omron HEM 7120 Digital Blood Pressure Monitor',
      brand: 'Omron',
      genericName: 'Fully Automatic Upper Arm Blood Pressure Monitor',
      strength: 'Standard Cuff',
      dosageForm: 'Device',
      packSize: '1 Unit with Cuff & Batteries',
      manufacturer: 'Omron Healthcare India Pvt Ltd',
      mrpPaise: 245000,
      sellingPricePaise: 199900, // ₹1,999.00
      classification: 'MEDICAL_DEVICE',
      requiresPrescription: false,
      storageRequirement: 'Handle with care',
      barcode: '8901999002002'
    },
    {
      name: 'Dettol Antiseptic Liquid 250ml',
      brand: 'Reckitt Benckiser',
      genericName: 'Chloroxylenol (4.8% w/v)',
      strength: '250ml',
      dosageForm: 'Liquid',
      packSize: '250ml Bottle',
      manufacturer: 'Reckitt Benckiser Healthcare India',
      mrpPaise: 14800,
      sellingPricePaise: 14000, // ₹140.00
      classification: 'FIRST_AID',
      requiresPrescription: false,
      storageRequirement: 'Keep away from eyes and open flames',
      barcode: '8901396001234'
    },
    {
      name: 'Volini Pain Relief Gel 75g',
      brand: 'Sun Pharma',
      genericName: 'Diclofenac Diethylamine + Virgin Linseed Oil + Methyl Salicylate + Menthol',
      strength: '75g',
      dosageForm: 'Gel',
      packSize: '75g Tube',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      mrpPaise: 21500,
      sellingPricePaise: 19500, // ₹195.00
      classification: 'FIRST_AID',
      requiresPrescription: false,
      storageRequirement: 'Do not freeze',
      barcode: '8901117007788'
    },
    {
      name: 'Hansaplast Regular Bandage Strips (Pack of 20)',
      brand: 'Hansaplast',
      genericName: 'Medicated Wound Plaster with Silver Healing',
      strength: '20 Strips',
      dosageForm: 'Plaster',
      packSize: '20 Strips Pack',
      manufacturer: 'Beiersdorf India Pvt Ltd',
      mrpPaise: 6000,
      sellingPricePaise: 5500, // ₹55.00
      classification: 'FIRST_AID',
      requiresPrescription: false,
      storageRequirement: 'Store in dry place',
      barcode: '8901088001122'
    }
  ];

  const createdMedicines: any[] = [];
  for (const m of medicinesData) {
    const med = await prisma.medicine.create({ data: m });
    createdMedicines.push(med);
  }

  // 7. Registered Pharmacist User Account
  const pharmacistUser = await prisma.user.create({
    data: {
      email: 'pooja.pharmacist@everythinglocal.in',
      phone: '9893000009',
      name: 'Pooja Verma, B.Pharm',
      passwordHash,
      role: 'MERCHANT'
    }
  });

  // 8. Licensed Pharmacy: Apollo Pharmacy (Palasia, Indore)
  const apolloPharmacy = await prisma.pharmacy.create({
    data: {
      ownerId: pharmacistUser.id,
      name: 'Apollo Pharmacy & Chemist',
      legalBusinessName: 'Apollo MedRetail Central India Ltd',
      slug: 'apollo-pharmacy-palasia',
      addressLine: 'Shop 1-2, Classic Centre, Old Palasia',
      city: 'Indore',
      pincode: '452001',
      latitude: GeospatialEngine.INDORE_LANDMARKS.PALASIA.latitude,
      longitude: GeospatialEngine.INDORE_LANDMARKS.PALASIA.longitude,
      phone: '0731-4022881',
      email: 'apollo.palasia@everythinglocal.in',
      operatingHours: '24x7 Emergency Delivery Available',
      serviceRadiusKm: 6.0,
      isOpen: true,
      isVerified: true,
      verificationStatus: 'APPROVED',
      counterPickup: true,
      homeDelivery: true,
      licences: {
        create: [
          {
            licenceType: 'FORM_20',
            licenceNumber: 'MP/IND/20/2023/10842',
            issuingAuthority: 'Madhya Pradesh Food and Drugs Administration (FDA)',
            validFrom: new Date('2023-01-01'),
            validUpto: new Date('2028-12-31'),
            status: 'VERIFIED'
          },
          {
            licenceType: 'FORM_21',
            licenceNumber: 'MP/IND/21/2023/10843',
            issuingAuthority: 'Madhya Pradesh Food and Drugs Administration (FDA)',
            validFrom: new Date('2023-01-01'),
            validUpto: new Date('2028-12-31'),
            status: 'VERIFIED'
          }
        ]
      },
      pharmacists: {
        create: {
          name: 'Pooja Verma, B.Pharm',
          registrationNumber: 'MPPC-48291',
          councilName: 'Madhya Pradesh State Pharmacy Council',
          qualification: 'B.Pharm (RGPV Bhopal)',
          registrationValidity: new Date('2029-05-31'),
          phone: '9893000009',
          email: 'pooja.pharmacist@everythinglocal.in',
          isPrimary: true,
          isActive: true
        }
      }
    }
  });

  // Seed Inventory for Apollo Pharmacy
  for (const med of createdMedicines) {
    await prisma.pharmacyInventory.create({
      data: {
        pharmacyId: apolloPharmacy.id,
        medicineId: med.id,
        batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: new Date('2026-12-31'),
        stockQuantity: 45,
        mrpPaise: med.mrpPaise,
        sellingPricePaise: med.sellingPricePaise,
        isAvailable: true
      }
    });
  }

  // 9. Licensed Pharmacy: MedPlus Super Pharmacy (Vijay Nagar, Indore)
  const medplusUser = await prisma.user.create({
    data: {
      email: 'medplus.vijaynagar@everythinglocal.in',
      phone: '9893000010',
      name: 'Gaurav Jain, M.Pharm',
      passwordHash,
      role: 'MERCHANT'
    }
  });

  const medplusPharmacy = await prisma.pharmacy.create({
    data: {
      ownerId: medplusUser.id,
      name: 'MedPlus Super Pharmacy',
      legalBusinessName: 'MedPlus Health Services Central India Ltd',
      slug: 'medplus-pharmacy-vijaynagar',
      addressLine: 'Plot 18, Scheme 54, Sector B, Vijay Nagar',
      city: 'Indore',
      pincode: '452010',
      latitude: GeospatialEngine.INDORE_LANDMARKS.VIJAY_NAGAR.latitude,
      longitude: GeospatialEngine.INDORE_LANDMARKS.VIJAY_NAGAR.longitude,
      phone: '0731-4099234',
      email: 'medplus.vijaynagar@everythinglocal.in',
      operatingHours: '07:00 AM - 11:30 PM',
      serviceRadiusKm: 5.0,
      isOpen: true,
      isVerified: true,
      verificationStatus: 'APPROVED',
      counterPickup: true,
      homeDelivery: true,
      licences: {
        create: [
          {
            licenceType: 'FORM_20',
            licenceNumber: 'MP/IND/20/2022/09412',
            issuingAuthority: 'Madhya Pradesh Food and Drugs Administration (FDA)',
            validFrom: new Date('2022-06-01'),
            validUpto: new Date('2027-05-31'),
            status: 'VERIFIED'
          }
        ]
      },
      pharmacists: {
        create: {
          name: 'Gaurav Jain, M.Pharm',
          registrationNumber: 'MPPC-39120',
          councilName: 'Madhya Pradesh State Pharmacy Council',
          qualification: 'M.Pharm (Pharmacology)',
          registrationValidity: new Date('2028-09-30'),
          phone: '9893000010',
          email: 'medplus.vijaynagar@everythinglocal.in',
          isPrimary: true,
          isActive: true
        }
      }
    }
  });

  // Seed Inventory for MedPlus Pharmacy
  for (const med of createdMedicines) {
    await prisma.pharmacyInventory.create({
      data: {
        pharmacyId: medplusPharmacy.id,
        medicineId: med.id,
        batchNumber: `MED-${Math.floor(2000 + Math.random() * 8000)}`,
        expiryDate: new Date('2027-06-30'),
        stockQuantity: 30,
        mrpPaise: med.mrpPaise,
        sellingPricePaise: med.sellingPricePaise,
        isAvailable: true
      }
    });
  }

  // Seed Services Marketplace
  console.log('Seeding Services Marketplace...');
  await seedServices();

  console.log('✅ Seed completed successfully:');
  console.log(' - Admin: admin@everythinglocal.in (Password@123)');
  console.log(' - Customer: ayush@example.com (Password@123)');
  console.log(' - Merchant 1: sharma.kirana@everythinglocal.in (Password@123)');
  console.log(' - Merchant 2: apna.fresh@everythinglocal.in (Password@123)');
  console.log(' - Merchant 3: bakewell@everythinglocal.in (Password@123)');
  console.log(' - Pharmacist 1: pooja.pharmacist@everythinglocal.in (Password@123) [Apollo Pharmacy Palasia]');
  console.log(' - Pharmacist 2: medplus.vijaynagar@everythinglocal.in (Password@123) [MedPlus Vijay Nagar]');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
