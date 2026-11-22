import React from 'react';

export interface BrandLogoProps {
  variant?: 'horizontal' | 'symbol' | 'light' | 'dark' | 'monochrome';
  size?: 'small' | 'medium' | 'large' | number;
  showTagline?: boolean;
  className?: string;
  linkToHome?: boolean;
  onClick?: () => void;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  size = 'medium',
  showTagline = true,
  className = '',
  linkToHome = false,
  onClick,
  alt = 'Everything Local - Shop more. Save more. Live better.'
}) => {
  // Determine asset source based on variant
  let src = '/brand/everything-local-logo-horizontal.svg';

  if (variant === 'symbol') {
    src = '/brand/everything-local-symbol.svg';
  } else if (variant === 'dark') {
    src = '/brand/everything-local-logo-dark.svg';
  } else if (variant === 'light' || variant === 'horizontal') {
    src = '/brand/everything-local-logo-horizontal.svg';
  } else if (variant === 'monochrome') {
    src = '/brand/everything-local-monochrome.svg';
  }

  // Dimension mapping
  let heightClass = 'h-10';
  let inlineHeight = typeof size === 'number' ? size : undefined;

  if (typeof size === 'string') {
    if (variant === 'symbol') {
      switch (size) {
        case 'small':
          heightClass = 'h-7 w-auto';
          break;
        case 'medium':
          heightClass = 'h-10 w-auto';
          break;
        case 'large':
          heightClass = 'h-14 w-auto';
          break;
      }
    } else {
      switch (size) {
        case 'small':
          heightClass = 'h-8 w-auto max-w-[145px]';
          break;
        case 'medium':
          heightClass = 'h-10 w-auto max-w-[185px]';
          break;
        case 'large':
          heightClass = 'h-14 w-auto max-w-[250px]';
          break;
      }
    }
  }

  const imageElement = (
    <img
      src={src}
      alt={alt}
      style={inlineHeight ? { height: `${inlineHeight}px`, width: 'auto' } : undefined}
      className={`shrink-0 object-contain select-none transition-transform duration-200 ${heightClass} ${className}`}
      loading="eager"
    />
  );

  if (linkToHome) {
    return (
      <a
        href="/"
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        className="inline-flex items-center shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg group"
        title="Everything Local - Home"
      >
        {imageElement}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg border-0 bg-transparent p-0"
        title="Everything Local"
      >
        {imageElement}
      </button>
    );
  }

  return imageElement;
};

export default BrandLogo;
