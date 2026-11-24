import React, { useState } from 'react';

export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  category?: string;
  fallbackSrc?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  objectFit?: 'contain' | 'cover' | 'fill';
  className?: string;
  containerClassName?: string;
}

/**
 * Resolves appropriate realistic photographic image based on product name and category.
 * Prevents cartoon illustrations and incorrect product cross-mapping.
 */
export function getCategoryFallbackAsset(category?: string, name?: string): string {
  const query = `${name || ''} ${category || ''}`.toLowerCase().trim();

  // 1. High-precision product keyword matching to genuine photographs
  if (query.includes('mustard oil') || query.includes('sunflower oil') || query.includes('edible oil') || query.includes('cooking oil')) {
    return '/product-images/groceries/mustard-oil.webp';
  }
  if (query.includes('ghee')) {
    return '/product-images/groceries/cow-ghee.webp';
  }
  if (query.includes('sugar') || query.includes('cheeni')) {
    return '/product-images/groceries/refined-white-sugar.webp';
  }
  if (query.includes('atta') || query.includes('flour') || query.includes('wheat')) {
    return '/product-images/groceries/sharbati-wheat-atta.webp';
  }
  if (query.includes('basmati') || query.includes('rice') || query.includes('chawal')) {
    return '/product-images/groceries/india-gate-basmati-rice.webp';
  }
  if (query.includes('toor dal') || query.includes('arhar')) {
    return '/product-images/groceries/toor-dal.webp';
  }
  if (query.includes('moong dal')) {
    return '/product-images/groceries/moong-dal.webp';
  }
  if (query.includes('chana dal')) {
    return '/product-images/groceries/chana-dal.webp';
  }
  if (query.includes('masoor dal')) {
    return '/product-images/groceries/masoor-dal.webp';
  }
  if (query.includes('rajma')) {
    return '/product-images/groceries/rajma.webp';
  }
  if (query.includes('dal') || query.includes('pulse')) {
    return '/product-images/groceries/toor-dal.webp';
  }
  if (query.includes('poha')) {
    return '/product-images/groceries/indori-poha.webp';
  }
  if (query.includes('sooji') || query.includes('rava')) {
    return '/product-images/groceries/sooji-rava.webp';
  }
  if (query.includes('besan')) {
    return '/product-images/groceries/besan.webp';
  }
  if (query.includes('salt') || query.includes('namak')) {
    return '/product-images/groceries/tata-salt.webp';
  }
  if (query.includes('tea') || query.includes('chai')) {
    return '/product-images/groceries/tata-tea.webp';
  }
  if (query.includes('milk') || query.includes('doodh')) {
    return '/product-images/dairy-bakery/sanchi-gold-milk.webp';
  }
  if (query.includes('bread') || query.includes('bun') || query.includes('pav')) {
    return '/product-images/dairy-bakery/fresh-whole-wheat-bread.webp';
  }
  if (query.includes('butter') || query.includes('makhan')) {
    return '/product-images/dairy-bakery/amul-butter.webp';
  }
  if (query.includes('paneer')) {
    return '/product-images/dairy-bakery/fresh-paneer.webp';
  }
  if (query.includes('egg') || query.includes('anda')) {
    return '/product-images/dairy-bakery/farm-eggs.webp';
  }
  if (query.includes('sev') || query.includes('namkeen')) {
    return '/product-images/snacks-beverages/indori-sev.webp';
  }
  if (query.includes('mango') || query.includes('aam')) {
    return '/product-images/fruits-vegetables/alphonso-mangoes.webp';
  }
  if (query.includes('banana') || query.includes('kela')) {
    return '/product-images/fruits-vegetables/fresh-bananas.webp';
  }
  if (query.includes('potato') || query.includes('aloo')) {
    return '/product-images/fruits-vegetables/fresh-malwa-potatoes.webp';
  }
  if (query.includes('turmeric') || query.includes('haldi')) {
    return '/product-images/groceries/turmeric-powder.webp';
  }
  if (query.includes('chilli') || query.includes('mirchi')) {
    return '/product-images/groceries/red-chilli-powder.webp';
  }
  if (query.includes('cumin') || query.includes('jeera')) {
    return '/product-images/groceries/cumin-seeds.webp';
  }

  // 2. Realistic photographic category fallback mappings
  const cat = (category || '').toLowerCase().trim();
  if (cat.includes('fruit') || cat.includes('veg') || cat.includes('produce') || cat.includes('mandi') || cat.includes('organic')) {
    return '/category-images/fruits-vegetables.webp';
  }
  if (cat.includes('dairy') || cat.includes('bread') || cat.includes('milk') || cat.includes('bakery') || cat.includes('butter') || cat.includes('paneer') || cat.includes('curd')) {
    return '/category-images/dairy-bread-eggs.webp';
  }
  if (cat.includes('oil') || cat.includes('ghee')) {
    return '/product-images/groceries/mustard-oil.webp';
  }
  if (cat.includes('snack') || cat.includes('drink') || cat.includes('beverage') || cat.includes('biscuit') || cat.includes('namkeen') || cat.includes('sweet')) {
    return '/category-images/bakery-biscuits.webp';
  }
  if (cat.includes('personal') || cat.includes('hygiene') || cat.includes('beauty') || cat.includes('skin') || cat.includes('hair') || cat.includes('soap')) {
    return '/category-images/beauty-personal-care.webp';
  }
  if (cat.includes('clean') || cat.includes('detergent') || cat.includes('dishwash') || cat.includes('disinfectant')) {
    return '/category-images/cleaning-essentials.webp';
  }
  if (cat.includes('med') || cat.includes('pharma') || cat.includes('health') || cat.includes('rx') || cat.includes('pill') || cat.includes('first aid')) {
    return '/category-images/pharmacy-wellness.webp';
  }
  if (cat.includes('elect') || cat.includes('appliance') || cat.includes('cable') || cat.includes('battery')) {
    return '/category-images/electronics-electrical.webp';
  }
  if (cat.includes('paan') || cat.includes('supari')) {
    return '/category-images/paan-corner.webp';
  }
  if (cat.includes('grocery') || cat.includes('staple') || cat.includes('atta') || cat.includes('grain')) {
    return '/category-images/grocery-daily-essentials.webp';
  }

  return '/brand/everybazaar-badge.webp';
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  category = 'General',
  fallbackSrc,
  aspectRatio = 'square',
  objectFit = 'contain',
  className = '',
  containerClassName = '',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fallback = fallbackSrc || getCategoryFallbackAsset(category, alt);
  const activeSrc = !hasError && src && src.trim() !== '' ? src : fallback;
  const isUsingFallback = hasError || !src || src.trim() === '';

  const ratioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: ''
  }[aspectRatio];

  const fitClass = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill'
  }[objectFit];

  return (
    <div
      className={`relative overflow-hidden w-full bg-slate-50 flex items-center justify-center ${ratioClasses} ${containerClassName}`}
    >
      {/* Loading Skeleton Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
      )}

      {/* Rendered Image */}
      <img
        src={activeSrc}
        alt={alt || `${category} product`}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setIsLoading(false);
          }
        }}
        className={`w-full h-full transition-all duration-300 ${fitClass} ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        } ${isUsingFallback ? 'p-1' : ''} ${className}`}
        {...rest}
      />
    </div>
  );
};
