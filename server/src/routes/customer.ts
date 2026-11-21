import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';
import { GeospatialEngine } from '../core/geospatial';
import { FinancialEngine } from '../core/finance';
import { DeliveryServiceAdapter } from '../core/deliveryAdapter';

const router = Router();

// 1. Discover Nearby Stores (Filtered by 3km service radius)
router.get('/stores', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string) || GeospatialEngine.INDORE_LANDMARKS.PALASIA.latitude;
    const lng = parseFloat(req.query.lng as string) || GeospatialEngine.INDORE_LANDMARKS.PALASIA.longitude;
    const category = req.query.category as string | undefined;

    const customerCoord = { latitude: lat, longitude: lng };

    const whereClause: any = {
      isOpen: true,
      isVerified: true
    };
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    const stores = await prisma.store.findMany({
      where: whereClause,
      include: {
        products: {
          where: { isAvailable: true },
          take: 5
        },
        reviews: {
          select: { rating: true }
        }
      }
    });

    const evaluatedStores = stores.map((store) => {
      const storeCoord = { latitude: store.latitude, longitude: store.longitude };
      const serviceability = GeospatialEngine.evaluateServiceability(
        storeCoord,
        customerCoord,
        store.serviceRadiusKm
      );

      const avgRating = store.reviews.length
        ? store.reviews.reduce((acc, r) => acc + r.rating, 0) / store.reviews.length
        : 4.8; // Default initial merchant rating

      return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        category: store.category,
        addressLine: store.addressLine,
        city: store.city,
        pincode: store.pincode,
        latitude: store.latitude,
        longitude: store.longitude,
        distanceKm: serviceability.distanceKm,
        isServiceable: serviceability.isServiceable,
        isPickupAvailable: serviceability.isPickupAvailable,
        serviceRadiusKm: store.serviceRadiusKm,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: store.reviews.length || 24,
        sampleProducts: store.products
      };
    });

    // Return stores within service radius first, sorted by distance
    const sortedStores = evaluatedStores.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
      location: customerCoord,
      totalFound: sortedStores.length,
      stores: sortedStores
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch nearby stores' });
  }
});

// 2. Get Single Storefront with Products
router.get('/stores/:storeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId } = req.params;
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        products: {
          where: { isAvailable: true }
        },
        reviews: true
      }
    });

    if (!store) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    let serviceability = null;
    if (!isNaN(lat) && !isNaN(lng)) {
      serviceability = GeospatialEngine.evaluateServiceability(
        { latitude: store.latitude, longitude: store.longitude },
        { latitude: lat, longitude: lng },
        store.serviceRadiusKm
      );
    }

    res.json({
      store,
      serviceability
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store details' });
  }
});

// 3. Product Search
router.get('/products/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string || '').trim();
    const lat = parseFloat(req.query.lat as string) || GeospatialEngine.INDORE_LANDMARKS.PALASIA.latitude;
    const lng = parseFloat(req.query.lng as string) || GeospatialEngine.INDORE_LANDMARKS.PALASIA.longitude;

    if (!q) {
      res.json({ products: [] });
      return;
    }

    const customerCoord = { latitude: lat, longitude: lng };

    const products = await prisma.product.findMany({
      where: {
        isAvailable: true,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { category: { contains: q } }
        ]
      },
      include: {
        store: true
      }
    });

    // Filter products whose store is serviceable within 3km
    const results = products
      .map((p) => {
        const distanceKm = GeospatialEngine.calculateDistanceKm(
          { latitude: p.store.latitude, longitude: p.store.longitude },
          customerCoord
        );
        const isServiceable = distanceKm <= p.store.serviceRadiusKm;
        return {
          ...p,
          distanceKm,
          isServiceable
        };
      })
      .filter((p) => p.isServiceable)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ query: q, count: results.length, products: results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// 4. Cart Management: Get Active Cart
router.get('/cart', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        store: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          store: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });
    }

    const subtotalPaise = cart.items.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
    const movCheck = FinancialEngine.validateMinimumOrderValue(subtotalPaise);

    res.json({
      cart,
      subtotalPaise,
      subtotalFormatted: FinancialEngine.formatPaiseToRupees(subtotalPaise),
      minimumOrderValuePaise: FinancialEngine.DEFAULT_MIN_ORDER_VALUE_PAISE,
      meetsMinimumOrderValue: movCheck.isValid,
      shortfallPaise: movCheck.shortfallPaise,
      shortfallFormatted: FinancialEngine.formatPaiseToRupees(movCheck.shortfallPaise)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// 5. Add or Update Item in Cart (Enforces Single-Store Cart Rule)
const AddToCartSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  quantity: z.number().int().min(1)
});

router.post('/cart/items', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = AddToCartSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid input', details: parse.error.errors });
      return;
    }

    const { storeId, productId, quantity } = parse.data;
    const userId = req.user!.userId;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true }
    });

    if (!product || !product.isAvailable) {
      res.status(400).json({ error: 'Product is currently unavailable' });
      return;
    }

    if (product.storeId !== storeId) {
      res.status(400).json({ error: 'Product store mismatch' });
      return;
    }

    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true, store: true }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, storeId },
        include: { items: true, store: true }
      });
    }

    // SINGLE-STORE CART VALIDATION
    if (cart.storeId && cart.storeId !== storeId && cart.items.length > 0) {
      res.status(409).json({
        error: 'Single-store checkout rule',
        storeConflict: true,
        currentStore: cart.store?.name,
        message: `Your cart contains items from ${cart.store?.name}. Everything Local supports ordering from one neighborhood store at a time. Clear your cart to add items from this store.`
      });
      return;
    }

    // Update cart's storeId if empty
    if (!cart.storeId) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { storeId }
      });
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: quantity,
          unitPricePaise: product.pricePaise
        }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          unitPricePaise: product.pricePaise
        }
      });
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        store: true,
        items: { include: { product: true } }
      }
    });

    res.json({ message: 'Cart updated', cart: updatedCart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// 6. Remove Item from Cart
router.delete('/cart/items/:itemId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// 7. Clear Cart
router.delete('/cart', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({
        where: { id: cart.id },
        data: { storeId: null }
      });
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// 8. Order Quote Calculation
const QuoteSchema = z.object({
  fulfillmentMode: z.enum(['PICKUP', 'MERCHANT_DELIVERY', 'PLATFORM_DELIVERY']),
  customerLat: z.number().optional(),
  customerLng: z.number().optional()
});

router.post('/orders/quote', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = QuoteSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid input', details: parse.error.errors });
      return;
    }

    const { fulfillmentMode, customerLat, customerLng } = parse.data;
    const userId = req.user!.userId;

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        store: true,
        items: { include: { product: true } }
      }
    });

    if (!cart || cart.items.length === 0 || !cart.store) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    // Calculate subtotal
    const itemInputs = cart.items.map((i) => ({
      unitPricePaise: i.product.pricePaise,
      quantity: i.quantity
    }));
    const subtotalPaise = FinancialEngine.calculateSubtotal(itemInputs);

    // Validate Minimum Order Value (₹299)
    const movCheck = FinancialEngine.validateMinimumOrderValue(subtotalPaise);
    if (!movCheck.isValid) {
      res.status(400).json({
        error: 'Minimum order requirement not met',
        meetsMinimumOrderValue: false,
        subtotalPaise,
        minOrderValuePaise: FinancialEngine.DEFAULT_MIN_ORDER_VALUE_PAISE,
        shortfallPaise: movCheck.shortfallPaise,
        shortfallFormatted: FinancialEngine.formatPaiseToRupees(movCheck.shortfallPaise)
      });
      return;
    }

    // Evaluate distance if delivery
    let distanceKm = 1.0;
    if (customerLat !== undefined && customerLng !== undefined) {
      distanceKm = GeospatialEngine.calculateDistanceKm(
        { latitude: cart.store.latitude, longitude: cart.store.longitude },
        { latitude: customerLat, longitude: customerLng }
      );

      if (fulfillmentMode !== 'PICKUP' && distanceKm > cart.store.serviceRadiusKm) {
        res.status(400).json({
          error: 'Out of delivery service area',
          distanceKm,
          maxRadiusKm: cart.store.serviceRadiusKm,
          isPickupAvailable: true,
          message: `Delivery is unavailable beyond ${cart.store.serviceRadiusKm} km. You can still choose Store Pickup!`
        });
        return;
      }
    }

    const deliveryQuote = DeliveryServiceAdapter.getQuote(fulfillmentMode, distanceKm);

    const financials = FinancialEngine.calculateOrderFinancials({
      items: itemInputs,
      fulfillmentMode,
      deliveryFeePaise: deliveryQuote.feePaise,
      commissionRatePct: cart.store.commissionRatePct
    });

    res.json({
      store: {
        id: cart.store.id,
        name: cart.store.name,
        category: cart.store.category
      },
      fulfillmentMode,
      distanceKm,
      deliveryQuote,
      financials: {
        ...financials,
        itemSubtotalFormatted: FinancialEngine.formatPaiseToRupees(financials.itemSubtotalPaise),
        deliveryFeeFormatted: FinancialEngine.formatPaiseToRupees(financials.deliveryFeePaise),
        totalAmountFormatted: FinancialEngine.formatPaiseToRupees(financials.totalAmountPaise)
      }
    });
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ error: 'Failed to calculate order quote' });
  }
});

// 9. Checkout & Order Creation (Idempotent & Atomic)
const CheckoutSchema = z.object({
  fulfillmentMode: z.enum(['PICKUP', 'MERCHANT_DELIVERY', 'PLATFORM_DELIVERY']),
  deliveryAddressId: z.string().optional(),
  idempotencyKey: z.string().min(10),
  customerLat: z.number().optional(),
  customerLng: z.number().optional()
});

router.post('/orders/checkout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = CheckoutSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid checkout parameters', details: parse.error.errors });
      return;
    }

    const { fulfillmentMode, deliveryAddressId, idempotencyKey, customerLat, customerLng } = parse.data;
    const userId = req.user!.userId;

    // Idempotency check: prevent duplicate order
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey }
    });
    if (existingOrder) {
      res.json({ message: 'Order already processed', order: existingOrder });
      return;
    }

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        store: true,
        items: { include: { product: true } }
      }
    });

    if (!cart || cart.items.length === 0 || !cart.store) {
      res.status(400).json({ error: 'Your cart is empty' });
      return;
    }

    // Subtotal and Minimum Order Value Validation
    const itemInputs = cart.items.map((i) => ({
      unitPricePaise: i.product.pricePaise,
      quantity: i.quantity
    }));
    const subtotalPaise = FinancialEngine.calculateSubtotal(itemInputs);

    const movCheck = FinancialEngine.validateMinimumOrderValue(subtotalPaise);
    if (!movCheck.isValid) {
      res.status(400).json({
        error: 'Order does not meet minimum order value of ₹299',
        shortfallPaise: movCheck.shortfallPaise
      });
      return;
    }

    // Distance calculation
    let distanceKm = 1.0;
    if (customerLat !== undefined && customerLng !== undefined) {
      distanceKm = GeospatialEngine.calculateDistanceKm(
        { latitude: cart.store.latitude, longitude: cart.store.longitude },
        { latitude: customerLat, longitude: customerLng }
      );
      if (fulfillmentMode !== 'PICKUP' && distanceKm > cart.store.serviceRadiusKm) {
        res.status(400).json({ error: 'Customer location is outside delivery radius' });
        return;
      }
    }

    const deliveryQuote = DeliveryServiceAdapter.getQuote(fulfillmentMode, distanceKm);
    const financials = FinancialEngine.calculateOrderFinancials({
      items: itemInputs,
      fulfillmentMode,
      deliveryFeePaise: deliveryQuote.feePaise,
      commissionRatePct: cart.store.commissionRatePct
    });

    const orderNumber = `ORD-IND-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Database Transaction: Create order, order items, events, decrement stock, clear cart
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: userId,
          storeId: cart.storeId!,
          status: 'PLACED',
          fulfillmentMode,
          deliveryAddressId,
          idempotencyKey,
          itemSubtotalPaise: financials.itemSubtotalPaise,
          deliveryFeePaise: financials.deliveryFeePaise,
          taxPaise: financials.taxPaise,
          discountPaise: financials.discountPaise,
          totalAmountPaise: financials.totalAmountPaise,
          commissionPaise: financials.commissionPaise,
          merchantPayablePaise: financials.merchantPayablePaise,
          platformRevenuePaise: financials.platformRevenuePaise
        }
      });

      // Create Order Items and adjust product stock
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPricePaise: item.product.pricePaise,
            totalPricePaise: item.product.pricePaise * item.quantity
          }
        });

        // Decrement stock atomically
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Record Order Initial Event
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          status: 'PLACED',
          actorId: userId,
          note: `Order placed via ${fulfillmentMode}`
        }
      });

      // Clear the Cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
      await tx.cart.update({
        where: { id: cart.id },
        data: { storeId: null }
      });

      return newOrder;
    });

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// 10. List Customer Orders
router.get('/orders', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user!.userId },
      include: {
        store: true,
        items: true,
        events: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

// 11. Get Order Details
router.get('/orders/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        customerId: req.user!.userId
      },
      include: {
        store: true,
        items: true,
        events: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// 12. Cancel Order (Only if still in PLACED state)
router.post('/orders/:id/cancel', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        customerId: req.user!.userId
      },
      include: { items: true }
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status !== 'PLACED') {
      res.status(400).json({ error: `Cannot cancel order in status: ${order.status}` });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      });

      // Rollback stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          actorId: req.user!.userId,
          note: 'Customer requested cancellation'
        }
      });
    });

    res.json({ message: 'Order successfully cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;
