import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import { prisma } from '../server/src/db';

describe('Everything Local — Homepage Category Navigation & Product Discovery Test Suite', () => {
  let adminToken: string;
  let testCategoryId: string;
  let testSubcategoryId: string;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'admin@everythinglocal.in', password: 'Password@123' });

    if (adminLogin.status === 200 && adminLogin.body.token) {
      adminToken = adminLogin.body.token;
    } else {
      // Find or create admin in prisma directly
      let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (!admin) {
        admin = await prisma.user.create({
          data: {
            name: 'Super Admin',
            email: 'admin@everythinglocal.in',
            passwordHash: '$2b$10$YourHashedPasswordHereOrBcrypt',
            role: 'ADMIN'
          }
        });
      }
      const tokenRes = await request(app)
        .post('/api/auth/login')
        .send({ emailOrPhone: admin.email, password: 'Password@123' });
      adminToken = tokenRes.body.token;
    }
  });

  describe('1. Homepage Category Hierarchy Endpoints', () => {
    it('returns all 20 active homepage categories with subcategories', async () => {
      const res = await request(app).get('/api/categories/homepage');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThanOrEqual(20);

      const firstCat = res.body.categories[0];
      expect(firstCat).toHaveProperty('id');
      expect(firstCat).toHaveProperty('name');
      expect(firstCat).toHaveProperty('slug');
      expect(firstCat).toHaveProperty('imageUrl');
      expect(firstCat).toHaveProperty('children');
      expect(Array.isArray(firstCat.children)).toBe(true);
      expect(firstCat.children.length).toBeGreaterThan(0);
    });

    it('returns distinct marketplace departments', async () => {
      const res = await request(app).get('/api/categories/departments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.departments)).toBe(true);
      expect(res.body.departments).toContain('GROCERY');
    });

    it('retrieves category by slug with breadcrumbs and subcategories', async () => {
      const res = await request(app).get('/api/categories/fruits-vegetables');
      expect(res.status).toBe(200);
      expect(res.body.category).toBeDefined();
      expect(res.body.category.name).toBe('Fruits & Vegetables');
      expect(res.body.category.slug).toBe('fruits-vegetables');
      expect(Array.isArray(res.body.category.children)).toBe(true);
      expect(Array.isArray(res.body.breadcrumbs)).toBe(true);
    });

    it('returns 404 for unknown category slug', async () => {
      const res = await request(app).get('/api/categories/non-existent-alien-category');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('2. Category Products Listing & Filtering', () => {
    it('retrieves products for Fruits & Vegetables category with sorting and pagination', async () => {
      const res = await request(app).get('/api/categories/fruits-vegetables/products?sort=price_asc');
      expect(res.status).toBe(200);
      expect(res.body.category).toBeDefined();
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.pagination).toBeDefined();

      if (res.body.products.length > 1) {
        // Verify ascending price order
        const p1 = res.body.products[0].pricePaise;
        const p2 = res.body.products[1].pricePaise;
        expect(p1).toBeLessThanOrEqual(p2);
      }
    });

    it('filters category products by price range', async () => {
      const res = await request(app).get('/api/categories/fruits-vegetables/products?minPrice=50&maxPrice=200');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      for (const p of res.body.products) {
        expect(p.pricePaise).toBeGreaterThanOrEqual(5000);
        expect(p.pricePaise).toBeLessThanOrEqual(20000);
      }
    });
  });

  describe('3. Merchant Approved Categories API', () => {
    it('provides approved categories tree for merchant product catalog forms', async () => {
      const res = await request(app).get('/api/categories/merchant/approved');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThanOrEqual(20);

      // Verify every category has id, name, and children array
      const cat = res.body.categories[0];
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('children');
    });
  });

  describe('4. Admin Category Lifecycle & Integrity Protection', () => {
    it('allows admin to create a new category', async () => {
      const createRes = await request(app)
        .post('/api/categories/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Gourmet Foods',
          slug: 'test-gourmet-foods',
          description: 'Speciality imported artisan cheeses and oils',
          imageUrl: '/assets/categories/organic-healthy-living.svg',
          department: 'GROCERY',
          displayOrder: 99
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.category).toBeDefined();
      expect(createRes.body.category.slug).toBe('test-gourmet-foods');
      testCategoryId = createRes.body.category.id;
    });

    it('allows admin to create a subcategory under the parent category', async () => {
      const subRes = await request(app)
        .post('/api/categories/admin/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Artisan Cheeses',
          slug: 'artisan-cheeses-test',
          parentId: testCategoryId,
          department: 'GROCERY',
          displayOrder: 1
        });

      expect(subRes.status).toBe(201);
      expect(subRes.body.category.parentId).toBe(testCategoryId);
      testSubcategoryId = subRes.body.category.id;
    });

    it('blocks deletion of a category if it has mapped products or subcategories with products', async () => {
      // Find Fruits & Vegetables category which has mapped products
      const fv = await prisma.productCategory.findUnique({
        where: { slug: 'fruits-vegetables' }
      });

      if (fv) {
        const delRes = await request(app)
          .delete(`/api/categories/admin/${fv.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(delRes.status).toBe(409);
        expect(delRes.body.error).toBe('CANNOT_DELETE_ACTIVE_CATEGORY');
      }
    });

    it('allows clean deletion of an empty test category without products', async () => {
      // Delete subcategory first
      if (testSubcategoryId) {
        const delSub = await request(app)
          .delete(`/api/categories/admin/${testSubcategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(delSub.status).toBe(200);
      }

      // Delete parent category
      if (testCategoryId) {
        const delParent = await request(app)
          .delete(`/api/categories/admin/${testCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(delParent.status).toBe(200);
      }
    });
  });

  describe('5. Tara AI Assistant Category Awareness', () => {
    it('answers customer category questions using live category hierarchy', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'What categories and snacks do you have available?'
        });

      expect(res.status).toBe(200);
      expect(res.body.reply).toBeDefined();
      expect(res.body.reply.toLowerCase()).toMatch(/category|categories|snacks|grocer/i);
    });
  });
});
