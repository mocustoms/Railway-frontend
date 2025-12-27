import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StoreLocation, Packaging } from '../types';
import Input from './Input';
import Button from './Button';
import Select from './Select';
import Toggle from './Toggle';

// Interface for store dropdown (only what we need)
interface StoreOption {
  id: string;
  name: string;
  location?: string;
}

// Validation schema
const storeLocationFormSchema = z.object({
  store_id: z.string().min(1, 'Store selection is required'),
  location_code: z.string().optional(), // Code is auto-generated, optional in form
  location_name: z.string()
    .min(1, 'Location name is required')
    .max(255, 'Location name must be 255 characters or less'),
  location_capacity: z.union([
    z.number().min(0, 'Capacity must be 0 or greater').max(999999, 'Capacity must be 999,999 or less'),
    z.undefined(),
    z.null()
  ]).optional(),
  packaging_type: z.array(z.string())
    .min(1, 'At least one packaging type must be selected'),
  is_active: z.boolean()
});

type StoreLocationFormData = z.infer<typeof storeLocationFormSchema>;

interface StoreLocationFormProps {
  storeLocation?: StoreLocation | null;
  stores: StoreOption[];
  packagingTypes: Packaging[];
  onSubmit: (data: StoreLocationFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const StoreLocationForm: React.FC<StoreLocationFormProps> = ({
  storeLocation,
  stores,
  packagingTypes,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset,
    trigger
  } = useForm<StoreLocationFormData>({
    resolver: zodResolver(storeLocationFormSchema),
    defaultValues: {
      store_id: storeLocation?.store_id || '',
      location_code: storeLocation?.location_code || '',
      location_name: storeLocation?.location_name || '',
      location_capacity: storeLocation?.location_capacity,
      packaging_type: storeLocation?.packaging_type || [],
      is_active: storeLocation?.is_active ?? true
    },
    mode: 'onChange'
  });

  const watchedPackagingType = watch('packaging_type');

  // Reset form when storeLocation changes
  React.useEffect(() => {
    if (storeLocation) {
      reset({
        store_id: storeLocation.store_id || '',
        location_code: storeLocation.location_code || '',
        location_name: storeLocation.location_name || '',
        location_capacity: storeLocation.location_capacity,
        packaging_type: storeLocation.packaging_type || [],
        is_active: storeLocation.is_active ?? true
      });
    } else {
      reset({
        store_id: '',
        location_code: '',
        location_name: '',
        location_capacity: undefined,
        packaging_type: [],
        is_active: true
      });
    }
  }, [storeLocation, reset]);

  const handleFormSubmit = (data: StoreLocationFormData) => {
    // Remove location_code from form data when creating (it's auto-generated)
    const submitData: StoreLocationFormData = { ...data };
    if (!storeLocation) {
      const { location_code, ...dataWithoutCode } = submitData;
      onSubmit(dataWithoutCode as StoreLocationFormData);
      // Reset form after successful submission for new entries
      reset({
        store_id: '',
        location_code: '',
        location_name: '',
        location_capacity: undefined,
        packaging_type: [],
        is_active: true
      });
    } else {
      onSubmit(submitData);
    }
  };

  const handlePackagingTypeChange = (packagingId: string, checked: boolean) => {
    const currentTypes = watch('packaging_type');
    if (checked) {
      setValue('packaging_type', [...currentTypes, packagingId], { shouldValidate: true });
    } else {
      setValue('packaging_type', currentTypes.filter(id => id !== packagingId), { shouldValidate: true });
    }
    // Trigger validation to update isValid state
    trigger('packaging_type');
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Store *"
          {...register('store_id')}
          error={errors.store_id?.message}
          required
          disabled={isLoading}
        >
          <option value="">Select Store</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </Select>
        
        <Input
          label="Location Code"
          value={storeLocation ? (storeLocation.location_code || '') : 'Auto-generated (e.g., HAM-LOC-0001)'}
          disabled
          readOnly
          className="bg-gray-50 cursor-not-allowed text-gray-600 font-mono font-semibold"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Location Name *"
          {...register('location_name')}
          error={errors.location_name?.message}
          placeholder="Enter location name (e.g., Aisle 1, Shelf 1)"
          required
          disabled={isLoading}
        />
        
        <Input
          type="number"
          label="Location Capacity"
          {...register('location_capacity', { 
            valueAsNumber: true,
            setValueAs: (value) => value === '' ? undefined : Number(value)
          })}
          error={errors.location_capacity?.message}
          placeholder="Number of items"
          min={0}
          max={999999}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Packaging Type <span className="text-red-500">*</span>
        </label>
        
        {packagingTypes.length === 0 ? (
          <div className="text-sm text-gray-500">Loading packaging types...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {packagingTypes.map(packaging => (
              <label key={packaging.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={watchedPackagingType.includes(packaging.id)}
                  onChange={(e) => handlePackagingTypeChange(packaging.id, e.target.checked)}
                  disabled={isLoading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {packaging.name} ({packaging.pieces} {packaging.code})
                </span>
              </label>
            ))}
          </div>
        )}
        
        {errors.packaging_type && (
          <p className="text-sm text-red-600">{errors.packaging_type.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <Toggle
          id="isActive"
          checked={watch('is_active')}
          onChange={(checked) => setValue('is_active', checked)}
          disabled={isLoading}
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
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
          variant="primary"
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Saving...' : storeLocation ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default StoreLocationForm;
