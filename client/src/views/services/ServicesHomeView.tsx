import React, { useState, useEffect } from 'react';
import { ServiceCategory, ServiceProvider } from '../../types';
import { request, formatPaise } from '../../api/client';
import { useLocation } from '../../context/LocationContext';
import { MainContentContainer } from '../../components/layout/MainContentContainer';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Home,
  Store,
  CheckCircle2,
  SlidersHorizontal,
  X,
  ArrowRight,
  BadgeCheck,
  Phone,
  Navigation,
  Wrench,
  Scissors,
  Brush,
  Car,
  GraduationCap
} from 'lucide-react';

interface ServicesHomeViewProps {
  onSelectProvider: (providerId: string) => void;
  onOpenBookings: () => void;
  onOpenProviderConsole?: () => void;
}

export const ServicesHomeView: React.FC<ServicesHomeViewProps> = ({
  onSelectProvider,
  onOpenBookings,
  onOpenProviderConsole
}) => {
  const { coords, selectedLocation, setIsLocationModalOpen } = useLocation();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'ALL' | 'HOME_VISIT' | 'SHOP_VISIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  const localityName = selectedLocation ? selectedLocation.locality || selectedLocation.name : 'Indore';

  const banners = [
    {
      badge: 'POPULAR IN INDORE',
      title: 'Salon & Grooming at Your Doorstep',
      subtitle: 'Expert stylists with sanitized kits and premium products across Vijay Nagar & Palasia.',
      code: 'STARTING AT ₹349',
      gradient: 'from-purple-900 via-indigo-900 to-slate-950',
      badgeBg: 'bg-amber-400 text-slate-950',
      accentColor: 'text-amber-300'
    },
    {
      badge: 'VERIFIED PROFESSIONALS',
      title: 'Licensed Electricians & AC Maintenance',
      subtitle: 'Fast 60-min arrival, 90-day service warranty and upfront transparent pricing.',
      code: 'ZERO VISIT FEE ON REPAIRS',
      gradient: 'from-emerald-900 via-teal-900 to-slate-950',
      badgeBg: 'bg-emerald-300 text-slate-950',
      accentColor: 'text-emerald-300'
    },
    {
      badge: 'FESTIVAL SPECIAL',
      title: 'Deep Home Cleaning & Sofa Shampooing',
      subtitle: 'Single-disc scrubbing, bathroom descaling & German extraction machines.',
      code: 'UP TO 25% OFF PACKAGES',
      gradient: 'from-amber-700 via-orange-800 to-slate-950',
      badgeBg: 'bg-amber-300 text-slate-950',
      accentColor: 'text-amber-200'
    }
  ];

  // Fetch Categories & Providers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catRes = await request<{ categories: ServiceCategory[] }>('/services/categories');
        setCategories(catRes.categories || []);

        const catParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
        const fulParam = fulfillmentFilter !== 'ALL' ? `&fulfillment=${fulfillmentFilter}` : '';
        const qParam = searchQuery.trim() ? `&q=${encodeURIComponent(searchQuery.trim())}` : '';

        const provRes = await request<{ providers: ServiceProvider[] }>(
          `/services/providers?lat=${coords.latitude}&lng=${coords.longitude}${catParam}${fulParam}${qParam}`
        );
        setProviders(provRes.providers || []);
      } catch (err) {
        console.error('Failed to load services data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coords.latitude, coords.longitude, selectedCategory, fulfillmentFilter, searchQuery]);

  // Rotate banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const activeBanner = banners[activeBannerIdx];

  return (
    <MainContentContainer className="py-6 space-y-6 sm:space-y-8">
      {/* 1. HERO PROMOTIONAL BANNER */}
      <div className="relative rounded-3xl overflow-hidden shadow-subtle border border-indigo-200/50">
        <div
          className={`bg-gradient-to-r ${activeBanner.gradient} text-white p-5 sm:p-7 md:p-8 transition-all duration-500 relative flex flex-col justify-between min-h-[190px]`}
        >
          <div className="relative z-10 w-full max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${activeBanner.badgeBg}`}>
                {activeBanner.badge}
              </span>
              <span className={`text-xs font-bold ${activeBanner.accentColor} flex items-center gap-1`}>
                <Sparkles className="w-3.5 h-3.5" />
                {activeBanner.code}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white break-words">
              {activeBanner.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
              {activeBanner.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('providers-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Find Professionals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onOpenBookings}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>My Appointments</span>
              </button>

              {onOpenProviderConsole && (
                <button
                  onClick={onOpenProviderConsole}
                  className="px-4 py-2 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-400/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Partner Console</span>
                </button>
              )}
            </div>
          </div>

          {/* Dots */}
          <div className="relative z-10 flex items-center gap-1.5 pt-3 mt-1 border-t border-white/10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBannerIdx(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeBannerIdx === idx ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/40'
                }`}
                aria-label={`Banner ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. DEDICATED SEARCH & FULFILLMENT MODE TOGGLE */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search service, stylist, electrician or cleaner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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

        {/* Fulfillment Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold w-full md:w-auto justify-center">
          <button
            onClick={() => setFulfillmentFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              fulfillmentFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Services
          </button>
          <button
            onClick={() => setFulfillmentFilter('HOME_VISIT')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              fulfillmentFilter === 'HOME_VISIT'
                ? 'bg-white text-forest-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-forest-700" />
            <span>Home Visit</span>
          </button>
          <button
            onClick={() => setFulfillmentFilter('SHOP_VISIT')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              fulfillmentFilter === 'SHOP_VISIT'
                ? 'bg-white text-amber-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-600" />
            <span>Salon / Shop Visit</span>
          </button>
        </div>
      </div>

      {/* 3. 6 SERVICE CATEGORIES */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Explore Local Services</span>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                Indore Marketplace
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Verified local professionals servicing {localityName}
            </p>
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              Show All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.slug)}
                className={`p-3.5 rounded-3xl border text-left transition flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/40 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-indigo-300 shadow-subtle'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    {cat._count?.services || 4}+ Services
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. VERIFIED SERVICE PROVIDERS GRID */}
      <section id="providers-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Recommended Professionals Near You ({providers.length})
            </h2>
            <p className="text-xs text-slate-500">
              Comparing verified service experts around {localityName}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-3xl"></div>
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {providers.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-indigo-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Provider Image & Badges */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  {p.profileImageUrl ? (
                    <img
                      src={p.profileImageUrl}
                      alt={p.businessName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400 font-black text-2xl">
                      {p.businessName.substring(0, 2)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-slate-900 shadow-2xs">
                      {p.categorySlug.replace('-', ' ')}
                    </span>
                    <div className="flex items-center gap-1 bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full text-xs shadow-2xs">
                      <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>{p.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-800">({p.reviewCount})</span>
                    </div>
                  </div>

                  {/* Bottom Text in Image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-base font-black tracking-tight leading-snug drop-shadow-sm">
                      {p.businessName}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-200 mt-0.5 font-medium">
                      {p.distanceKm !== undefined && (
                        <span>{p.distanceKm.toFixed(1)} km away</span>
                      )}
                      {p.shopCity && <span>• {p.shopCity}</span>}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  {/* Fulfillment Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {p.hasShopVisit && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                        <Store className="w-3 h-3 text-amber-600" />
                        <span>Salon / Shop Visit</span>
                      </span>
                    )}
                    {p.hasHomeVisit && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-xl bg-forest-50 text-forest-900 border border-forest-200 flex items-center gap-1">
                        <Home className="w-3 h-3 text-forest-700" />
                        <span>Home Visit ({p.homeVisitRadiusKm} km coverage)</span>
                      </span>
                    )}
                  </div>

                  {/* Featured Services Preview */}
                  {p.featuredServices && p.featuredServices.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Popular Offerings
                      </span>
                      {p.featuredServices.slice(0, 2).map((srv) => (
                        <div key={srv.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-800 font-semibold truncate pr-2">
                            {srv.title}
                          </span>
                          <span className="font-black text-slate-900 shrink-0">
                            {formatPaise(srv.pricePaise)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => onSelectProvider(p.id)}
                      className="w-full py-2.5 bg-forest-900 hover:bg-forest-950 text-white font-black text-xs rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 group-hover:scale-101"
                    >
                      <span>View Services & Book</span>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-800">No service providers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try resetting your search query or choosing "All Services".
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setFulfillmentFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </MainContentContainer>
  );
};
