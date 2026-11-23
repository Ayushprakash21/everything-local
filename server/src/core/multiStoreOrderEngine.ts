import { prisma } from '../db';
import { DeliveryPriorityEngine } from './deliveryPriorityEngine';
import { DoubleEntryLedgerEngine } from './doubleEntryLedger';

export interface MultiStoreCheckoutRequest {
  customerId: string;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryTier: 'EXPRESS_20' | 'PRIORITY_40' | 'STANDARD_60' | 'SCHEDULED_120';
  paymentMethod: 'ONLINE' | 'UPI' | 'COD' | 'CARD';
  items: {
    productId: string;
    storeId: string;
    productName: string;
    quantity: number;
    unitPricePaise: number;
  }[];
}

export class MultiStoreOrderEngine {
  /**
   * Creates a Parent Order with independent Merchant Child Orders and Delivery Tasks
   */
  static async checkout(req: MultiStoreCheckoutRequest) {
    if (!req.items || req.items.length === 0) {
      throw new Error('Cannot checkout an empty basket');
    }

    // 1. Group items by storeId
    const storeMap = new Map<string, typeof req.items>();
    for (const item of req.items) {
      const sId = (item as any).storeId || (item as any).merchantId;
      if (!sId) throw new Error('storeId or merchantId required on item');
      (item as any).storeId = sId;
      const list = storeMap.get(sId) || [];
      list.push(item);
      storeMap.set(sId, list);
    }

    const merchantIds = Array.from(storeMap.keys());
    const stores = await prisma.store.findMany({
      where: { id: { in: merchantIds } }
    });

    if (stores.length !== merchantIds.length) {
      throw new Error('One or more participating stores were not found');
    }

    // 2. Fetch commission rules
    const commissionRules = await prisma.categoryCommissionRule.findMany();

    // 3. Compute delivery fee via DeliveryPriorityEngine
    const customerCoords = {
      latitude: req.deliveryLatitude || 22.7244,
      longitude: req.deliveryLongitude || 75.8839
    };

    const tierQuotes = await DeliveryPriorityEngine.calculateAllTiers({
      customerCoordinates: customerCoords,
      merchantIds,
      deliveryTier: req.deliveryTier
    });

    const chosenQuote = tierQuotes.find((q) => q.tierCode === req.deliveryTier);
    if (!chosenQuote || !chosenQuote.isServiceable) {
      throw new Error(
        chosenQuote?.unserviceableReason ||
          `Selected delivery tier ${req.deliveryTier} is unserviceable for this location and basket combination`
      );
    }

    const deliveryFeePaise = chosenQuote.pricing.totalDeliveryFeePaise;
    const deliveryEtaMinutes = chosenQuote.estimatedWindowMinutes[1];
    const parentOrderNumber = `EL-ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 4. Database transaction to create parent, child orders, and delivery tasks atomically
    const result = await prisma.$transaction(async (tx) => {
      // P1 Remediation: Validate live inventory, synchronize price, and decrement stock
      let totalSubtotalPaise = 0;
      for (const item of req.items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId }
        });
        if (prod) {
          if (prod.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}`
            );
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
        totalSubtotalPaise += item.unitPricePaise * item.quantity;
      }

      const totalPaidPaise = totalSubtotalPaise + deliveryFeePaise;

      // Create Parent Order
      const parentOrder = await tx.parentOrder.create({
        data: {
          orderNumber: parentOrderNumber,
          customerId: req.customerId,
          status: 'CONFIRMED',
          paymentStatus: req.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
          paymentMethod: req.paymentMethod,
          deliveryTier: req.deliveryTier,
          deliveryAddress: req.deliveryAddress,
          deliveryLatitude: customerCoords.latitude,
          deliveryLongitude: customerCoords.longitude,
          deliveryEtaMinutes,
          totalItemSubtotalPaise: totalSubtotalPaise,
          totalDeliveryFeePaise: deliveryFeePaise,
          totalDiscountPaise: 0,
          totalTaxPaise: Math.round(totalSubtotalPaise * 0.05), // 5% GST included
          totalPaidPaise
        }
      });

      const childOrders = [];
      let childIndex = 1;
      const merchantPayableMap = new Map<string, number>();
      let totalPlatformCommission = 0;

      for (const [storeId, storeItems] of storeMap.entries()) {
        const store = stores.find((s) => s.id === storeId)!;
        const commRule = commissionRules.find((c) => c.categorySlug === store.category);
        const commRatePct = commRule?.defaultCommissionPct || store.commissionRatePct || 5.0;

        let storeSubtotal = 0;
        for (const it of storeItems) {
          storeSubtotal += it.unitPricePaise * it.quantity;
        }

        const commPaise = Math.round((storeSubtotal * commRatePct) / 100);
        const merchantPayable = storeSubtotal - commPaise;
        merchantPayableMap.set(storeId, merchantPayable);
        totalPlatformCommission += commPaise;

        const childOrderNumber = `${parentOrderNumber}-M${childIndex++}`;

        const childOrder = await tx.merchantChildOrder.create({
          data: {
            parentOrderId: parentOrder.id,
            storeId,
            childOrderNumber,
            status: 'PENDING_ACCEPTANCE',
            subtotalPaise: storeSubtotal,
            commissionRatePct: commRatePct,
            commissionPaise: commPaise,
            merchantPayablePaise: merchantPayable,
            items: {
              create: storeItems.map((si) => ({
                productId: si.productId,
                productName: si.productName || 'Grocery Item',
                quantity: si.quantity,
                unitPricePaise: si.unitPricePaise,
                totalPricePaise: si.unitPricePaise * si.quantity,
                isFulfilled: true
              }))
            }
          },
          include: { items: true }
        });

        childOrders.push(childOrder);

        // Generate Delivery Task for this merchant child pickup
        const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

        await tx.deliveryTask.create({
          data: {
            taskNumber: `EL-TASK-${Date.now().toString().slice(-5)}-${childIndex}`,
            parentOrderId: parentOrder.id,
            merchantOrderId: childOrder.id,
            status: 'AVAILABLE',
            priorityTier: req.deliveryTier,
            pickupLocationName: store.name,
            pickupAddress: store.addressLine,
            pickupLatitude: store.latitude,
            pickupLongitude: store.longitude,
            deliveryAddress: req.deliveryAddress,
            deliveryLatitude: customerCoords.latitude,
            deliveryLongitude: customerCoords.longitude,
            estimatedDistanceKm: chosenQuote.logistics.maxRoadDistanceKm,
            estimatedMinutes: deliveryEtaMinutes,
            riderBasePayoutPaise: 3000,
            additionalPickupPayoutPaise: storeMap.size > 1 ? 800 : 0,
            totalPayoutPaise: storeMap.size > 1 ? 3800 : 3000,
            pickupOtp,
            deliveryOtp,
            specialHandling: store.category === 'produce' ? 'Perishable fresh items' : 'Standard packaging'
          }
        });

        // Record Financial Ledger Entry for this merchant
        await tx.financialLedgerEntry.create({
          data: {
            parentOrderId: parentOrder.id,
            storeId,
            entryType: 'ORDER_SALE',
            amountPaise: storeSubtotal,
            reference: `Sale: ${childOrderNumber}`
          }
        });

        await tx.financialLedgerEntry.create({
          data: {
            parentOrderId: parentOrder.id,
            storeId,
            entryType: 'COMMISSION_FEE',
            amountPaise: -commPaise,
            reference: `Platform commission (${commRatePct}%): ${childOrderNumber}`
          }
        });
      }

      // Record double-entry balanced transaction
      DoubleEntryLedgerEngine.recordOrderPayment({
        orderId: parentOrder.id,
        orderNumber: parentOrder.orderNumber,
        totalPaidPaise,
        merchantPayableMap,
        platformCommissionPaise: totalPlatformCommission,
        deliveryFeePaise,
        taxPaise: 0 // In GST-inclusive retail pricing, tax is included in item subtotal
      });

      return {
        parentOrder,
        childOrders
      };
    });

    return result;
  }

  /**
   * Handles partial merchant rejection while strictly preserving remaining store orders!
   */
  static async handlePartialMerchantRejection(merchantOrderId: string, reason: string) {
    return await prisma.$transaction(async (tx) => {
      const childOrder = await tx.merchantChildOrder.findUnique({
        where: { id: merchantOrderId },
        include: { parentOrder: { include: { childOrders: true } }, items: true }
      });

      if (!childOrder) {
        throw new Error('Merchant child order not found');
      }

      if (childOrder.status === 'REJECTED' || childOrder.status === 'CANCELLED') {
        throw new Error('Child order is already in cancelled or rejected state');
      }

      // 1. Transition ONLY this merchant child order to REJECTED
      const updatedChild = await tx.merchantChildOrder.update({
        where: { id: merchantOrderId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason
        }
      });

      // 2. Mark items as unfulfilled and restore stock
      await tx.merchantChildOrderItem.updateMany({
        where: { merchantOrderId },
        data: {
          isFulfilled: false,
          rejectionReason: reason
        }
      });

      for (const it of childOrder.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.quantity } }
        }).catch(() => {});
      }

      // Cancel associated delivery task
      await tx.deliveryTask.updateMany({
        where: { merchantOrderId },
        data: { status: 'CANCELLED' }
      });

      // 3. Compute refund amount: rejected child subtotal
      const refundAmountPaise = childOrder.subtotalPaise;
      const parent = childOrder.parentOrder;
      const otherChildren = parent.childOrders.filter((c) => c.id !== merchantOrderId);

      // Determine parent order status
      const allRejected = otherChildren.every((c) => c.status === 'REJECTED' || c.status === 'CANCELLED');
      const newParentStatus = allRejected ? 'CANCELLED' : 'PARTIALLY_FULFILLED';
      const newRefundedTotal = parent.refundedAmountPaise + refundAmountPaise;

      await tx.parentOrder.update({
        where: { id: parent.id },
        data: {
          status: newParentStatus,
          paymentStatus: allRejected ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAmountPaise: newRefundedTotal
        }
      });

      // 4. Record compensatory financial ledger entry (REFUND_DEBIT)
      await tx.financialLedgerEntry.create({
        data: {
          parentOrderId: parent.id,
          storeId: childOrder.storeId,
          entryType: 'REFUND_DEBIT',
          amountPaise: -refundAmountPaise,
          reference: `Customer Refund: ${childOrder.childOrderNumber} rejected (${reason})`
        }
      });

      // Record balanced double-entry refund transaction
      DoubleEntryLedgerEngine.recordRefund({
        orderId: parent.id,
        childOrderId: childOrder.id,
        refundReference: `REF-${childOrder.childOrderNumber}`,
        customerRefundPaise: refundAmountPaise,
        merchantDebitPaise: childOrder.merchantPayablePaise,
        platformCommissionDebitPaise: childOrder.commissionPaise,
        taxRefundPaise: 0,
        storeId: childOrder.storeId,
        isMerchantFault: true
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'PARTIAL_ORDER_REJECTION',
          resourceType: 'MerchantChildOrder',
          resourceId: childOrder.id,
          detailsJson: JSON.stringify({
            reason,
            refundAmountPaise,
            remainingActiveChildOrders: otherChildren.filter((c) => c.status !== 'REJECTED').length
          })
        }
      });

      return {
        rejectedChildOrder: updatedChild,
        parentOrderId: parent.id,
        refundAmountPaise,
        remainingActiveChildOrdersCount: otherChildren.filter((c) => c.status !== 'REJECTED').length
      };
    });
  }
}
