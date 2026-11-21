/**
 * EVERYTHING LOCAL — PRODUCT CATALOGUE SERVICE
 * Open Food Facts Integration & Category Normalization Engine
 */

export interface CatalogueProduct {
  found: boolean;
  barcode?: string;
  name?: string;
  brand?: string;
  category?: string;
  rawCategory?: string;
  packageSize?: string;
  imageUrl?: string;
  licenseNotice?: string;
  source?: string;
  message?: string;
}

// In-memory cache to respect Open Food Facts rate limits and accelerate repeat lookups
const catalogueCache = new Map<string, { data: CatalogueProduct; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const USER_AGENT = 'EverythingLocal-HyperlocalCommerce/1.0.0 (https://everythinglocal.in; support@everythinglocal.in)';

/**
 * Normalizes external taxonomy to Everything Local's 5 Core Retail Categories:
 * 1. Grocery Staples
 * 2. Dairy & Bakery
 * 3. Vegetables & Fruits
 * 4. Edible Oils
 * 5. Beverages & Snacks
 */
export function normalizeCategory(categoriesStr?: string, productName?: string): string {
  const text = `${categoriesStr || ''} ${productName || ''}`.toLowerCase();

  if (/oil|ghee|mustard oil|sunflower|refined oil|vanaspati/i.test(text)) {
    return 'Edible Oils';
  }
  if (/milk|butter|cheese|paneer|dahi|curd|yogurt|bread|bakery|toast|rusk|cake|bun/i.test(text)) {
    return 'Dairy & Bakery';
  }
  if (/fruit|vegetable|onion|potato|tomato|apple|banana|mango|fresh produce/i.test(text)) {
    return 'Vegetables & Fruits';
  }
  if (/biscuit|cookie|chips|snack|noodle|pasta|chocolate|namkeen|beverage|tea|coffee|juice|soda|drink|sauce|ketchup/i.test(text)) {
    return 'Beverages & Snacks';
  }
  // Default fallback
  return 'Grocery Staples';
}

/**
 * Look up a product by GTIN / Barcode in Open Food Facts
 */
export async function lookupBarcode(barcode: string): Promise<CatalogueProduct> {
  const cleanBarcode = barcode.trim().replace(/[^0-9A-Za-z]/g, '');
  if (!cleanBarcode) {
    return {
      found: false,
      message: 'Invalid barcode provided'
    };
  }

  // Check cache
  const cached = catalogueCache.get(cleanBarcode);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const result: CatalogueProduct = {
        found: false,
        barcode: cleanBarcode,
        message: `Catalogue lookup returned HTTP ${response.status}`
      };
      return result;
    }

    const data: any = await response.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      const name = p.product_name_en || p.product_name || p.generic_name_en || p.generic_name || '';
      const brand = p.brands || p.brand_owner || '';
      const rawCategory = p.categories || '';
      const category = normalizeCategory(rawCategory, name);
      const packageSize = p.quantity || p.serving_size || undefined;
      const imageUrl = p.image_front_url || p.image_url || undefined;

      const result: CatalogueProduct = {
        found: true,
        source: 'Open Food Facts',
        barcode: cleanBarcode,
        name: name.trim() || undefined,
        brand: brand.trim() || undefined,
        category,
        rawCategory: rawCategory.split(',')[0]?.trim() || undefined,
        packageSize: packageSize?.trim() || undefined,
        imageUrl,
        licenseNotice: imageUrl ? 'Image courtesy of Open Food Facts contributors (ODbL / CC-BY-SA)' : undefined
      };

      catalogueCache.set(cleanBarcode, { data: result, timestamp: Date.now() });
      return result;
    } else {
      const result: CatalogueProduct = {
        found: false,
        barcode: cleanBarcode,
        message: 'Product not found in Open Food Facts catalogue'
      };
      // Cache negative lookup for 10 minutes to prevent spamming
      catalogueCache.set(cleanBarcode, { data: result, timestamp: Date.now() - (CACHE_TTL_MS - 600000) });
      return result;
    }
  } catch (err: any) {
    console.warn(`[Catalogue] Barcode lookup failed for ${cleanBarcode}:`, err.message);
    return {
      found: false,
      barcode: cleanBarcode,
      message: err.name === 'AbortError' ? 'Catalogue service timeout' : 'Unable to query external catalogue'
    };
  }
}

/**
 * Search products by keyword in Open Food Facts
 */
export async function searchCatalogue(query: string, pageSize: number = 5): Promise<CatalogueProduct[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const url = `https://in.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=${pageSize}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) return [];

    const data: any = await response.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    return data.products.map((p: any) => {
      const name = p.product_name_en || p.product_name || p.generic_name || '';
      const brand = p.brands || '';
      const rawCategory = p.categories || '';
      const category = normalizeCategory(rawCategory, name);
      const imageUrl = p.image_front_url || p.image_url || undefined;

      return {
        found: true,
        source: 'Open Food Facts',
        barcode: p.code,
        name: name.trim() || undefined,
        brand: brand.trim() || undefined,
        category,
        packageSize: p.quantity || undefined,
        imageUrl,
        licenseNotice: imageUrl ? 'Image courtesy of Open Food Facts contributors (ODbL / CC-BY-SA)' : undefined
      };
    });
  } catch (err: any) {
    console.warn(`[Catalogue] Keyword search failed for "${cleanQuery}":`, err.message);
    return [];
  }
}
