import React from 'react';
import { Store } from '../../types';
import { Star, Clock, MapPin, ChevronRight, Store as StoreIcon, ShieldCheck } from 'lucide-react';

export interface MerchantCardProps {
  store: Store;
  onSelect: (storeId: string) => void;
  className?: string;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({
  store,
  onSelect,
  className = ''
}) => {
  return (
    <div
      onClick={() => onSelect(store.id)}
      className={`group bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-card hover:border-amber-400 transition-all duration-200 cursor-pointer flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-base shrink-0 group-hover:scale-105 transition-transform">
            {store.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-amber-600 transition-colors">
                {store.name}
              </h3>
              {store.isVerified && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{store.addressLine}</p>

            <div className="flex items-center gap-2 text-xs font-bold mt-2">
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>4.8</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                {store.distanceKm !== undefined ? `${store.distanceKm.toFixed(1)} km` : 'Indore'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-forest-800 flex items-center gap-1 font-bold">
                <Clock className="w-3 h-3 text-forest-700" />
                <span>15-20 min</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Free Pickup
          </span>
          <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-800">
            Doorstep
          </span>
        </div>
        <span className="text-amber-600 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
          <span>Visit Store</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};
