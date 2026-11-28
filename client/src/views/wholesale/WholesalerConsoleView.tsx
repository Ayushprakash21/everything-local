import React, { useState, useEffect } from 'react';
import { request, formatPaise } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Package,
  Plus,
  TrendingUp,
  FileText,
  Truck,
  Warehouse,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send
} from 'lucide-react';

interface WholesalerConsoleViewProps {
  openAuth: () => void;
  onBackToMarketplace: () => void;
  startInOnboarding?: boolean;
}

export const WholesalerConsoleView: React.FC<WholesalerConsoleViewProps> = ({
  openAuth,
  onBackToMarketplace,
  startInOnboarding = false
}) => {
  const { user, login } = useAuth();
  const [consoleData, setConsoleData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'add_product' | 'orders' | 'rfqs' | 'warehouses' | 'profile'
  >('overview');

  // Onboarding Form
  const [onboardForm, setOnboardForm] = useState({
    businessName: '',
    legalBusinessName: '',
    businessType: 'WHOLESALER',
    hasGst: false,
    gstin: '',
    panNumber: '',
    businessAddress: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452007',
    contactName: user?.name || '',
    contactPhone: '',
    contactEmail: user?.email || '',
    serviceableRegions: 'Indore, Bhopal, Ujjain, Madhya Pradesh',
    paymentPreferences: ['UPI', 'BANK_TRANSFER', 'ONLINE']
  });
  const [onboardStatus, setOnboardStatus] = useState<string | null>(null);

  // Add Product Form
  const [prodForm, setProdForm] = useState({
    categoryId: '',
    title: '',
    brand: '',
    description: '',
    sku: '',
    hsnCode: '',
    unitOfMeasurement: 'pieces',
    packageSize: '',
    moq: 10,
    basePriceRupees: 100,
    listingType: 'TIERED',
    dispatchTime: '24-48 Hours',
    taxClassification: 'GST_5',
    initialStock: 200,
    tiers: [
      { minQty: 10, maxQty: '49', priceRupees: 100 },
      { minQty: 50, maxQty: '', priceRupees: 90 }
    ]
  });

  // Add Warehouse Form
  const [whForm, setWhForm] = useState({
    name: '',
    addressLine: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: ''
  });

  // Quotation Modal
  const [quoteRfq, setQuoteRfq] = useState<any | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    quotedUnitPriceRupees: 100,
    quotedQty: 50,
    deliveryChargeRupees: 0,
    validDays: 7,
    termsAndConditions: 'Ex-warehouse dispatch within 48 hours of advance confirmation.'
  });

  const loadConsole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const [catRes, ovRes] = await Promise.all([
        request<{ categories: any[] }>('/wholesale/categories'),
        request<any>('/wholesale/console/overview')
      ]);
      setCategories(catRes.categories || []);
      setConsoleData(ovRes);
      if (catRes.categories?.length && !prodForm.categoryId) {
        setProdForm((p) => ({ ...p, categoryId: catRes.categories[0].id }));
      }
    } catch (err: any) {
      if (err.status === 404) {
        setNotFound(true);
      }
      const catRes = await request<{ categories: any[] }>('/wholesale/categories').catch(() => ({ categories: [] }));
      setCategories(catRes.categories || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsole();
  }, [user]);

  const handleDemoWholesalerLogin = async () => {
    try {
      await login('wholesaler@everythinglocal.in', 'Password@123');
    } catch (err: any) {
      alert(err.message || 'Demo login failed');
    }
  };

  const handleRegisterWholesaler = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardStatus(null);
    try {
      await request('/wholesale/onboarding/register', {
        method: 'POST',
        body: JSON.stringify({
          ...onboardForm,
          serviceableRegions: onboardForm.serviceableRegions.split(',').map((s) => s.trim()).filter(Boolean)
        })
      });
      setOnboardStatus('Application submitted! Super Admin approval is required before your products go live.');
      await loadConsole();
    } catch (err: any) {
      setOnboardStatus(`Error: ${err.message}`);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await request('/wholesale/console/products', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: prodForm.categoryId,
          title: prodForm.title,
          brand: prodForm.brand,
          description: prodForm.description,
          sku: prodForm.sku,
          hsnCode: prodForm.hsnCode,
          unitOfMeasurement: prodForm.unitOfMeasurement,
          packageSize: prodForm.packageSize,
          moq: Number(prodForm.moq),
          basePricePaise: Math.round(Number(prodForm.basePriceRupees) * 100),
          listingType: prodForm.listingType,
          dispatchTime: prodForm.dispatchTime,
          taxClassification: prodForm.taxClassification,
          initialStock: Number(prodForm.initialStock),
          priceTiers: prodForm.tiers.map((t) => ({
            minQty: Number(t.minQty),
            maxQty: t.maxQty ? Number(t.maxQty) : null,
            pricePaise: Math.round(Number(t.priceRupees) * 100)
          }))
        })
      });
      setActiveTab('products');
      await loadConsole();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      await request(`/wholesale/console/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadConsole();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteRfq) return;
    try {
      await request(`/wholesale/console/rfqs/${quoteRfq.id}/quote`, {
        method: 'POST',
        body: JSON.stringify({
          quotedUnitPricePaise: Math.round(Number(quoteForm.quotedUnitPriceRupees) * 100),
          quotedQty: Number(quoteForm.quotedQty),
          deliveryChargePaise: Math.round(Number(quoteForm.deliveryChargeRupees) * 100),
          validDays: Number(quoteForm.validDays),
          termsAndConditions: quoteForm.termsAndConditions
        })
      });
      setQuoteRfq(null);
      await loadConsole();
    } catch (err: any) {
      alert(err.message || 'Failed to submit quotation');
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await request('/wholesale/warehouses', {
        method: 'POST',
        body: JSON.stringify(whForm)
      });
      setWhForm({ name: '', addressLine: '', city: 'Indore', state: 'Madhya Pradesh', pincode: '' });
      await loadConsole();
    } catch (err: any) {
      alert(err.message || 'Failed to add warehouse');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Building2 className="w-12 h-12 text-[#0B1F3B] mx-auto" />
        <h2 className="text-xl font-black text-slate-900">EveryBazaar Wholesaler Console</h2>
        <p className="text-xs text-slate-600">Sign in with your Wholesaler account or try the verified Indore Wholesale Mandi demo account.</p>
        <div className="space-y-2.5">
          <button onClick={openAuth} className="w-full py-3 rounded-xl bg-[#0B1F3B] text-white text-xs font-black">
            Sign In / Register
          </button>
          <button
            onClick={handleDemoWholesalerLogin}
            className="w-full py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold"
          >
            Demo Wholesaler Login (Malwa Agro & FMCG)
          </button>
          <button onClick={onBackToMarketplace} className="text-xs font-bold text-slate-500 hover:underline">
            Back to Wholesale Marketplace
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#0B1F3B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading Wholesaler Console...</p>
      </div>
    );
  }

  if (notFound || startInOnboarding && !consoleData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={onBackToMarketplace} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-4 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Wholesale Marketplace
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
              Wholesaler Onboarding
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Become an Approved EveryBazaar Wholesaler</h2>
            <p className="text-xs text-slate-600 mt-1">
              Register your manufacturing unit, distributorship, or wholesale business. Super Admin reviews and approves applications before listings go live.
            </p>
          </div>

          <form onSubmit={handleRegisterWholesaler} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Trade / Storefront Name"
                value={onboardForm.businessName}
                onChange={(e) => setOnboardForm({ ...onboardForm, businessName: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Legal Business Name"
                value={onboardForm.legalBusinessName}
                onChange={(e) => setOnboardForm({ ...onboardForm, legalBusinessName: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={onboardForm.businessType}
                onChange={(e) => setOnboardForm({ ...onboardForm, businessType: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                <option value="WHOLESALER">Wholesaler</option>
                <option value="DISTRIBUTOR">Authorized Distributor</option>
                <option value="MANUFACTURER">Manufacturer</option>
                <option value="IMPORTER">Importer</option>
                <option value="STOCKIST">Super Stockist</option>
              </select>
              <input
                type="text"
                placeholder="PAN Number (Optional)"
                value={onboardForm.panNumber}
                onChange={(e) => setOnboardForm({ ...onboardForm, panNumber: e.target.value.toUpperCase() })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={onboardForm.hasGst}
                  onChange={(e) => setOnboardForm({ ...onboardForm, hasGst: e.target.checked })}
                />
                <span>Business is GST Registered</span>
              </label>
              {onboardForm.hasGst && (
                <input
                  type="text"
                  required
                  placeholder="15-digit GSTIN (e.g. 23AABCM1234F1Z5)"
                  value={onboardForm.gstin}
                  onChange={(e) => setOnboardForm({ ...onboardForm, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
              )}
            </div>

            <input
              type="text"
              required
              placeholder="Registered Business Address"
              value={onboardForm.businessAddress}
              onChange={(e) => setOnboardForm({ ...onboardForm, businessAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                required
                placeholder="City"
                value={onboardForm.city}
                onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="text"
                required
                placeholder="State"
                value={onboardForm.state}
                onChange={(e) => setOnboardForm({ ...onboardForm, state: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Pincode"
                value={onboardForm.pincode}
                onChange={(e) => setOnboardForm({ ...onboardForm, pincode: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Primary Contact Name"
                value={onboardForm.contactName}
                onChange={(e) => setOnboardForm({ ...onboardForm, contactName: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Contact Phone"
                value={onboardForm.contactPhone}
                onChange={(e) => setOnboardForm({ ...onboardForm, contactPhone: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <input
              type="text"
              placeholder="Serviceable Regions (comma separated, e.g. Indore, Bhopal, Pan India)"
              value={onboardForm.serviceableRegions}
              onChange={(e) => setOnboardForm({ ...onboardForm, serviceableRegions: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />

            {onboardStatus && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                {onboardStatus}
              </div>
            )}

            <button type="submit" className="w-full py-3 rounded-xl bg-[#0B1F3B] hover:bg-slate-800 text-white text-xs font-black">
              Submit Wholesaler Application
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { profile, metrics, products = [], orders = [], rfqs = [] } = consoleData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">{profile?.businessName}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                profile?.verificationStatus === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {profile?.verificationStatus}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {profile?.businessType} • {profile?.city}, {profile?.state} {profile?.gstin ? `• GSTIN: ${profile.gstin}` : ''}
          </p>
        </div>
        <button onClick={onBackToMarketplace} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50">
          View Marketplace
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'products', label: `Products & Inventory (${products.length})` },
          { id: 'add_product', label: '+ Add Wholesale Product' },
          { id: 'orders', label: `Orders & Dispatch (${orders.length})` },
          { id: 'rfqs', label: `RFQ Inbox (${rfqs.length})` },
          { id: 'warehouses', label: `Warehouses (${profile?.warehouses?.length || 0})` },
          { id: 'profile', label: 'Business & KYC' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition ${
              activeTab === t.id
                ? 'bg-[#0B1F3B] text-white border-[#0B1F3B]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total GMV', val: formatPaise(metrics.totalGmvPaise) },
            { label: 'Net Revenue', val: formatPaise(metrics.revenuePaise) },
            { label: 'Total Orders', val: metrics.totalOrders },
            { label: 'Pending Orders', val: metrics.pendingOrders },
            { label: 'Products Listed', val: metrics.productsListed },
            { label: 'Low Stock Alerts', val: metrics.lowStock },
            { label: 'Pending RFQs', val: metrics.pendingRfqs },
            { label: 'Accepted Quotes', val: metrics.acceptedQuotations },
            { label: 'Avg Order Value', val: formatPaise(metrics.averageOrderValuePaise) }
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-4">
              <span className="text-[11px] font-bold text-slate-500 block">{m.label}</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{m.val}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-3">
          {products.map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900">{p.title}</h4>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black">{p.approvalStatus}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  SKU: {p.sku} • MOQ: {p.moq} {p.unitOfMeasurement} • Base: {formatPaise(p.basePricePaise)} • Tiers: {p.priceTiers?.length || 0}
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="font-bold text-slate-800 block">
                  Stock: {p.inventories?.[0]?.availableQty ?? 0} {p.unitOfMeasurement}
                </span>
                <span className="text-[11px] text-slate-500">{p.listingType}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'add_product' && (
        <form onSubmit={handleCreateProduct} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900">Add New Wholesale Listing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              required
              value={prodForm.categoryId}
              onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Product Title"
              value={prodForm.title}
              onChange={(e) => setProdForm({ ...prodForm, title: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input
              type="text"
              required
              placeholder="SKU"
              value={prodForm.sku}
              onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              placeholder="Brand"
              value={prodForm.brand}
              onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="number"
              required
              min={1}
              placeholder="MOQ"
              value={prodForm.moq}
              onChange={(e) => setProdForm({ ...prodForm, moq: Number(e.target.value) })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              placeholder="Unit (pieces, kg, cartons)"
              value={prodForm.unitOfMeasurement}
              onChange={(e) => setProdForm({ ...prodForm, unitOfMeasurement: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              required
              min={1}
              placeholder="Base Price (₹)"
              value={prodForm.basePriceRupees}
              onChange={(e) => setProdForm({ ...prodForm, basePriceRupees: Number(e.target.value) })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="number"
              required
              min={0}
              placeholder="Initial Stock"
              value={prodForm.initialStock}
              onChange={(e) => setProdForm({ ...prodForm, initialStock: Number(e.target.value) })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <select
              value={prodForm.listingType}
              onChange={(e) => setProdForm({ ...prodForm, listingType: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              <option value="TIERED">Tiered Bulk</option>
              <option value="FIXED">Fixed Wholesale</option>
              <option value="NEGOTIABLE">Negotiable</option>
              <option value="RFQ">RFQ Only</option>
              <option value="MADE_TO_ORDER">Made to Order</option>
            </select>
          </div>
          <textarea
            required
            placeholder="Detailed wholesale specifications, grade, packaging..."
            value={prodForm.description}
            onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
          />
          <button type="submit" className="px-6 py-3 rounded-xl bg-[#0B1F3B] text-white text-xs font-black">
            Submit Listing for Approval
          </button>
        </form>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.map((o: any) => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-black text-[#0B1F3B]">{o.orderNumber}</span>
                  <p className="text-xs text-slate-500">
                    Buyer: {o.buyer?.name} ({o.buyer?.email}) • {o.fulfillmentMethod}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">{formatPaise(o.totalPaise)}</span>
                  <select
                    value={o.status}
                    onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    {[
                      'PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PROCESSING', 'READY_TO_DISPATCH',
                      'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
                    ].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'rfqs' && (
        <div className="space-y-3">
          {rfqs.map((r: any) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-[#0B1F3B]">{r.rfqNumber} • {r.status}</span>
                <h4 className="text-sm font-black text-slate-900">{r.product?.title}</h4>
                <p className="text-xs text-slate-500">
                  Buyer: {r.buyer?.name} • Qty: {r.requestedQty} {r.product?.unitOfMeasurement} • {r.deliveryCity} ({r.deliveryPincode})
                </p>
                {r.requirements && <p className="text-xs text-slate-600 mt-1">Note: {r.requirements}</p>}
              </div>
              {r.status === 'OPEN' && (
                <button
                  onClick={() => {
                    setQuoteRfq(r);
                    setQuoteForm((q) => ({ ...q, quotedQty: r.requestedQty }));
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black"
                >
                  Send Quotation
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {(profile?.warehouses || []).map((w: any) => (
              <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <h4 className="text-sm font-black text-slate-900">{w.name}</h4>
                <p className="text-xs text-slate-600 mt-1">{w.addressLine}, {w.city}, {w.state} - {w.pincode}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddWarehouse} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 h-fit">
            <h4 className="text-sm font-black text-slate-900">Add Dispatch Warehouse</h4>
            <input
              type="text"
              required
              placeholder="Warehouse Name"
              value={whForm.name}
              onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              placeholder="Full Address"
              value={whForm.addressLine}
              onChange={(e) => setWhForm({ ...whForm, addressLine: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="City"
                value={whForm.city}
                onChange={(e) => setWhForm({ ...whForm, city: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Pincode"
                value={whForm.pincode}
                onChange={(e) => setWhForm({ ...whForm, pincode: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-[#0B1F3B] text-white text-xs font-black">
              Save Warehouse
            </button>
          </form>
        </div>
      )}

      {activeTab === 'profile' && profile && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 max-w-2xl text-xs">
          <h3 className="text-base font-black text-slate-900">Business & Verification Record</h3>
          <p><strong>Legal Name:</strong> {profile.legalBusinessName}</p>
          <p><strong>Business Type:</strong> {profile.businessType}</p>
          <p><strong>GSTIN:</strong> {profile.hasGst ? profile.gstin : 'Not Applicable / Unregistered'}</p>
          <p><strong>PAN:</strong> {profile.panNumber || 'Not Provided'}</p>
          <p><strong>Address:</strong> {profile.businessAddress}, {profile.city}, {profile.state} - {profile.pincode}</p>
          <p><strong>Verification Status:</strong> {profile.verificationStatus}</p>
        </div>
      )}

      {quoteRfq && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitQuote} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Submit Quotation for {quoteRfq.rfqNumber}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Quoted Unit Price (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quoteForm.quotedUnitPriceRupees}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quotedUnitPriceRupees: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quoteForm.quotedQty}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quotedQty: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Freight / Delivery Charge (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={quoteForm.deliveryChargeRupees}
                  onChange={(e) => setQuoteForm({ ...quoteForm, deliveryChargeRupees: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <textarea
                placeholder="Terms and conditions"
                value={quoteForm.termsAndConditions}
                onChange={(e) => setQuoteForm({ ...quoteForm, termsAndConditions: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setQuoteRfq(null)} className="px-4 py-2 rounded-xl border text-xs font-bold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#0B1F3B] text-white text-xs font-black">
                Submit Quotation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
