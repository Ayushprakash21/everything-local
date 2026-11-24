/**
 * EveryBazaar Product Image Fallback Resolver
 * Maps specific products to authentic high-resolution WebP photographs.
 * When no suitable specific photograph exists, returns a category-specific
 * branded vector placeholder or neutral placeholder SVG.
 */

export const NEUTRAL_PRODUCT_PLACEHOLDER = '/brand/product-placeholder.svg';

export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  grocery: '/brand/placeholders/grocery.svg',
  produce: '/brand/placeholders/produce.svg',
  fashion: '/brand/placeholders/fashion.svg',
  beauty: '/brand/placeholders/beauty.svg',
  home: '/brand/placeholders/home.svg',
  electronics: '/brand/placeholders/electronics.svg',
  jewellery: '/brand/placeholders/jewellery.svg',
  footwear: '/brand/placeholders/footwear.svg',
  pharmacy: '/brand/placeholders/pharmacy.svg',
  services: '/brand/placeholders/services.svg'
};

export function resolveProductImage(name: string, category?: string, currentImageUrl?: string | null): string {
  if (currentImageUrl && currentImageUrl.trim() !== '') {
    return currentImageUrl;
  }
  const n = (name || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();

  // 1. Specific High-Confidence Product Matches
  // Groceries & Staples
  if (n.includes('atta') || n.includes('chakki fresh') || n.includes('wheat flour')) return '/product-images/groceries/aashirvaad-chakki-atta.webp';
  if (n.includes('sunflower oil') || n.includes('fortune oil')) return '/product-images/groceries/fortune-sunflower-oil.webp';
  if (n.includes('mustard oil') || n.includes('sarson')) return '/product-images/groceries/mustard-oil.webp';
  if (n.includes('ghee')) return '/product-images/groceries/cow-ghee.webp';
  if (n.includes('salt') || n.includes('namak')) return '/product-images/groceries/tata-salt.webp';
  if (n.includes('sugar') || n.includes('shakkar') || n.includes('cheeni')) return '/product-images/groceries/madhur-sugar.webp';
  if (n.includes('basmati') || n.includes('india gate')) return '/product-images/groceries/india-gate-basmati-rice.webp';
  if (n.includes('toor dal') || n.includes('arhar dal')) return '/product-images/groceries/toor-dal.webp';
  if (n.includes('moong dal') || n.includes('mung')) return '/product-images/groceries/moong-dal.webp';
  if (n.includes('chana dal')) return '/product-images/groceries/chana-dal.webp';
  if (n.includes('masoor dal')) return '/product-images/groceries/masoor-dal.webp';
  if (n.includes('rajma') || n.includes('kidney beans')) return '/product-images/groceries/rajma.webp';
  if (n.includes('kabuli chana') || n.includes('chhole')) return '/product-images/groceries/kabuli-chana.webp';
  if (n.includes('poha') || n.includes('pooha')) return '/product-images/groceries/indori-poha.webp';
  if (n.includes('sooji') || n.includes('rava') || n.includes('semolina')) return '/product-images/groceries/sooji-rava.webp';
  if (n.includes('besan') || n.includes('gram flour')) return '/product-images/groceries/besan.webp';
  if (n.includes('turmeric') || n.includes('haldi')) return '/product-images/groceries/turmeric-powder.webp';
  if (n.includes('red chilli powder') || n.includes('lal mirch powder')) return '/product-images/groceries/red-chilli-powder.webp';
  if (n.includes('cumin') || n.includes('jeera')) return '/product-images/groceries/cumin-seeds.webp';
  if (n.includes('tea') || n.includes('chai') || n.includes('tata tea')) return '/product-images/groceries/tata-tea.webp';
  if (n.includes('sev') || n.includes('indori sev') || n.includes('ujjaini sev')) return '/product-images/snacks-beverages/indori-sev.webp';

  // Produce (Fruits & Vegetables)
  if (n.includes('potato') || n.includes('aloo')) return '/product-images/fruits-vegetables/fresh-malwa-potatoes.webp';
  if (n.includes('onion') || n.includes('pyaz')) return '/product-images/fruits-vegetables/red-hybrid-onions.webp';
  if (n.includes('tomato') || n.includes('tamatar')) return '/product-images/fruits-vegetables/ripe-country-tomatoes.webp';
  if (n.includes('apple') || n.includes('seb')) return '/product-images/fruits-vegetables/shimla-apples.webp';
  if (n.includes('banana') || n.includes('kela')) return '/product-images/fruits-vegetables/fresh-bananas.webp';
  if (n.includes('mango') || n.includes('aam') || n.includes('alphonso')) return '/product-images/fruits-vegetables/alphonso-mangoes.webp';
  if (n.includes('coriander') || n.includes('dhaniya')) return '/product-images/fruits-vegetables/fresh-coriander.webp';
  if (n.includes('lemon') || n.includes('nimbu')) return '/product-images/fruits-vegetables/fresh-lemon.webp';
  if (n.includes('ginger') || n.includes('adrak')) return '/product-images/fruits-vegetables/fresh-ginger.webp';
  if (n.includes('green chilli') || n.includes('hari mirch')) return '/product-images/fruits-vegetables/green-chillies.webp';

  // Dairy & Bakery
  if (/\b(bread|pav)\b/.test(n)) return '/product-images/dairy-bakery/fresh-whole-wheat-bread.webp';
  if (/\b(butter|makhan)\b/.test(n)) return '/product-images/dairy-bakery/amul-butter.webp';
  if (/\b(milk|doodh|sanchi)\b/.test(n)) return '/product-images/dairy-bakery/sanchi-gold-milk.webp';
  if (/\b(paneer)\b/.test(n)) return '/product-images/dairy-bakery/fresh-paneer.webp';
  if (/\b(egg|eggs|anda)\b/.test(n)) return '/product-images/dairy-bakery/farm-eggs.webp';

  // Pharmacy & Medical
  if (n.includes('dolo') || n.includes('paracetamol')) return '/product-images/pharmacy/dolo-650.webp';
  if (n.includes('digene') || n.includes('antacid gel')) return '/product-images/pharmacy/digene-gel.webp';
  if (n.includes('augmentin') || n.includes('amoxycillin')) return '/product-images/pharmacy/augmentin-625.webp';
  if (n.includes('azithral') || n.includes('azithromycin')) return '/product-images/pharmacy/azithral-500.webp';
  if (n.includes('pantocid') || n.includes('pantoprazole')) return '/product-images/pharmacy/pantocid-40.webp';
  if (n.includes('telma') || n.includes('telmisartan')) return '/product-images/pharmacy/telma-40.webp';
  if (n.includes('cefix') || n.includes('cefixime')) return '/product-images/pharmacy/cefix-200.webp';
  if (n.includes('glucometer') || n.includes('accu-chek')) return '/product-images/pharmacy/accu-chek.webp';
  if (n.includes('bp monitor') || n.includes('omron')) return '/product-images/pharmacy/omron-bp.webp';
  if (n.includes('dettol') || n.includes('antiseptic')) return '/product-images/pharmacy/dettol-antiseptic.webp';
  if (n.includes('volini') || n.includes('pain relief gel')) return '/product-images/pharmacy/volini-gel.webp';
  if (n.includes('bandage') || n.includes('hansaplast')) return '/product-images/pharmacy/hansaplast-strips.webp';

  // 2. Category-Specific Branded Placeholders
  if (c.includes('produce') || c.includes('vegetable') || c.includes('fruit')) {
    return CATEGORY_PLACEHOLDERS.produce;
  }
  if (c.includes('fashion') || c.includes('clothing') || c.includes('apparel') || c.includes('shirt') || c.includes('saree')) {
    return CATEGORY_PLACEHOLDERS.fashion;
  }
  if (c.includes('beauty') || c.includes('cosmetic') || c.includes('skincare') || c.includes('personal care')) {
    return CATEGORY_PLACEHOLDERS.beauty;
  }
  if (c.includes('home') || c.includes('kitchen') || c.includes('decor') || c.includes('cookware')) {
    return CATEGORY_PLACEHOLDERS.home;
  }
  if (c.includes('electronic') || c.includes('electrical') || c.includes('bulb') || c.includes('mobile accessory')) {
    return CATEGORY_PLACEHOLDERS.electronics;
  }
  if (c.includes('jewel') || c.includes('watch') || c.includes('ring') || c.includes('earring') || c.includes('bangle')) {
    return CATEGORY_PLACEHOLDERS.jewellery;
  }
  if (c.includes('bag') || c.includes('footwear') || c.includes('shoe') || c.includes('sandal') || c.includes('travel')) {
    return CATEGORY_PLACEHOLDERS.footwear;
  }
  if (c.includes('pharma') || c.includes('medicine') || c.includes('wellness') || c.includes('health')) {
    return CATEGORY_PLACEHOLDERS.pharmacy;
  }
  if (c.includes('service') || c.includes('repair') || c.includes('laundry') || c.includes('salon')) {
    return CATEGORY_PLACEHOLDERS.services;
  }
  if (c.includes('dairy') || c.includes('bakery')) {
    return '/product-images/categories/dairy-bakery-hero.webp';
  }
  if (c.includes('snack') || c.includes('beverage') || c.includes('drink')) {
    return '/product-images/categories/snacks-drinks-hero.webp';
  }
  if (c.includes('grocery') || c.includes('staple') || c.includes('food')) {
    return CATEGORY_PLACEHOLDERS.grocery;
  }

  // 3. Neutral Branded Placeholder: Never show unrelated groceries for unknown items
  return NEUTRAL_PRODUCT_PLACEHOLDER;
}
