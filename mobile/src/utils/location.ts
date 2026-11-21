export interface LocationCoords {
  latitude: number;
  longitude: number;
  neighborhood: string;
}

export const INDORE_NEIGHBORHOODS: Record<string, LocationCoords> = {
  PALASIA: { latitude: 22.7244, longitude: 75.8839, neighborhood: 'Palasia, Indore' },
  VIJAY_NAGAR: { latitude: 22.7533, longitude: 75.8937, neighborhood: 'Vijay Nagar, Indore' },
  SAKET: { latitude: 22.7208, longitude: 75.8942, neighborhood: 'Saket, Indore' },
  BHAWARKUA: { latitude: 22.6926, longitude: 75.8676, neighborhood: 'Bhawarkua, Indore' },
  RAJWADA: { latitude: 22.7196, longitude: 75.8577, neighborhood: 'Rajwada, Indore' },
  ANNAPURNA: { latitude: 22.7011, longitude: 75.8341, neighborhood: 'Annapurna, Indore' },
};

export class LocationService {
  public static async requestLocationPermission(): Promise<boolean> {
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  public static async getCurrentLocation(): Promise<LocationCoords> {
    try {
      const Location = await import('expo-location');
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return INDORE_NEIGHBORHOODS.PALASIA;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        neighborhood: 'Current Location (Indore)'
      };
    } catch {
      return INDORE_NEIGHBORHOODS.PALASIA;
    }
  }

  public static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}
