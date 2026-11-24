/**
 * EveryBazaar Product Image Fallback Resolver
 * Maps product names and categories to realistic, high-resolution WebP photographs
 * situated in /product-images/
 */

export function resolveProductImage(name: string, category?: string, currentImageUrl?: string | null): string {
  if (currentImageUrl && currentImageUrl.trim() !== '') {
    return currentImageUrl;
  }
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // Groceries & Staples
  if (n.includes('atta') || n.includes('wheat') || n.includes('flour')) return '/product-images/groceries/aashirvaad-chakki-atta.webp';
  if (n.includes('oil')) return n.includes('mustard') ? '/product-images/groceries/mustard-oil.webp' : '/product-images/groceries/fortune-sunflower-oil.webp';
  if (n.includes('ghee')) return '/product-images/groceries/cow-ghee.webp';
  if (n.includes('salt')) return '/product-images/groceries/tata-salt.webp';
  if (n.includes('sugar')) return '/product-images/groceries/madhur-sugar.webp';
  if (n.includes('rice') || n.includes('basmati')) return '/product-images/groceries/india-gate-basmati-rice.webp';
  if (n.includes('toor dal')) return '/product-images/groceries/toor-dal.webp';
  if (n.includes('moong')) return '/product-images/groceries/moong-dal.webp';
  if (n.includes('chana dal')) return '/product-images/groceries/chana-dal.webp';
  if (n.includes('masoor')) return '/product-images/groceries/masoor-dal.webp';
  if (n.includes('rajma')) return '/product-images/groceries/rajma.webp';
  if (n.includes('chana') || n.includes('chickpea')) return '/product-images/groceries/kabuli-chana.webp';
  if (n.includes('poha')) return '/product-images/groceries/indori-poha.webp';
  if (n.includes('sooji') || n.includes('rava')) return '/product-images/groceries/sooji-rava.webp';
  if (n.includes('besan')) return '/product-images/groceries/besan.webp';
  if (n.includes('haldi') || n.includes('turmeric')) return '/product-images/groceries/turmeric-powder.webp';
  if (n.includes('chilli') || n.includes('mirch')) return n.includes('powder') ? '/product-images/groceries/red-chilli-powder.webp' : '/product-images/fruits-vegetables/green-chillies.webp';
  if (n.includes('jeera') || n.includes('cumin')) return '/product-images/groceries/cumin-seeds.webp';
  if (n.includes('tea') || n.includes('chai')) return '/product-images/groceries/tata-tea.webp';
  if (n.includes('sev') || n.includes('namkeen')) return '/product-images/snacks-beverages/indori-sev.webp';

  // Produce (Fruits & Vegetables)
  if (n.includes('potato') || n.includes('aloo')) return '/product-images/fruits-vegetables/fresh-malwa-potatoes.webp';
  if (n.includes('onion') || n.includes('pyaz')) return '/product-images/fruits-vegetables/red-hybrid-onions.webp';
  if (n.includes('tomato') || n.includes('tamatar')) return '/product-images/fruits-vegetables/ripe-country-tomatoes.webp';
  if (n.includes('apple') || n.includes('seb')) return '/product-images/fruits-vegetables/shimla-apples.webp';
  if (n.includes('banana') || n.includes('kela')) return '/product-images/fruits-vegetables/fresh-bananas.webp';
  if (n.includes('mango') || n.includes('aam')) return '/product-images/fruits-vegetables/alphonso-mangoes.webp';
  if (n.includes('coriander') || n.includes('dhaniya')) return '/product-images/fruits-vegetables/fresh-coriander.webp';
  if (n.includes('lemon') || n.includes('nimbu')) return '/product-images/fruits-vegetables/fresh-lemon.webp';
  if (n.includes('ginger') || n.includes('adrak')) return '/product-images/fruits-vegetables/fresh-ginger.webp';

  // Dairy & Bakery
  if (n.includes('bread')) return '/product-images/dairy-bakery/fresh-whole-wheat-bread.webp';
  if (n.includes('butter')) return '/product-images/dairy-bakery/amul-butter.webp';
  if (n.includes('milk') || n.includes('doodh')) return '/product-images/dairy-bakery/sanchi-gold-milk.webp';
  if (n.includes('paneer')) return '/product-images/dairy-bakery/fresh-paneer.webp';
  if (n.includes('egg') || n.includes('anda')) return '/product-images/dairy-bakery/farm-eggs.webp';

  // Pharmacy
  if (n.includes('dolo')) return '/product-images/pharmacy/dolo-650.webp';
  if (n.includes('digene')) return '/product-images/pharmacy/digene-gel.webp';
  if (n.includes('augmentin')) return '/product-images/pharmacy/augmentin-625.webp';
  if (n.includes('azithral')) return '/product-images/pharmacy/azithral-500.webp';
  if (n.includes('pantocid')) return '/product-images/pharmacy/pantocid-40.webp';
  if (n.includes('telma')) return '/product-images/pharmacy/telma-40.webp';
  if (n.includes('cefix')) return '/product-images/pharmacy/cefix-200.webp';
  if (n.includes('glucometer') || n.includes('accu-chek')) return '/product-images/pharmacy/accu-chek.webp';
  if (n.includes('bp') || n.includes('omron')) return '/product-images/pharmacy/omron-bp.webp';
  if (n.includes('dettol')) return '/product-images/pharmacy/dettol-antiseptic.webp';
  if (n.includes('volini')) return '/product-images/pharmacy/volini-gel.webp';
  if (n.includes('bandage') || n.includes('hansaplast')) return '/product-images/pharmacy/hansaplast-strips.webp';

  // Department / Category Fallbacks
  if (c.includes('produce') || c.includes('vegetable') || c.includes('fruit')) return '/product-images/fruits-vegetables/fresh-malwa-potatoes.webp';
  if (c.includes('dairy') || c.includes('bakery')) return '/product-images/dairy-bakery/fresh-whole-wheat-bread.webp';
  if (c.includes('pharmacy')) return '/product-images/pharmacy/dolo-650.webp';
  if (c.includes('snack') || c.includes('beverage')) return '/product-images/snacks-beverages/indori-sev.webp';

  return '/product-images/groceries/aashirvaad-chakki-atta.webp';
}
