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
  brand?: string;
  packageSize?: string;
  barcode?: string;
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

export interface CustomerAddress {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  landmark?: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

export interface GeocodedLocation {
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

export interface ServiceabilityInfo {
  customerLocation: { latitude: number; longitude: number };
  isAnyStoreServiceable: boolean;
  serviceableStoreCount: number;
  totalStoreCount: number;
  nearestStoreDistanceKm: number;
  deliveryEta: string;
}

// ==========================================
// LOCAL SERVICES MARKETPLACE INTERFACES
// ==========================================

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  _count?: { services: number };
}

export interface ProviderStaff {
  id: string;
  providerId: string;
  name: string;
  role: string;
  phone?: string;
  isActive: boolean;
}

export interface ServiceListing {
  id: string;
  providerId: string;
  categoryId: string;
  category?: ServiceCategory;
  title: string;
  description?: string;
  imageUrl?: string;
  pricePaise: number;
  mrpPaise?: number;
  pricingType: 'FIXED' | 'STARTING_FROM' | 'INSPECTION_FEE';
  durationMinutes: number;
  allowsShopVisit: boolean;
  allowsHomeVisit: boolean;
  materialIncluded: boolean;
  isActive: boolean;
}

export interface ServiceProvider {
  id: string;
  ownerId: string;
  businessName: string;
  slug: string;
  description?: string;
  profileImageUrl?: string;
  contactPhone: string;
  contactEmail?: string;
  categorySlug: string;
  isVerified: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  commissionRatePct: number;
  rating: number;
  reviewCount: number;
  hasShopVisit: boolean;
  shopAddressLine?: string;
  shopCity: string;
  shopPincode?: string;
  shopLatitude?: number;
  shopLongitude?: number;
  hasHomeVisit: boolean;
  homeVisitRadiusKm: number;
  homeVisitFeePaise: number;
  distanceKm?: number;
  isHomeVisitServiceable?: boolean;
  isShopVisitServiceable?: boolean;
  servicesCount?: number;
  featuredServices?: ServiceListing[];
  services?: ServiceListing[];
  staff?: ProviderStaff[];
  reviews?: ServiceReview[];
}

export interface BookingStatusEvent {
  id: string;
  bookingId: string;
  status: string;
  actorId?: string;
  actorRole?: string;
  note?: string;
  createdAt: string;
}

export interface ServiceReview {
  id: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  customer?: { id: string; name: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ServiceBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customer?: { id: string; name: string; phone?: string; email?: string };
  providerId: string;
  provider: ServiceProvider;
  serviceId: string;
  service: ServiceListing;
  staffId?: string;
  staff?: ProviderStaff;
  fulfillmentType: 'SHOP_VISIT' | 'HOME_VISIT';
  bookingDate: string;
  timeSlot: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'PROVIDER_ASSIGNED' | 'PROVIDER_EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'NO_SHOW' | 'REFUNDED';
  customerAddressLine?: string;
  customerLocality?: string;
  customerCity: string;
  customerPincode?: string;
  customerLat?: number;
  customerLng?: number;
  instructions?: string;
  serviceFeePaise: number;
  travelFeePaise: number;
  materialFeePaise: number;
  discountPaise: number;
  totalAmountPaise: number;
  commissionPaise: number;
  providerPayablePaise: number;
  platformRevenuePaise: number;
  paymentStatus: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  events?: BookingStatusEvent[];
  review?: ServiceReview;
}

export interface ProviderEarning {
  id: string;
  providerId: string;
  bookingId?: string;
  amountPaise: number;
  commissionPaise: number;
  netEarningPaise: number;
  payoutStatus: string;
  reference?: string;
  createdAt: string;
}


