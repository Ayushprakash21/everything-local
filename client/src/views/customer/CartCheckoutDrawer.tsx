import React, { useState, useEffect } from 'react';
import { Cart, Order } from '../../types';
import { request, formatPaise } from '../../api/client';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldAlert, CheckCircle2, Bike, Store, ArrowRight } from 'lucide-react';

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
  const [quoteDetails, setQuoteDetails] = useState<any>(null);
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

  const fetchQuote = async (mode: 'PICKUP' | 'MERCHANT_DELIVERY' | 'PLATFORM_DELIVERY') => {
    if (!isLoggedIn || !cart || cart.items.length === 0) return;
    try {
      const res = await request<any>('/customer/orders/quote', {
        method: 'POST',
        body: JSON.stringify({
          fulfillmentMode: mode,
          customerLat: 22.7244,
          customerLng: 75.8839
        })
      });
      setQuoteDetails(res.financials);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    if (cart && cart.items.length > 0 && meetsMov) {
      fetchQuote(fulfillmentMode);
    }
  }, [cart, fulfillmentMode, meetsMov]);

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-lg">Your Shopping Cart</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not Logged In Banner */}
        {!isLoggedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-slate-300" />
            <h4 className="font-bold text-slate-800 text-base">Please sign in to view your cart</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Access your local neighbourhood stores and manage your hyper-local order.
            </p>
            <button
              onClick={openAuth}
              className="py-2.5 px-6 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-md"
            >
              Sign In to Continue
            </button>
          </div>
        ) : loading ? (
          <div className="flex-1 p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/2"></div>
            <div className="h-20 bg-slate-100 rounded-xl"></div>
            <div className="h-20 bg-slate-100 rounded-xl"></div>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300" />
            <h4 className="font-bold text-slate-800">Your cart is empty</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Discover fresh essentials from neighborhood stores within 3 km in Indore!
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Single Store Context Badge */}
            {cart.store && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Ordering from
                  </span>
                  <span className="font-bold text-sm text-emerald-950">{cart.store.name}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                  {cart.store.category}
                </span>
              </div>
            )}

            {/* Minimum Order Value (₹299) Alert & Progress */}
            <div className={`p-3.5 rounded-2xl border ${meetsMov ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className={meetsMov ? 'text-emerald-800' : 'text-amber-800'}>
                  {meetsMov ? '✓ Minimum Order (₹299) Unlocked!' : `Add ${formatPaise(shortfallPaise)} more for minimum order`}
                </span>
                <span className="text-slate-500 font-bold">{formatPaise(subtotalPaise)} / ₹299</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${meetsMov ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, (subtotalPaise / 29900) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Order Items ({cart.items.length})
              </span>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                    <span className="text-xs font-semibold text-slate-900 block mt-0.5">
                      {formatPaise(item.unitPricePaise * item.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.productId, item.quantity - 1);
                          } else {
                            removeItem(item.id);
                          }
                        }}
                        className="p-1 hover:bg-slate-200 rounded-l text-slate-600 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 hover:bg-slate-200 rounded-r text-slate-600 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Fulfillment Mode Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Fulfillment Mode
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('PICKUP')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                    fulfillmentMode === 'PICKUP'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      FREE ₹0
                    </span>
                  </div>
                  <span className="font-bold text-xs text-slate-800 mt-2">Self Pickup</span>
                  <span className="text-[10px] text-slate-500">Ready in ~15 mins</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentMode('MERCHANT_DELIVERY')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                    fulfillmentMode === 'MERCHANT_DELIVERY'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Bike className="w-4 h-4 text-emerald-700" />
                    <span className="text-[10px] font-bold text-slate-700">₹25.00</span>
                  </div>
                  <span className="font-bold text-xs text-slate-800 mt-2">Store Delivery</span>
                  <span className="text-[10px] text-slate-500">Direct to door (3km)</span>
                </button>
              </div>
            </div>

            {/* Financial Bill Breakdown */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPaise(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fulfillment Fee</span>
                <span className="font-semibold text-slate-900">
                  {fulfillmentMode === 'PICKUP' ? '₹0.00 (Free Pickup)' : '₹25.00'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable Taxes</span>
                <span className="font-semibold text-slate-900">₹0.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                <span>Total Amount</span>
                <span className="text-emerald-700">
                  {formatPaise(subtotalPaise + (fulfillmentMode === 'PICKUP' ? 0 : 2500))}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Drawer Footer Checkout Button */}
        {isLoggedIn && cart && cart.items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white">
            <button
              onClick={handleCheckout}
              disabled={!meetsMov || checkingOut}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${
                meetsMov && !checkingOut
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>{checkingOut ? 'Placing Order...' : meetsMov ? 'Place Order Now' : `Min Order ₹299 Required`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
