import React, { useState, useEffect } from 'react';
import { request } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ServiceProvider, ServiceBooking, ProviderStaff, ServiceListing } from '../../types';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  Home,
  Users,
  ShieldCheck,
  AlertCircle,
  Plus,
  RefreshCw,
  Phone,
  ChevronRight,
  Filter,
  Check,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ProviderConsoleViewProps {
  openAuth: () => void;
}

export const ProviderConsoleView: React.FC<ProviderConsoleViewProps> = ({ openAuth }) => {
  const { user, login } = useAuth();
  const [data, setData] = useState<{
    provider: ServiceProvider;
    metrics: {
      totalBookings: number;
      completedBookings: number;
      pendingBookings: number;
      totalRevenuePaise: number;
      totalNetEarningsPaise: number;
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BOOKINGS' | 'SERVICES' | 'STAFF' | 'EARNINGS'>('BOOKINGS');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add Service Modal State
  const [showAddService, setShowAddService] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('499');
  const [newDuration, setNewDuration] = useState('45');
  const [newAllowsShop, setNewAllowsShop] = useState(true);
  const [newAllowsHome, setNewAllowsHome] = useState(true);
  const [serviceSubmitting, setServiceSubmitting] = useState(false);

  // Status Update State
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchConsoleData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await request<any>('/services/provider/console');
      setData(res);
    } catch (err) {
      console.error('Provider console fetch error:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsoleData();
  }, [user]);

  const handleUpdateStatus = async (bookingId: string, nextStatus: string, staffId?: string) => {
    setUpdatingId(bookingId);
    try {
      await request(`/services/provider/bookings/${bookingId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: nextStatus,
          staffId
        })
      });
      await fetchConsoleData();
    } catch (err: any) {
      alert(err.message || 'Failed to update booking status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.provider) return;
    setServiceSubmitting(true);
    try {
      // Find categoryId
      const categoriesRes = await request<{ categories: any[] }>('/services/categories');
      const cat = categoriesRes.categories.find((c) => c.slug === data.provider.categorySlug) || categoriesRes.categories[0];

      await request('/services/provider/services', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          categoryId: cat.id,
          pricePaise: Math.round(parseFloat(newPrice) * 100),
          durationMinutes: parseInt(newDuration, 10),
          allowsShopVisit: newAllowsShop,
          allowsHomeVisit: newAllowsHome
        })
      });

      setShowAddService(false);
      setNewTitle('');
      setNewDesc('');
      await fetchConsoleData();
    } catch (err: any) {
      alert(err.message || 'Failed to add service');
    } finally {
      setServiceSubmitting(false);
    }
  };

  const handleDemoLogin = async (email: string) => {
    try {
      await login(email, 'Password@123');
    } catch (err) {
      alert('Demo login failed. Make sure seed services have run.');
    }
  };

  // Not signed in state
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Service Partner Portal</h2>
        <p className="text-xs text-slate-500 mb-6">
          Sign in to your Everything Local provider account to manage bookings, assign specialists and view earnings.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleDemoLogin('glamour.salon@everythinglocal.in')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-between"
          >
            <span>Log in as Glamour & Glow Salon (Indore)</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => handleDemoLogin('quickfix.electric@everythinglocal.in')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-between"
          >
            <span>Log in as Indore QuickFix Electricians</span>
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </button>

          <button
            onClick={openAuth}
            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition shadow-sm"
          >
            Sign In with Another Account
          </button>
        </div>
      </div>
    );
  }

  // Not a provider registered state
  if (!loading && !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">No Service Partner Profile Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The current account ({user.email}) is not registered as a service provider yet. You can sign in with our pre-seeded Indore service providers below to test the full partner console:
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleDemoLogin('glamour.salon@everythinglocal.in')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-between"
          >
            <span>Switch to Glamour & Glow Salon</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => handleDemoLogin('quickfix.electric@everythinglocal.in')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-between"
          >
            <span>Switch to QuickFix Electricians</span>
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-semibold">Loading partner console...</p>
      </div>
    );
  }

  const { provider, metrics } = data;
  const bookingsList = provider.bookings || [];

  const filteredBookings = bookingsList.filter((b) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return ['PENDING_CONFIRMATION', 'CONFIRMED', 'PROVIDER_ASSIGNED', 'PROVIDER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(b.status);
    if (statusFilter === 'COMPLETED') return b.status === 'COMPLETED';
    if (statusFilter === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(b.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                {provider.businessName}
              </h1>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Partner
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Indore Service Console • {provider.shopAddressLine || 'Doorstep Service Provider'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchConsoleData}
              className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-xl border border-slate-200 transition"
              title="Refresh Console"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddService(true)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </button>
          </div>
        </div>

        {/* KPI Analytics Cards (Inspired by Merchant App Inspiration Screen) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-slate-500">Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-950">
              ₹{((metrics.totalRevenuePaise || 0) / 100).toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">
              Net Payout: ₹{((metrics.totalNetEarningsPaise || 0) / 100).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-slate-500">Total Bookings</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-950">
              {metrics.totalBookings}
            </div>
            <span className="text-[10px] text-blue-700 font-bold">
              {metrics.completedBookings} Completed
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-slate-500">Active / Action</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">
              {metrics.pendingBookings}
            </div>
            <span className="text-[10px] text-amber-700 font-bold">
              Needs Service / Attention
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-slate-500">Customer Rating</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-950">
              ★ {provider.rating.toFixed(1)}
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              {provider.reviewCount || 0} Customer Reviews
            </span>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('BOOKINGS')}
            className={`pb-3 text-sm font-black transition ${
              activeTab === 'BOOKINGS'
                ? 'text-slate-950 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Appointments & Bookings ({bookingsList.length})
          </button>

          <button
            onClick={() => setActiveTab('SERVICES')}
            className={`pb-3 text-sm font-black transition ${
              activeTab === 'SERVICES'
                ? 'text-slate-950 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Service Catalogue ({provider.services?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('STAFF')}
            className={`pb-3 text-sm font-black transition ${
              activeTab === 'STAFF'
                ? 'text-slate-950 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Staff Specialists ({provider.staff?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('EARNINGS')}
            className={`pb-3 text-sm font-black transition ${
              activeTab === 'EARNINGS'
                ? 'text-slate-950 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Settlements & Earnings
          </button>
        </div>

        {/* TAB 1: BOOKINGS LIST */}
        {activeTab === 'BOOKINGS' && (
          <div>
            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-4">
              {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    statusFilter === f
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {f === 'ACTIVE' ? 'Active / In-Flight' : f}
                </button>
              ))}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-black text-slate-900">No appointments in this category</h3>
                <p className="text-xs text-slate-500">New customer requests will show up here in real time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {b.bookingNumber}
                        </span>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-700">
                        📅 {b.bookingDate} at {b.timeSlot}
                      </div>
                    </div>

                    {/* Customer & Service Info */}
                    <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Customer
                        </span>
                        <div className="text-sm font-black text-slate-950">
                          {b.customer?.name || 'Customer'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.customer?.phone || '+91 98260 00000'}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Service Details
                        </span>
                        <div className="text-sm font-black text-slate-950">
                          {b.service?.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {b.fulfillmentType === 'SHOP_VISIT' ? '📍 Shop Visit' : `🏠 Doorstep: ${b.customerAddressLine || b.customerLocality || 'Indore'}`}
                        </div>
                        {b.instructions && (
                          <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-2">
                            Note: "{b.instructions}"
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col justify-between md:justify-center md:items-end">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Net Provider Share
                        </span>
                        <div className="text-lg font-black text-emerald-700">
                          ₹{(b.providerPayablePaise / 100).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          (Platform Commission: ₹{(b.commissionPaise / 100).toFixed(2)})
                        </span>
                      </div>
                    </div>

                    {/* Progression Workflow Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {provider.staff && provider.staff.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500 font-semibold">Specialist:</span>
                            <select
                              value={b.staffId || ''}
                              onChange={(e) => handleUpdateStatus(b.id, b.status, e.target.value)}
                              className="text-xs px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 font-bold"
                            >
                              <option value="">Unassigned</option>
                              {provider.staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* State Step Actions */}
                      <div className="flex items-center gap-2">
                        {b.status === 'PENDING_CONFIRMATION' && (
                          <button
                            disabled={updatingId === b.id}
                            onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                          >
                            Accept & Confirm
                          </button>
                        )}

                        {b.status === 'CONFIRMED' && b.fulfillmentType === 'HOME_VISIT' && (
                          <button
                            disabled={updatingId === b.id}
                            onClick={() => handleUpdateStatus(b.id, 'PROVIDER_EN_ROUTE')}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                          >
                            Mark En Route
                          </button>
                        )}

                        {b.status === 'PROVIDER_EN_ROUTE' && (
                          <button
                            disabled={updatingId === b.id}
                            onClick={() => handleUpdateStatus(b.id, 'ARRIVED')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                          >
                            Mark Arrived
                          </button>
                        )}

                        {['CONFIRMED', 'ARRIVED'].includes(b.status) && (
                          <button
                            disabled={updatingId === b.id}
                            onClick={() => handleUpdateStatus(b.id, 'IN_PROGRESS')}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                          >
                            Start Service
                          </button>
                        )}

                        {b.status === 'IN_PROGRESS' && (
                          <button
                            disabled={updatingId === b.id}
                            onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-1.5 rounded-xl transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed & Settle</span>
                          </button>
                        )}

                        {['PENDING_CONFIRMATION', 'CONFIRMED'].includes(b.status) && (
                          <button
                            disabled={updatingId === b.id}
                            onClick={() => handleUpdateStatus(b.id, 'REJECTED')}
                            className="text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                          >
                            Decline
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SERVICE CATALOGUE */}
        {activeTab === 'SERVICES' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900">Configured Services</h2>
              <button
                onClick={() => setShowAddService(true)}
                className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service Listing</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {provider.services?.map((svc) => (
                <div key={svc.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-sm text-slate-900">{svc.title}</h3>
                    <span className="text-base font-black text-slate-950">
                      ₹{(svc.pricePaise / 100).toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{svc.description}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      ⏱ {svc.durationMinutes} mins
                    </span>
                    {svc.allowsShopVisit && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                        Shop
                      </span>
                    )}
                    {svc.allowsHomeVisit && (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                        Doorstep
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STAFF SPECIALISTS */}
        {activeTab === 'STAFF' && (
          <div>
            <h2 className="text-base font-black text-slate-900 mb-4">Service Specialists & Technicians</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {provider.staff?.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-xs">
                  <img
                    src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=60'}
                    alt={s.name}
                    className="w-12 h-12 rounded-full object-cover border border-amber-400"
                  />
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{s.name}</h4>
                    <p className="text-xs text-slate-500">{s.role}</p>
                    <span className="text-[10px] font-bold text-amber-700">
                      {s.experienceYears} Years Experience
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EARNINGS & SETTLEMENTS */}
        {activeTab === 'EARNINGS' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-black text-slate-900 mb-4">Earnings Ledger & Payouts</h2>
            <div className="divide-y divide-slate-100">
              {provider.earnings && provider.earnings.length > 0 ? (
                provider.earnings.map((e) => (
                  <div key={e.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Service Booking Settlement
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Gross: ₹{(e.amountPaise / 100).toFixed(2)} • Commission: ₹{(e.commissionPaise / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-700">
                        +₹{(e.netEarningPaise / 100).toFixed(2)}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        e.payoutStatus === 'PROCESSED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {e.payoutStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No settlements recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* ADD SERVICE MODAL */}
      {/* ==================================================== */}
      {showAddService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-950 mb-1">Add New Service</h3>
            <p className="text-xs text-slate-500 mb-4">Add a new offering to your customer booking catalogue</p>

            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Bridal Facial"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Service highlights, steps, products used..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newAllowsShop}
                    onChange={(e) => setNewAllowsShop(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Allow Shop Appointments</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newAllowsHome}
                    onChange={(e) => setNewAllowsHome(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Allow Doorstep / Home Visits</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceSubmitting}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition"
                >
                  {serviceSubmitting ? 'Saving...' : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
