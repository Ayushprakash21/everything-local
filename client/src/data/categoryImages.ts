/**
 * Realistic E-Commerce Category Photographs Mapping
 * High-resolution 512x512 WebP commercial product photography
 */

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  // 1. Paan Corner
  'paan-corner': '/category-images/paan-corner.webp',
  'paan': '/category-images/paan-corner.webp',

  // 2. Fruits & Vegetables
  'fruits-vegetables': '/category-images/fruits-vegetables.webp',
  'produce': '/category-images/fruits-vegetables.webp',
  'fruits-veg': '/category-images/fruits-vegetables.webp',

  // 3. Grocery & Daily Essentials
  'grocery-daily-essentials': '/category-images/grocery-daily-essentials.webp',
  'grocery': '/category-images/grocery-daily-essentials.webp',
  'groceries': '/category-images/grocery-daily-essentials.webp',

  // 4. Clothing & Fashion
  'clothing-fashion': '/category-images/clothing-fashion.webp',
  'fashion': '/category-images/clothing-fashion.webp',
  'clothing': '/category-images/clothing-fashion.webp',

  // 5. Beauty & Personal Care
  'beauty-personal-care': '/category-images/beauty-personal-care.webp',
  'beauty': '/category-images/beauty-personal-care.webp',

  // 6. Home, Kitchen & Décor
  'home-kitchen-decor': '/category-images/home-kitchen-decor.webp',
  'home-kitchen': '/category-images/home-kitchen-decor.webp',
  'kitchen': '/category-images/home-kitchen-decor.webp',

  // 7. Electronics & Electrical Décor
  'electronics-electrical-decor': '/category-images/electronics-electrical-decor.webp',
  'electronics': '/category-images/electronics-electrical-decor.webp',

  // 8. Jewellery & Accessories
  'jewellery-accessories': '/category-images/jewellery-accessories.webp',
  'jewellery': '/category-images/jewellery-accessories.webp',

  // 9. Bags, Footwear & Travel
  'bags-footwear-travel': '/category-images/bags-footwear-travel.webp',
  'footwear': '/category-images/bags-footwear-travel.webp',
  'travel': '/category-images/bags-footwear-travel.webp',

  // 10. Pharmacy & Wellness
  'pharmacy-wellness': '/category-images/pharmacy-wellness.webp',
  'pharmacy': '/category-images/pharmacy-wellness.webp',

  // 11. Services & Other Local Products
  'services-local-products': '/category-images/services-local-products.webp',
  'services': '/category-images/services-local-products.webp',

  // 12. Dairy, Bread & Eggs
  'dairy-bread-eggs': '/category-images/dairy-bread-eggs.webp',
  'dairy-bakery': '/category-images/dairy-bread-eggs.webp',
  'dairy': '/category-images/dairy-bread-eggs.webp',

  // 13. Cold Drinks & Juices
  'cold-drinks-juices': '/category-images/cold-drinks-juices.webp',
  'drinks': '/category-images/cold-drinks-juices.webp',
  'juices': '/category-images/cold-drinks-juices.webp',

  // 14. Snacks & Munchies
  'snacks-munchies': '/category-images/snacks-munchies.webp',
  'snacks': '/category-images/snacks-munchies.webp',
  'namkeen': '/category-images/snacks-munchies.webp',

  // 15. Breakfast & Instant Food
  'breakfast-instant-food': '/category-images/breakfast-instant-food.webp',
  'breakfast': '/category-images/breakfast-instant-food.webp',

  // 16. Sweet Tooth
  'sweet-tooth': '/category-images/sweet-tooth.webp',
  'sweets': '/category-images/sweet-tooth.webp',
  'mithai': '/category-images/sweet-tooth.webp',

  // 17. Bakery & Biscuits
  'bakery-biscuits': '/category-images/bakery-biscuits.webp',
  'bakery': '/category-images/bakery-biscuits.webp',

  // 18. Tea, Coffee & Milk Drinks
  'tea-coffee-milk-drinks': '/category-images/tea-coffee-milk-drinks.webp',
  'tea-coffee': '/category-images/tea-coffee-milk-drinks.webp',
  'beverages': '/category-images/tea-coffee-milk-drinks.webp',

  // 19. Atta, Rice & Dal
  'atta-rice-dal': '/category-images/atta-rice-dal.webp',
  'staples': '/category-images/atta-rice-dal.webp',

  // 20. Masala, Oil & More
  'masala-oil-more': '/category-images/masala-oil.webp',
  'masala-oil': '/category-images/masala-oil.webp',
  'oils': '/category-images/masala-oil.webp',

  // 21. Sauces & Spreads
  'sauces-spreads': '/category-images/sauces-spreads.webp',
  'sauces': '/category-images/sauces-spreads.webp',

  // 22. Chicken, Meat & Fish
  'chicken-meat-fish': '/category-images/chicken-meat-fish.webp',
  'meat': '/category-images/chicken-meat-fish.webp',

  // 23. Organic & Healthy Living
  'organic-healthy-living': '/category-images/organic-healthy-living.webp',
  'organic': '/category-images/organic-healthy-living.webp',

  // 24. Baby Care
  'baby-care': '/category-images/baby-care.webp',

  // 25. Pharma & Wellness
  'pharma-wellness': '/category-images/pharma.webp',
  'pharma': '/category-images/pharma.webp',

  // 26. Cleaning Essentials
  'cleaning-essentials': '/category-images/cleaning-essentials.webp',
  'cleaning': '/category-images/cleaning-essentials.webp',

  // 27. Home & Office
  'home-office': '/category-images/home-office.webp',
  'stationery': '/category-images/home-office.webp',

  // 28. Personal Care
  'personal-care': '/category-images/personal-care.webp',
  'personal': '/category-images/personal-care.webp',

  // 29. Pet Care
  'pet-care': '/category-images/pet-care.webp',
  'pets': '/category-images/pet-care.webp'
};

/**
 * Returns a high-resolution, realistic WebP photo for any category slug or name.
 */
export function getCategoryImageUrl(slugOrName?: string | null, fallback?: string): string {
  if (!slugOrName) {
    return fallback || '/category-images/grocery-daily-essentials.webp';
  }

  // Normalize slug / string
  const clean = slugOrName
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (CATEGORY_IMAGE_MAP[clean]) {
    return CATEGORY_IMAGE_MAP[clean];
  }

  // Check prefix / partial matching
  for (const [key, url] of Object.entries(CATEGORY_IMAGE_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return url;
    }
  }

  return fallback || '/category-images/grocery-daily-essentials.webp';
}
