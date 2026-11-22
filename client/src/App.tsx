import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider, useLocation } from './context/LocationContext';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { LocationModal } from './components/LocationModal';
import { CustomerHome, SHOPPING_CATEGORIES } from './views/customer/CustomerHome';
import { StorefrontView } from './views/customer/StorefrontView';
import { CartCheckoutDrawer } from './views/customer/CartCheckoutDrawer';
import { CustomerOrdersView } from './views/customer/CustomerOrdersView';
import { OrderTrackingView } from './views/customer/OrderTrackingView';
import { MerchantDashboard } from './views/merchant/MerchantDashboard';
import { AdminDashboard } from './views/admin/AdminDashboard';
import { AuthModal } from './views/auth/AuthModal';

// Services Ecosystem Views
import { ServicesHomeView } from './views/services/ServicesHomeView';
import { ServiceProviderDetailView } from './views/services/ServiceProviderDetailView';
import { CustomerBookingsView } from './views/services/CustomerBookingsView';
import { ProviderConsoleView } from './views/services/ProviderConsoleView';

import { request } from './api/client';
import { Cart, Order, ServiceBooking } from './types';
import {
  Home,
  LayoutGrid,
  Search,
  Package,
  User,
  ShoppingBag,
  ArrowRight,
  X,
  Sparkles,
  Wrench,
  Calendar,
  Briefcase
} from 'lucide-react';

function MainLayout() {
  const { user } = useAuth();
  const { selectedLocation, setIsLocationModalOpen } = useLocation();

  // Primary Ecosystem Discovery Mode: 'shop' (retail) vs 'services' (service appointments)
  const [discoveryMode, setDiscoveryMode] = useState<'shop' | 'services'>('shop');

  // Shop navigation
  const [currentTab, setCurrentTab] = useState<'customer' | 'merchant' | 'admin' | 'orders'>('customer');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Services navigation
  const [servicesTab, setServicesTab] = useState<'explore' | 'bookings' | 'provider'>('explore');
  const [selectedServiceProviderId, setSelectedServiceProviderId] = useState<string | null>(null);

  const {
    cart,
    itemCount: cartCount,
    subtotalPaise: cartTotalPaise,
    isCartOpen,
    setIsCartOpen,
    addItem,
    updateQuantity,
    clearCart,
    refreshCart
  } = useCart();

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isCategoriesSheetOpen, setIsCategoriesSheetOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleAddToCart = async (storeId: string, productId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    const result = await addItem(storeId, productId, 1);
    if (!result.success) {
      if (result.conflictMessage?.includes('Single-store') || result.conflictMessage?.includes('contains items from')) {
        if (confirm(result.conflictMessage)) {
          await clearCart();
          await addItem(storeId, productId, 1);
        }
      } else if (result.conflictMessage === 'AUTH_REQUIRED') {
        setIsAuthOpen(true);
      } else {
        alert(result.conflictMessage || 'Could not add to cart');
      }
    }
  };

  const handleOrderSuccess = (order: Order) => {
    setSelectedOrder(order);
    setCurrentTab('orders');
    refreshCart();
  };

  const handleBookingSuccess = (booking: ServiceBooking) => {
    setSelectedServiceProviderId(null);
    setServicesTab('bookings');
  };

  const handleSelectCategoryFromSheet = (catId: string) => {
    setIsCategoriesSheetOpen(false);
    setDiscoveryMode('shop');
    setCurrentTab('customer');
    setSelectedStoreId(null);
    const cat = SHOPPING_CATEGORIES.find((c) => c.id === catId);
    if (cat) {
      setSearchQuery(cat.keywords[0]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-16 md:pb-0">
      <Navbar
        discoveryMode={discoveryMode}
        setDiscoveryMode={(mode) => {
          setDiscoveryMode(mode);
          setSelectedServiceProviderId(null);
          setSelectedStoreId(null);
          setSearchQuery('');
        }}
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedStoreId(null);
          setSelectedOrder(null);
        }}
        servicesTab={servicesTab}
        setServicesTab={(tab) => {
          setServicesTab(tab);
          setSelectedServiceProviderId(null);
        }}
        cartCount={cartCount}
        openCart={() => setIsCartOpen(true)}
        openAuth={() => setIsAuthOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (discoveryMode === 'shop') {
            if (currentTab !== 'customer') setCurrentTab('customer');
            if (selectedStoreId) setSelectedStoreId(null);
          } else {
            if (servicesTab !== 'explore') setServicesTab('explore');
            if (selectedServiceProviderId) setSelectedServiceProviderId(null);
          }
        }}
      />

      <main className="flex-1">
        {/* ==================================================== */}
        {/* 1. SHOP DISCOVERY ECOSYSTEM (RETAIL COMMERCE)       */}
        {/* ==================================================== */}
        {discoveryMode === 'shop' && (
          <>
            {currentTab === 'customer' && (
              <>
                {selectedStoreId ? (
                  <StorefrontView
                    storeId={selectedStoreId}
                    onBack={() => setSelectedStoreId(null)}
                    onAddToCart={handleAddToCart}
                  />
                ) : (
                  <CustomerHome
                    onSelectStore={(id) => setSelectedStoreId(id)}
                    onAddToCart={handleAddToCart}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onOpenCategories={() => setIsCategoriesSheetOpen(true)}
                  />
                )}
              </>
            )}

            {currentTab === 'orders' && (
              <>
                {selectedOrder ? (
                  <OrderTrackingView
                    order={selectedOrder}
                    onBack={() => setSelectedOrder(null)}
                  />
                ) : (
                  <CustomerOrdersView
                    onSelectOrder={(order) => setSelectedOrder(order)}
                    openAuth={() => setIsAuthOpen(true)}
                    isLoggedIn={!!user}
                  />
                )}
              </>
            )}

            {currentTab === 'merchant' && (
              <MerchantDashboard
                openAuth={() => setIsAuthOpen(true)}
                onReturnToShop={() => setCurrentTab('customer')}
              />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard openAuth={() => setIsAuthOpen(true)} />
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* 2. LOCAL SERVICES BOOKING ECOSYSTEM                 */}
        {/* ==================================================== */}
        {discoveryMode === 'services' && (
          <>
            {servicesTab === 'explore' && (
              <>
                {selectedServiceProviderId ? (
                  <ServiceProviderDetailView
                    providerId={selectedServiceProviderId}
                    onBack={() => setSelectedServiceProviderId(null)}
                    onBookingSuccess={handleBookingSuccess}
                    openAuth={() => setIsAuthOpen(true)}
                  />
                ) : (
                  <ServicesHomeView
                    onSelectProvider={(id) => setSelectedServiceProviderId(id)}
                    onOpenBookings={() => setServicesTab('bookings')}
                  />
                )}
              </>
            )}

            {servicesTab === 'bookings' && (
              <CustomerBookingsView
                openAuth={() => setIsAuthOpen(true)}
                onExploreServices={() => {
                  setServicesTab('explore');
                  setSelectedServiceProviderId(null);
                }}
              />
            )}

            {servicesTab === 'provider' && (
              <ProviderConsoleView openAuth={() => setIsAuthOpen(true)} />
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Mobile) - only active in shop mode */}
      {cartCount > 0 && discoveryMode === 'shop' && currentTab === 'customer' && (
        <div className="md:hidden fixed bottom-16 left-3 right-3 z-40 animate-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-forest-900 text-white rounded-2xl px-4 py-3 shadow-float flex items-center justify-between border border-forest-700/60"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                {cartCount}
              </div>
              <div className="text-left">
                <span className="text-xs font-black block">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart
                </span>
                <span className="text-[10px] text-emerald-200">
                  Total: ₹{(cartTotalPaise / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-black text-amber-300">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartCheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        openAuth={() => setIsAuthOpen(true)}
        isLoggedIn={!!user}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Indore Location Modal */}
      <LocationModal />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
export default App;
