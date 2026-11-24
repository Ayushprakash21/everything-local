export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  storeId?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  addressLine: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  isOpen: boolean;
  isVerified: boolean;
  commissionRatePct: number;
  distanceKm?: number;
  isServiceable?: boolean;
  isPickupAvailable?: boolean;
  rating?: number;
  reviewCount?: number;
  sampleProducts?: Product[];
  products?: Product[];
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  category: string;
  mrpPaise: number;
  pricePaise: number;
  stock: number;
  isAvailable: boolean;
  imageUrl?: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  packageSize?: string;
  store?: Store;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPricePaise: number;
}

export interface Cart {
  id: string;
  userId: string;
  storeId?: string;
  store?: Store;
  items: CartItem[];
}

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COLLECTED'
  | 'CANCELLED'
  | 'REFUNDED';

export type FulfillmentMode = 'PICKUP' | 'MERCHANT_DELIVERY' | 'PLATFORM_DELIVERY';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
  pricePaise?: number;
  totalPaise?: number;
  product?: Product;
}

export interface OrderEvent {
  id: string;
  status: string;
  actorId?: string;
  note?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  storeId: string;
  store: Store;
  customer?: { id: string; name: string; phone?: string };
  status: OrderStatus;
  fulfillmentMode: FulfillmentMode;
  itemSubtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  discountPaise: number;
  totalAmountPaise: number;
  commissionPaise: number;
  merchantPayablePaise: number;
  platformRevenuePaise: number;
  createdAt: string;
  items: OrderItem[];
  events: OrderEvent[];
}

export interface HouseholdItem {
  id: string;
  title: string;
  quantity: string;
  category: string;
  isCompleted: boolean;
  addedBy: string;
  suggestedStoreId?: string;
  matchedProductId?: string;
}

export interface LoyaltyProfile {
  pointsBalance: number;
  tier: 'SILVER' | 'GOLD' | 'PLATINUM';
  referralCode: string;
  referralCount: number;
  savingsPaiseThisMonth: number;
}

export interface PromoOffer {
  id: string;
  code: string;
  title: string;
  discountPaise: number;
  minOrderPaise: number;
  storeCategory?: string;
  description: string;
}
