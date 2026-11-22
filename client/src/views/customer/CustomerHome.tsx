import React, { useState, useEffect, useMemo } from 'react';
import { Store, Product } from '../../types';
import { request, formatPaise } from '../../api/client';
import { useLocation } from '../../context/LocationContext';
import { ProductCard } from '../../components/ProductCard';
import { ProductDetailModal } from '../../components/ProductDetailModal';
import { MainContentContainer } from '../../components/layout/MainContentContainer';
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
  Upload,
  Sparkle,
  Home,
  Tv,
  Shirt,
  BookOpen,
  Gift,
  Smile,
  X,
  SlidersHorizontal,
  RotateCcw,
  Package,
  Layers,
  Award,
  BadgePercent,
  Check,
  AlertTriangle,
  Navigation
} from 'lucide-react';

interface CustomerHomeProps {
  onSelectStore: (storeId: string) => void;
  selectedLocation?: string;
  onAddToCart: (storeId: string, productId: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onOpenCategories?: () => void;
  onNavigateToPharmacy?: () => void;
  onOpenPrescriptionUpload?: () => void;
}

// 12 Exact Categories from User Specification
export const SHOPPING_CATEGORIES = [
  {
    id: 'produce',
    label: 'Fruits & Vegetables',
    shortLabel: 'Fruits & Veg',
    icon: '🥬',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-900',
    keywords: ['fruit', 'veg', 'tomato', 'potato', 'onion', 'apple', 'banana', 'produce']
  },
  {
    id: 'bakery',
    label: 'Dairy & Bakery',
    shortLabel: 'Dairy & Bread',
    icon: '🥛',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-900',
    keywords: ['dairy', 'milk', 'bread', 'butter', 'paneer', 'cheese', 'bakery', 'egg']
  },
  {
    id: 'staples',
    label: 'Atta, Rice & Dal',
    shortLabel: 'Atta & Dal',
    icon: '🌾',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-900',
    keywords: ['atta', 'rice', 'dal', 'flour', 'grains', 'wheat', 'staples', 'chana']
  },
  {
    id: 'oils',
    label: 'Oil & Ghee',
    shortLabel: 'Oil & Ghee',
    icon: '🌻',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-900',
    keywords: ['oil', 'ghee', 'sunflower', 'mustard', 'refined', 'edible']
  },
  {
    id: 'snacks',
    label: 'Snacks & Beverages',
    shortLabel: 'Snacks & Drinks',
    icon: '🍟',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-900',
    keywords: ['snack', 'drink', 'beverage', 'juice', 'chips', 'biscuit', 'tea', 'coffee']
  },
  {
    id: 'personal_care',
    label: 'Personal Care',
    shortLabel: 'Personal Care',
    icon: '🧴',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-900',
    keywords: ['soap', 'shampoo', 'toothpaste', 'personal', 'cream', 'lotion']
  },
  {
    id: 'household',
    label: 'Household Essentials',
    shortLabel: 'Household',
    icon: '🧻',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
    keywords: ['household', 'tissue', 'foil', 'salt', 'sugar', 'matchbox', 'pooja']
  },
  {
    id: 'cleaning',
    label: 'Cleaning Supplies',
    shortLabel: 'Cleaning',
    icon: '🧹',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-900',
    keywords: ['clean', 'detergent', 'wash', 'floor', 'dishwash', 'broom', 'spray']
  },
  {
    id: 'pharmacy',
    label: 'Medicines & Wellness',
    shortLabel: 'Medicines',
    icon: '💊',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
    keywords: ['medicine', 'tablet', 'bandage', 'syrup', 'health', 'wellness', 'first aid']
  },
  {
    id: 'electronics',
    label: 'Electronics & Mobile',
    shortLabel: 'Electronics',
    icon: '🔌',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-900',
    keywords: ['electronic', 'cable', 'charger', 'battery', 'bulb', 'plug', 'adapter']
  },
  {
    id: 'stationery',
    label: 'Stationery & Books',
    shortLabel: 'Stationery',
    icon: '📚',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-900',
    keywords: ['stationery', 'pen', 'notebook', 'pencil', 'tape', 'paper', 'stapler']
  },
  {
    id: 'pets',
    label: 'Pet Supplies',
    shortLabel: 'Pet Care',
    icon: '🐾',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200',
    textColor: 'text-stone-900',
    keywords: ['pet', 'dog', 'cat', 'treat', 'food', 'collar']
  }
];

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onSelectStore,
  onAddToCart,
  searchQuery = '',
  setSearchQuery,
  onOpenCategories,
  onNavigateToPharmacy,
  onOpenPrescriptionUpload
}) => {
  const { coords, selectedLocation, serviceability, setIsLocationModalOpen } = useLocation();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeBannerIdx, setActiveBannerIdx] = useState<number>(0);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'discount'>('featured');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const localityDisplayName = selectedLocation
    ? selectedLocation.locality || selectedLocation.name
    : 'Indore';

  // High-contrast, rich promotional banners
  const promoBanners = [
    {
      id: 1,
      badge: 'FESTIVAL OF SAVINGS',
      title: 'Flat 20% OFF Daily Essentials',
      subtitle: 'Atta, rice, cold-pressed oils & fresh vegetables directly from verified Indore kiranas.',
      code: 'USE CODE: LOCAL20',
      gradient: 'from-amber-600 via-amber-700 to-amber-900',
      badgeBg: 'bg-amber-300 text-slate-950',
      accentColor: 'text-amber-300'
    },
    {
      id: 2,
      badge: 'ZERO DELIVERY CHARGE',
      title: 'Free Delivery on Orders Above ₹299',
      subtitle: 'Get genuine local store pricing with ₹0 delivery charge delivered to your doorstep.',
      code: 'DIRECT HYPERLOCAL 3 KM',
      gradient: 'from-emerald-800 via-forest-900 to-slate-950',
      badgeBg: 'bg-emerald-300 text-slate-950',
      accentColor: 'text-emerald-300'
    },
    {
      id: 3,
      badge: 'FRESH HARVEST PROMISE',
      title: 'Morning Mandi Vegetables & Fruits',
      subtitle: 'Crisp country tomatoes, Malwa potatoes & seasonal fruits sourced fresh every morning.',
      code: `FARM DIRECT TO ${localityDisplayName.toUpperCase()}`,
      gradient: 'from-orange-700 via-amber-800 to-slate-900',
      badgeBg: 'bg-orange-300 text-slate-950',
      accentColor: 'text-orange-200'
    }
  ];

  // Dynamic store fetch using detected GPS / selected Indore locality coordinates
  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await request<{ stores: Store[] }>(
        `/customer/stores?lat=${coords.latitude}&lng=${coords.longitude}`
      );
      setStores(res.stores || []);
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [coords.latitude, coords.longitude]);

  // Rotate banner every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % promoBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [promoBanners.length]);

  // Aggregate all unique products with store association
  const allProductsWithStore = useMemo(() => {
    const list: Array<{ product: Product; store: Store }> = [];
    const seen = new Set<string>();

    stores.forEach((store) => {
      const items = store.products || store.sampleProducts || [];
      items.forEach((p) => {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          list.push({ product: p, store });
        }
      });
    });
    return list;
  }, [stores]);

  // Available brands for filter
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    allProductsWithStore.forEach(({ product }) => {
      if (product.brand) brands.add(product.brand);
    });
    return ['all', ...Array.from(brands)];
  }, [allProductsWithStore]);

  // Search and Category filtering
  const filteredProductsWithStore = useMemo(() => {
    let result = allProductsWithStore;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(({ product, store }) => {
        return (
          product.name.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          (product.brand && product.brand.toLowerCase().includes(q)) ||
          store.name.toLowerCase().includes(q)
        );
      });
    }

    // Category filter
    if (selectedCategory !== 'all') {
      const catConfig = SHOPPING_CATEGORIES.find((c) => c.id === selectedCategory);
      if (catConfig) {
        result = result.filter(({ product }) => {
          const pName = product.name.toLowerCase();
          const pCat = product.category.toLowerCase();
          return catConfig.keywords.some((kw) => pName.includes(kw) || pCat.includes(kw));
        });
      }
    }

    // Brand filter
    if (selectedBrand !== 'all') {
      result = result.filter(({ product }) => product.brand === selectedBrand);
    }

    // In-stock only
    if (inStockOnly) {
      result = result.filter(({ product }) => product.isAvailable && product.stock > 0);
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'price_asc') return a.product.pricePaise - b.product.pricePaise;
      if (sortBy === 'price_desc') return b.product.pricePaise - a.product.pricePaise;
      if (sortBy === 'discount') {
        const discA = a.product.mrpPaise ? (a.product.mrpPaise - a.product.pricePaise) / a.product.mrpPaise : 0;
        const discB = b.product.mrpPaise ? (b.product.mrpPaise - b.product.pricePaise) / b.product.mrpPaise : 0;
        return discB - discA;
      }
      return 0;
    });
  }, [allProductsWithStore, searchQuery, selectedCategory, selectedBrand, inStockOnly, sortBy]);

  // --- Curated Product Sections ---
  // 1. Bestsellers
  const bestsellers = useMemo(() => {
    return allProductsWithStore.filter(({ product }) => {
      const n = product.name.toLowerCase();
      return n.includes('atta') || n.includes('salt') || n.includes('oil') || n.includes('sugar') || n.includes('butter');
    });
  }, [allProductsWithStore]);

  // 2. Deals of the Day (Genuine MRP discounts)
  const dealsOfTheDay = useMemo(() => {
    return allProductsWithStore.filter(({ product }) => product.mrpPaise && product.mrpPaise > product.pricePaise);
  }, [allProductsWithStore]);

  // 3. Fresh Arrivals (Veggies, Fruits, Breads)
  const freshArrivals = useMemo(() => {
    return allProductsWithStore.filter(({ product }) => {
      const n = product.name.toLowerCase();
      const c = product.category.toLowerCase();
      return c.includes('produce') || c.includes('vegetable') || c.includes('fruit') || n.includes('bread') || n.includes('tomato');
    });
  }, [allProductsWithStore]);

  // 4. Popular Near You
  const popularNearYou = useMemo(() => {
    return allProductsWithStore.slice(0, 8);
  }, [allProductsWithStore]);

  // 5. Top Local Brands
  const topLocalBrands = useMemo(() => {
    return allProductsWithStore.filter(({ product }) => {
      const n = product.name.toLowerCase();
      return n.includes('sanchi') || n.includes('amul') || n.includes('aashirvaad') || n.includes('fortune') || n.includes('tata');
    });
  }, [allProductsWithStore]);

  // 6. Buy Again / Recurring Household Staples
  const buyAgainItems = useMemo(() => {
    return allProductsWithStore.filter(({ product }) => {
      const n = product.name.toLowerCase();
      return n.includes('milk') || n.includes('salt') || n.includes('sugar') || n.includes('potato');
    });
  }, [allProductsWithStore]);

  // 7. Value Combos
  const valueCombos = useMemo(() => {
    return allProductsWithStore.filter(({ product }) => {
      const n = product.name.toLowerCase();
      return n.includes('atta') || n.includes('rice') || n.includes('oil');
    });
  }, [allProductsWithStore]);

  const handleProductSelect = (product: Product) => {
    setSelectedProductForModal(product);
    setRecentlyViewed((prev) => {
      const withoutCurrent = prev.filter((p) => p.id !== product.id);
      return [product, ...withoutCurrent].slice(0, 6);
    });
  };

  const activeBanner = promoBanners[activeBannerIdx];
  const isFiltering = selectedCategory !== 'all' || searchQuery.trim().length > 0;
  const isServiceable = serviceability ? serviceability.isAnyStoreServiceable : true;

  return (
    <MainContentContainer className="py-6 space-y-6 sm:space-y-8">
      {/* SERVICEABILITY LIMITATION WARNING BANNER (If out of delivery zone) */}
      {!isServiceable && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-subtle animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Delivery Limited at {localityDisplayName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Currently, stores in your immediate vicinity are outside our 3.0 km direct delivery radius. You can still order for <strong>Free Store Pickup</strong> or choose another delivery address in Indore.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs shrink-0 transition"
          >
            Change Address
          </button>
        </div>
      )}

      {/* 1. COMPACT RESPONSIVE PROMOTIONAL BANNER CAROUSEL (Text & Layout Fix) */}
      <div className="relative rounded-3xl overflow-hidden shadow-subtle border border-amber-200/60">
        <div
          className={`bg-gradient-to-r ${activeBanner.gradient} text-white p-4 sm:p-6 md:p-8 transition-all duration-500 relative flex flex-col justify-between min-h-[180px] sm:min-h-[210px]`}
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

            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white break-words">
              {activeBanner.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-100 max-w-xl leading-relaxed">
              {activeBanner.subtitle}
            </p>

            <div className="pt-1.5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('bestsellers-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <span>Shop Essentials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>3 km Direct Indore Network</span>
              </div>
            </div>
          </div>

          {/* Dots Indicator & Navigation Controls */}
          <div className="relative z-10 flex items-center justify-between pt-3 mt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              {promoBanners.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBannerIdx(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeBannerIdx === idx ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveBannerIdx((prev) => (prev - 1 + promoBanners.length) % promoBanners.length)}
                className="w-7 h-7 rounded-xl bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveBannerIdx((prev) => (prev + 1) % promoBanners.length)}
                className="w-7 h-7 rounded-xl bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition"
                aria-label="Next banner"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 12 ILLUSTRATED SHOPPING CATEGORIES GRID */}
      <section id="category-discovery-section">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Shop by Category</span>
              <span className="text-[11px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full">
                12 Departments
              </span>
            </h2>
            <p className="text-xs text-slate-500">Fast delivery from neighborhood Indore kiranas</p>
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-2.5">
          {SHOPPING_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.id === 'pharmacy' && onNavigateToPharmacy) {
                    onNavigateToPharmacy();
                    return;
                  }
                  setSelectedCategory(isSelected ? 'all' : cat.id);
                }}
                className={`flex flex-col items-center p-2 sm:p-2.5 rounded-2xl transition-all duration-150 text-center border group ${
                  isSelected
                    ? 'bg-amber-100/90 border-amber-500 shadow-xs ring-2 ring-amber-400/40 scale-102'
                    : `${cat.bgColor} ${cat.borderColor} hover:shadow-subtle hover:scale-102`
                }`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/90 shadow-2xs flex items-center justify-center text-xl sm:text-2xl mb-1.5 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-extrabold leading-tight line-clamp-2 ${cat.textColor}`}>
                  {cat.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Prominent Pharmacy & Medical Prescription Feature Card */}
      {onNavigateToPharmacy && (
        <section className="bg-gradient-to-r from-teal-950 via-teal-900 to-forest-950 rounded-3xl p-6 sm:p-7 text-white border border-teal-700/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 text-amber-300">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                  Pharmacy & Chemist
                </span>
                <span className="text-xs text-teal-200 font-bold">Licensed Indore Stores</span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white">
                Medicines & Health Essentials • Prescription Upload
              </h3>
              <p className="text-xs text-teal-100 max-w-xl">
                Upload your doctor's prescription for registered pharmacist review or explore OTC products from licensed pharmacies in Palasia and Vijay Nagar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
            {onOpenPrescriptionUpload && (
              <button
                onClick={onOpenPrescriptionUpload}
                className="flex-1 md:flex-none px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Prescription</span>
              </button>
            )}
            <button
              onClick={onNavigateToPharmacy}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center justify-center gap-1.5"
            >
              <span>Explore Pharmacy</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* 3. DEDICATED PRODUCT LISTING VIEW (When Category or Search is active) */}
      {isFiltering ? (
        <section className="space-y-4 pt-2">
          {/* Active Filter Bar & Controls */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {selectedCategory !== 'all'
                  ? SHOPPING_CATEGORIES.find((c) => c.id === selectedCategory)?.label
                  : `Results for "${searchQuery}"`}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                ({filteredProductsWithStore.length} items found)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Sort by dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="discount">Highest Savings</option>
                </select>
              </div>

              {/* Brand filter */}
              {availableBrands.length > 2 && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-bold">Brand:</span>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer capitalize"
                  >
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b === 'all' ? 'All Brands' : b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* In-stock toggle */}
              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  inStockOnly
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {inStockOnly && <Check className="w-3.5 h-3.5" />}
                <span>In Stock Only</span>
              </button>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProductsWithStore.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredProductsWithStore.map(({ product, store }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeName={store.name}
                  storeDistance={store.distanceKm ? `${store.distanceKm.toFixed(1)} km` : undefined}
                  onAddToCart={onAddToCart}
                  onSelectProduct={handleProductSelect}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">No products matching your filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try resetting filters or searching for general pantry items like "Atta", "Milk", or "Oil".
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedBrand('all');
                  setInStockOnly(false);
                  if (setSearchQuery) setSearchQuery('');
                }}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>
      ) : (
        /* 4. CURATED SHOPPING-FIRST DISCOVERY SECTIONS */
        <div className="space-y-8 sm:space-y-10">
          {/* Section A: BESTSELLERS */}
          {bestsellers.length > 0 && (
            <section id="bestsellers-section" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    <Flame className="w-4 h-4 fill-slate-950 text-slate-950" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Bestsellers in {localityDisplayName}
                    </h2>
                    <p className="text-[11px] text-slate-500">Most reordered daily staples this week</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full">
                  {serviceability?.deliveryEta || '15-20 min'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {bestsellers.map(({ product, store }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeName={store.name}
                    storeDistance={store.distanceKm ? `${store.distanceKm.toFixed(1)} km` : undefined}
                    onAddToCart={onAddToCart}
                    onSelectProduct={handleProductSelect}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section B: DEALS OF THE DAY (Verified MRP Discounts) */}
          {dealsOfTheDay.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-forest-900 text-amber-300 flex items-center justify-center font-black">
                    <BadgePercent className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Deals of the Day
                    </h2>
                    <p className="text-[11px] text-slate-500">Genuine MRP savings from neighbourhood shopkeepers</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Up to 20% OFF
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {dealsOfTheDay.map(({ product, store }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeName={store.name}
                    storeDistance={store.distanceKm ? `${store.distanceKm.toFixed(1)} km` : undefined}
                    onAddToCart={onAddToCart}
                    onSelectProduct={handleProductSelect}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section C: FRESH ARRIVALS */}
          {freshArrivals.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                    <Apple className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Fresh Farm & Bakery Arrivals
                    </h2>
                    <p className="text-[11px] text-slate-500">Crisp vegetables, seasonal fruits & daily bakery</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Sourced Daily
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {freshArrivals.map(({ product, store }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeName={store.name}
                    storeDistance={store.distanceKm ? `${store.distanceKm.toFixed(1)} km` : undefined}
                    onAddToCart={onAddToCart}
                    onSelectProduct={handleProductSelect}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section D: BUY AGAIN (Recurring Essentials) */}
          {buyAgainItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                    <RotateCcw className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Buy Again / Household Staples
                    </h2>
                    <p className="text-[11px] text-slate-500">Replenish your kitchen pantry in one tap</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  Quick Reorder
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {buyAgainItems.map(({ product, store }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeName={store.name}
                    storeDistance={store.distanceKm ? `${store.distanceKm.toFixed(1)} km` : undefined}
                    onAddToCart={onAddToCart}
                    onSelectProduct={handleProductSelect}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section E: TOP LOCAL BRANDS */}
          {topLocalBrands.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Top Trusted Brands
                    </h2>
                    <p className="text-[11px] text-slate-500">Sanchi, Amul, Aashirvaad, Fortune & Tata</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  100% Genuine
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {topLocalBrands.map(({ product, store }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeName={store.name}
                    storeDistance={store.distanceKm ? `${store.distanceKm.toFixed(1)} km` : undefined}
                    onAddToCart={onAddToCart}
                    onSelectProduct={handleProductSelect}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section F: VALUE COMBOS */}
          {valueCombos.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Kitchen Value Combos
                    </h2>
                    <p className="text-[11px] text-slate-500">Chakki Atta, Basmati Rice & Cooking Oil essentials</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                  Bundle & Save
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {valueCombos.map(({ product, store }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeName={store.name}
                    storeDistance={store.distanceKm ? `${store.distanceKm.toFixed(1)} km` : undefined}
                    onAddToCart={onAddToCart}
                    onSelectProduct={handleProductSelect}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section G: RECENTLY VIEWED (Interactive) */}
          {recentlyViewed.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-700 text-white flex items-center justify-center font-black">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Recently Viewed
                    </h2>
                    <p className="text-[11px] text-slate-500">Items you checked out in this session</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {recentlyViewed.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onSelectProduct={handleProductSelect}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 5. NEARBY LOCAL STORES SECTION */}
          <section className="pt-4 border-t border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <StoreIcon className="w-5 h-5 text-amber-600" />
                  <span>Neighbourhood Stores Near You</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Licensed local merchants servicing {localityDisplayName} within 3 km
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                {stores.length} Retailers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => onSelectStore(store.id)}
                  className="bg-white p-4 rounded-3xl border border-slate-200/80 hover:border-amber-400 shadow-subtle hover:shadow-card transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-base shrink-0 group-hover:scale-105 transition-transform">
                      {store.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                          {store.name}
                        </h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 shrink-0">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{store.addressLine}</p>

                      <div className="flex items-center gap-2 text-xs font-bold mt-2">
                        <span className="flex items-center gap-1 text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>4.8</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600">
                          {store.distanceKm ? `${store.distanceKm.toFixed(1)} km` : 'Local'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-forest-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>15-20 min</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Pickup Free
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-800">
                        Doorstep Delivery
                      </span>
                    </div>
                    <span className="text-amber-600 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Visit</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProductForModal && (
        <ProductDetailModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </MainContentContainer>
  );
};
