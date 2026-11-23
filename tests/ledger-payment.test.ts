import { describe, it, expect, beforeEach } from 'vitest';
import { DoubleEntryLedgerEngine, LedgerAccount } from '../server/src/core/doubleEntryLedger';
import { PaymentLifecycleEngine, WebhookPayload } from '../server/src/core/paymentLifecycleEngine';
import { FinancialEngine } from '../server/src/core/finance';
import crypto from 'crypto';

describe('Sprint 4 & 5: Double-Entry Financial Ledger, Payments & Item-Level Refunds', () => {
  beforeEach(() => {
    PaymentLifecycleEngine.resetEventDeduplicationCache();
  });

  describe('1. Balanced Double-Entry Financial Ledger', () => {
    it('strictly enforces debit === credit invariant and throws on imbalance', () => {
      const unbalancedLines = [
        {
          account: LedgerAccount.ASSET_GATEWAY_RECEIVABLE,
          debitPaise: 50000,
          creditPaise: 0,
          description: 'Payment collected'
        },
        {
          account: LedgerAccount.LIABILITY_MERCHANT_PAYABLE,
          debitPaise: 0,
          creditPaise: 45000, // Imbalance of 5000 paise (₹50.00)
          description: 'Merchant payable'
        }
      ];

      expect(() => DoubleEntryLedgerEngine.validateBalance(unbalancedLines)).toThrow(
        /Ledger Imbalance Detected/
      );
    });

    it('generates a balanced order payment transaction matching exact single paise', () => {
      const merchantPayableMap = new Map<string, number>();
      merchantPayableMap.set('store-1', 19000); // ₹190
      merchantPayableMap.set('store-2', 28500); // ₹285

      const tx = DoubleEntryLedgerEngine.recordOrderPayment({
        orderId: 'ORD-TEST-001',
        orderNumber: 'EL-ORD-1001',
        totalPaidPaise: 54000, // ₹540 total (475 items + 25 comm + 40 deliv)
        merchantPayableMap,
        platformCommissionPaise: 2500, // ₹25
        deliveryFeePaise: 4000, // ₹40
        taxPaise: 0
      });

      expect(tx.lines.length).toBe(5);
      const totalDebits = tx.lines.reduce((s, l) => s + l.debitPaise, 0);
      const totalCredits = tx.lines.reduce((s, l) => s + l.creditPaise, 0);

      expect(totalDebits).toBe(54000);
      expect(totalCredits).toBe(54000);
      expect(totalDebits).toBe(totalCredits);
    });

    it('generates a balanced refund transaction with fault-based debit allocation', () => {
      const tx = DoubleEntryLedgerEngine.recordRefund({
        orderId: 'ORD-TEST-001',
        childOrderId: 'CHILD-001',
        refundReference: 'REF-1001',
        customerRefundPaise: 20000, // ₹200
        merchantDebitPaise: 19000,  // ₹190
        platformCommissionDebitPaise: 1000, // ₹10
        taxRefundPaise: 0,
        storeId: 'store-1',
        isMerchantFault: true
      });

      const totalDebits = tx.lines.reduce((s, l) => s + l.debitPaise, 0);
      const totalCredits = tx.lines.reduce((s, l) => s + l.creditPaise, 0);

      expect(totalDebits).toBe(20000);
      expect(totalCredits).toBe(20000);
    });
  });

  describe('2. Payment Lifecycle & Webhook Deduplication', () => {
    const webhookSecret = 'test_webhook_signing_secret_key_2026';

    it('validates genuine HMAC-SHA256 signature and rejects forged payloads', () => {
      const rawPayload = JSON.stringify({ orderId: 'ORD-1', amount: 5000 });
      const validSig = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');

      expect(PaymentLifecycleEngine.verifyWebhookSignature(rawPayload, validSig, webhookSecret)).toBe(true);
      expect(PaymentLifecycleEngine.verifyWebhookSignature(rawPayload, 'invalid_sig', webhookSecret)).toBe(false);
    });

    it('processes first webhook event and marks duplicate arrivals idempotently', () => {
      const raw = JSON.stringify({ eventId: 'evt_123', order: 'ORD-1' });
      const sig = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');

      const payload: WebhookPayload = {
        eventId: 'evt_12345',
        eventType: 'payment.captured',
        paymentId: 'pay_987',
        orderNumber: 'EL-ORD-987',
        amountPaise: 50000,
        status: 'CAPTURED',
        signature: sig,
        rawPayload: raw
      };

      const firstResult = PaymentLifecycleEngine.processWebhookEvent(payload, webhookSecret);
      expect(firstResult.success).toBe(true);
      expect(firstResult.isDuplicate).toBe(false);
      expect(firstResult.status).toBe('CAPTURED');

      // Duplicate webhook delivery
      const secondResult = PaymentLifecycleEngine.processWebhookEvent(payload, webhookSecret);
      expect(secondResult.success).toBe(true);
      expect(secondResult.isDuplicate).toBe(true);
      expect(secondResult.message).toContain('already been processed idempotently');
    });
  });

  describe('3. Item-Level Refunds and isMerchantFault Treatment', () => {
    it('accurately allocates debit to merchant when cancellation is merchant fault', () => {
      const refund = FinancialEngine.calculateItemRefund({
        itemUnitPricePaise: 10000, // ₹100
        quantity: 2,               // ₹200 subtotal
        commissionRatePct: 5.0,    // 5% commission = ₹10
        taxRatePct: 5.0,           // 5% tax = ₹10
        deliveryFeeRefundPaise: 3000, // ₹30 delivery
        isMerchantFault: true,
        reason: 'Merchant out of stock / rejected order'
      });

      expect(refund.customerRefundPaise).toBe(24000); // 200 items + 10 tax + 30 delivery = ₹240
      expect(refund.merchantDebitPaise).toBe(22000);  // 190 items net + 30 delivery = ₹220
      expect(refund.platformCommissionDebitPaise).toBe(1000); // ₹10 commission reversed
      expect(refund.isMerchantFault).toBe(true);
    });

    it('does not debit delivery fee to merchant when customer cancels without merchant fault', () => {
      const refund = FinancialEngine.calculateItemRefund({
        itemUnitPricePaise: 10000,
        quantity: 1,
        commissionRatePct: 5.0,
        taxRatePct: 5.0,
        deliveryFeeRefundPaise: 0, // Delivery fee retained
        isMerchantFault: false,
        reason: 'Customer changed mind'
      });

      expect(refund.customerRefundPaise).toBe(10500); // ₹100 + ₹5 tax
      expect(refund.merchantDebitPaise).toBe(9500);   // Merchant only debited net product value
      expect(refund.platformCommissionDebitPaise).toBe(500);
      expect(refund.isMerchantFault).toBe(false);
    });
  });
});
