import React from 'react';
import { X, CreditCard, Star, Gift, TrendingUp, Percent, Calendar, User, Palette, DollarSign } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { LoyaltyCardConfig } from '../services/loyaltyCardService';

interface LoyaltyCardViewProps {
  isOpen: boolean;
  onClose: () => void;
  loyaltyCard: LoyaltyCardConfig;
}

const LoyaltyCardView: React.FC<LoyaltyCardViewProps> = ({
  isOpen,
  onClose,
  loyaltyCard
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Loyalty Card Configuration Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Card Name
                </label>
                <p className="text-sm text-gray-900">{loyaltyCard.loyalty_card_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Card Code
                </label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                  {loyaltyCard.loyalty_card_code}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Status
                </label>
                <StatusBadge status={loyaltyCard.is_active ? 'active' : 'inactive'} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <Palette className="h-4 w-4 inline mr-1" />
                  Card Color
                </label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: loyaltyCard.card_color || '#FFD700' }}
                  />
                  <span className="text-sm text-gray-900 font-mono">
                    {loyaltyCard.card_color || '#FFD700'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Entrance Points
                </label>
                <p className="text-sm text-gray-900">{loyaltyCard.entrance_points}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Default Configuration
                </label>
                {loyaltyCard.is_default ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </span>
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </div>
            </div>

            {/* Redemption Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                <Gift className="h-5 w-5 inline mr-1" />
                Redemption Configuration
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Redemption Rate (%)
                </label>
                <p className="text-sm text-gray-900">{loyaltyCard.redemption_rate || 100}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Minimum Redemption Points
                </label>
                <p className="text-sm text-gray-900">{loyaltyCard.minimum_redemption_points || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Maximum Redemption Points
                </label>
                <p className="text-sm text-gray-900">{loyaltyCard.maximum_redemption_points || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Birthday Bonus Points
                </label>
                <p className="text-sm text-gray-900">{loyaltyCard.birthday_bonus_points || 0}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Welcome Bonus Points
                </label>
                <p className="text-sm text-gray-900">{loyaltyCard.welcome_bonus_points || 0}</p>
              </div>
            </div>

            {/* Sales Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                <DollarSign className="h-5 w-5 inline mr-1" />
                Sales Settings
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Cash Sales
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  loyaltyCard.allow_gaining_cash_sales ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {loyaltyCard.allow_gaining_cash_sales ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Credit Sales
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  loyaltyCard.allow_gaining_credit_sales ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {loyaltyCard.allow_gaining_credit_sales ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Gain Rate Configuration */}
            {(loyaltyCard.gain_rate_lower_limit || loyaltyCard.gain_rate_upper_limit || loyaltyCard.gain_rate_value) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  <TrendingUp className="h-5 w-5 inline mr-1" />
                  Gain Rate Configuration
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Lower Sales Limit
                  </label>
                  <p className="text-sm text-gray-900">${loyaltyCard.gain_rate_lower_limit || 0}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Upper Sales Limit
                  </label>
                  <p className="text-sm text-gray-900">${loyaltyCard.gain_rate_upper_limit || 999999.99}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Rate Type
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    loyaltyCard.gain_rate_type === 'percentage' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {loyaltyCard.gain_rate_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Rate Value
                  </label>
                  <p className="text-sm text-gray-900">
                    {loyaltyCard.gain_rate_type === 'percentage' 
                      ? `${loyaltyCard.gain_rate_value || 0}%` 
                      : `$${loyaltyCard.gain_rate_value || 0}`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Discount Rate Configuration */}
            {(loyaltyCard.discount_rate_lower_limit || loyaltyCard.discount_rate_upper_limit || loyaltyCard.discount_rate_value) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  <Percent className="h-5 w-5 inline mr-1" />
                  Discount Rate Configuration
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Lower Sales Limit
                  </label>
                  <p className="text-sm text-gray-900">${loyaltyCard.discount_rate_lower_limit || 0}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Upper Sales Limit
                  </label>
                  <p className="text-sm text-gray-900">${loyaltyCard.discount_rate_upper_limit || 999999.99}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Rate Type
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    loyaltyCard.discount_rate_type === 'percentage' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {loyaltyCard.discount_rate_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Rate Value
                  </label>
                  <p className="text-sm text-gray-900">
                    {loyaltyCard.discount_rate_type === 'percentage' 
                      ? `${loyaltyCard.discount_rate_value || 0}%` 
                      : `$${loyaltyCard.discount_rate_value || 0}`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Audit Information */}
            <div className="md:col-span-2 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <Calendar className="h-5 w-5 inline mr-1" />
                Audit Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    <User className="h-4 w-4 inline mr-1" />
                    Created By
                  </label>
                  <p className="text-sm text-gray-900">
                    {loyaltyCard.created_by || 'System'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(loyaltyCard.created_at)}
                  </p>
                </div>

                {loyaltyCard.updated_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      <User className="h-4 w-4 inline mr-1" />
                      Last Updated By
                    </label>
                    <p className="text-sm text-gray-900">
                      {loyaltyCard.updated_by || 'System'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(loyaltyCard.updated_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Information */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Audit Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Created By
              </label>
              <p className="text-gray-900">{loyaltyCard.created_by_name || 'System'}</p>
              <p className="text-xs text-gray-500">
                {loyaltyCard.created_at ? new Date(loyaltyCard.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Updated By
              </label>
              <p className="text-gray-900">{loyaltyCard.updated_by_name || 'Never'}</p>
              <p className="text-xs text-gray-500">
                {loyaltyCard.updated_at ? new Date(loyaltyCard.updated_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyCardView;