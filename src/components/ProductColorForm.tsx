import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductColor } from '../types';
import { defaultProductColorFormData, productColorValidationRules } from '../data/productColorModules';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import Select from './Select';
import ColorPicker from './ColorPicker';

// Validation schema
const productColorSchema = z.object({
  name: z.string()
    .min(1, 'Color name is required')
    .max(100, 'Name must not exceed 100 characters'),
  hex_code: z.string()
    .min(1, 'Hex code is required')
    .regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color code (e.g., #FF0000)'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  is_active: z.boolean()
});

type ProductColorFormData = z.infer<typeof productColorSchema>;

interface ProductColorFormProps {
  productColor?: ProductColor | null;
  onSubmit: (data: Partial<ProductColor>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProductColorForm: React.FC<ProductColorFormProps> = ({
  productColor,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [selectedColor, setSelectedColor] = useState('#000000');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<ProductColorFormData>({
    resolver: zodResolver(productColorSchema),
    defaultValues: productColor ? {
      name: productColor.name,
      hex_code: productColor.hex_code,
      description: productColor.description || '',
      is_active: productColor.is_active
    } : defaultProductColorFormData
  });

  const watchedHexCode = watch('hex_code');

  // Update color picker when hex code changes
  useEffect(() => {
    if (watchedHexCode) {
      setSelectedColor(watchedHexCode);
    }
  }, [watchedHexCode]);

  // Update form when color picker changes
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setValue('hex_code', color);
  };

  const handleFormSubmit = async (data: ProductColorFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color Name */}
        <div>
          <Input
            label="Color Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Enter color name"
            required
          />
        </div>

        {/* Color Code - Display only when editing */}
        {productColor && (
          <div>
            <Input
              label="Color Code"
              value={productColor.code}
              disabled
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
          </div>
        )}
      </div>

      {/* Color Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Preview
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              {...register('hex_code')}
              error={errors.hex_code?.message}
              placeholder="#000000"
              required
            />
          </div>
          <div 
            className="w-12 h-12 rounded border border-gray-300"
            style={{ backgroundColor: selectedColor }}
            title={selectedColor}
          />
        </div>
        <div className="mt-2">
          <ColorPicker
            color={selectedColor}
            onChange={handleColorChange}
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <Select
          label="Status"
          {...register('is_active')}
          error={errors.is_active?.message}
          required
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      {/* Description */}
      <div>
        <Textarea
          label="Description"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Enter color description (optional)"
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isLoading}
          loading={isSubmitting || isLoading}
        >
          {productColor ? 'Update Product Color' : 'Create Product Color'}
        </Button>
      </div>
    </form>
  );
};

export default ProductColorForm;
