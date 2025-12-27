import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children?: React.ReactNode;
  icon?: LucideIcon | React.ComponentType<any>;
  iconBgColor?: string;
  iconColor?: string;
  title?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  animationDelay?: number;
  href?: string;
  disabled?: boolean;
  [key: string]: any; // Allow additional props
}

const Card: React.FC<CardProps> = ({
  children,
  icon: IconComponent,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  title,
  description,
  onClick,
  className = '',
  animationDelay = 0,
  href,
  disabled = false,
  ...rest
}) => {
  // Check if this is a product card that should have animations
  const isProductCard = className.includes('product-card-animation');
  
  // Filter out animationDelay from rest props to avoid DOM warning
  const { animationDelay: _, ...domProps } = rest;
  
  const cardContent = (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-6 
        transition-all duration-300 cursor-pointer
        ${isProductCard ? 'hover:shadow-lg transform hover:scale-105 hover:-translate-y-2 active:scale-95 active:translate-y-0' : 'hover:shadow-md'}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{
        animationDelay: isProductCard ? `${animationDelay * 0.1}s` : undefined
      }}
      onClick={disabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      {...domProps}
    >
      {IconComponent && (
        <div className="flex items-center mb-4">
          <div className={`p-3 ${iconBgColor} rounded-xl transition-all duration-300 ${isProductCard ? 'transform hover:scale-110 hover:rotate-3 product-card-icon' : ''}`}>
            <IconComponent className={`h-6 w-6 ${iconColor} ${isProductCard ? 'transition-all duration-300' : ''}`} />
          </div>
        </div>
      )}
      
      {title && (
        <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${isProductCard ? 'transition-all duration-300 product-card-title' : ''}`}>
          {title}
        </h3>
      )}
      
      {description && (
        <p className={`text-sm text-gray-600 mb-4 ${isProductCard ? 'transition-all duration-300 product-card-description' : ''}`}>
          {description}
        </p>
      )}
      
      {children}
    </div>
  );

  if (href && !disabled) {
    return (
      <a href={href} className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

export default Card; 