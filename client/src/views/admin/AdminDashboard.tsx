import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Order, FinancialLedgerEntry } from '../../types';
import { request, formatPaise } from '../../api/client';
import { Shield, TrendingUp, Store as StoreIcon, Package, Users, Check, X, RefreshCw, DollarSign, Settings } from 'lucide-react';

export const AdminDashboard: React.FC<{ openAuth: () => void }> = ({ openAuth }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [merchants, setMerchants] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<FinancialLedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'orders' | 'ledger'>('overview');
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [metRes, merchRes, ordRes, ledRes] = await Promise.all([
        request<any>('/admin/metrics'),
        request<{ stores: Store[] }>('/admin/merchants'),
        request<{ orders: Order[] }>('/admin/orders'),
        request<{ entries: FinancialLedgerEntry[] }>('/admin/finance/ledger')
      ]);

      setMetrics(metRes.metrics);
      setMerchants(merchRes.stores);
      setOrders(ordRes.orders);
      setLedger(ledRes.entries);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const handleVerifyMerchant = async (storeId: string, isVerified: boolean) => {
    try {
      await request(`/admin/merchants/${storeId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ isVerified })
      });
      fetchAdminData();
    } catch (err: any) {
      alert(`Error updating verification: ${err.message}`);
    }
  };

  const handleUpdateCommission = async (storeId: string) => {
    const rate = prompt('Enter new commission percentage (e.g. 3.5):', '3.5');
    if (!rate) return;
    try {
      await request(`/admin/merchants/${storeId}/commission`, {
        method: 'PUT',
        body: JSON.stringify({ commissionRatePct: rate })
      });
      fetchAdminData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Shield className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 text-lg">Central Operations Governance</h3>
        <p className="text-sm text-slate-500">
          Sign in with platform administrator credentials to access platform operations.
        </p>
        <button
          onClick={openAuth}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Administration</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded-full">
              Indore HQ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time market analytics, merchant governance, and double-entry financial reconciliation.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold shadow-xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Gross Merchandise Value (GMV)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </span>
            <h3 className="text-2xl font-black text-slate-900">{metrics.totalGmvFormatted}</h3>
            <span className="text-[11px] text-slate-400 block">{metrics.totalOrdersCount} total customer orders</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Platform Net Commission</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </span>
            <h3 className="text-2xl font-black text-emerald-700">{metrics.platformNetRevenueFormatted}</h3>
            <span className="text-[11px] text-slate-400 block">3.5% average take rate</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Active Neighborhood Stores</span>
              <StoreIcon className="w-4 h-4 text-emerald-600" />
            </span>
            <h3 className="text-2xl font-black text-slate-900">{metrics.activeStoresCount}</h3>
            <span className="text-[11px] text-slate-400 block">Out of {metrics.totalStoresCount} registered stores</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Registered Consumers</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </span>
            <h3 className="text-2xl font-black text-slate-900">{metrics.totalCustomersCount}</h3>
            <span className="text-[11px] text-slate-400 block">In Indore pilot zone</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'overview' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
          }`}
        >
          Merchant Approvals ({merchants.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'orders' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
          }`}
        >
          All Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'ledger' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
          }`}
        >
          Financial Double-Entry Ledger ({ledger.length})
        </button>
      </div>

      {/* Tab: Merchants */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Store Details</th>
                <th className="px-5 py-3.5">Category & Location</th>
                <th className="px-5 py-3.5">Commission</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {merchants.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900 block text-sm">{m.name}</span>
                    <span className="text-slate-400 text-[11px]">{m.slug}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    <span className="font-semibold block capitalize">{m.category}</span>
                    <span className="text-slate-400 text-[11px]">{m.addressLine} (Radius: {m.serviceRadiusKm} km)</span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    <span>{m.commissionRatePct}%</span>
                    <button
                      onClick={() => handleUpdateCommission(m.id)}
                      className="ml-2 text-[10px] text-emerald-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    {m.isVerified ? (
                      <button
                        onClick={() => handleVerifyMerchant(m.id, false)}
                        className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyMerchant(m.id, true)}
                        className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                      >
                        Approve Store
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Order #</th>
                <th className="px-5 py-3.5">Store</th>
                <th className="px-5 py-3.5">Fulfillment</th>
                <th className="px-5 py-3.5">Total Paid</th>
                <th className="px-5 py-3.5">Platform Cut</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{o.orderNumber}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{o.store?.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{o.fulfillmentMode}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{formatPaise(o.totalAmountPaise)}</td>
                  <td className="px-5 py-3.5 font-bold text-emerald-700">{formatPaise(o.platformRevenuePaise)}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Financial Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Immutable Financial Audit Trail</h3>
              <p className="text-xs text-slate-500">Every debit and credit recorded in exact integer paise.</p>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Entry Type</th>
                <th className="px-4 py-2.5">Store</th>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.map((entry) => {
                const isCredit = entry.amountPaise > 0;
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-2.5 text-slate-400">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{entry.entryType}</td>
                    <td className="px-4 py-2.5 text-slate-700">{entry.store?.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{entry.reference || '—'}</td>
                    <td className={`px-4 py-2.5 text-right font-black ${isCredit ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isCredit ? '+' : ''}{formatPaise(entry.amountPaise)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
