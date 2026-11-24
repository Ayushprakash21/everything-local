import React, { useState, useEffect } from 'react';
import { ProductCategory } from '../../types';
import { request } from '../../api/client';
import { Sparkles, ArrowRight, Layers } from 'lucide-react';

interface HomepageCategoryGridProps {
  onSelectCategory: (category: ProductCategory) => void;
  selectedCategorySlug?: string | null;
}

// Visual theme tints for the 20 categories to give each tile a lively, delightful ambient look
const CATEGORY_PALETTES: Record<string, { bg: string; hoverBorder: string; badgeText: string }> = {
  'paan-corner': { bg: 'bg-emerald-50/80', hoverBorder: 'group-hover:border-emerald-400', badgeText: 'text-emerald-700' },
  'dairy-bread-eggs': { bg: 'bg-amber-50/80', hoverBorder: 'group-hover:border-amber-400', badgeText: 'text-amber-700' },
  'fruits-vegetables': { bg: 'bg-green-50/80', hoverBorder: 'group-hover:border-green-400', badgeText: 'text-green-700' },
  'cold-drinks-juices': { bg: 'bg-sky-50/80', hoverBorder: 'group-hover:border-sky-400', badgeText: 'text-sky-700' },
  'snacks-munchies': { bg: 'bg-orange-50/80', hoverBorder: 'group-hover:border-orange-400', badgeText: 'text-orange-700' },
  'breakfast-instant-food': { bg: 'bg-yellow-50/80', hoverBorder: 'group-hover:border-yellow-400', badgeText: 'text-yellow-700' },
  'sweet-tooth': { bg: 'bg-pink-50/80', hoverBorder: 'group-hover:border-pink-400', badgeText: 'text-pink-700' },
  'bakery-biscuits': { bg: 'bg-amber-50/90', hoverBorder: 'group-hover:border-amber-400', badgeText: 'text-amber-700' },
  'tea-coffee-milk-drinks': { bg: 'bg-amber-100/60', hoverBorder: 'group-hover:border-amber-500', badgeText: 'text-amber-800' },
  'atta-rice-dal': { bg: 'bg-stone-50/90', hoverBorder: 'group-hover:border-amber-400', badgeText: 'text-amber-700' },
  'masala-oil-more': { bg: 'bg-red-50/80', hoverBorder: 'group-hover:border-red-400', badgeText: 'text-red-700' },
  'sauces-spreads': { bg: 'bg-rose-50/80', hoverBorder: 'group-hover:border-rose-400', badgeText: 'text-rose-700' },
  'chicken-meat-fish': { bg: 'bg-red-100/60', hoverBorder: 'group-hover:border-red-400', badgeText: 'text-red-800' },
  'organic-healthy-living': { bg: 'bg-lime-50/90', hoverBorder: 'group-hover:border-lime-500', badgeText: 'text-lime-700' },
  'baby-care': { bg: 'bg-blue-50/80', hoverBorder: 'group-hover:border-blue-400', badgeText: 'text-blue-700' },
  'pharma-wellness': { bg: 'bg-rose-50/90', hoverBorder: 'group-hover:border-rose-400', badgeText: 'text-rose-700' },
  'cleaning-essentials': { bg: 'bg-teal-50/80', hoverBorder: 'group-hover:border-teal-400', badgeText: 'text-teal-700' },
  'home-office': { bg: 'bg-slate-100/80', hoverBorder: 'group-hover:border-slate-400', badgeText: 'text-slate-700' },
  'personal-care': { bg: 'bg-purple-50/80', hoverBorder: 'group-hover:border-purple-400', badgeText: 'text-purple-700' },
  'pet-care': { bg: 'bg-amber-50/70', hoverBorder: 'group-hover:border-amber-400', badgeText: 'text-amber-700' }
};

export const HomepageCategoryGrid: React.FC<HomepageCategoryGridProps> = ({
  onSelectCategory,
  selectedCategorySlug
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchCategories() {
      try {
        setLoading(true);
        const data = await request<{ categories: ProductCategory[] }>('/categories/homepage');
        if (mounted && data.categories) {
          setCategories(data.categories);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load categories');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCategories();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-slate-200/80 rounded-lg animate-pulse" />
        </div>
        {/* Skeleton Grid: 10 columns on desktop, 4 on mobile */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 gap-2.5 sm:gap-3.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-full aspect-square bg-slate-200/70 rounded-2xl animate-pulse mb-2" />
              <div className="h-3 w-14 bg-slate-200/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-4 sm:py-6" aria-label="Explore Categories">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5 sm:mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Explore by Category
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wide">
                20 Aisles
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
              Daily essentials, groceries, local Malwa snacks & fresh farm produce
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 transition-colors cursor-default">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span className="hidden md:inline">Rooted in Local</span>
        </div>
      </div>

      {/* Responsive Grid:
          - Desktop (lg, xl): Exactly 10 columns (2 rows of 10 = 20 total)
          - Tablet (md): 6 columns
          - Small Tablet (sm): 5 columns
          - Mobile: 4 columns, clean touch targets, zero overflow
      */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 gap-2 sm:gap-3 md:gap-3.5">
        {categories.map((cat) => {
          const isSelected = selectedCategorySlug === cat.slug;
          const palette = CATEGORY_PALETTES[cat.slug] || {
            bg: 'bg-slate-50',
            hoverBorder: 'group-hover:border-amber-400',
            badgeText: 'text-slate-700'
          };

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className={`group flex flex-col items-center focus:outline-none transition-all duration-200 text-center ${
                isSelected ? 'scale-105' : 'hover:-translate-y-0.5'
              }`}
              title={cat.name}
              aria-label={`View ${cat.name}`}
            >
              {/* Tile Container */}
              <div
                className={`w-full aspect-square rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 flex items-center justify-center transition-all duration-200 relative overflow-hidden border ${
                  isSelected
                    ? 'border-amber-500 bg-amber-100/70 shadow-md ring-2 ring-amber-400/50'
                    : `${palette.bg} border-slate-200/70 shadow-2xs ${palette.hoverBorder} group-hover:shadow-subtle`
                }`}
              >
                {/* Image */}
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-200 group-hover:scale-108"
                  onError={(e) => {
                    // Fallback to placeholder if asset fails
                    (e.currentTarget as HTMLImageElement).src = '/assets/categories/fruits-vegetables.svg';
                  }}
                />

                {/* Subcategory count pill on hover for desktop */}
                {cat.children && cat.children.length > 0 && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[9px] font-black text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block shadow-2xs">
                    {cat.children.length}
                  </span>
                )}
              </div>

              {/* Category Name */}
              <span
                className={`mt-1.5 text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 px-0.5 transition-colors ${
                  isSelected
                    ? 'text-amber-800 font-extrabold'
                    : 'text-slate-700 group-hover:text-slate-950'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
