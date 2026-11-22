import React, { useState, useEffect } from 'react';
import { Store, Product } from '../../types';
import { request, formatPaise } from '../../api/client';
import { useLocation } from '../../context/LocationContext';
import { ProductCard } from '../../components/ProductCard';
import { ProductDetailModal } from '../../components/ProductDetailModal';
import { MainContentContainer } from '../../components/layout/MainContentContainer';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Phone,
  CheckCircle2,
  Package
} from 'lucide-react';

interface StorefrontViewProps {
  storeId: string;
  onBack: () => void;
  onAddToCart: (storeId: string, productId: string) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  storeId,
  onBack,
  onAddToCart
}) => {
  const { coords } = useLocation();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const res = await request<{ store: Store }>(
          `/customer/stores/${storeId}?lat=${coords.latitude}&lng=${coords.longitude}`
        );
        setStore(res.store);
      } catch (err) {
        console.error('Failed to load store:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [storeId, coords.latitude, coords.longitude]);

  if (loading || !store) {
    return (
      <MainContentContainer className="py-8 animate-pulse space-y-6">
        <div className="h-8 w-32 bg-slate-200 rounded-xl"></div>
        <div className="h-44 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-60 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </MainContentContainer>
    );
  }

  const products = store.products || store.sampleProducts || [];
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  return (
    <MainContentContainer className="py-6 space-y-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-forest-900 transition active:scale-95 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Stores & Categories</span>
      </button>

      {/* Store Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card relative overflow-hidden">
        {/* Subtle decorative background tint */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-400/10 to-transparent pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
                {store.category}
              </span>
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
                Verified Indore Merchant
              </span>
              {store.isOpen ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Accepting Orders
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                  Currently Closed
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {store.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium leading-relaxed">
              {store.description || 'Quality groceries and everyday essentials directly from your local neighbourhood store.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-semibold">
              <span className="flex items-center gap-1 text-slate-800">
                <MapPin className="w-4 h-4 text-forest-700" />
                {store.addressLine}, {store.city} - {store.pincode}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                Open: 8:00 AM - 10:00 PM
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-forest-700 font-bold">
                Radius: {store.serviceRadiusKm} km
              </span>
            </div>
          </div>

          <div className="flex md:flex-col items-start md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0 space-y-2">
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-3.5 py-1.5 rounded-2xl text-sm font-black border border-amber-200 shadow-2xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{store.rating || 4.8} (Indore Verified)</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium md:text-right space-y-0.5">
              <span className="block text-forest-700 font-bold">⚡ ₹0 Free In-Store Pickup</span>
              <span className="block text-slate-400">Min. Order ₹299 for checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold capitalize whitespace-nowrap transition-all duration-150 ${
              selectedCategory === cat
                ? 'bg-forest-900 text-white shadow-card font-black'
                : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
            }`}
          >
            {cat === 'all' ? 'All Products' : cat}
          </button>
        ))}
      </div>

      {/* Product Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-forest-700" />
            <span>Store Products</span>
            <span className="text-xs font-normal text-slate-400">
              ({filteredProducts.length} items available)
            </span>
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800">No products in this category</h3>
            <p className="text-xs text-slate-500">
              Try selecting &ldquo;All Products&rdquo; to see all items stocked by {store.name}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeName={store.name}
                onAddToCart={onAddToCart}
                onSelectProduct={(p) => setSelectedProductForModal(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProductForModal && (
        <ProductDetailModal
          product={selectedProductForModal}
          store={store}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={onAddToCart}
          similarProducts={products.filter((p) => p.id !== selectedProductForModal.id)}
          onSelectSimilarProduct={(p) => setSelectedProductForModal(p)}
        />
      )}
    </MainContentContainer>
  );
};
