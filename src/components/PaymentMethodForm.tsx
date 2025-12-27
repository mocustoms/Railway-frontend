import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import Input from './Input';
import Textarea from './Textarea';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { 
  defaultPaymentMethodFormData, 
  paymentMethodValidationRules, 
  paymentMethodErrorMessages 
} from '../data/paymentMethodModules';
import { PaymentMethod, PaymentMethodFormData } from '../types';
import { X, Save } from 'lucide-react';

interface PaymentMethodFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentMethodFormData) => Promise<void>;
  paymentMethod?: PaymentMethod;
  isSubmitting?: boolean;
}

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  paymentMethod,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<PaymentMethodFormData>(defaultPaymentMethodFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof PaymentMethodFormData, string>>>({});

  useEffect(() => {
    if (isOpen && !paymentMethod) {
      // Reset form for new payment method
      setFormData(defaultPaymentMethodFormData);
      setErrors({});
    } else if (isOpen && paymentMethod) {
      // Set form values for editing
      setFormData({
        // code is auto-generated, not included in form
        name: paymentMethod.name,
        deductsFromCustomerAccount: paymentMethod.deductsFromCustomerAccount,
        requiresBankDetails: paymentMethod.requiresBankDetails,
        uploadDocument: paymentMethod.uploadDocument,
        is_active: paymentMethod.is_active,
      });
      setErrors({});
    }
  }, [isOpen, paymentMethod]);

  const handleInputChange = (field: keyof PaymentMethodFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Code is now auto-generated, no validation needed

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = paymentMethodErrorMessages.name.required;
    } else if (formData.name.length < paymentMethodValidationRules.name.minLength) {
      newErrors.name = paymentMethodErrorMessages.name.minLength;
    } else if (formData.name.length > paymentMethodValidationRules.name.maxLength) {
      newErrors.name = paymentMethodErrorMessages.name.maxLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
    
    // Reset form after successful submission (only for new entries)
    if (!paymentMethod) {
      setFormData(defaultPaymentMethodFormData);
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 animate-fadeIn" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center py-8 px-4">
        <Card className="w-full max-w-2xl p-6 relative animate-slideInUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {paymentMethod ? 'Edit Payment Method' : 'Create Payment Method'}
        </h2>

      {isSubmitting && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code Field - Read-only when editing */}
          {paymentMethod && (
            <div className="space-y-2">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Code
              </label>
              <Input
                id="code"
                type="text"
                value={paymentMethod.code}
                disabled
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isSubmitting}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter payment method name"
            />
            {errors.name && (
              <Alert variant="error" className="text-sm">
                {errors.name}
              </Alert>
            )}
          </div>
        </div>

        {/* Options Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Options</h3>
          
          <div className="space-y-4">
            {/* Deducts From Customer Account */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="deductsFromCustomerAccount"
                checked={formData.deductsFromCustomerAccount}
                onChange={(e) => handleInputChange('deductsFromCustomerAccount', e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="deductsFromCustomerAccount" className="text-sm font-medium text-gray-700">
                Deducts From Customer Account
              </label>
            </div>

            {/* Requires Bank Details */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="requiresBankDetails"
                checked={formData.requiresBankDetails}
                onChange={(e) => handleInputChange('requiresBankDetails', e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requiresBankDetails" className="text-sm font-medium text-gray-700">
                Requires Bank Details
              </label>
            </div>

            {/* Upload Document */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="uploadDocument"
                checked={formData.uploadDocument}
                onChange={(e) => handleInputChange('uploadDocument', e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="uploadDocument" className="text-sm font-medium text-gray-700">
                Upload Document
              </label>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Saving...' : paymentMethod ? 'Update Payment Method' : 'Create Payment Method'}
          </Button>
        </div>
      </form>
      </Card>
      </div>
    </div>
  );
};