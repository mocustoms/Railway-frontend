import { ProductColorStats, ProductColorFilters, ProductColorSortConfig, ProductColorFormData } from '../types';

// Product Color Module Configuration
export const productColorModuleConfig = {
  title: 'Product Colors Management',
  description: 'Manage product colors and color variations',
  icon: 'Palette',
  path: '/product-colors',
  category: 'Products',
  priority: 'high' as const,
  features: [
    'Create and manage product colors',
    'Color code and hex code support',
    'Color preview functionality',
    'Export to Excel and PDF',
    'Search and filtering',
    'Status management'
  ],
  permissions: ['product_colors.view', 'product_colors.create', 'product_colors.edit', 'product_colors.delete'],
  apiEndpoints: {
    list: '/product-colors',
    create: '/product-colors',
    update: '/product-colors/:id',
    delete: '/product-colors/:id',
    view: '/product-colors/:id',
    stats: '/product-colors/stats/overview',
    export: '/product-colors/export'
  },
  tableColumns: [
    { key: 'name', label: 'Color Name', sortable: true, width: '200px' },
    { key: 'code', label: 'Color Code', sortable: true, width: '120px' },
    { key: 'hex_code', label: 'Color Preview', sortable: false, width: '100px' },
    { key: 'description', label: 'Description', sortable: true, width: '250px' },
    { key: 'is_active', label: 'Status', sortable: true, width: '100px' },
    { key: 'created_by_name', label: 'Created By', sortable: false, width: '150px' },
    { key: 'created_at', label: 'Created Date', sortable: true, width: '150px' },
    { key: 'updated_by_name', label: 'Updated By', sortable: false, width: '150px' },
    { key: 'updated_at', label: 'Updated Date', sortable: true, width: '150px' },
    { key: 'actions', label: 'Actions', sortable: false, width: '120px' }
  ],
  formFields: [
    {
      name: 'name',
      label: 'Color Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter color name',
      validation: {
        required: 'Color name is required',
        minLength: { value: 1, message: 'Name must be at least 1 character' },
        maxLength: { value: 100, message: 'Name must not exceed 100 characters' }
      }
    },
    {
      name: 'code',
      label: 'Color Code',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter color code',
      validation: {
        required: 'Color code is required',
        minLength: { value: 1, message: 'Code must be at least 1 character' },
        maxLength: { value: 20, message: 'Code must not exceed 20 characters' },
        pattern: { value: /^[A-Z0-9]+$/, message: 'Code must contain only uppercase letters and numbers' }
      }
    },
    {
      name: 'hex_code',
      label: 'Color Preview',
      type: 'text' as const,
      required: true,
      placeholder: '#000000',
      validation: {
        required: 'Hex code is required',
        pattern: { value: /^#[0-9A-F]{6}$/i, message: 'Must be a valid hex color code (e.g., #FF0000)' }
      }
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Enter color description',
      validation: {
        maxLength: { value: 500, message: 'Description must not exceed 500 characters' }
      }
    },
    {
      name: 'is_active',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ],
      validation: {
        required: 'Status is required'
      }
    }
  ],
  searchFields: ['name', 'code', 'description'],
  sortOptions: [
    { key: 'name', label: 'Color Name' },
    { key: 'code', label: 'Color Code' },
    { key: 'created_at', label: 'Created Date' },
    { key: 'updated_at', label: 'Updated Date' }
  ],
  filters: [
    {
      key: 'status',
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      placeholder: 'All Statuses',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ],
  exportOptions: {
    excel: true,
    pdf: true,
    csv: false
  }
};

// Default configurations
export const defaultProductColorFilters: ProductColorFilters = {
  search: '',
  status: 'all'
};

export const defaultProductColorSortConfig: ProductColorSortConfig = {
  column: 'created_at',
  direction: 'desc'
};

export const defaultProductColorStats: ProductColorStats = {
  totalProductColors: 0,
  activeProductColors: 0,
  inactiveProductColors: 0,
  lastUpdate: 'Never'
};

export const defaultProductColorFormData: ProductColorFormData = {
  name: '',
  code: '',
  hex_code: '#000000',
  description: '',
  is_active: true
};

// Validation rules
export const productColorValidationRules = {
  name: {
    required: 'Color name is required',
    minLength: { value: 1, message: 'Name must be at least 1 character' },
    maxLength: { value: 100, message: 'Name must not exceed 100 characters' }
  },
  code: {
    required: 'Color code is required',
    minLength: { value: 1, message: 'Code must be at least 1 character' },
    maxLength: { value: 20, message: 'Code must not exceed 20 characters' },
    pattern: { value: /^[A-Z0-9]+$/, message: 'Code must contain only uppercase letters and numbers' }
  },
  hex_code: {
    required: 'Hex code is required',
    pattern: { value: /^#[0-9A-F]{6}$/i, message: 'Must be a valid hex color code (e.g., #FF0000)' }
  },
  description: {
    maxLength: { value: 500, message: 'Description must not exceed 500 characters' }
  }
};

// Status configurations
export const productColorStatusConfig = {
  active: {
    label: 'Active',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  inactive: {
    label: 'Inactive',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  }
};

// Column visibility configuration
export const columnVisibilityConfig = {
  name: { visible: true, label: 'Color Name' },
  code: { visible: true, label: 'Color Code' },
  hex_code: { visible: true, label: 'Color Preview' },
  description: { visible: true, label: 'Description' },
  is_active: { visible: true, label: 'Status' },
  created_by_name: { visible: true, label: 'Created By' },
  created_at: { visible: true, label: 'Created Date' },
  updated_by_name: { visible: true, label: 'Updated By' },
  updated_at: { visible: true, label: 'Updated Date' }
};
