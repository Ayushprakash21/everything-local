import React from 'react';
import { Product, Store } from '../types';
import { formatPaise } from '../api/client';
import { useCart } from '../context/CartContext';
import { QuantityStepper } from './QuantityStepper';
import { ImageWithFallback } from './common/ImageWithFallback';
import {
  X,
  ShoppingBag,
  Store as StoreIcon,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  store?: Store;
  onClose: () => void;
  onAddToCart?: (storeId: string, productId: string) => void;
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
  currentQuantity: propCurrentQuantity,
  onUpdateQuantity: propOnUpdateQuantity,
  similarProducts = [],
  onSelectSimilarProduct
}) => {
  if (!product) return null;

  const { getItemQuantity, addItem, updateQuantity } = useCart();
  const quantity = propCurrentQuantity !== undefined ? propCurrentQuantity : getItemQuantity(product.id);

  const hasDiscount = product.mrpPaise && product.mrpPaise > product.pricePaise;
  const discountPercent = hasDiscount
    ? Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100)
    : 0;
  const savingsPaise = hasDiscount ? product.mrpPaise - product.pricePaise : 0;
  const packSize = product.packageSize || product.name.match(/\d+\s*(?:kg|g|gm|l|ltr|ml|pack|pcs|pieces)/i)?.[0] || 'Standard Pack';

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product.storeId, product.id);
    } else {
      addItem(product.storeId, product.id, 1);
    }
  };

  const handleIncrement = () => {
    if (propOnUpdateQuantity) {
      propOnUpdateQuantity(product.id, quantity + 1);
    } else {
      updateQuantity(product.id, quantity + 1, product.storeId);
    }
  };

  const handleDecrement = () => {
    if (propOnUpdateQuantity) {
      propOnUpdateQuantity(product.id, quantity - 1);
    } else {
      updateQuantity(product.id, quantity - 1, product.storeId);
    }
  };

  const isOutOfStock = !product.isAvailable || (product.stock !== undefined && product.stock !== null && product.stock === 0);

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
                <div className="absolute top-3 left-3 z-10 bg-amber-500 text-slate-900 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{discountPercent}% OFF</span>
                </div>
              )}
              <ImageWithFallback
                src={product.imageUrl}
                alt={product.name}
                category={product.category}
                aspectRatio="square"
                objectFit="contain"
                className="w-full h-full p-2"
              />
            </div>

            {/* Title & Pricing */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {product.brand || product.category}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {product.name}
                </h3>
                <div className="inline-block bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                  {packSize}
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {formatPaise(product.pricePaise)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatPaise(product.mrpPaise)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <span className="text-xs font-bold text-forest-700 block">
                    You save {formatPaise(savingsPaise)} ({discountPercent}% discount)
                  </span>
                )}
                <span className="text-[10px] text-slate-400 block">Inclusive of all taxes</span>
              </div>

              {/* Stock / Fulfillment Info */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold">Stock Availability:</span>
                  {!isOutOfStock ? (
                    <span className="font-bold text-forest-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In Stock {product.stock > 0 ? `(${product.stock} units)` : ''}
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
                  <span>15-20 min neighborhood delivery or ₹0 store pickup</span>
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
                      <QuantityStepper
                        quantity={getItemQuantity(item.id)}
                        onAdd={() => addItem(item.storeId, item.id, 1)}
                        onIncrement={() => updateQuantity(item.id, getItemQuantity(item.id) + 1, item.storeId)}
                        onDecrement={() => updateQuantity(item.id, getItemQuantity(item.id) - 1, item.storeId)}
                        disabled={!item.isAvailable || item.stock === 0}
                      />
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
            <span className="text-[11px] text-slate-400 font-semibold block">
              {quantity > 0 ? `Subtotal (${quantity} items)` : 'Unit Price'}
            </span>
            <span className="text-lg font-black text-slate-900">
              {formatPaise(product.pricePaise * (quantity > 0 ? quantity : 1))}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <QuantityStepper
              quantity={quantity}
              onAdd={handleAdd}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              disabled={isOutOfStock}
              maxStock={product.stock > 0 ? product.stock : undefined}
              className="scale-110"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
