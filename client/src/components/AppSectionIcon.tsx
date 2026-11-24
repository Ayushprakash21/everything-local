import React from 'react';

export type AppSection = 'shop' | 'pharmacy' | 'services' | 'delivery' | 'merchant' | 'admin';

export interface AppSectionIconProps {
  section: AppSection;
  size?: number | 'small' | 'medium' | 'large';
  className?: string;
  alt?: string;
}

export const AppSectionIcon: React.FC<AppSectionIconProps> = ({
  section,
  size = 'medium',
  className = '',
  alt
}) => {
  const iconMap: Record<AppSection, { src: string; defaultAlt: string }> = {
    shop: { src: '/brand/app-icon-shop.svg', defaultAlt: 'Shop (Customer)' },
    pharmacy: { src: '/brand/app-icon-pharmacy.svg', defaultAlt: 'Pharmacy & Medical' },
    services: { src: '/brand/app-icon-services.svg', defaultAlt: 'Local Services' },
    delivery: { src: '/brand/app-icon-delivery.svg', defaultAlt: 'Delivery Partner (Rider)' },
    merchant: { src: '/brand/app-icon-merchant.svg', defaultAlt: 'Merchant Portal' },
    admin: { src: '/brand/app-icon-admin.svg', defaultAlt: 'Admin Console' }
  };

  const item = iconMap[section] || iconMap.shop;

  let dimensionClass = 'w-6 h-6';
  let inlineStyle: React.CSSProperties | undefined = undefined;

  if (typeof size === 'number') {
    inlineStyle = { width: `${size}px`, height: `${size}px` };
  } else {
    switch (size) {
      case 'small':
        dimensionClass = 'w-5 h-5';
        break;
      case 'medium':
        dimensionClass = 'w-7 h-7';
        break;
      case 'large':
        dimensionClass = 'w-10 h-10';
        break;
    }
  }

  return (
    <img
      src={item.src}
      alt={alt || item.defaultAlt}
      style={inlineStyle}
      className={`shrink-0 rounded-lg shadow-2xs select-none object-contain ${dimensionClass} ${className}`}
      loading="lazy"
    />
  );
};

export default AppSectionIcon;
