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

// Pharmacy & Medical Ecosystem Views
import { PharmacyHomeView } from './views/pharmacy/PharmacyHomeView';
import { PharmacyPrescriptionUploadView } from './views/pharmacy/PharmacyPrescriptionUploadView';
import { CustomerPrescriptionsView } from './views/pharmacy/CustomerPrescriptionsView';
import { PharmacistConsoleView } from './views/pharmacy/PharmacistConsoleView';

// Version 1.0 Logistics & Lifestyle Views
import { RiderAppView } from './views/rider/RiderAppView';
import { HouseholdView } from './views/customer/HouseholdView';
import { CommunityDealsView } from './views/customer/CommunityDealsView';
import { AIAssistantModal } from './components/AIAssistantModal';
import { BrandLogo } from './components/BrandLogo';

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

  // Primary Ecosystem Discovery Mode: 'shop' vs 'services' vs 'pharmacy' vs 'rider'
  const [discoveryMode, setDiscoveryMode] = useState<'shop' | 'services' | 'pharmacy' | 'rider'>('shop');
  const [customerSubView, setCustomerSubView] = useState<'home' | 'household' | 'community'>('home');
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);

  // Shop navigation
  const [currentTab, setCurrentTab] = useState<'customer' | 'merchant' | 'admin' | 'orders'>('customer');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Services navigation
  const [servicesTab, setServicesTab] = useState<'explore' | 'bookings' | 'provider'>('explore');
  const [selectedServiceProviderId, setSelectedServiceProviderId] = useState<string | null>(null);

  // Pharmacy navigation
  const [pharmacyTab, setPharmacyTab] = useState<'explore' | 'upload' | 'prescriptions' | 'pharmacist'>('explore');

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
      if (result.conflictMessage === 'AUTH_REQUIRED') {
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-16 md:pb-0 overflow-x-hidden w-full">
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
        pharmacyTab={pharmacyTab}
        setPharmacyTab={(tab) => setPharmacyTab(tab)}
        cartCount={cartCount}
        openCart={() => setIsCartOpen(true)}
        openAuth={() => setIsAuthOpen(true)}
        openAI={() => setIsAIOpen(true)}
        openHousehold={() => {
          setDiscoveryMode('shop');
          setCurrentTab('customer');
          setCustomerSubView('household');
        }}
        openCommunity={() => {
          setDiscoveryMode('shop');
          setCurrentTab('customer');
          setCustomerSubView('community');
        }}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (discoveryMode === 'shop') {
            if (currentTab !== 'customer') setCurrentTab('customer');
            if (selectedStoreId) setSelectedStoreId(null);
          } else if (discoveryMode === 'services') {
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
                {customerSubView === 'household' ? (
                  <HouseholdView
                    onBack={() => setCustomerSubView('home')}
                    openAuth={() => setIsAuthOpen(true)}
                  />
                ) : customerSubView === 'community' ? (
                  <CommunityDealsView
                    onBack={() => setCustomerSubView('home')}
                    openAuth={() => setIsAuthOpen(true)}
                  />
                ) : selectedStoreId ? (
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
                    onNavigateToPharmacy={() => {
                      setDiscoveryMode('pharmacy');
                      setPharmacyTab('explore');
                    }}
                    onOpenPrescriptionUpload={() => {
                      setDiscoveryMode('pharmacy');
                      setPharmacyTab('upload');
                    }}
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

        {/* ==================================================== */}
        {/* 3. PHARMACY & MEDICAL MARKETPLACE ECOSYSTEM         */}
        {/* ==================================================== */}
        {discoveryMode === 'pharmacy' && (
          <>
            {pharmacyTab === 'explore' && (
              <PharmacyHomeView
                onOpenPrescriptionUpload={() => setPharmacyTab('upload')}
                onOpenMyPrescriptions={() => setPharmacyTab('prescriptions')}
                onOpenPharmacistConsole={() => setPharmacyTab('pharmacist')}
                openAuth={() => setIsAuthOpen(true)}
              />
            )}

            {pharmacyTab === 'upload' && (
              <PharmacyPrescriptionUploadView
                onBack={() => setPharmacyTab('explore')}
                onSuccess={(_rxId) => setPharmacyTab('prescriptions')}
                openAuth={() => setIsAuthOpen(true)}
              />
            )}

            {pharmacyTab === 'prescriptions' && (
              <CustomerPrescriptionsView
                onBack={() => setPharmacyTab('explore')}
                onOpenUpload={() => setPharmacyTab('upload')}
                openAuth={() => setIsAuthOpen(true)}
              />
            )}

            {pharmacyTab === 'pharmacist' && (
              <PharmacistConsoleView
                onBack={() => setPharmacyTab('explore')}
                openAuth={() => setIsAuthOpen(true)}
              />
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* 4. STANDALONE DELIVERY PARTNER (RIDER) APP          */}
        {/* ==================================================== */}
        {discoveryMode === 'rider' && (
          <RiderAppView openAuth={() => setIsAuthOpen(true)} />
        )}
      </main>

      {/* Global Application Footer with Brand Identity */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <BrandLogo variant="horizontal" size="medium" className="h-10 w-auto" />
            <div className="sm:border-l sm:border-slate-200 sm:pl-4">
              <p className="text-xs font-black text-slate-900">Hyperlocal Commerce &amp; Local Services Platform</p>
              <p className="text-[11px] text-slate-500">Initial Pilot: Indore, Madhya Pradesh • Palasia, Vijay Nagar, Bhawarkua &amp; 40+ localities</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-500">
            <span>© {new Date().getFullYear()} Everything Local</span>
            <span className="hidden sm:inline">•</span>
            <span>Shop more. Save more. Live better.</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Shopping Copilot Button (Shop Mode) */}
      {discoveryMode === 'shop' && currentTab === 'customer' && (
        <button
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-5 z-40 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs px-4 py-3 rounded-2xl shadow-float flex items-center gap-2 border border-amber-300 transition active:scale-95 group"
          title="Open AI Smart Basket Optimizer"
        >
          <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">AI Shopping Copilot</span>
        </button>
      )}

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

      {/* Global Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <BrandLogo size="md" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Hyperlocal neighbourhood commerce and instant services platform for Indore, Madhya Pradesh.
              </p>
              <div className="text-[11px] font-bold text-slate-400">
                Shop more. Save more. Live better.
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Shop Local</h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li><button onClick={() => { setDiscoveryMode('shop'); setCurrentTab('customer'); }} className="hover:text-emerald-700">Grocery & Daily Staples</button></li>
                <li><button onClick={() => { setDiscoveryMode('shop'); setCurrentTab('customer'); }} className="hover:text-emerald-700">Fresh Produce & Dairy</button></li>
                <li><button onClick={() => { setDiscoveryMode('pharmacy'); setCurrentTab('customer'); }} className="hover:text-emerald-700">Apollo & Local Pharmacy</button></li>
                <li><button onClick={() => { setDiscoveryMode('services'); setCurrentTab('customer'); }} className="hover:text-emerald-700">Home & Personal Services</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Partner With Us</h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li>
                  <button
                    onClick={() => {
                      setDiscoveryMode('shop');
                      setCurrentTab('merchant');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>Become a Merchant Partner</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </li>
                <li><button onClick={() => { setDiscoveryMode('rider'); setCurrentTab('customer'); }} className="hover:text-emerald-700">Drive with Us (Rider Partner)</button></li>
                <li><button onClick={() => { setDiscoveryMode('services'); setCurrentTab('customer'); }} className="hover:text-emerald-700">Service Provider Registration</button></li>
                <li><span className="text-slate-400">Indore Partner Desk: +91 731 400 8899</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Operations & Trust</h4>
              <ul className="text-xs text-slate-500 space-y-1.5 leading-relaxed">
                <li>Hub: Palasia & Vijay Nagar, Indore</li>
                <li>Service Radius: 3.0 km Instant Delivery</li>
                <li>Payments: UPI, Cards & Cash on Delivery</li>
                <li>Settlements: Daily T+1 IMPS/NEFT</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
            <p>© 2026 Everything Local Technologies Pvt Ltd. All rights reserved.</p>
            <p>Made for Indore • Local Supply Chain Engine v2.0</p>
          </div>
        </div>
      </footer>

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

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        openAuth={() => setIsAuthOpen(true)}
      />
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
