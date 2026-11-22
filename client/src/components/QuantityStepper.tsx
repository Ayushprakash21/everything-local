import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  maxStock?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  disabled = false,
  maxStock,
  size = 'md',
  className = ''
}) => {
  if (disabled) {
    return (
      <div className={`inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 font-bold text-[11px] px-2.5 py-1.5 border border-slate-200 select-none cursor-not-allowed ${className}`}>
        Out of Stock
      </div>
    );
  }

  // Initial State: Quantity is 0 -> Display ADD button
  if (quantity <= 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className={`w-[78px] h-8 inline-flex items-center justify-center gap-1 bg-white hover:bg-forest-900 text-forest-800 hover:text-white border-1.5 border-forest-600/70 hover:border-forest-900 rounded-xl text-xs font-black shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-150 select-none cursor-pointer ${className}`}
        aria-label="Add item to cart"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>ADD</span>
      </button>
    );
  }

  // Active State: Quantity >= 1 -> Display [ - ] [ qty ] [ + ]
  const isMaxReached = maxStock !== undefined && quantity >= maxStock;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-[78px] h-8 inline-flex items-center justify-between bg-forest-900 text-white rounded-xl shadow-xs overflow-hidden select-none border border-forest-800 ${className}`}
    >
      {/* Minus Button */}
      <button
        type="button"
        onClick={onDecrement}
        className="w-6 h-full flex items-center justify-center text-white/90 hover:text-white hover:bg-forest-800/80 active:bg-forest-700 transition cursor-pointer"
        aria-label="Decrease quantity"
        title="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      {/* Quantity Display */}
      <span className="flex-1 text-center text-xs font-black text-amber-300 tabular-nums">
        {quantity}
      </span>

      {/* Plus Button */}
      <button
        type="button"
        disabled={isMaxReached}
        onClick={onIncrement}
        className={`w-6 h-full flex items-center justify-center text-white/90 hover:text-white hover:bg-forest-800/80 active:bg-forest-700 transition cursor-pointer ${
          isMaxReached ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        aria-label="Increase quantity"
        title={isMaxReached ? `Only ${maxStock} items available` : 'Increase quantity'}
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
};
