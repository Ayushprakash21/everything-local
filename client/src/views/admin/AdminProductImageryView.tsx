import React, { useState, useEffect } from 'react';
import { request } from '../../api/client';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import {
  Sparkles,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Edit2,
  RefreshCw,
  ExternalLink,
  Layers,
  ShoppingBag,
  Store as StoreIcon,
  Check
} from 'lucide-react';

interface ImageryProduct {
  id: string;
  name: string;
  category: string;
  brand?: string | null;
  packageSize?: string | null;
  pricePaise: number;
  mrpPaise: number;
  stock: number;
  isAvailable: boolean;
  imageUrl?: string | null;
  hasImage: boolean;
  imageSource: 'AI_STUDIO' | 'MERCHANT_UPLOAD' | 'MISSING';
  isVerifiedRealistic: boolean;
  store: { id: string; name: string; category: string };
}

interface ImageryMetrics {
  totalProducts: number;
  coveredProducts: number;
  coveragePct: number;
  aiStudioCount: number;
  merchantUploadedCount: number;
  missingCount: number;
}

const PRESET_OPTIONS = [
  { label: 'Aashirvaad Chakki Atta', url: '/product-images/groceries/aashirvaad-chakki-atta.webp', category: 'Flour & Grains' },
  { label: 'Tata Sampann Toor Dal', url: '/product-images/groceries/toor-dal.webp', category: 'Pulses & Dals' },
  { label: 'Organic Moong Dal Dhuli', url: '/product-images/groceries/moong-dal.webp', category: 'Pulses & Dals' },
  { label: 'Premium Chana Dal', url: '/product-images/groceries/chana-dal.webp', category: 'Pulses & Dals' },
  { label: 'Desi Masoor Dal Malka', url: '/product-images/groceries/masoor-dal.webp', category: 'Pulses & Dals' },
  { label: 'Chitra Rajma Beans', url: '/product-images/groceries/rajma.webp', category: 'Pulses & Dals' },
  { label: 'Amritsari Kabuli Chana', url: '/product-images/groceries/kabuli-chana.webp', category: 'Pulses & Dals' },
  { label: 'Ujjaini Thick Poha', url: '/product-images/groceries/indori-poha.webp', category: 'Flour & Grains' },
  { label: 'Granular Sooji Rava', url: '/product-images/groceries/sooji-rava.webp', category: 'Flour & Grains' },
  { label: 'Stoneground Besan', url: '/product-images/groceries/besan.webp', category: 'Flour & Grains' },
  { label: 'Fortune Sunflower Oil', url: '/product-images/groceries/fortune-sunflower-oil.webp', category: 'Edible Oils' },
  { label: 'Kachi Ghani Mustard Oil', url: '/product-images/groceries/mustard-oil.webp', category: 'Edible Oils' },
  { label: 'Amul Pure Cow Ghee', url: '/product-images/groceries/cow-ghee.webp', category: 'Edible Oils' },
  { label: 'Tata Iodized Salt', url: '/product-images/groceries/tata-salt.webp', category: 'Spices & Seasoning' },
  { label: 'Madhur Refined Sugar', url: '/product-images/groceries/madhur-sugar.webp', category: 'Grocery Staples' },
  { label: 'India Gate Basmati Rice', url: '/product-images/groceries/india-gate-basmati-rice.webp', category: 'Rice & Grains' },
  { label: 'Agmark Turmeric Powder', url: '/product-images/groceries/turmeric-powder.webp', category: 'Spices & Seasoning' },
  { label: 'Tikhalal Red Chilli Powder', url: '/product-images/groceries/red-chilli-powder.webp', category: 'Spices & Seasoning' },
  { label: 'Catch Cumin Seeds Jeera', url: '/product-images/groceries/cumin-seeds.webp', category: 'Spices & Seasoning' },
  { label: 'Tata Tea Premium Leaf', url: '/product-images/groceries/tata-tea.webp', category: 'Tea & Coffee' },
  { label: 'Fresh Malwa Potatoes', url: '/product-images/fruits-vegetables/fresh-malwa-potatoes.webp', category: 'Vegetables' },
  { label: 'Red Hybrid Onions', url: '/product-images/fruits-vegetables/red-hybrid-onions.webp', category: 'Vegetables' },
  { label: 'Ripe Country Tomatoes', url: '/product-images/fruits-vegetables/ripe-country-tomatoes.webp', category: 'Vegetables' },
  { label: 'Shimla Royal Apples', url: '/product-images/fruits-vegetables/shimla-apples.webp', category: 'Fruits' },
  { label: 'Ratnagiri Alphonso Mangoes', url: '/product-images/fruits-vegetables/alphonso-mangoes.webp', category: 'Fruits' },
  { label: 'Fresh Green Chillies', url: '/product-images/fruits-vegetables/green-chillies.webp', category: 'Vegetables' },
  { label: 'Fresh Coriander Bunch', url: '/product-images/fruits-vegetables/fresh-coriander.webp', category: 'Vegetables' },
  { label: 'Juicy Yellow Lemons', url: '/product-images/fruits-vegetables/fresh-lemon.webp', category: 'Vegetables' },
  { label: 'Fresh Ginger Root', url: '/product-images/fruits-vegetables/fresh-ginger.webp', category: 'Vegetables' },
  { label: 'Fresh Robusta Bananas', url: '/product-images/fruits-vegetables/fresh-bananas.webp', category: 'Fruits' },
  { label: 'Artisan Whole Wheat Bread', url: '/product-images/dairy-bakery/fresh-whole-wheat-bread.webp', category: 'Bread & Buns' },
  { label: 'Amul Salted Table Butter', url: '/product-images/dairy-bakery/amul-butter.webp', category: 'Dairy' },
  { label: 'Sanchi Gold Full Cream Milk', url: '/product-images/dairy-bakery/sanchi-gold-milk.webp', category: 'Dairy' },
  { label: 'Fresh Malai Paneer Block', url: '/product-images/dairy-bakery/fresh-paneer.webp', category: 'Dairy' },
  { label: 'Farm Fresh Brown Eggs (6s)', url: '/product-images/dairy-bakery/farm-eggs.webp', category: 'Dairy' },
  { label: 'Indori Sev Namkeen Special', url: '/product-images/snacks-beverages/indori-sev.webp', category: 'Snacks' }
];

export const AdminProductImageryView: React.FC = () => {
  const [metrics, setMetrics] = useState<ImageryMetrics | null>(null);
  const [products, setProducts] = useState<ImageryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<ImageryProduct | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [previewProduct, setPreviewProduct] = useState<ImageryProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchImageryData = async () => {
    setLoading(true);
    try {
      const res = await request<{ metrics: ImageryMetrics; products: ImageryProduct[] }>('/admin/imagery/products');
      setMetrics(res.metrics);
      setProducts(res.products);
    } catch (err: any) {
      console.error('Failed to load imagery status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImageryData();
  }, []);

  const handleUpdateImage = async (productId: string, newUrl: string) => {
    setSaving(true);
    try {
      await request(`/admin/imagery/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ imageUrl: newUrl })
      });
      setEditingProduct(null);
      await fetchImageryData();
    } catch (err: any) {
      alert(`Failed to update image: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.store.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSource =
      selectedSource === 'all' ||
      (selectedSource === 'AI_STUDIO' && p.imageSource === 'AI_STUDIO') ||
      (selectedSource === 'MERCHANT_UPLOAD' && p.imageSource === 'MERCHANT_UPLOAD') ||
      (selectedSource === 'MISSING' && p.imageSource === 'MISSING');

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesSource && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header & Metrics Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                AI Commercial Product Imagery Studio
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Production quality control, realistic photography coverage, and image provenance management across Everything Local.
            </p>
          </div>
          <button
            onClick={fetchImageryData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Audit
          </button>
        </div>

        {/* Metric Cards Grid */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalogue Items</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalProducts}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across all registered stores</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                AI Studio Realistic
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1">{metrics.aiStudioCount}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Commercial 1024x1024 photos</div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <Camera className="w-3 h-3 text-blue-600" />
                Merchant Uploads
              </div>
              <div className="text-2xl font-black text-blue-900 mt-1">{metrics.merchantUploadedCount}</div>
              <div className="text-[11px] text-blue-600 mt-0.5">Real seller supplied photos</div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
              <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Missing / Fallback
              </div>
              <div className="text-2xl font-black text-rose-900 mt-1">{metrics.missingCount}</div>
              <div className="text-[11px] text-rose-600 mt-0.5">Using category SVG fallback</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 col-span-2 md:col-span-1">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Visual Coverage</div>
              <div className="text-2xl font-black text-amber-950 mt-1">{metrics.coveragePct}%</div>
              <div className="text-[11px] text-amber-700 mt-0.5">High-fidelity photo readiness</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product, brand, or store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Source Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All Photos' },
              { id: 'AI_STUDIO', label: 'AI Studio' },
              { id: 'MERCHANT_UPLOAD', label: 'Merchant' },
              { id: 'MISSING', label: 'Missing' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSource(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSource === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Imagery Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Product Visual Container */}
              <div className="relative aspect-square bg-slate-50 flex items-center justify-center p-3 overflow-hidden group">
                <ImageWithFallback
                  src={p.imageUrl}
                  alt={p.name}
                  category={p.category}
                  aspectRatio="square"
                  objectFit="contain"
                  className="transition-transform duration-300 group-hover:scale-105"
                />

                {/* Provenance Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  {p.imageSource === 'AI_STUDIO' && (
                    <span className="bg-emerald-600/90 text-white backdrop-blur-xs text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      Studio Photo
                    </span>
                  )}
                  {p.imageSource === 'MERCHANT_UPLOAD' && (
                    <span className="bg-blue-600/90 text-white backdrop-blur-xs text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Camera className="w-2.5 h-2.5" />
                      Merchant Photo
                    </span>
                  )}
                  {p.imageSource === 'MISSING' && (
                    <span className="bg-rose-600/90 text-white backdrop-blur-xs text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Missing Image
                    </span>
                  )}
                </div>

                {/* Inspect Button on hover */}
                <button
                  onClick={() => setPreviewProduct(p)}
                  className="absolute bottom-2.5 right-2.5 z-10 bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Inspect High-Res Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Product Metadata */}
              <div className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600 truncate max-w-[140px]">{p.category}</span>
                  <span className="truncate max-w-[100px] flex items-center gap-0.5 text-slate-400">
                    <StoreIcon className="w-3 h-3" />
                    {p.store.name}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">{p.name}</h4>
                {p.brand && <div className="text-[11px] text-slate-500 font-medium">Brand: {p.brand}</div>}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 truncate font-mono">
                {p.imageUrl ? p.imageUrl.split('/').pop() : 'No image URL'}
              </span>
              <button
                onClick={() => {
                  setEditingProduct(p);
                  setCustomUrl(p.imageUrl || '');
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700">No products match your filters</h3>
          <p className="text-xs text-slate-400 mt-1">Try clearing search or choosing another category filter.</p>
        </div>
      )}

      {/* Edit Image Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Manage Product Imagery</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingProduct.name}</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Current Image Preview */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
                <ImageWithFallback
                  src={customUrl || editingProduct.imageUrl}
                  alt={editingProduct.name}
                  category={editingProduct.category}
                  aspectRatio="square"
                  objectFit="contain"
                />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-700">Live Preview</div>
                <div className="text-slate-500 break-all">{customUrl || 'Default SVG fallback will be used'}</div>
              </div>
            </div>

            {/* Presets Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Select AI Studio Preset
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                {PRESET_OPTIONS.map((preset) => (
                  <button
                    key={preset.url}
                    onClick={() => setCustomUrl(preset.url)}
                    type="button"
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all border ${
                      customUrl === preset.url
                        ? 'bg-amber-50 border-amber-300 font-bold text-amber-900'
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-7 h-7 object-contain rounded shrink-0 bg-white" />
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Custom Image URL or Path</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="/product-images/groceries/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdateImage(editingProduct.id, customUrl)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-xs disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Res Inspect Modal */}
      {previewProduct && (
        <div
          onClick={() => setPreviewProduct(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {previewProduct.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{previewProduct.name}</h3>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-4">
              <ImageWithFallback
                src={previewProduct.imageUrl}
                alt={previewProduct.name}
                category={previewProduct.category}
                aspectRatio="square"
                objectFit="contain"
                className="w-full h-full max-h-[400px]"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Source: <strong className="text-slate-800">{previewProduct.imageSource}</strong></span>
              <span>Store: <strong className="text-slate-800">{previewProduct.store.name}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
