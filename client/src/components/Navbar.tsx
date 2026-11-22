import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { ELLogo } from './ELLogo';
import {
  MapPin,
  ShoppingBag,
  Store,
  Shield,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Search,
  Bell,
  Sparkles,
  Clock,
  X,
  Wrench,
  Calendar,
  Briefcase,
  HeartPulse,
  Pill,
  FileText
} from 'lucide-react';

interface NavbarProps {
  discoveryMode: 'shop' | 'services' | 'pharmacy';
  setDiscoveryMode: (mode: 'shop' | 'services' | 'pharmacy') => void;
  currentTab: 'customer' | 'merchant' | 'admin' | 'orders';
  setCurrentTab: (tab: 'customer' | 'merchant' | 'admin' | 'orders') => void;
  servicesTab: 'explore' | 'bookings' | 'provider';
  setServicesTab: (tab: 'explore' | 'bookings' | 'provider') => void;
  pharmacyTab?: 'explore' | 'upload' | 'prescriptions' | 'pharmacist';
  setPharmacyTab?: (tab: 'explore' | 'upload' | 'prescriptions' | 'pharmacist') => void;
  cartCount: number;
  openCart: () => void;
  openAuth: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  discoveryMode,
  setDiscoveryMode,
  currentTab,
  setCurrentTab,
  servicesTab,
  setServicesTab,
  pharmacyTab = 'explore',
  setPharmacyTab,
  cartCount,
  openCart,
  openAuth,
  searchQuery = '',
  setSearchQuery
}) => {
  const { user, logout } = useAuth();
  const {
    selectedLocation,
    serviceability,
    setIsLocationModalOpen
  } = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const sampleNotifications = [
    {
      id: 1,
      title: 'Local Services Launched in Indore',
      desc: 'Book verified salon specialists, electricians, cleaners & doorstep repairs with guaranteed pricing.',
      time: 'Just now'
    },
    {
      id: 2,
      title: 'Fresh Malwa Produce Available',
      desc: 'New-crop country vegetables & fresh greens delivered in 15-20 min across Indore.',
      time: '15m ago'
    }
  ];

  // Derive delivery estimate & locality display
  const localityName = selectedLocation
    ? selectedLocation.locality || selectedLocation.name
    : 'Select Location';

  const isDeliverable = serviceability ? serviceability.isAnyStoreServiceable : true;
  const etaText = serviceability ? serviceability.deliveryEta : '15-20 min';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-subtle">
      {/* Main Top Navigation Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4 md:gap-6">
          {/* 1. Brand Logo */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0"
            onClick={() => {
              if (discoveryMode === 'shop') setCurrentTab('customer');
              else setServicesTab('explore');
            }}
          >
            <ELLogo variant="dark" size={42} className="hover:scale-105 transition-transform" />
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg text-forest-900 tracking-tight">
                  Everything Local
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-200">
                  Indore
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Shop more. Save more. Live better.
              </p>
            </div>
          </div>

          {/* 2. PRIMARY DISCOVERY MODE SELECTOR: [ 🛒 Shop | 🛠️ Services ] */}
          <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center border border-slate-200 shadow-2xs shrink-0">
            <button
              onClick={() => {
                setDiscoveryMode('shop');
                setCurrentTab('customer');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                discoveryMode === 'shop'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop</span>
            </button>

            <button
              onClick={() => {
                setDiscoveryMode('pharmacy');
                if (setPharmacyTab) setPharmacyTab('explore');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                discoveryMode === 'pharmacy'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Pharmacy</span>
            </button>

            <button
              onClick={() => {
                setDiscoveryMode('services');
                setServicesTab('explore');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                discoveryMode === 'services'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Services</span>
            </button>
          </div>

          {/* 3. DYNAMIC LOCATION & SERVICEABILITY SELECTOR */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all rounded-2xl px-3 py-2 text-left shrink-0 max-w-[150px] sm:max-w-xs group cursor-pointer"
            title="Click to search or change location in Indore"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-700 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>

            <div className="flex flex-col text-left truncate mr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-forest-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-forest-700 shrink-0" />
                <span className="truncate">
                  {discoveryMode === 'shop'
                    ? isDeliverable ? `Delivery in ${etaText}` : 'Store Pickup Only'
                    : 'Indore Service Zone'}
                </span>
              </span>

              <div className="flex items-center gap-1">
                <span className="font-black text-slate-900 truncate text-xs">
                  {localityName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-slate-700 transition" />
              </div>
            </div>
          </button>

          {/* 4. Global Search Bar */}
          {setSearchQuery && (
            <div className="hidden lg:flex flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder={
                  discoveryMode === 'shop'
                    ? 'Search groceries, staples, snacks, sweets...'
                    : 'Search salon, haircuts, electricians, cleaning, repairs...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition shadow-2xs font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* 5. Right Controls: Portals, Notifications, Cart / Appointments, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Contextual Desktop Portal Switcher */}
            {discoveryMode === 'shop' ? (
              <div className="hidden md:flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/50">
                <button
                  onClick={() => setCurrentTab('customer')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    currentTab === 'customer'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-forest-700" />
                  <span>Shop</span>
                </button>

                <button
                  onClick={() => setCurrentTab('merchant')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    currentTab === 'merchant'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-amber-600" />
                  <span>Merchant</span>
                </button>

                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    currentTab === 'admin'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-slate-700" />
                  <span>Admin</span>
                </button>
              </div>
            ) : discoveryMode === 'pharmacy' ? (
              <div className="hidden md:flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/50">
                <button
                  onClick={() => setPharmacyTab && setPharmacyTab('explore')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    pharmacyTab === 'explore'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Medicines</span>
                </button>

                <button
                  onClick={() => setPharmacyTab && setPharmacyTab('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    pharmacyTab === 'upload'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Upload Rx</span>
                </button>

                <button
                  onClick={() => setPharmacyTab && setPharmacyTab('prescriptions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    pharmacyTab === 'prescriptions'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>My Prescriptions</span>
                </button>

                <button
                  onClick={() => setPharmacyTab && setPharmacyTab('pharmacist')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    pharmacyTab === 'pharmacist'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  <span>Pharmacist Console</span>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/50">
                <button
                  onClick={() => setServicesTab('explore')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    servicesTab === 'explore'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Explore</span>
                </button>

                <button
                  onClick={() => setServicesTab('bookings')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    servicesTab === 'bookings'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>My Bookings</span>
                </button>

                <button
                  onClick={() => setServicesTab('provider')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    servicesTab === 'provider'
                      ? 'bg-white text-forest-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Partner Console</span>
                </button>
              </div>
            )}

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 transition relative"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Indore Updates
                      </span>
                    </div>
                    <span className="text-[10px] text-forest-700 font-bold bg-forest-50 px-2 py-0.5 rounded-full">
                      2 New
                    </span>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto space-y-2 pr-0.5">
                    {sampleNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs transition"
                      >
                        <div className="font-bold text-slate-900">{n.title}</div>
                        <div className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{n.desc}</div>
                        <div className="text-[10px] text-slate-400 mt-1.5 font-medium">{n.time}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowNotifications(false)}
                    className="w-full mt-2.5 py-1.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Mode-Specific Action Button: Cart for Shop, My Bookings for Services */}
            {discoveryMode === 'shop' ? (
              currentTab === 'customer' && (
                <button
                  onClick={openCart}
                  className="relative flex items-center gap-2 bg-forest-900 hover:bg-forest-950 text-white px-3 sm:px-4 py-2.5 rounded-2xl font-black text-xs transition shadow-md hover:shadow-lg active:scale-95 shrink-0"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      {cartCount}
                    </span>
                  )}
                </button>
              )
            ) : (
              <button
                onClick={() => setServicesTab('bookings')}
                className="relative flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 px-3 sm:px-4 py-2.5 rounded-2xl font-black text-xs transition shadow-md hover:shadow-lg active:scale-95 shrink-0"
              >
                <Calendar className="w-4 h-4 text-slate-950" />
                <span className="hidden sm:inline">Appointments</span>
              </button>
            )}

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                {discoveryMode === 'shop' && (
                  <button
                    onClick={() => setCurrentTab('orders')}
                    className="hidden sm:inline-flex px-3 py-2 text-xs font-bold text-slate-700 hover:text-forest-900 hover:bg-forest-50 rounded-xl transition"
                  >
                    Orders
                  </button>
                )}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-black text-slate-900 block truncate max-w-[110px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-forest-700 uppercase font-black tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/60 flex items-center justify-center transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={openAuth}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-black border border-slate-300 hover:border-forest-900 text-slate-800 hover:text-forest-900 rounded-2xl transition bg-white shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        {setSearchQuery && (
          <div className="lg:hidden pb-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={
                  discoveryMode === 'shop'
                    ? 'Search groceries, staples, snacks, sweets...'
                    : 'Search salon, haircuts, electricians, cleaning, repairs...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (Contextual by Discovery Mode) */}
      <div className="flex md:hidden border-t border-slate-200 bg-white px-2 py-2 justify-around text-[11px] font-bold shadow-xs">
        {discoveryMode === 'shop' ? (
          <>
            <button
              onClick={() => setCurrentTab('customer')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                currentTab === 'customer' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop</span>
            </button>

            <button
              onClick={() => {
                setDiscoveryMode('services');
                setServicesTab('explore');
              }}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900"
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Services</span>
            </button>

            <button
              onClick={() => setCurrentTab('merchant')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                currentTab === 'merchant' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Merchant</span>
            </button>

            <button
              onClick={() => {
                if (user) setCurrentTab('orders');
                else openAuth();
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                currentTab === 'orders' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => {
                if (!user) openAuth();
                else setCurrentTab('admin');
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                currentTab === 'admin' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{user ? (user.role === 'ADMIN' ? 'Admin' : 'Account') : 'Sign In'}</span>
            </button>
          </>
        ) : discoveryMode === 'pharmacy' ? (
          <>
            <button
              onClick={() => {
                setDiscoveryMode('shop');
                setCurrentTab('customer');
              }}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900"
            >
              <ShoppingBag className="w-4 h-4 text-slate-600" />
              <span>Shop</span>
            </button>

            <button
              onClick={() => setPharmacyTab && setPharmacyTab('explore')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                pharmacyTab === 'explore' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <span>Medicines</span>
            </button>

            <button
              onClick={() => setPharmacyTab && setPharmacyTab('upload')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                pharmacyTab === 'upload' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Upload Rx</span>
            </button>

            <button
              onClick={() => {
                if (user && setPharmacyTab) setPharmacyTab('prescriptions');
                else openAuth();
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                pharmacyTab === 'prescriptions' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>My Rx</span>
            </button>

            <button
              onClick={() => {
                if (user && setPharmacyTab) setPharmacyTab('pharmacist');
                else openAuth();
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                pharmacyTab === 'pharmacist' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Pharmacist</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setDiscoveryMode('shop');
                setCurrentTab('customer');
              }}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900"
            >
              <ShoppingBag className="w-4 h-4 text-slate-600" />
              <span>Shop</span>
            </button>

            <button
              onClick={() => setServicesTab('explore')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                servicesTab === 'explore' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => {
                if (user) setServicesTab('bookings');
                else openAuth();
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                servicesTab === 'bookings' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Appointments</span>
            </button>

            <button
              onClick={() => setServicesTab('provider')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
                servicesTab === 'provider' ? 'text-forest-900 font-black' : 'text-slate-500'
              }`}
            >
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Partner</span>
            </button>

            <button
              onClick={() => {
                if (!user) openAuth();
                else setCurrentTab('admin');
              }}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500"
            >
              <User className="w-4 h-4" />
              <span>{user ? user.role : 'Sign In'}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
