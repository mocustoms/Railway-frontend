import React, { useState, useEffect } from 'react';
import { X, Save, Receipt } from 'lucide-react';
import { ExpenseType, ExpenseTypeFormData } from '../types';
import { defaultExpenseTypeFormData, expenseTypeValidationRules, expenseTypeErrorMessages } from '../data/expenseTypeModules';

interface ExpenseTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseTypeFormData) => Promise<void>;
  expenseType?: ExpenseType;
  isSubmitting?: boolean;
  accounts?: any[];
}

const ExpenseTypeForm: React.FC<ExpenseTypeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expenseType,
  isSubmitting = false,
  accounts = []
}) => {
  const [formData, setFormData] = useState<ExpenseTypeFormData>(defaultExpenseTypeFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseTypeFormData, string>>>({});

  // Initialize form data when expense type is provided (edit mode)
  useEffect(() => {
    if (expenseType) {
      setFormData({
        // code is auto-generated, not included in form
        name: expenseType.name,
        description: expenseType.description || '',
        account_id: expenseType.account_id,
        order_of_display: expenseType.order_of_display,
        is_active: expenseType.is_active
      });
    } else {
      setFormData(defaultExpenseTypeFormData);
    }
    setErrors({});
  }, [expenseType]);

  // Handle input changes
  const handleInputChange = (field: keyof ExpenseTypeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExpenseTypeFormData, string>> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = expenseTypeErrorMessages.name.required;
    } else if (formData.name.length < expenseTypeValidationRules.name.minLength) {
      newErrors.name = expenseTypeErrorMessages.name.minLength;
    } else if (formData.name.length > expenseTypeValidationRules.name.maxLength) {
      newErrors.name = expenseTypeErrorMessages.name.maxLength;
    }

    // Validate account
    if (!formData.account_id) {
      newErrors.account_id = expenseTypeErrorMessages.account_id.required;
    }

    // Validate order of display
    if (!formData.order_of_display || formData.order_of_display < expenseTypeValidationRules.order_of_display.min) {
      newErrors.order_of_display = expenseTypeErrorMessages.order_of_display.min;
    } else if (formData.order_of_display > expenseTypeValidationRules.order_of_display.max) {
      newErrors.order_of_display = expenseTypeErrorMessages.order_of_display.max;
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
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {expenseType ? 'Edit Expense Type' : 'Create Expense Type'}
              </h2>
              <p className="text-sm text-gray-500">
                {expenseType ? 'Update expense type information' : 'Add a new expense type and link it to chart of accounts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code - Read-only when editing */}
            {expenseType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code
                </label>
                <input
                  type="text"
                  value={expenseType.code}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Office Supplies"
                disabled={isSubmitting}
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description for this expense type"
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* Account - Required */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart of Account *
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => handleInputChange('account_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.account_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
              {errors.account_id && (
                <p className="mt-1 text-sm text-red-600">{errors.account_id}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Link this expense type to a chart of account</p>
            </div>

            {/* Order of Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order *
              </label>
              <input
                type="number"
                value={formData.order_of_display}
                onChange={(e) => handleInputChange('order_of_display', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.order_of_display ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1"
                disabled={isSubmitting}
                min={1}
                max={9999}
              />
              {errors.order_of_display && (
                <p className="mt-1 text-sm text-red-600">{errors.order_of_display}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="border-t pt-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{expenseType ? 'Update' : 'Create'}</span>
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTypeForm;
