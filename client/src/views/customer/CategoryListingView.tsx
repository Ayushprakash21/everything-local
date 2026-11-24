import React, { useState, useEffect, useMemo } from 'react';
import { ProductCategory, Product, Store } from '../../types';
import { request, formatPaise } from '../../api/client';
import { ProductCard } from '../../components/ProductCard';
import { ProductDetailModal } from '../../components/ProductDetailModal';
import { getCategoryImageUrl } from '../../data/categoryImages';
import {
  ArrowLeft,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Check,
  Store as StoreIcon,
  Tag,
  Star,
  CheckCircle2,
  PackageX,
  Filter
} from 'lucide-react';

interface CategoryListingViewProps {
  categorySlug: string;
  onBack: () => void;
  onAddToCart: (storeId: string, productId: string) => void;
  onSelectStore?: (storeId: string) => void;
  initialSubcategorySlug?: string | null;
}

interface CategoryResponse {
  category: ProductCategory;
  subcategories: ProductCategory[];
  products: (Product & { store: Partial<Store> })[];
  filters: {
    brands: string[];
    minPricePaise?: number;
    maxPricePaise?: number;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const CategoryListingView: React.FC<CategoryListingViewProps> = ({
  categorySlug,
  onBack,
  onAddToCart,
  onSelectStore,
  initialSubcategorySlug
}) => {
  const [data, setData] = useState<CategoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Filter & Sort State
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string | null>(initialSubcategorySlug || null);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [priceRange, setPriceRange] = useState<number | null>(null); // max price filter in Rupees
  const [selectedModalProduct, setSelectedModalProduct] = useState<Product | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  // Fetch category and products whenever categorySlug changes
  useEffect(() => {
    let mounted = true;
    window.scrollTo({ top: 0, behavior: 'instant' });

    async function fetchCategoryData() {
      try {
        setLoading(true);
        setError(null);

        let url = `/categories/${categorySlug}/products?sortBy=${sortBy}`;
        if (selectedSubcategorySlug) url += `&subcategory=${selectedSubcategorySlug}`;
        if (selectedBrand !== 'all') url += `&brand=${encodeURIComponent(selectedBrand)}`;
        if (inStockOnly) url += `&inStock=true`;

        const res = await request<CategoryResponse>(url);
        if (mounted) {
          if (!res.products || res.products.length === 0) {
            // Intelligent fallback: fetch customer products and match by category keywords
            try {
              const allProdRes = await request<{ products: Product[] }>('/customer/products?take=60');
              const qWords = categorySlug.split('-').filter((w) => w.length > 2);
              const matched = (allProdRes.products || []).filter((p) => {
                const pName = p.name.toLowerCase();
                const pCat = p.category.toLowerCase();
                return qWords.some((kw) => pName.includes(kw) || pCat.includes(kw));
              });
              if (matched.length > 0) {
                res.products = matched as any;
              }
            } catch {
              // Ignore fallback errors
            }
          }
          setData(res);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load category products');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCategoryData();
    return () => {
      mounted = false;
    };
  }, [categorySlug, selectedSubcategorySlug, selectedBrand, inStockOnly, sortBy]);

  // Client-side Price Filter
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    let list = [...data.products];

    if (priceRange !== null) {
      const maxPaise = priceRange * 100;
      list = list.filter((p) => p.pricePaise <= maxPaise);
    }

    return list;
  }, [data?.products, priceRange]);

  const activeSubcategory = useMemo(() => {
    if (!selectedSubcategorySlug || !data?.subcategories) return null;
    return data.subcategories.find((s) => s.slug === selectedSubcategorySlug) || null;
  }, [selectedSubcategorySlug, data?.subcategories]);

  const clearAllFilters = () => {
    setSelectedSubcategorySlug(null);
    setSelectedBrand('all');
    setInStockOnly(false);
    setPriceRange(null);
    setSortBy('relevance');
  };

  const hasActiveFilters =
    selectedSubcategorySlug !== null || selectedBrand !== 'all' || inStockOnly || priceRange !== null || sortBy !== 'relevance';

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* 1. Breadcrumbs & Back Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-3" aria-label="Breadcrumb">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-700 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-bold">{data?.category?.name || 'Category'}</span>
        {activeSubcategory && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-amber-700 font-extrabold">{activeSubcategory.name}</span>
          </>
        )}
      </nav>

      {/* 2. Category Hero Banner */}
      {data?.category && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/80 p-4 sm:p-6 mb-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-subtle border border-amber-200/60 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={getCategoryImageUrl(data.category.slug, data.category.imageUrl)}
                alt={data.category.name}
                loading="eager"
                width={512}
                height={512}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/category-images/grocery-daily-essentials.webp';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                  Aisle
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {filteredProducts.length} local items available
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {data.category.name}
              </h1>
              {data.category.description && (
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-0.5 line-clamp-2">
                  {data.category.description}
                </p>
              )}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-amber-900 bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-amber-200/60 shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Rooted in Indore Local Stores</span>
          </div>
        </div>
      )}

      {/* 3. Subcategory Horizontal Pills Bar */}
      {data?.subcategories && data.subcategories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">Subcategories</span>
            {selectedSubcategorySlug && (
              <button
                onClick={() => setSelectedSubcategorySlug(null)}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
              >
                View All Subcategories
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            <button
              onClick={() => setSelectedSubcategorySlug(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
                selectedSubcategorySlug === null
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              All {data.category.name}
            </button>
            {data.subcategories.map((sub) => {
              const isSubSelected = selectedSubcategorySlug === sub.slug;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategorySlug(isSubSelected ? null : sub.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 border cursor-pointer flex items-center gap-1.5 ${
                    isSubSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span>{sub.name}</span>
                  {sub._count?.products !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSubSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {sub._count.products}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Filter & Sort Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* In-Stock Filter Toggle */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
              inStockOnly
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${inStockOnly ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>In-Stock Only</span>
          </button>

          {/* Brand Filter Dropdown */}
          {data?.filters?.brands && data.filters.brands.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-500">Brand:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Brands</option>
                {data.filters.brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Max Price Slider Quick Select */}
          {data?.filters?.maxPricePaise && data.filters.maxPricePaise > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-medium">Max:</span>
              <select
                value={priceRange !== null ? priceRange : 'all'}
                onChange={(e) => setPriceRange(e.target.value === 'all' ? null : parseInt(e.target.value, 10))}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Any Price</option>
                <option value="50">Under ₹50</option>
                <option value="100">Under ₹100</option>
                <option value="250">Under ₹250</option>
                <option value="500">Under ₹500</option>
                <option value="1000">Under ₹1000</option>
              </select>
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-red-600 font-bold text-xs px-2 py-1 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-xs ml-auto">
          <span className="text-slate-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* 5. Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 h-64 animate-pulse">
              <div className="w-full h-32 bg-slate-200 rounded-xl mb-3" />
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-slate-200 rounded mb-4" />
              <div className="h-8 w-full bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <PackageX className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-base font-black text-slate-800 mb-1">No products found in this aisle</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Try adjusting your filters or subcategory selection to discover items from other local merchants.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Clear Filters & View All
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              storeName={product.store?.name}
              onAddToCart={() => onAddToCart(product.storeId, product.id)}
              onClick={() => setSelectedModalProduct(product)}
            />
          ))}
        </div>
      )}

      {/* 6. Product Detail Modal */}
      {selectedModalProduct && (
        <ProductDetailModal
          product={selectedModalProduct}
          storeName={selectedModalProduct.store?.name}
          onClose={() => setSelectedModalProduct(null)}
          onAddToCart={() => {
            onAddToCart(selectedModalProduct.storeId, selectedModalProduct.id);
            setSelectedModalProduct(null);
          }}
          onViewStore={
            onSelectStore
              ? () => {
                  onSelectStore(selectedModalProduct.storeId);
                  setSelectedModalProduct(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
