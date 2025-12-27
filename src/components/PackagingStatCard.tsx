import React from 'react';
import { LucideIcon } from 'lucide-react';
import Card from './Card';

interface PackagingStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  isLoading?: boolean;
  error?: boolean;
}

const PackagingStatCard: React.FC<PackagingStatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  isLoading = false,
  error = false
}) => {
  return (
    <Card className="animate-slideInUp hover:shadow-md transition-all duration-150">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {isLoading ? '...' : value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {error && (
            <p className="text-xs text-red-500 mt-1">Error loading data</p>
          )}
        </div>
        <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </Card>
  );
};

export default PackagingStatCard;

