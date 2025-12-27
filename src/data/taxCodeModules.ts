import { TaxCodeStats, TaxCodeFilters, TaxCodeSortConfig, TaxCodeFormData } from '../types';

// Tax Code Module Configuration
export const taxCodeModuleConfig = {
  title: 'Tax Codes Management',
  description: 'Manage tax codes for sales and purchases',
  icon: 'Receipt',
  path: '/tax-codes',
  category: 'Administrative',
  priority: 'high' as const,
  features: [
    'Create and manage tax codes',
    'Set tax rates and indicators',
    'Link to sales and purchases accounts',
    'EFD department code integration',
    'Export to Excel and PDF',
    'Search and filtering',
    'Status management'
  ],
  permissions: ['tax_codes.view', 'tax_codes.create', 'tax_codes.edit', 'tax_codes.delete'],
  apiEndpoints: {
    list: '/tax-codes',
    create: '/tax-codes',
    update: '/tax-codes/:id',
    delete: '/tax-codes/:id',
    view: '/tax-codes/:id',
    stats: '/tax-codes/stats/overview',
    export: '/tax-codes/export'
  },
  tableColumns: [
    { key: 'code', label: 'Code', sortable: true, width: '120px' },
    { key: 'name', label: 'Tax Name', sortable: true, width: '200px' },
    { key: 'rate', label: 'Rate (%)', sortable: true, width: '100px' },
    { key: 'indicator', label: 'Indicator', sortable: true, width: '120px' },
    { key: 'efd_department_code', label: 'EFD Department Code', sortable: true, width: '150px' },
    { key: 'is_active', label: 'Status', sortable: true, width: '100px' },
    { key: 'created_at', label: 'Created Date', sortable: true, width: '150px' },
    { key: 'salesTaxAccount', label: 'Sales Tax Account', sortable: false, width: '180px' },
    { key: 'purchasesTaxAccount', label: 'Purchases Tax Account', sortable: false, width: '180px' },
    { key: 'creator', label: 'Created By', sortable: false, width: '150px' },
    { key: 'updater', label: 'Updated By', sortable: false, width: '150px' },
    { key: 'updated_at', label: 'Updated Date', sortable: true, width: '150px' },
    { key: 'actions', label: 'Actions', sortable: false, width: '120px' }
  ],
  formFields: [
    {
      name: 'code',
      label: 'Code',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter tax code',
      validation: {
        required: 'Tax code is required',
        minLength: { value: 1, message: 'Code must be at least 1 character' },
        maxLength: { value: 50, message: 'Code must not exceed 50 characters' },
        pattern: { value: /^[A-Z0-9]+$/, message: 'Code must contain only uppercase letters and numbers' }
      }
    },
    {
      name: 'name',
      label: 'Tax Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter tax name',
      validation: {
        required: 'Tax name is required',
        minLength: { value: 1, message: 'Name must be at least 1 character' },
        maxLength: { value: 100, message: 'Name must not exceed 100 characters' }
      }
    },
    {
      name: 'rate',
      label: 'Rate (%)',
      type: 'number' as const,
      required: true,
      placeholder: '0.00',
      validation: {
        required: 'Tax rate is required',
        min: { value: 0, message: 'Rate must be 0 or greater' },
        max: { value: 100, message: 'Rate must not exceed 100%' }
      }
    },
    {
      name: 'indicator',
      label: 'Indicator',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter indicator',
      validation: {
        maxLength: { value: 20, message: 'Indicator must not exceed 20 characters' }
      }
    },
    {
      name: 'efd_department_code',
      label: 'EFD Department Code',
      type: 'text' as const,
      required: false,
      placeholder: 'Enter EFD department code',
      validation: {
        maxLength: { value: 20, message: 'EFD department code must not exceed 20 characters' }
      }
    },
    {
      name: 'sales_tax_account_id',
      label: 'Sales Tax Account',
      type: 'select' as const,
      required: false,
      placeholder: 'Select sales tax account',
      options: [] // Will be populated dynamically
    },
    {
      name: 'purchases_tax_account_id',
      label: 'Purchases Tax Account',
      type: 'select' as const,
      required: false,
      placeholder: 'Select purchases tax account',
      options: [] // Will be populated dynamically
    },
    {
      name: 'is_active',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ],
  searchFields: ['code', 'name', 'indicator', 'efd_department_code'],
  sortOptions: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Tax Name' },
    { key: 'rate', label: 'Rate' },
    { key: 'indicator', label: 'Indicator' },
    { key: 'efd_department_code', label: 'EFD Department Code' },
    { key: 'is_active', label: 'Status' },
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
  },
  exportConfig: {
    formats: ['excel', 'pdf'],
    columns: [
      { key: 'code', label: 'Code', visible: true },
      { key: 'name', label: 'Tax Name', visible: true },
      { key: 'rate', label: 'Rate (%)', visible: true },
      { key: 'indicator', label: 'Indicator', visible: true },
      { key: 'efd_department_code', label: 'EFD Department Code', visible: true },
      { key: 'is_active', label: 'Status', visible: true },
      { key: 'salesTaxAccount', label: 'Sales Tax Account', visible: true },
      { key: 'purchasesTaxAccount', label: 'Purchases Tax Account', visible: true },
      { key: 'created_at', label: 'Created Date', visible: true },
      { key: 'updated_at', label: 'Updated Date', visible: true }
    ]
  },
  breadcrumbs: [
    { label: 'Administrative', path: '/administrative' },
    { label: 'Tax Codes', path: '/tax-codes' }
  ]
};

// Default form data
export const defaultTaxCodeFormData: TaxCodeFormData = {
  name: '',
  rate: 0,
  indicator: '',
  efd_department_code: '',
  sales_tax_account_id: undefined,
  purchases_tax_account_id: undefined,
  is_active: true,
  is_wht: false
};

// Validation rules
export const taxCodeValidationRules = {
  code: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[A-Z0-9]+$/
  },
  name: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  rate: {
    required: true,
    min: 0,
    max: 100
  },
  indicator: {
    maxLength: 20
  },
  efd_department_code: {
    maxLength: 20
  }
};

// Error messages
export const taxCodeErrorMessages = {
  code: {
    required: 'Tax code is required',
    minLength: 'Code must be at least 1 character',
    maxLength: 'Code must not exceed 50 characters',
    pattern: 'Code must contain only uppercase letters and numbers'
  },
  name: {
    required: 'Tax name is required',
    minLength: 'Name must be at least 1 character',
    maxLength: 'Name must not exceed 100 characters'
  },
  rate: {
    required: 'Tax rate is required',
    min: 'Rate must be 0 or greater',
    max: 'Rate must not exceed 100%'
  },
  indicator: {
    maxLength: 'Indicator must not exceed 20 characters'
  },
  efd_department_code: {
    maxLength: 'EFD department code must not exceed 20 characters'
  }
};

// Status options
export const taxCodeStatusOptions = [
  { value: 'all', label: 'All Statuses', color: 'gray' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'red' }
];

// Default sort configuration
export const defaultTaxCodeSortConfig: TaxCodeSortConfig = {
  column: 'code',
  direction: 'asc'
};

// Default filters
export const defaultTaxCodeFilters: TaxCodeFilters = {
  search: '',
  status: 'all'
};

// Default stats
export const defaultTaxCodeStats: TaxCodeStats = {
  totalTaxCodes: 0,
  activeTaxCodes: 0,
  inactiveTaxCodes: 0,
  averageRate: 0,
  lastUpdate: new Date().toISOString()
}; 