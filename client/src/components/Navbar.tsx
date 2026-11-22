import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { BrandLogo } from './BrandLogo';
import { AppSectionIcon } from './AppSectionIcon';
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
  FileText,
  Bike,
  Users,
  Tag,
  Menu
} from 'lucide-react';

interface NavbarProps {
  discoveryMode: 'shop' | 'services' | 'pharmacy' | 'rider';
  setDiscoveryMode: (mode: 'shop' | 'services' | 'pharmacy' | 'rider') => void;
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
  openAI?: () => void;
  openHousehold?: () => void;
  openCommunity?: () => void;
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
  setSearchQuery,
  openAI,
  openHousehold,
  openCommunity
}) => {
  const { user, logout } = useAuth();
  const {
    selectedLocation,
    serviceability,
    setIsLocationModalOpen
  } = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpandedMobile, setIsSearchExpandedMobile] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    : 'Select Locality';

  const isDeliverable = serviceability ? serviceability.isAnyStoreServiceable : true;
  const etaText = serviceability ? serviceability.deliveryEta : '15-20 min';

  // Role checks for contextual permissions
  const isMerchant = user?.role === 'MERCHANT';
  const isAdmin = user?.role === 'ADMIN';
  const isPharmacist = user?.role === 'PHARMACIST' || isAdmin;
  const isProvider = user?.role === 'PROVIDER' || isAdmin;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      {/* ============================================================ */}
      {/* 1. PRIMARY TOP NAVIGATION ROW (DESKTOP & TABLET HIERARCHY)   */}
      {/* ============================================================ */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-3">
          {/* --- LEFT: LOGO, BRAND & INDORE BADGE --- */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => {
                if (discoveryMode === 'shop') setCurrentTab('customer');
                else if (discoveryMode === 'pharmacy' && setPharmacyTab) setPharmacyTab('explore');
                else setServicesTab('explore');
              }}
              title="Everything Local — Indore"
            >
              {/* Desktop / Large Screen: Clean Horizontal Logo */}
              <div className="hidden sm:flex items-center gap-2">
                <BrandLogo
                  variant="horizontal"
                  size="medium"
                  className="h-10 sm:h-11 w-auto max-w-[215px] group-hover:scale-[1.02] transition-transform"
                />
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs self-center">
                  Indore
                </span>
              </div>

              {/* Mobile: Compact Standalone Symbol with Indore Badge */}
              <div className="flex sm:hidden items-center gap-1.5">
                <BrandLogo
                  variant="symbol"
                  size="small"
                  className="h-9 w-auto group-hover:scale-105 transition-transform"
                />
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
                  Indore
                </span>
              </div>
            </div>
          </div>

          {/* --- CENTRE: PRIMARY DISCOVERY MODE PILL SEGMENT --- */}
          {/* Shop | Pharmacy | Services | Delivery Partner */}
          <nav
            aria-label="Primary Discovery Modes"
            className="hidden md:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs shrink-0"
          >
            <button
              onClick={() => {
                setDiscoveryMode('shop');
                setCurrentTab('customer');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                discoveryMode === 'shop'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                discoveryMode === 'pharmacy'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                discoveryMode === 'services'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Services</span>
            </button>

            <button
              onClick={() => {
                setDiscoveryMode('rider');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                discoveryMode === 'rider'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Delivery Partner</span>
            </button>
          </nav>

          {/* --- RIGHT: LOCATION, SEARCH, NOTIFICATIONS, CART, ACCOUNT --- */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Compact Location Pill */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 transition rounded-2xl px-2.5 sm:px-3 py-2 text-left shrink-0 max-w-[130px] sm:max-w-[180px] group cursor-pointer"
              title="Change Indore Locality"
            >
              <div className="w-7 h-7 rounded-xl bg-forest-800 text-amber-300 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-left">
                <span className="text-[10px] font-black uppercase text-forest-800 block truncate leading-none">
                  {etaText}
                </span>
                <span className="font-bold text-slate-900 text-xs block truncate mt-0.5">
                  {localityName}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 group-hover:text-slate-700" />
            </button>

            {/* Desktop Search Input */}
            {setSearchQuery && (
              <div className="hidden xl:flex items-center relative w-56 2xl:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  placeholder={discoveryMode === 'shop' ? 'Search groceries...' : discoveryMode === 'pharmacy' ? 'Search medicines...' : 'Search services...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-7 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 transition relative"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in duration-150">
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

                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {sampleNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
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

            {/* Cart Button (Always visible on Shop Mode) */}
            {discoveryMode === 'shop' && (
              <button
                onClick={openCart}
                className="relative flex items-center gap-1.5 sm:gap-2 bg-slate-900 hover:bg-slate-950 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-black text-xs transition shadow-sm hover:shadow-md active:scale-95 shrink-0"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[11px] font-black px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Account / User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold transition"
                >
                  <div className="w-6 h-6 rounded-full bg-forest-800 text-amber-300 flex items-center justify-center text-[10px] font-black">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[70px] sm:max-w-[100px] truncate text-slate-900 text-left hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <button
                  onClick={openAuth}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-black border border-slate-300 hover:border-slate-900 text-slate-900 rounded-2xl transition bg-white shadow-2xs active:scale-95 shrink-0"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Authenticated User Contextual Dropdown */}
              {user && showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.phone || user.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-200">
                      {user.role}
                    </span>
                  </div>

                  <div className="py-1 text-xs font-medium space-y-0.5">
                    <button
                      onClick={() => {
                        setCurrentTab('orders');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-slate-700"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Orders</span>
                    </button>

                    {/* Role Gated Dashboards */}
                    {isMerchant && (
                      <button
                        onClick={() => {
                          setDiscoveryMode('shop');
                          setCurrentTab('merchant');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded-xl flex items-center gap-2 text-amber-900 font-bold"
                      >
                        <Store className="w-3.5 h-3.5 text-amber-600" />
                        <span>Merchant Dashboard</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setCurrentTab('admin');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-xl flex items-center gap-2 text-slate-900 font-bold"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-700" />
                        <span>Admin Control Tower</span>
                      </button>
                    )}

                    {isPharmacist && setPharmacyTab && (
                      <button
                        onClick={() => {
                          setDiscoveryMode('pharmacy');
                          setPharmacyTab('pharmacist');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-teal-50 rounded-xl flex items-center gap-2 text-teal-800 font-bold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Pharmacist Console</span>
                      </button>
                    )}

                    {isProvider && (
                      <button
                        onClick={() => {
                          setDiscoveryMode('services');
                          setServicesTab('provider');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-xl flex items-center gap-2 text-emerald-800 font-bold"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Service Partner Console</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 text-xs font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Row (if search query enabled) */}
        {setSearchQuery && (
          <div className="xl:hidden pb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={
                  discoveryMode === 'shop'
                    ? 'Search groceries, staples, snacks, sweets...'
                    : discoveryMode === 'pharmacy'
                    ? 'Search medicines, wellness, OTC...'
                    : 'Search salon, electricians, cleaning, repairs...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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

      {/* ============================================================ */}
      {/* 2. SECONDARY CONTEXTUAL NAVIGATION STRIP                     */}
      {/* ============================================================ */}
      <div className="bg-slate-50/90 border-t border-slate-200/70 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs overflow-x-auto gap-3">
          {/* Left Context Label or Mode Pills */}
          <div className="flex items-center gap-2 shrink-0">
            {discoveryMode === 'shop' && (
              <>
                <span className="font-extrabold text-slate-700 hidden sm:inline">
                  Hyperlocal Mart:
                </span>
                {openAI && (
                  <button
                    onClick={openAI}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 border border-amber-300 rounded-xl font-bold transition shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>AI Copilot</span>
                  </button>
                )}
                {openHousehold && (
                  <button
                    onClick={openHousehold}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition shadow-2xs"
                  >
                    <Users className="w-3 h-3 text-forest-700" />
                    <span>Household</span>
                  </button>
                )}
                {openCommunity && (
                  <button
                    onClick={openCommunity}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition shadow-2xs"
                  >
                    <Tag className="w-3 h-3 text-emerald-600" />
                    <span>Group Deals</span>
                  </button>
                )}
              </>
            )}

            {discoveryMode === 'pharmacy' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPharmacyTab && setPharmacyTab('explore')}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    pharmacyTab === 'explore'
                      ? 'bg-forest-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  }`}
                >
                  Medicines
                </button>
                <button
                  onClick={() => setPharmacyTab && setPharmacyTab('upload')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition ${
                    pharmacyTab === 'upload'
                      ? 'bg-amber-400 text-slate-950 shadow-2xs'
                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  <FileText className="w-3 h-3 text-amber-700" />
                  <span>Upload Rx</span>
                </button>
                <button
                  onClick={() => setPharmacyTab && setPharmacyTab('prescriptions')}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    pharmacyTab === 'prescriptions'
                      ? 'bg-forest-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  }`}
                >
                  My Prescriptions
                </button>
                {isPharmacist && setPharmacyTab && (
                  <button
                    onClick={() => setPharmacyTab('pharmacist')}
                    className={`px-3 py-1 rounded-xl font-bold transition ${
                      pharmacyTab === 'pharmacist'
                        ? 'bg-teal-800 text-white shadow-2xs'
                        : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300'
                    }`}
                  >
                    Pharmacist Console
                  </button>
                )}
              </div>
            )}

            {discoveryMode === 'services' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setServicesTab('explore')}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    servicesTab === 'explore'
                      ? 'bg-forest-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  }`}
                >
                  Explore Services
                </button>
                <button
                  onClick={() => setServicesTab('bookings')}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    servicesTab === 'bookings'
                      ? 'bg-forest-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  }`}
                >
                  My Appointments
                </button>
                {isProvider && (
                  <button
                    onClick={() => setServicesTab('provider')}
                    className={`px-3 py-1 rounded-xl font-bold transition ${
                      servicesTab === 'provider'
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
                    }`}
                  >
                    Partner Console
                  </button>
                )}
              </div>
            )}

            {discoveryMode === 'rider' && (
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Active Rider Fleet Dispatch Mode</span>
              </div>
            )}
          </div>

          {/* Right: Role-Gated Portal Quick Links (Only for Merchants or Admins) */}
          <div className="flex items-center gap-2 shrink-0">
            {isMerchant && (
              <button
                onClick={() => {
                  setDiscoveryMode('shop');
                  setCurrentTab('merchant');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold border transition ${
                  currentTab === 'merchant'
                    ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                }`}
              >
                <Store className="w-3 h-3 text-amber-600" />
                <span>Merchant Console</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  setCurrentTab('admin');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold border transition ${
                  currentTab === 'admin'
                    ? 'bg-slate-900 text-white border-slate-950 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-800'
                }`}
              >
                <Shield className="w-3 h-3 text-slate-700" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR                              */}
      {/* ============================================================ */}
      <div className="flex md:hidden border-t border-slate-200 bg-white fixed bottom-0 left-0 right-0 z-40 px-2 py-1.5 justify-around text-[10px] font-bold shadow-lg">
        <button
          onClick={() => {
            setDiscoveryMode('shop');
            setCurrentTab('customer');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
            discoveryMode === 'shop' && currentTab === 'customer' ? 'text-forest-900 font-black' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop</span>
        </button>

        <button
          onClick={() => {
            setDiscoveryMode('pharmacy');
            if (setPharmacyTab) setPharmacyTab('explore');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
            discoveryMode === 'pharmacy' ? 'text-forest-900 font-black' : 'text-slate-500'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Pharmacy</span>
        </button>

        <button
          onClick={() => {
            setDiscoveryMode('services');
            setServicesTab('explore');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
            discoveryMode === 'services' ? 'text-forest-900 font-black' : 'text-slate-500'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Services</span>
        </button>

        <button
          onClick={() => {
            if (user) setCurrentTab('orders');
            else openAuth();
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
            currentTab === 'orders' ? 'text-forest-900 font-black' : 'text-slate-500'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Orders</span>
        </button>

        <button
          onClick={() => {
            if (!user) openAuth();
            else setShowUserMenu(!showUserMenu);
          }}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-slate-500"
        >
          <User className="w-4 h-4" />
          <span>{user ? 'Account' : 'Sign In'}</span>
        </button>
      </div>
    </header>
  );
};
