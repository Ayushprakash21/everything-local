import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  ShoppingBag,
  Store,
  Shield,
  User,
  LogOut,
  ChevronDown,
  Search,
  Bell,
  Sparkles,
  Clock,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'customer' | 'merchant' | 'admin' | 'orders';
  setCurrentTab: (tab: 'customer' | 'merchant' | 'admin' | 'orders') => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  cartCount: number;
  openCart: () => void;
  openAuth: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedLocation,
  setSelectedLocation,
  cartCount,
  openCart,
  openAuth,
  searchQuery = '',
  setSearchQuery
}) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const locations = [
    { name: 'Palasia, Indore', time: '15-20 min' },
    { name: 'Vijay Nagar, Indore', time: '20-25 min' },
    { name: 'Saket, Indore', time: '15-20 min' },
    { name: 'Bhawarkua, Indore', time: '25-30 min' },
    { name: 'Rajwada, Indore', time: '20-25 min' },
    { name: 'Annapurna, Indore', time: '25-30 min' }
  ];

  const currentLocationMeta = locations.find((l) => l.name === selectedLocation) || locations[0];

  const sampleNotifications = [
    { id: 1, title: 'Fresh Malwa Produce Available', desc: 'New-crop vegetables just arrived at Apna Fresh Vijay Nagar.', time: '10m ago' },
    { id: 2, title: 'Store Pickup Free', desc: 'Skip queues and save ₹30 on in-store pickup orders.', time: '1h ago' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-subtle">
      {/* Main Top Navigation Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-6">
          {/* 1. Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => setCurrentTab('customer')}
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl tracking-tighter shadow-sm border border-amber-400 group-hover:scale-105 transition-transform">
              EL
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-forest-900 tracking-tight">
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

          {/* 2. Delivery Location Selector with Live ETA */}
          <div className="relative flex items-center bg-slate-100 hover:bg-slate-200/80 transition-colors rounded-2xl px-3 py-2 text-xs text-slate-800 shrink-0 max-w-[190px] sm:max-w-xs border border-slate-200/60">
            <div className="flex flex-col text-left mr-1 truncate">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-forest-700 shrink-0" />
                <span>Delivery in {currentLocationMeta.time}</span>
              </span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-transparent appearance-none pr-4 focus:outline-none cursor-pointer font-bold text-slate-900 truncate text-xs"
                >
                  {locations.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          {/* 3. Global Desktop Search Bar */}
          {setSearchQuery && (
            <div className="hidden lg:flex flex-1 max-w-lg relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search groceries, medicines, electronics and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition shadow-2xs font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* 4. Right Controls: Portals, Notifications, Cart, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Portal Switcher (Desktop Tabs) */}
            <div className="hidden md:flex bg-slate-100 p-1 rounded-2xl text-xs font-bold border border-slate-200/50">
              <button
                onClick={() => setCurrentTab('customer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                  currentTab === 'customer'
                    ? 'bg-white text-forest-900 shadow-2xs'
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
                    ? 'bg-white text-forest-900 shadow-2xs'
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
                    ? 'bg-white text-forest-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-slate-700" />
                <span>Admin</span>
              </button>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 transition relative"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-card border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Local Updates
                    </span>
                    <span className="text-[10px] text-forest-700 font-bold">2 New</span>
                  </div>
                  <div className="space-y-2.5">
                    {sampleNotifications.map((n) => (
                      <div key={n.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="font-bold text-slate-800">{n.title}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{n.desc}</div>
                        <div className="text-[9px] text-slate-400 mt-1">{n.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Cart Button */}
            {currentTab === 'customer' && (
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 bg-forest-900 hover:bg-forest-950 text-white px-4 py-2.5 rounded-2xl font-black text-xs transition shadow-md hover:shadow-lg active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('orders')}
                  className="hidden sm:inline-flex px-3 py-2 text-xs font-bold text-slate-700 hover:text-forest-900 hover:bg-forest-50 rounded-xl transition"
                >
                  Orders
                </button>
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
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black border border-slate-300 hover:border-forest-900 text-slate-800 hover:text-forest-900 rounded-2xl transition bg-white shadow-2xs hover:shadow-xs active:scale-95"
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
                placeholder="Search groceries, medicines, electronics and more..."
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

      {/* Mobile Bottom Navigation Bar (Home, Categories, Search, Orders, Account) */}
      <div className="flex md:hidden border-t border-slate-200 bg-white px-2 py-2 justify-around text-[11px] font-bold shadow-xs">
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
            setCurrentTab('customer');
            const catElem = document.getElementById('category-discovery-section');
            catElem?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-900"
        >
          <Sparkles className="w-4 h-4" />
          <span>Categories</span>
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
      </div>
    </header>
  );
};
