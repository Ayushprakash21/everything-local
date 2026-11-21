import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Order, Product } from '../../types';
import { request, formatPaise } from '../../api/client';
import { Store as StoreIcon, Package, Check, X, Clock, Plus, ToggleLeft, ToggleRight, DollarSign, RefreshCw, AlertCircle, MapPin } from 'lucide-react';

export const MerchantDashboard: React.FC<{ openAuth: () => void }> = ({ openAuth }) => {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statements, setStatements] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'finance' | 'settings'>('orders');
  const [loading, setLoading] = useState(true);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Groceries');
  const [newProdMrp, setNewProdMrp] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('20');

  const fetchMerchantData = async () => {
    if (!user || user.role !== 'MERCHANT') return;
    setLoading(true);
    try {
      const storeRes = await request<{ store: Store }>('/merchant/store');
      setStore(storeRes.store);

      if (storeRes.store) {
        const [ordersRes, prodsRes, finRes] = await Promise.all([
          request<{ orders: Order[] }>('/merchant/orders'),
          request<{ products: Product[] }>('/merchant/products'),
          request<any>('/merchant/finance/statements')
        ]);
        setOrders(ordersRes.orders);
        setProducts(prodsRes.products);
        setStatements(finRes.summary);
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
          mrpPaise,
          pricePaise,
          stock,
          isAvailable: true
        })
      });

      setShowAddProductModal(false);
      setNewProdName('');
      setNewProdMrp('');
      setNewProdPrice('');
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

  if (!user || user.role !== 'MERCHANT') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <StoreIcon className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 text-lg">Merchant Console Access</h3>
        <p className="text-sm text-slate-500">
          Sign in with your verified merchant partner credentials to access your store portal.
        </p>
        <button
          onClick={openAuth}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Sign In as Merchant
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Merchant Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl border border-emerald-200">
            <StoreIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{store?.name || 'My Store'}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {store?.isVerified ? 'Verified Partner' : 'Pending Verification'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {store?.addressLine}, Indore (Service radius: {store?.serviceRadiusKm} km)
            </p>
          </div>
        </div>

        {/* Operating Status Switch */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">Store Status:</span>
          <button
            onClick={toggleStoreOpen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition shadow-xs ${
              store?.isOpen
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            <span>{store?.isOpen ? '● OPEN & ACCEPTING' : '○ CLOSED'}</span>
          </button>
        </div>
      </div>

      {/* Merchant Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders Dispatch ({orders.filter((o) => !['DELIVERED', 'COLLECTED', 'CANCELLED'].includes(o.status)).length} Active)</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-700'
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
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Sales & Payout Ledger</span>
        </button>
      </div>

      {/* Tab 1: Orders Dispatch Console */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Live Orders Feed</h2>
            <button
              onClick={fetchMerchantData}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800">No orders currently</h4>
              <p className="text-xs text-slate-500">New customer orders within 3 km will appear here in real-time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orders.map((order) => {
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            order.status === 'PLACED'
                              ? 'bg-amber-100 text-amber-900 animate-pulse'
                              : order.status === 'ACCEPTED'
                              ? 'bg-blue-100 text-blue-900'
                              : order.status === 'PREPARING'
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500">
                        <span>Mode: <strong className="text-slate-700">{order.fulfillmentMode}</strong></span>
                        <span className="mx-2">•</span>
                        <span>Customer: <strong className="text-slate-700">{order.customer?.name || 'Customer'}</strong></span>
                      </div>

                      {/* Items */}
                      <div className="py-2 border-y border-slate-100 space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-slate-700">{item.productName} x {item.quantity}</span>
                            <span className="font-semibold text-slate-900">{formatPaise(item.totalPricePaise)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between text-xs pt-1 font-bold">
                        <span className="text-slate-600">Merchant Net Payable:</span>
                        <span className="text-emerald-700">{formatPaise(order.merchantPayablePaise)}</span>
                      </div>
                    </div>

                    {/* Action Dispatch Buttons */}
                    <div className="pt-2 border-t border-slate-100">
                      {order.status === 'PLACED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'ACCEPTED')}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'REJECTED', 'Out of stock')}
                            className="py-2 px-3 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                          className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          Mark as Preparing
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
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          {order.fulfillmentMode === 'PICKUP' ? 'Ready for Counter Pickup' : 'Dispatch for Delivery'}
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
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          {order.fulfillmentMode === 'PICKUP' ? 'Handover Complete (Collected)' : 'Mark Delivered'}
                        </button>
                      )}

                      {['DELIVERED', 'COLLECTED'].includes(order.status) && (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1 py-1">
                          <Check className="w-4 h-4" /> Order Fulfilled & Settled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Product Catalogue Manager */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Manage Inventory & Pricing</h2>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Selling Price</th>
                  <th className="px-4 py-3">Stock Count</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{prod.name}</td>
                    <td className="px-4 py-3 text-slate-500">{prod.category}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatPaise(prod.pricePaise)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickStockUpdate(prod.id, prod.stock - 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold text-slate-800 min-w-[20px] text-center">{prod.stock}</span>
                        <button
                          onClick={() => handleQuickStockUpdate(prod.id, prod.stock + 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          prod.isAvailable && prod.stock > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {prod.isAvailable && prod.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleProductAvailability(prod.id, prod.isAvailable)}
                        className="text-xs font-semibold text-slate-600 hover:text-emerald-700"
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
      )}

      {/* Tab 3: Finance and Commission Statements */}
      {activeTab === 'finance' && statements && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Total Completed Sales (Gross)</span>
              <h3 className="text-2xl font-black text-slate-900">{statements.totalGrossSalesFormatted}</h3>
              <p className="text-[11px] text-slate-400">{statements.completedOrdersCount} orders fulfilled</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Platform Commission (3.5%)</span>
              <h3 className="text-2xl font-black text-amber-600">
                {statements.totalCommissionWithheldFormatted}
              </h3>
              <p className="text-[11px] text-slate-400">Fixed sustainable rate</p>
            </div>

            <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-emerald-800">Net Merchant Payable</span>
              <h3 className="text-2xl font-black text-emerald-900">{statements.totalNetPayableFormatted}</h3>
              <p className="text-[11px] text-emerald-700">Eligible for weekly settlement</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Add New Product</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanchi Gold Milk 500ml"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Category</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-emerald-500"
                >
                  <option value="Grocery Staples">Grocery Staples</option>
                  <option value="Dairy & Bakery">Dairy & Bakery</option>
                  <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                  <option value="Beverages & Snacks">Beverages & Snacks</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="35.00"
                    value={newProdMrp}
                    onChange={(e) => setNewProdMrp(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="32.00"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Initial Stock Units</label>
                <input
                  type="number"
                  required
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
