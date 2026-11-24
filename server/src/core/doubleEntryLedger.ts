/**
 * EVERYTHING LOCAL - BALANCED DOUBLE-ENTRY FINANCIAL LEDGER
 * 
 * Strict accounting invariant: sum(Debits) === sum(Credits) for every transaction group.
 * All amounts handled in integer Indian paise (no floating point arithmetic).
 */

export enum LedgerAccount {
  // Assets
  ASSET_CUSTOMER_CLEARING = '1010_ASSET_CUSTOMER_CLEARING',
  ASSET_GATEWAY_RECEIVABLE = '1020_ASSET_GATEWAY_RECEIVABLE',
  ASSET_BANK_ACCOUNT = '1030_ASSET_BANK_ACCOUNT',

  // Liabilities
  LIABILITY_MERCHANT_PAYABLE = '2010_LIABILITY_MERCHANT_PAYABLE',
  LIABILITY_RIDER_PAYABLE = '2020_LIABILITY_RIDER_PAYABLE',
  LIABILITY_DELIVERY_PASS_THROUGH = '2030_LIABILITY_DELIVERY_PASS_THROUGH',
  LIABILITY_TAX_COLLECTED = '2040_LIABILITY_TAX_COLLECTED',
  LIABILITY_CUSTOMER_REFUND = '2050_LIABILITY_CUSTOMER_REFUND',

  // Revenues
  REVENUE_PLATFORM_COMMISSION = '3010_REVENUE_PLATFORM_COMMISSION',
  REVENUE_PLATFORM_FEES = '3020_REVENUE_PLATFORM_FEES',
  REVENUE_MERCHANT_ADVERTISING = '3030_REVENUE_MERCHANT_ADVERTISING',

  // Expenses & Deductions
  EXPENSE_GATEWAY_PROCESSING_FEES = '4010_EXPENSE_GATEWAY_PROCESSING_FEES',
  EXPENSE_PROMOTIONS_DISCOUNTS = '4020_EXPENSE_PROMOTIONS_DISCOUNTS',
  EXPENSE_OPERATIONAL_ADJUSTMENT = '4030_EXPENSE_OPERATIONAL_ADJUSTMENT'
}

export interface JournalEntryLine {
  account: LedgerAccount;
  debitPaise: number;
  creditPaise: number;
  description: string;
  storeId?: string;
  riderId?: string;
  orderId?: string;
  childOrderId?: string;
}

export interface JournalTransaction {
  transactionId: string;
  eventGroup: string;
  reference: string;
  idempotencyKey?: string;
  timestamp: Date;
  lines: JournalEntryLine[];
}

export class DoubleEntryLedgerEngine {
  /**
   * Validates that total debits strictly equal total credits.
   * Throws an error if the transaction does not balance.
   */
  public static validateBalance(lines: JournalEntryLine[]): {
    totalDebitPaise: number;
    totalCreditPaise: number;
    isBalanced: boolean;
  } {
    let totalDebitPaise = 0;
    let totalCreditPaise = 0;

    for (const line of lines) {
      if (line.debitPaise < 0 || line.creditPaise < 0) {
        throw new Error('Ledger entry lines must have non-negative debit and credit amounts.');
      }
      if (line.debitPaise > 0 && line.creditPaise > 0) {
        throw new Error('A single ledger line cannot have both a debit and a credit amount.');
      }
      totalDebitPaise += Math.round(line.debitPaise);
      totalCreditPaise += Math.round(line.creditPaise);
    }

    if (totalDebitPaise !== totalCreditPaise) {
      throw new Error(
        `Ledger Imbalance Detected: Total Debits (₹${(totalDebitPaise / 100).toFixed(2)}) ` +
        `do not match Total Credits (₹${(totalCreditPaise / 100).toFixed(2)}). Difference: ₹${(
          Math.abs(totalDebitPaise - totalCreditPaise) / 100
        ).toFixed(2)}`
      );
    }

    return {
      totalDebitPaise,
      totalCreditPaise,
      isBalanced: true
    };
  }

  /**
   * Constructs a balanced journal transaction for an Order Payment Confirmation.
   * 
   * Debits:
   *   - ASSET_GATEWAY_RECEIVABLE: Total customer paid amount (subtotal + delivery + tax - discount)
   * 
   * Credits:
   *   - LIABILITY_MERCHANT_PAYABLE: Total merchant payable (items - commission)
   *   - REVENUE_PLATFORM_COMMISSION: Platform earned commission
   *   - LIABILITY_DELIVERY_PASS_THROUGH: Delivery fee pass-through
   *   - LIABILITY_TAX_COLLECTED: Applicable GST
   */
  public static recordOrderPayment(params: {
    orderId: string;
    orderNumber: string;
    totalPaidPaise: number;
    merchantPayableMap: Map<string, number>; // storeId -> merchantPayablePaise
    platformCommissionPaise: number;
    deliveryFeePaise: number;
    taxPaise: number;
  }): JournalTransaction {
    const lines: JournalEntryLine[] = [];

    // 1. Debit Asset: Cash receivable from gateway
    lines.push({
      account: LedgerAccount.ASSET_GATEWAY_RECEIVABLE,
      debitPaise: params.totalPaidPaise,
      creditPaise: 0,
      description: `Customer payment received for order ${params.orderNumber}`,
      orderId: params.orderId
    });

    // 2. Credit Merchant Payable for each participating store
    for (const [storeId, payablePaise] of params.merchantPayableMap.entries()) {
      if (payablePaise > 0) {
        lines.push({
          account: LedgerAccount.LIABILITY_MERCHANT_PAYABLE,
          debitPaise: 0,
          creditPaise: payablePaise,
          description: `Merchant net settlement payable for order ${params.orderNumber}`,
          storeId,
          orderId: params.orderId
        });
      }
    }

    // 3. Credit Platform Commission Revenue
    if (params.platformCommissionPaise > 0) {
      lines.push({
        account: LedgerAccount.REVENUE_PLATFORM_COMMISSION,
        debitPaise: 0,
        creditPaise: params.platformCommissionPaise,
        description: `Platform commission on order ${params.orderNumber}`,
        orderId: params.orderId
      });
    }

    // 4. Credit Delivery Fee pass-through liability
    if (params.deliveryFeePaise > 0) {
      lines.push({
        account: LedgerAccount.LIABILITY_DELIVERY_PASS_THROUGH,
        debitPaise: 0,
        creditPaise: params.deliveryFeePaise,
        description: `Fulfillment delivery fee collected for order ${params.orderNumber}`,
        orderId: params.orderId
      });
    }

    // 5. Credit Statutory Tax collected
    if (params.taxPaise > 0) {
      lines.push({
        account: LedgerAccount.LIABILITY_TAX_COLLECTED,
        debitPaise: 0,
        creditPaise: params.taxPaise,
        description: `GST collected on order ${params.orderNumber}`,
        orderId: params.orderId
      });
    }

    // Invariant check
    this.validateBalance(lines);

    return {
      transactionId: `TX-JRN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      eventGroup: 'ORDER_PAYMENT',
      reference: params.orderNumber,
      timestamp: new Date(),
      lines
    };
  }

  /**
   * Constructs a balanced journal transaction for an Item or Child-Order Refund.
   */
  public static recordRefund(params: {
    orderId: string;
    childOrderId?: string;
    refundReference: string;
    customerRefundPaise: number;
    merchantDebitPaise: number;
    platformCommissionDebitPaise: number;
    taxRefundPaise: number;
    deliveryRefundPaise?: number;
    storeId?: string;
    isMerchantFault: boolean;
  }): JournalTransaction {
    const lines: JournalEntryLine[] = [];

    // Debits (Reversing previously earned or credited amounts)
    if (params.merchantDebitPaise > 0) {
      lines.push({
        account: LedgerAccount.LIABILITY_MERCHANT_PAYABLE,
        debitPaise: params.merchantDebitPaise,
        creditPaise: 0,
        description: `Merchant debit for refund ${params.refundReference}`,
        storeId: params.storeId,
        orderId: params.orderId,
        childOrderId: params.childOrderId
      });
    }

    if (params.platformCommissionDebitPaise > 0) {
      lines.push({
        account: LedgerAccount.REVENUE_PLATFORM_COMMISSION,
        debitPaise: params.platformCommissionDebitPaise,
        creditPaise: 0,
        description: `Platform commission reversal on refund ${params.refundReference}`,
        orderId: params.orderId,
        childOrderId: params.childOrderId
      });
    }

    if (params.taxRefundPaise > 0) {
      lines.push({
        account: LedgerAccount.LIABILITY_TAX_COLLECTED,
        debitPaise: params.taxRefundPaise,
        creditPaise: 0,
        description: `Tax liability adjustment on refund ${params.refundReference}`,
        orderId: params.orderId
      });
    }

    if (params.deliveryRefundPaise && params.deliveryRefundPaise > 0) {
      lines.push({
        account: LedgerAccount.LIABILITY_DELIVERY_PASS_THROUGH,
        debitPaise: params.deliveryRefundPaise,
        creditPaise: 0,
        description: `Delivery charge reversal on refund ${params.refundReference}`,
        orderId: params.orderId
      });
    }

    // Credits: Liability to pay customer refund
    lines.push({
      account: LedgerAccount.LIABILITY_CUSTOMER_REFUND,
      debitPaise: 0,
      creditPaise: params.customerRefundPaise,
      description: `Customer payable for refund ${params.refundReference}`,
      orderId: params.orderId
    });

    // Invariant check
    this.validateBalance(lines);

    return {
      transactionId: `TX-REF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      eventGroup: 'REFUND_SETTLEMENT',
      reference: params.refundReference,
      timestamp: new Date(),
      lines
    };
  }

  /**
   * Constructs a balanced journal transaction for Rider Task Payout.
   */
  public static recordRiderPayout(params: {
    riderId: string;
    deliveryTaskId: string;
    payoutAmountPaise: number;
    reference: string;
  }): JournalTransaction {
    const lines: JournalEntryLine[] = [
      {
        account: LedgerAccount.LIABILITY_DELIVERY_PASS_THROUGH,
        debitPaise: params.payoutAmountPaise,
        creditPaise: 0,
        description: `Delivery pass-through debit for rider task ${params.deliveryTaskId}`,
        riderId: params.riderId
      },
      {
        account: LedgerAccount.LIABILITY_RIDER_PAYABLE,
        debitPaise: 0,
        creditPaise: params.payoutAmountPaise,
        description: `Rider earnings payable for completed delivery ${params.reference}`,
        riderId: params.riderId
      }
    ];

    this.validateBalance(lines);

    return {
      transactionId: `TX-RDR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      eventGroup: 'RIDER_EARNING',
      reference: params.reference,
      timestamp: new Date(),
      lines
    };
  }
}
