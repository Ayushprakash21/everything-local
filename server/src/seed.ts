import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { GeospatialEngine } from './core/geospatial';
import { seedServices } from './seedServices';

async function seed() {
  console.log('🌱 Seeding Everything Local (Indore pilot data)...');

  // Clear existing data safely
  await prisma.loyaltyLedgerEntry.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.communityCampaign.deleteMany();
  await prisma.householdShoppingItem.deleteMany();
  await prisma.householdMember.deleteMany();
  await prisma.household.deleteMany();
  await prisma.merchantSettlementStatement.deleteMany();
  await prisma.categoryCommissionRule.deleteMany();
  await prisma.deliveryPricingRule.deleteMany();
  await prisma.riderEarningLedger.deleteMany();
  await prisma.riderSettlement.deleteMany();
  await prisma.deliveryTask.deleteMany();
  await prisma.riderProfile.deleteMany();
  await prisma.merchantChildOrderItem.deleteMany();
  await prisma.merchantChildOrder.deleteMany();
  await prisma.parentOrder.deleteMany();

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
            description: '100% whole wheat stoneground flour with natural dietary fibres.',
            category: 'Flour & Grains',
            imageUrl: '/product-images/groceries/aashirvaad-chakki-atta.webp',
            mrpPaise: 26000,
            pricePaise: 23500, // ₹235.00
            stock: 45,
            isAvailable: true,
            sku: 'KIR-ATT-001'
          },
          {
            name: 'Fortune Sunlite Refined Sunflower Oil 1L',
            description: 'Pure and light cooking oil enriched with vitamins A & D.',
            category: 'Edible Oils',
            imageUrl: '/product-images/groceries/fortune-sunflower-oil.webp',
            mrpPaise: 16500,
            pricePaise: 14500, // ₹145.00
            stock: 50,
            isAvailable: true,
            sku: 'KIR-OIL-002'
          },
          {
            name: 'Fortune Kachi Ghani Pure Mustard Oil 1L',
            description: 'Cold-pressed pungent mustard oil retaining natural antioxidants.',
            category: 'Edible Oils',
            imageUrl: '/product-images/groceries/mustard-oil.webp',
            mrpPaise: 17500,
            pricePaise: 15200, // ₹152.00
            stock: 45,
            isAvailable: true,
            sku: 'KIR-OIL-003'
          },
          {
            name: 'Amul Pure Cow Ghee Tin 1L',
            description: 'Traditional golden granulated cow ghee with rich sacred aroma.',
            category: 'Edible Oils',
            imageUrl: '/product-images/groceries/cow-ghee.webp',
            mrpPaise: 67500,
            pricePaise: 62000, // ₹620.00
            stock: 20,
            isAvailable: true,
            sku: 'KIR-GHE-004'
          },
          {
            name: 'Tata Salt Vacuum Evaporated 1kg',
            description: 'Desh Ka Namak with essential guaranteed iodine.',
            category: 'Spices & Seasoning',
            imageUrl: '/product-images/groceries/tata-salt.webp',
            mrpPaise: 3000,
            pricePaise: 2800, // ₹28.00
            stock: 120,
            isAvailable: true,
            sku: 'KIR-SLT-005'
          },
          {
            name: 'Madhur Pure & Hygienic Sugar 1kg',
            description: 'Sulphur-free refined crystalline sugar prepared contactless.',
            category: 'Grocery Staples',
            imageUrl: '/product-images/groceries/madhur-sugar.webp',
            mrpPaise: 6000,
            pricePaise: 5400, // ₹54.00
            stock: 80,
            isAvailable: true,
            sku: 'KIR-SGR-006'
          },
          {
            name: 'India Gate Basmati Rice Feast Rozzana 1kg',
            description: 'Aromatic aged long-grain basmati rice perfect for daily meals.',
            category: 'Rice & Grains',
            imageUrl: '/product-images/groceries/india-gate-basmati-rice.webp',
            mrpPaise: 12000,
            pricePaise: 9900, // ₹99.00
            stock: 30,
            isAvailable: true,
            sku: 'KIR-RIC-007'
          },
          {
            name: 'Tata Sampann Unpolished Toor Dal 1kg',
            description: 'Natural unpolished yellow pigeon peas rich in wholesome protein.',
            category: 'Pulses & Dals',
            imageUrl: '/product-images/groceries/toor-dal.webp',
            mrpPaise: 18500,
            pricePaise: 16800, // ₹168.00
            stock: 35,
            isAvailable: true,
            sku: 'KIR-DAL-008'
          },
          {
            name: 'Organic Shudh Moong Dal Dhuli 1kg',
            description: 'Easy-to-digest yellow split green gram with zero synthetic polish.',
            category: 'Pulses & Dals',
            imageUrl: '/product-images/groceries/moong-dal.webp',
            mrpPaise: 16000,
            pricePaise: 14200, // ₹142.00
            stock: 40,
            isAvailable: true,
            sku: 'KIR-DAL-009'
          },
          {
            name: 'Premium Unpolished Chana Dal 1kg',
            description: 'Hearty split Bengal gram for tadka dal and evening snacks.',
            category: 'Pulses & Dals',
            imageUrl: '/product-images/groceries/chana-dal.webp',
            mrpPaise: 12500,
            pricePaise: 10800, // ₹108.00
            stock: 30,
            isAvailable: true,
            sku: 'KIR-DAL-010'
          },
          {
            name: 'Desi Masoor Dal Malka 1kg',
            description: 'Fast-cooking orange-red split lentils enriched with dietary iron.',
            category: 'Pulses & Dals',
            imageUrl: '/product-images/groceries/masoor-dal.webp',
            mrpPaise: 13000,
            pricePaise: 11500, // ₹115.00
            stock: 35,
            isAvailable: true,
            sku: 'KIR-DAL-011'
          },
          {
            name: 'Chitra Red Kidney Beans Rajma 1kg',
            description: 'Authentic Himalayan red kidney beans that cook tender in rich gravy.',
            category: 'Pulses & Dals',
            imageUrl: '/product-images/groceries/rajma.webp',
            mrpPaise: 19500,
            pricePaise: 17500, // ₹175.00
            stock: 25,
            isAvailable: true,
            sku: 'KIR-PUL-012'
          },
          {
            name: 'Amritsari Kabuli Chana 1kg',
            description: 'Large, uniform white chickpeas ideal for classic Punjabi chole.',
            category: 'Pulses & Dals',
            imageUrl: '/product-images/groceries/kabuli-chana.webp',
            mrpPaise: 18000,
            pricePaise: 15900, // ₹159.00
            stock: 28,
            isAvailable: true,
            sku: 'KIR-PUL-013'
          },
          {
            name: 'Ujjaini Special Thick Poha 1kg',
            description: 'Crisp, thick flattened rice from Malwa, ideal for Indori breakfast poha.',
            category: 'Flour & Grains',
            imageUrl: '/product-images/groceries/indori-poha.webp',
            mrpPaise: 6500,
            pricePaise: 5200, // ₹52.00
            stock: 50,
            isAvailable: true,
            sku: 'KIR-POH-014'
          },
          {
            name: 'Rajdhani Granular Sooji Rava 1kg',
            description: 'Double-roasted granular durum wheat semolina for halwa, upma, and idli.',
            category: 'Flour & Grains',
            imageUrl: '/product-images/groceries/sooji-rava.webp',
            mrpPaise: 6000,
            pricePaise: 4800, // ₹48.00
            stock: 40,
            isAvailable: true,
            sku: 'KIR-SOO-015'
          },
          {
            name: 'Fortune Fine Stoneground Besan 500g',
            description: 'Pure chana dal flour milled to micro-fine perfection for kadhi and pakoras.',
            category: 'Flour & Grains',
            imageUrl: '/product-images/groceries/besan.webp',
            mrpPaise: 5500,
            pricePaise: 4400, // ₹44.00
            stock: 60,
            isAvailable: true,
            sku: 'KIR-BES-016'
          },
          {
            name: 'Everest Agmark Turmeric Powder 200g',
            description: 'Vibrant golden haldi powder ground from select Salem turmeric rhizomes.',
            category: 'Spices & Seasoning',
            imageUrl: '/product-images/groceries/turmeric-powder.webp',
            mrpPaise: 6500,
            pricePaise: 5800, // ₹58.00
            stock: 60,
            isAvailable: true,
            sku: 'KIR-SPC-017'
          },
          {
            name: 'Everest Tikhalal Red Chilli Powder 200g',
            description: 'Pungent fiery red chilli powder for rich Malwa curry color and heat.',
            category: 'Spices & Seasoning',
            imageUrl: '/product-images/groceries/red-chilli-powder.webp',
            mrpPaise: 9500,
            pricePaise: 8500, // ₹85.00
            stock: 50,
            isAvailable: true,
            sku: 'KIR-SPC-018'
          },
          {
            name: 'Catch Whole Cumin Seeds Jeera 200g',
            description: 'High-essential-oil aromatic whole cumin seeds for tempering dal and sabzi.',
            category: 'Spices & Seasoning',
            imageUrl: '/product-images/groceries/cumin-seeds.webp',
            mrpPaise: 11000,
            pricePaise: 9800, // ₹98.00
            stock: 40,
            isAvailable: true,
            sku: 'KIR-SPC-019'
          },
          {
            name: 'Tata Tea Premium Leaf Pouch 500g',
            description: 'Desh Ki Chai — unique blend of large tea leaves and strong tea granules.',
            category: 'Tea & Coffee',
            imageUrl: '/product-images/groceries/tata-tea.webp',
            mrpPaise: 26000,
            pricePaise: 23500, // ₹235.00
            stock: 35,
            isAvailable: true,
            sku: 'KIR-TEA-020'
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

  const store2 = await prisma.store.create({
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
            description: 'Locally grown crisp new-crop Malwa potatoes.',
            category: 'Vegetables',
            imageUrl: '/product-images/fruits-vegetables/fresh-malwa-potatoes.webp',
            mrpPaise: 4000,
            pricePaise: 3000, // ₹30.00
            stock: 80,
            isAvailable: true,
            sku: 'VEG-POT-001'
          },
          {
            name: 'Red Hybrid Onions 1kg',
            description: 'Pungent, dry, medium sized onions with papery peel.',
            category: 'Vegetables',
            imageUrl: '/product-images/fruits-vegetables/red-hybrid-onions.webp',
            mrpPaise: 4500,
            pricePaise: 3800, // ₹38.00
            stock: 60,
            isAvailable: true,
            sku: 'VEG-ONI-002'
          },
          {
            name: 'Ripe Country Tomatoes 1kg',
            description: 'Juicy, naturally ripened country desi tomatoes with tart flavor.',
            category: 'Vegetables',
            imageUrl: '/product-images/fruits-vegetables/ripe-country-tomatoes.webp',
            mrpPaise: 5000,
            pricePaise: 4000, // ₹40.00
            stock: 50,
            isAvailable: true,
            sku: 'VEG-TOM-003'
          },
          {
            name: 'Shimla Royal Delicious Apples 1kg',
            description: 'Sweet, crisp red apples directly from Himachal orchards.',
            category: 'Fruits',
            imageUrl: '/product-images/fruits-vegetables/shimla-apples.webp',
            mrpPaise: 22000,
            pricePaise: 18000, // ₹180.00
            stock: 25,
            isAvailable: true,
            sku: 'FRT-APL-004'
          },
          {
            name: 'Fresh Green Chillies 250g',
            description: 'Spicy, fresh green chillies directly sourced from local farmers.',
            category: 'Vegetables',
            imageUrl: '/product-images/fruits-vegetables/green-chillies.webp',
            mrpPaise: 2500,
            pricePaise: 2000, // ₹20.00
            stock: 40,
            isAvailable: true,
            sku: 'VEG-CHL-005'
          },
          {
            name: 'Fresh Malwa Coriander Bunch 250g',
            description: 'Aromatic leafy fresh green coriander for garnishing curry and poha.',
            category: 'Vegetables',
            imageUrl: '/product-images/fruits-vegetables/fresh-coriander.webp',
            mrpPaise: 2000,
            pricePaise: 1500, // ₹15.00
            stock: 45,
            isAvailable: true,
            sku: 'VEG-COR-006'
          },
          {
            name: 'Fresh Juicy Yellow Lemons (Pack of 4)',
            description: 'Plump thin-skinned juicy yellow lemons full of natural citrus juice.',
            category: 'Vegetables',
            imageUrl: '/product-images/fruits-vegetables/fresh-lemon.webp',
            mrpPaise: 3000,
            pricePaise: 2400, // ₹24.00
            stock: 35,
            isAvailable: true,
            sku: 'VEG-LEM-007'
          },
          {
            name: 'Fresh Desi Adrak Ginger 250g',
            description: 'Fresh unbleached pungent ginger root for morning chai and tadka.',
            category: 'Vegetables',
            imageUrl: '/product-images/fruits-vegetables/fresh-ginger.webp',
            mrpPaise: 4500,
            pricePaise: 3800, // ₹38.00
            stock: 30,
            isAvailable: true,
            sku: 'VEG-GIN-008'
          },
          {
            name: 'Fresh Robusta Bananas 1 Dozen',
            description: 'Naturally ripened sweet and energy-dense golden yellow bananas.',
            category: 'Fruits',
            imageUrl: '/product-images/fruits-vegetables/fresh-bananas.webp',
            mrpPaise: 7000,
            pricePaise: 5500, // ₹55.00
            stock: 40,
            isAvailable: true,
            sku: 'FRT-BAN-009'
          },
          {
            name: 'Ratnagiri Alphonso Mangoes 1kg',
            description: 'GI-tagged sweet aromatic Alphonso mangoes with rich saffron pulp.',
            category: 'Fruits',
            imageUrl: '/product-images/fruits-vegetables/alphonso-mangoes.webp',
            mrpPaise: 45000,
            pricePaise: 39900, // ₹399.00
            stock: 15,
            isAvailable: true,
            sku: 'FRT-MNG-010'
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
            imageUrl: '/product-images/dairy-bakery/fresh-whole-wheat-bread.webp',
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
            imageUrl: '/product-images/dairy-bakery/amul-butter.webp',
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
            imageUrl: '/product-images/dairy-bakery/sanchi-gold-milk.webp',
            mrpPaise: 3400,
            pricePaise: 3400, // ₹34.00
            stock: 60,
            isAvailable: true,
            sku: 'DAI-MLK-003'
          },
          {
            name: 'Fresh Malai Paneer Block 200g',
            description: 'Soft, melt-in-mouth cottage cheese crafted from whole cow and buffalo milk.',
            category: 'Dairy',
            imageUrl: '/product-images/dairy-bakery/fresh-paneer.webp',
            mrpPaise: 9500,
            pricePaise: 8500, // ₹85.00
            stock: 30,
            isAvailable: true,
            sku: 'DAI-PAN-004'
          },
          {
            name: 'Farm Fresh Brown Eggs (Pack of 6)',
            description: 'Nutritious protein-rich clean farm eggs in protective biodegradable tray.',
            category: 'Dairy',
            imageUrl: '/product-images/dairy-bakery/farm-eggs.webp',
            mrpPaise: 6000,
            pricePaise: 5200, // ₹52.00
            stock: 40,
            isAvailable: true,
            sku: 'DAI-EGG-005'
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

  const medicineImageMap: Record<string, string> = {
    'Dolo 650 Tablet': '/product-images/pharmacy/dolo-650.webp',
    'Digene Antacid Gel Orange 200ml': '/product-images/pharmacy/digene-gel.webp',
    'Augmentin 625 Duo Tablet': '/product-images/pharmacy/augmentin-625.webp',
    'Azithral 500 Tablet': '/product-images/pharmacy/azithral-500.webp',
    'Pantocid 40 Tablet': '/product-images/pharmacy/pantocid-40.webp',
    'Telma 40 Tablet': '/product-images/pharmacy/telma-40.webp',
    'Cefix 200 Tablet': '/product-images/pharmacy/cefix-200.webp',
    'Accu-Chek Active Blood Glucose Monitor Kit': '/product-images/pharmacy/accu-chek.webp',
    'Omron HEM 7120 Digital Blood Pressure Monitor': '/product-images/pharmacy/omron-bp.webp',
    'Dettol Antiseptic Liquid 250ml': '/product-images/pharmacy/dettol-antiseptic.webp',
    'Volini Pain Relief Gel 75g': '/product-images/pharmacy/volini-gel.webp',
    'Hansaplast Regular Bandage Strips (Pack of 20)': '/product-images/pharmacy/hansaplast-strips.webp'
  };

  const createdMedicines: any[] = [];
  for (const m of medicinesData) {
    const med = await prisma.medicine.create({
      data: {
        ...m,
        imageUrl: medicineImageMap[m.name] || null
      }
    });
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

  // ============================================================
  // EVERYTHING LOCAL VERSION 1.0 OPERATING SYSTEM SEEDING
  // ============================================================
  console.log('Seeding Version 1.0 Delivery Pricing Rules...');
  await prisma.deliveryPricingRule.createMany({
    data: [
      {
        tierCode: 'EXPRESS_20',
        displayName: 'Express 20-Min Delivery',
        targetMinutes: 20,
        baseDeliveryPaise: 4500, // ₹45 base
        perKmPaise: 1200,        // ₹12/km
        prioritySurchargePaise: 2500, // ₹25 priority fee
        maxRoadDistanceKm: 3.0,
        additionalPickupPaise: 1500, // ₹15/extra store
        weightSurchargePaisePerKg: 500,
        peakMultiplier: 1.1,
        isActive: true
      },
      {
        tierCode: 'PRIORITY_40',
        displayName: 'Priority 40-Min Delivery',
        targetMinutes: 40,
        baseDeliveryPaise: 3500, // ₹35 base
        perKmPaise: 1000,        // ₹10/km
        prioritySurchargePaise: 1500, // ₹15 priority fee
        maxRoadDistanceKm: 4.5,
        additionalPickupPaise: 1200,
        weightSurchargePaisePerKg: 500,
        peakMultiplier: 1.0,
        isActive: true
      },
      {
        tierCode: 'STANDARD_60',
        displayName: 'Standard 60-Min Delivery',
        targetMinutes: 60,
        baseDeliveryPaise: 2500, // ₹25 base
        perKmPaise: 800,         // ₹8/km
        prioritySurchargePaise: 0,
        maxRoadDistanceKm: 6.0,
        additionalPickupPaise: 1000,
        weightSurchargePaisePerKg: 400,
        peakMultiplier: 1.0,
        isActive: true
      },
      {
        tierCode: 'SCHEDULED_120',
        displayName: 'Scheduled 2-Hour Delivery',
        targetMinutes: 120,
        baseDeliveryPaise: 2000, // ₹20 base
        perKmPaise: 600,         // ₹6/km
        prioritySurchargePaise: 0,
        maxRoadDistanceKm: 8.0,
        additionalPickupPaise: 800,
        weightSurchargePaisePerKg: 300,
        peakMultiplier: 1.0,
        isActive: true
      }
    ]
  });

  console.log('Seeding Category Commission Rules...');
  await prisma.categoryCommissionRule.createMany({
    data: [
      {
        categorySlug: 'grocery',
        categoryName: 'Daily Groceries & Essentials',
        defaultCommissionPct: 4.5,
        listingFeePct: 2.0,
        minOrderValuePaise: 19900
      },
      {
        categorySlug: 'general_retail',
        categoryName: 'General Retail & Household',
        defaultCommissionPct: 6.5,
        listingFeePct: 2.0,
        minOrderValuePaise: 24900
      },
      {
        categorySlug: 'beauty',
        categoryName: 'Beauty & Personal Care',
        defaultCommissionPct: 7.0,
        listingFeePct: 2.5,
        minOrderValuePaise: 29900
      },
      {
        categorySlug: 'pet_supplies',
        categoryName: 'Pet Care & Nutrition',
        defaultCommissionPct: 6.0,
        listingFeePct: 2.0,
        minOrderValuePaise: 19900
      },
      {
        categorySlug: 'electronics',
        categoryName: 'Local Electronics & Gadgets',
        defaultCommissionPct: 3.5,
        listingFeePct: 1.5,
        minOrderValuePaise: 49900
      },
      {
        categorySlug: 'local_services',
        categoryName: 'Local Services & Experts',
        defaultCommissionPct: 9.0,
        listingFeePct: 4.0,
        minOrderValuePaise: 19900
      }
    ]
  });

  console.log('Seeding Standalone Delivery Partners (Riders)...');
  const riderUser1 = await prisma.user.create({
    data: {
      email: 'rahul.rider@everythinglocal.in',
      phone: '+919876543231',
      name: 'Rahul Sharma',
      passwordHash,
      role: 'RIDER'
    }
  });

  const riderProfile1 = await prisma.riderProfile.create({
    data: {
      userId: riderUser1.id,
      riderCode: 'EL-RIDER-IND-101',
      vehicleType: 'MOTORCYCLE',
      vehicleNumber: 'MP-09-XY-4921',
      drivingLicenceNumber: 'MP-09-2022-849120',
      panNumber: 'ABCPS1294K',
      bankAccountNumber: '918273645102',
      bankIfsc: 'HDFC0001824',
      emergencyContactName: 'Mukesh Sharma (Father)',
      emergencyContactPhone: '+919876500112',
      isVerified: true,
      isActive: true,
      isOnline: true,
      currentLatitude: 22.7244,
      currentLongitude: 75.8839,
      rating: 4.92,
      totalDeliveries: 148
    }
  });

  const riderUser2 = await prisma.user.create({
    data: {
      email: 'vijay.rider@everythinglocal.in',
      phone: '+919876543232',
      name: 'Vijay Verma',
      passwordHash,
      role: 'RIDER'
    }
  });

  const riderProfile2 = await prisma.riderProfile.create({
    data: {
      userId: riderUser2.id,
      riderCode: 'EL-RIDER-IND-102',
      vehicleType: 'SCOOTER',
      vehicleNumber: 'MP-09-AB-7712',
      drivingLicenceNumber: 'MP-09-2023-119283',
      panNumber: 'VERMA8912P',
      bankAccountNumber: '109283746501',
      bankIfsc: 'SBIN0004921',
      emergencyContactName: 'Sunita Verma (Mother)',
      emergencyContactPhone: '+919876500223',
      isVerified: true,
      isActive: true,
      isOnline: true,
      currentLatitude: 22.7533,
      currentLongitude: 75.8937,
      rating: 4.88,
      totalDeliveries: 94
    }
  });

  // Seed sample active delivery task for Rahul
  const sampleTask1 = await prisma.deliveryTask.create({
    data: {
      taskNumber: 'EL-TASK-84920',
      riderId: riderProfile1.id,
      status: 'AVAILABLE',
      priorityTier: 'EXPRESS_20',
      pickupLocationName: 'Sharma Kirana Store',
      pickupAddress: 'Shop 12, Main Market, Palasia, Indore',
      pickupLatitude: 22.7244,
      pickupLongitude: 75.8839,
      deliveryAddress: 'Flat 402, Royal Residency, New Palasia, Indore',
      deliveryLatitude: 22.7289,
      deliveryLongitude: 75.8885,
      estimatedDistanceKm: 1.8,
      estimatedMinutes: 18,
      riderBasePayoutPaise: 3000,
      additionalPickupPayoutPaise: 800,
      waitingPayoutPaise: 0,
      surgePayoutPaise: 500,
      totalPayoutPaise: 4300, // ₹43.00
      pickupOtp: '4821',
      deliveryOtp: '7190',
      specialHandling: 'Contains fragile glass bottle'
    }
  });

  // Seed earnings ledger for rider 1
  await prisma.riderEarningLedger.createMany({
    data: [
      {
        riderId: riderProfile1.id,
        deliveryTaskId: sampleTask1.id,
        type: 'BASE_PAYOUT',
        amountPaise: 3000,
        description: 'Delivery Task #EL-TASK-84920 Base Payout',
        settlementStatus: 'UNSETTLED'
      },
      {
        riderId: riderProfile1.id,
        deliveryTaskId: sampleTask1.id,
        type: 'PEAK_INCENTIVE',
        amountPaise: 500,
        description: 'Evening Rush Hour Surge Incentive',
        settlementStatus: 'UNSETTLED'
      },
      {
        riderId: riderProfile1.id,
        type: 'BASE_PAYOUT',
        amountPaise: 3500,
        description: 'Completed Delivery #EL-TASK-84918 to Old Palasia',
        settlementStatus: 'SETTLED'
      }
    ]
  });

  // Seed Household for customer Ayush
  console.log('Seeding Household Operating System...');
  const household = await prisma.household.create({
    data: {
      name: 'Prakash Family Home',
      ownerId: customer.id,
      monthlyBudgetPaise: 2000000, // ₹20,000 monthly
      monthlySpendPaise: 645000,   // ₹6,450 spent
      members: {
        create: [
          {
            userId: customer.id,
            role: 'ADMIN',
            canSpend: true,
            monthlySpendLimitPaise: 2000000
          }
        ]
      },
      shoppingItems: {
        create: [
          {
            productName: 'Aashirvaad Shudh Chakki Atta (5kg)',
            quantity: 2,
            unit: 'bag',
            estimatedPricePaise: 54000,
            priority: 'HIGH',
            recurringIntervalDays: 15,
            isPurchased: false
          },
          {
            productName: 'Fortune Sunlite Refined Sunflower Oil (1L)',
            quantity: 2,
            unit: 'pouch',
            estimatedPricePaise: 31000,
            priority: 'HIGH',
            recurringIntervalDays: 20,
            isPurchased: false
          },
          {
            productName: 'Amul Taaza Homogenised Toned Milk (1L)',
            quantity: 4,
            unit: 'carton',
            estimatedPricePaise: 29600,
            priority: 'MEDIUM',
            recurringIntervalDays: 7,
            isPurchased: true
          }
        ]
      }
    }
  });

  // Seed Community Buying Campaign
  console.log('Seeding Community Buying Campaigns...');
  await prisma.communityCampaign.create({
    data: {
      title: 'Indore Malwa Fresh Potato & Onion Bulk Harvest Pack (10kg)',
      description: 'Direct farm aggregation for Palasia & Vijay Nagar residents. Huge group savings!',
      category: 'produce',
      storeId: store2.id, // Apna Fresh
      targetQuantity: 50,
      currentPledged: 34,
      originalPricePaise: 42000, // ₹420
      discountedPricePaise: 28000, // ₹280 (33% off)
      minParticipants: 20,
      currentParticipants: 28,
      endsAt: new Date(Date.now() + 86400000 * 3), // 3 days remaining
      status: 'ACTIVE'
    }
  });

  // Seed Loyalty Account for customer Ayush
  console.log('Seeding Loyalty & Rewards Engine...');
  const loyaltyAcc = await prisma.loyaltyAccount.create({
    data: {
      userId: customer.id,
      pointsBalance: 250,
      tier: 'GOLD',
      lifetimePoints: 500,
      entries: {
        create: [
          {
            pointsChange: 100,
            type: 'BONUS_SIGNUP',
            description: 'Welcome to Everything Local Indore!'
          },
          {
            pointsChange: 150,
            type: 'EARN_PURCHASE',
            description: 'Order #ORD-1002 Cashback Points'
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
