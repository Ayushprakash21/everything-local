export interface LocationCoords {
  latitude: number;
  longitude: number;
  neighborhood: string;
  pincode?: string;
}

export const INDORE_NEIGHBORHOODS: Record<string, LocationCoords> = {
  PALASIA: { latitude: 22.7244, longitude: 75.8839, neighborhood: 'Palasia, Indore', pincode: '452001' },
  NEW_PALASIA: { latitude: 22.7289, longitude: 75.8812, neighborhood: 'New Palasia, Indore', pincode: '452001' },
  VIJAY_NAGAR: { latitude: 22.7533, longitude: 75.8937, neighborhood: 'Vijay Nagar, Indore', pincode: '452010' },
  SCHEME_54: { latitude: 22.7578, longitude: 75.8872, neighborhood: 'Scheme 54, Indore', pincode: '452010' },
  SCHEME_78: { latitude: 22.7661, longitude: 75.8935, neighborhood: 'Scheme 78, Indore', pincode: '452010' },
  SAKET: { latitude: 22.7208, longitude: 75.8942, neighborhood: 'Saket, Indore', pincode: '452018' },
  BHAWARKUA: { latitude: 22.6926, longitude: 75.8676, neighborhood: 'Bhawarkua, Indore', pincode: '452014' },
  RAJWADA: { latitude: 22.7196, longitude: 75.8577, neighborhood: 'Rajwada, Indore', pincode: '452002' },
  ANNAPURNA: { latitude: 22.7011, longitude: 75.8341, neighborhood: 'Annapurna, Indore', pincode: '452009' },
  SUDAMA_NAGAR: { latitude: 22.6935, longitude: 75.8252, neighborhood: 'Sudama Nagar, Indore', pincode: '452009' },
  RAU: { latitude: 22.6288, longitude: 75.8115, neighborhood: 'Rau, Indore', pincode: '453331' },
  NIPANIA: { latitude: 22.7689, longitude: 75.9142, neighborhood: 'Nipania, Indore', pincode: '452010' },
  MAHALAXMI_NAGAR: { latitude: 22.7645, longitude: 75.9021, neighborhood: 'Mahalaxmi Nagar, Indore', pincode: '452010' },
  AB_ROAD: { latitude: 22.7352, longitude: 75.8856, neighborhood: 'AB Road, Indore', pincode: '452001' },
  BENGALI_SQUARE: { latitude: 22.7185, longitude: 75.9082, neighborhood: 'Bengali Square, Indore', pincode: '452016' },
  GEETA_BHAWAN: { latitude: 22.7161, longitude: 75.8835, neighborhood: 'Geeta Bhawan, Indore', pincode: '452001' },
  KHAJRANA: { latitude: 22.7362, longitude: 75.9038, neighborhood: 'Khajrana, Indore', pincode: '452016' },
  KANADIA_ROAD: { latitude: 22.7212, longitude: 75.9125, neighborhood: 'Kanadia Road, Indore', pincode: '452016' },
  MR_10: { latitude: 22.7621, longitude: 75.8785, neighborhood: 'MR 10, Indore', pincode: '452010' },
  SUPER_CORRIDOR: { latitude: 22.7562, longitude: 75.8051, neighborhood: 'Super Corridor, Indore', pincode: '452005' },
  SILICON_CITY: { latitude: 22.6355, longitude: 75.8182, neighborhood: 'Silicon City, Indore', pincode: '453331' },
  BICHOLI_MARDANA: { latitude: 22.7051, longitude: 75.9221, neighborhood: 'Bicholi Mardana, Indore', pincode: '452016' },
  LIG_COLONY: { latitude: 22.7378, longitude: 75.8875, neighborhood: 'LIG Colony, Indore', pincode: '452011' },
  MIG_COLONY: { latitude: 22.7335, longitude: 75.8852, neighborhood: 'MIG Colony, Indore', pincode: '452001' },
  AIRPORT_ROAD: { latitude: 22.7291, longitude: 75.8234, neighborhood: 'Airport Road, Indore', pincode: '452005' },
  JUNI_INDORE: { latitude: 22.7118, longitude: 75.8562, neighborhood: 'Juni Indore, Indore', pincode: '452007' },
  CHANDAN_NAGAR: { latitude: 22.7135, longitude: 75.8288, neighborhood: 'Chandan Nagar, Indore', pincode: '452002' },
  DEWAS_NAKA: { latitude: 22.7842, longitude: 75.8972, neighborhood: 'Dewas Naka, Indore', pincode: '452010' },
  MUSAKHEDI: { latitude: 22.7015, longitude: 75.9015, neighborhood: 'Musakhedi, Indore', pincode: '452001' },
  SANWER_ROAD: { latitude: 22.7695, longitude: 75.8451, neighborhood: 'Sanwer Road, Indore', pincode: '452015' }
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
        return INDORE_NEIGHBORHOODS.VIJAY_NAGAR;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        neighborhood: 'Detected GPS Location, Indore'
      };
    } catch {
      return INDORE_NEIGHBORHOODS.VIJAY_NAGAR;
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
