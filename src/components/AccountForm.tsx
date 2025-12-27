import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Account } from '../types';
import { validationRules } from '../data/chartOfAccountsModules';

interface AccountFormData {
  name: string;
  description?: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  accountTypeId?: string;
  parentId?: string | null;
  status: 'active' | 'inactive';
}

interface AccountFormProps {
  account?: Account;
  parentId?: string;
  accountType?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  selectedAccountTypeId?: string;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  availableParents: { id: string; name: string; level: number; type: string; accountTypeId?: string }[];
  availableAccountTypes: { id: string; name: string; category: string; nature: string }[];
}

const accountSchema: yup.ObjectSchema<AccountFormData> = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(validationRules.name.minLength, `Name must be at least ${validationRules.name.minLength} characters`)
    .max(validationRules.name.maxLength, `Name must not exceed ${validationRules.name.maxLength} characters`),
  description: yup
    .string()
    .optional()
    .max(validationRules.description.maxLength, validationRules.description.message),
  type: yup
    .string()
    .required('Type is required')
    .oneOf(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const),
  accountTypeId: yup
    .string()
    .required('Account Type is required'),
  parentId: yup
    .string()
    .nullable()
    .optional(),
  status: yup
    .string()
    .required('Status is required')
    .oneOf(['active', 'inactive'] as const)
});

const AccountForm: React.FC<AccountFormProps> = ({
  account,
  parentId,
  accountType,
  selectedAccountTypeId,
  onSubmit,
  onCancel,
  isLoading = false,
  availableParents,
  availableAccountTypes
}) => {

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<AccountFormData>({
    resolver: yupResolver(accountSchema),
    defaultValues: {
      name: account?.name || '',
      description: account?.description || '',
      type: account?.type || accountType || 'ASSET',
      accountTypeId: account?.accountTypeId || selectedAccountTypeId || '',
      parentId: account?.parentId || parentId || null,
      status: account?.status || 'active'
    }
  });

  const watchedType = watch('type');
  const watchedAccountTypeId = watch('accountTypeId');

  // Update accountTypeId when selectedAccountTypeId changes
  // This ensures that when clicking + on an account type, the correct accountTypeId is set
  useEffect(() => {
    if (selectedAccountTypeId && !account?.accountTypeId) {
      setValue('accountTypeId', selectedAccountTypeId, { shouldValidate: false });
      // Also ensure the type matches the account type's category
      const accountType = availableAccountTypes.find(at => at.id === selectedAccountTypeId);
      if (accountType && accountType.category !== watchedType) {
        setValue('type', accountType.category as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE', { shouldValidate: false });
      }
    }
  }, [selectedAccountTypeId, account?.accountTypeId, setValue, availableAccountTypes, watchedType]);

  // Update parentId when prop changes (for "Add Child" functionality)
  useEffect(() => {
    if (!account && parentId !== null && parentId !== undefined) {
      setValue('parentId', parentId, { shouldValidate: false });
    } else if (!account && parentId === null) {
      setValue('parentId', null, { shouldValidate: false });
    }
  }, [parentId, account, setValue]);

  // Update type when accountType prop changes (for "Add Child" functionality)
  useEffect(() => {
    if (!account && accountType) {
      setValue('type', accountType);
    }
  }, [accountType, account, setValue]);

  // Code is auto-generated, no need for suggestions or validation

  // Auto-select Account Type based on Type selection
  useEffect(() => {
    // CRITICAL: If accountTypeId is already provided (from Add Child or Add to Type), use it
    // This takes priority to ensure the correct account type is selected
    if (selectedAccountTypeId && !account?.accountTypeId) {
      setValue('accountTypeId', selectedAccountTypeId, { shouldValidate: false });
      return; // Exit early to prevent auto-selection logic
    } 
    // When Type changes (including during editing), update accountTypeId to match
    if (watchedType) {
      // Find matching AccountType based on selected Type
      // If editing and account already has accountTypeId, check if it still matches the type
      if (account?.accountTypeId) {
        const currentAccountType = availableAccountTypes.find(at => at.id === account.accountTypeId);
        // If current accountType's category doesn't match selected type, find a new one
        if (currentAccountType && currentAccountType.category !== watchedType) {
          const matchingAccountType = availableAccountTypes.find(
            at => at.category === watchedType
          );
          if (matchingAccountType) {
            setValue('accountTypeId', matchingAccountType.id, { shouldValidate: false });
          }
        }
      } else {
        // No accountTypeId set yet, find matching AccountType
      const matchingAccountType = availableAccountTypes.find(
        at => at.category === watchedType
      );
      if (matchingAccountType) {
          setValue('accountTypeId', matchingAccountType.id, { shouldValidate: false });
        }
      }
    }
  }, [watchedType, selectedAccountTypeId, account?.accountTypeId, availableAccountTypes, setValue]);

  // Filter available parents based on selected account type
  const filteredAvailableParents = useMemo(() => {
    // If a parentId is already set (from Add Child), always include it
    if (parentId) {
      // Find the parent account in the list
      const parentAccount = availableParents.find(p => p.id === parentId);
      if (parentAccount) {
        // Return all parents of the same type, plus the selected parent
        // Prioritize filtering by Type (category) so user sees all accounts of that type
        const filtered = availableParents.filter(parent => {
          const matchesType = watchedType && parent.type === watchedType;
          return matchesType || parent.id === parentId;
        });
        return filtered;
      }
    }

    // PRIORITY: If Type is selected, filter by Type (category) to show ALL accounts of that type
    // This ensures when user selects "ASSET", they see all ASSET accounts, not just one accountTypeId
    if (watchedType) {
      const filtered = availableParents.filter(parent => {
        // Include Account Type nodes that match the selected type
        if (parent.id?.startsWith('type-')) {
          return parent.type === watchedType;
        }
        // Include all regular accounts that match the type
        return parent.type === watchedType;
      });
      return filtered;
    }

    // Fallback: If accountTypeId is set but no Type, filter by accountTypeId
    if (watchedAccountTypeId) {
      const filtered = availableParents.filter(parent => {
        // Filter by accountTypeId - parent must have the same accountTypeId
        const matchesAccountType = parent.accountTypeId === watchedAccountTypeId;
        return matchesAccountType;
      });
      return filtered;
    }

    // No filtering if neither accountTypeId nor type is set
    return availableParents;
  }, [availableParents, watchedAccountTypeId, watchedType, parentId]);

  const handleFormSubmit = async (data: AccountFormData) => {
    // Convert empty string parentId to null
    // Also convert Account Type node IDs (type-*) to null since Account Types can't be actual parents
    const formData = {
      ...data,
      parentId: data.parentId === '' || (data.parentId && data.parentId.startsWith('type-')) 
        ? null 
        : data.parentId
    };
    
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error is already handled by the parent component with toast notifications
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-info-circle text-blue-600"></i>
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fas fa-font text-blue-600 mr-2"></i>
              Name *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              placeholder="Enter account name"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Account Code - Display preview when creating, actual code when editing */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fas fa-hashtag text-blue-600 mr-2"></i>
              Account Code
            </label>
            <input
              type="text"
              id="code"
              value={account ? (account.code || '') : 'Auto-generated (e.g., HAM-ACC-0001)'}
              className="w-full px-3 py-2 border rounded-md shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300 font-mono font-semibold"
              disabled
              readOnly
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fas fa-layer-group text-blue-600 mr-2"></i>
              Type *
            </label>
            <select
              {...register('type')}
              id="type"
              disabled={isLoading || !!accountType}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              } ${accountType ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium' : ''}`}
            >
              <option value="">Select Type</option>
              <option value="ASSET">Asset</option>
              <option value="LIABILITY">Liability</option>
              <option value="EQUITY">Equity</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expense</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Account Type - Hidden, auto-selected based on Type */}
          <input
            type="hidden"
            {...register('accountTypeId')}
          />
          {errors.accountTypeId && (
            <p className="mt-1 text-sm text-red-600">Please select a Type above</p>
          )}

          {/* Parent Account */}
          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fas fa-sitemap text-blue-600 mr-2"></i>
              Parent Account
            </label>
            <select
              {...register('parentId')}
              id="parentId"
              disabled={isLoading || !!parentId}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.parentId ? 'border-red-300' : 'border-gray-300'
              } ${parentId ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              <option value="">None (Root)</option>
              {filteredAvailableParents.map((parent: { id: string; name: string; level: number; type: string; accountTypeId?: string }) => (
                <option key={parent.id} value={parent.id}>
                  {'--'.repeat(parent.level)} {parent.name}
                </option>
              ))}
            </select>
            {errors.parentId && (
              <p className="mt-1 text-sm text-red-600">{errors.parentId.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              <i className="fas fa-toggle-on text-blue-600 mr-2"></i>
              Status
            </label>
            <select
              {...register('status')}
              id="status"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.status ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-align-left text-green-600"></i>
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Description</h4>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            <i className="fas fa-file-text text-green-600 mr-2"></i>
            Description
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            placeholder="Enter a description for this account (optional)"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {account ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            account ? 'Update Account' : 'Create Account'
          )}
        </button>
      </div>
    </form>
  );
};

export default AccountForm; 