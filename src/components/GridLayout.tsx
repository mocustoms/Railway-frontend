import React from 'react';

interface GridLayoutProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 4 | 6 | 8;
  className?: string;
}

const GridLayout: React.FC<GridLayoutProps> = ({ 
  children, 
  cols = 4, 
  gap = 6, 
  className = '' 
}) => {
  const getGridCols = (cols: number) => {
    switch (cols) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-4';
      case 5:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
      case 6:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  const getGap = (gap: number) => {
    switch (gap) {
      case 4:
        return 'gap-4';
      case 6:
        return 'gap-6';
      case 8:
        return 'gap-8';
      default:
        return 'gap-6';
    }
  };

  return (
    <div className={`grid ${getGridCols(cols)} ${getGap(gap)} ${className} product-grid-animation`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          // Only pass animationDelay to Card components, not to DOM elements
          const childProps = { ...(child.props as any) };
          if (child.type && typeof child.type === 'function' && child.type.name === 'Card') {
            childProps.animationDelay = index;
          }
          return React.cloneElement(child, childProps);
        }
        return child;
      })}
    </div>
  );
};

export default GridLayout; 