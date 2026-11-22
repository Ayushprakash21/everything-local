import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CustomerHome } from './views/customer/CustomerHome';
import { StorefrontView } from './views/customer/StorefrontView';
import { CartCheckoutDrawer } from './views/customer/CartCheckoutDrawer';
import { CustomerOrdersView } from './views/customer/CustomerOrdersView';
import { OrderTrackingView } from './views/customer/OrderTrackingView';
import { MerchantDashboard } from './views/merchant/MerchantDashboard';
import { AdminDashboard } from './views/admin/AdminDashboard';
import { AuthModal } from './views/auth/AuthModal';
import { request } from './api/client';
import { Cart, Order } from './types';

function MainLayout() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'customer' | 'merchant' | 'admin' | 'orders'>('customer');
  const [selectedLocation, setSelectedLocation] = useState<string>('Palasia, Indore');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch cart count
  const updateCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const res = await request<{ cart: Cart }>('/customer/cart');
      const count = res.cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();
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
      await updateCartCount();
      setIsCartOpen(true);
    } catch (err: any) {
      if (err.data?.storeConflict) {
        if (confirm(err.data.message)) {
          await request('/customer/cart', { method: 'DELETE' });
          await request('/customer/cart/items', {
            method: 'POST',
            body: JSON.stringify({ storeId, productId, quantity: 1 })
          });
          await updateCartCount();
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
    updateCartCount();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-center text-xs text-slate-500">
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
