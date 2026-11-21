import { describe, it, expect } from 'vitest';
import { FinancialEngine } from '../server/src/core/finance';

describe('Financial Engine (Integer Paise Arithmetic)', () => {
  it('correctly calculates item subtotal in integer paise', () => {
    const items = [
      { unitPricePaise: 23500, quantity: 1 }, // ₹235.00
      { unitPricePaise: 5400, quantity: 2 }   // ₹108.00 (2 * 54)
    ];
    const subtotal = FinancialEngine.calculateSubtotal(items);
    expect(subtotal).toBe(34300); // ₹343.00
  });

  it('enforces ₹299 minimum order value (29,900 paise)', () => {
    // Under minimum
    const underMov = FinancialEngine.validateMinimumOrderValue(28000);
    expect(underMov.isValid).toBe(false);
    expect(underMov.shortfallPaise).toBe(1900); // ₹19.00 shortfall

    // Exactly minimum
    const exactMov = FinancialEngine.validateMinimumOrderValue(29900);
    expect(exactMov.isValid).toBe(true);
    expect(exactMov.shortfallPaise).toBe(0);

    // Over minimum
    const overMov = FinancialEngine.validateMinimumOrderValue(35000);
    expect(overMov.isValid).toBe(true);
    expect(overMov.shortfallPaise).toBe(0);
  });

  it('calculates pickup fulfillment with zero delivery charges', () => {
    const snapshot = FinancialEngine.calculateOrderFinancials({
      items: [{ unitPricePaise: 30000, quantity: 1 }], // ₹300.00
      fulfillmentMode: 'PICKUP',
      deliveryFeePaise: 2500, // Even if passed, pickup MUST override to 0
      commissionRatePct: 3.5
    });

    expect(snapshot.deliveryFeePaise).toBe(0);
    expect(snapshot.totalAmountPaise).toBe(30000);
    // Commission: 30000 * 0.035 = 1050 paise (₹10.50)
    expect(snapshot.commissionPaise).toBe(1050);
    // Merchant Payable: 30000 - 1050 = 28950 paise (₹289.50)
    expect(snapshot.merchantPayablePaise).toBe(28950);
    // Platform Revenue: 1050 paise
    expect(snapshot.platformRevenuePaise).toBe(1050);
  });

  it('calculates merchant-managed delivery correctly', () => {
    const snapshot = FinancialEngine.calculateOrderFinancials({
      items: [{ unitPricePaise: 40000, quantity: 1 }], // ₹400.00
      fulfillmentMode: 'MERCHANT_DELIVERY',
      deliveryFeePaise: 2500, // ₹25.00
      commissionRatePct: 3.5
    });

    expect(snapshot.deliveryFeePaise).toBe(2500);
    expect(snapshot.totalAmountPaise).toBe(42500); // ₹425.00
    // Commission only applies to subtotal (40000 * 0.035 = 1400)
    expect(snapshot.commissionPaise).toBe(1400);
    // Merchant receives subtotal - commission + delivery fee = (40000 - 1400) + 2500 = 41100
    expect(snapshot.merchantPayablePaise).toBe(41100);
    expect(snapshot.platformRevenuePaise).toBe(1400);
  });

  it('calculates third-party delivery without treating delivery fee as platform profit', () => {
    const snapshot = FinancialEngine.calculateOrderFinancials({
      items: [{ unitPricePaise: 50000, quantity: 1 }], // ₹500.00
      fulfillmentMode: 'PLATFORM_DELIVERY',
      deliveryFeePaise: 3500, // ₹35.00 pass-through
      commissionRatePct: 4.0
    });

    expect(snapshot.totalAmountPaise).toBe(53500);
    expect(snapshot.commissionPaise).toBe(2000); // 4% of 50000
    // Delivery fee is pass-through to logistics provider
    expect(snapshot.thirdPartyDeliveryPayoutPaise).toBe(3500);
    // Platform revenue is ONLY the commission
    expect(snapshot.platformRevenuePaise).toBe(2000);
  });

  it('calculates refund reversals accurately', () => {
    const snapshot = FinancialEngine.calculateOrderFinancials({
      items: [{ unitPricePaise: 30000, quantity: 1 }],
      fulfillmentMode: 'PICKUP',
      commissionRatePct: 3.5
    });

    const refund = FinancialEngine.calculateRefund(snapshot);
    expect(refund.customerRefundPaise).toBe(30000);
    expect(refund.merchantDebitPaise).toBe(28950);
    expect(refund.platformCommissionDebitPaise).toBe(1050);
  });
});
