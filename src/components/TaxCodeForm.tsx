import React, { useState, useEffect } from 'react';
import { X, Save, Receipt } from 'lucide-react';
import { TaxCode, TaxCodeFormData } from '../types';
import { defaultTaxCodeFormData, taxCodeValidationRules, taxCodeErrorMessages } from '../data/taxCodeModules';

interface TaxCodeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaxCodeFormData) => Promise<void>;
  taxCode?: TaxCode;
  isSubmitting?: boolean;
  accounts?: any[];
}

const TaxCodeForm: React.FC<TaxCodeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taxCode,
  isSubmitting = false,
  accounts = []
}) => {
  const [formData, setFormData] = useState<TaxCodeFormData>(defaultTaxCodeFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof TaxCodeFormData, string>>>({});

  // Initialize form data when tax code is provided (edit mode) or when opening for new entry
  useEffect(() => {
    if (isOpen) {
      if (taxCode) {
        setFormData({
          name: taxCode.name,
          rate: typeof taxCode.rate === 'number' ? taxCode.rate : parseFloat(taxCode.rate || '0'),
          indicator: taxCode.indicator || '',
          efd_department_code: taxCode.efd_department_code || '',
          sales_tax_account_id: taxCode.sales_tax_account_id || undefined,
          purchases_tax_account_id: taxCode.purchases_tax_account_id || undefined,
          is_active: taxCode.is_active,
          is_wht: taxCode.is_wht || false
        });
      } else {
        // Reset form when opening for new entry
        setFormData(defaultTaxCodeFormData);
      }
      setErrors({});
    }
  }, [taxCode, isOpen]);

  // Handle input changes
  const handleInputChange = (field: keyof TaxCodeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaxCodeFormData, string>> = {};

    // Name validation (code is auto-generated, no validation needed)
    if (!formData.name.trim()) {
      newErrors.name = taxCodeErrorMessages.name.required;
    } else if (formData.name.length < taxCodeValidationRules.name.minLength) {
      newErrors.name = taxCodeErrorMessages.name.minLength;
    } else if (formData.name.length > taxCodeValidationRules.name.maxLength) {
      newErrors.name = taxCodeErrorMessages.name.maxLength;
    }

    // Rate validation
    const rateValue = typeof formData.rate === 'number' ? formData.rate : parseFloat(formData.rate || '0');
    if (formData.rate === undefined || formData.rate === null || isNaN(rateValue)) {
      newErrors.rate = taxCodeErrorMessages.rate.required;
    } else if (rateValue < taxCodeValidationRules.rate.min) {
      newErrors.rate = taxCodeErrorMessages.rate.min;
    } else if (rateValue > taxCodeValidationRules.rate.max) {
      newErrors.rate = taxCodeErrorMessages.rate.max;
    }

    // Indicator validation
    if (formData.indicator && formData.indicator.length > taxCodeValidationRules.indicator.maxLength) {
      newErrors.indicator = taxCodeErrorMessages.indicator.maxLength;
    }

    // EFD Department Code validation
    if (formData.efd_department_code && formData.efd_department_code.length > taxCodeValidationRules.efd_department_code.maxLength) {
      newErrors.efd_department_code = taxCodeErrorMessages.efd_department_code.maxLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form after successful submission for new entries
      if (!taxCode) {
        setFormData(defaultTaxCodeFormData);
        setErrors({});
      }
      onClose();
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {taxCode ? 'Edit Tax Code' : 'Add Tax Code'}
              </h2>
              <p className="text-sm text-gray-500">
                {taxCode ? 'Update tax code information' : 'Create a new tax code'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Code and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code - Display only when editing */}
            {taxCode && (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={taxCode.code}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tax Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter tax name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Rate and Indicator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
                Rate (%) *
              </label>
              <input
                type="number"
                id="rate"
                value={formData.rate}
                onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                max="100"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.rate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={isSubmitting}
              />
              {errors.rate && (
                <p className="mt-1 text-sm text-red-600">{errors.rate}</p>
              )}
            </div>

            <div>
              <label htmlFor="indicator" className="block text-sm font-medium text-gray-700 mb-2">
                Indicator
              </label>
              <input
                type="text"
                id="indicator"
                value={formData.indicator}
                onChange={(e) => handleInputChange('indicator', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.indicator ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter indicator"
                disabled={isSubmitting}
              />
              {errors.indicator && (
                <p className="mt-1 text-sm text-red-600">{errors.indicator}</p>
              )}
            </div>
          </div>

          {/* EFD Department Code and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="efd_department_code" className="block text-sm font-medium text-gray-700 mb-2">
                EFD Department Code
              </label>
              <input
                type="text"
                id="efd_department_code"
                value={formData.efd_department_code}
                onChange={(e) => handleInputChange('efd_department_code', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.efd_department_code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter EFD department code"
                disabled={isSubmitting}
              />
              {errors.efd_department_code && (
                <p className="mt-1 text-sm text-red-600">{errors.efd_department_code}</p>
              )}
            </div>

            <div>
              <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="is_active"
                value={formData.is_active.toString()}
                onChange={(e) => handleInputChange('is_active', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* WHT Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Withholding Tax (WHT)
              </label>
              <p className="text-xs text-gray-500">
                Enable this if this tax code is a withholding tax
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_wht}
                onChange={(e) => handleInputChange('is_wht', e.target.checked)}
                disabled={isSubmitting}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Sales and Purchases Tax Accounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sales_tax_account_id" className="block text-sm font-medium text-gray-700 mb-2">
                Sales Tax Account
              </label>
              <select
                id="sales_tax_account_id"
                value={formData.sales_tax_account_id || ''}
                onChange={(e) => handleInputChange('sales_tax_account_id', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select Sales Tax Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="purchases_tax_account_id" className="block text-sm font-medium text-gray-700 mb-2">
                Purchases Tax Account
              </label>
              <select
                id="purchases_tax_account_id"
                value={formData.purchases_tax_account_id || ''}
                onChange={(e) => handleInputChange('purchases_tax_account_id', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select Purchases Tax Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : (taxCode ? 'Update Tax Code' : 'Save Tax Code')}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default TaxCodeForm; 