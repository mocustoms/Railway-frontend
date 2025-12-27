import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Packaging } from '../types';
import Input from './Input';
import Button from './Button';
import Select from './Select';

// Validation schema
const packagingFormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  pieces: z.number()
    .min(1, 'Pieces must be at least 1')
    .max(999999, 'Pieces must be 999,999 or less'),
  status: z.enum(['active', 'inactive'])
});

type PackagingFormData = z.infer<typeof packagingFormSchema>;

interface PackagingFormProps {
  packaging?: Packaging | null;
  onSubmit: (data: PackagingFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PackagingForm: React.FC<PackagingFormProps> = ({
  packaging,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<PackagingFormData>({
    resolver: zodResolver(packagingFormSchema),
    defaultValues: {
      name: packaging?.name || '',
      pieces: packaging?.pieces || 1,
      status: packaging?.status || 'active'
    },
    mode: 'onChange'
  });

  const handleFormSubmit = (data: PackagingFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code - Display only when editing */}
        {packaging && (
          <Input
            label="Packaging Code"
            value={packaging.code || ''}
            disabled
            readOnly
          />
        )}
        
        <Input
          label="Packaging Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Enter packaging name"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          type="number"
          label="Number of Pieces"
          {...register('pieces', { valueAsNumber: true })}
          error={errors.pieces?.message}
          placeholder="Enter number of pieces"
          min={1}
          max={999999}
          required
          disabled={isLoading}
        />
        
        <Select
          label="Status"
          {...register('status')}
          error={errors.status?.message}
          required
          disabled={isLoading}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
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
          disabled={isLoading || !isValid}
          loading={isLoading}
        >
          {packaging ? 'Update Packaging' : 'Create Packaging'}
        </Button>
      </div>
    </form>
  );
};

export default PackagingForm;
