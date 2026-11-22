import React, { useState, useEffect } from 'react';
import { Cart, Order } from '../../types';
import { request, formatPaise } from '../../api/client';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { BrandLogo } from '../../components/BrandLogo';
import { ELLogo } from '../../components/ELLogo';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
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
  ShieldCheck,
  MapPin,
  Zap,
  Layers,
  Info
} from 'lucide-react';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order | any) => void;
  openAuth: () => void;
  isLoggedIn: boolean;
}

interface DeliveryTierQuote {
  tier: 'EXPRESS_20' | 'PRIORITY_40' | 'STANDARD_60' | 'SCHEDULED_120';
  tierName: string;
  promisedMinutes: number;
  feasible: boolean;
  unfeasibleReason?: string;
  pricing: {
    basePaise: number;
    distancePaise: number;
    prioritySurchargePaise: number;
    extraPickupStopPaise: number;
    weightSurchargePaise: number;
    totalDeliveryFeePaise: number;
    peakMultiplier: number;
    maxRadiusKm: number;
  };
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  openAuth,
  isLoggedIn
}) => {
  const { coords, selectedLocation, setIsLocationModalOpen } = useLocation();
  const {
    cart,
    subtotalPaise,
    shortfallPaise,
    meetsMinimumOrderValue: meetsMov,
    isLoading: loading,
    updateQuantity,
    removeItem,
    refreshCart
  } = useCart();

  // Delivery Priority Tier selection
  const [selectedTier, setSelectedTier] = useState<'EXPRESS_20' | 'PRIORITY_40' | 'STANDARD_60' | 'SCHEDULED_120'>('PRIORITY_40');
  const [quotes, setQuotes] = useState<DeliveryTierQuote[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group cart items by store
  const storeGroups: { [storeId: string]: { storeName: string; items: any[]; subtotalPaise: number } } = {};
  if (cart && cart.items) {
    for (const item of cart.items) {
      const sId = item.product.storeId || cart.storeId || 'default-store';
      const sName = item.product.store?.name || cart.store?.name || 'Neighbourhood Store';
      if (!storeGroups[sId]) {
        storeGroups[sId] = { storeName: sName, items: [], subtotalPaise: 0 };
      }
      storeGroups[sId].items.push(item);
      storeGroups[sId].subtotalPaise += item.unitPricePaise * item.quantity;
    }
  }

  const distinctStoreCount = Object.keys(storeGroups).length;

  // Fetch Delivery Quotes whenever cart items or customer coords change
  const fetchQuotes = async () => {
    if (!cart || cart.items.length === 0) return;
    setQuoteLoading(true);
    try {
      const storeIds = Object.keys(storeGroups);
      const itemsPayload = cart.items.map((i) => ({
        storeId: i.product.storeId || cart.storeId,
        quantity: i.quantity,
        weightKg: 0.5 // Estimated default per item
      }));

      const res = await request<{ quotes: DeliveryTierQuote[] }>('/customer/delivery/quote', {
        method: 'POST',
        body: JSON.stringify({
          storeIds,
          customerLat: coords.latitude,
          customerLng: coords.longitude,
          items: itemsPayload
        })
      });

      setQuotes(res.quotes);

      // Default to the fastest feasible tier
      const activeQuote = res.quotes.find((q) => q.tier === selectedTier);
      if (!activeQuote || !activeQuote.feasible) {
        const firstFeasible = res.quotes.find((q) => q.feasible);
        if (firstFeasible) setSelectedTier(firstFeasible.tier);
      }
    } catch (err: any) {
      console.warn('Quote fetch failed:', err.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && cart && cart.items.length > 0) {
      fetchQuotes();
    }
  }, [isOpen, cart?.items?.length, coords.latitude, coords.longitude]);

  const activeQuote = quotes.find((q) => q.tier === selectedTier);
  const deliveryFeePaise = activeQuote ? activeQuote.pricing.totalDeliveryFeePaise : 3500;
  const grandTotalPaise = subtotalPaise + deliveryFeePaise;

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      openAuth();
      return;
    }

    if (!selectedLocation) {
      setIsLocationModalOpen(true);
      return;
    }

    setCheckingOut(true);
    setError(null);

    try {
      const idempotencyKey = `IDEMP-PORD-${Date.now()}-${Math.random().toString().slice(-4)}`;
      const res = await request<{
        parentOrder: any;
        childOrders: any[];
        message: string;
      }>('/customer/orders/multi-store', {
        method: 'POST',
        body: JSON.stringify({
          deliveryPriorityTier: selectedTier,
          customerLat: coords.latitude,
          customerLng: coords.longitude,
          deliveryAddress: `${selectedLocation.name}, ${selectedLocation.locality || 'Indore'}`,
          idempotencyKey
        })
      });

      await refreshCart();
      onClose();
      onOrderSuccess(res.parentOrder);
    } catch (err: any) {
      setError(err.message || 'Multi-store checkout failed');
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
            <BrandLogo variant="symbol" size="small" className="shrink-0" />
            <div>
              <h3 className="font-black text-slate-900 text-base">Your Hyperlocal Cart</h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Consolidated Checkout • Indore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Not Logged In */}
        {!isLoggedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
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
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <BrandLogo variant="horizontal" size="large" className="mx-auto mb-2" />
            <h4 className="font-black text-slate-800 text-base">Your cart is empty</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Discover fresh staples and produce from neighbourhood stores in Indore!
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Multi-Store Notification Banner */}
            {distinctStoreCount > 1 && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl border border-amber-200 flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-black text-slate-900 block">
                    Multi-Store Consolidated Order ({distinctStoreCount} Stores)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Your rider will pick up from all stores in one single delivery route!
                  </span>
                </div>
              </div>
            )}

            {/* Minimum Order Value Alert */}
            <div
              className={`p-3.5 rounded-2xl border ${
                meetsMov ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/90 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className={meetsMov ? 'text-forest-800' : 'text-amber-900'}>
                  {meetsMov ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Minimum Order (₹299) Unlocked!
                    </span>
                  ) : (
                    <span>Add {formatPaise(shortfallPaise)} more to unlock order</span>
                  )}
                </span>
                <span className="text-slate-600 font-black">
                  {formatPaise(subtotalPaise)} / ₹299
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    meetsMov ? 'bg-forest-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (subtotalPaise / 29900) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Items Grouped by Store */}
            <div className="space-y-4">
              {Object.entries(storeGroups).map(([storeId, group]) => (
                <div key={storeId} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-600" />
                      {group.storeName}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {formatPaise(group.subtotalPaise)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white rounded-2xl border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/70 overflow-hidden shrink-0 flex items-center justify-center p-1">
                          <ImageWithFallback
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            category={item.product.category}
                            aspectRatio="square"
                            objectFit="contain"
                            className="w-full h-full"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.product.name}
                          </h4>
                          <span className="text-xs font-black text-slate-900 block mt-0.5">
                            {formatPaise(item.unitPricePaise * item.quantity)}
                          </span>
                        </div>

                        <div className="flex items-center bg-forest-900 text-white rounded-xl px-1 py-0.5 text-xs font-bold">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(item.productId, item.quantity - 1);
                              } else {
                                removeItem(item.id);
                              }
                            }}
                            className="w-5 h-5 hover:bg-forest-800 rounded-md flex items-center justify-center transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-1.5 text-xs font-black">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-5 h-5 hover:bg-forest-800 rounded-md flex items-center justify-center transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Address */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-forest-700 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Delivering To
                  </span>
                  <span className="text-xs font-black text-slate-900 truncate block">
                    {selectedLocation ? selectedLocation.name : 'Select Delivery Locality'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="text-[11px] font-black text-amber-600 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-50 shrink-0"
              >
                Change
              </button>
            </div>

            {/* 4-Tier Delivery Priority Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Select Delivery Priority Tier
                </span>
                {quoteLoading && (
                  <span className="text-[10px] text-amber-600 font-bold animate-pulse">
                    Updating dynamic quote...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Tier 1: Express 20 */}
                {(() => {
                  const q = quotes.find((x) => x.tier === 'EXPRESS_20');
                  const feasible = q ? q.feasible : distinctStoreCount <= 2;
                  return (
                    <button
                      type="button"
                      disabled={!feasible}
                      onClick={() => setSelectedTier('EXPRESS_20')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        selectedTier === 'EXPRESS_20'
                          ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-400/30'
                          : !feasible
                          ? 'opacity-40 border-slate-200 bg-slate-50 cursor-not-allowed'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                          {q ? formatPaise(q.pricing.totalDeliveryFeePaise) : '₹49.00'}
                        </span>
                      </div>
                      <span className="font-black text-xs text-slate-900 mt-2">15-20 Min Express</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {feasible ? 'Guaranteed 20m SLA' : (q?.unfeasibleReason || 'Max 2 stores / 3km')}
                      </span>
                    </button>
                  );
                })()}

                {/* Tier 2: Priority 40 */}
                {(() => {
                  const q = quotes.find((x) => x.tier === 'PRIORITY_40');
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedTier('PRIORITY_40')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        selectedTier === 'PRIORITY_40'
                          ? 'border-forest-800 bg-forest-50/70 ring-2 ring-forest-800/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Clock className="w-4 h-4 text-forest-800" />
                        <span className="text-[10px] font-black bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                          {q ? formatPaise(q.pricing.totalDeliveryFeePaise) : '₹35.00'}
                        </span>
                      </div>
                      <span className="font-black text-xs text-slate-900 mt-2">30-40 Min Priority</span>
                      <span className="text-[10px] text-slate-500 font-medium">Direct Rider Dispatch</span>
                    </button>
                  );
                })()}

                {/* Tier 3: Standard 60 */}
                {(() => {
                  const q = quotes.find((x) => x.tier === 'STANDARD_60');
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedTier('STANDARD_60')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        selectedTier === 'STANDARD_60'
                          ? 'border-forest-800 bg-forest-50/70 ring-2 ring-forest-800/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Bike className="w-4 h-4 text-slate-600" />
                        <span className="text-[10px] font-black bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                          {q ? formatPaise(q.pricing.totalDeliveryFeePaise) : '₹25.00'}
                        </span>
                      </div>
                      <span className="font-black text-xs text-slate-900 mt-2">45-60 Min Standard</span>
                      <span className="text-[10px] text-slate-500 font-medium">Value Consolidated</span>
                    </button>
                  );
                })()}

                {/* Tier 4: Scheduled 120 */}
                {(() => {
                  const q = quotes.find((x) => x.tier === 'SCHEDULED_120');
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedTier('SCHEDULED_120')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        selectedTier === 'SCHEDULED_120'
                          ? 'border-forest-800 bg-forest-50/70 ring-2 ring-forest-800/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Store className="w-4 h-4 text-emerald-700" />
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {q ? formatPaise(q.pricing.totalDeliveryFeePaise) : '₹15.00'}
                        </span>
                      </div>
                      <span className="font-black text-xs text-slate-900 mt-2">2 Hours Eco Slotted</span>
                      <span className="text-[10px] text-slate-500 font-medium">Lowest Delivery Fee</span>
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Transparent Delivery Fee Breakdown */}
            {activeQuote && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Delivery Dynamic Pricing Breakdown
                </span>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Base Delivery Fee</span>
                  <span className="font-bold text-slate-900">{formatPaise(activeQuote.pricing.basePaise)}</span>
                </div>
                {activeQuote.pricing.distancePaise > 0 && (
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Distance Surcharge</span>
                    <span className="font-bold text-slate-900">{formatPaise(activeQuote.pricing.distancePaise)}</span>
                  </div>
                )}
                {activeQuote.pricing.extraPickupStopPaise > 0 && (
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Multi-Store Stop Surcharge</span>
                    <span className="font-bold text-slate-900">{formatPaise(activeQuote.pricing.extraPickupStopPaise)}</span>
                  </div>
                )}
                {activeQuote.pricing.prioritySurchargePaise > 0 && (
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Speed Priority Surcharge</span>
                    <span className="font-bold text-slate-900">{formatPaise(activeQuote.pricing.prioritySurchargePaise)}</span>
                  </div>
                )}
                {activeQuote.pricing.weightSurchargePaise > 0 && (
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Basket Weight Surcharge</span>
                    <span className="font-bold text-slate-900">{formatPaise(activeQuote.pricing.weightSurchargePaise)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900">
                  <span>Total Delivery Charge</span>
                  <span className="text-forest-900">{formatPaise(deliveryFeePaise)}</span>
                </div>
              </div>
            )}

            {/* Total Payable Summary */}
            <div className="p-4 bg-white rounded-2xl border-2 border-forest-900/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">{formatPaise(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Delivery &amp; Logistics</span>
                <span className="font-bold text-slate-900">{formatPaise(deliveryFeePaise)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Total Payable</span>
                <span className="text-forest-900 text-base">{formatPaise(grandTotalPaise)}</span>
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

        {/* Checkout CTA */}
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
                  ? 'Dispatching Order...'
                  : meetsMov
                  ? `Place Order • ${formatPaise(grandTotalPaise)}`
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
