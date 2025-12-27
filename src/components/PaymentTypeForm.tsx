import React, { useState, useEffect } from 'react';
import { X, Save, CreditCard } from 'lucide-react';
import { PaymentType, PaymentTypeFormData } from '../types';
import { defaultPaymentTypeFormData, paymentTypeValidationRules, paymentTypeErrorMessages } from '../data/paymentTypeModules';

interface PaymentTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentTypeFormData) => Promise<void>;
  paymentType?: PaymentType;
  isSubmitting?: boolean;
  paymentMethods?: any[];
  accounts?: any[];
}

const PaymentTypeForm: React.FC<PaymentTypeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  paymentType,
  isSubmitting = false,
  paymentMethods = [],
  accounts = []
}) => {
  const [formData, setFormData] = useState<PaymentTypeFormData>(defaultPaymentTypeFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof PaymentTypeFormData, string>>>({});

  // Initialize form data when payment type is provided (edit mode)
  useEffect(() => {
    if (paymentType) {
      setFormData({
        // code is auto-generated, not included in form
        name: paymentType.name,
        payment_method_id: paymentType.payment_method_id,
        order_of_display: paymentType.order_of_display,
        default_account_id: paymentType.default_account_id || '',
        used_in_sales: paymentType.used_in_sales,
        used_in_debtor_payments: paymentType.used_in_debtor_payments,
        used_in_credit_payments: paymentType.used_in_credit_payments,
        used_in_customer_deposits: paymentType.used_in_customer_deposits,
        used_in_refunds: paymentType.used_in_refunds,
        display_in_cashier_report: paymentType.display_in_cashier_report,
        used_in_banking: paymentType.used_in_banking,
        is_active: paymentType.is_active
      });
    } else {
      setFormData(defaultPaymentTypeFormData);
    }
    setErrors({});
  }, [paymentType]);

  // Handle input changes
  const handleInputChange = (field: keyof PaymentTypeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PaymentTypeFormData, string>> = {};

    // Code is now auto-generated, no validation needed

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = paymentTypeErrorMessages.name.required;
    } else if (formData.name.length < paymentTypeValidationRules.name.minLength) {
      newErrors.name = paymentTypeErrorMessages.name.minLength;
    } else if (formData.name.length > paymentTypeValidationRules.name.maxLength) {
      newErrors.name = paymentTypeErrorMessages.name.maxLength;
    }

    // Validate payment method
    if (!formData.payment_method_id) {
      newErrors.payment_method_id = paymentTypeErrorMessages.payment_method_id.required;
    }

    // Validate order of display
    if (!formData.order_of_display || formData.order_of_display < paymentTypeValidationRules.order_of_display.min) {
      newErrors.order_of_display = paymentTypeErrorMessages.order_of_display.min;
    } else if (formData.order_of_display > paymentTypeValidationRules.order_of_display.max) {
      newErrors.order_of_display = paymentTypeErrorMessages.order_of_display.max;
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
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {paymentType ? 'Edit Payment Type' : 'Create Payment Type'}
              </h2>
              <p className="text-sm text-gray-500">
                {paymentType ? 'Update payment type information' : 'Add a new payment type'}
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
            {paymentType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code
                </label>
                <input
                  type="text"
                  value={paymentType.code}
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
                placeholder="e.g., Cash Payment"
                disabled={isSubmitting}
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                value={formData.payment_method_id}
                onChange={(e) => handleInputChange('payment_method_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.payment_method_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select Payment Method</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name} ({method.code})
                  </option>
                ))}
              </select>
              {errors.payment_method_id && (
                <p className="mt-1 text-sm text-red-600">{errors.payment_method_id}</p>
              )}
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

            {/* Default Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Account
              </label>
              <select
                value={formData.default_account_id}
                onChange={(e) => handleInputChange('default_account_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select Account (Optional)</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Usage Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.used_in_sales}
                  onChange={(e) => handleInputChange('used_in_sales', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">Used in Sales</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.used_in_debtor_payments}
                  onChange={(e) => handleInputChange('used_in_debtor_payments', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">Used in Debtor Payments</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.used_in_credit_payments}
                  onChange={(e) => handleInputChange('used_in_credit_payments', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">Used in Credit Payments</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.used_in_customer_deposits}
                  onChange={(e) => handleInputChange('used_in_customer_deposits', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">Used in Customer Deposits</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.used_in_refunds}
                  onChange={(e) => handleInputChange('used_in_refunds', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">Used in Refunds</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.display_in_cashier_report}
                  onChange={(e) => handleInputChange('display_in_cashier_report', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">Display in Cashier Report</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.used_in_banking}
                  onChange={(e) => handleInputChange('used_in_banking', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">Used in Banking</span>
              </label>
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
                  <span>{paymentType ? 'Update' : 'Create'}</span>
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

export default PaymentTypeForm;
