import React, { useState, useEffect } from 'react';
import { Cart, Order } from '../../types';
import { request, formatPaise } from '../../api/client';
import { ELLogo } from '../../components/ELLogo';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ShieldAlert,
  CheckCircle2,
  Bike,
  Store,
  ArrowRight,
  Sparkles,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  openAuth: () => void;
  isLoggedIn: boolean;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  openAuth,
  isLoggedIn
}) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [subtotalPaise, setSubtotalPaise] = useState(0);
  const [shortfallPaise, setShortfallPaise] = useState(0);
  const [meetsMov, setMeetsMov] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<'PICKUP' | 'MERCHANT_DELIVERY' | 'PLATFORM_DELIVERY'>('PICKUP');
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await request<any>('/customer/cart');
      setCart(res.cart);
      setSubtotalPaise(res.subtotalPaise);
      setShortfallPaise(res.shortfallPaise);
      setMeetsMov(res.meetsMinimumOrderValue);
    } catch (err: any) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, isLoggedIn]);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!cart?.storeId) return;
    try {
      await request('/customer/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          storeId: cart.storeId,
          productId,
          quantity
        })
      });
      fetchCart();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await request(`/customer/cart/items/${itemId}`, { method: 'DELETE' });
      fetchCart();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      openAuth();
      return;
    }

    setCheckingOut(true);
    setError(null);

    try {
      const idempotencyKey = `IDEMP-${Date.now()}-${Math.random().toString().slice(-4)}`;
      const res = await request<{ order: Order; message: string }>('/customer/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          fulfillmentMode,
          idempotencyKey,
          customerLat: 22.7244,
          customerLng: 75.8839
        })
      });

      onClose();
      onOrderSuccess(res.order);
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-float relative animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <ELLogo variant="dark" size={34} className="shrink-0" />
            <div>
              <h3 className="font-black text-slate-900 text-base">Your Shopping Cart</h3>
              <p className="text-[11px] font-semibold text-slate-500">Everything Local • Indore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Not Logged In State */}
        {!isLoggedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h4 className="font-black text-slate-900 text-lg">Please sign in to order</h4>
            <p className="text-xs text-slate-500 max-w-xs font-medium">
              Access your local neighbourhood stores and manage your Indore hyperlocal basket.
            </p>
            <button
              onClick={openAuth}
              className="py-3 px-6 bg-forest-900 hover:bg-forest-950 text-white font-black text-xs rounded-2xl shadow-md transition active:scale-95"
            >
              Sign In to Continue
            </button>
          </div>
        ) : loading ? (
          <div className="flex-1 p-6 space-y-4 animate-pulse">
            <div className="h-10 bg-slate-100 rounded-2xl"></div>
            <div className="h-24 bg-slate-100 rounded-2xl"></div>
            <div className="h-24 bg-slate-100 rounded-2xl"></div>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <ELLogo variant="dark" size={60} className="mx-auto mb-2" />
            <h4 className="font-black text-slate-800 text-base">Your cart is empty</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Discover fresh staples and produce from neighbourhood stores within 3.0 km in Indore!
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Single Store Context Header */}
            {cart.store && (
              <div className="p-3.5 bg-forest-50/70 rounded-2xl border border-forest-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-forest-800 block">
                    Ordering from Store
                  </span>
                  <span className="font-black text-sm text-forest-950">{cart.store.name}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-forest-800 bg-white px-2 py-1 rounded-xl border border-forest-200">
                  {cart.store.category}
                </span>
              </div>
            )}

            {/* Minimum Order Value (₹299) Alert & Progress Bar */}
            <div
              className={`p-4 rounded-2xl border ${
                meetsMov
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : 'bg-amber-50/90 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className={meetsMov ? 'text-forest-800' : 'text-amber-900'}>
                  {meetsMov ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Minimum Order (₹299) Unlocked!
                    </span>
                  ) : (
                    <span>Add {formatPaise(shortfallPaise)} more to place order</span>
                  )}
                </span>
                <span className="text-slate-600 font-black">
                  {formatPaise(subtotalPaise)} / ₹299
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    meetsMov ? 'bg-forest-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (subtotalPaise / 29900) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Basket Items ({cart.items.length})
              </span>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition"
                >
                  {/* Thumbnail or Fallback */}
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/70 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-contain"
                        onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                      />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-xs font-black text-slate-900 block mt-0.5">
                      {formatPaise(item.unitPricePaise * item.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-forest-900 text-white rounded-xl shadow-2xs px-1 py-0.5 text-xs font-bold">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.productId, item.quantity - 1);
                          } else {
                            removeItem(item.id);
                          }
                        }}
                        className="w-6 h-6 hover:bg-forest-800 rounded-md flex items-center justify-center transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-1.5 text-xs font-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-6 h-6 hover:bg-forest-800 rounded-md flex items-center justify-center transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Fulfillment Mode Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Choose Fulfillment Mode
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('PICKUP')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    fulfillmentMode === 'PICKUP'
                      ? 'border-forest-800 bg-forest-50/70 ring-2 ring-forest-800/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Store className="w-4 h-4 text-forest-800" />
                    <span className="text-[10px] font-black uppercase text-forest-800 bg-forest-100 px-2 py-0.5 rounded-full">
                      FREE ₹0
                    </span>
                  </div>
                  <span className="font-black text-xs text-slate-900 mt-2">Self In-Store Pickup</span>
                  <span className="text-[10px] text-slate-500 font-medium">Ready in ~15 mins</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentMode('MERCHANT_DELIVERY')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    fulfillmentMode === 'MERCHANT_DELIVERY'
                      ? 'border-forest-800 bg-forest-50/70 ring-2 ring-forest-800/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Bike className="w-4 h-4 text-forest-800" />
                    <span className="text-[10px] font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded-full">
                      ₹25.00
                    </span>
                  </div>
                  <span className="font-black text-xs text-slate-900 mt-2">Store Delivery</span>
                  <span className="text-[10px] text-slate-500 font-medium">Direct to door (3km)</span>
                </button>
              </div>
            </div>

            {/* Transparent Financial Bill Breakdown */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5 text-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Bill Summary
              </span>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">{formatPaise(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Delivery & Handling</span>
                <span className="font-bold text-slate-900">
                  {fulfillmentMode === 'PICKUP' ? '₹0.00 (Free Pickup)' : '₹25.00'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Local Taxes & Cess</span>
                <span className="font-bold text-slate-900">₹0.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Total Payable</span>
                <span className="text-forest-900 text-base">
                  {formatPaise(subtotalPaise + (fulfillmentMode === 'PICKUP' ? 0 : 2500))}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Drawer Footer Checkout CTA */}
        {isLoggedIn && cart && cart.items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white">
            <button
              onClick={handleCheckout}
              disabled={!meetsMov || checkingOut}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md active:scale-95 ${
                meetsMov && !checkingOut
                  ? 'bg-forest-900 hover:bg-forest-950 text-white shadow-forest-900/25'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>
                {checkingOut
                  ? 'Placing Order...'
                  : meetsMov
                  ? `Proceed to Pay • ${formatPaise(
                      subtotalPaise + (fulfillmentMode === 'PICKUP' ? 0 : 2500)
                    )}`
                  : `Add ${formatPaise(shortfallPaise)} for Min Order`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
