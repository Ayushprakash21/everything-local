import React from 'react';
import { BrandLogo, BrandLogoProps } from './BrandLogo';

export interface ELLogoProps {
  variant?: 'dark' | 'light' | 'full' | 'icon' | 'horizontal' | 'symbol';
  size?: number | 'small' | 'medium' | 'large';
  className?: string;
  alt?: string;
  onClick?: () => void;
}

export const ELLogo: React.FC<ELLogoProps> = ({
  variant = 'horizontal',
  size = 40,
  className = '',
  alt = 'EveryBazaar',
  onClick
}) => {
  let mappedVariant: BrandLogoProps['variant'] = 'horizontal';
  if (variant === 'icon' || variant === 'symbol') {
    mappedVariant = 'symbol';
  } else if (variant === 'light') {
    mappedVariant = 'light';
  } else if (variant === 'dark') {
    mappedVariant = 'dark';
  } else {
    mappedVariant = 'horizontal';
  }

  return (
    <BrandLogo
      variant={mappedVariant}
      size={size}
      className={className}
      alt={alt}
      onClick={onClick}
    />
  );
};

export default ELLogo;
