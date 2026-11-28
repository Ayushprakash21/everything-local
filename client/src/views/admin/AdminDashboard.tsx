import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Order, FinancialLedgerEntry } from '../../types';
import { request, formatPaise } from '../../api/client';
import { BrandLogo } from '../../components/BrandLogo';
import { ELLogo } from '../../components/ELLogo';
import { AdminMerchantOnboardingView } from './AdminMerchantOnboardingView';
import { AdminDeliveryOperationsView } from './delivery/AdminDeliveryOperationsView';
import { AdminProductImageryView } from './AdminProductImageryView';
import { AdminCategoryManagementView } from './AdminCategoryManagementView';
import { AdminCatalogueEnvironmentView } from './CatalogueEnvironmentView';
import { AdminWholesaleView } from './AdminWholesaleView';
import { AdminAppReleaseManagerView } from './AdminAppReleaseManagerView';
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
  Sparkles,
  Building2,
  Layers,
  Database,
  Smartphone
} from 'lucide-react';

export const AdminDashboard: React.FC<{ openAuth: () => void }> = ({ openAuth }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [merchants, setMerchants] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<FinancialLedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'control_tower' | 'delivery_operations' | 'onboarding' | 'catalogue_environments' | 'product_imagery' | 'categories' | 'wholesale' | 'app_releases' | 'delivery_pricing' | 'settlements' | 'orders' | 'ledger' | 'services' | 'pharmacies'>('catalogue_environments');
  const [controlMetrics, setControlMetrics] = useState<any>(null);
  const [liveTasks, setLiveTasks] = useState<any[]>([]);
  const [onlineRiders, setOnlineRiders] = useState<any[]>([]);
  const [deliveryPricingRules, setDeliveryPricingRules] = useState<any[]>([]);
  const [categoryCommissions, setCategoryCommissions] = useState<any[]>([]);
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [adminPharmacies, setAdminPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [metRes, merchRes, ordRes, ledRes, srvProvRes, srvBkgRes, pharmRes, ctMetRes, ctDelRes, dPriRes, commRes] = await Promise.all([
        request<any>('/admin/metrics'),
        request<{ stores: Store[] }>('/admin/merchants'),
        request<{ orders: Order[] }>('/admin/orders'),
        request<{ entries: FinancialLedgerEntry[] }>('/admin/finance/ledger'),
        request<{ providers: any[] }>('/services/admin/providers').catch(() => ({ providers: [] })),
        request<{ bookings: any[] }>('/services/admin/bookings').catch(() => ({ bookings: [] })),
        request<{ pharmacies: any[] }>('/pharmacy/admin/pharmacies').catch(() => ({ pharmacies: [] })),
        request<any>('/admin/control-tower/metrics').catch(() => null),
        request<any>('/admin/control-tower/delivery').catch(() => ({ activeTasks: [], onlineRiders: [] })),
        request<{ rules: any[] }>('/admin/delivery-pricing').catch(() => ({ rules: [] })),
        request<{ commissions: any[] }>('/admin/commissions').catch(() => ({ commissions: [] }))
      ]);

      setMetrics(metRes.metrics);
      setMerchants(merchRes.stores);
      setOrders(ordRes.orders);
      setLedger(ledRes.entries);
      setServiceProviders(srvProvRes.providers || []);
      setServiceBookings(srvBkgRes.bookings || []);
      setAdminPharmacies(pharmRes.pharmacies || []);
      if (ctMetRes) setControlMetrics(ctMetRes.metrics);
      if (ctDelRes) {
        setLiveTasks(ctDelRes.activeTasks || []);
        setOnlineRiders(ctDelRes.onlineRiders || []);
      }
      setDeliveryPricingRules(dPriRes.rules || []);
      setCategoryCommissions(commRes.commissions || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const handleVerifyServiceProvider = async (providerId: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') => {
    try {
      await request(`/services/admin/providers/${providerId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      fetchAdminData();
    } catch (err: any) {
      alert(`Error updating provider verification: ${err.message}`);
    }
  };

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

  const handleVerifyPharmacy = async (pharmacyId: string, isVerified: boolean, status: string) => {
    try {
      await request(`/pharmacy/admin/pharmacies/${pharmacyId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ isVerified, verificationStatus: status })
      });
      fetchAdminData();
    } catch (err: any) {
      alert(`Error updating pharmacy verification: ${err.message}`);
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
            <BrandLogo variant="symbol" size="large" className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  EveryBazaar Platform Admin
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
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('control_tower')}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'control_tower'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dispatch Control Tower ({liveTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('delivery_operations')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'delivery_operations'
              ? 'border-blue-700 text-blue-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>Delivery Operations</span>
        </button>

        <button
          onClick={() => setActiveTab('onboarding')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'onboarding'
              ? 'border-emerald-700 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Merchant Onboarding Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('catalogue_environments')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'catalogue_environments'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-amber-500" />
          <span>Catalogue &amp; Environments (500)</span>
        </button>

        <button
          onClick={() => setActiveTab('product_imagery')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'product_imagery'
              ? 'border-amber-600 text-amber-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Product Imagery Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'border-amber-600 text-amber-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-600" />
          <span>Category & Aisles System</span>
        </button>

        <button
          onClick={() => setActiveTab('wholesale')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'wholesale'
              ? 'border-[#0B1F3B] text-[#0B1F3B] font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#0B1F3B]" />
          <span>Wholesale Marketplace</span>
        </button>

        <button
          onClick={() => setActiveTab('app_releases')}
          className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'app_releases'
              ? 'border-indigo-700 text-indigo-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4 text-indigo-600" />
          <span>App Release Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery_pricing')}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'delivery_pricing'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Delivery Pricing Rules ({deliveryPricingRules.length})
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'settlements'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Category Commissions & Settlements
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Merchant Governance ({merchants.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Platform Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'ledger'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Double-Entry Ledger ({ledger.length})
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'services'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Services Marketplace ({serviceProviders.length})
        </button>

        <button
          onClick={() => setActiveTab('pharmacies')}
          className={`pb-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'pharmacies'
              ? 'border-forest-900 text-forest-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Licensed Pharmacies ({adminPharmacies.length})
        </button>
      </div>

      {/* TAB: DELIVERY OPERATIONS CONTROL TOWER */}
      {activeTab === 'delivery_operations' && <AdminDeliveryOperationsView />}

      {/* TAB: MERCHANT ONBOARDING DESK */}
      {activeTab === 'onboarding' && <AdminMerchantOnboardingView />}

      {/* TAB: CATALOGUE & ENVIRONMENT MANAGEMENT */}
      {activeTab === 'catalogue_environments' && <AdminCatalogueEnvironmentView />}

      {/* TAB: PRODUCT IMAGERY STUDIO */}
      {activeTab === 'product_imagery' && <AdminProductImageryView />}

      {/* TAB: CATEGORY & AISLES SYSTEM */}
      {activeTab === 'categories' && <AdminCategoryManagementView />}

      {/* TAB: DISPATCH CONTROL TOWER */}
      {activeTab === 'control_tower' && (
        <div className="space-y-6">
          {/* Executive Metrics */}
          {controlMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Net Contribution Margin
                </span>
                <div className="text-2xl font-black text-emerald-700">
                  {formatPaise(controlMetrics.netContributionMarginPaise)}
                </div>
                <span className="text-[11px] text-emerald-600 font-bold block">
                  {controlMetrics.netContributionPct}% of GMV
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Average Order Value (AOV)
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatPaise(controlMetrics.aovPaise)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Across all Indore zones
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  On-Time Delivery SLA
                </span>
                <div className="text-2xl font-black text-forest-800">
                  {controlMetrics.onTimeDeliveryPct}%
                </div>
                <span className="text-[11px] text-forest-600 font-semibold block">
                  Target: &gt; 96.0% SLA
                </span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-subtle space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Fleet (Online Riders)
                </span>
                <div className="text-2xl font-black text-amber-600">
                  {onlineRiders.length}
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Ready for instant dispatch
                </span>
              </div>
            </div>
          )}

          {/* Live Delivery Dispatch Tower Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Live Delivery Dispatch Tower</h3>
                <p className="text-xs text-slate-500">Real-time status of all active hyperlocal trips, OTP handovers &amp; assigned riders</p>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                {liveTasks.length} Active Tasks
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                  <tr>
                    <th className="px-5 py-3.5">Task #</th>
                    <th className="px-5 py-3.5">Tier</th>
                    <th className="px-5 py-3.5">Pickup Location</th>
                    <th className="px-5 py-3.5">Dropoff Address</th>
                    <th className="px-5 py-3.5">Assigned Rider</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Handover OTPs</th>
                    <th className="px-5 py-3.5 text-right">Rider Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {liveTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                        No active delivery trips in dispatch right now.
                      </td>
                    </tr>
                  ) : (
                    liveTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4 font-mono font-bold text-slate-900">{t.taskNumber}</td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                            {t.deliveryPriorityTier?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 max-w-xs truncate">{t.pickupAddress}</td>
                        <td className="px-5 py-4 text-slate-700 max-w-xs truncate">{t.deliveryAddress}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {t.rider ? `${t.rider.fullName} (${t.rider.riderCode})` : <span className="text-amber-600 font-bold">Unassigned</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            t.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-900'
                              : t.status === 'AVAILABLE'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px]">
                          <span className="block text-slate-500">Pick: <strong className="text-slate-800">{t.merchantPickupOtp}</strong></span>
                          <span className="block text-slate-500">Drop: <strong className="text-slate-800">{t.customerDeliveryOtp}</strong></span>
                        </td>
                        <td className="px-5 py-4 text-right font-black text-slate-900">
                          {formatPaise(t.estimatedPayoutPaise)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DELIVERY PRICING RULES */}
      {activeTab === 'delivery_pricing' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">4-Tier Delivery Priority Rules &amp; Dynamic Pricing</h3>
              <p className="text-xs text-slate-500">Governs delivery SLAs, base fees, per-km rates, extra pickup stop surcharges, and weight surcharges in Indore</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                <tr>
                  <th className="px-4 py-3">Tier Code</th>
                  <th className="px-4 py-3">Tier Name</th>
                  <th className="px-4 py-3">Promised SLA</th>
                  <th className="px-4 py-3">Base Fee</th>
                  <th className="px-4 py-3">Per KM Rate</th>
                  <th className="px-4 py-3">Priority Surcharge</th>
                  <th className="px-4 py-3">Extra Stop Surcharge</th>
                  <th className="px-4 py-3">Max Radius</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {deliveryPricingRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{rule.tier}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{rule.tierName}</td>
                    <td className="px-4 py-3.5 text-forest-800 font-black">{rule.promisedDeliveryMinutes} mins</td>
                    <td className="px-4 py-3.5">{formatPaise(rule.baseDeliveryFeePaise)}</td>
                    <td className="px-4 py-3.5">{formatPaise(rule.perKmRatePaise)}/km</td>
                    <td className="px-4 py-3.5 font-bold text-amber-700">{formatPaise(rule.prioritySurchargePaise)}</td>
                    <td className="px-4 py-3.5">{formatPaise(rule.extraPickupStopFeePaise)}/stop</td>
                    <td className="px-4 py-3.5">{rule.maxDeliveryRadiusKm} km</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CATEGORY COMMISSIONS & SETTLEMENTS */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Commercial Category Commission Schedules</h3>
              <p className="text-xs text-slate-500">Contractual take-rate applied during checkout and merchant settlement reconciliation</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {categoryCommissions.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {c.category}
                  </span>
                  <div className="text-2xl font-black text-forest-900">
                    {c.commissionRatePct}%
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Min MOV: {formatPaise(c.minOrderValuePaise)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* TAB 4: Services Marketplace Moderation */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Registered Indore Service Providers</h3>
                <p className="text-xs text-slate-500">Approve credentials, home coverage radii, and commission tiers.</p>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                {serviceProviders.length} Providers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-black">
                  <tr>
                    <th className="px-5 py-4">Business Name & Category</th>
                    <th className="px-5 py-4">Owner & Contact</th>
                    <th className="px-5 py-4">Coverage & Visit Modes</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceProviders.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block text-sm">{p.businessName}</span>
                        <span className="text-slate-500 text-[11px] font-semibold">{p.categorySlug} • ★ {p.rating.toFixed(1)}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <span className="font-bold block text-slate-800">{p.owner?.name || 'Partner'}</span>
                        <span className="text-slate-400 text-[11px]">{p.owner?.email || p.owner?.phone}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <span className="font-semibold block text-slate-800">
                          {p.hasShopVisit ? '🏢 Shop' : ''} {p.hasHomeVisit ? `🏠 Home (${p.homeVisitRadiusKm} km)` : ''}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {p._count?.services || 0} services • {p._count?.bookings || 0} bookings
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : p.verificationStatus === 'REJECTED'
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {p.verificationStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {p.verificationStatus !== 'VERIFIED' ? (
                          <button
                            onClick={() => handleVerifyServiceProvider(p.id, 'VERIFIED')}
                            className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-xs transition"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyServiceProvider(p.id, 'SUSPENDED')}
                            className="px-3 py-1.5 text-xs border border-rose-300 text-rose-700 rounded-xl hover:bg-rose-50 font-bold transition"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Licensed Pharmacies Governance */}
      {activeTab === 'pharmacies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-card">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  Licensed Retail Chemist & Drug Store Registry (FDA MP Approved)
                </h3>
                <p className="text-xs text-slate-500">
                  Statutory verification under Drugs and Cosmetics Act, 1940 and Pharmacy Act, 1948.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-black">
                  <tr>
                    <th className="px-5 py-3">Pharmacy / Chemist</th>
                    <th className="px-5 py-3">Address & Locality</th>
                    <th className="px-5 py-3">Drug Licences</th>
                    <th className="px-5 py-3">Registered Pharmacist</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminPharmacies.map((pharm: any) => (
                    <tr key={pharm.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{pharm.name}</p>
                        <p className="text-[11px] text-slate-400">{pharm.legalBusinessName}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {pharm.addressLine}, {pharm.city} - {pharm.pincode}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {pharm.licences && pharm.licences.length > 0 ? (
                          pharm.licences.map((l: any) => (
                            <span key={l.id} className="block text-[11px] font-mono">
                              {l.licenceType}: {l.licenceNumber}
                            </span>
                          ))
                        ) : (
                          <span className="text-amber-600 font-bold">Documents Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {pharm.pharmacists && pharm.pharmacists.length > 0 ? (
                          <div>
                            <p className="font-bold text-slate-800">{pharm.pharmacists[0].name}</p>
                            <p className="text-[10px] text-teal-800 font-mono">
                              {pharm.pharmacists[0].registrationNumber} ({pharm.pharmacists[0].councilName})
                            </p>
                          </div>
                        ) : (
                          <span className="text-rose-600 font-bold">No Pharmacist Linked</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            pharm.verificationStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : pharm.verificationStatus === 'REJECTED'
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {pharm.verificationStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {pharm.verificationStatus !== 'APPROVED' ? (
                          <button
                            onClick={() => handleVerifyPharmacy(pharm.id, true, 'APPROVED')}
                            className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-xs transition"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyPharmacy(pharm.id, false, 'SUSPENDED')}
                            className="px-3 py-1.5 text-xs border border-rose-300 text-rose-700 rounded-xl hover:bg-rose-50 font-bold transition"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wholesale' && <AdminWholesaleView />}
      {activeTab === 'app_releases' && <AdminAppReleaseManagerView />}
    </div>
  );
};
