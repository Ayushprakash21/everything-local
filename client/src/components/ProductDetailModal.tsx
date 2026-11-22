import React, { useState } from 'react';
import { Product, Store } from '../types';
import { formatPaise } from '../api/client';
import {
  X,
  ShoppingBag,
  Store as StoreIcon,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  store?: Store;
  onClose: () => void;
  onAddToCart: (storeId: string, productId: string) => void;
  currentQuantity?: number;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  similarProducts?: Product[];
  onSelectSimilarProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  store,
  onClose,
  onAddToCart,
  currentQuantity = 0,
  onUpdateQuantity,
  similarProducts = [],
  onSelectSimilarProduct
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState<number>(currentQuantity > 0 ? currentQuantity : 1);

  const hasDiscount = product.mrpPaise && product.mrpPaise > product.pricePaise;
  const discountPercent = hasDiscount
    ? Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100)
    : 0;
  const savingsPaise = hasDiscount ? product.mrpPaise - product.pricePaise : 0;
  const packSize = product.packageSize || product.name.match(/\d+\s*(?:kg|g|gm|l|ltr|ml|pack|pcs|pieces)/i)?.[0] || 'Standard Pack';

  const handleAdd = () => {
    onAddToCart(product.storeId, product.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-float overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
              {product.category}
            </span>
            {store && (
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <StoreIcon className="w-3.5 h-3.5 text-forest-700" />
                {store.name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Main Visual & Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-4">
              {hasDiscount && discountPercent > 0 && (
                <div className="absolute top-3 left-3 bg-amber-500 text-slate-900 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{discountPercent}% OFF</span>
                </div>
              )}
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <ShoppingBag className="w-16 h-16 mb-2 opacity-50" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {product.category}
                  </span>
                </div>
              )}
            </div>

            {/* Product Meta */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                {product.brand && (
                  <span className="text-xs font-bold text-forest-800 tracking-wide uppercase">
                    {product.brand}
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {product.name}
                </h2>
                <div className="inline-block bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md">
                  Pack Size: {packSize}
                </div>

                {/* Pricing Box */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">
                      {formatPaise(product.pricePaise)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-slate-400 line-through">
                        MRP {formatPaise(product.mrpPaise)}
                      </span>
                    )}
                  </div>
                  {hasDiscount && (
                    <p className="text-xs font-bold text-forest-700 mt-0.5">
                      You Save {formatPaise(savingsPaise)} ({discountPercent}% Discount)
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-0.5">Inclusive of all local taxes</p>
                </div>
              </div>

              {/* Availability & Store Info */}
              <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold">Stock Status:</span>
                  {product.stock > 0 ? (
                    <span className="font-bold text-forest-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In Stock ({product.stock} units)
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Out of stock
                    </span>
                  )}
                </div>

                {store && (
                  <>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold">Fulfilled by:</span>
                      <span className="font-bold text-slate-800">{store.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold">Neighbourhood:</span>
                      <span className="text-slate-700">{store.addressLine}</span>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-forest-800 font-semibold text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>30-min neighborhood delivery or ₹0 store pickup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Product Details
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                More from this Store
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {similarProducts.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectSimilarProduct && onSelectSimilarProduct(item)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 cursor-pointer bg-slate-50/50 hover:bg-white transition flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-black text-slate-900">
                        {formatPaise(item.pricePaise)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item.storeId, item.id);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold bg-forest-50 text-forest-900 border border-forest-600 rounded-md hover:bg-forest-900 hover:text-white transition"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-white flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Item Total</span>
            <span className="text-lg font-black text-slate-900">
              {formatPaise(product.pricePaise)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleAdd();
                onClose();
              }}
              className="px-6 py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
