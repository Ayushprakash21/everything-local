export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
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

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
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
  status: 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COLLECTED' | 'CANCELLED' | 'REFUNDED';
  fulfillmentMode: 'PICKUP' | 'MERCHANT_DELIVERY' | 'PLATFORM_DELIVERY';
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

export interface FinancialLedgerEntry {
  id: string;
  orderId?: string;
  order?: { id: string; orderNumber: string };
  storeId: string;
  store?: { id: string; name: string };
  entryType: string;
  amountPaise: number;
  runningBalancePaise: number;
  reference?: string;
  createdAt: string;
}
