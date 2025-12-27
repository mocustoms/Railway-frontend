import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductManufacturer } from '../types';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import productManufacturerService from '../services/productManufacturerService';

// Validation schema
const productManufacturerSchema = z.object({
  name: z.string()
    .min(1, 'Manufacturer name is required')
    .max(255, 'Name must not exceed 255 characters'),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  website: z.string()
    .optional()
    .refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
      message: 'Website must be a valid URL'
    }),
  contact_email: z.string()
    .optional()
    .refine((val) => !val || val === '' || z.string().email().safeParse(val).success, {
      message: 'Contact email must be a valid email address'
    }),
  contact_phone: z.string()
    .optional()
    .refine((val) => !val || val === '' || /^\+255\s?[67]\d{2}\s?\d{3}\s?\d{3}$/.test(val), {
      message: 'Phone number must be in Tanzania format: +255 7XX XXX XXX or +255 6XX XXX XXX'
    }),
  address: z.string()
    .max(500, 'Address must not exceed 500 characters')
    .optional(),
  country: z.string()
    .max(100, 'Country must not exceed 100 characters')
    .optional(),
  is_active: z.boolean()
});

type ProductManufacturerFormData = z.infer<typeof productManufacturerSchema>;

interface ProductManufacturerFormProps {
  manufacturer?: ProductManufacturer | null;
  onSubmit: (data: Partial<ProductManufacturer>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProductManufacturerForm: React.FC<ProductManufacturerFormProps> = ({
  manufacturer,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ProductManufacturerFormData>({
    resolver: zodResolver(productManufacturerSchema),
    defaultValues: manufacturer ? {
      name: manufacturer.name,
      description: manufacturer.description || '',
      website: manufacturer.website || '',
      contact_email: manufacturer.contact_email || '',
      contact_phone: manufacturer.contact_phone || '',
      address: manufacturer.address || '',
      country: manufacturer.country || '',
      is_active: manufacturer.is_active
    } : {
      name: '',
      description: '',
      website: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      country: '',
      is_active: true
    }
  });

  // Set logo preview when manufacturer changes
  useEffect(() => {
    if (manufacturer?.logo) {
      setLogoPreview(productManufacturerService.getLogoUrl(manufacturer.logo));
    } else {
      setLogoPreview('');
    }
    setLogoFile(null);
  }, [manufacturer]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setLogoPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
      }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const handleFormSubmit = async (data: ProductManufacturerFormData) => {
    try {
      // Clean up empty string values - convert to undefined for optional fields
      const submitData: any = {
        name: data.name,
        description: data.description || undefined,
        website: data.website && data.website.trim() !== '' ? data.website : undefined,
        contact_email: data.contact_email && data.contact_email.trim() !== '' ? data.contact_email : undefined,
        contact_phone: data.contact_phone && data.contact_phone.trim() !== '' ? data.contact_phone : undefined,
        address: data.address || undefined,
        country: data.country || undefined,
        is_active: data.is_active
      };
      
      if (logoFile) {
        submitData.logo = logoFile;
      }
      
      await onSubmit(submitData);
      reset();
    } catch (error) {
      // Error handling is done by the form's error state
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Logo Upload Section */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Manufacturer Logo
        </label>
        <div className="flex items-center space-x-4">
                                {logoPreview ? (
             <div className="relative">
               <img
                 src={logoPreview}
                 alt="Logo preview"
                 className="w-20 h-20 rounded-lg object-cover border"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                 }}
                 onLoad={() => {
                   }}
               />
               <button
                 type="button"
                 onClick={removeLogo}
                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
               >
                 <X size={12} />
               </button>
             </div>
           ) : (
             <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
               <ImageIcon className="w-8 h-8 text-gray-400" />
             </div>
           )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Logo
            </label>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manufacturer Code - Display only when editing */}
        {manufacturer && (
          <Input
            label="Manufacturer Code"
            value={manufacturer.code}
            disabled
            readOnly
          />
        )}

        {/* Manufacturer Name */}
        <Input
          label="Manufacturer Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Enter manufacturer name"
          required
        />
      </div>

      {/* Description */}
      <Textarea
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Enter manufacturer description"
        rows={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Website */}
        <Input
          label="Website"
          {...register('website')}
          error={errors.website?.message}
          placeholder="https://example.com"
          type="url"
        />

        {/* Contact Email */}
        <Input
          label="Contact Email"
          {...register('contact_email')}
          error={errors.contact_email?.message}
          placeholder="contact@example.com"
          type="email"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Phone */}
        <div>
          <Input
            label="Contact Phone"
            {...register('contact_phone')}
            error={errors.contact_phone?.message}
            placeholder="+255 7XX XXX XXX"
            type="tel"
          />
          <p className="mt-1 text-sm text-gray-500">
            Format: +255 7XX XXX XXX or +255 6XX XXX XXX (Tanzania)
          </p>
        </div>

        {/* Country */}
        <Input
          label="Country"
          {...register('country')}
          error={errors.country?.message}
          placeholder="Enter country"
        />
      </div>

      {/* Address */}
      <Textarea
        label="Address"
        {...register('address')}
        error={errors.address?.message}
        placeholder="Enter full address"
        rows={2}
      />

      {/* Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          {...register('is_active')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Active
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
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
        >
          {isSubmitting || isLoading ? 'Saving...' : manufacturer ? 'Update Manufacturer' : 'Create Manufacturer'}
        </Button>
      </div>
    </form>
  );
};

export default ProductManufacturerForm;
