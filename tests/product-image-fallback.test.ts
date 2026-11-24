import { describe, it, expect } from 'vitest';
import { resolveProductImage, NEUTRAL_PRODUCT_PLACEHOLDER } from '../server/src/utils/productImageFallback';

describe('EveryBazaar Product Image Fallback & Placeholder Engine', () => {
  it('1. Correctly maps known grocery staples to authentic photography', () => {
    expect(resolveProductImage('Chakki Fresh Atta 5kg', 'Staples')).toBe('/product-images/groceries/aashirvaad-chakki-atta.webp');
    expect(resolveProductImage('Fortune Sunflower Oil 1L', 'Oils')).toBe('/product-images/groceries/fortune-sunflower-oil.webp');
    expect(resolveProductImage('Madhur Pure Sugar 1kg', 'Groceries')).toBe('/product-images/groceries/madhur-sugar.webp');
    expect(resolveProductImage('India Gate Basmati Rice', 'Rice')).toBe('/product-images/groceries/india-gate-basmati-rice.webp');
  });

  it('2. Correctly maps known fresh produce items to authentic photography', () => {
    expect(resolveProductImage('Fresh Malwa Potatoes', 'Vegetables')).toBe('/product-images/fruits-vegetables/fresh-malwa-potatoes.webp');
    expect(resolveProductImage('Red Hybrid Onions', 'Vegetables')).toBe('/product-images/fruits-vegetables/red-hybrid-onions.webp');
    expect(resolveProductImage('Ripe Country Tomatoes', 'Vegetables')).toBe('/product-images/fruits-vegetables/ripe-country-tomatoes.webp');
    expect(resolveProductImage('Alphonso Mangoes', 'Fruits')).toBe('/product-images/fruits-vegetables/alphonso-mangoes.webp');
  });

  it('3. Correctly maps known pharmacy items to verified medication photography', () => {
    expect(resolveProductImage('Dolo 650 Tablet', 'Pharmacy')).toBe('/product-images/pharmacy/dolo-650.webp');
    expect(resolveProductImage('Augmentin 625 Duo Tablet', 'Pharmacy')).toBe('/product-images/pharmacy/augmentin-625.webp');
    expect(resolveProductImage('Digene Antacid Gel', 'Pharmacy')).toBe('/product-images/pharmacy/digene-gel.webp');
  });

  it('4. NEVER shows grocery Atta for unknown products: returns neutral branded placeholder', () => {
    const unknownItems = [
      { name: 'Cello Butterflow Blue Ball Pen', category: 'Stationery' },
      { name: 'Boat Bassheads 100 Wired Earphones', category: 'Electronics' },
      { name: 'Cotton Crew Neck T-Shirt L', category: 'Fashion' },
      { name: 'Stainless Steel Water Bottle 1L', category: 'Home & Kitchen' },
      { name: 'Random Custom Product X', category: 'General' }
    ];

    for (const item of unknownItems) {
      const img = resolveProductImage(item.name, item.category);
      expect(img).toBe(NEUTRAL_PRODUCT_PLACEHOLDER);
      expect(img).not.toContain('aashirvaad-chakki-atta');
      expect(img).not.toContain('groceries');
    }
  });

  it('5. Preserves existing custom merchant-uploaded image URLs intact', () => {
    const customUrl = 'https://custom-merchant-bucket.r2.cloudflarestorage.com/stores/s1/my-item.jpg';
    expect(resolveProductImage('Chakki Fresh Atta', 'Staples', customUrl)).toBe(customUrl);
  });
});
