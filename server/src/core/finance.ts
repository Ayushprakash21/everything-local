/**
 * EVERYTHING LOCAL - FINANCIAL ENGINE
 * All monetary amounts are handled strictly in integer Indian paise (1 INR = 100 paise).
 * No floating point drift.
 */

export interface OrderItemCalculationInput {
  unitPricePaise: number;
  quantity: number;
}

export interface FinancialCalculationInput {
  items: OrderItemCalculationInput[];
  fulfillmentMode: 'PICKUP' | 'MERCHANT_DELIVERY' | 'PLATFORM_DELIVERY';
  deliveryFeePaise?: number;
  taxPaise?: number;
  discountPaise?: number;
  commissionRatePct: number; // e.g. 3.5 for 3.5%
}

export interface OrderFinancialSnapshot {
  itemSubtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  discountPaise: number;
  totalAmountPaise: number;
  commissionPaise: number;
  merchantPayablePaise: number;
  platformRevenuePaise: number;
  thirdPartyDeliveryPayoutPaise: number;
}

export class FinancialEngine {
  public static readonly DEFAULT_MIN_ORDER_VALUE_PAISE = 29900; // ₹299.00

  /**
   * Calculate line item subtotal
   */
  public static calculateSubtotal(items: OrderItemCalculationInput[]): number {
    return items.reduce((sum, item) => {
      if (item.unitPricePaise < 0 || item.quantity <= 0) {
        throw new Error('Invalid price or quantity in order items');
      }
      return sum + Math.round(item.unitPricePaise * item.quantity);
    }, 0);
  }

  /**
   * Validate if the order meets the Minimum Order Value (MOV)
   */
  public static validateMinimumOrderValue(
    subtotalPaise: number,
    minOrderValuePaise: number = FinancialEngine.DEFAULT_MIN_ORDER_VALUE_PAISE
  ): { isValid: boolean; shortfallPaise: number } {
    if (subtotalPaise >= minOrderValuePaise) {
      return { isValid: true, shortfallPaise: 0 };
    }
    return {
      isValid: false,
      shortfallPaise: minOrderValuePaise - subtotalPaise
    };
  }

  /**
   * Calculate complete order financial breakdown
   */
  public static calculateOrderFinancials(input: FinancialCalculationInput): OrderFinancialSnapshot {
    const itemSubtotalPaise = this.calculateSubtotal(input.items);
    const taxPaise = Math.max(0, Math.round(input.taxPaise || 0));
    const discountPaise = Math.max(0, Math.round(input.discountPaise || 0));

    // Fulfillment Delivery Fees
    let deliveryFeePaise = 0;
    let thirdPartyDeliveryPayoutPaise = 0;

    if (input.fulfillmentMode === 'PICKUP') {
      deliveryFeePaise = 0; // Customer pickup is strictly ₹0
    } else if (input.fulfillmentMode === 'MERCHANT_DELIVERY') {
      deliveryFeePaise = Math.max(0, Math.round(input.deliveryFeePaise || 0));
    } else if (input.fulfillmentMode === 'PLATFORM_DELIVERY') {
      deliveryFeePaise = Math.max(0, Math.round(input.deliveryFeePaise || 0));
      // Third-party logistics fee is a pass-through to delivery provider (e.g. Porter)
      thirdPartyDeliveryPayoutPaise = deliveryFeePaise;
    }

    // Customer Total
    const discountedSubtotal = Math.max(0, itemSubtotalPaise - discountPaise);
    const totalAmountPaise = discountedSubtotal + deliveryFeePaise + taxPaise;

    // Commission: Calculated strictly on discounted item subtotal, NOT on delivery or tax
    const commissionPct = Math.max(0, input.commissionRatePct);
    const commissionPaise = Math.floor((discountedSubtotal * commissionPct) / 100);

    // Merchant Payable Calculation:
    // If merchant fulfills delivery, they receive the delivery fee.
    // Otherwise, they only receive item subtotal minus platform commission.
    let merchantPayablePaise = discountedSubtotal - commissionPaise;
    if (input.fulfillmentMode === 'MERCHANT_DELIVERY') {
      merchantPayablePaise += deliveryFeePaise;
    }

    // Platform Net Revenue:
    // Strictly the earned commission. Pass-through delivery fee is NOT platform revenue.
    const platformRevenuePaise = commissionPaise;

    return {
      itemSubtotalPaise,
      deliveryFeePaise,
      taxPaise,
      discountPaise,
      totalAmountPaise,
      commissionPaise,
      merchantPayablePaise,
      platformRevenuePaise,
      thirdPartyDeliveryPayoutPaise
    };
  }

  /**
   * P1 Remediation: Item-level refund calculation with isMerchantFault treatment
   * Supports partial merchant rejection, single-item out-of-stock, and fault-based fee treatment
   */
  public static calculateItemRefund(params: {
    itemUnitPricePaise: number;
    quantity: number;
    commissionRatePct: number;
    taxRatePct?: number; // default 5%
    isMerchantFault: boolean;
    deliveryFeeRefundPaise?: number;
    reason: string;
  }): {
    customerRefundPaise: number;
    merchantDebitPaise: number;
    platformCommissionDebitPaise: number;
    taxRefundPaise: number;
    deliveryFeeRefundPaise: number;
    isMerchantFault: boolean;
    reason: string;
  } {
    const itemSubtotal = params.itemUnitPricePaise * params.quantity;
    const taxRate = params.taxRatePct !== undefined ? params.taxRatePct : 5.0;
    const taxRefundPaise = Math.round((itemSubtotal * taxRate) / 100);
    const commissionDebitPaise = Math.round((itemSubtotal * params.commissionRatePct) / 100);

    let deliveryFeeRefundPaise = params.deliveryFeeRefundPaise || 0;
    let customerRefundPaise = itemSubtotal + taxRefundPaise + deliveryFeeRefundPaise;

    // If it is merchant fault (e.g. out of stock, spoilt product, merchant rejection),
    // the merchant absorbs the full item price loss, and their payable is debited.
    // If delivery failed due to merchant fault, merchant also covers the delivery fee.
    let merchantDebitPaise = itemSubtotal - commissionDebitPaise;
    if (params.isMerchantFault && deliveryFeeRefundPaise > 0) {
      merchantDebitPaise += deliveryFeeRefundPaise;
    }

    return {
      customerRefundPaise,
      merchantDebitPaise,
      platformCommissionDebitPaise: commissionDebitPaise,
      taxRefundPaise,
      deliveryFeeRefundPaise,
      isMerchantFault: params.isMerchantFault,
      reason: params.reason
    };
  }

  /**
   * Calculate refund reversal amounts
   */
  public static calculateRefund(
    snapshot: OrderFinancialSnapshot,
    isMerchantFault: boolean = false
  ): {
    customerRefundPaise: number;
    merchantDebitPaise: number;
    platformCommissionDebitPaise: number;
  } {
    const customerRefundPaise = snapshot.totalAmountPaise;
    const platformCommissionDebitPaise = snapshot.commissionPaise;
    let merchantDebitPaise = snapshot.merchantPayablePaise;

    // When cancellation is strictly merchant fault, merchant absorbs any delivery pass-through liability
    if (isMerchantFault && snapshot.thirdPartyDeliveryPayoutPaise > 0) {
      merchantDebitPaise += snapshot.thirdPartyDeliveryPayoutPaise;
    }

    return {
      customerRefundPaise,
      merchantDebitPaise,
      platformCommissionDebitPaise
    };
  }

  /**
   * Format integer paise to display string (e.g. 29900 -> "₹299.00")
   */
  public static formatPaiseToRupees(paise: number): string {
    const rupees = paise / 100;
    return `₹${rupees.toFixed(2)}`;
  }
}
