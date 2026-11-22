import React from 'react';

interface ELLogoProps {
  variant?: 'dark' | 'light' | 'full' | 'icon';
  size?: number | string;
  className?: string;
  alt?: string;
}

export const ELLogo: React.FC<ELLogoProps> = ({
  variant = 'dark',
  size = 40,
  className = '',
  alt = 'Everything Local Monogram'
}) => {
  const src =
    variant === 'light'
      ? '/branding/logo-light.png'
      : variant === 'dark'
      ? '/branding/logo-dark.png'
      : variant === 'icon'
      ? '/branding/logo-icon.png'
      : '/branding/logo-full.png';

  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={src}
      alt={alt}
      style={{ width: dimension, height: dimension }}
      className={`object-contain shrink-0 select-none ${className}`}
      loading="eager"
    />
  );
};
