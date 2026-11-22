import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store } from '../../types';
import { ELLogo } from '../../components/ELLogo';
import {
  Store as StoreIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Phone,
  Mail,
  User as UserIcon,
  ShoppingBag,
  RefreshCw,
  LogOut,
  Building2,
  Sparkles
} from 'lucide-react';

interface MerchantPortalViewProps {
  store: Store | null;
  onRefreshStore: () => Promise<void>;
  onReturnToShop?: () => void;
}

const INDORE_LOCALITIES = [
  'Palasia',
  'Vijay Nagar',
  'Bhawarkua',
  'Rajwada & Khajuri Bazaar',
  'Annapurna & Sudama Nagar',
  'Chhappan Dukan & New Palasia',
  'Nipania & Bypass Road',
  'Rau & Silicon City',
  'Geeta Bhawan & Manoramaganj',
  'Tilak Nagar & Saket'
];

const STORE_CATEGORIES = [
  'Grocery & Daily Staples',
  'Fresh Fruits & Vegetables',
  'Dairy, Bread & Eggs',
  'Snacks, Munchies & Beverages',
  'Personal Care & Household',
  'Bakery, Sweets & Namkeen',
  'Pharmacy & Wellness',
  'Meat, Fish & Frozen Foods'
];

export const MerchantPortalView: React.FC<MerchantPortalViewProps> = ({
  store,
  onRefreshStore,
  onReturnToShop
}) => {
  const { user, login, registerMerchant, logout } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration Form State
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regCategory, setRegCategory] = useState(STORE_CATEGORIES[0]);
  const [regAddress, setRegAddress] = useState('');
  const [regLocality, setRegLocality] = useState(INDORE_LOCALITIES[0]);
  const [regPincode, setRegPincode] = useState('452001');

  // If user is a MERCHANT and store is pending verification
  if (user && user.role === 'MERCHANT' && store && !store.isVerified) {
    const handleCheckStatus = async () => {
      setRefreshing(true);
      setError(null);
      try {
        await onRefreshStore();
      } catch (err: any) {
        setError(err.message || 'Failed to refresh store status');
      } finally {
        setRefreshing(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
                <ELLogo variant="light" size={48} />
              </div>
              <span className="text-xs uppercase tracking-widest font-black bg-white/20 px-3 py-1 rounded-full mb-2">
                Merchant Verification Pending
              </span>
              <h2 className="text-2xl font-black">{store.name}</h2>
              <p className="text-amber-100 text-xs font-medium mt-1">
                {store.addressLine || 'Indore, Madhya Pradesh'}
              </p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Status notice */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Store Under Review</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Your store registration was submitted and is pending physical and operational verification by our Indore partner onboarding team. Verification usually takes 2 to 4 business hours.
                </p>
              </div>
            </div>

            {/* Verification Steps Tracker */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Onboarding Progress
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900">Application & Store Profile</p>
                    <p className="text-[11px] text-slate-500">Store created with catalog category & address</p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="w-5 h-5 rounded-full border-2 border-amber-600 border-t-transparent animate-spin shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-950">Indore Operations Verification</p>
                    <p className="text-[11px] text-amber-800">Verifying locality pin and retailer credentials</p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                    In Progress
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200 opacity-60">
                  <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700">Live Hyperlocal Catalogue</p>
                    <p className="text-[11px] text-slate-400">Inventory management and customer order receiving</p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                    Next Step
                  </span>
                </div>
              </div>
            </div>

            {/* Helpline Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">Need priority onboarding?</p>
              <p>Contact our Indore Operations Hub: <strong>+91 731 400 8899</strong></p>
              <p>Email: <a href="mailto:merchant-ops@everythinglocal.in" className="text-amber-600 hover:underline">merchant-ops@everythinglocal.in</a></p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={refreshing}
                className="w-full sm:flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Checking Status...' : 'Refresh Verification Status'}
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password) {
      setError('Please enter your registered email/phone and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await login(emailOrPhone.trim(), password);
      if (loggedInUser.role !== 'MERCHANT') {
        setError('This account is registered as a Customer, not a Merchant. Please sign in with merchant credentials or register your store below.');
      } else {
        await onRefreshStore();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email/phone or password. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login (Sharma Kirana Store - Seeded Indore Partner)
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      setEmailOrPhone('sharma.kirana@everythinglocal.in');
      setPassword('Password@123');
      await login('sharma.kirana@everythinglocal.in', 'Password@123');
      await onRefreshStore();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo merchant account');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regBusinessName.trim() || !regOwnerName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      setError('Please complete all required fields.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await registerMerchant({
        name: regOwnerName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        businessName: regBusinessName.trim(),
        category: regCategory,
        addressLine: regAddress.trim() || `${regLocality}, Indore`,
        locality: regLocality,
        city: 'Indore',
        pincode: regPincode.trim() || '452001'
      });
      setSuccessMsg('Store registered! Awaiting operational approval.');
      await onRefreshStore();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email or phone may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Top Brand Banner */}
      <div className="text-center mb-8 space-y-3">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-white rounded-3xl shadow-sm border border-slate-200">
            <ELLogo variant="dark" size={54} />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Indore Hyperlocal Merchant Network</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Everything Local Partner Console
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Manage your neighbourhood store orders, live inventory, instant payouts and deliveries across Indore.
        </p>
      </div>

      {/* Customer Logged In Warning / Switch Account Banner */}
      {user && user.role === 'CUSTOMER' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <UserIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-900">
                Currently signed in as customer: <span className="underline">{user.name}</span> ({user.email})
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                To access the merchant dashboard, please sign in with your merchant partner credentials or register your shop below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-black text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-xl shrink-0 transition"
          >
            Switch Account
          </button>
        </div>
      )}

      {/* Tab Switcher: Sign In vs Register */}
      <div className="bg-slate-100 p-1 rounded-2xl flex items-center mb-6 max-w-sm mx-auto border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
            mode === 'login'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sign In to Store
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
            mode === 'register'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Register New Store
        </button>
      </div>

      {/* Main Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {mode === 'login' ? (
          /* =======================================================
             MERCHANT LOGIN FORM
             ======================================================= */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Merchant Email or Registered Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="e.g. sharma.kirana@everythinglocal.in or 9826012345"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition placeholder:text-slate-400"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-amber-600 font-bold hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your store account password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* High-Contrast Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-forest-900 hover:bg-forest-950 active:scale-98 text-white text-xs font-black tracking-wide rounded-2xl shadow-lg shadow-forest-900/20 transition flex items-center justify-center gap-2 border border-forest-800"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating Merchant...</span>
                </>
              ) : (
                <>
                  <StoreIcon className="w-4 h-4 text-amber-400" />
                  <span>Sign In as Merchant Partner</span>
                </>
              )}
            </button>

            {/* Quick Demo Access for reviewers */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  Fast Review Access
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 active:scale-98 text-amber-900 border border-amber-300 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>One-Click Login: Sharma Kirana Store (Indore)</span>
              </button>
            </div>

            {/* Footer Navigation */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <p>
                Don't have a merchant account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  Register your store
                </button>
              </p>
              {onReturnToShop && (
                <button
                  type="button"
                  onClick={onReturnToShop}
                  className="font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-forest-700" />
                  <span>Customer Shop</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          /* =======================================================
             MERCHANT REGISTRATION / STORE ONBOARDING FORM
             ======================================================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Store / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={regBusinessName}
                  onChange={(e) => setRegBusinessName(e.target.value)}
                  placeholder="e.g. Agarwal Daily Needs"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regOwnerName}
                  onChange={(e) => setRegOwnerName(e.target.value)}
                  placeholder="e.g. Rajat Agarwal"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Business Email *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. agarwal.store@everythinglocal.in"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="e.g. 9826098765"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password (min 6 chars) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Primary Store Category *
                </label>
                <select
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                >
                  {STORE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Shop Address (Building, Shop #, Street) *
              </label>
              <input
                type="text"
                required
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="e.g. Shop 12, Navneet Plaza, 5/2 Old Palasia"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Indore Locality *
                </label>
                <select
                  value={regLocality}
                  onChange={(e) => setRegLocality(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                >
                  {INDORE_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  value={regPincode}
                  onChange={(e) => setRegPincode(e.target.value)}
                  placeholder="e.g. 452001"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* High-Contrast Registration Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-forest-900 hover:bg-forest-950 active:scale-98 text-white text-xs font-black tracking-wide rounded-2xl shadow-lg shadow-forest-900/20 transition flex items-center justify-center gap-2 border border-forest-800"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering Store & Account...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Register Store & Submit for Review</span>
                </>
              )}
            </button>

            {/* Footer Navigation */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <p>
                Already have a merchant account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  Sign In
                </button>
              </p>
              {onReturnToShop && (
                <button
                  type="button"
                  onClick={onReturnToShop}
                  className="font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-forest-700" />
                  <span>Customer Shop</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
