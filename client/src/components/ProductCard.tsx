import React from 'react';
import { Product } from '../types';
import { formatPaise } from '../api/client';
import { useCart } from '../context/CartContext';
import { QuantityStepper } from './QuantityStepper';
import { ImageWithFallback } from './common/ImageWithFallback';
import { Store as StoreIcon, Sparkles, Clock, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  storeName?: string;
  storeDistance?: string;
  deliveryEta?: string;
  onAddToCart?: (storeId: string, productId: string) => void;
  onSelectProduct?: (product: Product) => void;
  currentQuantity?: number;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeName,
  storeDistance,
  deliveryEta = '15-20 min',
  onAddToCart,
  onSelectProduct,
  currentQuantity: propCurrentQuantity,
  onUpdateQuantity: propOnUpdateQuantity
}) => {
  const { getItemQuantity, addItem, updateQuantity } = useCart();
  const currentQuantity = propCurrentQuantity !== undefined ? propCurrentQuantity : getItemQuantity(product.id);

  const hasDiscount = Boolean(product.mrpPaise && product.mrpPaise > product.pricePaise);
  const discountPercent = hasDiscount && product.mrpPaise
    ? Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100)
    : 0;
  const savingsPaise = hasDiscount && product.mrpPaise ? product.mrpPaise - product.pricePaise : 0;

  // Extract or synthesize pack size if not explicitly set
  const packSize = product.packageSize || product.name.match(/\d+\s*(?:kg|g|gm|l|ltr|ml|pack|pcs|pieces)/i)?.[0] || 'Standard Pack';

  const isOutOfStock = !product.isAvailable || (product.stock !== undefined && product.stock !== null && product.stock === 0);

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product.storeId, product.id);
    } else {
      addItem(product.storeId, product.id, 1);
    }
  };

  const handleIncrement = () => {
    if (propOnUpdateQuantity) {
      propOnUpdateQuantity(product.id, currentQuantity + 1);
    } else {
      updateQuantity(product.id, currentQuantity + 1, product.storeId);
    }
  };

  const handleDecrement = () => {
    if (propOnUpdateQuantity) {
      propOnUpdateQuantity(product.id, currentQuantity - 1);
    } else {
      updateQuantity(product.id, currentQuantity - 1, product.storeId);
    }
  };

  return (
    <div
      onClick={() => onSelectProduct && onSelectProduct(product)}
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer h-full"
    >
      {/* 1. Standardized 1:1 Aspect Ratio Media Box */}
      <div className="relative w-full aspect-square bg-slate-50 overflow-hidden flex items-center justify-center">
        {/* Discount Badge */}
        {hasDiscount && discountPercent > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{discountPercent}% OFF</span>
          </div>
        )}

        {/* Store Tag */}
        {storeName && (
          <div className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-xs text-slate-700 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1 max-w-[110px] truncate">
            <StoreIcon className="w-2.5 h-2.5 text-forest-700 shrink-0" />
            <span className="truncate">{storeName}</span>
          </div>
        )}

        {/* Reusable Image with Category Vector Fallback */}
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          category={product.category}
          aspectRatio="square"
          objectFit="contain"
          className="p-3 group-hover:scale-105 transition-transform duration-300"
        />

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 text-center">
            <div className="bg-white/95 text-rose-700 text-xs font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Out of Stock</span>
            </div>
          </div>
        )}

        {/* Pack Size / ETA Footer Pill */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md truncate max-w-[65%]">
            {packSize}
          </span>
          <span className="bg-white/90 backdrop-blur-xs text-forest-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
            <Clock className="w-2.5 h-2.5" />
            <span>{deliveryEta}</span>
          </span>
        </div>
      </div>

      {/* 2. Structured Content Block with Clamped Heights */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2 bg-white">
        <div>
          {/* Brand & Store Distance */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-semibold text-slate-600 truncate max-w-[120px]">
              {product.brand || product.category}
            </span>
            {storeDistance && (
              <span className="text-[10px] text-forest-700 font-bold shrink-0">
                {storeDistance}
              </span>
            )}
          </div>

          {/* Clamped 2-Line Product Title */}
          <h4
            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 h-9 sm:h-10 leading-snug group-hover:text-forest-900 transition-colors"
            title={product.name}
          >
            {product.name}
          </h4>
        </div>

        {/* 3. Pricing and Add to Cart Stepper */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 min-h-[38px]">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                {formatPaise(product.pricePaise)}
              </span>
              {hasDiscount && (
                <span className="text-[11px] text-slate-400 line-through">
                  {formatPaise(product.mrpPaise!)}
                </span>
              )}
            </div>
            {hasDiscount && savingsPaise > 0 && (
              <span className="text-[10px] font-bold text-forest-700 block">
                Save {formatPaise(savingsPaise)}
              </span>
            )}
          </div>

          {/* Quantity Stepper */}
          <div onClick={(e) => e.stopPropagation()}>
            <QuantityStepper
              quantity={currentQuantity}
              onAdd={handleAdd}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              disabled={isOutOfStock}
              maxStock={product.stock > 0 ? product.stock : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
