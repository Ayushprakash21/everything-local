import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Order, FinancialLedgerEntry } from '../../types';
import { request, formatPaise } from '../../api/client';
import { ELLogo } from '../../components/ELLogo';
import {
  Shield,
  TrendingUp,
  Store as StoreIcon,
  Package,
  Users,
  Check,
  X,
  RefreshCw,
  DollarSign,
  Settings,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Sparkles
} from 'lucide-react';

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
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="font-black text-slate-900 text-xl">Central Governance Portal</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Sign in with platform administrator credentials to inspect Indore market operations.
        </p>
        <button
          onClick={openAuth}
          className="px-6 py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Admin Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-card">
        <div>
          <div className="flex items-center gap-3">
            <ELLogo variant="dark" size={44} className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Everything Local Platform Admin
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                  Indore Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Hyperlocal retail operations, merchant verification and immutable financial ledger.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-forest-50 hover:bg-forest-100 text-forest-900 border border-forest-200 rounded-2xl text-xs font-black shadow-2xs transition active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* 2. Platform KPI Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Gross Merchandise Value</span>
              <TrendingUp className="w-4 h-4 text-forest-700" />
            </span>
            <h3 className="text-3xl font-black text-slate-900">{metrics.totalGmvFormatted}</h3>
            <span className="text-xs text-slate-500 font-medium block">
              {metrics.totalOrdersCount} total customer orders
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Platform Take Rate (Net)</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </span>
            <h3 className="text-3xl font-black text-forest-900">
              {metrics.platformNetRevenueFormatted}
            </h3>
            <span className="text-xs text-slate-500 font-medium block">
              3.5% sustainable merchant support fee
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active Merchants</span>
              <StoreIcon className="w-4 h-4 text-forest-700" />
            </span>
            <h3 className="text-3xl font-black text-slate-900">{metrics.activeStoresCount}</h3>
            <span className="text-xs text-slate-500 font-medium block">
              {metrics.totalStoresCount} registered in Indore pilot
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-subtle space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Verified Consumers</span>
              <Users className="w-4 h-4 text-forest-700" />
            </span>
            <h3 className="text-3xl font-black text-slate-900">{metrics.totalCustomersCount}</h3>
            <span className="text-xs text-slate-500 font-medium block">Active within 3 km pilot zone</span>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Merchant Governance ({merchants.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Platform Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Double-Entry Ledger ({ledger.length})
        </button>
      </div>

      {/* TAB 1: Merchant Governance */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-black">
                <tr>
                  <th className="px-5 py-4">Store Identity</th>
                  <th className="px-5 py-4">Category & Location</th>
                  <th className="px-5 py-4">Commission Rate</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block text-sm">{m.name}</span>
                      <span className="text-slate-400 text-[11px] font-mono">{m.slug}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className="font-bold block capitalize text-slate-800">{m.category}</span>
                      <span className="text-slate-400 text-[11px] font-medium">
                        {m.addressLine} (Radius: {m.serviceRadiusKm} km)
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black text-slate-900">
                      <span>{m.commissionRatePct}%</span>
                      <button
                        onClick={() => handleUpdateCommission(m.id)}
                        className="ml-2 text-[10px] text-forest-800 hover:underline font-bold"
                      >
                        Adjust
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          m.isVerified
                            ? 'bg-forest-100 text-forest-900 border border-forest-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {m.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {m.isVerified ? (
                        <button
                          onClick={() => handleVerifyMerchant(m.id, false)}
                          className="px-3 py-1.5 text-xs border border-rose-300 text-rose-700 rounded-xl hover:bg-rose-50 font-bold transition"
                        >
                          Suspend Store
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyMerchant(m.id, true)}
                          className="px-3 py-1.5 text-xs bg-forest-900 text-white rounded-xl hover:bg-forest-950 font-black shadow-xs transition"
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
        </div>
      )}

      {/* TAB 2: Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-black">
                <tr>
                  <th className="px-5 py-4">Order #</th>
                  <th className="px-5 py-4">Store</th>
                  <th className="px-5 py-4">Mode</th>
                  <th className="px-5 py-4">Subtotal / Total</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">{o.orderNumber}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{o.store.name}</td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">{o.fulfillmentMode}</td>
                    <td className="px-5 py-4">
                      <span className="font-black text-slate-900 block">{formatPaise(o.totalAmountPaise)}</span>
                      <span className="text-[10px] text-slate-400">
                        Commission: {formatPaise(o.commissionPaise)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          ['DELIVERED', 'COLLECTED'].includes(o.status)
                            ? 'bg-forest-100 text-forest-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Financial Double-Entry Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-sans font-black">
                <tr>
                  <th className="px-5 py-4">Entry ID</th>
                  <th className="px-5 py-4">Account</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3 text-slate-400">{e.id.slice(0, 8)}...</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{e.account}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.entryType === 'CREDIT'
                            ? 'bg-forest-100 text-forest-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {e.entryType}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">{formatPaise(e.amountPaise)}</td>
                    <td className="px-5 py-3 text-slate-500 font-sans text-xs">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
