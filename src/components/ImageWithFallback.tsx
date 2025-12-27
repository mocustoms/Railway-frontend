import React, { useState, useEffect } from 'react';
import { Package, User, Building2, Tag, Factory } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  module: 'products' | 'sales-agents' | 'product-brand-names' | 'product-manufacturers' | 'users' | 'companies';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: 'package' | 'user' | 'building' | 'tag' | 'factory';
  showLoadingState?: boolean;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  module,
  size = 'md',
  className = '',
  fallbackIcon = 'package',
  showLoadingState = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  // Fallback icons
  const fallbackIcons = {
    package: Package,
    user: User,
    building: Building2,
    tag: Tag,
    factory: Factory
  };

  const FallbackIcon = fallbackIcons[fallbackIcon];

  // Generate image URL when src changes
  useEffect(() => {
    if (src && src.trim() !== '') {
      const url = getImageUrl(src, module);
      // Only update if URL has actually changed
      setImageUrl(prevUrl => {
        if (prevUrl !== url) {
          setImageError(false);
          setImageLoaded(false);
          return url;
        }
        return prevUrl;
      });
    } else {
      setImageUrl('');
      setImageError(true);
      setImageLoaded(false);
    }
  }, [src, module]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    // Don't clear imageUrl immediately - keep it to prevent flickering
    // Only clear if we retry
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false); // Reset error state on successful load
  };

  // Show fallback if no src, error occurred, or imageUrl is empty/invalid
  if (!src || src.trim() === '' || imageError || !imageUrl || imageUrl.trim() === '') {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center ${className}`}>
        <FallbackIcon className={`${iconSizes[size]} text-gray-400`} />
      </div>
    );
  }

  return (
    <div className={`relative ${className ? '' : sizeClasses[size]}`} style={className ? { width: '100%', height: '100%' } : undefined}>
      {/* Loading placeholder */}
      {showLoadingState && !imageLoaded && (
        <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center absolute inset-0 animate-pulse`}>
          <FallbackIcon className={`${iconSizes[size]} text-gray-300`} />
        </div>
      )}
      
      {/* Actual image - only render if imageUrl is valid and not empty */}
      {imageUrl && imageUrl.trim() !== '' && (
        <img
          src={imageUrl}
          alt={alt}
          className={`${className ? className : sizeClasses[size]} object-cover rounded-lg border border-gray-300 transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
    </div>
  );
};

export default ImageWithFallback;
