import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ProductBrandName, ProductBrandNameFormData } from '../types';
import { defaultProductBrandNameFormData, productBrandNameValidationRules, logoUploadConfig } from '../data/productBrandNameModules';
import Input from './Input';
import Textarea from './Textarea';
import Select from './Select';
import Button from './Button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { getLogoUrl } from '../services/productBrandNameService';

// Validation rules for React Hook Form
const validationRules = {
  name: {
    required: productBrandNameValidationRules.name.required,
    minLength: {
      value: productBrandNameValidationRules.name.minLength.value,
      message: productBrandNameValidationRules.name.minLength.message
    },
    maxLength: {
      value: productBrandNameValidationRules.name.maxLength.value,
      message: productBrandNameValidationRules.name.maxLength.message
    }
  },
  description: {
    maxLength: {
      value: productBrandNameValidationRules.description.maxLength.value,
      message: productBrandNameValidationRules.description.maxLength.message
    }
  }
};

interface ProductBrandNameFormProps {
  productBrandName?: ProductBrandName;
  onSubmit: (data: ProductBrandNameFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProductBrandNameForm: React.FC<ProductBrandNameFormProps> = ({
  productBrandName,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<ProductBrandNameFormData>({
    mode: 'onChange',
    defaultValues: productBrandName ? {
      name: productBrandName.name,
      description: productBrandName.description || '',
      logo: null,
      is_active: productBrandName.is_active
    } : defaultProductBrandNameFormData
  });

  const watchedLogo = watch('logo');

  // Handle logo file selection
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > logoUploadConfig.maxSize) {
        alert(productBrandNameValidationRules.logo.fileSize.message);
        return;
      }

      // Validate file type
      if (!logoUploadConfig.allowedTypes.includes(file.type)) {
        alert(productBrandNameValidationRules.logo.fileType.message);
        return;
      }

      setSelectedLogo(file);
      setValue('logo', file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setSelectedLogo(null);
    setLogoPreview(null);
    setValue('logo', null);
    const fileInput = document.getElementById('logo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: ProductBrandNameFormData) => {
    try {
      await onSubmit(data);
      reset();
      setLogoPreview(null);
      setSelectedLogo(null);
    } catch (error) {
      }
  };

  // Set initial logo preview if editing
  useEffect(() => {
    if (productBrandName?.logo) {
      setLogoPreview(getLogoUrl(productBrandName.logo));
    }
  }, [productBrandName]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand Name Code - Display only when editing */}
        {productBrandName && (
          <div className="md:col-span-1">
            <Input
              label="Brand Name Code"
              value={productBrandName.code || ''}
              disabled
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
          </div>
        )}

        {/* Brand Name */}
        <div className="md:col-span-1">
          <Input
            label="Brand Name *"
            {...register('name', validationRules.name)}
            error={errors.name?.message}
            placeholder="Enter brand name"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <Textarea
          label="Description"
          {...register('description', validationRules.description)}
          error={errors.description?.message}
          placeholder="Enter brand name description"
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo
        </label>
        <div className="space-y-4">
          {/* File Input */}
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Upload className="h-4 w-4 mr-2" />
              Choose Logo
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            {selectedLogo && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>

          {/* Logo Preview */}
          {logoPreview && (
            <div className="relative inline-block">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-20 w-20 object-cover rounded-lg border border-gray-300"
              />
            </div>
          )}

          {/* Logo Info */}
          <div className="text-sm text-gray-500">
            <p>Supported formats: JPEG, PNG, GIF, WebP</p>
            <p>Maximum file size: 5MB</p>
          </div>

          {errors.logo && (
            <p className="text-sm text-red-600">{errors.logo.message}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <Select
          label="Status *"
          {...register('is_active', { required: 'Status is required' })}
          error={errors.is_active?.message}
          disabled={isLoading}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
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
          {productBrandName ? 'Update' : 'Create'} Brand Name
        </Button>
      </div>
    </form>
  );
};

export default ProductBrandNameForm;
