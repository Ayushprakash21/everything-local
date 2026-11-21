import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, ShoppingBag, Store, Shield, User, LogOut, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentTab: 'customer' | 'merchant' | 'admin' | 'orders';
  setCurrentTab: (tab: 'customer' | 'merchant' | 'admin' | 'orders') => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  cartCount: number;
  openCart: () => void;
  openAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedLocation,
  setSelectedLocation,
  cartCount,
  openCart,
  openAuth
}) => {
  const { user, logout } = useAuth();

  const locations = [
    { name: 'Palasia, Indore', lat: 22.7244, lng: 75.8839 },
    { name: 'Vijay Nagar, Indore', lat: 22.7533, lng: 75.8937 },
    { name: 'Saket, Indore', lat: 22.7208, lng: 75.8942 },
    { name: 'Bhawarkua, Indore', lat: 22.6926, lng: 75.8676 },
    { name: 'Rajwada, Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Annapurna, Indore', lat: 22.7011, lng: 75.8341 }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md bg-white/95">
      {/* Top Bar with Brand & Location */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('customer')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-black text-xl tracking-tighter">
              EL
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Everything Local</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Indore</span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Shop more. Save more. Live better.</p>
            </div>
          </div>

          {/* Hyperlocal Location Selector (Indore) */}
          <div className="relative flex items-center bg-slate-100 hover:bg-slate-200/70 transition rounded-full px-3 py-1.5 text-xs text-slate-700 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent appearance-none pr-5 focus:outline-none cursor-pointer font-semibold"
            >
              {locations.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Portal Switcher & User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switchers */}
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setCurrentTab('customer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  currentTab === 'customer'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Customer
              </button>

              <button
                onClick={() => setCurrentTab('merchant')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  currentTab === 'merchant'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Merchant
              </button>

              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  currentTab === 'admin'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            </div>

            {/* Cart Button */}
            {currentTab === 'customer' && (
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-semibold text-xs transition shadow-sm shadow-emerald-600/30"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="bg-amber-400 text-slate-900 text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* User State */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('orders')}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                >
                  My Orders
                </button>
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-semibold text-slate-800 block truncate max-w-[100px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={openAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold border border-slate-300 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 rounded-xl transition"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Portal Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-200/80 bg-slate-50 px-4 py-2 justify-around text-xs font-semibold">
        <button
          onClick={() => setCurrentTab('customer')}
          className={`flex items-center gap-1 py-1 px-3 rounded-lg ${
            currentTab === 'customer' ? 'bg-emerald-600 text-white' : 'text-slate-600'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Customer
        </button>
        <button
          onClick={() => setCurrentTab('merchant')}
          className={`flex items-center gap-1 py-1 px-3 rounded-lg ${
            currentTab === 'merchant' ? 'bg-emerald-600 text-white' : 'text-slate-600'
          }`}
        >
          <Store className="w-3.5 h-3.5" /> Merchant
        </button>
        <button
          onClick={() => setCurrentTab('admin')}
          className={`flex items-center gap-1 py-1 px-3 rounded-lg ${
            currentTab === 'admin' ? 'bg-emerald-600 text-white' : 'text-slate-600'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Admin
        </button>
      </div>
    </header>
  );
};
