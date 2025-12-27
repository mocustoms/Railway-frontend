import { StoreLocationStats } from '../types';

// Default store location statistics
export const defaultStoreLocationStats: StoreLocationStats = {
  totalLocations: 0,
  activeLocations: 0,
  inactiveLocations: 0,
  lastUpdate: 'Never'
};

// Page size options for pagination
export const pageSizeOptions = [
  { value: 10, label: '10 per page' },
  { value: 25, label: '25 per page' },
  { value: 50, label: '50 per page' },
  { value: 100, label: '100 per page' }
];

// Status filter options
export const statusFilterOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

// Table column configuration
export const storeLocationTableColumns = [
  { key: 'store_name', label: 'Store Name', sortable: true, visible: true },
  { key: 'location_code', label: 'Location Code', sortable: true, visible: true },
  { key: 'location_name', label: 'Location Name', sortable: true, visible: true },
  { key: 'location_capacity', label: 'Capacity', sortable: true, visible: true },
  { key: 'packaging_type', label: 'Packaging Type', sortable: true, visible: true },
  { key: 'is_active', label: 'Status', sortable: true, visible: true },
  { key: 'created_by_name', label: 'Created By', sortable: true, visible: true },
  { key: 'created_at', label: 'Created Date', sortable: true, visible: true },
  { key: 'updated_by_name', label: 'Updated By', sortable: true, visible: true },
  { key: 'updated_at', label: 'Updated Date', sortable: true, visible: true }
];

// Column visibility options
export const columnVisibilityOptions = [
  { id: 'showLocationCode', label: 'Location Code', columnKey: 'location_code' },
  { id: 'showCapacity', label: 'Location Capacity', columnKey: 'location_capacity' },
  { id: 'showPackaging', label: 'Packaging Type', columnKey: 'packaging_type' },
  { id: 'showActive', label: 'Active', columnKey: 'is_active' },
  { id: 'showCreatedDate', label: 'Created Date', columnKey: 'created_at' },
  { id: 'showUpdatedBy', label: 'Updated By', columnKey: 'updated_by' },
  { id: 'showUpdatedDate', label: 'Updated Date', columnKey: 'updated_at' }
];

// Export file name templates
export const exportFileNameTemplates = {
  excel: (date: string) => `store-locations-${date}.csv`,
  pdf: (date: string) => `store-locations-${date}.pdf`
};

// Form validation rules
export const storeLocationValidationRules = {
  location_code: {
    required: 'Location code is required',
    minLength: { value: 1, message: 'Location code must be at least 1 character' },
    maxLength: { value: 255, message: 'Location code must be 255 characters or less' },
    pattern: {
      value: /^[A-Za-z0-9_-]+$/,
      message: 'Location code can only contain letters, numbers, underscores, and hyphens'
    }
  },
  location_name: {
    required: 'Location name is required',
    minLength: { value: 1, message: 'Location name must be at least 1 character' },
    maxLength: { value: 255, message: 'Location name must be 255 characters or less' }
  },
  location_capacity: {
    min: { value: 0, message: 'Capacity must be 0 or greater' },
    max: { value: 999999, message: 'Capacity must be 999,999 or less' }
  },
  store_id: {
    required: 'Store selection is required'
  },
  packaging_type: {
    required: 'At least one packaging type must be selected'
  }
};

// Default form data
export const defaultStoreLocationFormData = {
  store_id: '',
  location_code: '',
  location_name: '',
  location_capacity: undefined,
  packaging_type: [],
  is_active: true
};
