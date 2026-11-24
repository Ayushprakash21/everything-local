import { Router, Request, Response } from 'express';
import { IndoreLocationEngine } from '../core/locationEngine';
import { GeospatialEngine } from '../core/geospatial';
import { prisma } from '../db';

const router = Router();

// 1. Search localities, landmarks, roads, or PIN codes
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string || '').trim();
    const results = await IndoreLocationEngine.searchAddresses(q);
    res.json({ results });
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({ error: 'Failed to search localities' });
  }
});

// 2. Reverse geocode GPS coordinates
router.get('/reverse', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Valid latitude and longitude required' });
      return;
    }

    const address = await IndoreLocationEngine.reverseGeocode({ latitude: lat, longitude: lng });
    res.json({ address });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: 'Failed to reverse geocode coordinates' });
  }
});

// 3. Get popular curated Indore localities
router.get('/localities', (_req: Request, res: Response): void => {
  const localities = IndoreLocationEngine.getPopularLocalities();
  res.json({ localities });
});

// 4. Check detailed serviceability for a customer coordinate
router.get('/serviceability', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Valid latitude and longitude required' });
      return;
    }

    const customerCoord = { latitude: lat, longitude: lng };

    // Fetch verified active stores
    const stores = await prisma.store.findMany({
      where: { isOpen: true, isVerified: true }
    });

    const evaluatedStores = stores.map((s) => {
      const storeCoord = { latitude: s.latitude, longitude: s.longitude };
      const serviceability = GeospatialEngine.evaluateServiceability(
        storeCoord,
        customerCoord,
        s.serviceRadiusKm
      );

      // Realistic ETA calculation
      let estimatedTime = 'Store Pickup Only';
      if (serviceability.isServiceable) {
        if (serviceability.distanceKm <= 1.2) {
          estimatedTime = '15-20 min';
        } else if (serviceability.distanceKm <= 2.5) {
          estimatedTime = '20-30 min';
        } else {
          estimatedTime = '25-35 min';
        }
      }

      return {
        storeId: s.id,
        storeName: s.name,
        category: s.category,
        distanceKm: serviceability.distanceKm,
        isDeliveryServiceable: serviceability.isServiceable,
        isPickupAvailable: serviceability.isPickupAvailable,
        serviceRadiusKm: s.serviceRadiusKm,
        estimatedTime
      };
    });

    const serviceableStores = evaluatedStores.filter((s) => s.isDeliveryServiceable);
    const minDistance = evaluatedStores.length > 0
      ? Math.min(...evaluatedStores.map((s) => s.distanceKm))
      : 0;

    let overallEta = 'Store Pickup Only';
    if (serviceableStores.length > 0) {
      const nearestServiceable = Math.min(...serviceableStores.map((s) => s.distanceKm));
      if (nearestServiceable <= 1.2) {
        overallEta = '15-20 min';
      } else if (nearestServiceable <= 2.5) {
        overallEta = '20-30 min';
      } else {
        overallEta = '25-35 min';
      }
    }

    res.json({
      customerLocation: customerCoord,
      isAnyStoreServiceable: serviceableStores.length > 0,
      serviceableStoreCount: serviceableStores.length,
      totalStoreCount: stores.length,
      nearestStoreDistanceKm: minDistance,
      deliveryEta: overallEta,
      stores: evaluatedStores
    });
  } catch (error) {
    console.error('Serviceability check error:', error);
    res.status(500).json({ error: 'Failed to evaluate serviceability' });
  }
});

export default router;
