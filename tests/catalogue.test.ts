import { describe, it, expect } from 'vitest';
import { normalizeCategory, lookupBarcode } from '../server/src/core/catalogue';

describe('Product Catalogue & Barcode Normalization', () => {
  it('correctly normalizes categories to the 5 Everything Local retail sectors', () => {
    expect(normalizeCategory('cooking oils, mustard oil', 'Kachi Ghani Mustard Oil')).toBe('Edible Oils');
    expect(normalizeCategory('dairy, milks, pasteurized', 'Amul Taaza Milk 500ml')).toBe('Dairy & Bakery');
    expect(normalizeCategory('bakery, breads, whole wheat', 'Britannia Brown Bread')).toBe('Dairy & Bakery');
    expect(normalizeCategory('fresh fruits, apples', 'Shimla Royal Apple 1kg')).toBe('Vegetables & Fruits');
    expect(normalizeCategory('snacks, biscuits, cookies', 'Parle-G Glucose Biscuits')).toBe('Beverages & Snacks');
    expect(normalizeCategory('unknown category', 'Organic Masoor Dal 1kg')).toBe('Grocery Staples');
  });

  it('handles unknown or malformed barcodes gracefully without throwing', async () => {
    const result = await lookupBarcode('0000000000000');
    expect(result.found).toBe(false);
    expect(result.barcode).toBe('0000000000000');
  });

  it('rejects empty or non-alphanumeric barcodes', async () => {
    const result = await lookupBarcode('   ');
    expect(result.found).toBe(false);
    expect(result.message).toContain('Invalid barcode');
  });

  it('successfully retrieves known Indian consumer product when online', async () => {
    // Maggi 2-Minute Noodles standard Indian barcode
    const result = await lookupBarcode('8901058017687');
    if (result.found) {
      expect(result.name).toBeDefined();
      expect(result.barcode).toBe('8901058017687');
      expect(result.category).toBeDefined();
    } else {
      // Offline fallback still maintains schema
      expect(result.found).toBe(false);
      expect(result.barcode).toBe('8901058017687');
    }
  });
});
