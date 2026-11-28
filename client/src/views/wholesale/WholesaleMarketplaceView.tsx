import React, { useState, useEffect } from 'react';
import { request, formatPaise } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Package,
  ShieldCheck,
  TrendingUp,
  Truck,
  FileText,
  ShoppingCart,
  Building2,
  ArrowRight,
  CheckCircle2,
  X,
  Plus,
  Minus,
  MapPin,
  Layers,
  Clock,
  BadgeCheck,
  Send
} from 'lucide-react';

interface WholesaleMarketplaceViewProps {
  openAuth: () => void;
  onOpenConsole: () => void;
  onOpenOnboarding: () => void;
}

export const WholesaleMarketplaceView: React.FC<WholesaleMarketplaceViewProps> = ({
  openAuth,
  onOpenConsole,
  onOpenOnboarding
}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [wholesalers, setWholesalers] = useState<any[]>([]);
  const [cart, setCart] = useState<any>({ items: [], summary: { itemCount: 0, subtotalPaise: 0, taxPaise: 0, totalPaise: 0 } });
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myRfqs, setMyRfqs] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [listingFilter, setListingFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'cart' | 'orders' | 'rfqs'>('marketplace');
  const [loading, setLoading] = useState(true);

  // Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [orderQty, setOrderQty] = useState<number>(10);
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // RFQ Modal
  const [rfqProduct, setRfqProduct] = useState<any | null>(null);
  const [rfqForm, setRfqForm] = useState({
    requestedQty: 50,
    deliveryCity: 'Indore',
    deliveryState: 'Madhya Pradesh',
    deliveryPincode: '452001',
    deliveryAddress: '',
    expectedDeliveryDate: '',
    requirements: ''
  });

  // Checkout Form
  const [checkoutForm, setCheckoutForm] = useState({
    addressLine: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452001',
    paymentMethod: 'ONLINE',
    fulfillmentMethod: 'TRANSPORTER',
    notes: ''
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (listingFilter) params.set('listingType', listingFilter);

      const [catRes, prodRes, whsRes] = await Promise.all([
        request<{ categories: any[] }>('/wholesale/categories'),
        request<{ products: any[] }>(`/wholesale/products?${params.toString()}`),
        request<{ wholesalers: any[] }>('/wholesale/wholesalers')
      ]);
      setCategories(catRes.categories || []);
      setProducts(prodRes.products || []);
      setWholesalers(whsRes.wholesalers || []);
    } catch (err) {
      console.error('Failed to load wholesale marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBuyerData = async () => {
    if (!user) return;
    try {
      const [cartRes, ordRes, rfqRes] = await Promise.all([
        request<any>('/wholesale/cart').catch(() => ({ items: [], summary: { itemCount: 0, subtotalPaise: 0, taxPaise: 0, totalPaise: 0 } })),
        request<{ orders: any[] }>('/wholesale/orders').catch(() => ({ orders: [] })),
        request<{ rfqs: any[] }>('/wholesale/rfqs').catch(() => ({ rfqs: [] }))
      ]);
      setCart(cartRes);
      setMyOrders(ordRes.orders || []);
      setMyRfqs(rfqRes.rfqs || []);
    } catch (err) {
      console.error('Failed to load buyer wholesale data:', err);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, [selectedCategory, listingFilter]);

  useEffect(() => {
    loadBuyerData();
  }, [user]);

  const resolveTierForQty = (product: any, qty: number) => {
    const tiers = [...(product.priceTiers || [])].sort((a, b) => b.minQty - a.minQty);
    for (const t of tiers) {
      if (qty >= t.minQty && (t.maxQty === null || t.maxQty === undefined || qty <= t.maxQty)) {
        return t.pricePaise;
      }
    }
    return product.basePricePaise;
  };

  const openProductDetail = (p: any) => {
    setSelectedProduct(p);
    setOrderQty(p.moq || 10);
    setActionMsg(null);
  };

  const handleAddToWholesaleCart = async () => {
    if (!user) {
      openAuth();
      return;
    }
    if (!selectedProduct) return;
    setActionMsg(null);
    try {
      await request('/wholesale/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: selectedProduct.id, quantity: orderQty })
      });
      setActionMsg({ type: 'ok', text: `Added ${orderQty} ${selectedProduct.unitOfMeasurement} to Wholesale Cart` });
      await loadBuyerData();
    } catch (err: any) {
      setActionMsg({ type: 'err', text: err.message || 'Failed to add to wholesale cart' });
    }
  };

  const handleRemoveCartItem = async (productId: string) => {
    try {
      await request(`/wholesale/cart/items/${productId}`, { method: 'DELETE' });
      await loadBuyerData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleWholesaleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuth();
      return;
    }
    setIsCheckingOut(true);
    try {
      await request('/wholesale/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: {
            addressLine: checkoutForm.addressLine,
            city: checkoutForm.city,
            state: checkoutForm.state,
            pincode: checkoutForm.pincode
          },
          paymentMethod: checkoutForm.paymentMethod,
          fulfillmentMethod: checkoutForm.fulfillmentMethod,
          notes: checkoutForm.notes
        })
      });
      await loadBuyerData();
      setActiveTab('orders');
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSubmitRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuth();
      return;
    }
    if (!rfqProduct) return;
    try {
      await request('/wholesale/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          productId: rfqProduct.id,
          ...rfqForm
        })
      });
      setRfqProduct(null);
      await loadBuyerData();
      setActiveTab('rfqs');
    } catch (err: any) {
      alert(err.message || 'Failed to submit RFQ');
    }
  };

  const handleAcceptQuotation = async (quotationId: string) => {
    try {
      await request(`/wholesale/quotations/${quotationId}/accept`, { method: 'POST' });
      await loadBuyerData();
      setActiveTab('orders');
    } catch (err: any) {
      alert(err.message || 'Failed to accept quotation');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top B2B Sub-Header */}
      <div className="bg-[#0B1F3B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black uppercase tracking-wider text-[10px]">
              B2B Wholesale
            </span>
            <span className="text-slate-300 hidden sm:inline">
              Verified Manufacturers, Distributors & Bulk Trade • Your Neighbourhood. Your Marketplace.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'marketplace' ? 'bg-white text-slate-950' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              Browse Bulk
            </button>
            <button
              onClick={() => (user ? setActiveTab('cart') : openAuth())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'cart' ? 'bg-amber-400 text-slate-950' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Wholesale Cart ({cart.summary?.itemCount || 0})</span>
            </button>
            <button
              onClick={() => (user ? setActiveTab('rfqs') : openAuth())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'rfqs' ? 'bg-white text-slate-950' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              My RFQs ({myRfqs.length})
            </button>
            <button
              onClick={() => (user ? setActiveTab('orders') : openAuth())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'orders' ? 'bg-white text-slate-950' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              Bulk Orders ({myOrders.length})
            </button>
            {user?.role === 'WHOLESALER' || user?.role === 'ADMIN' ? (
              <button
                onClick={onOpenConsole}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
              >
                Wholesaler Console
              </button>
            ) : (
              <button
                onClick={() => (user ? onOpenOnboarding() : openAuth())}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition"
              >
                Become a Wholesaler
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'marketplace' && (
        <>
          {/* Serious B2B Hero & Search */}
          <section className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>GST-Compliant Invoicing • Verified Distributors • Transporter & Courier Dispatch</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Buy More. Pay Less. Grow Your Business.
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 mt-3 max-w-2xl leading-relaxed">
                    Discover manufacturers, distributors, importers and wholesalers. Source products in bulk with transparent minimum order quantities and volume-based pricing.
                  </p>

                  {/* Large Wholesale Search Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      loadMarketplace();
                    }}
                    className="mt-6 flex flex-col sm:flex-row gap-2.5"
                  >
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search bulk staples, cartons, electronics, apparel, SKU or brand..."
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#0B1F3B] focus:outline-none text-sm font-medium text-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3.5 rounded-2xl bg-[#0B1F3B] hover:bg-slate-800 text-white text-sm font-black transition shrink-0"
                    >
                      Explore Wholesale Products
                    </button>
                    <button
                      type="button"
                      onClick={() => (user ? (user.role === 'WHOLESALER' ? onOpenConsole() : onOpenOnboarding()) : openAuth())}
                      className="px-5 py-3.5 rounded-2xl border-2 border-slate-900 text-slate-900 hover:bg-slate-100 text-sm font-black transition shrink-0"
                    >
                      Become a Wholesaler
                    </button>
                  </form>
                </div>

                {/* Bulk Purchase Benefits Card */}
                <div className="lg:col-span-4 bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    B2B Trade Advantages
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Volume Tier Discounts</p>
                        <p className="text-slate-400">Unit prices drop automatically at higher lot slabs.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Custom RFQ & Quotations</p>
                        <p className="text-slate-400">Request custom quotes for large or recurring orders.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Truck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Transporter & Freight Logistics</p>
                        <p className="text-slate-400">LR-tracked dispatch, courier, or seller-arranged fleet.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Category Navigation */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0B1F3B]" />
                  <span>Wholesale Categories ({categories.length})</span>
                </h2>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="text-xs font-bold text-amber-700 hover:underline"
                  >
                    Clear Category Filter
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                    selectedCategory === ''
                      ? 'bg-[#0B1F3B] text-white border-[#0B1F3B]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                      selectedCategory === cat.id
                        ? 'bg-[#0B1F3B] text-white border-[#0B1F3B]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Verified Suppliers Strip */}
            {wholesalers.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Suppliers & Distributors</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wholesalers.map((w) => (
                    <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-slate-900">{w.businessName}</h3>
                          <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {w.businessType} • {w.city}, {w.state}
                        </p>
                      </div>
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                        {w._count?.products || 0} SKUs
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Bulk Deals & Product Catalogue */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Bulk Trade Catalogue</h2>
                  <p className="text-xs text-slate-500">Transparent MOQ and tiered unit pricing from verified sellers</p>
                </div>
                <div className="flex items-center gap-2">
                  {['', 'TIERED', 'FIXED', 'NEGOTIABLE', 'RFQ'].map((lt) => (
                    <button
                      key={lt || 'ALL'}
                      onClick={() => setListingFilter(lt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        listingFilter === lt
                          ? 'bg-amber-400 border-amber-500 text-slate-950'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {lt || 'All Types'}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-4 border-[#0B1F3B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500">Loading verified wholesale listings...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                  <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">No wholesale products match your current filters</p>
                  <p className="text-xs text-slate-500 mt-1">Try clearing filters or submit a custom quotation request.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map((p) => {
                    const lowestTier = p.priceTiers?.length
                      ? Math.min(...p.priceTiers.map((t: any) => t.pricePaise))
                      : p.basePricePaise;
                    const stock = (p.inventories || []).reduce((s: number, inv: any) => s + inv.availableQty, 0);

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl border border-slate-200 hover:border-[#0B1F3B] transition shadow-2xs flex flex-col overflow-hidden"
                      >
                        <div className="h-44 bg-slate-100 relative p-4 flex items-center justify-center">
                          <img
                            src={p.mainImageUrl || '/brand/product-placeholder.svg'}
                            alt={p.title}
                            className="max-h-full max-w-full object-contain"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0B1F3B] text-white text-[10px] font-black uppercase">
                            MOQ: {p.moq} {p.unitOfMeasurement}
                          </span>
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-white/95 border border-slate-200 text-[10px] font-bold text-slate-700">
                            {p.listingType}
                          </span>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 mb-1">
                              <BadgeCheck className="w-3.5 h-3.5" />
                              <span className="truncate">{p.wholesaler?.businessName}</span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 line-clamp-2">{p.title}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {p.category?.name} • SKU: {p.sku}
                            </p>
                          </div>

                          {/* Tiered Price Preview Table */}
                          {p.priceTiers && p.priceTiers.length > 0 && (
                            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-1">
                              {p.priceTiers.slice(0, 3).map((t: any) => (
                                <div key={t.id} className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-600">
                                    {t.maxQty ? `${t.minQty}–${t.maxQty}` : `${t.minQty}+`} {p.unitOfMeasurement}
                                  </span>
                                  <span className="font-black text-slate-900">
                                    {formatPaise(t.pricePaise)} / {p.unitOfMeasurement}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting from</span>
                              <span className="text-base font-black text-[#0B1F3B]">
                                {formatPaise(lowestTier)}
                                <span className="text-[11px] font-semibold text-slate-500"> /{p.unitOfMeasurement}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setRfqProduct(p);
                                  setRfqForm((f) => ({ ...f, requestedQty: Math.max(p.moq * 2, 50) }));
                                }}
                                className="px-2.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-700"
                              >
                                RFQ
                              </button>
                              <button
                                onClick={() => openProductDetail(p)}
                                className="px-3.5 py-2 rounded-xl bg-[#0B1F3B] hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1"
                              >
                                <span>Order</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                            <span>Stock: {stock} {p.unitOfMeasurement}</span>
                            <span>Dispatch: {p.dispatchTime}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* WHOLESALE CART & CHECKOUT TAB */}
      {activeTab === 'cart' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Wholesale Bulk Cart & Checkout</h2>
          {cart.items?.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">Your wholesale cart is empty</p>
              <button
                onClick={() => setActiveTab('marketplace')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#0B1F3B] text-white text-xs font-black"
              >
                Explore Wholesale Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.mainImageUrl || '/brand/product-placeholder.svg'}
                        alt={item.product.title}
                        className="w-16 h-16 object-contain bg-slate-50 rounded-xl p-1 border border-slate-100"
                      />
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{item.product.title}</h4>
                        <p className="text-xs text-slate-500">
                          Supplier: {item.product.wholesaler?.businessName} • MOQ: {item.product.moq} {item.product.unitOfMeasurement}
                        </p>
                        <p className="text-xs font-bold text-emerald-700 mt-1">
                          {item.quantity} {item.product.unitOfMeasurement} × {formatPaise(item.unitPricePaise)} (+{item.taxRatePct}% GST)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{formatPaise(item.lineTotalPaise)}</p>
                      <button
                        onClick={() => handleRemoveCartItem(item.productId)}
                        className="text-[11px] font-bold text-red-600 hover:underline mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleWholesaleCheckout} className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">Order Summary & Logistics</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold">{formatPaise(cart.summary.subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST / Taxes</span>
                    <span className="font-bold">{formatPaise(cart.summary.taxPaise)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                    <span>Estimated Total</span>
                    <span>{formatPaise(cart.summary.totalPaise)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Business Delivery Address / Shop / Godown"
                    value={checkoutForm.addressLine}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, addressLine: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={checkoutForm.city}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Pincode"
                      value={checkoutForm.pincode}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={checkoutForm.fulfillmentMethod}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, fulfillmentMethod: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                    >
                      <option value="TRANSPORTER">Transporter / Freight</option>
                      <option value="COURIER">Commercial Courier</option>
                      <option value="SELLER_ARRANGED">Seller Arranged Fleet</option>
                      <option value="SELF_PICKUP">Warehouse Self-Pickup</option>
                    </select>
                    <select
                      value={checkoutForm.paymentMethod}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                    >
                      <option value="ONLINE">Online / Instant Pay</option>
                      <option value="BANK_TRANSFER">NEFT / RTGS</option>
                      <option value="UPI">Business UPI</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isCheckingOut}
                    className="w-full py-3 rounded-xl bg-[#0B1F3B] hover:bg-slate-800 text-white text-xs font-black transition"
                  >
                    {isCheckingOut ? 'Processing Bulk Order...' : 'Place Wholesale Order'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* MY RFQS TAB */}
      {activeTab === 'rfqs' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <h2 className="text-2xl font-black text-slate-900">My Quotation Requests (RFQs)</h2>
          {myRfqs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No RFQs submitted yet</p>
            </div>
          ) : (
            myRfqs.map((rfq) => (
              <div key={rfq.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-[#0B1F3B]">{rfq.rfqNumber}</span>
                    <h4 className="text-sm font-black text-slate-900">{rfq.product?.title}</h4>
                    <p className="text-xs text-slate-500">
                      Supplier: {rfq.wholesaler?.businessName} • Requested: {rfq.requestedQty} {rfq.product?.unitOfMeasurement} • Delivery: {rfq.deliveryCity}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900">
                    {rfq.status}
                  </span>
                </div>
                {rfq.quotations?.length > 0 && (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-black text-emerald-900 uppercase">Received Supplier Quotations</p>
                    {rfq.quotations.map((q: any) => (
                      <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-emerald-200">
                        <div className="text-xs space-y-0.5">
                          <p className="font-black text-slate-900">
                            Quoted Price: {formatPaise(q.quotedUnitPricePaise)} / {rfq.product?.unitOfMeasurement} × {q.quotedQty}
                          </p>
                          <p className="text-slate-600">
                            Total (incl. tax & freight): <span className="font-bold text-slate-900">{formatPaise(q.totalPaise)}</span> • Valid until {new Date(q.validUntil).toLocaleDateString()}
                          </p>
                          {q.termsAndConditions && <p className="text-[11px] text-slate-500">Terms: {q.termsAndConditions}</p>}
                        </div>
                        {q.status === 'SUBMITTED' ? (
                          <button
                            onClick={() => handleAcceptQuotation(q.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
                          >
                            Accept & Convert to Order
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-800">{q.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* MY WHOLESALE ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <h2 className="text-2xl font-black text-slate-900">Wholesale Orders & Invoices</h2>
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No wholesale orders placed yet</p>
            </div>
          ) : (
            myOrders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-sm font-black text-[#0B1F3B]">{o.orderNumber}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-600">Invoice: {o.invoiceNumber}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supplier: {o.wholesaler?.businessName} • Logistics: {o.fulfillmentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-900 text-white">
                      {o.status}
                    </span>
                    <p className="text-base font-black text-slate-900 mt-1">{formatPaise(o.totalPaise)}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {o.items?.map((it: any) => (
                    <div key={it.id} className="flex justify-between text-xs text-slate-700">
                      <span>
                        {it.productTitle} ({it.quantity} {it.unitOfMeasurement} @ {formatPaise(it.agreedUnitPricePaise)})
                      </span>
                      <span className="font-bold">{formatPaise(it.lineTotalPaise)}</span>
                    </div>
                  ))}
                </div>
                {o.shipments?.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 flex flex-wrap gap-4">
                    <span>Shipment Status: <strong>{o.shipments[0].status}</strong></span>
                    {o.shipments[0].carrierName && <span>Carrier: <strong>{o.shipments[0].carrierName}</strong></span>}
                    {o.shipments[0].trackingNumber && <span>Tracking: <strong>{o.shipments[0].trackingNumber}</strong></span>}
                    {o.shipments[0].lrNumber && <span>LR No: <strong>{o.shipments[0].lrNumber}</strong></span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* PRODUCT DETAIL & TIER CALCULATOR MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase text-emerald-700 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> {selectedProduct.wholesaler?.businessName}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">{selectedProduct.title}</h3>
                <p className="text-xs text-slate-500">
                  SKU: {selectedProduct.sku} {selectedProduct.hsnCode ? `• HSN: ${selectedProduct.hsnCode}` : ''} • {selectedProduct.taxClassification}
                </p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-200">
                <img
                  src={selectedProduct.mainImageUrl || '/brand/product-placeholder.svg'}
                  alt={selectedProduct.title}
                  className="max-h-48 object-contain"
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">{selectedProduct.description}</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                  <span className="font-black text-amber-950">
                    Minimum Order Quantity: {selectedProduct.moq} {selectedProduct.unitOfMeasurement}
                  </span>
                  <p className="text-amber-800 mt-0.5">
                    Dispatch: {selectedProduct.dispatchTime} • Pack: {selectedProduct.packageSize || 'Standard'}
                  </p>
                </div>

                {/* Tiered Pricing Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="text-left px-3 py-2 font-black">Quantity</th>
                        <th className="text-right px-3 py-2 font-black">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedProduct.priceTiers || []).map((t: any) => {
                        const isActive = orderQty >= t.minQty && (!t.maxQty || orderQty <= t.maxQty);
                        return (
                          <tr key={t.id} className={isActive ? 'bg-emerald-50 font-black text-emerald-900' : 'text-slate-700'}>
                            <td className="px-3 py-2">
                              {t.maxQty ? `${t.minQty}–${t.maxQty}` : `${t.minQty}+`} {selectedProduct.unitOfMeasurement}
                            </td>
                            <td className="px-3 py-2 text-right">{formatPaise(t.pricePaise)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Interactive Quantity & Price Calculator */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOrderQty((q) => Math.max(selectedProduct.moq, q - 5))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={selectedProduct.moq}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(selectedProduct.moq, Number(e.target.value) || selectedProduct.moq))}
                  className="w-24 text-center py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-black text-white"
                />
                <button
                  type="button"
                  onClick={() => setOrderQty((q) => q + 5)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-300">{selectedProduct.unitOfMeasurement}</span>
              </div>

              <div className="text-right">
                <p className="text-[11px] text-slate-400">
                  Unit Price: <strong className="text-amber-400">{formatPaise(resolveTierForQty(selectedProduct, orderQty))}</strong>
                </p>
                <p className="text-lg font-black">
                  Est. Total: {formatPaise(resolveTierForQty(selectedProduct, orderQty) * orderQty)}
                </p>
              </div>
            </div>

            {actionMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${actionMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {actionMsg.text}
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setRfqProduct(selectedProduct);
                  setRfqForm((f) => ({ ...f, requestedQty: Math.max(orderQty, selectedProduct.moq * 2) }));
                  setSelectedProduct(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100"
              >
                Request Custom Quotation (RFQ)
              </button>
              <button
                type="button"
                onClick={handleAddToWholesaleCart}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black"
              >
                Add to Wholesale Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RFQ MODAL */}
      {rfqProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSubmitRfq} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Request Quotation (RFQ)</h3>
              <button type="button" onClick={() => setRfqProduct(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-600">{rfqProduct.title}</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Required Quantity ({rfqProduct.unitOfMeasurement})</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={rfqForm.requestedQty}
                  onChange={(e) => setRfqForm({ ...rfqForm, requestedQty: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Delivery Address"
                value={rfqForm.deliveryAddress}
                onChange={(e) => setRfqForm({ ...rfqForm, deliveryAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={rfqForm.deliveryCity}
                  onChange={(e) => setRfqForm({ ...rfqForm, deliveryCity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Pincode"
                  value={rfqForm.deliveryPincode}
                  onChange={(e) => setRfqForm({ ...rfqForm, deliveryPincode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <input
                type="date"
                value={rfqForm.expectedDeliveryDate}
                onChange={(e) => setRfqForm({ ...rfqForm, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <textarea
                placeholder="Specific packaging, freight or payment requirements..."
                value={rfqForm.requirements}
                onChange={(e) => setRfqForm({ ...rfqForm, requirements: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-[#0B1F3B] text-white text-xs font-black flex items-center justify-center gap-2">
              <Send className="w-3.5 h-3.5" />
              <span>Submit Quotation Request</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
