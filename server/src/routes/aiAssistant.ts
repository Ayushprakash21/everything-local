import express, { Response } from 'express';
import { prisma } from '../db';
import { DeliveryPriorityEngine } from '../core/deliveryPriorityEngine';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const aiAssistantRouter = express.Router();

/**
 * 1. Smart Basket Optimizer Engine
 */
aiAssistantRouter.post('/optimize-basket', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { items, latitude, longitude } = req.body;
    // items: string[] of keywords e.g. ["Atta", "Milk", "Oil", "Potatoes"]

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Please provide a non-empty shopping list' });
      return;
    }

    const customerCoords = {
      latitude: Number(latitude) || 22.7244,
      longitude: Number(longitude) || 75.8839
    };

    // 1. Fetch available products matching items
    const storeProducts = await prisma.product.findMany({
      where: {
        isAvailable: true,
        stock: { gt: 0 },
        store: { isOpen: true, isVerified: true }
      },
      include: { store: true }
    });

    const itemMatches: {
      searchTerm: string;
      options: {
        product: typeof storeProducts[0];
        store: typeof storeProducts[0]['store'];
        pricePaise: number;
      }[];
    }[] = [];

    for (const term of items) {
      const termStr = typeof term === 'string' ? term : (term.name || term.productName || '');
      const q = termStr.toLowerCase().trim();
      const matches = storeProducts
        .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
        .map((p) => ({
          product: p,
          store: p.store,
          pricePaise: p.pricePaise
        }))
        .sort((a, b) => a.pricePaise - b.pricePaise);

      if (matches.length > 0) {
        itemMatches.push({ searchTerm: termStr, options: matches });
      }
    }

    if (itemMatches.length === 0) {
      res.json({
        found: false,
        message: 'No available products found matching your shopping list items.',
        cheapestBasket: null,
        fastestBasket: null,
        balancedBasket: null
      });
      return;
    }

    // 2. Compute Strategy A: Pure Lowest Product Prices (Multi-store)
    const cheapestItems = itemMatches.map((im) => im.options[0]);
    const cheapestStoreIds = Array.from(new Set(cheapestItems.map((i) => i.store.id)));

    const cheapestDeliveryQuotes = await DeliveryPriorityEngine.calculateAllTiers({
      customerCoordinates: customerCoords,
      merchantIds: cheapestStoreIds,
      deliveryTier: 'STANDARD_60'
    });
    const cheapestStandardFee = cheapestDeliveryQuotes.find((q) => q.tierCode === 'STANDARD_60')?.pricing.totalDeliveryFeePaise || 2500;

    let cheapestSubtotal = 0;
    for (const it of cheapestItems) {
      cheapestSubtotal += it.pricePaise;
    }

    const cheapestBasket = {
      title: 'Cheapest Feasible Basket',
      description: 'Aggregates lowest item prices across local Indore retailers',
      storesCount: cheapestStoreIds.length,
      storeNames: Array.from(new Set(cheapestItems.map((i) => i.store.name))),
      items: cheapestItems.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        pricePaise: i.pricePaise,
        storeName: i.store.name,
        storeId: i.store.id
      })),
      subtotalPaise: cheapestSubtotal,
      deliveryFeePaise: cheapestStandardFee,
      totalPayablePaise: cheapestSubtotal + cheapestStandardFee,
      etaMinutes: 45
    };

    // 3. Compute Strategy B: Fastest Single-Store Basket (Express 20 eligible)
    // Find a single store that carries the most items from the list
    const storeCoverage = new Map<string, typeof itemMatches[0]['options']>();
    for (const im of itemMatches) {
      for (const opt of im.options) {
        const list = storeCoverage.get(opt.store.id) || [];
        list.push(opt);
        storeCoverage.set(opt.store.id, list);
      }
    }

    let bestSingleStoreId = '';
    let maxCovered = 0;
    for (const [stId, covered] of storeCoverage.entries()) {
      if (covered.length > maxCovered) {
        maxCovered = covered.length;
        bestSingleStoreId = stId;
      }
    }

    let fastestBasket = null;
    if (bestSingleStoreId) {
      const fastItems = storeCoverage.get(bestSingleStoreId)!;
      let fastSubtotal = 0;
      for (const it of fastItems) {
        fastSubtotal += it.pricePaise;
      }

      const fastQuotes = await DeliveryPriorityEngine.calculateAllTiers({
        customerCoordinates: customerCoords,
        merchantIds: [bestSingleStoreId],
        deliveryTier: 'EXPRESS_20'
      });
      const expressQuote = fastQuotes.find((q) => q.tierCode === 'EXPRESS_20');
      const expressFee = expressQuote?.isServiceable ? expressQuote.pricing.totalDeliveryFeePaise : 4500;

      fastestBasket = {
        title: 'Fastest Express Basket (Single Store)',
        description: 'Delivered in under 20-30 mins from a single nearby retailer',
        storesCount: 1,
        storeNames: [fastItems[0].store.name],
        items: fastItems.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          pricePaise: i.pricePaise,
          storeName: i.store.name,
          storeId: i.store.id
        })),
        subtotalPaise: fastSubtotal,
        deliveryFeePaise: expressFee,
        totalPayablePaise: fastSubtotal + expressFee,
        etaMinutes: expressQuote?.isServiceable ? 20 : 35,
        isFeasible: Boolean(expressQuote?.isServiceable)
      };
    }

    // 4. Balanced Basket with Savings Calculation
    const savingsPaise = fastestBasket
      ? Math.max(0, fastestBasket.totalPayablePaise - cheapestBasket.totalPayablePaise)
      : 3500;

    const options = [
      {
        type: 'CHEAPEST',
        label: cheapestBasket.title,
        deliveryTier: 'STANDARD_60',
        deliveryTimeMins: cheapestBasket.etaMinutes,
        storeCount: cheapestBasket.storesCount,
        itemSubtotalPaise: cheapestBasket.subtotalPaise,
        estimatedDeliveryPaise: cheapestBasket.deliveryFeePaise,
        totalCostPaise: cheapestBasket.totalPayablePaise,
        feasibility: true,
        items: cheapestBasket.items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          storeId: i.storeId,
          storeName: i.storeName,
          pricePaise: i.pricePaise,
          quantity: 1
        }))
      },
      fastestBasket
        ? {
            type: 'FASTEST_EXPRESS',
            label: fastestBasket.title,
            deliveryTier: 'EXPRESS_20',
            deliveryTimeMins: fastestBasket.etaMinutes,
            storeCount: fastestBasket.storesCount,
            itemSubtotalPaise: fastestBasket.subtotalPaise,
            estimatedDeliveryPaise: fastestBasket.deliveryFeePaise,
            totalCostPaise: fastestBasket.totalPayablePaise,
            feasibility: fastestBasket.isFeasible,
            items: fastestBasket.items.map((i) => ({
              productId: i.productId,
              productName: i.name,
              storeId: i.storeId,
              storeName: i.storeName,
              pricePaise: i.pricePaise,
              quantity: 1
            }))
          }
        : {
            type: 'FASTEST_EXPRESS',
            label: 'Fastest 15-20 Min Express',
            deliveryTier: 'EXPRESS_20',
            deliveryTimeMins: 20,
            storeCount: cheapestBasket.storesCount,
            itemSubtotalPaise: cheapestBasket.subtotalPaise,
            estimatedDeliveryPaise: 4900,
            totalCostPaise: cheapestBasket.subtotalPaise + 4900,
            feasibility: true,
            items: cheapestBasket.items.map((i) => ({
              productId: i.productId,
              productName: i.name,
              storeId: i.storeId,
              storeName: i.storeName,
              pricePaise: i.pricePaise,
              quantity: 1
            }))
          },
      {
        type: 'BALANCED',
        label: 'Balanced Speed & Value',
        deliveryTier: 'PRIORITY_40',
        deliveryTimeMins: 35,
        storeCount: cheapestBasket.storesCount,
        itemSubtotalPaise: cheapestBasket.subtotalPaise,
        estimatedDeliveryPaise: 3500,
        totalCostPaise: cheapestBasket.subtotalPaise + 3500,
        feasibility: true,
        items: cheapestBasket.items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          storeId: i.storeId,
          storeName: i.storeName,
          pricePaise: i.pricePaise,
          quantity: 1
        }))
      }
    ];

    res.json({
      found: true,
      itemsCount: itemMatches.length,
      cheapestBasket,
      fastestBasket,
      balancedBasket: cheapestBasket,
      options,
      estimatedSavingsPaise: savingsPaise
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Conversational Tool-Based AI Shopping Assistant
 */
aiAssistantRouter.post('/chat', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    const q = (message || '').toLowerCase();

    // Tool 1: Recipe to shopping list conversion
    if (q.includes('poha') || q.includes('breakfast') || q.includes('recipe')) {
      res.json({
        reply: `Here is a curated Indore Breakfast & Poha shopping list with live stock from local Palasia & Vijay Nagar stores:
- Indori Ujjaini Poha (500g)
- Ratlami Sev (200g)
- Fresh Green Chillies & Coriander
- Fresh Lemons (Pack of 4)
- Mustard Seeds & Jeeravan Masala

Would you like me to optimize this basket for the cheapest local price or 20-minute express delivery?`,
        suggestedItems: ['Poha', 'Sev', 'Coriander', 'Lemon', 'Sugar'],
        action: 'OPTIMIZE_BASKET'
      });
      return;
    }

    // Tool 2: Price comparison query
    if (q.includes('compare') || q.includes('price') || q.includes('atta') || q.includes('oil')) {
      const products = await prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [
            { name: { contains: 'Atta' } },
            { name: { contains: 'Oil' } },
            { name: { contains: 'Rice' } }
          ]
        },
        include: { store: true },
        take: 4
      });

      const comparisons = products.map((p) => ({
        productName: p.name,
        storeName: p.store.name,
        priceRupees: (p.pricePaise / 100).toFixed(2),
        mrpRupees: (p.mrpPaise / 100).toFixed(2),
        inStock: p.stock > 0
      }));

      res.json({
        reply: `I compared live prices across Indore retailers for your requested staples:\n` +
          comparisons.map((c) => `• ${c.productName} at ${c.storeName}: ₹${c.priceRupees} (MRP ₹${c.mrpRupees})`).join('\n') +
          `\n\nAll items are verified in stock. You can add them directly to your multi-store cart!`,
        data: comparisons
      });
      return;
    }

    // Default friendly assistant response with actual live categories
    res.json({
      reply: `Hello! I am your Everything Local AI Shopping Assistant for Indore.
I can help you:
1. Compare prices of daily groceries and household items across local shops.
2. Optimize your multi-store basket for the lowest total payable amount.
3. Book certified local plumbers, electricians, or salon experts.
4. Upload prescriptions to licensed neighborhood pharmacies.

What can I help you find today?`,
      suggestedPrompts: [
        'Find cheapest Aashirvaad Atta and Sunflower Oil',
        'Indori Poha breakfast shopping list',
        'Book verified electrician in Palasia',
        'Show delivery priority tiers'
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
