import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Order, Product } from '../../types';
import { request, formatPaise } from '../../api/client';
import { ELLogo } from '../../components/ELLogo';
import { MerchantPortalView } from './MerchantPortalView';
import {
  Store as StoreIcon,
  Package,
  Check,
  X,
  Clock,
  Plus,
  DollarSign,
  RefreshCw,
  AlertCircle,
  MapPin,
  Upload,
  Barcode,
  Search,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  LogOut
} from 'lucide-react';

export const MerchantDashboard: React.FC<{ openAuth: () => void; onReturnToShop?: () => void }> = ({
  openAuth,
  onReturnToShop
}) => {
  const { user, logout } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statements, setStatements] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'finance'>('orders');
  const [loading, setLoading] = useState(true);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Grocery Staples');
  const [newProdPackageSize, setNewProdPackageSize] = useState('1 kg');
  const [newProdMrp, setNewProdMrp] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('25');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [catalogueSearching, setCatalogueSearching] = useState(false);
  const [catalogueStatus, setCatalogueStatus] = useState<string | null>(null);

  const fetchMerchantData = async () => {
    if (!user || user.role !== 'MERCHANT') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const storeRes = await request<{ store: Store }>('/merchant/store');
      setStore(storeRes.store);

      if (storeRes.store && storeRes.store.isVerified) {
        const [ordersRes, prodsRes, finRes] = await Promise.all([
          request<{ orders: Order[] }>('/merchant/orders'),
          request<{ products: Product[] }>('/merchant/products'),
          request<any>('/merchant/finance/statements')
        ]);
        setOrders(ordersRes.orders || []);
        setProducts(prodsRes.products || []);
        setStatements(finRes.summary || null);
      }
    } catch (err) {
      console.error('Failed to load merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, [user]);

  const toggleStoreOpen = async () => {
    if (!store) return;
    try {
      const res = await request<{ store: Store }>('/merchant/store', {
        method: 'PUT',
        body: JSON.stringify({ isOpen: !store.isOpen })
      });
      setStore(res.store);
    } catch (err) {
      console.error('Failed to toggle store status:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, note?: string) => {
    try {
      await request(`/merchant/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, note })
      });
      fetchMerchantData();
    } catch (err: any) {
      alert(`Error updating order: ${err.message}`);
    }
  };

  // Catalogue Barcode Lookup
  const handleBarcodeLookup = async (codeToLookup?: string) => {
    const code = codeToLookup || newProdBarcode.trim();
    if (!code) {
      alert('Please enter a barcode number');
      return;
    }
    setCatalogueSearching(true);
    setCatalogueStatus('Looking up external catalogue...');
    try {
      const res = await request<any>(`/merchant/catalogue/lookup?barcode=${encodeURIComponent(code)}`);
      if (res.found && res.product) {
        const p = res.product;
        setNewProdName(p.name || '');
        setNewProdBrand(p.brand || '');
        setNewProdCategory(p.category || 'Grocery Staples');
        setNewProdPackageSize(p.packageSize || '1 unit');
        if (p.mrpPaise) {
          setNewProdMrp((p.mrpPaise / 100).toFixed(2));
          setNewProdPrice(((p.mrpPaise * 0.9) / 100).toFixed(2)); // suggest 10% discount
        }
        if (p.imageUrl) {
          setNewProdImageUrl(p.imageUrl);
        }
        setCatalogueStatus(`✓ Found: ${p.name}`);
      } else {
        setCatalogueStatus('No match found in catalogue. Please fill details manually.');
      }
    } catch (err: any) {
      setCatalogueStatus('Lookup failed. Enter manually.');
    } finally {
      setCatalogueSearching(false);
    }
  };

  // Genuine Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('el_auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

      const res = await fetch(`${apiUrl}/upload/image`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setNewProdImageUrl(data.url);
    } catch (err: any) {
      alert(`Image upload error: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mrpPaise = Math.round(parseFloat(newProdMrp) * 100);
      const pricePaise = Math.round(parseFloat(newProdPrice) * 100);
      const stock = parseInt(newProdStock, 10);

      await request('/merchant/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newProdName,
          category: newProdCategory,
          brand: newProdBrand || undefined,
          packageSize: newProdPackageSize || undefined,
          barcode: newProdBarcode || undefined,
          imageUrl: newProdImageUrl || undefined,
          mrpPaise,
          pricePaise,
          stock,
          isAvailable: true
        })
      });

      setShowAddProductModal(false);
      setNewProdName('');
      setNewProdBrand('');
      setNewProdPackageSize('1 kg');
      setNewProdBarcode('');
      setNewProdImageUrl('');
      setNewProdMrp('');
      setNewProdPrice('');
      setCatalogueStatus(null);
      fetchMerchantData();
    } catch (err: any) {
      alert(`Failed to add product: ${err.message}`);
    }
  };

  const handleQuickStockUpdate = async (productId: string, newStock: number) => {
    try {
      await request(`/merchant/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ stock: Math.max(0, newStock) })
      });
      fetchMerchantData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProductAvailability = async (productId: string, current: boolean) => {
    try {
      await request(`/merchant/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: !current })
      });
      fetchMerchantData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && user && user.role === 'MERCHANT') {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading merchant store console...</p>
      </div>
    );
  }

  if (!user || user.role !== 'MERCHANT' || !store || !store.isVerified) {
    return (
      <MerchantPortalView
        store={store}
        onRefreshStore={fetchMerchantData}
        onReturnToShop={onReturnToShop}
      />
    );
  }

  const lowStockItems = products.filter((p) => p.stock < 10);
  const pendingOrders = orders.filter((o) => !['DELIVERED', 'COLLECTED', 'CANCELLED'].includes(o.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Merchant Header & Operating Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-card">
        <div className="flex items-center gap-4">
          <ELLogo variant="dark" size={56} className="shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {store?.name || 'My Local Store'}
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-forest-50 text-forest-800 px-2.5 py-0.5 rounded-full border border-forest-200">
                {store?.isVerified ? 'Verified Partner' : 'Pending Verification'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-forest-700" />
              {store?.addressLine}, Indore (Service radius: {store?.serviceRadiusKm} km)
            </p>
          </div>
        </div>

        {/* Operating Status Toggle & Logout */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Accepting Orders</span>
              <span className="text-xs font-black text-slate-800">
                {store?.isOpen ? 'Store is OPEN' : 'Store is CLOSED'}
              </span>
            </div>
            <button
              onClick={toggleStoreOpen}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 ${
                store?.isOpen
                  ? 'bg-forest-900 text-white hover:bg-forest-950'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              {store?.isOpen ? 'Switch to Closed' : 'Open Store'}
            </button>
          </div>

          <button
            onClick={logout}
            title="Sign out of merchant console"
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 text-xs font-bold"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Pending Orders
          </span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-slate-900">{pendingOrders.length}</h3>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Needs packaging & handover</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Revenue
          </span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-slate-900">
              {statements?.totalGrossSalesFormatted || '₹0.00'}
            </h3>
            <TrendingUp className="w-4 h-4 text-forest-700" />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {statements?.completedOrdersCount || 0} completed orders
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Catalogue Items
          </span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-slate-900">{products.length}</h3>
            <Package className="w-4 h-4 text-forest-700" />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Live neighbourhood inventory</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Low Stock Alert
          </span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-amber-600">{lowStockItems.length}</h3>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">&lt; 10 units remaining</p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'orders'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders Dispatch ({pendingOrders.length} Active)</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'products'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <StoreIcon className="w-4 h-4" />
          <span>Product Catalogue ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'finance'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Payout & Settlement Ledger</span>
        </button>
      </div>

      {/* TAB 1: Live Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">Live Orders Feed</h2>
            <button
              onClick={fetchMerchantData}
              className="flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-forest-950 bg-forest-50 px-3 py-1.5 rounded-xl border border-forest-200 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Feed</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2 shadow-subtle">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800">No orders received yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Customer orders placed within 3 km in Indore will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between shadow-subtle hover:shadow-card transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          order.status === 'PLACED'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200 animate-pulse'
                            : order.status === 'ACCEPTED'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : order.status === 'PREPARING'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-forest-100 text-forest-900 border border-forest-200'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      <span>
                        Fulfillment: <strong className="text-slate-800">{order.fulfillmentMode}</strong>
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        Customer: <strong className="text-slate-800">{order.customer?.name || 'Customer'}</strong>
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="py-2.5 border-y border-slate-100 space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-slate-700 font-medium">
                            {item.productName} <strong className="text-slate-900">×{item.quantity}</strong>
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatPaise(item.totalPricePaise)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs pt-1 font-bold">
                      <span className="text-slate-500 font-semibold">Net Payout (after 3.5% fee):</span>
                      <span className="text-forest-900 text-sm font-black">
                        {formatPaise(order.merchantPayablePaise)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100">
                    {order.status === 'PLACED' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'ACCEPTED')}
                          className="flex-1 py-2.5 px-3 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                          <span>Accept Order</span>
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'REJECTED', 'Out of stock')}
                          className="py-2.5 px-3 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                        className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition"
                      >
                        Start Packing (Mark Preparing)
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() =>
                          handleUpdateOrderStatus(
                            order.id,
                            order.fulfillmentMode === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY'
                          )
                        }
                        className="w-full py-2.5 px-3 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black transition"
                      >
                        {order.fulfillmentMode === 'PICKUP'
                          ? 'Ready for Counter Pickup'
                          : 'Dispatch for Local Delivery'}
                      </button>
                    )}

                    {(order.status === 'READY_FOR_PICKUP' || order.status === 'OUT_FOR_DELIVERY') && (
                      <button
                        onClick={() =>
                          handleUpdateOrderStatus(
                            order.id,
                            order.fulfillmentMode === 'PICKUP' ? 'COLLECTED' : 'DELIVERED'
                          )
                        }
                        className="w-full py-2.5 px-3 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black transition"
                      >
                        {order.fulfillmentMode === 'PICKUP'
                          ? 'Customer Collected (Handover Complete)'
                          : 'Confirm Delivery Complete'}
                      </button>
                    )}

                    {['DELIVERED', 'COLLECTED'].includes(order.status) && (
                      <span className="text-xs font-bold text-forest-800 flex items-center justify-center gap-1 py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Order Complete & Cleared for Settlement
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Product Catalogue Manager */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Inventory & Catalogue</h2>
              <p className="text-xs text-slate-500">Manage item availability, real selling prices and stock levels</p>
            </div>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-black">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Pack Size</th>
                    <th className="px-4 py-3.5">Price / MRP</th>
                    <th className="px-4 py-3.5">Stock</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-full h-full object-contain"
                                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                              />
                            ) : (
                              <StoreIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{prod.name}</span>
                            {prod.brand && (
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">{prod.brand}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium">{prod.category}</td>
                      <td className="px-4 py-3.5 text-slate-600 font-semibold">{prod.packageSize || '1 unit'}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-black text-slate-900 block">{formatPaise(prod.pricePaise)}</span>
                        {prod.mrpPaise > prod.pricePaise && (
                          <span className="text-[10px] text-slate-400 line-through">
                            MRP {formatPaise(prod.mrpPaise)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickStockUpdate(prod.id, prod.stock - 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
                          >
                            -
                          </button>
                          <span className="font-black text-slate-900 min-w-[20px] text-center">{prod.stock}</span>
                          <button
                            onClick={() => handleQuickStockUpdate(prod.id, prod.stock + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            prod.isAvailable && prod.stock > 0
                              ? 'bg-forest-100 text-forest-900 border border-forest-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {prod.isAvailable && prod.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleProductAvailability(prod.id, prod.isAvailable)}
                          className="text-xs font-bold text-slate-600 hover:text-forest-900 transition"
                        >
                          {prod.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Finance and Statements */}
      {activeTab === 'finance' && statements && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Gross Sales Fulfilled
              </span>
              <h3 className="text-3xl font-black text-slate-900">{statements.totalGrossSalesFormatted}</h3>
              <p className="text-xs text-slate-500 font-medium">{statements.completedOrdersCount} orders delivered</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Platform Commission (3.5%)
              </span>
              <h3 className="text-3xl font-black text-amber-600">
                {statements.totalCommissionWithheldFormatted}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Fixed 3.5% fair merchant support fee</p>
            </div>

            <div className="bg-forest-50 p-6 rounded-3xl border border-forest-200 shadow-card space-y-2">
              <span className="text-xs font-bold text-forest-800 uppercase tracking-wider block">
                Net Merchant Payout
              </span>
              <h3 className="text-3xl font-black text-forest-950">{statements.totalNetPayableFormatted}</h3>
              <p className="text-xs text-forest-800 font-semibold">Eligible for instant weekly NEFT payout</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Product Modal with Barcode Lookup & Genuine Image Upload */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-float max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">Add Product to Store</h3>
                <p className="text-xs text-slate-500">Scan or lookup barcode, or enter product details</p>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barcode Quick Lookup Bar */}
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/90 space-y-2">
              <label className="text-[11px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-amber-700" />
                <span>Quick Barcode / GTIN Lookup</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 8901030383701 or 8901058863261"
                  value={newProdBarcode}
                  onChange={(e) => setNewProdBarcode(e.target.value)}
                  className="flex-1 text-xs border border-amber-300 rounded-xl px-3 py-2 bg-white focus:outline-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleBarcodeLookup()}
                  disabled={catalogueSearching}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition disabled:opacity-50"
                >
                  {catalogueSearching ? 'Searching...' : 'Lookup'}
                </button>
              </div>
              {catalogueStatus && (
                <p className="text-[11px] font-bold text-amber-900">{catalogueStatus}</p>
              )}
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Product Image Upload & Preview */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Product Image Preview & Upload
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                    {newProdImageUrl ? (
                      <img
                        src={newProdImageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Choose Photo (PNG/JPG)'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Persistent object storage. Uploaded images will be visible on customer cards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Title & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanchi Gold Full Cream Milk 500ml"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-forest-700 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sanchi, Amul, Tata"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-forest-700 font-medium"
                  />
                </div>
              </div>

              {/* Category & Pack Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-forest-700 font-semibold"
                  >
                    <option value="Grocery Staples">Grocery Staples</option>
                    <option value="Dairy & Bakery">Dairy & Bakery</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Beverages & Snacks">Beverages & Snacks</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Household">Household</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 500ml, 1 kg, 5 kg"
                    value={newProdPackageSize}
                    onChange={(e) => setNewProdPackageSize(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-forest-700 font-medium"
                  />
                </div>
              </div>

              {/* Pricing (MRP and Selling Price) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="35.00"
                    value={newProdMrp}
                    onChange={(e) => setNewProdMrp(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="32.00"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-bold text-forest-900"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Initial Stock Units</label>
                <input
                  type="number"
                  required
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl text-xs font-black transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Save and Publish Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
