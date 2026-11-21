import React, { useState, useEffect } from 'react';
import { Store } from '../../types';
import { request, formatPaise } from '../../api/client';
import { Search, MapPin, Star, Clock, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

interface CustomerHomeProps {
  onSelectStore: (storeId: string) => void;
  selectedLocation: string;
  onAddToCart: (storeId: string, productId: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onSelectStore,
  selectedLocation,
  onAddToCart
}) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Stores' },
    { id: 'grocery', label: 'Kirana & Grocery' },
    { id: 'produce', label: 'Fruits & Veg' },
    { id: 'bakery', label: 'Bakery & Dairy' }
  ];

  const fetchStores = async () => {
    setLoading(true);
    try {
      // Coordinate lookup based on Indore selection
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

  const filteredStores = stores.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.addressLine.toLowerCase().includes(q) ||
      s.sampleProducts?.some((p) => p.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            Hyperlocal Indore Retail Network • 3 km Direct Radius
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Shop from your trusted neighbourhood stores.
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Fresh groceries, daily bakery, fruits & vegetables directly from local shopkeepers.
            Free in-store pickup or 30-min local delivery.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-emerald-200">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Minimum Order ₹299
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Store Pickup: Always ₹0 Free
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Fair 3.5% Merchant Support
            </span>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/20 to-transparent pointer-events-none"></div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search stores, atta, oil, vegetables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stores Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Nearby Neighbourhood Stores</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              within 3 km of {selectedLocation}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-3xl"></div>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800">No stores found in this radius</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Try switching your location selector or clearing your search filters to find nearby stores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/50 hover:shadow-lg transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Store Header Banner */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 inline-block mb-1">
                        {store.category}
                      </span>
                      <h3
                        onClick={() => onSelectStore(store.id)}
                        className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition cursor-pointer"
                      >
                        {store.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{store.addressLine}</p>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-1 rounded-xl text-xs font-bold border border-amber-200 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{store.rating || 4.8}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {store.distanceKm !== undefined ? `${store.distanceKm} km away` : 'Nearby'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      15-30 mins
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-medium">Pickup ₹0</span>
                  </div>
                </div>

                {/* Sample Products Carousel / Quick Items */}
                {store.sampleProducts && store.sampleProducts.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                      Popular Essentials
                    </span>
                    <div className="space-y-1.5">
                      {store.sampleProducts.slice(0, 3).map((prod) => (
                        <div key={prod.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium truncate max-w-[190px]">
                            {prod.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{formatPaise(prod.pricePaise)}</span>
                            <button
                              onClick={() => onAddToCart(store.id, prod.id)}
                              className="px-2 py-0.5 text-[11px] font-bold bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-300 rounded-lg transition"
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
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
                  <span className="text-xs text-slate-500">Min. order ₹299</span>
                  <button
                    onClick={() => onSelectStore(store.id)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition"
                  >
                    <span>Visit Store</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
