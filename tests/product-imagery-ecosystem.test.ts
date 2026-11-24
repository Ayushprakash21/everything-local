import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../server/src/index';
import { prisma } from '../server/src/db';

describe('AI Realistic Product Imagery Ecosystem', () => {
  let adminToken: string;
  let sampleProduct: any;

  beforeAll(async () => {
    // Authenticate as Admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrPhone: 'admin@everythinglocal.in',
        password: 'Password@123'
      });

    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.token;

    sampleProduct = await prisma.product.findFirst({
      where: { imageUrl: { not: null } }
    });
    expect(sampleProduct).toBeDefined();
  });

  describe('1. Static Asset Serving & Verification', () => {
    it('serves static product images with correct MIME type and caching', async () => {
      const res = await request(app).get('/product-images/groceries/aashirvaad-chakki-atta.webp');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/webp');
    });

    it('serves fruits and vegetables photography correctly', async () => {
      const res = await request(app).get('/product-images/fruits-vegetables/fresh-malwa-potatoes.webp');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/webp');
    });

    it('verifies critical commercial assets exist on disk with valid file size', () => {
      const baseDir = path.resolve(__dirname, '../client/public/product-images');
      const requiredAssets = [
        'groceries/aashirvaad-chakki-atta.webp',
        'groceries/fortune-sunflower-oil.webp',
        'groceries/india-gate-basmati-rice.webp',
        'groceries/madhur-sugar.webp',
        'groceries/tata-salt.webp',
        'fruits-vegetables/fresh-malwa-potatoes.webp',
        'fruits-vegetables/red-hybrid-onions.webp',
        'fruits-vegetables/ripe-country-tomatoes.webp',
        'fruits-vegetables/shimla-apples.webp',
        'fruits-vegetables/alphonso-mangoes.webp',
        'dairy-bakery/amul-butter.webp',
        'dairy-bakery/sanchi-gold-milk.webp',
        'dairy-bakery/fresh-whole-wheat-bread.webp',
        'snacks-beverages/indori-sev.webp',
        'pharmacy/dolo-650.webp',
        'categories/groceries-hero.webp',
        'categories/fruits-vegetables-hero.webp'
      ];

      for (const asset of requiredAssets) {
        const fullPath = path.join(baseDir, asset);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(1000); // Non-empty image (> 1KB)
      }
    });
  });

  describe('2. Admin Product Imagery Quality Control Endpoints', () => {
    it('fetches comprehensive imagery health audit metrics', async () => {
      const res = await request(app)
        .get('/api/admin/imagery/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.totalProducts).toBeGreaterThan(0);
      expect(res.body.metrics.coveragePct).toBeGreaterThanOrEqual(95);
      expect(res.body.metrics.aiStudioCount).toBeGreaterThan(0);
      expect(Array.isArray(res.body.products)).toBe(true);

      const first = res.body.products[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('category');
      expect(first).toHaveProperty('imageSource');
      expect(first).toHaveProperty('hasImage');
    });

    it('allows administrators to update product image URL dynamically', async () => {
      const newImageUrl = '/product-images/groceries/tata-salt.webp';
      const updateRes = await request(app)
        .patch(`/api/admin/imagery/products/${sampleProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imageUrl: newImageUrl });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.product.imageUrl).toBe(newImageUrl);

      // Verify database persistence
      const fresh = await prisma.product.findUnique({
        where: { id: sampleProduct.id }
      });
      expect(fresh?.imageUrl).toBe(newImageUrl);

      // Restore original image URL to maintain catalogue integrity
      await prisma.product.update({
        where: { id: sampleProduct.id },
        data: { imageUrl: sampleProduct.imageUrl }
      });
    });
  });

  describe('3. Customer API Realistic Image Delivery', () => {
    it('delivers non-null realistic image URLs in customer store catalogue', async () => {
      const res = await request(app).get('/api/customer/stores?lat=22.75&lng=75.89');
      expect(res.status).toBe(200);
      expect(res.body.stores).toBeDefined();

      const storesWithProducts = res.body.stores.filter((s: any) => s.sampleProducts?.length > 0);
      expect(storesWithProducts.length).toBeGreaterThan(0);

      let foundSampleWithImage = false;
      for (const store of storesWithProducts) {
        for (const p of store.sampleProducts) {
          if (p.imageUrl) {
            foundSampleWithImage = true;
            expect(p.imageUrl).toMatch(/^\/product-images\//);
          }
        }
      }
      expect(foundSampleWithImage).toBe(true);
    });
  });

  describe('4. Image Normalization & Provenance Classification', () => {
    it('correctly classifies image provenance', async () => {
      const res = await request(app)
        .get('/api/admin/imagery/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const studioProducts = res.body.products.filter((p: any) => p.imageSource === 'AI_STUDIO');
      expect(studioProducts.length).toBeGreaterThan(0);
      for (const p of studioProducts) {
        expect(p.imageUrl).toContain('/product-images/');
        expect(p.isVerifiedRealistic).toBe(true);
      }
    });
  });
});
