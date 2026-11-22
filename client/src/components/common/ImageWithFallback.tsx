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
 * Resolves appropriate category SVG illustration based on category name or keywords
 */
export function getCategoryFallbackAsset(category?: string): string {
  if (!category) return '/assets/categories/household.svg';
  const cat = category.toLowerCase().trim();

  if (cat.includes('fruit') || cat.includes('veg') || cat.includes('produce') || cat.includes('mandi') || cat.includes('organic')) {
    return '/assets/categories/fruits-vegetables.svg';
  }
  if (cat.includes('dairy') || cat.includes('bread') || cat.includes('milk') || cat.includes('bakery') || cat.includes('butter') || cat.includes('paneer') || cat.includes('curd')) {
    return '/assets/categories/dairy-bread.svg';
  }
  if (cat.includes('atta') || cat.includes('dal') || cat.includes('flour') || cat.includes('grain') || cat.includes('rice') || cat.includes('staple') || cat.includes('pulse')) {
    return '/assets/categories/atta-dal.svg';
  }
  if (cat.includes('oil') || cat.includes('ghee') || cat.includes('mustard') || cat.includes('sunflower') || cat.includes('cooking oil')) {
    return '/assets/categories/oil-ghee.svg';
  }
  if (cat.includes('snack') || cat.includes('drink') || cat.includes('beverage') || cat.includes('biscuit') || cat.includes('namkeen') || cat.includes('chips') || cat.includes('sweet') || cat.includes('tea') || cat.includes('coffee')) {
    return '/assets/categories/snacks-drinks.svg';
  }
  if (cat.includes('personal') || cat.includes('hygiene') || cat.includes('beauty') || cat.includes('skin') || cat.includes('hair') || cat.includes('soap') || cat.includes('shampoo')) {
    return '/assets/categories/personal-care.svg';
  }
  if (cat.includes('clean') || cat.includes('detergent') || cat.includes('dishwash') || cat.includes('disinfectant') || cat.includes('wash')) {
    return '/assets/categories/cleaning.svg';
  }
  if (cat.includes('med') || cat.includes('pharma') || cat.includes('health') || cat.includes('rx') || cat.includes('pill') || cat.includes('doctor') || cat.includes('first aid')) {
    return '/assets/categories/medicines.svg';
  }
  if (cat.includes('elect') || cat.includes('appliance') || cat.includes('cable') || cat.includes('battery') || cat.includes('bulb') || cat.includes('light')) {
    return '/assets/categories/electronics.svg';
  }
  if (cat.includes('stat') || cat.includes('book') || cat.includes('pen') || cat.includes('office') || cat.includes('school')) {
    return '/assets/categories/stationery.svg';
  }
  if (cat.includes('pet') || cat.includes('dog') || cat.includes('cat') || cat.includes('animal')) {
    return '/assets/categories/pet-care.svg';
  }

  return '/assets/categories/household.svg';
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

  const fallback = fallbackSrc || getCategoryFallbackAsset(category);
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
        } ${isUsingFallback ? 'p-2' : ''} ${className}`}
        {...rest}
      />
    </div>
  );
};
