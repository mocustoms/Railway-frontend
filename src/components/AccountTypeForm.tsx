import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AccountType } from '../types';

interface AccountTypeFormData {
  name: string;
  description?: string;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  nature: 'DEBIT' | 'CREDIT';
  isActive: boolean;
}

interface AccountTypeFormProps {
  accountType?: AccountType;
  onSubmit: (data: AccountTypeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const accountTypeSchema: yup.ObjectSchema<AccountTypeFormData> = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  description: yup
    .string()
    .optional()
    .max(500, 'Description must not exceed 500 characters'),
  category: yup
    .string()
    .required('Category is required')
    .oneOf(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const),
  nature: yup
    .string()
    .required('Nature is required')
    .oneOf(['DEBIT', 'CREDIT'] as const),
  isActive: yup
    .boolean()
    .required('Status is required')
});

const AccountTypeForm: React.FC<AccountTypeFormProps> = ({
  accountType,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AccountTypeFormData>({
    resolver: yupResolver(accountTypeSchema),
    defaultValues: {
      name: accountType?.name || '',
      description: accountType?.description || '',
      category: accountType?.category || 'ASSET',
      nature: accountType?.nature || 'DEBIT',
      isActive: accountType?.isActive ?? true
    }
  });

  const handleFormSubmit = async (data: AccountTypeFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error is already handled by the parent component with toast notifications
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Account Type Code - Display preview when creating, actual code when editing */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
          Account Type Code
        </label>
        <input
          type="text"
          id="code"
          value={accountType ? (accountType.code || '') : 'Auto-generated (e.g., HAM-AT-0001)'}
          className="w-full px-3 py-2 border rounded-md shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
          disabled
          readOnly
        />
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          placeholder="Enter account type name"
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Category and Nature Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            {...register('category')}
            id="category"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.category ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select Category</option>
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expense</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="nature" className="block text-sm font-medium text-gray-700 mb-1">
            Nature *
          </label>
          <select
            {...register('nature')}
            id="nature"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.nature ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select Nature</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>
          {errors.nature && (
            <p className="mt-1 text-sm text-red-600">{errors.nature.message}</p>
          )}
        </div>
      </div>

      {/* Status and Description Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
                         {...register('isActive')}
                         id="isActive"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.isActive ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
                     {errors.isActive && (
             <p className="mt-1 text-sm text-red-600">{errors.isActive.message}</p>
           )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            placeholder="Enter a description (optional)"
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
              {accountType ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            accountType ? 'Update Account Type' : 'Create Account Type'
          )}
        </button>
      </div>
    </form>
  );
};

export default AccountTypeForm; 