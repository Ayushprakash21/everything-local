import { prisma } from '../db';
import { GeospatialEngine } from './geospatial';

export interface DeliveryQuoteRequest {
  customerCoordinates: { latitude: number; longitude: number };
  merchantIds: string[];
  totalWeightKg?: number;
  deliveryTier?: 'EXPRESS_20' | 'PRIORITY_40' | 'STANDARD_60' | 'SCHEDULED_120';
}

export interface TierQuote {
  tierCode: 'EXPRESS_20' | 'PRIORITY_40' | 'STANDARD_60' | 'SCHEDULED_120';
  displayName: string;
  isServiceable: boolean;
  unserviceableReason?: string;
  targetMinutes: number;
  estimatedWindowMinutes: [number, number];
  pricing: {
    baseDeliveryPaise: number;
    distanceChargePaise: number;
    prioritySurchargePaise: number;
    weightSurchargePaise: number;
    additionalPickupChargePaise: number;
    peakSurgePaise: number;
    totalDeliveryFeePaise: number;
  };
  logistics: {
    maxRoadDistanceKm: number;
    totalPickupStops: number;
    prepTimeMinutes: number;
  };
}

export class DeliveryPriorityEngine {
  /**
   * Calculates dynamic delivery quotes for all 4 tiers with statutory feasibility validation
   */
  static async calculateAllTiers(req: DeliveryQuoteRequest): Promise<TierQuote[]> {
    // 1. Fetch active pricing rules from database
    const rules = await prisma.deliveryPricingRule.findMany({
      where: { isActive: true }
    });

    // 2. Fetch participating merchants
    const stores = await prisma.store.findMany({
      where: { id: { in: req.merchantIds } }
    });

    if (stores.length === 0) {
      throw new Error('No valid merchants found for delivery calculation');
    }

    // 3. Compute road distances between customer and each merchant
    let maxDistanceKm = 0;
    for (const store of stores) {
      const dist = GeospatialEngine.calculateDistanceKm(
        req.customerCoordinates,
        { latitude: store.latitude, longitude: store.longitude }
      );
      if (dist > maxDistanceKm) maxDistanceKm = dist;
    }

    const totalWeight = req.totalWeightKg || 2.0;
    const additionalPickups = Math.max(0, stores.length - 1);

    // 4. Evaluate each tier
    const tierCodes: ('EXPRESS_20' | 'PRIORITY_40' | 'STANDARD_60' | 'SCHEDULED_120')[] = [
      'EXPRESS_20',
      'PRIORITY_40',
      'STANDARD_60',
      'SCHEDULED_120'
    ];

    const quotes: TierQuote[] = [];

    for (const code of tierCodes) {
      const rule = rules.find((r) => r.tierCode === code) || {
        tierCode: code,
        displayName: code.replace('_', ' '),
        targetMinutes: code === 'EXPRESS_20' ? 20 : code === 'PRIORITY_40' ? 40 : code === 'STANDARD_60' ? 60 : 120,
        baseDeliveryPaise: code === 'EXPRESS_20' ? 4500 : code === 'PRIORITY_40' ? 3500 : code === 'STANDARD_60' ? 2500 : 2000,
        perKmPaise: code === 'EXPRESS_20' ? 1200 : code === 'PRIORITY_40' ? 1000 : code === 'STANDARD_60' ? 800 : 600,
        prioritySurchargePaise: code === 'EXPRESS_20' ? 2500 : code === 'PRIORITY_40' ? 1500 : 0,
        maxRoadDistanceKm: code === 'EXPRESS_20' ? 3.0 : code === 'PRIORITY_40' ? 4.5 : code === 'STANDARD_60' ? 6.0 : 8.0,
        additionalPickupPaise: 1200,
        weightSurchargePaisePerKg: 500,
        peakMultiplier: 1.0
      };

      // Feasibility verification
      let isServiceable = true;
      let unserviceableReason: string | undefined;

      // Rule A: Max road distance threshold
      if (maxDistanceKm > rule.maxRoadDistanceKm) {
        isServiceable = false;
        unserviceableReason = `Delivery distance (${maxDistanceKm.toFixed(1)} km) exceeds ${rule.displayName} maximum radius of ${rule.maxRoadDistanceKm} km`;
      }

      // Rule B: Multi-store constraints for Express 20
      if (code === 'EXPRESS_20' && stores.length > 2) {
        isServiceable = false;
        unserviceableReason = `Express 20 cannot bundle more than 2 separate merchant pickups within a 20-minute window`;
      }

      // Rule C: Heavy basket restrictions for express 20
      if (code === 'EXPRESS_20' && totalWeight > 8.0) {
        isServiceable = false;
        unserviceableReason = `Basket weight (${totalWeight.toFixed(1)} kg) exceeds express two-wheeler quick delivery limit (8 kg)`;
      }

      // Compute pricing breakdown
      const baseFee = rule.baseDeliveryPaise;
      const chargeableKm = Math.max(0, maxDistanceKm - 1.0);
      const distanceCharge = Math.round(chargeableKm * rule.perKmPaise);
      const prioritySurcharge = rule.prioritySurchargePaise;
      
      const overweightKg = Math.max(0, totalWeight - 5.0);
      const weightSurcharge = Math.round(overweightKg * rule.weightSurchargePaisePerKg);
      
      const additionalPickupCharge = additionalPickups * rule.additionalPickupPaise;

      const subtotalBeforeSurge = baseFee + distanceCharge + prioritySurcharge + weightSurcharge + additionalPickupCharge;
      const surgeMultiplier = rule.peakMultiplier || 1.0;
      const peakSurge = Math.round(subtotalBeforeSurge * (surgeMultiplier - 1.0));
      const totalDeliveryFeePaise = subtotalBeforeSurge + peakSurge;

      // ETA window
      const basePrepTime = stores.length > 1 ? 12 + additionalPickups * 4 : 10;
      const transitTime = Math.round(maxDistanceKm * 3.5);
      const minEta = Math.min(rule.targetMinutes, basePrepTime + transitTime);
      const maxEta = minEta + (code === 'EXPRESS_20' ? 5 : code === 'PRIORITY_40' ? 10 : 15);

      quotes.push({
        tierCode: code,
        displayName: rule.displayName,
        isServiceable,
        unserviceableReason,
        targetMinutes: rule.targetMinutes,
        estimatedWindowMinutes: [minEta, maxEta],
        pricing: {
          baseDeliveryPaise: baseFee,
          distanceChargePaise: distanceCharge,
          prioritySurchargePaise: prioritySurcharge,
          weightSurchargePaise: weightSurcharge,
          additionalPickupChargePaise: additionalPickupCharge,
          peakSurgePaise: peakSurge,
          totalDeliveryFeePaise: isServiceable ? totalDeliveryFeePaise : 0
        },
        logistics: {
          maxRoadDistanceKm: Number(maxDistanceKm.toFixed(2)),
          totalPickupStops: stores.length,
          prepTimeMinutes: basePrepTime
        }
      });
    }

    return quotes;
  }
}
