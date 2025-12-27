import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AdjustmentReason } from '../types';
import { adjustmentTypeConfig } from '../data/adjustmentReasonModules';
import { useAccounts } from '../hooks/useAccounts';
import Button from './Button';
import './AdjustmentReasonForm.css';

interface AdjustmentReasonFormProps {
  adjustmentReason?: AdjustmentReason | null;
  onSubmit: (data: Partial<AdjustmentReason>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const schema = yup.object({
  name: yup.string().required('Reason name is required').max(255, 'Name must be less than 255 characters'),
  description: yup.string().max(1000, 'Description must be less than 1000 characters'),
  adjustmentType: yup.string().oneOf(['add', 'deduct'], 'Invalid adjustment type').required('Adjustment type is required'),
  trackingAccountId: yup.string().required('Tracking account is required'),
  correspondingAccountId: yup.string(),
  isActive: yup.boolean().required('Status is required')
});

type FormData = yup.InferType<typeof schema>;

const AdjustmentReasonForm: React.FC<AdjustmentReasonFormProps> = ({
  adjustmentReason,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [selectedAdjustmentType, setSelectedAdjustmentType] = useState<'add' | 'deduct' | ''>('');
  
  const { accounts, isLoading: isLoadingAccounts } = useAccounts();
  
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: adjustmentReason?.name || '',
      description: adjustmentReason?.description || '',
      adjustmentType: adjustmentReason?.adjustmentType || undefined,
      trackingAccountId: adjustmentReason?.trackingAccountId || '',
      correspondingAccountId: adjustmentReason?.correspondingAccountId || '',
      isActive: adjustmentReason?.isActive ?? true
    }
  });

  // Reset form when adjustmentReason changes
  useEffect(() => {
    if (adjustmentReason) {
      reset({
        name: adjustmentReason.name,
        description: adjustmentReason.description || '',
        adjustmentType: adjustmentReason.adjustmentType || undefined,
        trackingAccountId: adjustmentReason.trackingAccountId,
        correspondingAccountId: adjustmentReason.correspondingAccountId || '',
        isActive: adjustmentReason.isActive
      });
      setSelectedAdjustmentType(adjustmentReason.adjustmentType);
    } else {
      reset({
        name: '',
        description: '',
        adjustmentType: undefined,
        trackingAccountId: '',
        correspondingAccountId: '',
        isActive: true
      });
      setSelectedAdjustmentType('');
    }
  }, [adjustmentReason, reset]);

  // Filter accounts based on adjustment type
  const getFilteredAccounts = (type: 'tracking' | 'corresponding') => {
    // Return all leaf accounts without filtering by nature
    return accounts || [];
  };

  const handleFormSubmit = async (data: FormData) => {
    try {
      // Transform camelCase field names to snake_case for backend compatibility
      const transformedData = {
        name: data.name,
        description: data.description,
        adjustment_type: data.adjustmentType,
        tracking_account_id: data.trackingAccountId,
        corresponding_account_id: data.correspondingAccountId || null,
        is_active: data.isActive
      };
      
      await onSubmit(transformedData);
    } catch (error) {
      }
  };

  const handleAdjustmentTypeChange = (type: 'add' | 'deduct') => {
    setSelectedAdjustmentType(type);
    setValue('adjustmentType', type);
    // No need to clear account selections since we're not filtering by nature
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="adjustment-reason-form">
      <div className="form-grid">
        {/* Reason Name */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Reason Name *
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter adjustment reason name"
                disabled={isLoading}
              />
            )}
          />
          {errors.name && <span className="error-message">{errors.name.message}</span>}
        </div>

        {/* Reason Code - Display only when editing */}
        {adjustmentReason && (
          <div className="form-group">
            <label htmlFor="code" className="form-label">
              Reason Code
            </label>
            <input
              type="text"
              id="code"
              value={adjustmentReason.code}
              className="form-input disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled
              readOnly
            />
          </div>
        )}

        {/* Description */}
        <div className="form-group full-width">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                id="description"
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Enter reason description"
                rows={3}
                disabled={isLoading}
              />
            )}
          />
          {errors.description && <span className="error-message">{errors.description.message}</span>}
        </div>

        {/* Adjustment Type */}
        <div className="form-group">
          <label className="form-label">Adjustment Type *</label>
          <div className="adjustment-type-buttons">
            {Object.entries(adjustmentTypeConfig).map(([type, config]) => (
              <button
                key={type}
                type="button"
                className={`adjustment-type-btn ${selectedAdjustmentType === type ? 'active' : ''}`}
                onClick={() => handleAdjustmentTypeChange(type as 'add' | 'deduct')}
                disabled={isLoading}
              >
                <i className={`fas fa-${type === 'add' ? 'plus' : 'minus'}`}></i>
                {config.label}
              </button>
            ))}
          </div>
          <Controller
            name="adjustmentType"
            control={control}
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />
          {errors.adjustmentType && <span className="error-message">{errors.adjustmentType.message}</span>}
        </div>

        {/* Status */}
        <div className="form-group">
          <label htmlFor="isActive" className="form-label">
            Status
          </label>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="isActive"
                className={`form-select ${errors.isActive ? 'error' : ''}`}
                disabled={isLoading}
                value={field.value ? 'true' : 'false'}
                onChange={(e) => field.onChange(e.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            )}
          />
          {errors.isActive && <span className="error-message">{errors.isActive.message}</span>}
        </div>

        {/* Tracking Account */}
        <div className="form-group">
          <label htmlFor="trackingAccountId" className="form-label">
            Tracking Account *
          </label>
          <Controller
            name="trackingAccountId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="trackingAccountId"
                className={`form-select ${errors.trackingAccountId ? 'error' : ''}`}
                disabled={isLoading || isLoadingAccounts}
              >
                <option value="">Select Tracking Account</option>
                {getFilteredAccounts('tracking')?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.trackingAccountId && <span className="error-message">{errors.trackingAccountId.message}</span>}
        </div>

        {/* Corresponding Account */}
        <div className="form-group">
          <label htmlFor="correspondingAccountId" className="form-label">
            Corresponding Account
          </label>
          <Controller
            name="correspondingAccountId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="correspondingAccountId"
                className={`form-select ${errors.correspondingAccountId ? 'error' : ''}`}
                disabled={isLoading || isLoadingAccounts}
              >
                <option value="">Select Corresponding Account (Optional)</option>
                {getFilteredAccounts('corresponding')?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.correspondingAccountId && <span className="error-message">{errors.correspondingAccountId.message}</span>}
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading || isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading || isSubmitting}
          disabled={isLoading || isSubmitting}
        >
          {adjustmentReason ? 'Update' : 'Create'} Adjustment Reason
        </Button>
      </div>
    </form>
  );
};

export default AdjustmentReasonForm;
