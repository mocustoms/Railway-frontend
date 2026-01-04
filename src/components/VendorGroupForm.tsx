import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import { VendorGroup, VendorGroupFormData } from '../services/vendorGroupService';

interface VendorGroupFormProps {
  vendorGroup?: VendorGroup;
  accounts?: any[];
  liabilityAccounts?: any[];
  onSubmit: (data: VendorGroupFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const validationSchema = yup.object({
  group_name: yup
    .string()
    .required('Group name is required')
    .min(1, 'Group name must not be empty')
    .max(100, 'Group name must not exceed 100 characters'),
  is_default: yup.boolean().required(),
  description: yup
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  account_payable_id: yup
    .string()
    .optional(),
  default_liability_account_id: yup
    .string()
    .optional()
});

const VendorGroupForm: React.FC<VendorGroupFormProps> = ({
  vendorGroup,
  accounts = [],
  liabilityAccounts = [],
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm<VendorGroupFormData>({
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
    defaultValues: {
      group_name: '',
      is_default: false,
      description: '',
      account_payable_id: '',
      default_liability_account_id: ''
    }
  });

  // Reset form when vendor group changes
  useEffect(() => {
    if (vendorGroup) {
      reset({
        group_name: vendorGroup.group_name,
        is_default: vendorGroup.is_default,
        description: vendorGroup.description || '',
        account_payable_id: vendorGroup.account_payable_id || '',
        default_liability_account_id: vendorGroup.default_liability_account_id || ''
      });
    } else {
      reset({
        group_name: '',
        is_default: false,
        description: '',
        account_payable_id: '',
        default_liability_account_id: ''
      });
    }
  }, [vendorGroup, reset]);

  const handleFormSubmit = async (data: VendorGroupFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Group Name */}
        <div className="md:col-span-1">
          <Controller
            name="group_name"
            control={control}
            render={({ field }) => (
              <Input
                label="Group Name *"
                {...field}
                placeholder="Enter group name"
                error={errors.group_name?.message}
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Group Code - Read-only when editing */}
        {vendorGroup && (
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Code
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
              {vendorGroup.group_code}
            </div>
            <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
          </div>
        )}
      </div>

      {/* Is Default Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Group
        </label>
        <Controller
          name="is_default"
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                disabled={isLoading}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                <div className={`w-12 h-6 rounded-full transition-colors ${
                  field.value ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    field.value ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
                <span className="text-sm font-medium">
                  {field.value ? 'Yes' : 'No'}
                </span>
              </button>
            </div>
          )}
        />
      </div>

      {/* Description */}
      <div>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              label="Description"
              {...field}
              placeholder="Enter description (optional)"
              error={errors.description?.message}
              rows={3}
              disabled={isLoading}
            />
          )}
        />
      </div>

      {/* Account Payable */}
      <div>
        <Controller
          name="account_payable_id"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Account Payable
              </label>
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <option value="">Select Account Payable (Optional)</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
              {errors.account_payable_id && (
                <p className="mt-1 text-sm text-red-600">{errors.account_payable_id.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Default Liability Account */}
      <div>
        <Controller
          name="default_liability_account_id"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Liability Account
              </label>
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <option value="">Select Liability Account (Optional)</option>
                {liabilityAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
              {errors.default_liability_account_id && (
                <p className="mt-1 text-sm text-red-600">{errors.default_liability_account_id.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          loading={isLoading}
        >
          {vendorGroup ? 'Update' : 'Create'} Group
        </Button>
      </div>
    </form>
  );
};

export default VendorGroupForm;

