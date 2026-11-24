import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { prisma } from '../server/src/db';
import { resolveProductImage, CATEGORY_PLACEHOLDERS } from '../server/src/utils/productImageFallback';

describe('EveryBazaar 500-Product Marketplace Catalogue & Environment Management Suite', () => {
  it('contains exactly 500 unique catalogue products in DEMO environment', async () => {
    const count = await prisma.catalogueProduct.count({
      where: { environment: 'DEMO' }
    });
    expect(count).toBe(500);
  });

  it('matches the exact specified category distribution for all 10 departments', async () => {
    const products = await prisma.catalogueProduct.findMany({
      where: { environment: 'DEMO' },
      select: { categoryName: true, isService: true, isPrescriptionRequired: true }
    });

    const categoryCounts: Record<string, number> = {};
    for (const p of products) {
      categoryCounts[p.categoryName] = (categoryCounts[p.categoryName] || 0) + 1;
    }

    expect(categoryCounts['Grocery & Daily Essentials']).toBe(100);
    expect(categoryCounts['Fruits & Vegetables']).toBe(50);
    expect(categoryCounts['Clothing & Fashion']).toBe(70);
    expect(categoryCounts['Beauty & Personal Care']).toBe(45);
    expect(categoryCounts['Home, Kitchen & Décor']).toBe(65);
    expect(categoryCounts['Electronics & Electrical Décor']).toBe(45);
    expect(categoryCounts['Jewellery & Accessories']).toBe(45);
    expect(categoryCounts['Bags, Footwear & Travel']).toBe(30);
    expect(categoryCounts['Pharmacy & Wellness']).toBe(30);
    expect(categoryCounts['Services & Other Local Products']).toBe(20);

    const totalCalculated = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    expect(totalCalculated).toBe(500);
  });

  it('verifies zero prescription medicines are freely purchasable in Pharmacy & Wellness', async () => {
    const pharmacyProducts = await prisma.catalogueProduct.findMany({
      where: { categoryName: 'Pharmacy & Wellness' }
    });
    expect(pharmacyProducts.length).toBe(30);

    // All seeded pharmacy products must be OTC only
    const prescriptionProducts = pharmacyProducts.filter(p => p.isPrescriptionRequired);
    expect(prescriptionProducts.length).toBe(0);
  });

  it('verifies all 20 service items are marked with isService = true', async () => {
    const services = await prisma.catalogueProduct.findMany({
      where: { categoryName: 'Services & Other Local Products' }
    });
    expect(services.length).toBe(20);
    for (const s of services) {
      expect(s.isService).toBe(true);
    }
  });

  it('has zero duplicate SKUs across the catalogue', async () => {
    const products = await prisma.catalogueProduct.findMany({
      select: { sku: true }
    });
    const skus = products.map(p => p.sku);
    const uniqueSkus = new Set(skus);
    expect(uniqueSkus.size).toBe(skus.length);
  });

  it('has zero duplicate Slugs across the catalogue', async () => {
    const products = await prisma.catalogueProduct.findMany({
      select: { slug: true }
    });
    const slugs = products.map(p => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('verifies all 10 department demo stores exist with active merchant offers', async () => {
    const demoSlugs = [
      'agarwal-super-mart-palasia',
      'apna-fresh-mandi-vijay-nagar',
      'malwa-handlooms-fashion-saket',
      'indore-beauty-wellness-studio',
      'ujjaini-home-decor-utensils',
      'rajesh-electronics-electricals',
      'kundan-silver-house-sarafa',
      'step-in-footwear-travel-bags',
      'sanjeevani-medicos-wellness-otc',
      'quickpro-local-services-laundry'
    ];

    const demoStores = await prisma.store.findMany({
      where: { slug: { in: demoSlugs } },
      include: { _count: { select: { products: true } } }
    });

    expect(demoStores.length).toBe(10);
    for (const store of demoStores) {
      expect(store.isOpen).toBe(true);
      expect(store.isVerified).toBe(true);
      expect(store._count.products).toBeGreaterThan(0);
    }

    const totalDemoOffers = await prisma.product.count({
      where: { environment: 'DEMO' }
    });
    expect(totalDemoOffers).toBeGreaterThanOrEqual(500);
  });

  it('verifies image fallback engine provides branded placeholders for all 10 categories', () => {
    const expectedPlaceholders = [
      'grocery', 'produce', 'fashion', 'beauty', 'home',
      'electronics', 'jewellery', 'footwear', 'pharmacy', 'services'
    ];

    for (const key of expectedPlaceholders) {
      expect(CATEGORY_PLACEHOLDERS[key]).toBeDefined();
      expect(CATEGORY_PLACEHOLDERS[key]).toBe(`/brand/placeholders/${key}.svg`);

      // Verify physical file exists on disk
      const filePath = path.resolve(__dirname, `../client/public/brand/placeholders/${key}.svg`);
      expect(fs.existsSync(filePath)).toBe(true);
    }

    // Verify fallback resolver returns proper placeholder without cross-category contamination
    expect(resolveProductImage('Gold Plated Jhumka Earrings', 'Jewellery & Accessories', null))
      .toBe('/brand/placeholders/jewellery.svg');
    expect(resolveProductImage('Leather Laptop Bag', 'Bags, Footwear & Travel', null))
      .toBe('/brand/placeholders/footwear.svg');
    expect(resolveProductImage('Cotton Printed Bedsheet', 'Home, Kitchen & Décor', null))
      .toBe('/brand/placeholders/home.svg');
    expect(resolveProductImage('AC Deep Cleaning Service', 'Services & Other Local Products', null))
      .toBe('/brand/placeholders/services.svg');
  });

  it('verifies CSV catalogue template is present and contains required headers', () => {
    const csvPath = path.resolve(__dirname, '../client/public/catalogue-template.csv');
    expect(fs.existsSync(csvPath)).toBe(true);

    const content = fs.readFileSync(csvPath, 'utf-8');
    const firstLine = content.split('\n')[0].toLowerCase();
    expect(firstLine).toContain('sku');
    expect(firstLine).toContain('name');
    expect(firstLine).toContain('category');
    expect(firstLine).toContain('mrp');
  });

  it('verifies comprehensive catalogue markdown documentation exists', () => {
    const docPath = path.resolve(__dirname, '../docs/catalogue/500_PRODUCT_CATALOGUE.md');
    expect(fs.existsSync(docPath)).toBe(true);
    const content = fs.readFileSync(docPath, 'utf-8');
    expect(content).toContain('500-PRODUCT CENTRALIZED MARKETPLACE CATALOGUE');
    expect(content).toContain('EB-GRO-');
    expect(content).toContain('EB-PHR-');
  });
});
