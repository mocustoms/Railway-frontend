import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SalesAgent, SalesAgentFormData } from '../types';
import { defaultSalesAgentFormData, salesAgentValidationRules, photoUploadConfig } from '../data/salesAgentModules';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import { Upload, X, User } from 'lucide-react';
import { salesAgentService } from '../services/salesAgentService';

// Validation rules for React Hook Form
const validationRules = {
  agentNumber: {
    required: salesAgentValidationRules.agentNumber.required,
    minLength: {
      value: salesAgentValidationRules.agentNumber.minLength.value,
      message: salesAgentValidationRules.agentNumber.minLength.message
    },
    maxLength: {
      value: salesAgentValidationRules.agentNumber.maxLength.value,
      message: salesAgentValidationRules.agentNumber.maxLength.message
    },
    pattern: {
      value: salesAgentValidationRules.agentNumber.pattern.value,
      message: salesAgentValidationRules.agentNumber.pattern.message
    }
  },
  fullName: {
    required: salesAgentValidationRules.fullName.required,
    minLength: {
      value: salesAgentValidationRules.fullName.minLength.value,
      message: salesAgentValidationRules.fullName.minLength.message
    },
    maxLength: {
      value: salesAgentValidationRules.fullName.maxLength.value,
      message: salesAgentValidationRules.fullName.maxLength.message
    }
  }
};

interface SalesAgentFormProps {
  salesAgent?: SalesAgent;
  onSubmit: (data: SalesAgentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const SalesAgentForm: React.FC<SalesAgentFormProps> = ({
  salesAgent,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const defaultValues = salesAgent ? {
    agentNumber: salesAgent.agentNumber,
    fullName: salesAgent.fullName,
    photo: null,
    status: salesAgent.status
  } : defaultSalesAgentFormData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<SalesAgentFormData>({
    mode: 'onChange',
    defaultValues: defaultValues as SalesAgentFormData
  });

  const watchedPhoto = watch('photo');

  // Handle photo file selection
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > photoUploadConfig.maxSize) {
        alert(salesAgentValidationRules.photo.fileSize.message);
        return;
      }

      // Validate file type
      if (!photoUploadConfig.allowedTypes.includes(file.type)) {
        alert(salesAgentValidationRules.photo.fileType.message);
        return;
      }

      setSelectedPhoto(file);
      setValue('photo', file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setValue('photo', null);
    const fileInput = document.getElementById('photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: SalesAgentFormData) => {
    try {
      await onSubmit(data);
      reset();
      setPhotoPreview(null);
      setSelectedPhoto(null);
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  // Set initial photo preview if editing
  useEffect(() => {
    if (salesAgent?.photo) {
      setPhotoPreview(salesAgentService.getPhotoUrl(salesAgent.photo));
    }
  }, [salesAgent]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Number */}
        <div className="md:col-span-1">
          <Input
            label="Agent Number *"
            {...register('agentNumber', validationRules.agentNumber)}
            error={errors.agentNumber?.message}
            placeholder="Enter agent number (e.g., SA001)"
            disabled={isLoading}
          />
        </div>

        {/* Full Name */}
        <div className="md:col-span-1">
          <Input
            label="Full Name *"
            {...register('fullName', validationRules.fullName)}
            error={errors.fullName?.message}
            placeholder="Enter agent's full name"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo
        </label>
        <div className="space-y-4">
          {/* File Input */}
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Upload className="h-4 w-4 mr-2" />
              Choose Photo
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            {selectedPhoto && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemovePhoto}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>

          {/* Photo Preview */}
          {photoPreview && (
            <div className="relative inline-block">
              <img
                src={photoPreview}
                alt="Photo preview"
                className="h-20 w-20 object-cover rounded-lg border border-gray-300"
              />
            </div>
          )}

          {/* Photo Info */}
          <div className="text-sm text-gray-500">
            <p>Supported formats: JPEG, PNG, GIF, WebP</p>
            <p>Maximum file size: 5MB</p>
          </div>

          {errors.photo && (
            <p className="text-sm text-red-600">{errors.photo.message}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <Select
          label="Status *"
          {...register('status', { required: 'Status is required' })}
          error={errors.status?.message}
          disabled={isLoading}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
          {salesAgent ? 'Update' : 'Create'} Agent
        </Button>
      </div>
    </form>
  );
};

export default SalesAgentForm;
