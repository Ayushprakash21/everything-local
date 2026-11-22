import React from 'react';
import { Product } from '../types';
import { formatPaise } from '../api/client';
import { Plus, Minus, Check, ShoppingBag, Store as StoreIcon, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  storeName?: string;
  storeDistance?: string;
  onAddToCart: (storeId: string, productId: string) => void;
  onSelectProduct?: (product: Product) => void;
  currentQuantity?: number;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeName,
  storeDistance,
  onAddToCart,
  onSelectProduct,
  currentQuantity = 0,
  onUpdateQuantity
}) => {
  const hasDiscount = product.mrpPaise && product.mrpPaise > product.pricePaise;
  const discountPercent = hasDiscount
    ? Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100)
    : 0;
  const savingsPaise = hasDiscount ? product.mrpPaise - product.pricePaise : 0;

  // Extract or synthesize pack size if not explicitly set
  const packSize = product.packageSize || product.name.match(/\d+\s*(?:kg|g|gm|l|ltr|ml|pack|pcs|pieces)/i)?.[0] || 'Standard';

  // Category-based icon or fallback styling
  const getCategoryFallbackGradient = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('fruit') || cat.includes('veg') || cat.includes('produce')) {
      return 'from-emerald-50 via-green-50 to-emerald-100 text-emerald-600';
    }
    if (cat.includes('dairy') || cat.includes('bakery') || cat.includes('milk') || cat.includes('bread')) {
      return 'from-amber-50 via-yellow-50 to-amber-100 text-amber-600';
    }
    if (cat.includes('oil') || cat.includes('atta') || cat.includes('grain') || cat.includes('staple')) {
      return 'from-orange-50 via-amber-50 to-yellow-100 text-orange-600';
    }
    return 'from-slate-50 via-stone-50 to-amber-50 text-emerald-700';
  };

  return (
    <div
      onClick={() => onSelectProduct && onSelectProduct(product)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400/80 shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Top Media Area */}
      <div className="relative pt-[85%] w-full overflow-hidden bg-slate-50">
        {/* Discount Badge */}
        {hasDiscount && discountPercent > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-amber-500 text-slate-900 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{discountPercent}% OFF</span>
          </div>
        )}

        {/* Store Tag */}
        {storeName && (
          <div className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-xs text-slate-700 border border-slate-200/60 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1 max-w-[120px] truncate">
            <StoreIcon className="w-2.5 h-2.5 text-forest-800 shrink-0" />
            <span className="truncate">{storeName}</span>
          </div>
        )}

        {/* Product Image or Rich Fallback */}
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide broken image and let fallback render
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className={`absolute inset-0 w-full h-full bg-gradient-to-br ${getCategoryFallbackGradient(
              product.category
            )} flex flex-col items-center justify-center p-3 text-center`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/80 shadow-xs flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6 opacity-75" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
              {product.category}
            </span>
          </div>
        )}

        {/* Pack Size Pill */}
        <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
          {packSize}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5 bg-white">
        <div>
          {/* Brand & Category row */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
            <span className="font-semibold text-slate-600 truncate max-w-[130px]">
              {product.brand || product.category}
            </span>
            {storeDistance && (
              <span className="text-[10px] text-forest-800 font-bold shrink-0">
                {storeDistance}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-forest-900 transition-colors">
            {product.name}
          </h4>
        </div>

        {/* Pricing and Cart Stepper */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Prices */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                {formatPaise(product.pricePaise)}
              </span>
              {hasDiscount && (
                <span className="text-[11px] text-slate-400 line-through">
                  {formatPaise(product.mrpPaise)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="text-[10px] font-bold text-forest-700 block">
                Save {formatPaise(savingsPaise)}
              </span>
            )}
          </div>

          {/* Add / Stepper Button */}
          <div onClick={(e) => e.stopPropagation()}>
            {currentQuantity > 0 ? (
              <div className="flex items-center bg-forest-900 text-white rounded-xl shadow-xs px-1.5 py-1 text-xs font-bold gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateQuantity
                      ? onUpdateQuantity(product.id, currentQuantity - 1)
                      : onAddToCart(product.storeId, product.id)
                  }
                  className="w-5 h-5 rounded-md hover:bg-forest-800 flex items-center justify-center transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="min-w-[16px] text-center text-xs font-black">
                  {currentQuantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateQuantity
                      ? onUpdateQuantity(product.id, currentQuantity + 1)
                      : onAddToCart(product.storeId, product.id)
                  }
                  className="w-5 h-5 rounded-md hover:bg-forest-800 flex items-center justify-center transition"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(product.storeId, product.id)}
                className="px-3.5 py-1.5 bg-forest-50 hover:bg-forest-900 text-forest-900 hover:text-white border border-forest-600/50 hover:border-forest-900 rounded-xl text-xs font-extrabold transition-all duration-150 shadow-2xs hover:shadow-xs flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
