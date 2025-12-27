import { ProductBrandNameStats } from '../types';

// Default product brand name statistics
export const defaultProductBrandNameStats: ProductBrandNameStats = {
  totalBrandNames: 0,
  activeBrandNames: 0,
  inactiveBrandNames: 0,
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
export const productBrandNameTableColumns = [
  { key: 'name', label: 'Brand Name', sortable: true, visible: true },
  { key: 'code', label: 'Brand Name Code', sortable: true, visible: true },
  { key: 'description', label: 'Description', sortable: true, visible: true },
  { key: 'is_active', label: 'Status', sortable: true, visible: true },
  { key: 'created_by_name', label: 'Created By', sortable: true, visible: true },
  { key: 'created_at', label: 'Created Date', sortable: true, visible: true },
  { key: 'updated_by_name', label: 'Updated By', sortable: true, visible: true },
  { key: 'updated_at', label: 'Updated Date', sortable: true, visible: true }
];

// Column visibility options
export const columnVisibilityOptions = [
  { id: 'showBrandNameCode', label: 'Brand Name Code', columnKey: 'code' },
  { id: 'showDescription', label: 'Description', columnKey: 'description' },
  { id: 'showStatus', label: 'Status', columnKey: 'is_active' },
  { id: 'showCreatedDate', label: 'Created Date', columnKey: 'created_at' },
  { id: 'showUpdatedBy', label: 'Updated By', columnKey: 'updated_by' },
  { id: 'showUpdatedDate', label: 'Updated Date', columnKey: 'updated_at' }
];

// Export file name templates
export const exportFileNameTemplates = {
  excel: (date: string) => `product-brand-names-${date}.csv`,
  pdf: (date: string) => `product-brand-names-${date}.pdf`
};

// Form validation rules
export const productBrandNameValidationRules = {
  code: {
    required: 'Brand name code is required',
    minLength: { value: 1, message: 'Brand name code must be at least 1 character' },
    maxLength: { value: 50, message: 'Brand name code must be 50 characters or less' },
    pattern: {
      value: /^[A-Za-z0-9_-]+$/,
      message: 'Brand name code can only contain letters, numbers, underscores, and hyphens'
    }
  },
  name: {
    required: 'Brand name is required',
    minLength: { value: 1, message: 'Brand name must be at least 1 character' },
    maxLength: { value: 255, message: 'Brand name must be 255 characters or less' }
  },
  description: {
    maxLength: { value: 1000, message: 'Description must be 1000 characters or less' }
  },
  logo: {
    fileSize: { value: 5 * 1024 * 1024, message: 'Logo file size must be 5MB or less' },
    fileType: { value: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], message: 'Only image files are allowed' }
  }
};

// Default form data
export const defaultProductBrandNameFormData = {
  code: '',
  name: '',
  description: '',
  logo: null,
  is_active: true
};

// Logo upload configuration
export const logoUploadConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  uploadPath: '/uploads/product-brand-name-logos/'
};
