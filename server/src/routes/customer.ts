import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';
import { GeospatialEngine } from '../core/geospatial';
import { FinancialEngine } from '../core/finance';
import { DeliveryServiceAdapter } from '../core/deliveryAdapter';
import { DeliveryPriorityEngine } from '../core/deliveryPriorityEngine';
import { MultiStoreOrderEngine } from '../core/multiStoreOrderEngine';

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
            product: {
              include: {
                store: true
              }
            }
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
              product: {
                include: {
                  store: true
                }
              }
            }
          }
        }
      });
    }

    const subtotalPaise = cart.items.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
    const movCheck = FinancialEngine.validateMinimumOrderValue(subtotalPaise);

    // Multi-store merchant breakdown
    const merchantGroups: Record<string, { merchantId: string; merchantName: string; subtotalPaise: number; itemCount: number }> = {};
    for (const item of cart.items) {
      const mId = item.product.storeId;
      const mName = item.product.store?.name || 'Local Store';
      if (!merchantGroups[mId]) {
        merchantGroups[mId] = { merchantId: mId, merchantName: mName, subtotalPaise: 0, itemCount: 0 };
      }
      merchantGroups[mId].itemCount += item.quantity;
      merchantGroups[mId].subtotalPaise += item.unitPricePaise * item.quantity;
    }

    res.json({
      cart,
      subtotalPaise,
      subtotalFormatted: FinancialEngine.formatPaiseToRupees(subtotalPaise),
      minimumOrderValuePaise: FinancialEngine.DEFAULT_MIN_ORDER_VALUE_PAISE,
      meetsMinimumOrderValue: movCheck.isValid,
      shortfallPaise: movCheck.shortfallPaise,
      shortfallFormatted: FinancialEngine.formatPaiseToRupees(movCheck.shortfallPaise),
      distinctMerchantCount: Object.keys(merchantGroups).length,
      merchantBreakdowns: Object.values(merchantGroups)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// 5. Add or Update Item in Cart (Enforces Single-Store Cart Rule & Stock Limits)
const AddToCartSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  quantity: z.number().int().min(0)
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

    // Stock availability validation
    if (quantity > 0 && product.stock > 0 && quantity > product.stock) {
      res.status(400).json({
        error: `Only ${product.stock} unit(s) available in stock.`,
        availableStock: product.stock
      });
      return;
    }

    if (product.storeId !== storeId) {
      res.status(400).json({ error: 'Product store mismatch' });
      return;
    }

    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true
              }
            }
          }
        },
        store: true
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, storeId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  store: true
                }
              }
            }
          },
          store: true
        }
      });
    }

    // MULTI-STORE CART: Customers can freely add products from Store A, Store B, Store C...
    // No single-store restriction is enforced. Each CartItem retains its product and merchant reference.
    if (!cart.storeId && quantity > 0) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { storeId }
      });
      cart.storeId = storeId;
    }

    // Upsert or remove cart item
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    });

    if (quantity === 0) {
      // Remove item if quantity becomes zero
      if (existingItem) {
        await prisma.cartItem.delete({
          where: { id: existingItem.id }
        });
      }
      const remainingCount = await prisma.cartItem.count({
        where: { cartId: cart.id }
      });
      if (remainingCount === 0) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { storeId: null }
        });
      }
    } else if (existingItem) {
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

    // Return updated cart with full product and store metadata
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: {
                store: true
              }
            }
          }
        }
      }
    });

    res.json({ message: 'Cart updated', cart: updatedCart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// 5b. Validate Multi-Merchant Stock (Checks each store independently without removing other items)
router.post('/cart/validate', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true
              }
            }
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      res.json({ isValid: true, items: [], unavailableCount: 0, availableSubtotalPaise: 0 });
      return;
    }

    const itemStatusList = [];
    let availableSubtotalPaise = 0;
    let unavailableCount = 0;

    for (const item of cart.items) {
      const prod = item.product;
      const isAvailable = prod.isAvailable && (prod.stock === null || prod.stock === undefined || prod.stock >= item.quantity);

      if (!isAvailable) {
        unavailableCount++;
        itemStatusList.push({
          cartItemId: item.id,
          productId: prod.id,
          productName: prod.name,
          storeId: prod.storeId,
          storeName: prod.store?.name || 'Local Store',
          requestedQuantity: item.quantity,
          availableStock: prod.stock ?? 0,
          unitPricePaise: item.unitPricePaise,
          isAvailable: false,
          reason: !prod.isAvailable ? 'Item currently not available' : `Only ${prod.stock} unit(s) available in stock`
        });
      } else {
        availableSubtotalPaise += item.unitPricePaise * item.quantity;
        itemStatusList.push({
          cartItemId: item.id,
          productId: prod.id,
          productName: prod.name,
          storeId: prod.storeId,
          storeName: prod.store?.name || 'Local Store',
          requestedQuantity: item.quantity,
          availableStock: prod.stock ?? 999,
          unitPricePaise: item.unitPricePaise,
          isAvailable: true
        });
      }
    }

    res.json({
      isValid: unavailableCount === 0,
      unavailableCount,
      items: itemStatusList,
      availableSubtotalPaise,
      availableSubtotalFormatted: FinancialEngine.formatPaiseToRupees(availableSubtotalPaise)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate cart stock' });
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
        items: {
          include: {
            product: {
              include: {
                store: true
              }
            }
          }
        }
      }
    });

    const primaryStore = cart?.store || cart?.items[0]?.product?.store;

    if (!cart || cart.items.length === 0 || !primaryStore) {
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
        { latitude: primaryStore.latitude, longitude: primaryStore.longitude },
        { latitude: customerLat, longitude: customerLng }
      );

      if (fulfillmentMode !== 'PICKUP' && distanceKm > primaryStore.serviceRadiusKm) {
        res.status(400).json({
          error: 'Out of delivery service area',
          distanceKm,
          maxRadiusKm: primaryStore.serviceRadiusKm,
          isPickupAvailable: true,
          message: `Delivery is unavailable beyond ${primaryStore.serviceRadiusKm} km. You can still choose Store Pickup!`
        });
        return;
      }
    }

    const deliveryQuote = DeliveryServiceAdapter.getQuote(fulfillmentMode, distanceKm);

    const financials = FinancialEngine.calculateOrderFinancials({
      items: itemInputs,
      fulfillmentMode,
      deliveryFeePaise: deliveryQuote.feePaise,
      commissionRatePct: primaryStore.commissionRatePct
    });

    res.json({
      store: {
        id: primaryStore.id,
        name: primaryStore.name,
        category: primaryStore.category
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
        items: {
          include: {
            product: {
              include: {
                store: true
              }
            }
          }
        }
      }
    });

    const primaryStore = cart?.store || cart?.items[0]?.product?.store;

    if (!cart || cart.items.length === 0 || !primaryStore) {
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
        { latitude: primaryStore.latitude, longitude: primaryStore.longitude },
        { latitude: customerLat, longitude: customerLng }
      );
      if (fulfillmentMode !== 'PICKUP' && distanceKm > primaryStore.serviceRadiusKm) {
        res.status(400).json({ error: 'Customer location is outside delivery radius' });
        return;
      }
    }

    const deliveryQuote = DeliveryServiceAdapter.getQuote(fulfillmentMode, distanceKm);
    const financials = FinancialEngine.calculateOrderFinancials({
      items: itemInputs,
      fulfillmentMode,
      deliveryFeePaise: deliveryQuote.feePaise,
      commissionRatePct: primaryStore.commissionRatePct
    });

    const orderNumber = `ORD-IND-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Database Transaction: Create order, order items, events, decrement stock, clear cart
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: userId,
          storeId: cart.storeId || primaryStore.id,
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

// 19. List Customer Parent Multi-Store Orders
router.get('/orders/multi-store', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parentOrders = await prisma.parentOrder.findMany({
      where: { customerId: userId },
      include: {
        childOrders: {
          include: {
            store: true,
            items: true
          }
        },
        deliveryTasks: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders: parentOrders, parentOrders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 20. Get Single Parent Multi-Store Order
router.get('/orders/multi-store/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parentOrder = await prisma.parentOrder.findFirst({
      where: { id: req.params.id, customerId: userId },
      include: {
        childOrders: {
          include: {
            store: true,
            items: true
          }
        },
        deliveryTasks: true
      }
    });

    if (!parentOrder) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order: parentOrder });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

// 13. List Customer Saved Addresses
router.get('/addresses', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const addresses = await prisma.customerAddress.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
    res.json({ addresses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved addresses' });
  }
});

// 14. Create Saved Customer Address
const createAddressSchema = z.object({
  label: z.string().default('Home'),
  addressLine: z.string().min(3),
  landmark: z.string().optional(),
  city: z.string().default('Indore'),
  pincode: z.string().min(6).max(6),
  latitude: z.number(),
  longitude: z.number(),
  isDefault: z.boolean().optional().default(false)
});

router.post('/addresses', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createAddressSchema.parse(req.body);

    if (parsed.isDefault) {
      // Unset previous defaults
      await prisma.customerAddress.updateMany({
        where: { userId: req.user!.userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        userId: req.user!.userId,
        label: parsed.label,
        addressLine: parsed.addressLine,
        landmark: parsed.landmark,
        city: parsed.city,
        pincode: parsed.pincode,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        isDefault: parsed.isDefault
      }
    });

    res.status(201).json({ address });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid address data' });
  }
});

// 15. Set Address as Default
router.put('/addresses/:id/default', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const exists = await prisma.customerAddress.findFirst({
      where: { id, userId }
    });

    if (!exists) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    await prisma.$transaction([
      prisma.customerAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      }),
      prisma.customerAddress.update({
        where: { id },
        data: { isDefault: true }
      })
    ]);

    res.json({ message: 'Default address updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

// 16. Delete Saved Address
router.delete('/addresses/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const exists = await prisma.customerAddress.findFirst({
      where: { id, userId }
    });

    if (!exists) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    await prisma.customerAddress.delete({
      where: { id }
    });

    res.json({ message: 'Address removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// ============================================================
// EVERYTHING LOCAL VERSION 1.0 MULTI-STORE & DELIVERY PRIORITY
// ============================================================

// 17. Calculate 4-Tier Delivery Priority & Dynamic Pricing Quote
router.post('/delivery/quote', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantIds = req.body.merchantIds || req.body.storeIds || [];
    if (!Array.isArray(merchantIds) || merchantIds.length === 0) {
      res.status(400).json({ error: 'Merchant IDs array is required' });
      return;
    }

    const customerCoordinates = req.body.customerCoordinates || (
      req.body.customerLat && req.body.customerLng
        ? { latitude: Number(req.body.customerLat), longitude: Number(req.body.customerLng) }
        : {
            latitude: GeospatialEngine.INDORE_LANDMARKS.PALASIA.latitude,
            longitude: GeospatialEngine.INDORE_LANDMARKS.PALASIA.longitude
          }
    );

    const quotes = await DeliveryPriorityEngine.calculateAllTiers({
      customerCoordinates,
      merchantIds,
      totalWeightKg: req.body.totalWeightKg ? Number(req.body.totalWeightKg) : 2.0
    });

    const mappedQuotes = quotes.map((q) => ({
      ...q,
      tier: q.tierCode,
      feasible: q.isServiceable,
      unfeasibleReason: q.unserviceableReason,
      pricing: {
        ...q.pricing,
        extraPickupStopPaise: q.pricing.additionalPickupChargePaise || 0
      }
    }));

    res.json({ quotes: mappedQuotes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 18. Multi-Store Unified Cart Checkout
router.post('/orders/multi-store', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      customerLat,
      customerLng,
      deliveryTier,
      deliveryPriorityTier,
      paymentMethod,
      items
    } = req.body;

    let orderItems = items;
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      const cart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: { include: { product: true } } }
      });
      if (cart && cart.items.length > 0) {
        orderItems = cart.items.map((i) => ({
          productId: i.productId,
          merchantId: i.product.storeId,
          quantity: i.quantity,
          unitPricePaise: i.unitPricePaise
        }));
      }
    }

    if (!orderItems || orderItems.length === 0) {
      res.status(400).json({ error: 'Cannot place order with empty items' });
      return;
    }

    const orderResult = await MultiStoreOrderEngine.checkout({
      customerId: userId,
      deliveryAddress: deliveryAddress || 'Selected Address, Indore',
      deliveryLatitude: deliveryLatitude || customerLat || GeospatialEngine.INDORE_LANDMARKS.PALASIA.latitude,
      deliveryLongitude: deliveryLongitude || customerLng || GeospatialEngine.INDORE_LANDMARKS.PALASIA.longitude,
      deliveryTier: deliveryTier || deliveryPriorityTier || 'STANDARD_60',
      paymentMethod: paymentMethod || 'ONLINE',
      items: orderItems
    });

    // Clear active cart upon successful multi-store checkout
    const userCart = await prisma.cart.findFirst({ where: { userId } });
    if (userCart) {
      await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
      await prisma.cart.update({ where: { id: userCart.id }, data: { storeId: null } });
    }

    res.status(201).json({
      success: true,
      message: 'Multi-store order successfully created',
      order: orderResult.parentOrder,
      parentOrder: orderResult.parentOrder,
      merchantChildOrders: orderResult.childOrders,
      childOrders: orderResult.childOrders
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
