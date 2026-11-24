import React, { useState, useEffect } from 'react';
import { request, formatPaise } from '../../api/client';
import {
  Database,
  Layers,
  ArrowRightLeft,
  RefreshCw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Eye,
  Edit2,
  Trash2,
  ShieldAlert,
  Clock,
  Sparkles,
  ShoppingBag,
  Store,
  Check,
  X,
  FileText
} from 'lucide-react';

interface CatalogueProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand?: string | null;
  categoryName: string;
  department?: string | null;
  unit: string;
  packageSize?: string | null;
  mrpPaise: number;
  targetPricePaise?: number | null;
  imageUrl: string;
  isPrescriptionRequired: boolean;
  isService: boolean;
  status: string;
  environment: string;
  _count?: { offers: number };
}

interface EnvStatus {
  activeEnvironment: 'DEMO' | 'LIVE';
  demo: {
    totalProducts: number;
    activeOffers: number;
    participatingStores: number;
    topCategories: number;
    servicesCount: number;
    isPopulated: boolean;
    status: string;
  };
  live: {
    totalProducts: number;
    activeOffers: number;
    verifiedStores: number;
    pendingMerchantRequests: number;
    isPopulated: boolean;
    status: string;
  };
  lastSwitchedAt: string | null;
  lastSwitchedBy: string | null;
}

export const AdminCatalogueEnvironmentView: React.FC = () => {
  const [status, setStatus] = useState<EnvStatus | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<'DEMO' | 'LIVE'>('DEMO');
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Switch Environment Modal
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [targetEnv, setTargetEnv] = useState<'DEMO' | 'LIVE'>('DEMO');
  const [confirmInput, setConfirmInput] = useState('');
  const [switchReason, setSwitchReason] = useState('');
  const [switching, setSwitching] = useState(false);

  // Reset Demo Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Product Edit / Create Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<CatalogueProduct> | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // Bulk Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Merchant Requests & Audit Logs Tabs
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'requests' | 'audit'>('products');
  const [merchantRequests, setMerchantRequests] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Analytics & Media Coverage
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await request<EnvStatus>('/admin/catalogue-environments/status');
      setStatus(res);
      setSelectedEnv(res.activeEnvironment);
    } catch (err: any) {
      console.error('Failed to fetch catalogue status:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        environment: selectedEnv,
        page: page.toString(),
        limit: '30'
      });
      if (search) params.append('search', search);
      if (selectedDepartment && selectedDepartment !== 'all') params.append('department', selectedDepartment);

      const res = await request<any>(`/admin/catalogue-environments/products?${params.toString()}`);
      setProducts(res.products || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalProducts(res.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch catalogue products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await request<any>(`/admin/catalogue-environments/analytics?environment=${selectedEnv}`);
      setAnalytics(res);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchMerchantRequests = async () => {
    try {
      const res = await request<any>(`/admin/catalogue-environments/merchant-requests?environment=${selectedEnv}`);
      setMerchantRequests(res.requests || []);
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await request<any>(`/admin/catalogue-environments/audit-logs?environment=${selectedEnv}&limit=40`);
      setAuditLogs(res.logs || []);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'products') {
      fetchProducts();
      fetchAnalytics();
    } else if (activeSubTab === 'requests') {
      fetchMerchantRequests();
    } else if (activeSubTab === 'audit') {
      fetchAuditLogs();
    }
  }, [selectedEnv, page, selectedDepartment, activeSubTab]);

  const handleSwitchEnvironment = async () => {
    if (targetEnv === 'LIVE' && confirmInput !== 'SWITCH_TO_LIVE') {
      alert('Please type "SWITCH_TO_LIVE" to confirm activation of live commercial environment.');
      return;
    }

    setSwitching(true);
    try {
      await request('/admin/catalogue-environments/switch', {
        method: 'POST',
        body: JSON.stringify({
          targetEnvironment: targetEnv,
          confirmText: confirmInput,
          reason: switchReason || 'Super Admin Manual Switch'
        })
      });
      setShowSwitchModal(false);
      setConfirmInput('');
      setSwitchReason('');
      await fetchStatus();
      await fetchProducts();
      await fetchAuditLogs();
    } catch (err: any) {
      alert(`Switch failed: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      const res = await request<any>('/admin/catalogue-environments/demo/reset', {
        method: 'POST'
      });
      setShowResetModal(false);
      alert(`Demo Reset Successful: ${res.catalogueProductsCount} master catalogue items synchronized with ${res.activeOffersCount} store offers.`);
      await fetchStatus();
      await fetchProducts();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.mrpPaise) {
      alert('Product name and MRP are required.');
      return;
    }

    setSavingProduct(true);
    try {
      if (editingProduct.id) {
        // Update
        await request(`/admin/catalogue-environments/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingProduct)
        });
      } else {
        // Create
        await request('/admin/catalogue-environments/products', {
          method: 'POST',
          body: JSON.stringify({
            ...editingProduct,
            environment: selectedEnv
          })
        });
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(`Failed to save product: ${err.message}`);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeactivateProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"? It will be marked INACTIVE.`)) return;
    try {
      await request(`/admin/catalogue-environments/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err: any) {
      alert(`Deactivation failed: ${err.message}`);
    }
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    try {
      const res = await request<any>('/admin/catalogue-environments/import', {
        method: 'POST',
        body: JSON.stringify({ environment: selectedEnv, csvText })
      });
      setImportResult(res);
      fetchProducts();
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleModerateRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const reason = status === 'REJECTED' ? prompt('Enter rejection reason:') || 'Does not meet standards' : undefined;
    try {
      await request(`/admin/catalogue-environments/merchant-requests/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      fetchMerchantRequests();
    } catch (err: any) {
      alert(`Failed to moderate request: ${err.message}`);
    }
  };

  const departments = [
    { id: 'all', name: 'All Departments' },
    { id: 'Grocery & Staples', name: 'Grocery & Staples (100)' },
    { id: 'Fruits & Vegetables', name: 'Fruits & Vegetables (50)' },
    { id: 'Clothing & Fashion', name: 'Clothing & Fashion (70)' },
    { id: 'Beauty & Personal Care', name: 'Beauty & Personal Care (45)' },
    { id: 'Home, Kitchen & Décor', name: 'Home & Kitchen (65)' },
    { id: 'Electronics & Electrical', name: 'Electronics (45)' },
    { id: 'Jewellery & Accessories', name: 'Jewellery (45)' },
    { id: 'Bags, Footwear & Travel', name: 'Footwear & Bags (30)' },
    { id: 'Pharmacy & Wellness', name: 'Pharmacy & Wellness (30)' },
    { id: 'Services & Local', name: 'Services (20)' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Environment Master Control & State Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-forest-950 text-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-400/20 text-amber-400 rounded-2xl border border-amber-400/30">
                <Database className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    EveryBazaar Catalogue &amp; Environment Control
                  </h2>
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                      status?.activeEnvironment === 'LIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    ● {status?.activeEnvironment || 'DEMO'} ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Manage the 500-product master catalogue, merchant offers, and switch safely between Demo &amp; Live environments.
                </p>
              </div>
            </div>
          </div>

          {/* Environment Switcher Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setTargetEnv(status?.activeEnvironment === 'DEMO' ? 'LIVE' : 'DEMO');
                setShowSwitchModal(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>
                Switch to {status?.activeEnvironment === 'DEMO' ? 'LIVE' : 'DEMO'}
              </span>
            </button>

            {selectedEnv === 'DEMO' && (
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset 500 Demo Products</span>
              </button>
            )}
          </div>
        </div>

        {/* Environment Dual Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* Demo Card */}
          <div
            onClick={() => setSelectedEnv('DEMO')}
            className={`cursor-pointer p-5 rounded-2xl border transition ${
              selectedEnv === 'DEMO'
                ? 'bg-white/10 border-amber-400/60 ring-2 ring-amber-400/30'
                : 'bg-white/5 border-white/10 hover:bg-white/8'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Demo Environment (Sandbox)
                </span>
              </div>
              {status?.activeEnvironment === 'DEMO' && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE ON STOREFRONT
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Catalogue</span>
                <span className="text-lg font-black text-white">{status?.demo?.totalProducts || 500}</span>
              </div>
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Active Offers</span>
                <span className="text-lg font-black text-amber-400">{status?.demo?.activeOffers || 500}</span>
              </div>
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Demo Stores</span>
                <span className="text-lg font-black text-emerald-400">{status?.demo?.participatingStores || 10}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5">
              100% complete 10-department catalogue with authentic photographs &amp; branded vector fallbacks.
            </p>
          </div>

          {/* Live Card */}
          <div
            onClick={() => setSelectedEnv('LIVE')}
            className={`cursor-pointer p-5 rounded-2xl border transition ${
              selectedEnv === 'LIVE'
                ? 'bg-white/10 border-emerald-400/60 ring-2 ring-emerald-400/30'
                : 'bg-white/5 border-white/10 hover:bg-white/8'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Live Environment (Production)
                </span>
              </div>
              {status?.activeEnvironment === 'LIVE' && (
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE ON STOREFRONT
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Live Products</span>
                <span className="text-lg font-black text-white">{status?.live?.totalProducts || 0}</span>
              </div>
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Store Offers</span>
                <span className="text-lg font-black text-emerald-400">{status?.live?.activeOffers || 0}</span>
              </div>
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Verified Stores</span>
                <span className="text-lg font-black text-blue-400">{status?.live?.verifiedStores || 0}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5">
              Strict isolation: Zero demo data leakage into Live. Only verified merchants and real inventory appear here.
            </p>
          </div>
        </div>

        {/* Environment Audit Notice */}
        {status?.lastSwitchedAt && (
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Last switched to {status.activeEnvironment} on {new Date(status.lastSwitchedAt).toLocaleString()} by {status.lastSwitchedBy}
            </span>
          </div>
        )}
      </div>

      {/* 2. Sub-Tabs Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'products'
                ? 'bg-forest-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Catalogue Items ({totalProducts})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'requests'
                ? 'bg-forest-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Merchant Proposals ({merchantRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeSubTab === 'audit'
                ? 'bg-forest-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Trail Logs</span>
          </button>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingProduct({
                name: '',
                sku: `EB-MAN-${Date.now().toString(36).toUpperCase()}`,
                brand: '',
                categoryName: 'Grocery & Daily Essentials',
                unit: 'piece',
                mrpPaise: 10000,
                targetPricePaise: 9000,
                isPrescriptionRequired: false,
                isService: false,
                status: 'ACTIVE'
              });
              setShowProductModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <a
            href={`/api/admin/catalogue-environments/export?environment=${selectedEnv}`}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* 3. Sub-Tab Content: PRODUCTS */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                placeholder="Search by name, brand, SKU..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-forest-700"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:border-forest-700 font-medium"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                  <tr>
                    <th className="px-5 py-3.5">Item &amp; Image</th>
                    <th className="px-5 py-3.5">SKU &amp; Brand</th>
                    <th className="px-5 py-3.5">Category &amp; Department</th>
                    <th className="px-5 py-3.5">Unit / Pack</th>
                    <th className="px-5 py-3.5">MRP / Target Price</th>
                    <th className="px-5 py-3.5 text-center">Store Offers</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-forest-700" />
                        <span>Loading {selectedEnv} catalogue products...</span>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        No catalogue products found for selected filters in {selectedEnv} environment.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        {/* Image & Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-contain p-1"
                                onError={(e: any) => {
                                  e.target.src = '/brand/product-placeholder.svg';
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-snug">{p.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {p.isService && (
                                  <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded-sm">
                                    Service
                                  </span>
                                )}
                                {p.isPrescriptionRequired && (
                                  <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded-sm">
                                    Rx Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU & Brand */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-bold text-slate-800 block">{p.sku}</span>
                          <span className="text-[11px] text-slate-500">{p.brand || 'Generic / Local'}</span>
                        </td>

                        {/* Category & Department */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold text-slate-800 block">{p.categoryName}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">{p.department}</span>
                        </td>

                        {/* Unit / Pack */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-slate-700">{p.packageSize || p.unit}</span>
                        </td>

                        {/* MRP / Price */}
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-black text-slate-900">
                            {formatPaise(p.targetPricePaise || p.mrpPaise)}
                          </div>
                          {p.targetPricePaise && p.targetPricePaise < p.mrpPaise && (
                            <div className="text-[10px] text-slate-400 line-through">
                              {formatPaise(p.mrpPaise)}
                            </div>
                          )}
                        </td>

                        {/* Store Offers */}
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-forest-50 text-forest-900 border border-forest-200">
                            {p._count?.offers || 0} active
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setShowProductModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-forest-900 hover:bg-forest-50 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {p.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleDeactivateProduct(p.id, p.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Deactivate Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>
                Showing page {page} of {totalPages} ({totalProducts} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 font-bold hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 font-bold hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-Tab Content: MERCHANT PROPOSALS */}
      {activeSubTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Merchant Product Proposals</h3>
              <p className="text-xs text-slate-500">
                Review and approve products requested by local retailers for addition to the central catalogue.
              </p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
              {merchantRequests.length} Proposals
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                <tr>
                  <th className="px-5 py-3.5">Requested Product</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Store ID</th>
                  <th className="px-5 py-3.5">Proposed Price / MRP</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {merchantRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No merchant product proposals in queue.
                    </td>
                  </tr>
                ) : (
                  merchantRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[11px] text-slate-500">{r.brand || 'No brand specified'}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-800">{r.categoryName}</td>
                      <td className="px-5 py-4 font-mono text-slate-600">{r.storeId.slice(0, 8)}...</td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900">{formatPaise(r.proposedPricePaise || 0)}</span>
                        {r.proposedMrpPaise && (
                          <span className="text-[11px] text-slate-400 ml-1.5">(MRP: {formatPaise(r.proposedMrpPaise)})</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-900'
                              : r.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleModerateRequest(r.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition"
                            >
                              Approve to Catalogue
                            </button>
                            <button
                              onClick={() => handleModerateRequest(r.id, 'REJECTED')}
                              className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Sub-Tab Content: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Catalogue Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Immutable records of environment switches, product additions, imports, and catalogue modifications.
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Environment</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No audit log entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            log.environment === 'LIVE'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {log.environment}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">{log.actorEmail || 'System'}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600 max-w-md truncate">
                        {log.detailsJson || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Switch Active Environment */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-amber-100 text-amber-900 rounded-2xl">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Switch Active Catalogue to {targetEnv}
                </h3>
                <p className="text-xs text-slate-500">
                  This action alters what consumers and retailers see on EveryBazaar storefront.
                </p>
              </div>
            </div>

            {targetEnv === 'LIVE' ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-800 text-xs font-black">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>CRITICAL PRODUCTION SAFETY REQUIREMENT</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Activating LIVE mode will expose real merchant stores, verified catalog inventory, and enable live payment processing. Demo products will be hidden from consumer view.
                </p>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    Type "SWITCH_TO_LIVE" to authorize:
                  </label>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="SWITCH_TO_LIVE"
                    className="w-full px-3 py-2 text-xs border border-rose-300 rounded-xl font-mono uppercase focus:outline-hidden focus:border-rose-600"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <p className="text-xs text-amber-900 leading-relaxed">
                  Switching to DEMO activates the rich 500-product catalogue and 10 Indore demo department stores. Ideal for showcase, onboarding demos, and development testing.
                </p>
              </div>
            )}

            <div>
              <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                Reason for environment switch (recorded in audit log):
              </label>
              <input
                type="text"
                value={switchReason}
                onChange={(e) => setSwitchReason(e.target.value)}
                placeholder="e.g. Preparing for merchant onboarding demo"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-forest-700"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSwitchModal(false);
                  setConfirmInput('');
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={switching || (targetEnv === 'LIVE' && confirmInput !== 'SWITCH_TO_LIVE')}
                onClick={handleSwitchEnvironment}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-forest-900 hover:bg-forest-950 text-white shadow-md disabled:opacity-50"
              >
                {switching ? 'Switching...' : `Confirm Switch to ${targetEnv}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset Demo Dataset */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-rose-100 text-rose-900 rounded-2xl">
                <RefreshCw className="w-6 h-6 text-rose-600" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">Reset Demo Catalogue</h3>
                <p className="text-xs text-slate-500">Resets demo data to exact 500 products.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will re-synchronize the 500 canonical products, 10 department demo stores in Indore, and 500 active merchant offers. Existing demo cart items will be refreshed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetDemo}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50"
              >
                {resetting ? 'Resetting Catalogue...' : 'Confirm Reset (500 Items)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Product */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                {editingProduct.id ? 'Edit Catalogue Product' : 'Add New Catalogue Product'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    placeholder="e.g. Tata, Amul, Local"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  placeholder="e.g. Sharbati Whole Wheat Atta 5kg"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={editingProduct.categoryName || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingProduct.department || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, department: e.target.value })}
                    placeholder="e.g. Grocery & Daily Essentials"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    MRP (Rupees)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={((editingProduct.mrpPaise || 0) / 100).toString()}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        mrpPaise: Math.round(parseFloat(e.target.value || '0') * 100)
                      })
                    }
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    Target Price (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={((editingProduct.targetPricePaise || editingProduct.mrpPaise || 0) / 100).toString()}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        targetPricePaise: Math.round(parseFloat(e.target.value || '0') * 100)
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-forest-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    Unit / Pack Size
                  </label>
                  <input
                    type="text"
                    value={editingProduct.packageSize || editingProduct.unit || 'piece'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        unit: e.target.value,
                        packageSize: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                  Image URL (Leave empty for automatic branded vector placeholder)
                </label>
                <input
                  type="text"
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  placeholder="https://... or /product-images/..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isService || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isService: e.target.checked })}
                    className="rounded-md text-forest-700 focus:ring-forest-700"
                  />
                  <span className="text-xs font-bold text-slate-700">Is Service Item</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isPrescriptionRequired || false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isPrescriptionRequired: e.target.checked })
                    }
                    className="rounded-md text-forest-700 focus:ring-forest-700"
                  />
                  <span className="text-xs font-bold text-slate-700">Prescription Required</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-forest-900 hover:bg-forest-950 text-white shadow-md disabled:opacity-50"
                >
                  {savingProduct ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bulk CSV Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-forest-700" />
                <h3 className="text-lg font-black text-slate-900">
                  Bulk CSV Import ({selectedEnv})
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste CSV text below or download the template. Requires headers: <code>SKU, Name, Category, Brand, MRP, Target Price, Unit, Image URL</code>
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="SKU, Name, Category, Brand, MRP, Target Price, Unit, Image URL&#10;EB-GRO-999, Example Product, Grocery, BrandX, 150.00, 135.00, 1kg, "
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-hidden focus:border-forest-700"
            />

            {importResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="font-bold">
                  ✓ Successfully imported {importResult.importedCount} products into {selectedEnv}!
                </div>
                {importResult.errorsCount > 0 && (
                  <div className="text-rose-700">
                    ⚠ {importResult.errorsCount} rows skipped due to invalid data.
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <a
                href="/catalogue-template.csv"
                download
                className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV Template</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={importing || !csvText.trim()}
                  onClick={handleImportCsv}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-forest-900 hover:bg-forest-950 text-white shadow-md disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
