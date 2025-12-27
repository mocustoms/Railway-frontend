import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  MapPin,
  Shield,
  Store,
  Plus,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { UserFormData, User, Store as StoreType } from '../types';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';
import SearchableMultiSelect from './SearchableMultiSelect';
import { userManagementConfig } from '../data/userManagementConfig';

// Validation schema
const validationSchema = yup.object({
  first_name: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  last_name: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .when('$isEdit', {
      is: false,
      then: (schema) => schema.required('Password is required'),
      otherwise: (schema) => schema.optional()
    })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['admin', 'manager', 'cashier'], 'Please select a valid role'),
  phone: yup
    .string()
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  address: yup
    .string()
    .optional()
    .max(500, 'Address must be less than 500 characters'),
  is_active: yup.boolean(),
  approval_status: yup
    .string()
    .oneOf(['pending', 'approved', 'rejected'], 'Please select a valid approval status')
});

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  stores?: StoreType[];
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
  stores = []
}) => {
  const isEdit = !!user;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<UserFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
      role: 'cashier',
      phone: '',
      address: '',
      is_active: true,
      approval_status: 'pending',
      store_assignments: []
    }
  });

  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        password: '', // Don't pre-fill password
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        is_active: user.is_active,
        approval_status: user.approval_status,
        store_assignments: []
      });
      
      // Set selected store IDs
      if (user.assignedStores && user.assignedStores.length > 0) {
        setSelectedStoreIds(
          user.assignedStores.map((store: any) => store.id)
        );
      }
    }
  }, [user, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    // Create store assignments from selected store IDs
    const storeAssignments = selectedStoreIds.map(storeId => ({
      store_id: storeId,
      role: 'cashier' as const, // Default role for all stores
      is_active: true  // Default to active
    }));

    const formData = {
      ...data,
      store_assignments: storeAssignments
    };
    onSubmit(formData);
  };

  const handleStoreSelection = (storeIds: string[]) => {
    setSelectedStoreIds(storeIds);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <UserIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('first_name')}
              placeholder="Enter first name"
              error={errors.first_name?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('last_name')}
              placeholder="Enter last name"
              error={errors.last_name?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('username')}
              placeholder="Enter username"
              error={errors.username?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="Enter email address"
              error={errors.email?.message}
            />
          </div>
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('password')}
              type="password"
              placeholder="Enter password"
              error={errors.password?.message}
            />
          </div>
        )}
      </div>

      {/* Role and Status */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Role & Status</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <Select
              {...register('role')}
              error={errors.role?.message}
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Approval Status
            </label>
            <Select
              {...register('approval_status')}
              error={errors.approval_status?.message}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            {...register('is_active')}
            type="checkbox"
            id="is_active"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active User
          </label>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Phone className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <Input
            {...register('phone')}
            placeholder="Enter phone number"
            error={errors.phone?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <Textarea
            {...register('address')}
            placeholder="Enter address"
            rows={3}
            error={errors.address?.message}
          />
        </div>
      </div>

      {/* Store Assignments */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Store className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Store Assignments</h3>
        </div>

              <SearchableMultiSelect
                label="Select Stores"
                options={stores.map(store => ({ id: store.id, name: store.name }))}
                value={selectedStoreIds}
                onChange={handleStoreSelection}
                placeholder="Select stores for this user..."
                className="w-full"
              />

        {selectedStoreIds.length > 0 && (
          <div className="text-sm text-gray-600">
            <p className="font-medium">Selected Stores:</p>
            <ul className="list-disc list-inside mt-1">
              {selectedStoreIds.map(storeId => {
                const store = stores.find(s => s.id === storeId);
                return (
                  <li key={storeId} className="text-gray-700">
                    {store?.name || 'Unknown Store'} (Role: Cashier)
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>{isEdit ? 'Update User' : 'Create User'}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
