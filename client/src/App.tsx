import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CustomerHome, SHOPPING_CATEGORIES } from './views/customer/CustomerHome';
import { StorefrontView } from './views/customer/StorefrontView';
import { CartCheckoutDrawer } from './views/customer/CartCheckoutDrawer';
import { CustomerOrdersView } from './views/customer/CustomerOrdersView';
import { OrderTrackingView } from './views/customer/OrderTrackingView';
import { MerchantDashboard } from './views/merchant/MerchantDashboard';
import { AdminDashboard } from './views/admin/AdminDashboard';
import { AuthModal } from './views/auth/AuthModal';
import { request } from './api/client';
import { Cart, Order } from './types';
import {
  Home,
  LayoutGrid,
  Search,
  Package,
  User,
  ShoppingBag,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';

function MainLayout() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'customer' | 'merchant' | 'admin' | 'orders'>('customer');
  const [selectedLocation, setSelectedLocation] = useState<string>('Palasia, Indore');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isCategoriesSheetOpen, setIsCategoriesSheetOpen] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartTotalPaise, setCartTotalPaise] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch cart details
  const updateCartDetails = async () => {
    if (!user) {
      setCartCount(0);
      setCartTotalPaise(0);
      return;
    }
    try {
      const res = await request<{ cart: Cart }>('/customer/cart');
      const count = res.cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const total = res.cart.items.reduce((sum, item) => sum + item.quantity * item.unitPricePaise, 0);
      setCartCount(count);
      setCartTotalPaise(total);
    } catch {
      setCartCount(0);
      setCartTotalPaise(0);
    }
  };

  useEffect(() => {
    updateCartDetails();
  }, [user, isCartOpen]);

  const handleAddToCart = async (storeId: string, productId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    try {
      await request('/customer/cart/items', {
        method: 'POST',
        body: JSON.stringify({ storeId, productId, quantity: 1 })
      });
      await updateCartDetails();
      setIsCartOpen(true);
    } catch (err: any) {
      if (err.data?.storeConflict) {
        if (confirm(err.data.message)) {
          await request('/customer/cart', { method: 'DELETE' });
          await request('/customer/cart/items', {
            method: 'POST',
            body: JSON.stringify({ storeId, productId, quantity: 1 })
          });
          await updateCartDetails();
          setIsCartOpen(true);
        }
      } else {
        alert(err.message || 'Could not add to cart');
      }
    }
  };

  const handleOrderSuccess = (order: Order) => {
    setSelectedOrder(order);
    setCurrentTab('orders');
    updateCartDetails();
  };

  const handleSelectCategoryFromSheet = (catId: string) => {
    setIsCategoriesSheetOpen(false);
    setCurrentTab('customer');
    setSelectedStoreId(null);
    // Find category keyword to trigger search or filter
    const cat = SHOPPING_CATEGORIES.find((c) => c.id === catId);
    if (cat) {
      setSearchQuery(cat.keywords[0]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-16 md:pb-0">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedStoreId(null);
          setSelectedOrder(null);
        }}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        cartCount={cartCount}
        openCart={() => setIsCartOpen(true)}
        openAuth={() => setIsAuthOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          if (currentTab !== 'customer') setCurrentTab('customer');
          if (selectedStoreId) setSelectedStoreId(null);
        }}
      />

      <main className="flex-1">
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
                selectedLocation={selectedLocation}
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
          <MerchantDashboard openAuth={() => setIsAuthOpen(true)} />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard openAuth={() => setIsAuthOpen(true)} />
        )}
      </main>

      {/* Floating Bottom Cart Bar (Mobile) */}
      {cartCount > 0 && currentTab === 'customer' && (
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

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            setCurrentTab('customer');
            setSelectedStoreId(null);
            setSearchQuery('');
          }}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            currentTab === 'customer' && !selectedStoreId
              ? 'text-amber-600 font-black'
              : 'text-slate-500 hover:text-slate-900 font-semibold'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setIsCategoriesSheetOpen(true)}
          className="flex flex-col items-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-900 font-semibold transition"
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Categories</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('customer');
            setSelectedStoreId(null);
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            searchInput?.focus();
          }}
          className="flex flex-col items-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-900 font-semibold transition"
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Search</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('orders');
            setSelectedStoreId(null);
          }}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
            currentTab === 'orders'
              ? 'text-amber-600 font-black'
              : 'text-slate-500 hover:text-slate-900 font-semibold'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Orders</span>
        </button>

        <button
          onClick={() => {
            if (user) {
              if (user.role === 'MERCHANT') setCurrentTab('merchant');
              else if (user.role === 'ADMIN') setCurrentTab('admin');
              else setCurrentTab('orders');
            } else {
              setIsAuthOpen(true);
            }
          }}
          className="flex flex-col items-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-900 font-semibold transition"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{user ? 'Account' : 'Sign In'}</span>
        </button>
      </nav>

      {/* Categories Sheet / Modal */}
      {isCategoriesSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">All Categories</h3>
                  <p className="text-xs text-slate-500">Shop by department in Indore</p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoriesSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SHOPPING_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategoryFromSheet(cat.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border ${cat.bgColor} ${cat.borderColor} text-left transition hover:scale-102`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className={`text-xs font-extrabold ${cat.textColor} leading-tight`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <CartCheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={handleOrderSuccess}
        openAuth={() => setIsAuthOpen(true)}
        isLoggedIn={!!user}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white border-t border-slate-200 mt-12 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="font-extrabold text-slate-800 text-sm">Everything Local</div>
          <p className="italic">Shop more. Save more. Live better.</p>
          <p className="text-slate-400">
            Initial Pilot: Indore, Madhya Pradesh • Hyperlocal 3.0 km Neighbourhood Retail Network
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
