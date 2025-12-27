import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock } from 'lucide-react';
import { PriceCategory } from '../types';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import Select from './Select';

// Validation schema
const priceCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Name must not exceed 100 characters'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  price_change_type: z.enum(['increase', 'decrease'], {
    required_error: 'Price change type is required'
  }),
  percentage_change: z.number()
    .min(0, 'Percentage change must be 0 or greater')
    .max(100, 'Percentage change must not exceed 100%'),
  scheduled_type: z.enum(['not_scheduled', 'one_time', 'recurring'], {
    required_error: 'Scheduled type is required'
  }),
  recurring_period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional(),
  scheduled_date: z.string().nullable().optional(),
  
  // Enhanced recurring scheduling fields
  recurring_day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).nullable().optional(),
  recurring_date: z.number().min(1).max(31).nullable().optional(),
  recurring_month: z.enum(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']).nullable().optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').nullable().optional(),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').nullable().optional(),
  
  is_active: z.boolean()
}).refine((data) => {
  // Custom validation based on scheduled type
  if (data.scheduled_type === 'not_scheduled') {
    // For not scheduled, all scheduling fields should be null/undefined
    return true; // No validation needed
  }
  
  if (data.scheduled_type === 'one_time') {
    // For one time, only scheduled_date is required
    if (!data.scheduled_date) {
      return false;
    }
    return true;
  }
  
  if (data.scheduled_type === 'recurring' && data.recurring_period) {
    // For recurring, validate based on period type
    
    // Daily: only start_time and end_time are required
    if (data.recurring_period === 'daily') {
      if (!data.start_time || !data.end_time) {
        return false;
      }
    }
    
    // Weekly: day_of_week, start_time, and end_time are required
    if (data.recurring_period === 'weekly') {
      if (!data.recurring_day_of_week || !data.start_time || !data.end_time) {
        return false;
      }
    }
    
    // Monthly: date, start_time, and end_time are required
    if (data.recurring_period === 'monthly') {
      if (!data.recurring_date || !data.start_time || !data.end_time) {
        return false;
      }
    }
    
    // Yearly: month, date, start_time, and end_time are required
    if (data.recurring_period === 'yearly') {
      if (!data.recurring_month || !data.recurring_date || !data.start_time || !data.end_time) {
        return false;
      }
    }
    
    // Validate end time is after start time for all recurring types
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
      return false;
    }
  }
  
  return true;
}, {
  message: "Please fill in all required scheduling fields based on your selection",
  path: ["scheduled_type"]
});

type FormData = z.infer<typeof priceCategorySchema>;

interface PriceCategoryFormProps {
  category?: PriceCategory | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const PriceCategoryForm: React.FC<PriceCategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(priceCategorySchema),
    defaultValues: category ? {
      name: category.name,
      description: category.description || '',
      price_change_type: category.price_change_type,
      percentage_change: category.percentage_change,
      scheduled_type: category.scheduled_type,
      recurring_period: category.recurring_period || undefined,
      scheduled_date: category.scheduled_date || undefined,
      recurring_day_of_week: category.recurring_day_of_week || undefined,
      recurring_date: category.recurring_date || undefined,
      recurring_month: category.recurring_month || undefined,
      start_time: category.start_time || undefined,
      end_time: category.end_time || undefined,
      is_active: category.is_active
    } : {
      name: '',
      description: '',
      price_change_type: 'increase',
      percentage_change: 0,
      scheduled_type: 'not_scheduled',
      recurring_period: undefined,
      scheduled_date: undefined,
      recurring_day_of_week: undefined,
      recurring_date: undefined,
      recurring_month: undefined,
      start_time: undefined,
      end_time: undefined,
      is_active: true
    }
  });

  const watchedScheduledType = watch('scheduled_type');
  const watchedRecurringPeriod = watch('recurring_period');

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      }
  };

  return (
    <form 
      onSubmit={handleSubmit(
        (data) => {
          return handleFormSubmit(data);
        },
        (errors) => {
          }
      )}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Name */}
        <div>
          <Input
            label="Category Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Enter category name"
            required
          />
        </div>

        {/* Category Code - Display only when editing */}
        {category && (
          <div>
            <Input
              label="Category Code"
              value={category.code}
              disabled
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
          </div>
        )}

        {/* Price Change Type */}
        <div>
          <Select
            label="Price Change Type"
            {...register('price_change_type')}
            error={errors.price_change_type?.message}
            required
          >
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </Select>
        </div>

        {/* Percentage Change */}
        <div>
          <Input
            label="Percentage Change (%)"
            type="number"
            step="0.01"
            {...register('percentage_change', { valueAsNumber: true })}
            error={errors.percentage_change?.message}
            placeholder="0.00"
            required
          />
        </div>

        {/* Scheduled Type */}
        <div>
          <Select
            label="Scheduled Type"
            {...register('scheduled_type')}
            error={errors.scheduled_type?.message}
            required
          >
            <option value="not_scheduled">Not Scheduled</option>
            <option value="one_time">One Time</option>
            <option value="recurring">Recurring</option>
          </Select>
        </div>

                {/* Recurring Period - Only show when scheduled_type is recurring */}
        {watchedScheduledType === 'recurring' && (
          <div>
            <Select
              label="Recurring Period"
              {...register('recurring_period')}
              error={errors.recurring_period?.message}
              required={watchedScheduledType === 'recurring'}
            >
              <option value="">Select Period</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </div>
        )}

                {/* Enhanced Recurring Scheduling Fields */}
        {watchedScheduledType === 'recurring' && watchedRecurringPeriod && (
          <>
            {/* Section Header */}
            <div className="md:col-span-2">
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  Recurring Schedule Configuration
                </h4>
              </div>
            </div>
            
            {/* Day of Week - Only for weekly */}
            {watchedRecurringPeriod === 'weekly' && (
              <div>
                <Select
                  label="Day of Week"
                  {...register('recurring_day_of_week')}
                  error={errors.recurring_day_of_week?.message}
                  required
                >
                  <option value="">Select Day</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </Select>
              </div>
            )}

            {/* Date - Only for monthly and yearly */}
            {(watchedRecurringPeriod === 'monthly' || watchedRecurringPeriod === 'yearly') && (
              <div>
                <Select
                  label="Date"
                  {...register('recurring_date', { valueAsNumber: true })}
                  error={errors.recurring_date?.message}
                  required
                >
                  <option value="">Select Date</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </Select>
              </div>
            )}

            {/* Month - Only for yearly */}
            {watchedRecurringPeriod === 'yearly' && (
              <div>
                <Select
                  label="Month"
                  {...register('recurring_month')}
                  error={errors.recurring_month?.message}
                  required
                >
                  <option value="">Select Month</option>
                  <option value="january">January</option>
                  <option value="february">February</option>
                  <option value="march">March</option>
                  <option value="april">April</option>
                  <option value="may">May</option>
                  <option value="june">June</option>
                  <option value="july">July</option>
                  <option value="august">August</option>
                  <option value="september">September</option>
                  <option value="october">October</option>
                  <option value="november">November</option>
                  <option value="december">December</option>
                </Select>
              </div>
            )}

            {/* Start Time - For all recurring types */}
            <div>
              <Input
                label="Start Time"
                type="time"
                {...register('start_time')}
                error={errors.start_time?.message}
                placeholder="09:00"
                required={watchedRecurringPeriod === 'daily' || watchedRecurringPeriod === 'weekly' || watchedRecurringPeriod === 'monthly' || watchedRecurringPeriod === 'yearly'}
              />
            </div>

            {/* End Time - For all recurring types */}
            <div>
              <Input
                label="End Time"
                type="time"
                {...register('end_time')}
                error={errors.end_time?.message}
                placeholder="17:00"
                required={watchedRecurringPeriod === 'daily' || watchedRecurringPeriod === 'weekly' || watchedRecurringPeriod === 'monthly' || watchedRecurringPeriod === 'yearly'}
              />
            </div>
          </>
        )}

        {/* Scheduled Date - Only show when scheduled_type is one_time */}
        {watchedScheduledType === 'one_time' && (
          <div>
            <Input
              label="Scheduled Date"
              type="datetime-local"
              {...register('scheduled_date')}
              error={errors.scheduled_date?.message}
              required={true}
            />
          </div>
        )}

        {/* Status */}
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <Textarea
          label="Description"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Enter category description (optional)"
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading || isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || isSubmitting}
        >
          {isLoading || isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
};

export default PriceCategoryForm;
