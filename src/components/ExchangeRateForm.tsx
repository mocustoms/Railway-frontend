import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import { ExchangeRate, ExchangeRateFormData, Currency } from '../types';
import { exchangeRateValidationRules } from '../data/exchangeRateModules';

interface ExchangeRateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExchangeRateFormData) => Promise<void>;
  exchangeRate?: ExchangeRate | null;
  currencies?: Currency[];
  isLoading?: boolean;
}

export const ExchangeRateForm: React.FC<ExchangeRateFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  exchangeRate,
  currencies = [],
  isLoading = false
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ensure currencies is always an array
  const safeCurrencies = Array.isArray(currencies) ? currencies : [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting }
  } = useForm<ExchangeRateFormData>();

  const watchedFromCurrency = watch('from_currency_id');
  const watchedToCurrency = watch('to_currency_id');

  // Reset form when exchangeRate changes
  useEffect(() => {
    if (exchangeRate) {
      reset({
        from_currency_id: exchangeRate.from_currency_id,
        to_currency_id: exchangeRate.to_currency_id,
        rate: exchangeRate.rate,
        effective_date: exchangeRate.effective_date,
        is_active: exchangeRate.is_active
      });
    } else {
      reset({
        from_currency_id: '',
        to_currency_id: '',
        rate: 1.0,
        effective_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
    }
    setErrors({});
  }, [exchangeRate, reset]);

  // Validate form
  const validateForm = (data: ExchangeRateFormData): boolean => {
    const newErrors: Record<string, string> = {};

    // From Currency validation
    if (!data.from_currency_id) {
      newErrors.from_currency_id = exchangeRateValidationRules.from_currency_id.required;
    }

    // To Currency validation
    if (!data.to_currency_id) {
      newErrors.to_currency_id = exchangeRateValidationRules.to_currency_id.required;
    } else if (data.from_currency_id === data.to_currency_id) {
      newErrors.to_currency_id = 'From Currency and To Currency cannot be the same';
    }

    // Rate validation
    if (!data.rate || data.rate <= 0) {
      newErrors.rate = exchangeRateValidationRules.rate.required;
    } else if (data.rate > 999999.999999) {
      newErrors.rate = 'Exchange Rate must be less than 1,000,000';
    }

    // Effective Date validation
    if (!data.effective_date) {
      newErrors.effective_date = exchangeRateValidationRules.effective_date.required;
    } else {
      const date = new Date(data.effective_date);
      if (isNaN(date.getTime())) {
        newErrors.effective_date = 'Invalid date format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (data: ExchangeRateFormData) => {
    if (!validateForm(data)) {
      return;
    }

    try {
      await onSubmit(data);
    } catch (error) {
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {exchangeRate ? 'Edit Exchange Rate' : 'Add Exchange Rate'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting || isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Currency Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Currency */}
            <div>
              <label htmlFor="from_currency_id" className="block text-sm font-medium text-gray-700 mb-2">
                From Currency *
              </label>
              <select
                id="from_currency_id"
                {...register('from_currency_id')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.from_currency_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoading}
              >
                <option value="">Select Currency</option>
                {safeCurrencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              {errors.from_currency_id && (
                <p className="mt-1 text-sm text-red-600">{errors.from_currency_id}</p>
              )}
            </div>

            {/* To Currency */}
            <div>
              <label htmlFor="to_currency_id" className="block text-sm font-medium text-gray-700 mb-2">
                To Currency *
              </label>
              <select
                id="to_currency_id"
                {...register('to_currency_id')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.to_currency_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoading}
              >
                <option value="">Select Currency</option>
                {safeCurrencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              {errors.to_currency_id && (
                <p className="mt-1 text-sm text-red-600">{errors.to_currency_id}</p>
              )}
            </div>
          </div>

          {/* Rate and Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exchange Rate */}
            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
                Exchange Rate *
              </label>
              <input
                type="number"
                id="rate"
                step="0.000001"
                placeholder="1.000000"
                {...register('rate', { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoading}
              />
              {errors.rate && (
                <p className="mt-1 text-sm text-red-600">{errors.rate}</p>
              )}
            </div>

            {/* Effective Date */}
            <div>
              <label htmlFor="effective_date" className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date *
              </label>
              <input
                type="date"
                id="effective_date"
                {...register('effective_date')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.effective_date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting || isLoading}
              />
              {errors.effective_date && (
                <p className="mt-1 text-sm text-red-600">{errors.effective_date}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('is_active')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting || isLoading}
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting || isLoading}
            >
              <X size={16} className="inline mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isLoading}
            >
              <Save size={16} className="inline mr-2" />
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}; 