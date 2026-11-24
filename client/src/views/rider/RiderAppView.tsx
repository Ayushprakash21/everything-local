import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request, formatPaise } from '../../api/client';
import { BrandLogo } from '../../components/BrandLogo';
import { ELLogo } from '../../components/ELLogo';
import {
  Bike,
  MapPin,
  CheckCircle2,
  Clock,
  Shield,
  Phone,
  Navigation,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  DollarSign,
  User,
  Power,
  RefreshCw,
  Award,
  Package,
  Calendar,
  Key
} from 'lucide-react';

interface RiderProfile {
  id: string;
  riderCode: string;
  fullName: string;
  phone: string;
  vehicleType: string;
  vehiclePlate: string;
  drivingLicenseNo: string;
  bankAccount: string | null;
  bankIfsc: string | null;
  upiId: string | null;
  isOnline: boolean;
  isActive: boolean;
  currentLat: number | null;
  currentLng: number | null;
  rating: number;
  totalDeliveries: number;
}

interface DeliveryTask {
  id: string;
  taskNumber: string;
  parentOrderId: string;
  merchantOrderId: string;
  riderId: string | null;
  status: 'AVAILABLE' | 'ACCEPTED' | 'AT_STORE' | 'PICKED_UP' | 'EN_ROUTE' | 'DELIVERED' | 'CANCELLED';
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  customerName: string;
  customerPhone: string;
  deliveryPriorityTier: string;
  estimatedPayoutPaise: number;
  actualPayoutPaise: number | null;
  merchantPickupOtp: string;
  customerDeliveryOtp: string;
  merchantOrder?: {
    id: string;
    subtotalPaise: number;
    items?: Array<{ id: string; productName: string; quantity: number }>;
  };
}

interface RiderEarningsResponse {
  riderCode: string;
  rating: number;
  totalDeliveries: number;
  totalEarningsPaise: number;
  unsettledEarningsPaise: number;
  earnings: Array<{
    id: string;
    amountPaise: number;
    entryType: string;
    description: string;
    settlementStatus: string;
    createdAt: string;
  }>;
}

export const RiderAppView: React.FC<{ openAuth: () => void }> = ({ openAuth }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [availableTasks, setAvailableTasks] = useState<DeliveryTask[]>([]);
  const [activeTask, setActiveTask] = useState<DeliveryTask | null>(null);
  const [earningsData, setEarningsData] = useState<RiderEarningsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'earnings' | 'history' | 'profile'>('tasks');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickupOtpInput, setPickupOtpInput] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Onboarding form state
  const [onboardFullName, setOnboardFullName] = useState('');
  const [onboardPhone, setOnboardPhone] = useState('');
  const [onboardVehicleType, setOnboardVehicleType] = useState('BIKE');
  const [onboardVehiclePlate, setOnboardVehiclePlate] = useState('MP-09-XX-0000');
  const [onboardDl, setOnboardDl] = useState('MP0920240012345');
  const [onboardUpi, setOnboardUpi] = useState('');

  const fetchRiderData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch Profile
      const profRes = await request<{ rider: RiderProfile }>('/rider/profile').catch(() => null);
      if (profRes && profRes.rider) {
        setProfile(profRes.rider);

        // 2. Fetch Active Task
        const actRes = await request<{ activeTask: DeliveryTask | null }>('/rider/tasks/active').catch(() => ({ activeTask: null }));
        setActiveTask(actRes.activeTask);

        // 3. Fetch Available Tasks
        const availRes = await request<{ tasks: DeliveryTask[] }>('/rider/tasks/available').catch(() => ({ tasks: [] }));
        setAvailableTasks(availRes.tasks || []);

        // 4. Fetch Earnings
        const earnRes = await request<RiderEarningsResponse>('/rider/earnings').catch(() => null);
        if (earnRes) setEarningsData(earnRes);
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.warn('Rider fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderData();
  }, [user]);

  // Handle Onboarding submission
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await request('/rider/onboard', {
        method: 'POST',
        body: JSON.stringify({
          fullName: onboardFullName || (user?.email.split('@')[0] || 'Delivery Partner'),
          phone: onboardPhone || '+91 98260 00000',
          vehicleType: onboardVehicleType,
          vehiclePlate: onboardVehiclePlate,
          drivingLicenseNo: onboardDl,
          upiId: onboardUpi || `${user?.email.split('@')[0]}@okaxis`
        })
      });
      setSuccessMessage('Rider onboarding completed! Welcome to the EveryBazaar Delivery Partner Fleet.');
      await fetchRiderData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Onboarding failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle online status
  const handleToggleOnline = async () => {
    if (!profile) return;
    try {
      const newStatus = !profile.isOnline;
      await request('/rider/status', {
        method: 'POST',
        body: JSON.stringify({ isOnline: newStatus })
      });
      setProfile({ ...profile, isOnline: newStatus });
      fetchRiderData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not update status');
    }
  };

  // Accept a task
  const handleAcceptTask = async (taskId: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await request<{ task: DeliveryTask }>(`/rider/tasks/${taskId}/accept`, {
        method: 'POST'
      });
      setActiveTask(res.task);
      setSuccessMessage('Task accepted! Navigate to the merchant store for pickup.');
      fetchRiderData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to accept task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark arrived at store
  const handleArrivedAtStore = async (taskId: string) => {
    setIsSubmitting(true);
    try {
      const res = await request<{ task: DeliveryTask }>(`/rider/tasks/${taskId}/at-store`, {
        method: 'POST'
      });
      setActiveTask(res.task);
      setSuccessMessage('Marked as Arrived at Store. Verify the pickup OTP with the merchant.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm pickup with OTP
  const handleConfirmPickup = async (taskId: string) => {
    if (!pickupOtpInput.trim()) {
      setErrorMessage('Please enter the 4-digit pickup OTP provided by the merchant');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await request<{ task: DeliveryTask }>(`/rider/tasks/${taskId}/pickup`, {
        method: 'POST',
        body: JSON.stringify({ otp: pickupOtpInput.trim() })
      });
      setActiveTask(res.task);
      setPickupOtpInput('');
      setSuccessMessage('Order picked up! Proceed to customer delivery address.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid pickup OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete delivery with customer OTP
  const handleCompleteDelivery = async (taskId: string) => {
    if (!deliveryOtpInput.trim()) {
      setErrorMessage('Please enter the 4-digit customer delivery OTP provided at doorstep');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await request<{ task: DeliveryTask; payoutPaise: number }>(`/rider/tasks/${taskId}/deliver`, {
        method: 'POST',
        body: JSON.stringify({ otp: deliveryOtpInput.trim() })
      });
      setActiveTask(null);
      setDeliveryOtpInput('');
      setSuccessMessage(`Delivery completed successfully! Earned ${formatPaise(res.payoutPaise)} added to your earnings ledger.`);
      fetchRiderData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid delivery OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request payout
  const handleRequestPayout = async () => {
    try {
      await request('/rider/settlements/request', { method: 'POST' });
      setSuccessMessage('Weekly payout request submitted for platform bank clearance.');
      fetchRiderData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit settlement request');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <BrandLogo variant="horizontal" size="large" className="mx-auto" />
        <h3 className="font-black text-slate-900 text-xl">EveryBazaar Delivery Partner App</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Sign in or register as a delivery rider in Indore to accept neighbourhood deliveries, earn per-trip payouts and get weekly settlements.
        </p>
        <button
          onClick={openAuth}
          className="px-6 py-3 bg-[#0B1F3A] hover:bg-[#071324] text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95"
        >
          Partner Sign In
        </button>
      </div>
    );
  }

  // If user is logged in but has no RiderProfile, show Onboarding Form
  if (!loading && !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200">
              <Bike className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Rider Partner Onboarding</h2>
            <p className="text-xs text-slate-500">
              Register your vehicle to start receiving hyperlocal delivery dispatches in Indore.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleOnboardSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={onboardFullName}
                onChange={(e) => setOnboardFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registered Mobile Number</label>
              <input
                type="tel"
                required
                value={onboardPhone}
                onChange={(e) => setOnboardPhone(e.target.value)}
                placeholder="+91 98260 12345"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={onboardVehicleType}
                  onChange={(e) => setOnboardVehicleType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="BIKE">Motorcycle / Scooter</option>
                  <option value="EV_SCOOTER">Electric Scooter</option>
                  <option value="BICYCLE">Bicycle (Within 2km)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration #</label>
                <input
                  type="text"
                  required
                  value={onboardVehiclePlate}
                  onChange={(e) => setOnboardVehiclePlate(e.target.value)}
                  placeholder="MP-09-AB-1234"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Driving License Number</label>
              <input
                type="text"
                required
                value={onboardDl}
                onChange={(e) => setOnboardDl(e.target.value)}
                placeholder="MP0920240012345"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payout UPI ID (Instant Payouts)</label>
              <input
                type="text"
                required
                value={onboardUpi}
                onChange={(e) => setOnboardUpi(e.target.value)}
                placeholder="username@okhdfcbank"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering Fleet Partner...' : 'Complete Rider Onboarding'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Rider Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center font-black">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{profile?.fullName}</h2>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                {profile?.riderCode}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-semibold">
                <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {profile?.rating.toFixed(2)} Rating
              </span>
              <span>•</span>
              <span>{profile?.totalDeliveries} Completed Trips</span>
              <span>•</span>
              <span className="capitalize">{profile?.vehicleType.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Online / Offline Status Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleOnline}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition shadow-sm ${
              profile?.isOnline
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{profile?.isOnline ? 'ONLINE • ACCEPTING TASKS' : 'OFFLINE'}</span>
          </button>
          <button
            onClick={fetchRiderData}
            title="Refresh Tasks"
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">✕</button>
        </div>
      )}

      {/* Rider Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${
            activeTab === 'tasks' ? 'bg-forest-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Delivery Tasks ({availableTasks.length + (activeTask ? 1 : 0)})
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${
            activeTab === 'earnings' ? 'bg-forest-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Earnings & Ledgers
        </button>
      </div>

      {/* TAB 1: DELIVERY TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Active Task (If in progress) */}
          {activeTask && (
            <div className="bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl border-2 border-amber-400 p-6 space-y-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    ACTIVE TRIP IN PROGRESS
                  </span>
                </div>
                <span className="font-mono text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg">
                  {activeTask.taskNumber}
                </span>
              </div>

              {/* Lifecycle Stage Steps */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black">
                <div className={`p-2 rounded-xl ${activeTask.status === 'ACCEPTED' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-500'}`}>
                  1. Go to Store
                </div>
                <div className={`p-2 rounded-xl ${activeTask.status === 'AT_STORE' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-500'}`}>
                  2. Verify Pickup
                </div>
                <div className={`p-2 rounded-xl ${activeTask.status === 'PICKED_UP' || activeTask.status === 'EN_ROUTE' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-500'}`}>
                  3. Out for Drop
                </div>
                <div className={`p-2 rounded-xl ${activeTask.status === 'DELIVERED' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  4. Verify Drop
                </div>
              </div>

              {/* Task Locations */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    P
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">Pickup Store</span>
                    <span className="text-xs font-black text-slate-900">{activeTask.pickupAddress}</span>
                  </div>
                </div>

                <div className="h-4 border-l-2 border-dashed border-slate-200 ml-3"></div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    D
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">Customer Dropoff</span>
                    <span className="text-xs font-black text-slate-900">{activeTask.deliveryAddress}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-1">
                      <span>{activeTask.customerName}</span>
                      <span>•</span>
                      <a href={`tel:${activeTask.customerPhone}`} className="text-forest-800 font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Call Customer
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons based on status */}
              {activeTask.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleArrivedAtStore(activeTask.id)}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-black shadow-md transition active:scale-95"
                >
                  {isSubmitting ? 'Updating...' : 'I Have Arrived at Merchant Store'}
                </button>
              )}

              {activeTask.status === 'AT_STORE' && (
                <div className="bg-white rounded-2xl p-4 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span>Enter Merchant Pickup OTP</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ask the merchant for the 4-digit handover OTP before leaving the store.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={pickupOtpInput}
                      onChange={(e) => setPickupOtpInput(e.target.value)}
                      placeholder="e.g. 1234"
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold tracking-widest text-center w-32 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={() => handleConfirmPickup(activeTask.id)}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95"
                    >
                      Verify & Start Delivery
                    </button>
                  </div>
                </div>
              )}

              {(activeTask.status === 'PICKED_UP' || activeTask.status === 'EN_ROUTE') && (
                <div className="bg-white rounded-2xl p-4 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Customer Doorstep Handover OTP</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Hand over the sealed package to customer and enter their 4-digit verification OTP.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={deliveryOtpInput}
                      onChange={(e) => setDeliveryOtpInput(e.target.value)}
                      placeholder="e.g. 5678"
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold tracking-widest text-center w-32 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                    <button
                      onClick={() => handleCompleteDelivery(activeTask.id)}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95"
                    >
                      Confirm Drop & Credit ₹{formatPaise(activeTask.estimatedPayoutPaise)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Available Tasks Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">
                Available Delivery Dispatches in Indore ({availableTasks.length})
              </h3>
              {!profile?.isOnline && (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-bold">
                  Go Online to Accept Tasks
                </span>
              )}
            </div>

            {availableTasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                <Bike className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No pending dispatches right now</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  New customer orders in your area will appear here in real-time. Stay online!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-subtle hover:border-amber-400 transition space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          {task.taskNumber}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                          {task.deliveryPriorityTier.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-sm font-black text-forest-900">
                        {formatPaise(task.estimatedPayoutPaise)}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-semibold truncate">Pickup: {task.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold truncate">Dropoff: {task.deliveryAddress}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptTask(task.id)}
                      disabled={!profile?.isOnline || isSubmitting || !!activeTask}
                      className="w-full py-2.5 bg-forest-900 hover:bg-forest-950 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95"
                    >
                      {activeTask ? 'Complete Active Task First' : 'Accept Delivery Task'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EARNINGS & SETTLEMENTS */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {/* Earnings Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-subtle space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Earnings (Lifetime)
              </span>
              <div className="text-2xl font-black text-slate-900">
                {formatPaise(earningsData?.totalEarningsPaise || 0)}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-subtle space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Unsettled Payout Balance
              </span>
              <div className="text-2xl font-black text-emerald-700">
                {formatPaise(earningsData?.unsettledEarningsPaise || 0)}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-subtle space-y-1 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Settlement Schedule
              </span>
              <button
                onClick={handleRequestPayout}
                className="w-full py-2 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-black transition active:scale-95"
              >
                Request Payout
              </button>
            </div>
          </div>

          {/* Ledger Entries */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
            <h3 className="text-base font-black text-slate-900">Trip Earnings Ledger</h3>
            {(!earningsData || earningsData.earnings.length === 0) ? (
              <p className="text-xs text-slate-500 py-6 text-center">No delivery earnings entries yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {earningsData.earnings.map((entry) => (
                  <div key={entry.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{entry.description}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {entry.entryType}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-600">
                        +{formatPaise(entry.amountPaise)}
                      </span>
                      <span className="block text-[9px] font-bold text-slate-400">
                        {entry.settlementStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
