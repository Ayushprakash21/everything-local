import { GeospatialEngine, Coordinates } from './geospatial';

export interface IndoreLocality {
  id: string;
  name: string;
  subLocality?: string;
  road?: string;
  zone: string;
  pincode: string;
  latitude: number;
  longitude: number;
  popular: boolean;
  keywords: string[];
}

export interface GeocodedAddress {
  id: string;
  name: string;
  locality: string;
  subLocality?: string;
  road?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  isServiceable?: boolean;
}

// Comprehensive Indore Locality Knowledge Base
export const INDORE_LOCALITIES: IndoreLocality[] = [
  // --- Central Indore ---
  {
    id: 'palasia',
    name: 'Palasia',
    subLocality: 'Old Palasia / Industry House',
    road: 'AB Road',
    zone: 'Central Indore',
    pincode: '452001',
    latitude: 22.7244,
    longitude: 75.8839,
    popular: true,
    keywords: ['palasia', 'old palasia', 'new palasia', 'industry house', '56 dukan', 'chhappan', '452001']
  },
  {
    id: 'new-palasia',
    name: 'New Palasia',
    subLocality: 'Janjeerwala Square / Manorama Ganj',
    road: 'Race Course Road',
    zone: 'Central Indore',
    pincode: '452001',
    latitude: 22.7289,
    longitude: 75.8812,
    popular: true,
    keywords: ['new palasia', 'janjeerwala', 'manorama ganj', 'curewell', 'race course', '452001']
  },
  {
    id: 'rajwada',
    name: 'Rajwada',
    subLocality: 'Sarafa / Khajuri Bazar',
    road: 'MG Road',
    zone: 'Central Indore',
    pincode: '452002',
    latitude: 22.7196,
    longitude: 75.8577,
    popular: true,
    keywords: ['rajwada', 'sarafa', 'bada sarafa', 'chhota sarafa', 'cloth market', 'mg road', '452002']
  },
  {
    id: 'geeta-bhawan',
    name: 'Geeta Bhawan',
    subLocality: 'Manoramaganj / Navlakha Road',
    road: 'AB Road',
    zone: 'Central Indore',
    pincode: '452001',
    latitude: 22.7161,
    longitude: 75.8835,
    popular: true,
    keywords: ['geeta bhawan', 'gitabhawan', 'ab road', 'manoramaganj', 'dhawan hospital', '452001']
  },
  {
    id: 'juni-indore',
    name: 'Juni Indore',
    subLocality: 'Raoji Bazar / Machhi Bazar',
    road: 'Jawahar Marg',
    zone: 'Central Indore',
    pincode: '452007',
    latitude: 22.7118,
    longitude: 75.8562,
    popular: false,
    keywords: ['juni indore', 'raoji bazar', 'machhi bazar', 'south tukoganj', '452007']
  },
  {
    id: 'south-tukoganj',
    name: 'South Tukoganj',
    subLocality: 'Nath Mandir / Hotel Shreemaya',
    road: 'RNT Marg',
    zone: 'Central Indore',
    pincode: '452001',
    latitude: 22.7188,
    longitude: 75.8752,
    popular: true,
    keywords: ['south tukoganj', 'shreemaya', 'rnt marg', 'madhumilan', 'indore station', '452001']
  },

  // --- East Indore ---
  {
    id: 'vijay-nagar',
    name: 'Vijay Nagar',
    subLocality: 'C21 Mall / Malhar Mega Mall',
    road: 'AB Road',
    zone: 'East Indore',
    pincode: '452010',
    latitude: 22.7533,
    longitude: 75.8937,
    popular: true,
    keywords: ['vijay nagar', 'c21', 'malhar', 'sayaji', 'bhamori', 'satya sai', '452010']
  },
  {
    id: 'scheme-54',
    name: 'Scheme 54',
    subLocality: 'PU4 Commercial / Meghdoot Garden',
    road: 'Ring Road',
    zone: 'East Indore',
    pincode: '452010',
    latitude: 22.7578,
    longitude: 75.8872,
    popular: true,
    keywords: ['scheme 54', 'meghdoot', 'pu4', 'orbit mall', 'rasoma', '452010']
  },
  {
    id: 'scheme-78',
    name: 'Scheme 78',
    subLocality: 'Part 2 / Aranya Nagar',
    road: 'Dewas Naka Road',
    zone: 'East Indore',
    pincode: '452010',
    latitude: 22.7661,
    longitude: 75.8935,
    popular: true,
    keywords: ['scheme 78', 'aranya', 'prestige', 'shalimar township', '452010']
  },
  {
    id: 'saket-nagar',
    name: 'Saket Nagar',
    subLocality: 'Old Saket / Anand Bazar',
    road: 'Kanadia Road',
    zone: 'East Indore',
    pincode: '452018',
    latitude: 22.7208,
    longitude: 75.8942,
    popular: true,
    keywords: ['saket', 'saket nagar', 'anand bazar', 'goyal nagar', 'tilak nagar', '452018']
  },
  {
    id: 'bengali-square',
    name: 'Bengali Square',
    subLocality: 'Goyal Nagar / Kanadia',
    road: 'Ring Road',
    zone: 'East Indore',
    pincode: '452016',
    latitude: 22.7185,
    longitude: 75.9082,
    popular: true,
    keywords: ['bengali square', 'bengali chouraha', 'kanadia', 'ring road', '452016']
  },
  {
    id: 'khajrana',
    name: 'Khajrana',
    subLocality: 'Khajrana Ganesh Temple / Goyal Vihar',
    road: 'Khajrana Main Road',
    zone: 'East Indore',
    pincode: '452016',
    latitude: 22.7362,
    longitude: 75.9038,
    popular: true,
    keywords: ['khajrana', 'khajrana ganesh', 'star chouraha', 'goyal vihar', '452016']
  },
  {
    id: 'mahalaxmi-nagar',
    name: 'Mahalaxmi Nagar',
    subLocality: 'Bombay Hospital Area',
    road: 'Ring Road',
    zone: 'East Indore',
    pincode: '452010',
    latitude: 22.7645,
    longitude: 75.9021,
    popular: true,
    keywords: ['mahalaxmi nagar', 'bombay hospital', 'tulsi nagar', 'ring road', '452010']
  },
  {
    id: 'nipania',
    name: 'Nipania',
    subLocality: 'Apollo DB City / Silver Springs',
    road: 'Bypass Road',
    zone: 'East Indore',
    pincode: '452010',
    latitude: 22.7689,
    longitude: 75.9142,
    popular: true,
    keywords: ['nipania', 'apollo db city', 'db pride', 'bypass', '452010']
  },
  {
    id: 'bicholi-mardana',
    name: 'Bicholi Mardana',
    subLocality: 'Silver Springs / Agrawal Public School',
    road: 'Bypass Road',
    zone: 'East Indore',
    pincode: '452016',
    latitude: 22.7051,
    longitude: 75.9221,
    popular: true,
    keywords: ['bicholi mardana', 'bicholi hapsi', 'silver springs', 'bypass', '452016']
  },
  {
    id: 'lig-colony',
    name: 'LIG Colony',
    subLocality: 'LIG Square / Patnipura',
    road: 'AB Road',
    zone: 'East Indore',
    pincode: '452011',
    latitude: 22.7378,
    longitude: 75.8875,
    popular: true,
    keywords: ['lig', 'lig colony', 'lig square', 'patnipura', 'mig colony', '452011']
  },
  {
    id: 'mig-colony',
    name: 'MIG Colony',
    subLocality: 'Sardar Patel Marg / Christian College',
    road: 'AB Road',
    zone: 'East Indore',
    pincode: '452001',
    latitude: 22.7335,
    longitude: 75.8852,
    popular: false,
    keywords: ['mig', 'mig colony', 'patnipura', 'nehru stadium', '452001']
  },

  // --- South & South-West Indore ---
  {
    id: 'bhawarkua',
    name: 'Bhawarkua',
    subLocality: 'Holkar Science / DAVV Campus',
    road: 'Bhanwarkuan Main Road',
    zone: 'South Indore',
    pincode: '452014',
    latitude: 22.6926,
    longitude: 75.8676,
    popular: true,
    keywords: ['bhawarkua', 'bhanwarkuan', 'davv', 'vishnu puri', 'rajiv gandhi', '452014']
  },
  {
    id: 'sapna-sangeeta',
    name: 'Sapna Sangeeta',
    subLocality: 'Sneha Nagar / Tower Square',
    road: 'Sapna Sangeeta Road',
    zone: 'South Indore',
    pincode: '452001',
    latitude: 22.7042,
    longitude: 75.8711,
    popular: true,
    keywords: ['sapna sangeeta', 'sneha nagar', 'tower square', 'khatiwala tank', '452001']
  },
  {
    id: 'annapurna',
    name: 'Annapurna',
    subLocality: 'Annapurna Temple / Narendra Tiwari Marg',
    road: 'Annapurna Road',
    zone: 'South-West Indore',
    pincode: '452009',
    latitude: 22.7011,
    longitude: 75.8341,
    popular: true,
    keywords: ['annapurna', 'annapurna road', 'usha nagar', 'narendra tiwari marg', '452009']
  },
  {
    id: 'sudama-nagar',
    name: 'Sudama Nagar',
    subLocality: 'Sector E & D / Footi Kothi Road',
    road: 'Ring Road',
    zone: 'South-West Indore',
    pincode: '452009',
    latitude: 22.6935,
    longitude: 75.8252,
    popular: true,
    keywords: ['sudama nagar', 'footi kothi', 'gopur', 'ranjeet hanuman', '452009']
  },
  {
    id: 'rau',
    name: 'Rau',
    subLocality: 'Silicon City / CAT RRCAT',
    road: 'Indore-Mhow Road',
    zone: 'South-West Indore',
    pincode: '453331',
    latitude: 22.6288,
    longitude: 75.8115,
    popular: true,
    keywords: ['rau', 'silicon city', 'cat', 'rrcat', 'iim', 'iim indore', 'treasure fantasy', '453331']
  },

  // --- West & North Indore ---
  {
    id: 'airport-road',
    name: 'Airport Road',
    subLocality: 'Kalani Nagar / Bada Bangarda',
    road: 'Airport Road',
    zone: 'West Indore',
    pincode: '452005',
    latitude: 22.7291,
    longitude: 75.8234,
    popular: true,
    keywords: ['airport', 'airport road', 'kalani nagar', 'devi ahilya airport', 'aerodrome', '452005']
  },
  {
    id: 'chandan-nagar',
    name: 'Chandan Nagar',
    subLocality: 'Dhar Road / Gangwal Bus Stand',
    road: 'Dhar Road',
    zone: 'West Indore',
    pincode: '452002',
    latitude: 22.7135,
    longitude: 75.8288,
    popular: false,
    keywords: ['chandan nagar', 'dhar road', 'gangwal', 'malharganj', '452002']
  },
  {
    id: 'super-corridor',
    name: 'Super Corridor',
    subLocality: 'TCS / Infosys Campus',
    road: 'Super Corridor Road',
    zone: 'West Indore',
    pincode: '452005',
    latitude: 22.7562,
    longitude: 75.8051,
    popular: true,
    keywords: ['super corridor', 'tcs', 'infosys', 'symbiosis', 'narsee monjee', '452005']
  },
  {
    id: 'mr-10',
    name: 'MR 10',
    subLocality: 'MR 10 Junction / Chandra Gupta Square',
    road: 'MR 10 Road',
    zone: 'North Indore',
    pincode: '452010',
    latitude: 22.7621,
    longitude: 75.8785,
    popular: true,
    keywords: ['mr 10', 'mr10', 'chandra gupta', 'radisson', 'kumedi', '452010']
  },
  {
    id: 'dewas-naka',
    name: 'Dewas Naka',
    subLocality: 'Lasudia Mori / Niranjanpur',
    road: 'AB Road',
    zone: 'North Indore',
    pincode: '452010',
    latitude: 22.7842,
    longitude: 75.8972,
    popular: true,
    keywords: ['dewas naka', 'lasudia', 'niranjanpur', 'manglia', 'ab road', '452010']
  },
  {
    id: 'sanwer-road',
    name: 'Sanwer Road',
    subLocality: 'Industrial Area Sector A / B / C',
    road: 'Sanwer Road',
    zone: 'North Indore',
    pincode: '452015',
    latitude: 22.7695,
    longitude: 75.8451,
    popular: false,
    keywords: ['sanwer road', 'pologround', 'industrial area', 'banganga', 'marimata', '452015']
  },
  {
    id: 'musakhedi',
    name: 'Musakhedi',
    subLocality: 'Ring Road / Azad Nagar',
    road: 'Nemawar Road',
    zone: 'East Indore',
    pincode: '452001',
    latitude: 22.7015,
    longitude: 75.9015,
    popular: false,
    keywords: ['musakhedi', 'musa khedi', 'nemawar road', 'azad nagar', 'ring road', '452001']
  }
];

// Simple in-memory cache to respect external rate limits and provide instant response
const geocodeCache = new Map<string, GeocodedAddress[]>();
const reverseCache = new Map<string, GeocodedAddress>();
let lastExternalCallTime = 0;

export class IndoreLocationEngine {
  /**
   * Search Indore localities and addresses by keyword, locality, or PIN code
   */
  public static async searchAddresses(query: string): Promise<GeocodedAddress[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return this.getPopularLocalities();
    }

    const cacheKey = `search:${q}`;
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey)!;
    }

    // 1. Search local indexed database
    const matched = INDORE_LOCALITIES.filter((loc) => {
      if (loc.pincode.startsWith(q) || loc.pincode === q) return true;
      if (loc.name.toLowerCase().includes(q)) return true;
      if (loc.subLocality?.toLowerCase().includes(q)) return true;
      if (loc.road?.toLowerCase().includes(q)) return true;
      if (loc.zone.toLowerCase().includes(q)) return true;
      return loc.keywords.some((k) => k.includes(q) || q.includes(k));
    });

    const results: GeocodedAddress[] = matched.map((loc) => ({
      id: `indore-${loc.id}`,
      name: `${loc.name}, Indore`,
      locality: loc.name,
      subLocality: loc.subLocality,
      road: loc.road,
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: loc.pincode,
      latitude: loc.latitude,
      longitude: loc.longitude,
      formattedAddress: `${loc.subLocality ? loc.subLocality + ', ' : ''}${loc.name}, Indore, MP - ${loc.pincode}`
    }));

    // 2. If no direct local matches and query is at least 3 characters, query OpenStreetMap Nominatim with rate limiting
    if (results.length === 0 && q.length >= 3) {
      try {
        const externalResults = await this.queryNominatim(q);
        if (externalResults.length > 0) {
          geocodeCache.set(cacheKey, externalResults);
          return externalResults;
        }
      } catch (err) {
        console.warn('Nominatim geocode query skipped/failed:', err);
      }
    }

    geocodeCache.set(cacheKey, results);
    return results;
  }

  /**
   * Reverse geocode GPS coordinates into human-readable locality, street, city & PIN code
   */
  public static async reverseGeocode(coord: Coordinates): Promise<GeocodedAddress> {
    const roundedLat = Math.round(coord.latitude * 1000) / 1000;
    const roundedLng = Math.round(coord.longitude * 1000) / 1000;
    const cacheKey = `rev:${roundedLat},${roundedLng}`;

    if (reverseCache.has(cacheKey)) {
      return reverseCache.get(cacheKey)!;
    }

    // Check closest pre-indexed Indore locality
    let closestLocality = INDORE_LOCALITIES[0];
    let minDistanceKm = GeospatialEngine.calculateDistanceKm(
      { latitude: closestLocality.latitude, longitude: closestLocality.longitude },
      coord
    );

    for (const loc of INDORE_LOCALITIES) {
      const d = GeospatialEngine.calculateDistanceKm(
        { latitude: loc.latitude, longitude: loc.longitude },
        coord
      );
      if (d < minDistanceKm) {
        minDistanceKm = d;
        closestLocality = loc;
      }
    }

    // If coordinates are very close to a landmark (< 0.8 km), use local high-precision metadata
    if (minDistanceKm <= 0.8) {
      const result: GeocodedAddress = {
        id: `indore-${closestLocality.id}`,
        name: `${closestLocality.name}, Indore`,
        locality: closestLocality.name,
        subLocality: closestLocality.subLocality,
        road: closestLocality.road,
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: closestLocality.pincode,
        latitude: coord.latitude,
        longitude: coord.longitude,
        formattedAddress: `${closestLocality.subLocality ? closestLocality.subLocality + ', ' : ''}${closestLocality.name}, Indore, MP - ${closestLocality.pincode}`
      };
      reverseCache.set(cacheKey, result);
      return result;
    }

    // Otherwise, try OpenStreetMap reverse geocoding
    try {
      const external = await this.queryNominatimReverse(coord);
      if (external) {
        reverseCache.set(cacheKey, external);
        return external;
      }
    } catch (err) {
      console.warn('Nominatim reverse geocode failed, using nearest landmark:', err);
    }

    // Fallback: Return nearest Indore landmark with precise coordinates
    const fallback: GeocodedAddress = {
      id: `indore-${closestLocality.id}`,
      name: `${closestLocality.name}, Indore`,
      locality: closestLocality.name,
      subLocality: closestLocality.subLocality,
      road: closestLocality.road,
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: closestLocality.pincode,
      latitude: coord.latitude,
      longitude: coord.longitude,
      formattedAddress: `${closestLocality.name} area, Indore, MP - ${closestLocality.pincode} (${minDistanceKm.toFixed(1)} km from landmark)`
    };

    reverseCache.set(cacheKey, fallback);
    return fallback;
  }

  /**
   * Get popular curated Indore hubs for 1-tap fast selection
   */
  public static getPopularLocalities(): GeocodedAddress[] {
    return INDORE_LOCALITIES.filter((l) => l.popular).map((loc) => ({
      id: `indore-${loc.id}`,
      name: `${loc.name}, Indore`,
      locality: loc.name,
      subLocality: loc.subLocality,
      road: loc.road,
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: loc.pincode,
      latitude: loc.latitude,
      longitude: loc.longitude,
      formattedAddress: `${loc.subLocality ? loc.subLocality + ', ' : ''}${loc.name}, Indore - ${loc.pincode}`
    }));
  }

  /**
   * Safe, throttled query to OpenStreetMap Nominatim for arbitrary Indore queries
   */
  private static async queryNominatim(query: string): Promise<GeocodedAddress[]> {
    const now = Date.now();
    if (now - lastExternalCallTime < 1000) {
      // Throttle to max 1 call per second
      await new Promise((resolve) => setTimeout(resolve, 1000 - (now - lastExternalCallTime)));
    }
    lastExternalCallTime = Date.now();

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Indore, Madhya Pradesh')}&format=json&addressdetails=1&limit=5&countrycodes=in`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'EverythingLocal-HyperlocalApp/1.0 (contact: info@everythinglocal.in)'
      }
    });

    if (!res.ok) return [];
    const data = (await res.json()) as any[];
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        // Indore bounding box check: lat 22.5 to 22.9, lon 75.6 to 76.1
        return lat >= 22.5 && lat <= 22.9 && lon >= 75.6 && lon <= 76.1;
      })
      .map((item, idx) => {
        const addr = item.address || {};
        const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.road || item.display_name.split(',')[0];
        const pincode = addr.postcode || '452001';
        return {
          id: `osm-${item.place_id || idx}`,
          name: `${locality}, Indore`,
          locality,
          subLocality: addr.neighbourhood || addr.suburb,
          road: addr.road,
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          formattedAddress: item.display_name
        };
      });
  }

  /**
   * Safe query to OpenStreetMap reverse geocoding
   */
  private static async queryNominatimReverse(coord: Coordinates): Promise<GeocodedAddress | null> {
    const now = Date.now();
    if (now - lastExternalCallTime < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - (now - lastExternalCallTime)));
    }
    lastExternalCallTime = Date.now();

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${coord.latitude}&lon=${coord.longitude}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'EverythingLocal-HyperlocalApp/1.0 (contact: info@everythinglocal.in)'
      }
    });

    if (!res.ok) return null;
    const item = (await res.json()) as any;
    if (!item || !item.address) return null;

    const addr = item.address;
    const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.commercial || addr.road || 'Indore';
    const subLocality = addr.neighbourhood || addr.residential;
    const road = addr.road;
    const pincode = addr.postcode || '452001';

    return {
      id: `osm-rev-${item.place_id || Date.now()}`,
      name: `${locality}, Indore`,
      locality,
      subLocality,
      road,
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode,
      latitude: coord.latitude,
      longitude: coord.longitude,
      formattedAddress: item.display_name
    };
  }
}
