/**
 * EVERYTHING LOCAL - GEOSPATIAL & HYPERLOCAL SERVICEABILITY ENGINE
 * Uses spherical Haversine formula to compute distance between store and customer.
 * Enforces the strict 3.0 km serviceability rule for Indore pilot.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ServiceabilityResult {
  isServiceable: boolean;
  distanceKm: number;
  maxRadiusKm: number;
  isPickupAvailable: boolean;
  reason?: string;
}

export class GeospatialEngine {
  public static readonly EARTH_RADIUS_KM = 6371.0;
  public static readonly DEFAULT_SERVICE_RADIUS_KM = 3.0; // 3.0 km initial hyper-local target

  // Reference coordinates for Indore, Madhya Pradesh
  public static readonly INDORE_LANDMARKS: Record<string, Coordinates> = {
    PALASIA: { latitude: 22.7244, longitude: 75.8839 },
    VIJAY_NAGAR: { latitude: 22.7533, longitude: 75.8937 },
    RAJWADA: { latitude: 22.7196, longitude: 75.8577 },
    BHAWARKUA: { latitude: 22.6926, longitude: 75.8676 },
    ANNAPURNA: { latitude: 22.7011, longitude: 75.8341 },
    SAKET: { latitude: 22.7208, longitude: 75.8942 },
  };

  /**
   * Convert degrees to radians
   */
  private static toRad(degree: number): number {
    return (degree * Math.PI) / 180;
  }

  /**
   * Calculate great-circle distance between two GPS coordinates in kilometers
   */
  public static calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
    const lat1 = coord1.latitude;
    const lon1 = coord1.longitude;
    const lat2 = coord2.latitude;
    const lon2 = coord2.longitude;

    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS_KM * c;

    // Round to 2 decimal places
    return Math.round(distance * 100) / 100;
  }

  /**
   * Determine serviceability for delivery and pickup
   */
  public static evaluateServiceability(
    storeCoord: Coordinates,
    customerCoord: Coordinates,
    storeServiceRadiusKm: number = GeospatialEngine.DEFAULT_SERVICE_RADIUS_KM
  ): ServiceabilityResult {
    const distanceKm = this.calculateDistanceKm(storeCoord, customerCoord);
    const maxRadiusKm = storeServiceRadiusKm || this.DEFAULT_SERVICE_RADIUS_KM;

    const isDeliveryServiceable = distanceKm <= maxRadiusKm;

    return {
      isServiceable: isDeliveryServiceable,
      distanceKm,
      maxRadiusKm,
      isPickupAvailable: true, // Pickup is always permitted regardless of delivery distance
      reason: isDeliveryServiceable
        ? undefined
        : `Store is ${distanceKm} km away, which exceeds the delivery radius of ${maxRadiusKm} km.`
    };
  }
}
