import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
  className = ''
}) => {
  return (
    <div
      className={`bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center max-w-lg mx-auto my-8 ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4">
        {icon || <ShoppingBag className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-sm">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
