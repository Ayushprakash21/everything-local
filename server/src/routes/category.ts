import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// ==========================================
// 1. PUBLIC CATEGORY DISCOVERY
// ==========================================

/**
 * GET /api/categories
 * Returns active root categories with subcategories for navigation
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, includeInactive, limit } = req.query;

    const where: any = {
      parentId: null
    };

    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    if (department && typeof department === 'string') {
      where.department = department.toUpperCase();
    }

    const categories = await prisma.productCategory.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      take: limit ? parseInt(limit as string, 10) : undefined,
      include: {
        children: {
          where: includeInactive === 'true' ? {} : { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: { select: { products: true } }
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch categories', message: error.message });
  }
});

/**
 * GET /api/categories/homepage
 * Returns the homepage category grid tiles (ordered, active, visible on homepage)
 */
router.get('/homepage', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.productCategory.findMany({
      where: {
        parentId: null,
        isActive: true,
        isHomepageVisible: true
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        },
        _count: { select: { products: true } }
      }
    });

    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch homepage categories', message: error.message });
  }
});

/**
 * GET /api/categories/departments
 * Returns all distinct departments in the marketplace for future expansion
 */
router.get('/departments', async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.productCategory.findMany({
      where: { parentId: null, isActive: true },
      select: { department: true },
      distinct: ['department']
    });

    const list = departments.map((d) => d.department);
    res.json({ departments: list });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch departments', message: error.message });
  }
});

/**
 * GET /api/categories/:slug
 * Returns category details, breadcrumbs, and active subcategories
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await prisma.productCategory.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: { select: { products: true } }
          }
        },
        _count: { select: { products: true } }
      }
    });

    if (!category) {
      res.status(404).json({ error: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
      return;
    }

    const breadcrumbs = [];
    if (category.parent) {
      breadcrumbs.push({
        id: category.parent.id,
        name: category.parent.name,
        slug: category.parent.slug
      });
    }
    breadcrumbs.push({
      id: category.id,
      name: category.name,
      slug: category.slug
    });

    res.json({ category, breadcrumbs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch category details', message: error.message });
  }
});

/**
 * GET /api/categories/:slug/products
 * Returns products for this category or subcategory with rich filtering & sorting
 */
router.get('/:slug/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const {
      subcategory,
      subcategoryId,
      storeId,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'relevance',
      page = '1',
      limit = '40'
    } = req.query;

    const category = await prisma.productCategory.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Determine target category IDs
    let targetCategoryIds: string[] = [];

    if (category.parentId) {
      // It's a subcategory
      targetCategoryIds = [category.id];
    } else {
      // It's a main category
      if (subcategoryId && typeof subcategoryId === 'string') {
        targetCategoryIds = [subcategoryId];
      } else if (subcategory && typeof subcategory === 'string') {
        const foundSub = category.children.find((c) => c.slug === subcategory);
        if (foundSub) {
          targetCategoryIds = [foundSub.id];
        } else {
          targetCategoryIds = [category.id, ...category.children.map((c) => c.id)];
        }
      } else {
        targetCategoryIds = [category.id, ...category.children.map((c) => c.id)];
      }
    }

    // Build Prisma where clause
    const where: any = {
      isAvailable: true,
      OR: [
        { categoryId: { in: targetCategoryIds } },
        { subcategoryId: { in: targetCategoryIds } },
        // Fallback for keyword/name matching with category name
        { category: { contains: category.name } }
      ]
    };

    if (storeId && typeof storeId === 'string') {
      where.storeId = storeId;
    }

    if (brand && typeof brand === 'string' && brand !== 'all') {
      where.brand = brand;
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    if (minPrice || maxPrice) {
      where.pricePaise = {};
      if (minPrice) where.pricePaise.gte = parseInt(minPrice as string, 10);
      if (maxPrice) where.pricePaise.lte = parseInt(maxPrice as string, 10);
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { pricePaise: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { pricePaise: 'desc' };
    } else if (sortBy === 'name_asc') {
      orderBy = { name: 'asc' };
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
              addressLine: true,
              city: true,
              serviceRadiusKm: true,
              isOpen: true,
              isVerified: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // Extract available filter metadata (unique brands and price range)
    const allMatchingProducts = await prisma.product.findMany({
      where: {
        OR: [
          { categoryId: { in: targetCategoryIds } },
          { subcategoryId: { in: targetCategoryIds } },
          { category: { contains: category.name } }
        ]
      },
      select: { brand: true, pricePaise: true, storeId: true }
    });

    const availableBrands = Array.from(new Set(allMatchingProducts.map((p) => p.brand).filter(Boolean))) as string[];
    const minAvailablePricePaise = allMatchingProducts.length > 0 ? Math.min(...allMatchingProducts.map((p) => p.pricePaise)) : 0;
    const maxAvailablePricePaise = allMatchingProducts.length > 0 ? Math.max(...allMatchingProducts.map((p) => p.pricePaise)) : 0;

    res.json({
      category,
      subcategories: category.children,
      products,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      filters: {
        brands: availableBrands,
        minPricePaise: minAvailablePricePaise,
        maxPricePaise: maxAvailablePricePaise
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch category products', message: error.message });
  }
});

// ==========================================
// 2. ADMIN CATEGORY MANAGEMENT ROUTES
// ==========================================

const CategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional().default('/assets/categories/organic-healthy-living.svg'),
  bannerUrl: z.string().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isHomepageVisible: z.boolean().default(true),
  department: z.string().default('GROCERY'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  parentId: z.string().nullable().optional()
});

/**
 * POST /api/categories/admin/create
 * Create a new category or subcategory (Admin only)
 */
router.post('/admin/create', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = CategorySchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Validation failed', details: parse.error.errors });
      return;
    }

    const { slug, ...data } = parse.data;

    const existing = await prisma.productCategory.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: 'A category with this slug already exists' });
      return;
    }

    const newCategory = await prisma.productCategory.create({
      data: {
        slug,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        bannerUrl: data.bannerUrl,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        isHomepageVisible: data.isHomepageVisible,
        department: data.department.toUpperCase(),
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        parentId: data.parentId || null
      }
    });

    res.status(201).json({ category: newCategory });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create category', message: error.message });
  }
});

/**
 * PUT /api/categories/admin/:id
 * Update an existing category (Admin only)
 */
router.put('/admin/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const updated = await prisma.productCategory.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        slug: body.slug ?? existing.slug,
        description: body.description ?? existing.description,
        imageUrl: body.imageUrl ?? existing.imageUrl,
        bannerUrl: body.bannerUrl ?? existing.bannerUrl,
        displayOrder: body.displayOrder !== undefined ? parseInt(body.displayOrder, 10) : existing.displayOrder,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        isHomepageVisible: body.isHomepageVisible !== undefined ? Boolean(body.isHomepageVisible) : existing.isHomepageVisible,
        department: body.department ? body.department.toUpperCase() : existing.department,
        metaTitle: body.metaTitle ?? existing.metaTitle,
        metaDescription: body.metaDescription ?? existing.metaDescription,
        parentId: body.parentId !== undefined ? body.parentId : existing.parentId
      }
    });

    res.json({ category: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update category', message: error.message });
  }
});

/**
 * DELETE /api/categories/admin/:id
 * Safely delete a category. Prevents deletion if active products exist without reassignment.
 */
router.delete('/admin/:id', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        children: true,
        _count: { select: { products: true, subcategoryProducts: true } }
      }
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const childIds = category.children.map((c) => c.id);
    const productsInSubcategories = await prisma.product.count({
      where: {
        OR: [
          { categoryId: { in: [id, ...childIds] } },
          { subcategoryId: { in: [id, ...childIds] } }
        ]
      }
    });

    const totalActiveProducts = category._count.products + category._count.subcategoryProducts + productsInSubcategories;

    if (totalActiveProducts > 0) {
      res.status(409).json({
        error: 'CANNOT_DELETE_ACTIVE_CATEGORY',
        message: `Cannot delete category "${category.name}". It is associated with ${totalActiveProducts} active products. Please reassign or unlist products first.`
      });
      return;
    }

    await prisma.productCategory.delete({ where: { id } });

    res.json({ success: true, message: `Category "${category.name}" deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete category', message: error.message });
  }
});

/**
 * POST /api/categories/admin/reorder
 * Bulk reorder categories (Admin only)
 */
router.post('/admin/reorder', authenticateToken, requireRole('ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { orders } = req.body; // Array of { id: string, displayOrder: number }

    if (!Array.isArray(orders)) {
      res.status(400).json({ error: 'Orders must be an array of { id, displayOrder }' });
      return;
    }

    await prisma.$transaction(
      orders.map((item) =>
        prisma.productCategory.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder }
        })
      )
    );

    res.json({ success: true, message: 'Category order updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reorder categories', message: error.message });
  }
});

// ==========================================
// 3. MERCHANT CATEGORY SELECTION ROUTES
// ==========================================

/**
 * GET /api/categories/merchant/approved
 * Returns hierarchy of approved categories and subcategories for merchant product form
 */
router.get('/merchant/approved', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.productCategory.findMany({
      where: {
        parentId: null,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch merchant categories', message: error.message });
  }
});

export default router;
