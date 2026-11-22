import React, { useState, useEffect, useMemo } from 'react';
import { Store, Product } from '../../types';
import { request, formatPaise } from '../../api/client';
import { ProductCard } from '../../components/ProductCard';
import { ProductDetailModal } from '../../components/ProductDetailModal';
import {
  Search,
  MapPin,
  Star,
  Clock,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Flame,
  Zap,
  TrendingUp,
  Percent,
  CheckCircle2,
  Store as StoreIcon,
  Apple,
  Milk,
  Coffee,
  HeartPulse,
  Sparkle,
  Home,
  Tv,
  Shirt,
  BookOpen,
  Gift,
  Smile,
  X
} from 'lucide-react';

interface CustomerHomeProps {
  onSelectStore: (storeId: string) => void;
  selectedLocation: string;
  onAddToCart: (storeId: string, productId: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onSelectStore,
  selectedLocation,
  onAddToCart,
  searchQuery = '',
  setSearchQuery
}) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeBannerIdx, setActiveBannerIdx] = useState<number>(0);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // 12 Visual Categories with tailored color schemes & icons
  const categories = [
    { id: 'all', label: 'All Items', icon: Sparkles, bg: 'bg-slate-100 text-slate-800' },
    { id: 'grocery', label: 'Grocery', icon: ShoppingBag, bg: 'bg-amber-100 text-amber-900 border-amber-200' },
    { id: 'produce', label: 'Fruits & Veg', icon: Apple, bg: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
    { id: 'bakery', label: 'Dairy & Bakery', icon: Milk, bg: 'bg-yellow-100 text-yellow-900 border-yellow-200' },
    { id: 'snacks', label: 'Snacks & Drinks', icon: Coffee, bg: 'bg-orange-100 text-orange-900 border-orange-200' },
    { id: 'medicines', label: 'Medicines', icon: HeartPulse, bg: 'bg-rose-100 text-rose-900 border-rose-200' },
    { id: 'personal-care', label: 'Personal Care', icon: Sparkle, bg: 'bg-teal-100 text-teal-900 border-teal-200' },
    { id: 'home', label: 'Home & Kitchen', icon: Home, bg: 'bg-blue-100 text-blue-900 border-blue-200' },
    { id: 'electronics', label: 'Electronics', icon: Tv, bg: 'bg-purple-100 text-purple-900 border-purple-200' },
    { id: 'fashion', label: 'Fashion', icon: Shirt, bg: 'bg-pink-100 text-pink-900 border-pink-200' },
    { id: 'stationery', label: 'Stationery', icon: BookOpen, bg: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
    { id: 'gifts', label: 'Gifts & Sweets', icon: Gift, bg: 'bg-red-100 text-red-900 border-red-200' },
  ];

  // Promotional Banners Carousel Data (Real application value props)
  const promoBanners = [
    {
      id: 1,
      badge: 'FESTIVE HARVEST DEALS',
      title: 'Save More on Daily Staples & Local Produce',
      subtitle: 'Atta, rice, cold-pressed oils & fresh vegetables from your local Indore mandis.',
      cta: 'Explore Essentials',
      gradient: 'from-amber-600 via-amber-700 to-forest-900',
      pillColor: 'bg-amber-400 text-slate-950',
      tag: 'Up to 30% Off'
    },
    {
      id: 2,
      badge: '30-MIN LOCAL DELIVERY',
      title: 'Indore Neighbourhood Stores At Your Doorstep',
      subtitle: 'Support independent shopkeepers across Palasia, Saket & Vijay Nagar.',
      cta: 'Browse Stores',
      gradient: 'from-forest-900 via-forest-800 to-emerald-950',
      pillColor: 'bg-emerald-400 text-slate-950',
      tag: 'Fast & Fresh'
    },
    {
      id: 3,
      badge: 'IN-STORE PICKUP: ₹0 FREE',
      title: 'Order Ahead & Skip the Queue Instantly',
      subtitle: 'Prepared fresh by merchants and kept ready for you without delivery fees.',
      cta: 'Find Stores',
      gradient: 'from-slate-900 via-forest-900 to-amber-900',
      pillColor: 'bg-amber-300 text-slate-950',
      tag: 'Zero Surcharge'
    }
  ];

  const fetchStores = async () => {
    setLoading(true);
    try {
      const coords: Record<string, { lat: number; lng: number }> = {
        'Palasia, Indore': { lat: 22.7244, lng: 75.8839 },
        'Vijay Nagar, Indore': { lat: 22.7533, lng: 75.8937 },
        'Saket, Indore': { lat: 22.7208, lng: 75.8942 },
        'Bhawarkua, Indore': { lat: 22.6926, lng: 75.8676 },
        'Rajwada, Indore': { lat: 22.7196, lng: 75.8577 },
        'Annapurna, Indore': { lat: 22.7011, lng: 75.8341 }
      };

      const loc = coords[selectedLocation] || coords['Palasia, Indore'];
      const catParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const res = await request<{ stores: Store[] }>(`/customer/stores?lat=${loc.lat}&lng=${loc.lng}${catParam}`);
      setStores(res.stores);
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [selectedLocation, selectedCategory]);

  // Flatten and curate products across all nearby stores
  const allProductsWithStore = useMemo(() => {
    const list: Array<{ product: Product; store: Store }> = [];
    stores.forEach((store) => {
      const items = store.products || store.sampleProducts || [];
      items.forEach((p) => {
        list.push({ product: p, store });
      });
    });
    return list;
  }, [stores]);

  // Search filtering
  const filteredProductsWithStore = useMemo(() => {
    if (!searchQuery) return allProductsWithStore;
    const q = searchQuery.toLowerCase().trim();
    return allProductsWithStore.filter(({ product, store }) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.brand && product.brand.toLowerCase().includes(q)) ||
        store.name.toLowerCase().includes(q)
      );
    });
  }, [allProductsWithStore, searchQuery]);

  // Discovery Curations: Popular Near You
  const popularProducts = useMemo(() => {
    return allProductsWithStore.slice(0, 8);
  }, [allProductsWithStore]);

  // Discovery Curations: Best Offers (genuine MRP savings)
  const offerProducts = useMemo(() => {
    return allProductsWithStore.filter(({ product }) => product.mrpPaise && product.mrpPaise > product.pricePaise);
  }, [allProductsWithStore]);

  // Discovery Curations: Everyday Essentials (staples, dairy, bread)
  const everydayEssentials = useMemo(() => {
    return allProductsWithStore.filter(({ product }) => {
      const cat = product.category.toLowerCase();
      const n = product.name.toLowerCase();
      return (
        cat.includes('staple') ||
        cat.includes('flour') ||
        cat.includes('dairy') ||
        cat.includes('bread') ||
        n.includes('atta') ||
        n.includes('milk') ||
        n.includes('oil') ||
        n.includes('sugar') ||
        n.includes('potato')
      );
    });
  }, [allProductsWithStore]);

  const activeBanner = promoBanners[activeBannerIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* A. PROMOTIONAL HERO BANNER CAROUSEL */}
      <div className="relative rounded-3xl overflow-hidden shadow-card border border-amber-200/50">
        <div
          className={`bg-gradient-to-r ${activeBanner.gradient} text-white p-6 sm:p-10 transition-all duration-500 relative flex flex-col justify-between min-h-[220px] sm:min-h-[260px]`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-amber-400/20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${activeBanner.pillColor}`}>
                {activeBanner.badge}
              </span>
              <span className="text-xs font-bold text-amber-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {activeBanner.tag}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
              {activeBanner.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
              {activeBanner.subtitle}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('popular-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>{activeBanner.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-amber-100">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Indore Local Pilot • 3 km Radius</span>
              </div>
            </div>
          </div>

          {/* Carousel Navigation Indicators */}
          <div className="relative z-10 flex items-center justify-between pt-4 mt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              {promoBanners.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBannerIdx(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeBannerIdx === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveBannerIdx((prev) => (prev === 0 ? promoBanners.length - 1 : prev - 1))}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveBannerIdx((prev) => (prev === promoBanners.length - 1 ? 0 : prev + 1))}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* B. CATEGORY DISCOVERY (Horizontal Scroll on Mobile, Grid on Desktop) */}
      <section id="category-discovery-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Explore Categories</span>
            <span className="text-[11px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-200">
              12 Departments
            </span>
          </h2>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Reset filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories Bar / Grid */}
        <div className="flex sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex sm:flex-col items-center sm:justify-center gap-2 px-3.5 py-2.5 sm:px-2 sm:py-3 rounded-2xl border transition-all duration-150 text-left sm:text-center ${
                  isSelected
                    ? 'bg-forest-900 text-white border-forest-900 shadow-card scale-102 font-black'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 hover:border-slate-300 font-semibold'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-forest-800 text-amber-400' : `${cat.bg} border`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-[11px] leading-tight truncate sm:max-w-full">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* C. ACTIVE SEARCH RESULTS OVERVIEW (If User is Searching) */}
      {searchQuery && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-forest-700" />
              <span>Search results for &ldquo;{searchQuery}&rdquo;</span>
              <span className="text-xs font-normal text-slate-500">
                ({filteredProductsWithStore.length} items found)
              </span>
            </h3>
            {setSearchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Clear Search
              </button>
            )}
          </div>

          {filteredProductsWithStore.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800">No items match your search</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for general staples like &ldquo;atta&rdquo;, &ldquo;milk&rdquo;, &ldquo;oil&rdquo;, or &ldquo;potato&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
              {filteredProductsWithStore.map(({ product, store }) => (
                <ProductCard
                  key={`${store.id}-${product.id}`}
                  product={product}
                  storeName={store.name}
                  storeDistance={store.distanceKm !== undefined ? `${store.distanceKm} km` : 'Near'}
                  onAddToCart={onAddToCart}
                  onSelectProduct={(p) => setSelectedProductForModal(p)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* D. QUICK DISCOVERY SECTION: POPULAR NEAR YOU */}
      {!searchQuery && popularProducts.length > 0 && (
        <section id="popular-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Popular Near You
              </h2>
            </div>
            <span className="text-xs font-bold text-forest-700">Fast-moving staples</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {popularProducts.map(({ product, store }) => (
              <ProductCard
                key={`pop-${store.id}-${product.id}`}
                product={product}
                storeName={store.name}
                storeDistance={store.distanceKm !== undefined ? `${store.distanceKm} km` : 'Near'}
                onAddToCart={onAddToCart}
                onSelectProduct={(p) => setSelectedProductForModal(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* E. QUICK DISCOVERY SECTION: OFFERS NEAR YOU */}
      {!searchQuery && offerProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Special Offers & Discounts
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Verified MRP Savings
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {offerProducts.map(({ product, store }) => (
              <ProductCard
                key={`off-${store.id}-${product.id}`}
                product={product}
                storeName={store.name}
                storeDistance={store.distanceKm !== undefined ? `${store.distanceKm} km` : 'Near'}
                onAddToCart={onAddToCart}
                onSelectProduct={(p) => setSelectedProductForModal(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* F. QUICK DISCOVERY SECTION: EVERYDAY ESSENTIALS */}
      {!searchQuery && everydayEssentials.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Everyday Essentials
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">Daily kitchen needs</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {everydayEssentials.map(({ product, store }) => (
              <ProductCard
                key={`ess-${store.id}-${product.id}`}
                product={product}
                storeName={store.name}
                storeDistance={store.distanceKm !== undefined ? `${store.distanceKm} km` : 'Near'}
                onAddToCart={onAddToCart}
                onSelectProduct={(p) => setSelectedProductForModal(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* G. SHOP BY STORE DISCOVERY */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-forest-700" />
              <span>Shop by Neighbourhood Store</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified local retail shops within 3.0 km of {selectedLocation}
            </p>
          </div>
          <span className="text-xs font-bold text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
            {stores.length} Stores Available
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-slate-200 rounded-3xl"></div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-subtle">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800">No stores found in this radius</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please choose another neighbourhood location above or verify GPS permission.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400 shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Store Header Banner */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200 inline-block mb-1.5">
                        {store.category}
                      </span>
                      <h3
                        onClick={() => onSelectStore(store.id)}
                        className="font-black text-lg text-slate-900 group-hover:text-forest-900 transition cursor-pointer"
                      >
                        {store.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                        {store.addressLine}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-xl text-xs font-black border border-amber-200 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{store.rating || 4.8}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-forest-700" />
                      {store.distanceKm !== undefined ? `${store.distanceKm} km away` : 'Nearby'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      15-30 mins
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-forest-700 font-bold">Pickup ₹0</span>
                  </div>
                </div>

                {/* Sample Products Carousel / Quick Items */}
                {store.sampleProducts && store.sampleProducts.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Popular In Store
                    </span>
                    <div className="space-y-2">
                      {store.sampleProducts.slice(0, 3).map((prod) => (
                        <div key={prod.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-semibold truncate max-w-[190px]">
                            {prod.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">
                              {formatPaise(prod.pricePaise)}
                            </span>
                            <button
                              onClick={() => onAddToCart(store.id, prod.id)}
                              className="px-2.5 py-0.5 text-[11px] font-bold bg-white hover:bg-forest-900 hover:text-white text-forest-900 border border-forest-600/60 rounded-lg transition active:scale-95"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Footer */}
                <div className="p-4 px-5 border-t border-slate-100 flex items-center justify-between bg-white">
                  <span className="text-xs font-semibold text-slate-400">Min. order ₹299</span>
                  <button
                    onClick={() => onSelectStore(store.id)}
                    className="flex items-center gap-1.5 text-xs font-black text-forest-800 hover:text-forest-950 transition"
                  >
                    <span>Visit Store Catalogue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product Detail Modal */}
      {selectedProductForModal && (
        <ProductDetailModal
          product={selectedProductForModal}
          store={stores.find((s) => s.id === selectedProductForModal.storeId)}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={onAddToCart}
          similarProducts={
            stores.find((s) => s.id === selectedProductForModal.storeId)?.sampleProducts?.filter(
              (p) => p.id !== selectedProductForModal.id
            ) || []
          }
          onSelectSimilarProduct={(p) => setSelectedProductForModal(p)}
        />
      )}
    </div>
  );
};
