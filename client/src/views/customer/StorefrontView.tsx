import React, { useState, useEffect } from 'react';
import { Store, Product } from '../../types';
import { request, formatPaise } from '../../api/client';
import { ArrowLeft, Star, MapPin, Clock, Plus, Check, ShoppingBag, ShieldCheck } from 'lucide-react';

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
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const res = await request<{ store: Store }>(`/customer/stores/${storeId}`);
        setStore(res.store);
      } catch (err) {
        console.error('Failed to load store:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [storeId]);

  if (loading || !store) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
        <div className="h-48 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const products = store.products || [];
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const handleAdd = (productId: string) => {
    onAddToCart(store.id, productId);
    setAddedItemIds((prev) => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [productId]: false }));
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Stores</span>
      </button>

      {/* Store Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {store.category}
              </span>
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Local Merchant
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {store.name}
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">{store.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {store.addressLine}, {store.city} - {store.pincode}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                Open Today: 8:00 AM - 10:00 PM
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Service Radius: {store.serviceRadiusKm} km</span>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-2xl text-sm font-bold border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>4.8 (140+ reviews)</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-2">Free Store Pickup • Direct Neighborhood Delivery</span>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? 'All Catalogue' : cat}
          </button>
        ))}
      </div>

      {/* Product Catalog Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          Store Catalogue ({filteredProducts.length} items)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const hasDiscount = product.mrpPaise > product.pricePaise;
            const isAdded = addedItemIds[product.id];

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                      {product.category}
                    </span>
                    {product.stock > 0 && product.stock <= 5 && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Only {product.stock} left
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatPaise(product.pricePaise)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatPaise(product.mrpPaise)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdd(product.id)}
                    disabled={!product.isAvailable || product.stock === 0}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : product.isAvailable && product.stock > 0
                        ? 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
