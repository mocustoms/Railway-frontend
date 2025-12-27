import { ProductCategoryStats, ProductCategoryFormData } from '../types';

// Product Category Module Configuration
export const productCategoryModuleConfig = {
  title: 'Product Categories Management',
  description: 'Manage product categories, tax codes, and accounting configurations',
  icon: 'Tag',
  path: '/product-categories',
  category: 'Products',
  priority: 'high' as const,
  features: [
    'Create and manage product categories',
    'Tax code and account assignments',
    'Color coding for visual organization',
    'Export to Excel and PDF',
    'Search and filtering',
    'Status management with usage checks'
  ],
  permissions: ['product_categories.view', 'product_categories.create', 'product_categories.edit', 'product_categories.delete'],
  apiEndpoints: {
    list: '/product-categories',
    create: '/product-categories',
    update: '/product-categories/:id',
    delete: '/product-categories/:id',
    view: '/product-categories/:id',
    stats: '/product-categories/stats',
    export: '/product-categories/export'
  }
};

// Default statistics
export const defaultStats: ProductCategoryStats = {
  total: 0,
  active: 0,
  inactive: 0,
  lastUpdate: 'Never',
};

// Page size options for pagination
export const pageSizeOptions = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 },
  { label: '100 per page', value: 100 },
];

// Status filter options
export const statusFilterOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

// Table column definitions with visibility settings
export const tableColumns = [
  {
    key: 'code',
    header: 'Code',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'name',
    header: 'Category Name',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'description',
    header: 'Description',
    sortable: false,
    defaultVisible: true,
  },
  {
    key: 'color',
    header: 'Color',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'tax_code_name',
    header: 'Tax Code',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'purchases_tax_name',
    header: 'Purchases Tax',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'cogs_account_name',
    header: 'COGS Account',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'income_account_name',
    header: 'Income Account',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'asset_account_name',
    header: 'Asset Account',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'is_active',
    header: 'Status',
    sortable: true,
    defaultVisible: true,
  },
  {
    key: 'created_by_name',
    header: 'Created By',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'created_at',
    header: 'Created Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'updated_by_name',
    header: 'Updated By',
    sortable: false,
    defaultVisible: false,
  },
  {
    key: 'updated_at',
    header: 'Updated Date',
    sortable: true,
    defaultVisible: false,
  },
  {
    key: 'actions',
    header: 'Actions',
    sortable: false,
    defaultVisible: true,
  },
];

// Column visibility configuration
export const defaultColumnVisibility = tableColumns.reduce((acc, column) => {
  acc[column.key] = column.defaultVisible;
  return acc;
}, {} as Record<string, boolean>);

// Export templates for Excel and PDF
export const exportTemplates = {
  excel: {
    filename: 'product-categories',
    sheetName: 'Product Categories',
    columns: [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Category Name', key: 'name', width: 25 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Tax Code', key: 'tax_code_name', width: 20 },
      { header: 'Purchases Tax', key: 'purchases_tax_name', width: 20 },
      { header: 'COGS Account', key: 'cogs_account_name', width: 25 },
      { header: 'Income Account', key: 'income_account_name', width: 25 },
      { header: 'Asset Account', key: 'asset_account_name', width: 25 },
      { header: 'Status', key: 'is_active', width: 12 },
      { header: 'Created By', key: 'created_by_name', width: 20 },
      { header: 'Created Date', key: 'created_at', width: 20 },
      { header: 'Updated By', key: 'updated_by_name', width: 20 },
      { header: 'Updated Date', key: 'updated_at', width: 20 },
    ],
  },
  pdf: {
    title: 'Product Categories Report',
    columns: [
      { header: 'Code', key: 'code' },
      { header: 'Category Name', key: 'name' },
      { header: 'Description', key: 'description' },
      { header: 'Status', key: 'is_active' },
      { header: 'Created By', key: 'created_by_name' },
      { header: 'Created Date', key: 'created_at' },
    ],
  },
};

// Form validation rules
export const validationRules = {
  code: {
    required: 'Category code is required',
    maxLength: { value: 50, message: 'Code must be 50 characters or less' },
    pattern: {
      value: /^[A-Z0-9_-]+$/,
      message: 'Code must contain only uppercase letters, numbers, hyphens, and underscores'
    }
  },
  name: {
    required: 'Category name is required',
    maxLength: { value: 255, message: 'Name must be 255 characters or less' },
  },
  description: {
    maxLength: { value: 1000, message: 'Description must be 1000 characters or less' },
  },
  color: {
    pattern: {
      value: /^#[0-9A-Fa-f]{6}$/,
      message: 'Color must be a valid hex color code (e.g., #2196f3)'
    }
  }
};

// Default form data
export const defaultFormData: ProductCategoryFormData = {
  name: '',
  description: '',
  tax_code_id: '',
  purchases_tax_id: '',
  cogs_account_id: '',
  income_account_id: '',
  asset_account_id: '',
  is_active: true,
  color: '#2196f3',
};

// Sort options for dropdown
export const sortOptions = [
  { label: 'Code (A-Z)', value: 'code-asc' },
  { label: 'Code (Z-A)', value: 'code-desc' },
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Newest First', value: 'created_at-desc' },
  { label: 'Oldest First', value: 'created_at-asc' },
  { label: 'Recently Updated', value: 'updated_at-desc' },
];

// Status badge colors
export const statusColors = {
  active: 'success',
  inactive: 'error',
} as const;

// Category color presets
export const colorPresets = [
  '#2196f3', // Blue
  '#4caf50', // Green
  '#ff9800', // Orange
  '#f44336', // Red
  '#9c27b0', // Purple
  '#00bcd4', // Cyan
  '#795548', // Brown
  '#607d8b', // Blue Grey
  '#e91e63', // Pink
  '#3f51b5', // Indigo
  '#8bc34a', // Light Green
  '#ffc107', // Amber
];
