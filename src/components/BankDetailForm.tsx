import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import Input from './Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import SearchableDropdown from './SearchableDropdown';
import { 
  defaultBankDetailFormData, 
  bankDetailValidationRules, 
  bankDetailErrorMessages 
} from '../data/bankDetailModules';
import { BankDetail, BankDetailFormData, Account } from '../types';
import { X, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { bankDetailService } from '../services/bankDetailService';

interface BankDetailFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BankDetailFormData) => Promise<void>;
  bankDetail?: BankDetail;
  isSubmitting?: boolean;
}

export const BankDetailForm: React.FC<BankDetailFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bankDetail,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<BankDetailFormData>(defaultBankDetailFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof BankDetailFormData, string>>>({});

  // Fetch accounts for dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ['leaf-accounts'],
    queryFn: async () => {
      return await bankDetailService.getLeafAccounts();
    },
    enabled: isOpen
  });

  // Prepare account options for searchable dropdown
  const accountOptions = accounts.map(account => ({
    id: account.id,
    value: account.id,
    label: `${account.code} - ${account.name}`,
    code: account.code,
    name: account.name,
    type: account.type
  }));

  useEffect(() => {
    if (isOpen && !bankDetail) {
      // Reset form for new bank detail
      setFormData(defaultBankDetailFormData);
      setErrors({});
    } else if (isOpen && bankDetail) {
      // Set form values for editing
      setFormData({
        code: bankDetail.code,
        bankName: bankDetail.bankName,
        branch: bankDetail.branch,
        accountNumber: bankDetail.accountNumber,
        accountId: bankDetail.accountId,
        is_active: bankDetail.is_active,
      });
      setErrors({});
    }
  }, [isOpen, bankDetail]);

  const handleInputChange = (field: keyof BankDetailFormData, value: any) => {
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

    // Validate bank name
    if (!formData.bankName.trim()) {
      newErrors.bankName = bankDetailErrorMessages.bankName.required;
    } else if (formData.bankName.length < bankDetailValidationRules.bankName.minLength) {
      newErrors.bankName = bankDetailErrorMessages.bankName.minLength;
    } else if (formData.bankName.length > bankDetailValidationRules.bankName.maxLength) {
      newErrors.bankName = bankDetailErrorMessages.bankName.maxLength;
    }

    // Validate branch
    if (!formData.branch.trim()) {
      newErrors.branch = bankDetailErrorMessages.branch.required;
    } else if (formData.branch.length < bankDetailValidationRules.branch.minLength) {
      newErrors.branch = bankDetailErrorMessages.branch.minLength;
    } else if (formData.branch.length > bankDetailValidationRules.branch.maxLength) {
      newErrors.branch = bankDetailErrorMessages.branch.maxLength;
    }

    // Validate account number
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = bankDetailErrorMessages.accountNumber.required;
    } else if (formData.accountNumber.length < bankDetailValidationRules.accountNumber.minLength) {
      newErrors.accountNumber = bankDetailErrorMessages.accountNumber.minLength;
    } else if (formData.accountNumber.length > bankDetailValidationRules.accountNumber.maxLength) {
      newErrors.accountNumber = bankDetailErrorMessages.accountNumber.maxLength;
    }

    // Validate account selection
    if (!formData.accountId) {
      newErrors.accountId = bankDetailErrorMessages.accountId.required;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Remove code from form data when creating (it's auto-generated)
    const submitData: BankDetailFormData = { ...formData };
    if (!bankDetail) {
      // Create new object without code for new entries
      const { code, ...dataWithoutCode } = submitData;
      await onSubmit(dataWithoutCode as BankDetailFormData);
    } else {
      await onSubmit(submitData);
    }
    
    // Reset form after successful submission (only for new entries)
    if (!bankDetail) {
      setFormData(defaultBankDetailFormData);
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
          {bankDetail ? 'Edit Bank Detail' : 'Create Bank Detail'}
        </h2>

      {isSubmitting && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code Field - Read-only */}
          <div className="space-y-2">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Code
            </label>
            <Input
              id="code"
              type="text"
              value={bankDetail ? (bankDetail.code || '') : 'Auto-generated (e.g., HAM-BANK-0001)'}
              disabled
              readOnly
              className="bg-gray-50 cursor-not-allowed text-gray-600 font-mono font-semibold"
            />
            <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
          </div>

          {/* Bank Name Field */}
          <div className="space-y-2">
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
              Bank Name *
            </label>
            <Input
              id="bankName"
              type="text"
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              disabled={isSubmitting}
              className={errors.bankName ? 'border-red-500' : ''}
              placeholder="Enter bank name"
            />
            {errors.bankName && (
              <Alert variant="error" className="text-sm">
                {errors.bankName}
              </Alert>
            )}
          </div>
        </div>

        {/* Branch Field */}
        <div className="space-y-2">
          <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
            Branch *
          </label>
          <Input
            id="branch"
            type="text"
            value={formData.branch}
            onChange={(e) => handleInputChange('branch', e.target.value)}
            disabled={isSubmitting}
            className={errors.branch ? 'border-red-500' : ''}
            placeholder="Enter branch name"
          />
          {errors.branch && (
            <Alert variant="error" className="text-sm">
              {errors.branch}
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Number Field */}
          <div className="space-y-2">
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
              Account Number *
            </label>
            <Input
              id="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              disabled={isSubmitting}
              className={errors.accountNumber ? 'border-red-500' : ''}
              placeholder="Enter account number"
            />
            {errors.accountNumber && (
              <Alert variant="error" className="text-sm">
                {errors.accountNumber}
              </Alert>
            )}
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">
              Account *
            </label>
            <SearchableDropdown
              options={accountOptions}
              value={formData.accountId}
              onChange={(value) => handleInputChange('accountId', value)}
              placeholder="Select Account"
              searchPlaceholder="Search by code, name, or type..."
              disabled={isSubmitting}
              className={errors.accountId ? 'border-red-500' : ''}
            />
            {errors.accountId && (
              <Alert variant="error" className="text-sm">
                {errors.accountId}
              </Alert>
            )}
          </div>
        </div>

        {/* Active Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Status</h3>
          
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
            {isSubmitting ? 'Saving...' : bankDetail ? 'Update Bank Detail' : 'Create Bank Detail'}
          </Button>
        </div>
      </form>
      </Card>
      </div>
    </div>
  );
};
