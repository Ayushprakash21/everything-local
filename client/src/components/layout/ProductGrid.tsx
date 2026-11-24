import React from 'react';

export interface ProductGridProps {
  children: React.ReactNode;
  columns?: 'standard' | 'dense' | 'wide';
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  children,
  columns = 'standard',
  className = ''
}) => {
  const columnClasses = {
    standard: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    dense: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    wide: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
  }[columns];

  return (
    <div className={`grid ${columnClasses} gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
};
