import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import { CustomerFormData } from '../services/customerService';

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormData>;
  customerGroups: { id: string; group_name: string; is_default?: boolean; account_receivable_id?: string; account_receivable_name?: string }[];
  loyaltyCards: { id: string; loyalty_card_name: string }[];
  onSubmit: (data: CustomerFormData) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

const schema = yup.object({
  customer_group_id: yup.string().uuid().required('Customer group is required'),
  full_name: yup.string().required('Full name is required'),
  address: yup.string().optional(),
  fax: yup.string().optional(),
  loyalty_card_number: yup.string().optional(),
  loyalty_card_config_id: yup.string().optional(),
  birthday: yup.string().optional(),
  phone_number: yup.string().optional(),
  email: yup.string().email('Invalid email').optional(),
  website: yup.string().url('Invalid website URL').optional(),
  is_active: yup.boolean().optional()
}).required();

const CustomerForm: React.FC<CustomerFormProps> = ({ initialValues, customerGroups, loyaltyCards, onSubmit, onCancel, isLoading }) => {
  const { control, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm<CustomerFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      customer_group_id: initialValues?.customer_group_id || '',
      full_name: initialValues?.full_name || '',
      address: initialValues?.address || '',
      default_receivable_account_id: initialValues?.default_receivable_account_id,
      fax: initialValues?.fax || '',
      loyalty_card_number: initialValues?.loyalty_card_number || '',
      loyalty_card_config_id: initialValues?.loyalty_card_config_id || '',
      birthday: initialValues?.birthday || '',
      phone_number: initialValues?.phone_number || '',
      email: initialValues?.email || '',
      website: initialValues?.website || '',
      is_active: initialValues?.is_active ?? true
    }
  });

  const handleGroupChange = (groupId: string) => {
    setValue('customer_group_id', groupId);
    const found = customerGroups.find(g => g.id === groupId);
    if (found?.account_receivable_id) {
      setValue('default_receivable_account_id', found.account_receivable_id);
    }
  };

  // Auto-select default customer group on create (no initialValues provided)
  useEffect(() => {
    if (!initialValues?.customer_group_id && customerGroups && customerGroups.length > 0) {
      const defaultGroup = customerGroups.find(g => g.is_default);
      if (defaultGroup) {
        setValue('customer_group_id', defaultGroup.id);
        if (defaultGroup.account_receivable_id) {
          setValue('default_receivable_account_id', defaultGroup.account_receivable_id);
        }
      }
    }
  }, [customerGroups, initialValues, setValue]);

  const selectedGroupId = watch('customer_group_id');
  const selectedGroup = customerGroups.find(g => g.id === selectedGroupId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Group */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Group *
          </label>
          <Controller
            name="customer_group_id"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                onChange={(e) => {
                  field.onChange(e);
                  handleGroupChange(e.target.value);
                }}
                disabled={isLoading}
              >
                <option value="">Select Customer Group</option>
                {customerGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.group_name}</option>
                ))}
              </select>
            )}
          />
          {errors.customer_group_id && (
            <p className="mt-1 text-sm text-red-600">{errors.customer_group_id.message}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="md:col-span-1">
          <Controller
            name="full_name"
            control={control}
            render={({ field }) => (
              <Input
                label="Full Name *"
                {...field}
                placeholder="Enter customer full name"
                error={errors.full_name?.message}
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Textarea
                label="Address"
                {...field}
                placeholder="Enter customer address"
                rows={3}
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Default Receivable Account */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Receivable Account
          </label>
          <input 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed" 
            disabled 
            value={selectedGroup?.account_receivable_name || 'Not Set'} 
          />
        </div>

        {/* Fax */}
        <div className="md:col-span-1">
          <Controller
            name="fax"
            control={control}
            render={({ field }) => (
              <Input
                label="Fax"
                {...field}
                placeholder="Enter fax number"
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Loyalty Card */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loyalty Card
          </label>
          <Controller
            name="loyalty_card_config_id"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <option value="">Select Loyalty Card</option>
                {loyaltyCards.map(c => (
                  <option key={c.id} value={c.id}>{c.loyalty_card_name}</option>
                ))}
              </select>
            )}
          />
        </div>

        {/* Loyalty Card Number */}
        <div className="md:col-span-1">
          <Controller
            name="loyalty_card_number"
            control={control}
            render={({ field }) => (
              <Input
                label="Loyalty Card Number"
                {...field}
                placeholder="Enter loyalty card number"
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Birthday */}
        <div className="md:col-span-1">
          <Controller
            name="birthday"
            control={control}
            render={({ field }) => (
              <Input
                label="Birthday"
                type="date"
                {...field}
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Phone Number */}
        <div className="md:col-span-1">
          <Controller
            name="phone_number"
            control={control}
            render={({ field }) => (
              <Input
                label="Phone Number"
                {...field}
                placeholder="Enter phone number"
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Email */}
        <div className="md:col-span-1">
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                label="Email"
                type="email"
                {...field}
                placeholder="Enter email address"
                error={errors.email?.message}
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Website */}
        <div className="md:col-span-1">
          <Controller
            name="website"
            control={control}
            render={({ field }) => (
              <Input
                label="Website"
                {...field}
                placeholder="Enter website URL"
                disabled={isLoading}
              />
            )}
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <Controller
          name="is_active"
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
                  {field.value ? 'Active' : 'Inactive'}
                </span>
              </button>
              <span className="text-xs text-gray-500">
                {field.value 
                  ? 'Customer is active and can be used in transactions' 
                  : 'Customer is inactive and cannot be used in transactions'
                }
              </span>
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
          {initialValues ? 'Update' : 'Create'} Customer
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;


