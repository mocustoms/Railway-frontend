import React, { useState, useEffect } from 'react';
import { X, Save, Coins, Globe } from 'lucide-react';
import { Currency } from '../types';
import { countriesList, currencyValidationRules, defaultCurrencyFormData } from '../data/currencyModules';

interface CurrencyFormProps {
  currency?: Currency;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Currency>) => Promise<void>;
  isLoading?: boolean;
}

const CurrencyForm: React.FC<CurrencyFormProps> = ({
  currency,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<Currency>>(defaultCurrencyFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // Initialize form data when currency prop changes
  useEffect(() => {
    if (currency) {
      setFormData({
        name: currency.name,
        symbol: currency.symbol,
        country: currency.country,
        flag: currency.flag,
        is_default: currency.is_default,
        is_active: currency.is_active
      });
      setSelectedCountry(currency.country || '');
    } else {
      // Don't include code when creating new currency
      setFormData({
        name: '',
        symbol: '',
        country: '',
        flag: '',
        is_default: false,
        is_active: true
      });
      setSelectedCountry('');
    }
    setErrors({});
  }, [currency, isOpen]);

  const handleInputChange = (field: keyof Currency, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    const country = countriesList.find(c => c.code === countryCode);
    if (country) {
      setFormData(prev => ({
        ...prev,
        name: `${country.name} ${country.currency}`,
        symbol: country.symbol,
        country: country.name,
        flag: country.flag
      }));
      setSelectedCountry(countryCode);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Code is auto-generated, no validation needed

    // Validate name
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = currencyValidationRules.name.required;
    } else if (formData.name.length > 100) {
      newErrors.name = currencyValidationRules.name.maxLength;
    }

    // Validate symbol
    if (!formData.symbol || !formData.symbol.trim()) {
      newErrors.symbol = currencyValidationRules.symbol.required;
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = currencyValidationRules.symbol.maxLength;
    }

    // Validate country is selected (required)
    if (!selectedCountry) {
      newErrors.country = 'Country selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Remove code field when creating new currency (it's auto-generated)
      // Also remove any undefined/null fields to avoid sending empty values
      const dataToSubmit: Partial<Currency> = {};
      
      if (formData.name) dataToSubmit.name = formData.name;
      if (formData.symbol) dataToSubmit.symbol = formData.symbol;
      if (formData.country) dataToSubmit.country = formData.country;
      if (formData.flag) dataToSubmit.flag = formData.flag;
      if (formData.is_default !== undefined) dataToSubmit.is_default = formData.is_default;
      if (formData.is_active !== undefined) dataToSubmit.is_active = formData.is_active;
      
      // Only include code when editing existing currency
      if (currency && currency.code) {
        dataToSubmit.code = currency.code;
      }
      
      await onSubmit(dataToSubmit);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Coins className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currency ? 'Edit Currency' : 'Add Currency'}
              </h2>
              <p className="text-sm text-gray-500">
                {currency ? 'Update currency details' : 'Add a new currency to the system'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Currency Code - Display preview when creating, actual code when editing */}
            <div className="form-group">
              <label className="form-label">
                <Coins className="h-4 w-4" />
                Currency Code
              </label>
              <input
                type="text"
              value={currency ? (currency.code || '') : 'Auto-generated (e.g., EMZ-CUR-0001)'}
                className="form-input disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled
                readOnly
              />
            <p className="text-xs text-gray-500 mt-1">
              {currency 
                ? 'Code is automatically generated and cannot be changed'
                : 'Code will be automatically generated using company code prefix'}
            </p>
            </div>

          {/* Currency Name */}
          <div className="form-group">
            <label className="form-label">
              <Coins className="h-4 w-4" />
              Currency Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`form-input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="US Dollar"
              maxLength={100}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Currency Symbol */}
          <div className="form-group">
            <label className="form-label">
              <Coins className="h-4 w-4" />
              Symbol *
            </label>
            <input
              type="text"
              value={formData.symbol || ''}
              onChange={(e) => handleInputChange('symbol', e.target.value)}
              className={`form-input ${errors.symbol ? 'border-red-500' : ''}`}
              placeholder="$"
              maxLength={10}
              required
            />
            {errors.symbol && (
              <p className="text-red-500 text-sm mt-1">{errors.symbol}</p>
            )}
          </div>

          {/* Country Selection */}
          <div className="form-group">
            <label className="form-label">
              <Globe className="h-4 w-4" />
              Country *
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountrySelect(e.target.value)}
              className={`form-select ${errors.country ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Select a country</option>
              {countriesList.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name} ({country.currency})
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="text-red-500 text-sm mt-1">{errors.country}</p>
            )}
          </div>

          {/* Default Currency */}
          <div className="form-group">
            <label className="form-label">
              <Coins className="h-4 w-4" />
              Default Currency
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default || false}
                onChange={(e) => handleInputChange('is_default', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_default" className="text-sm text-gray-700">
                Set as default currency for the system
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Only one currency can be set as default. Setting this will remove the default status from other currencies.
            </p>
          </div>

          {/* Active Status */}
          <div className="form-group">
            <label className="form-label">
              <Coins className="h-4 w-4" />
              Status
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active !== false}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Active
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Inactive currencies cannot be used in transactions.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="btn-secondary"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : (currency ? 'Update Currency' : 'Save Currency')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default CurrencyForm; 