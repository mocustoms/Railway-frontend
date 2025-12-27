import React from 'react';
import { Edit, Tags, TrendingUp, TrendingDown, Calendar, User, Clock } from 'lucide-react';
import { PriceCategory } from '../types';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatters';

interface PriceCategoryViewProps {
  category: PriceCategory;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
}

const PriceCategoryView: React.FC<PriceCategoryViewProps> = ({
  category,
  onClose,
  onEdit,
  canEdit
}) => {
  // Helper function for ordinal suffixes
  const getOrdinalSuffix = (date: number): string => {
    if (date >= 11 && date <= 13) return 'th';
    switch (date % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  const getChangeTypeIcon = (changeType: string) => {
    return changeType === 'increase' ? (
      <TrendingUp className="w-6 h-6 text-green-600" />
    ) : (
      <TrendingDown className="w-6 h-6 text-red-600" />
    );
  };

  const getScheduledTypeLabel = (scheduledType: string) => {
    switch (scheduledType) {
      case 'not_scheduled':
        return 'Not Scheduled';
      case 'one_time':
        return 'One Time';
      case 'recurring':
        return 'Recurring';
      default:
        return scheduledType;
    }
  };

  const getRecurringPeriodLabel = (period?: string) => {
    if (!period) return 'N/A';
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Price Category Details
        </h2>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header with Basic Info */}
        <div className="flex items-start space-x-4">
          <div className="w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center">
            <Tags className="w-12 h-12 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">{category.name}</h3>
            <p className="text-lg text-gray-600">{category.code}</p>
            <div className="mt-2">
              <StatusBadge 
                status={category.is_active ? 'active' : 'inactive'} 
              />
            </div>
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
              {category.description}
            </p>
          </div>
        )}

        {/* Price Change Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Price Change Details</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {getChangeTypeIcon(category.price_change_type)}
                <span className="text-gray-900">
                  {category.price_change_type === 'increase' ? 'Increase' : 'Decrease'} by {category.percentage_change}%
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Tags className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">
                  Type: {category.price_change_type.charAt(0).toUpperCase() + category.price_change_type.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Scheduling Information</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">
                  {getScheduledTypeLabel(category.scheduled_type)}
                </span>
              </div>
              
              {/* Enhanced Recurring Scheduling Details */}
              {category.scheduled_type === 'recurring' && category.recurring_period && (
                <>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      Every {getRecurringPeriodLabel(category.recurring_period)}
                    </span>
                  </div>
                  
                  {/* Day of Week for Weekly */}
                  {category.recurring_period === 'weekly' && category.recurring_day_of_week && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        Day: {category.recurring_day_of_week.charAt(0).toUpperCase() + category.recurring_day_of_week.slice(1)}
                      </span>
                    </div>
                  )}
                  
                  {/* Date for Monthly/Yearly */}
                  {(category.recurring_period === 'monthly' || category.recurring_period === 'yearly') && category.recurring_date && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        Date: {category.recurring_date}{getOrdinalSuffix(category.recurring_date)}
                      </span>
                    </div>
                  )}
                  
                  {/* Month for Yearly */}
                  {category.recurring_period === 'yearly' && category.recurring_month && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        Month: {category.recurring_month.charAt(0).toUpperCase() + category.recurring_month.slice(1)}
                      </span>
                    </div>
                  )}
                  
                  {/* Time Range for All Recurring Types */}
                  {(category.start_time || category.end_time) && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        Time: {category.start_time || 'N/A'} - {category.end_time || 'N/A'}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              {category.scheduled_type === 'one_time' && category.scheduled_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {formatDate(category.scheduled_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Status Information</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <StatusBadge 
                  status={category.is_active ? 'active' : 'inactive'} 
                />
                <span className="text-gray-900">
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Timestamps</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">
                  Created: {category.created_at ? formatDate(category.created_at) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">
                  Updated: {category.updated_at ? formatDate(category.updated_at) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Information */}
        {(category.created_by_name || category.updated_by_name) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">User Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.created_by_name && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    Created by: {category.created_by_name}
                  </span>
                </div>
              )}
              {category.updated_by_name && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    Updated by: {category.updated_by_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceCategoryView;

