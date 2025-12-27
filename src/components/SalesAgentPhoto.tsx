import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

interface SalesAgentPhotoProps {
  photo?: string;
  fullName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SalesAgentPhoto: React.FC<SalesAgentPhotoProps> = ({
  photo,
  fullName,
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Generate image URL when photo changes
  useEffect(() => {
    if (photo) {
      
      const url = getImageUrl(photo, 'sales-agents');
      setImageUrl(url);
      setImageError(false);
      setImageLoaded(false);
    } else {
      setImageUrl('');
      setImageError(true);
      setImageLoaded(false);
    }
  }, [photo]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (!photo || imageError) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center ${className}`}>
        <User className={`${iconSizes[size]} text-gray-400`} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      {!imageLoaded && (
        <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center absolute inset-0`}>
          <User className={`${iconSizes[size]} text-gray-400`} />
        </div>
      )}
      <img
        src={imageUrl}
        alt={`${fullName}`}
        className={`${sizeClasses[size]} object-cover rounded-lg border border-gray-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default SalesAgentPhoto;
