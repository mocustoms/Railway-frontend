import { Module } from '../types';

// Business Type Options
export const businessTypeOptions = [
  { value: 'Retail', label: 'Retail' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Service', label: 'Service' },
  { value: 'Wholesale', label: 'Wholesale' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Supermarket', label: 'Supermarket' },
  { value: 'Other', label: 'Other' }
];

// Industry Options
export const industryOptions = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Food & Beverage', label: 'Food & Beverage' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Automotive', label: 'Automotive' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Education', label: 'Education' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Other', label: 'Other' }
];

// Timezone Options
export const timezoneOptions = [
  { value: 'Africa/Dar_es_Salaam', label: 'Africa/Dar_es_Salaam (EAT)' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
  { value: 'Africa/Kampala', label: 'Africa/Kampala (EAT)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' }
];

// Company Setup Module Configuration
export const companySetupModule: Module = {
  id: 'company-setup',
  title: 'Company Setup',
  description: 'Configure your company details, business information, and financial settings',
  icon: 'Building',
  path: '/company-setup',
  category: 'Administrative',
  priority: 'high',
  status: 'active',
  features: [
    'Company Details Management',
    'Business Information',
    'Tax & Legal Information',
    'Financial Settings',
    'Logo Upload',
    'Currency Configuration',
    'Costing Method Setup'
  ],
  permissions: ['admin', 'manager'],
  apiEndpoints: {
    list: '/api/company',
    create: '/api/company',
    update: '/api/company',
    delete: '/api/company',
    view: '/api/company',
    import: '/api/company/import',
    export: '/api/company/export'
  },
  tableColumns: [
    { key: 'name', label: 'Company Name', sortable: true, width: '200px' },
    { key: 'code', label: 'Code', sortable: true, width: '100px' },
    { key: 'email', label: 'Email', sortable: true, width: '200px' },
    { key: 'phone', label: 'Phone', sortable: true, width: '150px' },
    { key: 'country', label: 'Country', sortable: true, width: '120px' },
    { key: 'businessType', label: 'Business Type', sortable: true, width: '150px' },
    { key: 'defaultCurrency.code', label: 'Currency', sortable: true, width: '100px' },
    { key: 'createdAt', label: 'Created', sortable: true, width: '120px' },
    { key: 'updatedAt', label: 'Updated', sortable: true, width: '120px' }
  ],
  formFields: [
    {
      name: 'name',
      label: 'Company Name',
      type: 'text',
      required: true,
      placeholder: 'Enter company name',
      validation: { required: 'Company name is required' }
    },
    {
      name: 'code',
      label: 'Company Code',
      type: 'text',
      required: true,
      placeholder: 'e.g., EMZ',
      validation: { 
        required: 'Company code is required',
        maxLength: { value: 10, message: 'Code must be 10 characters or less' }
      }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email address',
      validation: { 
        required: 'Email is required',
        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
      }
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
      required: true,
      placeholder: 'Enter phone number',
      validation: { required: 'Phone number is required' }
    },
    {
      name: 'website',
      label: 'Website',
      type: 'text',
      required: false,
      placeholder: 'https://www.example.com',
      validation: { 
        pattern: { value: /^https?:\/\/.+/, message: 'Invalid website URL' }
      }
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      required: true,
      placeholder: 'Enter full address',
      validation: { required: 'Address is required' }
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      required: false,
      placeholder: 'e.g., Tanzania',
      validation: {}
    },
    {
      name: 'region',
      label: 'Region',
      type: 'text',
      required: false,
      placeholder: 'e.g., Dar es Salaam',
      validation: {}
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      placeholder: 'Enter company description',
      validation: {}
    },
    {
      name: 'businessType',
      label: 'Business Type',
      type: 'select',
      required: false,
      options: businessTypeOptions,
      validation: {}
    },
    {
      name: 'industry',
      label: 'Industry',
      type: 'select',
      required: false,
      options: industryOptions,
      validation: {}
    },
    {
      name: 'businessRegistrationNumber',
      label: 'Business Registration No.',
      type: 'text',
      required: false,
      placeholder: 'Enter registration number',
      validation: {}
    },
    {
      name: 'timezone',
      label: 'Timezone',
      type: 'select',
      required: false,
      options: timezoneOptions,
      validation: {}
    },
    {
      name: 'tin',
      label: 'TIN No.',
      type: 'text',
      required: false,
      placeholder: 'Enter TIN number',
      validation: {}
    },
    {
      name: 'vrn',
      label: 'VRN',
      type: 'text',
      required: false,
      placeholder: 'Enter VRN',
      validation: {}
    },
    {
      name: 'fax',
      label: 'Fax',
      type: 'text',
      required: false,
      placeholder: 'Enter fax number',
      validation: {}
    },
    {
      name: 'defaultCurrencyId',
      label: 'Default Currency',
      type: 'select',
      required: true,
      placeholder: 'Select Currency',
      validation: { required: 'Default currency is required' }
    },
    {
      name: 'costingMethod',
      label: 'Costing Method',
      type: 'select',
      required: true,
      placeholder: 'Select Method',
      validation: { required: 'Costing method is required' }
    },
    {
      name: 'efdSettings',
      label: 'EFD Settings',
      type: 'text',
      required: false,
      placeholder: 'Enter EFD settings',
      validation: {}
    }
  ],
  searchFields: ['name', 'code', 'email', 'phone', 'address'],
  sortOptions: [
    { key: 'name', label: 'Company Name' },
    { key: 'code', label: 'Company Code' },
    { key: 'email', label: 'Email' },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'updatedAt', label: 'Updated Date' }
  ],
  filters: [
    {
      name: 'businessType',
      label: 'Business Type',
      type: 'select',
      options: businessTypeOptions
    },
    {
      name: 'industry',
      label: 'Industry',
      type: 'select',
      options: industryOptions
    },
    {
      name: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'Filter by country'
    }
  ],
  exportOptions: {
    excel: true,
    pdf: true,
    csv: true
  },
  importConfig: {
    templateFields: [
      { name: 'name', label: 'Company Name', required: true },
      { name: 'code', label: 'Company Code', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'phone', label: 'Phone', required: true },
      { name: 'address', label: 'Address', required: true },
      { name: 'country', label: 'Country', required: false },
      { name: 'businessType', label: 'Business Type', required: false },
      { name: 'industry', label: 'Industry', required: false }
    ],
    validationRules: {
      name: { required: true },
      code: { required: true, pattern: /^[A-Z0-9_]{1,10}$/ },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      phone: { required: true },
      address: { required: true }
    }
  },
  exportConfig: {
    formats: ['excel', 'pdf'],
    columns: [
      { key: 'name', label: 'Company Name', visible: true },
      { key: 'code', label: 'Company Code', visible: true },
      { key: 'email', label: 'Email', visible: true },
      { key: 'phone', label: 'Phone', visible: true },
      { key: 'address', label: 'Address', visible: true },
      { key: 'country', label: 'Country', visible: true },
      { key: 'businessType', label: 'Business Type', visible: true },
      { key: 'industry', label: 'Industry', visible: true },
      { key: 'defaultCurrency.code', label: 'Currency', visible: true },
      { key: 'createdAt', label: 'Created Date', visible: true }
    ]
  },
  breadcrumbs: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Advance Setup', path: '/advance-setup' },
    { label: 'Company Setup', path: '/company-setup' }
  ]
};

// Default costing methods (fallback if API fails)
export const defaultCostingMethods = [
  { id: 'FIFO', code: 'FIFO', name: 'FIFO (First In, First Out)', description: 'First items purchased are first sold' },
  { id: 'LIFO', code: 'LIFO', name: 'LIFO (Last In, First Out)', description: 'Last items purchased are first sold' },
  { id: 'AVG', code: 'AVG', name: 'Weighted Average', description: 'Average cost of all items in inventory' },
  { id: 'SPEC', code: 'SPEC', name: 'Specific Identification', description: 'Track cost of each specific item' }
];

// Form validation schemas
export const companyValidationSchema = {
  name: { required: true, minLength: 2, maxLength: 100 },
  code: { required: true, maxLength: 10, pattern: /^[A-Z0-9_]+$/ },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { required: true, minLength: 10 },
  address: { required: true, minLength: 10 },
  defaultCurrencyId: { required: true },
  costingMethod: { required: true }
};

// File upload configuration
export const logoUploadConfig = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.svg']
}; 