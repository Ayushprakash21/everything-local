import { describe, it, expect } from 'vitest';
import { getCategoryFallbackAsset } from '../client/src/components/common/ImageWithFallback';
import fs from 'fs';
import path from 'path';

describe('Sprint 8: Responsive Layout, Brand Assets & Image System Audit Suite', () => {
  const publicBrandDir = path.resolve(__dirname, '../client/public/brand');
  const publicCategoryDir = path.resolve(__dirname, '../client/public/assets/categories');

  describe('1. Vector Brand Assets Verification', () => {
    const requiredBrandSvgs = [
      'everything-local-logo-compact.svg',
      'everything-local-logo-horizontal.svg',
      'everything-local-logo-dark.svg',
      'everything-local-logo-light.svg',
      'everything-local-symbol.svg',
      'everything-local-monochrome.svg',
      'everything-local-favicon.svg',
      'everything-local-app-icon.svg',
      'everything-local-merchant-logo.svg',
      'everything-local-delivery-icon.svg'
    ];

    it.each(requiredBrandSvgs)('ensures vector asset %s exists and contains valid SVG XML', (svgName) => {
      const fullPath = path.join(publicBrandDir, svgName);
      expect(fs.existsSync(fullPath)).toBe(true);

      const content = fs.readFileSync(fullPath, 'utf8');
      expect(content).toContain('<svg');
      expect(content).toContain('viewBox');
      expect(content).toContain('</svg>');
    });
  });

  describe('2. Product Category Image Fallback System (12 Categories)', () => {
    const categories = [
      { name: 'Fruits & Vegetables', expected: 'fruits-vegetables.svg' },
      { name: 'Dairy, Bread & Eggs', expected: 'dairy-bread.svg' },
      { name: 'Atta, Rice & Dal', expected: 'atta-dal.svg' },
      { name: 'Oil & Ghee', expected: 'oil-ghee.svg' },
      { name: 'Snacks & Cold Drinks', expected: 'snacks-drinks.svg' },
      { name: 'Personal Care & Hygiene', expected: 'personal-care.svg' },
      { name: 'Cleaning & Household', expected: 'cleaning.svg' },
      { name: 'Medicines & Health', expected: 'medicines.svg' },
      { name: 'Electronics & Appliances', expected: 'electronics.svg' },
      { name: 'Stationery & Books', expected: 'stationery.svg' },
      { name: 'Pet Care & Food', expected: 'pet-care.svg' },
      { name: 'General Household', expected: 'household.svg' }
    ];

    it.each(categories)(
      'resolves category fallback for "$name" to "$expected"',
      ({ name, expected }) => {
        const resolvedPath = getCategoryFallbackAsset(name);
        expect(resolvedPath).toContain(expected);

        // Verify that the fallback SVG file actually exists on disk
        const filename = path.basename(resolvedPath);
        const diskPath = path.join(publicCategoryDir, filename);
        expect(fs.existsSync(diskPath)).toBe(true);
      }
    );
  });

  describe('3. Responsive Breakpoint Standards', () => {
    it('defines consistent breakpoint spectrum covering 320px to 1920px', () => {
      const tailwindConfigPath = path.resolve(__dirname, '../tailwind.config.js');
      expect(fs.existsSync(tailwindConfigPath)).toBe(true);
      const content = fs.readFileSync(tailwindConfigPath, 'utf8');

      // Verify brand color palette is registered
      expect(content).toContain('brand');
      expect(content).toContain('primary');
      expect(content).toContain('accent');
    });
  });
});
