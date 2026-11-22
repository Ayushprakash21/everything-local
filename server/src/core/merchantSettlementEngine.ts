import { prisma } from '../db';

export interface SettlementCalculationResult {
  storeId: string;
  storeName: string;
  periodStart: Date;
  periodEnd: Date;
  grossSalesPaise: number;
  commissionDeductedPaise: number;
  listingChargesPaise: number;
  refundDeductionsPaise: number;
  netMerchantPayablePaise: number;
  completedOrdersCount: number;
  statementNumber: string;
}

export class MerchantSettlementEngine {
  /**
   * Calculates settlements for a merchant over a period
   */
  static async calculateSettlement(storeId: string, periodStart: Date, periodEnd: Date): Promise<SettlementCalculationResult> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        products: true,
        merchantChildOrders: {
          where: {
            createdAt: { gte: periodStart, lte: periodEnd },
            status: { in: ['DELIVERED', 'COMPLETED', 'READY_FOR_PICKUP'] }
          }
        }
      }
    });

    if (!store) {
      throw new Error('Store not found');
    }

    // 1. Gross sales from completed child orders
    let grossSalesPaise = 0;
    let commissionDeductedPaise = 0;

    for (const order of store.merchantChildOrders) {
      grossSalesPaise += order.subtotalPaise;
      commissionDeductedPaise += order.commissionPaise;
    }

    // 2. Listing charges: 2% of active listed products value
    const listingRule = await prisma.categoryCommissionRule.findUnique({
      where: { categorySlug: store.category }
    });
    const listingPct = listingRule?.listingFeePct || 2.0;

    let totalCatalogueValuePaise = 0;
    for (const prod of store.products) {
      totalCatalogueValuePaise += prod.pricePaise;
    }
    const listingChargesPaise = Math.round((totalCatalogueValuePaise * (listingPct / 100)) * 0.1); // Pro-rated monthly

    // 3. Refund deductions
    const refundEntries = await prisma.financialLedgerEntry.findMany({
      where: {
        storeId,
        entryType: 'REFUND_DEBIT',
        createdAt: { gte: periodStart, lte: periodEnd }
      }
    });
    let refundDeductionsPaise = 0;
    for (const r of refundEntries) {
      refundDeductionsPaise += Math.abs(r.amountPaise);
    }

    // 4. Net payable calculation
    const netMerchantPayablePaise = Math.max(
      0,
      grossSalesPaise - commissionDeductedPaise - listingChargesPaise - refundDeductionsPaise
    );

    const statementNumber = `EL-STMT-${store.slug.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    return {
      storeId: store.id,
      storeName: store.name,
      periodStart,
      periodEnd,
      grossSalesPaise,
      commissionDeductedPaise,
      listingChargesPaise,
      refundDeductionsPaise,
      netMerchantPayablePaise,
      completedOrdersCount: store.merchantChildOrders.length,
      statementNumber
    };
  }

  /**
   * Generates and persists a MerchantSettlementStatement
   */
  static async generateStatement(storeId: string, periodStart: Date, periodEnd: Date) {
    const calc = await this.calculateSettlement(storeId, periodStart, periodEnd);

    const statement = await prisma.merchantSettlementStatement.create({
      data: {
        storeId,
        statementNumber: calc.statementNumber,
        periodStart,
        periodEnd,
        grossSalesPaise: calc.grossSalesPaise,
        commissionDeductedPaise: calc.commissionDeductedPaise,
        listingChargesPaise: calc.listingChargesPaise,
        refundDeductionsPaise: calc.refundDeductionsPaise,
        netMerchantPayablePaise: calc.netMerchantPayablePaise,
        status: 'GENERATED'
      }
    });

    return statement;
  }
}
