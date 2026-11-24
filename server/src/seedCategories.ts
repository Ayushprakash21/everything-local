import { prisma } from './db';

export interface SeedSubcategory {
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
}

export interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  bannerUrl: string;
  displayOrder: number;
  department: string;
  metaTitle: string;
  metaDescription: string;
  subcategories: SeedSubcategory[];
  keywords: string[];
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: 'Paan Corner',
    slug: 'paan-corner',
    description: 'Fresh Meetha Paan, supari, mouth fresheners, mints, and tobacco-free herbal treats from trusted local shops.',
    imageUrl: '/assets/categories/paan-corner.svg',
    bannerUrl: '/product-images/categories/snacks-drinks-hero.webp',
    displayOrder: 1,
    department: 'GROCERY',
    metaTitle: 'Paan Corner | Meetha Paan & Mouth Fresheners in Indore | Everything Local',
    metaDescription: 'Order traditional Indori meetha paan, supari, silver pearls, and premium mouth fresheners with ultra-fast local delivery.',
    keywords: ['paan', 'supari', 'saunf', 'mouth freshener', 'mint', 'gulkand', 'silver pearl', 'churan'],
    subcategories: [
      { name: 'Fresh Paan & Meetha Paan', slug: 'fresh-meetha-paan', description: 'Handcrafted fresh banarasi, calcutta and meetha paans', displayOrder: 1 },
      { name: 'Supari & Mouth Fresheners', slug: 'supari-mouth-fresheners', description: 'Flavoured supari, roasted saunf and digestive churan', displayOrder: 2 },
      { name: 'Mints & Chewing Gum', slug: 'mints-chewing-gum', description: 'Refreshing mint drops, strips, and sugar-free gums', displayOrder: 3 },
      { name: 'Gulkand & Paan Chutney', slug: 'gulkand-chutney', description: 'Pure damask rose gulkand and digestive pastes', displayOrder: 4 },
      { name: 'Herbal & Tobacco-Free Hookah', slug: 'herbal-hookah', description: '100% nicotine-free and herbal smoking alternatives', displayOrder: 5 }
    ]
  },
  {
    name: 'Dairy, Bread & Eggs',
    slug: 'dairy-bread-eggs',
    description: 'Farm-fresh milk, Malwa paneer, cultured curd, butter, bakery bread, and fresh eggs delivered daily.',
    imageUrl: '/assets/categories/dairy-bread-eggs.svg',
    bannerUrl: '/product-images/categories/dairy-bakery-hero.webp',
    displayOrder: 2,
    department: 'GROCERY',
    metaTitle: 'Dairy, Bread & Eggs | Fresh Local Milk & Paneer | Everything Local Indore',
    metaDescription: 'Shop fresh Sanchi, Amul and local Malwa dairy milk, cultured curd, fresh bread loaves and poultry eggs.',
    keywords: ['milk', 'curd', 'dahi', 'paneer', 'butter', 'ghee', 'bread', 'egg', 'eggs', 'cheese', 'chaas', 'buttermilk'],
    subcategories: [
      { name: 'Fresh Milk', slug: 'fresh-milk', description: 'Pasteurized, cow, buffalo and toned pouch milk', displayOrder: 1 },
      { name: 'Curd & Yogurt', slug: 'curd-yogurt', description: 'Fresh dahi, set yogurt and mishti doi', displayOrder: 2 },
      { name: 'Paneer & Tofu', slug: 'paneer-tofu', description: 'Freshly cut soft Malwa paneer and organic tofu', displayOrder: 3 },
      { name: 'Butter & Table Spreads', slug: 'butter-spreads', description: 'Salted, unsalted, white makhan and table spreads', displayOrder: 4 },
      { name: 'Bread & Buns', slug: 'bread-buns', description: 'Whole wheat bread, white sandwich loaves, pav and burger buns', displayOrder: 5 },
      { name: 'Fresh Eggs', slug: 'fresh-eggs', description: 'Farm white eggs, brown country eggs and organic free-range eggs', displayOrder: 6 },
      { name: 'Cheese & Cream', slug: 'cheese-cream', description: 'Cheese slices, mozzarella blocks, cubes and fresh whipping cream', displayOrder: 7 }
    ]
  },
  {
    name: 'Fruits & Vegetables',
    slug: 'fruits-vegetables',
    description: 'Farm-fresh seasonal fruits, local Malwa potatoes, red onions, fresh coriander, and crisp green vegetables.',
    imageUrl: '/assets/categories/fruits-vegetables.svg',
    bannerUrl: '/product-images/categories/fruits-vegetables-hero.webp',
    displayOrder: 3,
    department: 'GROCERY',
    metaTitle: 'Fresh Fruits & Vegetables | Malwa Mandi Produce | Everything Local',
    metaDescription: 'Direct farm produce from Choithram Mandi Indore: tomatoes, onions, apples, mangoes, leafy greens, and cut vegetables.',
    keywords: ['fruit', 'vegetable', 'tomato', 'potato', 'onion', 'apple', 'banana', 'chilli', 'ginger', 'lemon', 'coriander', 'mango'],
    subcategories: [
      { name: 'Fresh Vegetables', slug: 'fresh-vegetables', description: 'Potatoes, onions, tomatoes, carrots, gourds and lady finger', displayOrder: 1 },
      { name: 'Fresh Fruits', slug: 'fresh-fruits', description: 'Shimla apples, bananas, alphonso mangoes, papayas and citrus', displayOrder: 2 },
      { name: 'Leafy Vegetables & Herbs', slug: 'leafy-vegetables-herbs', description: 'Palak, methi, fresh coriander, mint leaves and curry patta', displayOrder: 3 },
      { name: 'Seasonal & Exotic Produce', slug: 'exotic-fruits-vegetables', description: 'Broccoli, bell peppers, zucchini, dragonfruit, and kiwi', displayOrder: 4 },
      { name: 'Cut & Sprouted Packs', slug: 'cut-sprouted-packs', description: 'Hygienically washed, diced vegetables, peeled garlic and sprouts', displayOrder: 5 }
    ]
  },
  {
    name: 'Cold Drinks & Juices',
    slug: 'cold-drinks-juices',
    description: 'Chilled soft drinks, 100% natural fruit juices, energy drinks, soda, tonics, and coconut water.',
    imageUrl: '/assets/categories/cold-drinks-juices.svg',
    bannerUrl: '/product-images/categories/snacks-drinks-hero.webp',
    displayOrder: 4,
    department: 'GROCERY',
    metaTitle: 'Cold Drinks, Sodas & Natural Juices | Chilled Delivery in Indore',
    metaDescription: 'Cold carbonated sodas, Real and Tropicana fruit juices, tender coconut water, and Red Bull delivered chilled to your doorstep.',
    keywords: ['cold drink', 'soda', 'coke', 'pepsi', 'sprite', 'juice', 'tropicana', 'real', 'energy drink', 'coconut water', 'frooti'],
    subcategories: [
      { name: 'Soft Drinks & Sodas', slug: 'soft-drinks-sodas', description: 'Cola, lemon-lime sodas, ginger ale and club soda', displayOrder: 1 },
      { name: 'Fruit Juices & Pulps', slug: 'fruit-juices-pulps', description: 'Orange, mango, guava, mixed fruit juices and tender coconut water', displayOrder: 2 },
      { name: 'Energy & Sports Drinks', slug: 'energy-sports-drinks', description: 'Electrolyte drinks, sports hydration and energy cans', displayOrder: 3 },
      { name: 'Syrups & Sharbat', slug: 'syrups-sharbat', description: 'Rose sharbat, khus, squashes and lemon concentrates', displayOrder: 4 },
      { name: 'Tonic Water & Mixers', slug: 'tonic-water-mixers', description: 'Premium tonic waters, sparkling mineral water and cocktail mixers', displayOrder: 5 }
    ]
  },
  {
    name: 'Snacks & Munchies',
    slug: 'snacks-munchies',
    description: 'Authentic Indori Sev, Ratlami Sev, potato chips, roasted namkeen, wafers, and evening chai snacks.',
    imageUrl: '/assets/categories/snacks-munchies.svg',
    bannerUrl: '/product-images/categories/snacks-drinks-hero.webp',
    displayOrder: 5,
    department: 'GROCERY',
    metaTitle: 'Snacks & Indori Namkeen | Authentic Sev, Chips & Munchies | Everything Local',
    metaDescription: 'Shop world-famous Indori Ujjaini sev, Ratlami laung sev, spicy potato wafers, popcorn and dry-fruit snacks.',
    keywords: ['snack', 'sev', 'namkeen', 'chips', 'wafer', 'biscuit', 'lays', 'kurkure', 'popcorn', 'munchies', 'mixture'],
    subcategories: [
      { name: 'Indori Namkeen & Sev', slug: 'indori-namkeen-sev', description: 'Famous Ujjaini sev, Ratlami laung sev, hing sev and khatta meetha', displayOrder: 1 },
      { name: 'Potato Chips & Crisps', slug: 'potato-chips-crisps', description: 'Classic salted, spicy masala wafers and extruded potato snacks', displayOrder: 2 },
      { name: 'Roasted Nuts & Makhana', slug: 'roasted-nuts-makhana', description: 'Roasted fox nuts, salted cashews, peri peri almonds and peanuts', displayOrder: 3 },
      { name: 'Popcorn & Puffs', slug: 'popcorn-puffs', description: 'Butter popcorn, cheese balls, kurkure and puffed snacks', displayOrder: 4 },
      { name: 'Nachos & Tortilla Chips', slug: 'nachos-tortilla', description: 'Mexican jalapeño nachos, salsa dips and corn chips', displayOrder: 5 }
    ]
  },
  {
    name: 'Breakfast & Instant Food',
    slug: 'breakfast-instant-food',
    description: 'Indori Poha mixes, instant noodles, quick oats, breakfast cereals, muesli, and ready-to-eat meals.',
    imageUrl: '/assets/categories/breakfast-instant-food.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 6,
    department: 'GROCERY',
    metaTitle: 'Breakfast Cereals & Instant Food | Poha, Maggi, Oats | Everything Local',
    metaDescription: 'Start your morning with Indore special poha, Maggi instant noodles, Kellogg’s corn flakes, and Quaker oats.',
    keywords: ['breakfast', 'poha', 'noodle', 'maggi', 'instant', 'oats', 'cereal', 'muesli', 'cornflakes', 'upma', 'pasta'],
    subcategories: [
      { name: 'Poha, Upma & Ready Mixes', slug: 'poha-upma-mixes', description: 'Indori poha mixes, rava upma, idli-dosa batter and instant mixes', displayOrder: 1 },
      { name: 'Instant Noodles & Vermicelli', slug: 'instant-noodles-vermicelli', description: 'Maggi, Hakka noodles, ramen and roasted seviyan', displayOrder: 2 },
      { name: 'Oats & Porridge', slug: 'oats-porridge', description: 'Rolled oats, instant masala oats and multigrain porridge', displayOrder: 3 },
      { name: 'Breakfast Cereals & Muesli', slug: 'cereals-muesli', description: 'Corn flakes, choco fills, crunchy granola and muesli', displayOrder: 4 },
      { name: 'Pasta & Macaroni', slug: 'pasta-macaroni', description: 'Durum wheat penne, fusilli, macaroni and instant pasta bowls', displayOrder: 5 }
    ]
  },
  {
    name: 'Sweet Tooth',
    slug: 'sweet-tooth',
    description: 'Traditional Indian mithai, dairy gulab jamun, milk chocolates, premium ice creams, and dessert delicacies.',
    imageUrl: '/assets/categories/sweet-tooth.svg',
    bannerUrl: '/product-images/categories/dairy-bakery-hero.webp',
    displayOrder: 7,
    department: 'GROCERY',
    metaTitle: 'Mithai, Chocolates & Desserts | Sweet Tooth | Everything Local Indore',
    metaDescription: 'Satisfy cravings with local Indore mawa barfi, rasgulla, Cadbury dairy milk, and artisan desserts.',
    keywords: ['sweet', 'mithai', 'chocolate', 'cadbury', 'dessert', 'halwa', 'ladoo', 'barfi', 'gulab jamun', 'rasgulla', 'ice cream'],
    subcategories: [
      { name: 'Indian Mithai & Sweets', slug: 'indian-mithai', description: 'Kaju katli, besan ladoo, gulab jamun tins and mawa peda', displayOrder: 1 },
      { name: 'Chocolates & Bars', slug: 'chocolates-bars', description: 'Dairy Milk, dark chocolate bars, KitKat and chocolate boxes', displayOrder: 2 },
      { name: 'Ice Creams & Frozen Desserts', slug: 'ice-creams-frozen', description: 'Vanilla tubs, kulfi cones, chocobars and fruit popsicles', displayOrder: 3 },
      { name: 'Candies, Toffees & Mints', slug: 'candies-toffees', description: 'Lollipops, fruit chews, chocolate eclairs and butter toffees', displayOrder: 4 },
      { name: 'Dessert Mixes & Syrups', slug: 'dessert-mixes-syrups', description: 'Custard powder, cake premixes, chocolate syrup and jelly crystals', displayOrder: 5 }
    ]
  },
  {
    name: 'Bakery & Biscuits',
    slug: 'bakery-biscuits',
    description: 'Crisp rusks, tea biscuits, artisan cookies, cream rolls, fresh buns, and sweet tea-time bakery treats.',
    imageUrl: '/assets/categories/bakery-biscuits.svg',
    bannerUrl: '/product-images/categories/dairy-bakery-hero.webp',
    displayOrder: 8,
    department: 'GROCERY',
    metaTitle: 'Bakery Breads, Biscuits & Rusk | Indore Local Bakeries | Everything Local',
    metaDescription: 'Order fresh khari puffs, suji toast rusks, Parle-G, Marie gold, Good Day cookies and gourmet cakes.',
    keywords: ['bakery', 'biscuit', 'cookie', 'rusk', 'toast', 'khari', 'cake', 'muffin', 'cream roll', 'bourbon'],
    subcategories: [
      { name: 'Tea Biscuits & Crackers', slug: 'tea-biscuits-crackers', description: 'Glucose biscuits, digestive biscuits, marie and salty crackers', displayOrder: 1 },
      { name: 'Cookies & Cream Biscuits', slug: 'cookies-cream-biscuits', description: 'Butter cookies, choco-chip cookies, bourbon and oreo treats', displayOrder: 2 },
      { name: 'Rusk, Toast & Khari', slug: 'rusk-toast-khari', description: 'Crisp suji elaichi rusk, butter khari puffs and fan biscuits', displayOrder: 3 },
      { name: 'Cakes, Brownies & Muffins', slug: 'cakes-brownies-muffins', description: 'Tea cakes, plum cakes, chocolate brownies and cup cakes', displayOrder: 4 },
      { name: 'Artisan Gourmet Bakery', slug: 'artisan-bakery', description: 'Sourdough loaves, garlic breadsticks and multigrain baguettes', displayOrder: 5 }
    ]
  },
  {
    name: 'Tea, Coffee & Milk Drinks',
    slug: 'tea-coffee-milk-drinks',
    description: 'Assam leaf teas, Masala chai powders, roasted coffee beans, instant coffee, and Bournvita / Horlicks.',
    imageUrl: '/assets/categories/tea-coffee-milk-drinks.svg',
    bannerUrl: '/product-images/categories/snacks-drinks-hero.webp',
    displayOrder: 9,
    department: 'GROCERY',
    metaTitle: 'Tea, Coffee & Health Drinks | Tata Tea, Nescafe | Everything Local',
    metaDescription: 'Best Indian teas from Tata Tea and Wagh Bakri, Nescafe coffee, filter coffee chicory, and malted milk powders.',
    keywords: ['tea', 'chai', 'coffee', 'nescafe', 'bru', 'bournvita', 'horlicks', 'green tea', 'assamese tea', 'filter coffee'],
    subcategories: [
      { name: 'Leaf & CTC Teas', slug: 'leaf-ctc-teas', description: 'Assam strong tea, premium dust tea and aromatic whole leaf teas', displayOrder: 1 },
      { name: 'Green & Herbal Teas', slug: 'green-herbal-teas', description: 'Tulsi green tea, chamomile, lemon ginger and detox infusions', displayOrder: 2 },
      { name: 'Instant & Ground Coffee', slug: 'coffee-instant-ground', description: 'Classic instant coffee, South Indian filter coffee blend and beans', displayOrder: 3 },
      { name: 'Health & Nutrition Powders', slug: 'health-nutrition-powders', description: 'Bournvita, Complan, Horlicks, Boost and protein shakes', displayOrder: 4 },
      { name: 'Flavoured Milk & Shakes', slug: 'flavoured-milk', description: 'Elaichi milk, cold coffee bottles and chocolate badam milk', displayOrder: 5 }
    ]
  },
  {
    name: 'Atta, Rice & Dal',
    slug: 'atta-rice-dal',
    description: 'Chakki fresh wheat atta, premium long-grain Basmati rice, unpolished toor dal, moong, and organic pulses.',
    imageUrl: '/assets/categories/atta-rice-dal.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 10,
    department: 'GROCERY',
    metaTitle: 'Chakki Atta, Basmati Rice & Dals | MP Sharbati Wheat | Everything Local',
    metaDescription: 'Authentic Madhya Pradesh Sharbati wheat atta, India Gate Basmati rice, toor dal, chana dal, rajma, and kabuli chana.',
    keywords: ['atta', 'rice', 'dal', 'flour', 'wheat', 'sharbati', 'basmati', 'toor dal', 'chana dal', 'moong dal', 'rajma', 'besan', 'poha', 'sooji'],
    subcategories: [
      { name: 'Chakki Wheat Atta & Flours', slug: 'atta-flours', description: 'MP Sharbati wheat atta, multigrain atta, besan, sooji and maida', displayOrder: 1 },
      { name: 'Basmati & Everyday Rice', slug: 'basmati-rice', description: 'Aged long-grain Basmati, Kolam, Sona Masoori and brown rice', displayOrder: 2 },
      { name: 'Dals & Lentils', slug: 'dals-lentils', description: 'Unpolished toor dal, yellow moong, split urad, and masoor dal', displayOrder: 3 },
      { name: 'Pulses & Whole Beans', slug: 'pulses-beans', description: 'Chana, red rajma, kabuli chana, white peas and lobia', displayOrder: 4 },
      { name: 'Poha, Dalia & Grains', slug: 'poha-dalia-grains', description: 'Thick Indori poha, broken wheat dalia and millets (jowar, bajra)', displayOrder: 5 }
    ]
  },
  {
    name: 'Masala, Oil & More',
    slug: 'masala-oil-more',
    description: 'Kachi Ghani mustard oil, refined sunflower oil, pure cow ghee, whole spices, red chilli, and iodized salt.',
    imageUrl: '/assets/categories/masala-oil-more.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 11,
    department: 'GROCERY',
    metaTitle: 'Cooking Oils, Pure Ghee & Spices | Tata Salt, Fortune | Everything Local',
    metaDescription: 'Freshly ground spices, Fortune sunflower oil, Dhara mustard oil, Amul cow ghee, Tata salt, and Madhur sulphur-free sugar.',
    keywords: ['oil', 'ghee', 'masala', 'spice', 'turmeric', 'chilli', 'cumin', 'jeera', 'mustard oil', 'sunflower oil', 'salt', 'sugar'],
    subcategories: [
      { name: 'Cooking Oils & Mustard Oil', slug: 'cooking-oils', description: 'Refined sunflower oil, kachi ghani mustard, groundnut and rice bran', displayOrder: 1 },
      { name: 'Pure Desi Ghee', slug: 'pure-desi-ghee', description: 'Danedar cow ghee, buffalo ghee and A2 bilona ghee', displayOrder: 2 },
      { name: 'Whole Spices (Khada Masala)', slug: 'whole-spices', description: 'Cumin seeds, black pepper, cardamom, cloves and cinnamon sticks', displayOrder: 3 },
      { name: 'Powdered Spices & Blends', slug: 'powdered-spices-blends', description: 'Red chilli, turmeric, coriander powder, garam masala and sambar masala', displayOrder: 4 },
      { name: 'Salt, Sugar & Jaggery', slug: 'salt-sugar-jaggery', description: 'Vacuum evaporated iodized salt, rock salt, crystal sugar and desi gur', displayOrder: 5 }
    ]
  },
  {
    name: 'Sauces & Spreads',
    slug: 'sauces-spreads',
    description: 'Rich tomato ketchups, creamy mayonnaise, peanut butter, fruit jams, pizza-pasta sauces, and tangy pickles.',
    imageUrl: '/assets/categories/sauces-spreads.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 12,
    department: 'GROCERY',
    metaTitle: 'Sauces, Ketchups & Spreads | Kissan, Maggi | Everything Local Indore',
    metaDescription: 'Top-selling Kissan tomato ketchup, crunchy peanut butter, mixed fruit jam, Veeba salad dressings, and authentic mango pickles.',
    keywords: ['sauce', 'ketchup', 'mayo', 'mayonnaise', 'jam', 'peanut butter', 'spread', 'pickle', 'achar', 'chutney'],
    subcategories: [
      { name: 'Tomato Ketchup & Sauces', slug: 'ketchup-sauces', description: 'Classic tomato ketchup, no-onion-garlic ketchup and hot sweet sauce', displayOrder: 1 },
      { name: 'Mayonnaise & Sandwich Spreads', slug: 'mayonnaise-spreads', description: 'Eggless mayonnaise, cheese garlic spread and chipotle dips', displayOrder: 2 },
      { name: 'Peanut Butter & Nut Spreads', slug: 'peanut-butter-nut-spreads', description: 'Creamy and crunchy high-protein peanut butter and hazelnut spread', displayOrder: 3 },
      { name: 'Fruit Jams & Honey', slug: 'jams-honey', description: 'Mixed fruit jam, strawberry preserve and 100% pure wild honey', displayOrder: 4 },
      { name: 'Traditional Pickles & Chutneys', slug: 'pickles-chutneys', description: 'Spicy mango achar, lime pickle, green chilli thecha and garlic chutney', displayOrder: 5 }
    ]
  },
  {
    name: 'Chicken, Meat & Fish',
    slug: 'chicken-meat-fish',
    description: 'Hygienically cleaned and tender fresh chicken cuts, fresh mutton, and lake / seawater fish delivered in cold chain.',
    imageUrl: '/assets/categories/chicken-meat-fish.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 13,
    department: 'GROCERY',
    metaTitle: 'Fresh Chicken, Mutton & Fish Delivery in Indore | Everything Local',
    metaDescription: '100% antibiotic-free fresh chicken curry cuts, boneless breasts, mutton boti, rohu and surmai fish delivered cold-sealed.',
    keywords: ['chicken', 'meat', 'mutton', 'fish', 'seafood', 'prawn', 'curry cut', 'boneless', 'egg'],
    subcategories: [
      { name: 'Fresh Chicken Cuts', slug: 'fresh-chicken-cuts', description: 'Curry cut with bone, boneless breast, drumsticks and chicken keema', displayOrder: 1 },
      { name: 'Mutton & Lamb', slug: 'mutton-lamb', description: 'Tender goat curry cut, mutton chops and rich soup bone cuts', displayOrder: 2 },
      { name: 'Fresh Fish & Seafood', slug: 'fresh-fish-seafood', description: 'Cleaned freshwater rohu, katla, prawns and ocean fish steaks', displayOrder: 3 },
      { name: 'Eggs & Protein Add-ons', slug: 'eggs-protein', description: 'High-protein country brown eggs, quail eggs and ready egg whites', displayOrder: 4 }
    ]
  },
  {
    name: 'Organic & Healthy Living',
    slug: 'organic-healthy-living',
    description: 'Certified organic grains, cold-pressed virgin oils, raw chia & flax seeds, organic jaggery, and chemical-free pantry.',
    imageUrl: '/assets/categories/organic-healthy-living.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 14,
    department: 'GROCERY',
    metaTitle: 'Organic Food & Healthy Living | Certified Organic Staples in Indore',
    metaDescription: 'Pesticide-free organic dals, unpolished grains, raw honey, virgin coconut oil, cold-pressed oils, and superfood seeds.',
    keywords: ['organic', 'healthy', 'cold pressed', 'chia seed', 'flax seed', 'superfood', 'jaggery', 'gluten free', 'quinoa'],
    subcategories: [
      { name: 'Organic Grains & Dals', slug: 'organic-grains-dals', description: 'Pesticide-free organic toor dal, brown rice, millets and wheat', displayOrder: 1 },
      { name: 'Cold-Pressed Virgin Oils', slug: 'cold-pressed-oils', description: 'Wood-pressed mustard, groundnut, sesame and coconut oils', displayOrder: 2 },
      { name: 'Seeds & Superfoods', slug: 'seeds-superfoods', description: 'Raw chia seeds, flax seeds, pumpkin seeds and organic quinoa', displayOrder: 3 },
      { name: 'Natural Sweeteners', slug: 'natural-sweeteners', description: 'Organic powdered jaggery, stevia leaves, and raw forest honey', displayOrder: 4 },
      { name: 'Gluten-Free & Diet Foods', slug: 'gluten-free-diet', description: 'Almond flour, gluten-free roti flour and keto seed crackers', displayOrder: 5 }
    ]
  },
  {
    name: 'Baby Care',
    slug: 'baby-care',
    description: 'Pampers & Huggies baby diapers, gentle wet wipes, infant formula milk, Cerelac, and hypoallergenic baby bath lotions.',
    imageUrl: '/assets/categories/baby-care.svg',
    bannerUrl: '/product-images/categories/pharmacy-hero.webp',
    displayOrder: 15,
    department: 'GROCERY',
    metaTitle: 'Baby Care & Diapers | Pampers, Huggies, Cerelac | Everything Local',
    metaDescription: 'Trusted baby diapers, water wipes, Johnson’s baby shampoo, Sebamed lotions, baby feeding bottles, and nutritious Cerelac.',
    keywords: ['baby', 'diaper', 'pampers', 'huggies', 'wipes', 'cerelac', 'formula', 'baby lotion', 'baby powder'],
    subcategories: [
      { name: 'Diapers & Gentle Wipes', slug: 'diapers-wipes', description: 'Pant-style baby diapers (S, M, L, XL) and 99% pure water wipes', displayOrder: 1 },
      { name: 'Baby Food & Infant Nutrition', slug: 'baby-food-nutrition', description: 'Cerelac wheat apple, infant formula milk and teething biscuits', displayOrder: 2 },
      { name: 'Baby Bath & Skin Care', slug: 'baby-bath-skincare', description: 'Tear-free shampoos, gentle baby massage oil, powders and lotions', displayOrder: 3 },
      { name: 'Feeding Bottles & Accessories', slug: 'feeding-accessories', description: 'BPA-free feeding bottles, silicone nipples and sterilizer liquids', displayOrder: 4 }
    ]
  },
  {
    name: 'Pharma & Wellness',
    slug: 'pharma-wellness',
    description: 'Dolo 650, Volini pain gel, Digene, Dettol antiseptic, daily multivitamins, BP monitors, and essential home first-aid.',
    imageUrl: '/assets/categories/pharma-wellness.svg',
    bannerUrl: '/product-images/categories/pharmacy-hero.webp',
    displayOrder: 16,
    department: 'GROCERY',
    metaTitle: 'Medicines & Wellness | Licensed Local Pharmacies in Indore | Everything Local',
    metaDescription: 'Order genuine first-aid bandages, OTC medicines, health supplements, ORS, and diagnostic test strips from verified pharmacies.',
    keywords: ['pharma', 'medicine', 'wellness', 'first aid', 'dettol', 'volini', 'digene', 'dolo', 'vitamin', 'antiseptic', 'bandage'],
    subcategories: [
      { name: 'First Aid & Antiseptics', slug: 'first-aid-antiseptics', description: 'Dettol antiseptic liquid, Hansaplast bandages, cotton rolls and sprays', displayOrder: 1 },
      { name: 'Pain Relief & Balms', slug: 'pain-relief-balms', description: 'Volini gel, Moov spray, Iodex balm and heating patches', displayOrder: 2 },
      { name: 'Digestive & Antacids', slug: 'digestive-antacids', description: 'Digene gel, Eno fruit salt sachets, Pudin Hara and gas relief drops', displayOrder: 3 },
      { name: 'Vitamins & Immunity Supplements', slug: 'vitamins-supplements', description: 'Vitamin C chewables, Zincovit, fish oil capsules and Chyawanprash', displayOrder: 4 },
      { name: 'Health Monitors & Diagnostic Devices', slug: 'health-monitors-devices', description: 'Digital thermometers, Omron BP machines and Accu-Chek test strips', displayOrder: 5 }
    ]
  },
  {
    name: 'Cleaning Essentials',
    slug: 'cleaning-essentials',
    description: 'Surf Excel detergent, Vim dishwash gel, Lizol floor cleaner, Harpic, garbage bags, and microfiber mops.',
    imageUrl: '/assets/categories/cleaning-essentials.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 17,
    department: 'GROCERY',
    metaTitle: 'Detergents, Floor Cleaners & Household Cleaning | Everything Local',
    metaDescription: 'Shop Surf Excel, Ariel, Vim gel, Lizol, Harpic, Colin glass cleaner, garbage bags and Scotch-Brite scrub pads.',
    keywords: ['cleaning', 'detergent', 'surf excel', 'vim', 'lizol', 'harpic', 'dishwash', 'cleaner', 'mop', 'garbage bag'],
    subcategories: [
      { name: 'Laundry Detergents & Bars', slug: 'laundry-detergents-bars', description: 'Matic washing powder, liquid detergents, fabric conditioners and soap bars', displayOrder: 1 },
      { name: 'Dishwash Liquids & Scrubbers', slug: 'dishwash-scrubbers', description: 'Vim lemon dishwash gel, dishwash bars, sponges and steel scrub pads', displayOrder: 2 },
      { name: 'Floor & Bathroom Cleaners', slug: 'floor-bathroom-cleaners', description: 'Disinfectant floor liquids, toilet cleaners and tile stain removers', displayOrder: 3 },
      { name: 'Garbage Bags & Disposal Essentials', slug: 'garbage-bags-disposal', description: 'Biodegradable trash bags, dustbin liners and pest repellent sprays', displayOrder: 4 },
      { name: 'Mops, Brooms & Wipers', slug: 'mops-brooms-wipers', description: 'Microfiber spin mops, grass brooms, floor wipers and cleaning dusters', displayOrder: 5 }
    ]
  },
  {
    name: 'Home & Office',
    slug: 'home-office',
    description: 'Classmate notebooks, pens, markers, desk organizers, Duracell batteries, LED bulbs, and essential hardware.',
    imageUrl: '/assets/categories/home-office.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 18,
    department: 'GROCERY',
    metaTitle: 'Stationery, Home Utilities & Office Supplies | Everything Local Indore',
    metaDescription: 'Stationery notebooks, ballpoint pens, sticky notes, alkaline batteries, LED lighting, and home utility storage.',
    keywords: ['home', 'office', 'stationery', 'notebook', 'pen', 'battery', 'duracell', 'bulb', 'led', 'tape', 'scissors', 'stapler'],
    subcategories: [
      { name: 'Notebooks, Registers & Paper', slug: 'notebooks-registers-paper', description: 'Classmate single line notebooks, spiral pads and A4 copy paper reams', displayOrder: 1 },
      { name: 'Pens, Pencils & Desk Tools', slug: 'pens-pencils-desk-tools', description: 'Gel pens, ball pens, highlighters, markers, scissors and staplers', displayOrder: 2 },
      { name: 'Batteries & Electrical Accessories', slug: 'batteries-electrical', description: 'AA & AAA alkaline batteries, extension cords and LED light bulbs', displayOrder: 3 },
      { name: 'Storage, Baskets & Organizers', slug: 'storage-organizers', description: 'Plastic storage containers, desk trays, file folders and utility clips', displayOrder: 4 },
      { name: 'Home Fragrances & Fresheners', slug: 'home-fragrances-fresheners', description: 'Room freshener sprays, camphor cones, incense sticks and wardrobe bars', displayOrder: 5 }
    ]
  },
  {
    name: 'Personal Care',
    slug: 'personal-care',
    description: 'Dettol soap, Dove body wash, Head & Shoulders shampoo, Colgate toothpaste, Gillette razors, and Nivea creams.',
    imageUrl: '/assets/categories/personal-care.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 19,
    department: 'GROCERY',
    metaTitle: 'Soaps, Shampoos & Skin Grooming | Personal Care | Everything Local',
    metaDescription: 'Best personal hygiene and skin grooming essentials: body soaps, hair conditioners, oral care toothpastes, and shaving creams.',
    keywords: ['soap', 'shampoo', 'toothpaste', 'colgate', 'dove', 'dettol', 'cream', 'face wash', 'shaving', 'gillette', 'deodorant'],
    subcategories: [
      { name: 'Bath Soaps & Body Washes', slug: 'bath-soaps-bodywash', description: 'Antibacterial soaps, moisturising shower gels and loofahs', displayOrder: 1 },
      { name: 'Hair Care & Shampoos', slug: 'haircare-shampoos', description: 'Anti-dandruff shampoos, daily hair conditioners and nourishing oils', displayOrder: 2 },
      { name: 'Oral Care & Toothpastes', slug: 'oral-care-toothpaste', description: 'Cavity protection toothpaste, toothbrushes, tongue cleaners and mouthwash', displayOrder: 3 },
      { name: 'Skin Care & Moisturizers', slug: 'skincare-moisturizers', description: 'Face washes, sunscreen lotions, cold creams and lip balms', displayOrder: 4 },
      { name: 'Shaving & Men’s Grooming', slug: 'shaving-mens-grooming', description: 'Gillette razors, shaving foams, aftershaves and beard washes', displayOrder: 5 }
    ]
  },
  {
    name: 'Pet Care',
    slug: 'pet-care',
    description: 'Pedigree dog food, Whiskas cat food, chewy pet treats, anti-tick grooming shampoos, and pet accessories.',
    imageUrl: '/assets/categories/pet-care.svg',
    bannerUrl: '/product-images/categories/groceries-hero.webp',
    displayOrder: 20,
    department: 'GROCERY',
    metaTitle: 'Dog Food, Cat Food & Pet Supplies | Pedigree, Whiskas | Everything Local',
    metaDescription: 'Premium dog dry kibble, cat gravy pouches, calcium bones, pet grooming shampoos, and hygiene pads delivered fast.',
    keywords: ['pet', 'dog food', 'cat food', 'pedigree', 'whiskas', 'treats', 'pet care', 'tick shampoo', 'leash', 'chew bone'],
    subcategories: [
      { name: 'Dog Food & Nutrition', slug: 'dog-food-nutrition', description: 'Adult & puppy dry kibble, chicken gravy pouches and meat loaves', displayOrder: 1 },
      { name: 'Cat Food & Treats', slug: 'cat-food-treats', description: 'Tuna & salmon cat pouches, dry cat food and catnip toys', displayOrder: 2 },
      { name: 'Pet Treats & Rawhide Chews', slug: 'pet-treats-chews', description: 'Calcium milk bones, rawhide sticks, dental chews and jerky strips', displayOrder: 3 },
      { name: 'Pet Grooming & Hygiene', slug: 'pet-grooming-hygiene', description: 'Anti-tick dog shampoos, shedding combs, paw wipes and pee training pads', displayOrder: 4 },
      { name: 'Pet Collars, Leashes & Bowls', slug: 'pet-accessories', description: 'Durable walking leashes, nylon chest harnesses and stainless steel bowls', displayOrder: 5 }
    ]
  }
];

export async function seedCategories() {
  console.log(' Seeding 20 Production Categories & Subcategories for Everything Local...');

  const createdCategories: any[] = [];

  for (const catData of SEED_CATEGORIES) {
    const { subcategories, keywords, ...catFields } = catData;

    // Upsert main category
    const mainCategory = await prisma.productCategory.upsert({
      where: { slug: catFields.slug },
      update: {
        name: catFields.name,
        description: catFields.description,
        imageUrl: catFields.imageUrl,
        bannerUrl: catFields.bannerUrl,
        displayOrder: catFields.displayOrder,
        isActive: true,
        isHomepageVisible: true,
        department: catFields.department,
        metaTitle: catFields.metaTitle,
        metaDescription: catFields.metaDescription
      },
      create: {
        name: catFields.name,
        slug: catFields.slug,
        description: catFields.description,
        imageUrl: catFields.imageUrl,
        bannerUrl: catFields.bannerUrl,
        displayOrder: catFields.displayOrder,
        isActive: true,
        isHomepageVisible: true,
        department: catFields.department,
        metaTitle: catFields.metaTitle,
        metaDescription: catFields.metaDescription
      }
    });

    createdCategories.push(mainCategory);

    // Upsert subcategories
    for (const sub of subcategories) {
      await prisma.productCategory.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          description: sub.description,
          imageUrl: mainCategory.imageUrl,
          displayOrder: sub.displayOrder,
          isActive: true,
          isHomepageVisible: false,
          department: mainCategory.department,
          parentId: mainCategory.id
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          imageUrl: mainCategory.imageUrl,
          displayOrder: sub.displayOrder,
          isActive: true,
          isHomepageVisible: false,
          department: mainCategory.department,
          parentId: mainCategory.id
        }
      });
    }

    // Map existing products that match category keywords
    const products = await prisma.product.findMany({
      where: {
        OR: keywords.map(kw => ({
          OR: [
            { name: { contains: kw } },
            { category: { contains: kw } },
            { description: { contains: kw } }
          ]
        }))
      }
    });

    if (products.length > 0) {
      const productIds = products.map(p => p.id);
      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: {
          categoryId: mainCategory.id,
          category: mainCategory.name
        }
      });
    }
  }

  console.log(` Successfully seeded ${SEED_CATEGORIES.length} main categories and their subcategories.`);
}

// Allow direct CLI execution: tsx server/src/seedCategories.ts
if (require.main === module) {
  seedCategories()
    .catch((err) => {
      console.error('Error seeding categories:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
