export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  department: string;
  description: string;
  imageUrl: string;
  subcategories: {
    name: string;
    slug: string;
    description: string;
  }[];
}

export const CANONICAL_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'cat-grocery-essentials',
    name: 'Grocery & Daily Essentials',
    slug: 'grocery-daily-essentials',
    department: 'GROCERY',
    description: 'Fresh staples, premium grains, cold-pressed oils, spices, pulses, beverages and daily household pantry needs.',
    imageUrl: '/brand/placeholders/grocery.svg',
    subcategories: [
      { name: 'Rice & Whole Grains', slug: 'rice-grains', description: 'Basmati, kolam, sona masoori, brown rice and millets' },
      { name: 'Wheat Flour & Atta', slug: 'wheat-flour-atta', description: 'Sharbati chakki fresh atta, multigrain, MP wheat and specialty flours' },
      { name: 'Pulses & Dals', slug: 'pulses-dals', description: 'Toor dal, moong, chana, urad, masoor, rajma and kabuli chana' },
      { name: 'Cooking Oils & Ghee', slug: 'cooking-oils-ghee', description: 'Pure desi cow ghee, mustard oil, sunflower, groundnut and sesame oil' },
      { name: 'Spices & Masalas', slug: 'spices-masalas', description: 'Whole spices, turmeric, red chilli, jeera, garam masala and culinary seasonings' },
      { name: 'Salt, Sugar & Jaggery', slug: 'salt-sugar-jaggery', description: 'Iodized salt, rock salt, crystal sugar, organic jaggery and khand' },
      { name: 'Tea & Coffee', slug: 'tea-coffee', description: 'Assam CTC tea, green tea, Darjeeling leaves and roasted ground coffee' },
      { name: 'Biscuits, Rusk & Snacks', slug: 'biscuits-snacks', description: 'Whole wheat cookies, digestive biscuits, toast rusk and dry namkeens' },
      { name: 'Breakfast & Packaged Foods', slug: 'breakfast-packaged', description: 'Indori poha, rolled oats, corn flakes, muesli, noodles and vermicelli' },
      { name: 'Dairy & Fresh Bakery', slug: 'dairy-fresh-bakery', description: 'Farm fresh milk, unsalted butter, malai paneer, curd and whole wheat pav' }
    ]
  },
  {
    id: 'cat-fruits-vegetables',
    name: 'Fruits & Vegetables',
    slug: 'fruits-vegetables',
    department: 'PRODUCE',
    description: 'Farm-fresh daily harvest vegetables, fresh herbs, crisp country tomatoes, local greens and seasonal handpicked fruits.',
    imageUrl: '/brand/placeholders/produce.svg',
    subcategories: [
      { name: 'Fresh Daily Vegetables', slug: 'daily-vegetables', description: 'Cauliflower, cabbage, bhindi, brinjal, bottle gourd, capsicum and peas' },
      { name: 'Potatoes, Onions & Tomatoes', slug: 'potatoes-onions-tomatoes', description: 'Malwa chipsona potatoes, Nashik red onions, country desi tomatoes and baby potatoes' },
      { name: 'Leafy & Green Vegetables', slug: 'leafy-greens', description: 'Fresh palak, methi, coriander, mint, dill leaves and spring onions' },
      { name: 'Seasonal Fresh Fruits', slug: 'seasonal-fruits', description: 'Kashmiri apples, bananas, sweet papayas, guavas, pomegranates and watermelons' },
      { name: 'Citrus & Tropical Fruits', slug: 'citrus-tropical-fruits', description: 'Nagpur oranges, sweet lime mosambi, raw lemons, pineapples and mangoes' }
    ]
  },
  {
    id: 'cat-clothing-fashion',
    name: 'Clothing & Fashion',
    slug: 'clothing-fashion',
    department: 'FASHION',
    description: 'Curated apparel, authentic ethnic wear, casual cotton shirts, sarees, trousers, and daily wear for men, women and kids.',
    imageUrl: '/brand/placeholders/fashion.svg',
    subcategories: [
      { name: "Men's Shirts & T-Shirts", slug: 'mens-shirts-tshirts', description: 'Pure cotton formal shirts, linen casuals, polo t-shirts and round-neck tees' },
      { name: "Men's Trousers & Denims", slug: 'mens-trousers-denims', description: 'Chino trousers, slim-fit stretch jeans, formal pleated pants and trackpants' },
      { name: "Women's Sarees & Kurtis", slug: 'womens-sarees-kurtis', description: 'Chanderi silk sarees, Maheshwari weaves, cotton anarkali and printed daily kurtis' },
      { name: "Women's Western & Casuals", slug: 'womens-western-casuals', description: 'Cotton tops, denim shirts, palazzos, casual trousers and summer dresses' },
      { name: "Kids' Wear & Uniforms", slug: 'kids-wear', description: 'Soft cotton t-shirts, shorts, frocks, dungarees and daily children outfits' },
      { name: 'Winterwear & Thermals', slug: 'winterwear-thermals', description: 'Cardigans, hoodies, woolen stoles, thermal inners and light jackets' }
    ]
  },
  {
    id: 'cat-beauty-personal-care',
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    department: 'BEAUTY',
    description: 'Skincare essentials, herbal hair care, bathing soaps, dental hygiene, cosmetics and daily grooming essentials.',
    imageUrl: '/brand/placeholders/beauty.svg',
    subcategories: [
      { name: 'Skincare & Moisturisers', slug: 'skincare-moisturisers', description: 'Aloe vera gels, face cleansers, daily moisturisers, sunscreen and lip balms' },
      { name: 'Haircare & Shampoos', slug: 'haircare-shampoos', description: 'Herbal hair oils, anti-dandruff shampoos, conditioners and hair serums' },
      { name: 'Bathing Soaps & Body Wash', slug: 'soaps-bodywash', description: 'Glycerine soap bars, neem bodywash, loofahs and exfoliating bath scrubs' },
      { name: 'Oral & Dental Hygiene', slug: 'oral-dental-hygiene', description: 'Ayurvedic toothpastes, soft toothbrushes, mouthwash and tongue cleaners' },
      { name: "Men's Grooming & Deodorants", slug: 'mens-grooming-deos', description: 'Shaving foams, razors, beard oils, body sprays and talcum powders' },
      { name: 'Cosmetics & Kajal', slug: 'cosmetics-makeup', description: 'Herbal kajal, compact powder, matte lipsticks, nail enamels and bindi packs' }
    ]
  },
  {
    id: 'cat-home-kitchen-decor',
    name: 'Home, Kitchen & Décor',
    slug: 'home-kitchen-decor',
    department: 'HOME',
    description: 'Quality stainless steel cookware, airtight storage, brass temple items, soft cotton bedsheets, cushions and home accents.',
    imageUrl: '/brand/placeholders/home.svg',
    subcategories: [
      { name: 'Cookware & Pressure Cookers', slug: 'cookware-cookers', description: 'Hard anodized pans, induction pressure cookers, tawa, kadhai and roti makers' },
      { name: 'Kitchen Storage & Containers', slug: 'kitchen-storage-containers', description: 'Stainless steel dabbas, airtight glass jars, spice racks and oil dispensers' },
      { name: 'Dinnerware & Crockery', slug: 'dinnerware-crockery', description: 'Melamine dinner sets, steel thali sets, ceramic coffee mugs and water jugs' },
      { name: 'Home Furnishings & Bedsheets', slug: 'furnishings-bedsheets', description: 'Pure cotton double bedsheets, pillow covers, curtains and sofa throws' },
      { name: 'Wall Décor & Clocks', slug: 'wall-decor-clocks', description: 'Traditional brass wall hangings, framed prints, analog clocks and metal art' },
      { name: 'Cleaning Mops & Bins', slug: 'cleaning-mops-bins', description: 'Spin mops, microfibre wipers, pedal waste bins and dustbins' },
      { name: 'Kitchen Tools & Knives', slug: 'kitchen-tools-knives', description: 'Vegetable peelers, chef knives, wooden chopping boards and graters' }
    ]
  },
  {
    id: 'cat-electronics-electrical-decor',
    name: 'Electronics & Electrical Décor',
    slug: 'electronics-electrical-decor',
    department: 'ELECTRONICS',
    description: 'Energy-saving LED lighting, decorative festival lights, mobile chargers, durable extension cords and electrical fixtures.',
    imageUrl: '/brand/placeholders/electronics.svg',
    subcategories: [
      { name: 'LED Bulbs & Batten Lights', slug: 'led-bulbs-lights', description: '9W cool day white bulbs, 20W LED tubelights, emergency backup lights and night lamps' },
      { name: 'Decorative & Festival Lights', slug: 'decorative-festival-lights', description: 'Warm white fairy string lights, copper wire LED, curtain lights and Diwali rope lights' },
      { name: 'Mobile Cables & Fast Chargers', slug: 'mobile-cables-chargers', description: 'Type-C braided cables, fast USB chargers, lightning cords and power banks' },
      { name: 'Extension Boards & Spike Guards', slug: 'extension-boards-spikes', description: '4-socket surge protectors, 5m extension cords, multi-plugs and adapter boxes' },
      { name: 'Table Lamps & Study Lights', slug: 'table-lamps-study', description: 'Rechargeable desk lamps, clamp reading lights and ambient bedside fixtures' },
      { name: 'Audio & Small Accessories', slug: 'audio-accessories', description: 'Wired earphones with mic, bluetooth neckbands, aux cables and mobile stands' }
    ]
  },
  {
    id: 'cat-jewellery-accessories',
    name: 'Jewellery & Accessories',
    slug: 'jewellery-accessories',
    department: 'LIFESTYLE',
    description: 'Traditional earrings, bridal necklaces, brass kadas, imitation jewellery, wrist watches and everyday style accessories.',
    imageUrl: '/brand/placeholders/jewellery.svg',
    subcategories: [
      { name: 'Traditional & Jhumka Earrings', slug: 'traditional-jhumka-earrings', description: 'Oxidised silver jhumkas, kundan chandelier drops, gold-plated studs and chandbalis' },
      { name: 'Necklaces & Mangalsutras', slug: 'necklaces-mangalsutras', description: 'Choker sets with stones, delicate daily chains, mangalsutra pendants and pearls' },
      { name: 'Bangles, Kadas & Bracelets', slug: 'bangles-kadas-bracelets', description: 'Glass bangle sets, brass carved kadas, velvet chooda sets and adjustable bracelets' },
      { name: 'Finger Rings & Toe Rings', slug: 'rings-toe-rings', description: 'Adjustable crystal rings, pure silver bichhiya toe rings and men’s brass bands' },
      { name: "Men's & Women's Wrist Watches", slug: 'wrist-watches', description: 'Classic leather strap analog watches, stainless steel formal watches and digital sports watches' },
      { name: 'Hair Accessories & Brooches', slug: 'hair-accessories-brooches', description: 'Pearl juda pins, claw hair clips, fabric scrunchies, maang tikka and saree brooches' }
    ]
  },
  {
    id: 'cat-bags-footwear-travel',
    name: 'Bags, Footwear & Travel',
    slug: 'bags-footwear-travel',
    department: 'LIFESTYLE',
    description: 'Everyday college backpacks, women’s shoulder totes, genuine leather wallets, comfortable sandals and casual walking shoes.',
    imageUrl: '/brand/placeholders/footwear.svg',
    subcategories: [
      { name: "Women's Handbags & Totes", slug: 'womens-handbags-totes', description: 'Vegan leather tote bags, stylish sling purses, structured satchels and shopping bags' },
      { name: "Men's & Unisex Backpacks", slug: 'backpacks-bags', description: 'Waterproof laptop bags, casual canvas daypacks, gym duffle bags and school bags' },
      { name: 'Wallets, Clutches & Pouches', slug: 'wallets-clutches-pouches', description: 'Bi-fold leather wallets, zip-around party clutches and cosmetic vanity pouches' },
      { name: "Men's Footwear & Sneakers", slug: 'mens-footwear-shoes', description: 'Breathable walking shoes, formal leather slip-ons and casual canvas loafers' },
      { name: "Women's Flats & Ethnic Sandals", slug: 'womens-flats-sandals', description: 'Kolhapuri chappals, padded daily flats, pointed bellies and embroidered mojris' },
      { name: 'Daily Slippers & Flip-Flops', slug: 'slippers-flipflops', description: 'Orthopaedic cushion slippers, durable rubber flip-flops and home sliders' }
    ]
  },
  {
    id: 'cat-pharmacy-wellness',
    name: 'Pharmacy & Wellness',
    slug: 'pharmacy-wellness',
    department: 'PHARMACY',
    description: 'Licensed OTC family wellness, herbal digestive drops, first-aid antiseptic solutions, bandages and home health monitors.',
    imageUrl: '/brand/placeholders/pharmacy.svg',
    subcategories: [
      { name: 'OTC Pain Relief & Digestives', slug: 'otc-pain-digestives', description: 'Digestive pudin hara, effervescent antacid sachets, pain balm and throat lozenges' },
      { name: 'First-Aid & Antiseptics', slug: 'first-aid-antiseptics', description: 'Antiseptic disinfectant liquid, waterproof adhesive bandages, cotton rolls and healing creams' },
      { name: 'Vitamins & Health Supplements', slug: 'vitamins-supplements', description: 'Vitamin C chewables, calcium with D3, multivitamin syrup and protein powders' },
      { name: 'Health Monitors & Devices', slug: 'monitors-devices', description: 'Digital arm BP monitors, blood glucose test meters, digital clinical thermometers and vaporizers' },
      { name: 'Personal Hygiene & Masks', slug: 'hygiene-sanitizers', description: '70% alcohol hand sanitizers, 3-ply surgical face masks, antibacterial wet wipes and gloves' }
    ]
  },
  {
    id: 'cat-services-other-local',
    name: 'Services & Other Local Products',
    slug: 'services-other-local',
    department: 'SERVICES',
    description: 'Trusted neighbourhood doorstep services, home laundry, alteration tailoring, electrical diagnostics and AC maintenance.',
    imageUrl: '/brand/placeholders/services.svg',
    subcategories: [
      { name: 'Doorstep Laundry & Ironing', slug: 'laundry-dry-cleaning', description: 'Steam press ironing, wash & fold laundry, dry cleaning for suits and heavy blankets' },
      { name: 'Tailoring & Garment Alterations', slug: 'tailoring-alterations', description: 'Kurti fitting, pant shortening, saree fall pico and custom blouse stitching' },
      { name: 'Appliance & AC Servicing', slug: 'appliance-ac-servicing', description: 'Split AC deep jet cleaning, refrigerator gas recharge and washing machine troubleshooting' },
      { name: 'Salon & Grooming at Home', slug: 'salon-grooming-home', description: 'Men’s haircut & beard trim, women’s herbal facial, waxing and threading services' },
      { name: 'Electrical & Plumbing Repairs', slug: 'electrical-plumbing-repairs', description: 'Ceiling fan repair, switchboard rewiring, tap leakage fixing and water motor diagnosis' }
    ]
  }
];
