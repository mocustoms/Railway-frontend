import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ReturnReason } from '../types';
import { returnTypeConfig } from '../data/returnsOutReasonModules';
import { useAccounts } from '../hooks/useAccounts';
import Button from './Button';
import './ReturnsOutReasonForm.css';

interface ReturnsOutReasonFormProps {
  returnReason?: ReturnReason | null;
  onSubmit: (data: Partial<ReturnReason>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const schema = yup.object({
  name: yup.string().required('Reason name is required').max(255, 'Name must be less than 255 characters'),
  description: yup.string().max(1000, 'Description must be less than 1000 characters'),
  returnType: yup.string().oneOf(['full_refund', 'partial_refund', 'exchange', 'store_credit'], 'Invalid return type').required('Return type is required'),
  requiresApproval: yup.boolean().required('Approval requirement is required'),
  maxReturnDays: yup.number().min(0, 'Max return days must be 0 or greater').max(365, 'Max return days cannot exceed 365'),
  refundAccountId: yup.string(),
  inventoryAccountId: yup.string(),
  isActive: yup.boolean().required('Status is required')
});

type FormData = yup.InferType<typeof schema>;

const ReturnsOutReasonForm: React.FC<ReturnsOutReasonFormProps> = ({
  returnReason,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [selectedReturnType, setSelectedReturnType] = useState<'full_refund' | 'partial_refund' | 'exchange' | 'store_credit' | ''>('');
  
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
      name: returnReason?.name || '',
      description: returnReason?.description || '',
      returnType: returnReason?.returnType || undefined,
      requiresApproval: returnReason?.requiresApproval ?? false,
      maxReturnDays: returnReason?.maxReturnDays || undefined,
      refundAccountId: returnReason?.refundAccountId || '',
      inventoryAccountId: returnReason?.inventoryAccountId || '',
      isActive: returnReason?.isActive ?? true
    }
  });

  // Reset form when returnReason changes
  useEffect(() => {
    if (returnReason) {
      reset({
        name: returnReason.name,
        description: returnReason.description || '',
        returnType: returnReason.returnType || undefined,
        requiresApproval: returnReason.requiresApproval,
        maxReturnDays: returnReason.maxReturnDays || undefined,
        refundAccountId: returnReason.refundAccountId || '',
        inventoryAccountId: returnReason.inventoryAccountId || '',
        isActive: returnReason.isActive
      });
      setSelectedReturnType(returnReason.returnType);
    } else {
      reset({
        name: '',
        description: '',
        returnType: undefined,
        requiresApproval: false,
        maxReturnDays: undefined,
        refundAccountId: '',
        inventoryAccountId: '',
        isActive: true
      });
      setSelectedReturnType('');
    }
  }, [returnReason, reset]);

  // Filter accounts based on return type
  const getFilteredAccounts = (type: 'refund' | 'inventory') => {
    // Return all leaf accounts without filtering by nature
    return accounts || [];
  };

  const handleFormSubmit = async (data: FormData) => {
    try {
      // Transform camelCase field names to snake_case for backend compatibility
      const transformedData = {
        name: data.name,
        description: data.description,
        return_type: data.returnType,
        requires_approval: data.requiresApproval,
        max_return_days: data.maxReturnDays || null,
        refund_account_id: data.refundAccountId || null,
        inventory_account_id: data.inventoryAccountId || null,
        is_active: data.isActive
      };
      
      await onSubmit(transformedData);
    } catch (error) {
      // Form submission error - handled by onSubmit
    }
  };

  const handleReturnTypeChange = (type: 'full_refund' | 'partial_refund' | 'exchange' | 'store_credit') => {
    setSelectedReturnType(type);
    setValue('returnType', type);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="returns-out-reason-form">
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
                placeholder="Enter return reason name"
                disabled={isLoading}
              />
            )}
          />
          {errors.name && <span className="error-message">{errors.name.message}</span>}
        </div>

        {/* Reason Code - Display only when editing */}
        {returnReason && (
          <div className="form-group">
            <label htmlFor="code" className="form-label">
              Reason Code
            </label>
            <input
              type="text"
              id="code"
              value={returnReason.code}
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

        {/* Return Type */}
        <div className="form-group">
          <label className="form-label">Return Type *</label>
          <div className="return-type-buttons">
            {Object.entries(returnTypeConfig).map(([type, config]) => (
              <button
                key={type}
                type="button"
                className={`return-type-btn ${selectedReturnType === type ? 'active' : ''}`}
                onClick={() => handleReturnTypeChange(type as 'full_refund' | 'partial_refund' | 'exchange' | 'store_credit')}
                disabled={isLoading}
              >
                <i className={`fas fa-${type === 'full_refund' ? 'money-bill-wave' : 
                  type === 'partial_refund' ? 'money-bill-wave-alt' : 
                  type === 'exchange' ? 'exchange-alt' : 'credit-card'}`}></i>
                {config.label}
              </button>
            ))}
          </div>
          <Controller
            name="returnType"
            control={control}
            render={({ field }) => (
              <input type="hidden" {...field} />
            )}
          />
          {errors.returnType && <span className="error-message">{errors.returnType.message}</span>}
        </div>

        {/* Requires Approval */}
        <div className="form-group">
          <label htmlFor="requiresApproval" className="form-label">
            Requires Approval
          </label>
          <Controller
            name="requiresApproval"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="requiresApproval"
                className={`form-select ${errors.requiresApproval ? 'error' : ''}`}
                disabled={isLoading}
                value={field.value ? 'true' : 'false'}
                onChange={(e) => field.onChange(e.target.value === 'true')}
              >
                <option value="false">Auto Approved</option>
                <option value="true">Requires Approval</option>
              </select>
            )}
          />
          {errors.requiresApproval && <span className="error-message">{errors.requiresApproval.message}</span>}
        </div>

        {/* Max Return Days */}
        <div className="form-group">
          <label htmlFor="maxReturnDays" className="form-label">
            Max Return Days
          </label>
          <Controller
            name="maxReturnDays"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                id="maxReturnDays"
                className={`form-input ${errors.maxReturnDays ? 'error' : ''}`}
                placeholder="Enter max return days (optional)"
                min="0"
                max="365"
                disabled={isLoading}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            )}
          />
          {errors.maxReturnDays && <span className="error-message">{errors.maxReturnDays.message}</span>}
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

        {/* Refund Account */}
        <div className="form-group">
          <label htmlFor="refundAccountId" className="form-label">
            Refund Account
          </label>
          <Controller
            name="refundAccountId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="refundAccountId"
                className={`form-select ${errors.refundAccountId ? 'error' : ''}`}
                disabled={isLoading || isLoadingAccounts}
              >
                <option value="">Select Refund Account (Optional)</option>
                {getFilteredAccounts('refund')?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.refundAccountId && <span className="error-message">{errors.refundAccountId.message}</span>}
        </div>

        {/* Inventory Account */}
        <div className="form-group">
          <label htmlFor="inventoryAccountId" className="form-label">
            Inventory Account
          </label>
          <Controller
            name="inventoryAccountId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="inventoryAccountId"
                className={`form-select ${errors.inventoryAccountId ? 'error' : ''}`}
                disabled={isLoading || isLoadingAccounts}
              >
                <option value="">Select Inventory Account (Optional)</option>
                {getFilteredAccounts('inventory')?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.inventoryAccountId && <span className="error-message">{errors.inventoryAccountId.message}</span>}
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
          {returnReason ? 'Update' : 'Create'} Returns Out Reason
        </Button>
      </div>
    </form>
  );
};

export default ReturnsOutReasonForm;

