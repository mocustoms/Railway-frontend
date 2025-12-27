import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Save, AlertCircle, Palette } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';
import {
  LoyaltyCardConfig,
  CreateLoyaltyCardConfigRequest,
  UpdateLoyaltyCardConfigRequest
} from '../services/loyaltyCardService';

interface LoyaltyCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLoyaltyCardConfigRequest | UpdateLoyaltyCardConfigRequest) => void;
  initialData?: LoyaltyCardConfig;
  isLoading?: boolean;
  title: string;
}

const schema = yup.object({
  loyalty_card_name: yup.string().required('Card name is required').min(2, 'Card name must be at least 2 characters'),
  card_color: yup.string().required('Card color is required'),
  entrance_points: yup.number().required('Entrance points is required').min(0, 'Entrance points must be non-negative'),
  allow_gaining_cash_sales: yup.boolean(),
  allow_gaining_credit_sales: yup.boolean(),
  is_default: yup.boolean(),
  redemption_rate: yup.number().min(0, 'Redemption rate must be non-negative'),
  minimum_redemption_points: yup.number().min(0, 'Minimum redemption points must be non-negative'),
  maximum_redemption_points: yup.number().min(0, 'Maximum redemption points must be non-negative'),
  birthday_bonus_points: yup.number().min(0, 'Birthday bonus points must be non-negative'),
  welcome_bonus_points: yup.number().min(0, 'Welcome bonus points must be non-negative'),
  gain_rate_lower_limit: yup.number().min(0, 'Gain rate lower limit must be non-negative'),
  gain_rate_upper_limit: yup.number().min(0, 'Gain rate upper limit must be non-negative'),
  gain_rate_type: yup.string().oneOf(['fixed', 'percentage']),
  gain_rate_value: yup.number().min(0, 'Gain rate value must be non-negative'),
  discount_rate_lower_limit: yup.number().min(0, 'Discount rate lower limit must be non-negative'),
  discount_rate_upper_limit: yup.number().min(0, 'Discount rate upper limit must be non-negative'),
  discount_rate_type: yup.string().oneOf(['fixed', 'percentage']),
  discount_rate_value: yup.number().min(0, 'Discount rate value must be non-negative'),
  is_active: yup.boolean()
});

type FormData = yup.InferType<typeof schema>;

const LoyaltyCardForm: React.FC<LoyaltyCardFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  title
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      loyalty_card_name: initialData?.loyalty_card_name || '',
      card_color: initialData?.card_color || '#FFD700',
      entrance_points: initialData?.entrance_points || 0,
      allow_gaining_cash_sales: initialData?.allow_gaining_cash_sales || false,
      allow_gaining_credit_sales: initialData?.allow_gaining_credit_sales || false,
      is_default: initialData?.is_default || false,
      redemption_rate: initialData?.redemption_rate || 100,
      minimum_redemption_points: initialData?.minimum_redemption_points || 0,
      maximum_redemption_points: initialData?.maximum_redemption_points || 0,
      birthday_bonus_points: initialData?.birthday_bonus_points || 0,
      welcome_bonus_points: initialData?.welcome_bonus_points || 0,
      gain_rate_lower_limit: initialData?.gain_rate_lower_limit || 0,
      gain_rate_upper_limit: initialData?.gain_rate_upper_limit || 0,
      gain_rate_type: initialData?.gain_rate_type || 'percentage',
      gain_rate_value: initialData?.gain_rate_value || 0,
      discount_rate_lower_limit: initialData?.discount_rate_lower_limit || 0,
      discount_rate_upper_limit: initialData?.discount_rate_upper_limit || 0,
      discount_rate_type: initialData?.discount_rate_type || 'percentage',
      discount_rate_value: initialData?.discount_rate_value || 0,
      is_active: initialData?.is_active ?? true
    }
  });

  const watchedGainRateType = watch('gain_rate_type');
  const watchedDiscountRateType = watch('discount_rate_type');
  const selectedColor = watch('card_color');

  React.useEffect(() => {
    if (initialData) {
      reset({
        loyalty_card_name: initialData.loyalty_card_name,
        card_color: initialData.card_color || '#FFD700',
        entrance_points: initialData.entrance_points,
        allow_gaining_cash_sales: initialData.allow_gaining_cash_sales,
        allow_gaining_credit_sales: initialData.allow_gaining_credit_sales,
        is_default: initialData.is_default,
        redemption_rate: initialData.redemption_rate || 100,
        minimum_redemption_points: initialData.minimum_redemption_points || 0,
        maximum_redemption_points: initialData.maximum_redemption_points || 0,
        birthday_bonus_points: initialData.birthday_bonus_points || 0,
        welcome_bonus_points: initialData.welcome_bonus_points || 0,
        gain_rate_lower_limit: initialData.gain_rate_lower_limit || 0,
        gain_rate_upper_limit: initialData.gain_rate_upper_limit || 0,
        gain_rate_type: initialData.gain_rate_type || 'percentage',
        gain_rate_value: initialData.gain_rate_value || 0,
        discount_rate_lower_limit: initialData.discount_rate_lower_limit || 0,
        discount_rate_upper_limit: initialData.discount_rate_upper_limit || 0,
        discount_rate_type: initialData.discount_rate_type || 'percentage',
        discount_rate_value: initialData.discount_rate_value || 0,
        is_active: initialData.is_active
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as CreateLoyaltyCardConfigRequest | UpdateLoyaltyCardConfigRequest);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const colorPresets = [
    '#FFD700', // Gold
    '#C0C0C0', // Silver
    '#CD7F32', // Bronze
    '#E5E4E2', // Platinum
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316'  // Orange
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Basic Information
              </h3>
            </div>

            {/* Card Name */}
            <div>
              <label htmlFor="loyalty_card_name" className="block text-sm font-medium text-gray-700 mb-2">
                Card Name *
              </label>
              <input
                {...register('loyalty_card_name')}
                type="text"
                id="loyalty_card_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter card name"
              />
              {errors.loyalty_card_name && (
                <p className="mt-1 text-sm text-red-600">{errors.loyalty_card_name.message}</p>
              )}
            </div>

            {/* Card Code - Read-only when editing */}
            {initialData && (
              <div>
                <label htmlFor="loyalty_card_code" className="block text-sm font-medium text-gray-700 mb-2">
                  Card Code
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                  {initialData.loyalty_card_code}
                </div>
                <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
              </div>
            )}

            {/* Color Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette className="h-4 w-4 inline mr-1" />
                Card Color
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('card_color', color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                {...register('card_color')}
                type="text"
                placeholder="#FFD700"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.card_color && (
                <p className="mt-1 text-sm text-red-600">{errors.card_color.message}</p>
              )}
            </div>

            {/* Entrance Points */}
            <div>
              <label htmlFor="entrance_points" className="block text-sm font-medium text-gray-700 mb-2">
                Entrance Points *
              </label>
              <input
                {...register('entrance_points')}
                type="number"
                id="entrance_points"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter entrance points"
              />
              {errors.entrance_points && (
                <p className="mt-1 text-sm text-red-600">{errors.entrance_points.message}</p>
              )}
            </div>

            {/* Redemption Rate */}
            <div>
              <label htmlFor="redemption_rate" className="block text-sm font-medium text-gray-700 mb-2">
                Redemption Rate (%)
              </label>
              <input
                {...register('redemption_rate')}
                type="number"
                step="0.01"
                id="redemption_rate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="100.00"
              />
              {errors.redemption_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.redemption_rate.message}</p>
              )}
            </div>

            {/* Redemption Limits */}
            <div>
              <label htmlFor="minimum_redemption_points" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Redemption Points
              </label>
              <input
                {...register('minimum_redemption_points')}
                type="number"
                id="minimum_redemption_points"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="100"
              />
              {errors.minimum_redemption_points && (
                <p className="mt-1 text-sm text-red-600">{errors.minimum_redemption_points.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="maximum_redemption_points" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Redemption Points
              </label>
              <input
                {...register('maximum_redemption_points')}
                type="number"
                id="maximum_redemption_points"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="1000"
              />
              {errors.maximum_redemption_points && (
                <p className="mt-1 text-sm text-red-600">{errors.maximum_redemption_points.message}</p>
              )}
            </div>

            {/* Bonus Points */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Bonus Points
              </h3>
            </div>

            <div>
              <label htmlFor="birthday_bonus_points" className="block text-sm font-medium text-gray-700 mb-2">
                Birthday Bonus Points
              </label>
              <input
                {...register('birthday_bonus_points')}
                type="number"
                id="birthday_bonus_points"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              {errors.birthday_bonus_points && (
                <p className="mt-1 text-sm text-red-600">{errors.birthday_bonus_points.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="welcome_bonus_points" className="block text-sm font-medium text-gray-700 mb-2">
                Welcome Bonus Points
              </label>
              <input
                {...register('welcome_bonus_points')}
                type="number"
                id="welcome_bonus_points"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              {errors.welcome_bonus_points && (
                <p className="mt-1 text-sm text-red-600">{errors.welcome_bonus_points.message}</p>
              )}
            </div>

            {/* Sales Settings */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Sales Settings
              </h3>
            </div>

            <div className="md:col-span-2">
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    {...register('allow_gaining_cash_sales')}
                    type="checkbox"
                    id="allow_gaining_cash_sales"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_gaining_cash_sales" className="ml-2 text-sm text-gray-700">
                    Allow gaining points for cash sales
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    {...register('allow_gaining_credit_sales')}
                    type="checkbox"
                    id="allow_gaining_credit_sales"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_gaining_credit_sales" className="ml-2 text-sm text-gray-700">
                    Allow gaining points for credit sales
                  </label>
                </div>
              </div>
            </div>

            {/* Gain Rate Configuration */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Gain Rate Configuration
              </h3>
            </div>

            <div>
              <label htmlFor="gain_rate_lower_limit" className="block text-sm font-medium text-gray-700 mb-2">
                Lower Sales Limit
              </label>
              <input
                {...register('gain_rate_lower_limit')}
                type="number"
                step="0.01"
                id="gain_rate_lower_limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              {errors.gain_rate_lower_limit && (
                <p className="mt-1 text-sm text-red-600">{errors.gain_rate_lower_limit.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="gain_rate_upper_limit" className="block text-sm font-medium text-gray-700 mb-2">
                Upper Sales Limit
              </label>
              <input
                {...register('gain_rate_upper_limit')}
                type="number"
                step="0.01"
                id="gain_rate_upper_limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="999999.99"
              />
              {errors.gain_rate_upper_limit && (
                <p className="mt-1 text-sm text-red-600">{errors.gain_rate_upper_limit.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="gain_rate_type" className="block text-sm font-medium text-gray-700 mb-2">
                Rate Type
              </label>
              <select
                {...register('gain_rate_type')}
                id="gain_rate_type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              {errors.gain_rate_type && (
                <p className="mt-1 text-sm text-red-600">{errors.gain_rate_type.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="gain_rate_value" className="block text-sm font-medium text-gray-700 mb-2">
                Rate Value
              </label>
              <input
                {...register('gain_rate_value')}
                type="number"
                step="0.01"
                id="gain_rate_value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={watchedGainRateType === 'percentage' ? '1.00' : '0.00'}
              />
              {errors.gain_rate_value && (
                <p className="mt-1 text-sm text-red-600">{errors.gain_rate_value.message}</p>
              )}
            </div>

            {/* Discount Rate Configuration */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Discount Rate Configuration
              </h3>
            </div>

            <div>
              <label htmlFor="discount_rate_lower_limit" className="block text-sm font-medium text-gray-700 mb-2">
                Lower Sales Limit
              </label>
              <input
                {...register('discount_rate_lower_limit')}
                type="number"
                step="0.01"
                id="discount_rate_lower_limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              {errors.discount_rate_lower_limit && (
                <p className="mt-1 text-sm text-red-600">{errors.discount_rate_lower_limit.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="discount_rate_upper_limit" className="block text-sm font-medium text-gray-700 mb-2">
                Upper Sales Limit
              </label>
              <input
                {...register('discount_rate_upper_limit')}
                type="number"
                step="0.01"
                id="discount_rate_upper_limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="999999.99"
              />
              {errors.discount_rate_upper_limit && (
                <p className="mt-1 text-sm text-red-600">{errors.discount_rate_upper_limit.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="discount_rate_type" className="block text-sm font-medium text-gray-700 mb-2">
                Rate Type
              </label>
              <select
                {...register('discount_rate_type')}
                id="discount_rate_type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              {errors.discount_rate_type && (
                <p className="mt-1 text-sm text-red-600">{errors.discount_rate_type.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="discount_rate_value" className="block text-sm font-medium text-gray-700 mb-2">
                Rate Value
              </label>
              <input
                {...register('discount_rate_value')}
                type="number"
                step="0.01"
                id="discount_rate_value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={watchedDiscountRateType === 'percentage' ? '0.00' : '0.00'}
              />
              {errors.discount_rate_value && (
                <p className="mt-1 text-sm text-red-600">{errors.discount_rate_value.message}</p>
              )}
            </div>

            {/* Status Configuration */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">
                Status Configuration
              </h3>
            </div>

            <div className="md:col-span-2">
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    {...register('is_active')}
                    type="checkbox"
                    id="is_active"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    {...register('is_default')}
                    type="checkbox"
                    id="is_default"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                    Default Configuration
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading || !isDirty}
            >
              {initialData ? 'Update Configuration' : 'Create Configuration'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyCardForm;