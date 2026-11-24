import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/BrandLogo';
import { X, Lock, Mail, User as UserIcon, Phone, Store } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultRole = 'CUSTOMER' }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'CUSTOMER' | 'MERCHANT'>(defaultRole === 'ADMIN' ? 'CUSTOMER' : defaultRole);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({ email, name, password, role, phone: phone || undefined });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(quickEmail, 'Password@123');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0B1F3B] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center">
            <BrandLogo variant="symbol" size="medium" className="mr-3 shrink-0" />
            <div>
              <h3 className="font-black text-xl text-white tracking-tight">
                {isRegister ? 'Join EveryBazaar' : 'Welcome to EveryBazaar'}
              </h3>
              <p className="text-[#F5B82E] text-xs mt-0.5 font-semibold">
                Shop more. Save more. Live better.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Quick Demo Logins for Indore Pilot */}
          <div className="mb-5 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1.5">
              Quick Pilot Demo Accounts
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('ayush@example.com')}
                className="px-2.5 py-1 text-xs bg-white text-slate-700 rounded-lg border border-amber-300 hover:bg-amber-100 font-medium"
              >
                Customer (Ayush)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('sharma.kirana@everythinglocal.in')}
                className="px-2.5 py-1 text-xs bg-white text-slate-700 rounded-lg border border-amber-300 hover:bg-amber-100 font-medium"
              >
                Merchant (Sharma Kirana)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@everythinglocal.in')}
                className="px-2.5 py-1 text-xs bg-white text-slate-700 rounded-lg border border-amber-300 hover:bg-amber-100 font-medium"
              >
                Admin (Super)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('quickfix.electric@everythinglocal.in')}
                className="px-2.5 py-1 text-xs bg-white text-emerald-800 rounded-lg border border-emerald-300 hover:bg-emerald-50 font-bold"
              >
                Service Partner (QuickFix)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                      role === 'CUSTOMER' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('MERCHANT')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                      role === 'MERCHANT' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Store Merchant
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      placeholder="e.g. 9893012345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Email or Phone</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-slate-500 hover:text-emerald-700"
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
