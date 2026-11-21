import { describe, it, expect } from 'vitest';
import { DeliveryServiceAdapter } from '../server/src/core/deliveryAdapter';

describe('Delivery Service Adapter', () => {
  it('returns ₹0 fee for customer pickup quote', () => {
    const quote = DeliveryServiceAdapter.getQuote('PICKUP', 2.0);
    expect(quote.feePaise).toBe(0);
    expect(quote.provider).toBe('SELF_PICKUP');
    expect(quote.isAvailable).toBe(true);
  });

  it('calculates merchant delivery fee accurately', () => {
    const quote = DeliveryServiceAdapter.getQuote('MERCHANT_DELIVERY', 2.5, 3000);
    expect(quote.feePaise).toBe(3000); // ₹30.00
    expect(quote.provider).toBe('MERCHANT_FLEET');
  });

  it('calculates third-party platform delivery with distance progression', () => {
    const quote1km = DeliveryServiceAdapter.getQuote('PLATFORM_DELIVERY', 1.0);
    expect(quote1km.feePaise).toBe(3000); // Base ₹30

    const quote2km = DeliveryServiceAdapter.getQuote('PLATFORM_DELIVERY', 2.0);
    expect(quote2km.feePaise).toBe(4000); // Base ₹30 + ₹10 for +1km
  });

  it('provides safe manual fallback when third-party provider API keys are absent', async () => {
    const result = await DeliveryServiceAdapter.dispatchOrder('ORD-12345', 'PLATFORM_DELIVERY', {
      storeAddress: 'Palasia, Indore',
      storeCoord: { latitude: 22.7244, longitude: 75.8839 },
      customerAddress: 'Vijay Nagar, Indore',
      customerCoord: { latitude: 22.7533, longitude: 75.8937 },
      distanceKm: 3.5
    });

    expect(result.success).toBe(true);
    expect(result.dispatchStatus).toBe('MANUAL_PENDING');
  });
});
