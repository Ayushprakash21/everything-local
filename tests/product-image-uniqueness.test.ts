import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';
import { ProductImageValidator } from '../server/src/core/productImageValidator';

describe('Everything Local — Product Image Uniqueness & Diversity Acceptance Tests', () => {
  let customerToken: string;
  let adminToken: string;
  let allActiveProducts: any[] = [];

  beforeAll(async () => {
    // 1. Authenticate as Customer
    const custRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    expect(custRes.status).toBe(200);
    customerToken = custRes.body.token;

    // 2. Authenticate as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 3. Fetch active canonical grocery catalogue products (35 items across Sharma Kirana, Apna Fresh, Bake Well)
    allActiveProducts = await prisma.product.findMany({
      where: {
        isAvailable: true,
        store: { slug: { in: ['sharma-kirana-palasia', 'apna-fresh-vijay-nagar', 'bakewell-saket'] } }
      },
      include: { store: true }
    });
  });

  it('1. Dataset Acceptance: contains at least 25 distinct grocery products', () => {
    expect(allActiveProducts.length).toBeGreaterThanOrEqual(25);
    const distinctNames = new Set(allActiveProducts.map((p) => p.name));
    expect(distinctNames.size).toBeGreaterThanOrEqual(25);
  });

  it('2. Image Assignment: every single product has a valid commercial image URL', () => {
    for (const p of allActiveProducts) {
      expect(p.imageUrl).toBeDefined();
      expect(p.imageUrl).not.toBeNull();
      expect(p.imageUrl.trim()).not.toBe('');
      expect(p.imageUrl).toMatch(/^\/product-images\//);
    }
  });

  it('3. Duplicate Prevention: unrelated products NEVER share the same image', () => {
    const imageToProducts = new Map<string, string[]>();
    for (const p of allActiveProducts) {
      const list = imageToProducts.get(p.imageUrl) || [];
      list.push(p.name);
      imageToProducts.set(p.imageUrl, list);
    }

    for (const [img, names] of imageToProducts.entries()) {
      const uniqueNames = new Set(names.map((n) => n.toLowerCase().trim()));
      // If an image is assigned to multiple products, they must have the identical semantic identity
      if (uniqueNames.size > 1) {
        throw new Error(`Unrelated products share the same image [${img}]: ${Array.from(uniqueNames).join(', ')}`);
      }
    }
  });

  it('4. Semantic Relevance: validates sugar only on sugar, atta on atta, dals on dals', () => {
    for (const p of allActiveProducts) {
      const relevance = ProductImageValidator.validateProductImageRelevance(p.name, p.imageUrl);
      expect(relevance.isValid).toBe(true);
    }
  });

  it('5. Audit Engine: ProductImageValidator reports 100% compliant catalogue', () => {
    const audit = ProductImageValidator.auditCatalogue(allActiveProducts);
    expect(audit.isCatalogueCompliant).toBe(true);
    expect(audit.missingCount).toBe(0);
    expect(audit.brokenCount).toBe(0);
    expect(audit.semanticMismatchCount).toBe(0);
    expect(audit.duplicatesAcrossUnrelated).toBe(0);
    expect(audit.uniqueImagesCount).toBeGreaterThanOrEqual(25);
  });

  it('6. Search Verification: searching for specific staples returns exact unique image', async () => {
    const searchTerms = [
      { q: 'Atta', expectedImg: '/product-images/groceries/aashirvaad-chakki-atta.webp' },
      { q: 'Rice', expectedImg: '/product-images/groceries/india-gate-basmati-rice.webp' },
      { q: 'Sunflower Oil', expectedImg: '/product-images/groceries/fortune-sunflower-oil.webp' },
      { q: 'Mustard Oil', expectedImg: '/product-images/groceries/mustard-oil.webp' },
      { q: 'Toor Dal', expectedImg: '/product-images/groceries/toor-dal.webp' },
      { q: 'Moong Dal', expectedImg: '/product-images/groceries/moong-dal.webp' },
      { q: 'Chana Dal', expectedImg: '/product-images/groceries/chana-dal.webp' },
      { q: 'Rajma', expectedImg: '/product-images/groceries/rajma.webp' },
      { q: 'Poha', expectedImg: '/product-images/groceries/indori-poha.webp' },
      { q: 'Sugar', expectedImg: '/product-images/groceries/madhur-sugar.webp' }
    ];

    for (const term of searchTerms) {
      const res = await request(app).get(`/api/customer/products/search?q=${encodeURIComponent(term.q)}`);
      expect(res.status).toBe(200);
      const prods = res.body.products || [];
      expect(prods.length).toBeGreaterThan(0);
      const matched = prods.find((p: any) => p.name.toLowerCase().includes(term.q.toLowerCase()));
      expect(matched).toBeDefined();
      expect(matched.imageUrl).toBe(term.expectedImg);
    }
  });

  it('7. Cart & Checkout: retains distinct product image across multi-product basket', async () => {
    const toorDal = allActiveProducts.find((p) => p.name.includes('Toor Dal'));
    const atta = allActiveProducts.find((p) => p.name.includes('Atta'));
    const sugar = allActiveProducts.find((p) => p.name.includes('Sugar'));

    expect(toorDal).toBeDefined();
    expect(atta).toBeDefined();
    expect(sugar).toBeDefined();

    // Verify all 3 have completely distinct images
    expect(toorDal.imageUrl).not.toBe(atta.imageUrl);
    expect(toorDal.imageUrl).not.toBe(sugar.imageUrl);
    expect(atta.imageUrl).not.toBe(sugar.imageUrl);

    // Validate cart item creation returns distinct product details
    const cartRes = await request(app)
      .post('/api/customer/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        storeId: toorDal.storeId,
        productId: toorDal.id,
        quantity: 1
      });
    expect(cartRes.status).toBe(200);
    const addedItem = cartRes.body.cart.items.find((i: any) => i.productId === toorDal.id);
    expect(addedItem.product.imageUrl).toBe(toorDal.imageUrl);
  });
});
