import { Module } from '../types';

export const accountTypeModules: Module[] = [
  {
    id: 'account-types',
    title: 'Account Types',
    description: 'Manage account types for financial categorization',
    icon: 'fa-layer-group',
    path: '/account-types',
    category: 'Financial Management',
    priority: 'high',
    status: 'active',
    features: [
      'Create and manage account types',
      'Categorize accounts (Asset, Liability, Equity, Revenue, Expense)',
      'Define account nature (Debit/Credit)',
      'Search and filter account types',
      'Export to Excel/PDF',
      'Audit trail and history'
    ],
    permissions: ['admin', 'manager'],
    apiEndpoints: {
      list: '/api/administration/account-types',
      create: '/api/administration/account-types',
      update: '/api/administration/account-types/:id',
      delete: '/api/administration/account-types/:id',
      view: '/api/administration/account-types/:id'
    },
    tableColumns: [
      { key: 'icon', label: 'Icon', sortable: false, width: '60px' },
      { key: 'name', label: 'Name', sortable: true, width: '200px' },
      { key: 'code', label: 'Code', sortable: true, width: '120px' },
      { key: 'category', label: 'Category', sortable: true, width: '150px' },
      { key: 'description', label: 'Description', sortable: false, width: '250px' },
      { key: 'nature', label: 'Nature', sortable: true, width: '120px' },
      { key: 'is_active', label: 'Status', sortable: true, width: '100px' },
      { key: 'actions', label: 'Actions', sortable: false, width: '120px' }
    ],
    formFields: [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Enter account type name',
        validation: {
          minLength: 2,
          maxLength: 100,
          pattern: /^[a-zA-Z0-9\s\-_]+$/
        }
      },
      {
        name: 'code',
        label: 'Code',
        type: 'text',
        required: true,
        placeholder: 'Enter code',
        validation: {
          minLength: 2,
          maxLength: 20,
          pattern: /^[A-Z0-9_]+$/
        }
      },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: [
          { value: 'ASSET', label: 'Asset' },
          { value: 'LIABILITY', label: 'Liability' },
          { value: 'EQUITY', label: 'Equity' },
          { value: 'REVENUE', label: 'Revenue' },
          { value: 'EXPENSE', label: 'Expense' }
        ]
      },
      {
        name: 'nature',
        label: 'Nature',
        type: 'select',
        required: true,
        options: [
          { value: 'DEBIT', label: 'Debit' },
          { value: 'CREDIT', label: 'Credit' }
        ]
      },
      {
        name: 'is_active',
        label: 'Status',
        type: 'select',
        required: false,
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' }
        ]
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        placeholder: 'Enter a description (optional)',
        validation: {
          maxLength: 500
        }
      }
    ],
    searchFields: ['name', 'code', 'description'],
    sortOptions: [
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { key: 'category', label: 'Category' },
      { key: 'nature', label: 'Nature' },
      { key: 'is_active', label: 'Status' },
      { key: 'created_at', label: 'Created Date' }
    ],
    filters: [
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          { value: 'ASSET', label: 'Asset' },
          { value: 'LIABILITY', label: 'Liability' },
          { value: 'EQUITY', label: 'Equity' },
          { value: 'REVENUE', label: 'Revenue' },
          { value: 'EXPENSE', label: 'Expense' }
        ]
      },
      {
        key: 'nature',
        label: 'Nature',
        type: 'select',
        options: [
          { value: 'DEBIT', label: 'Debit' },
          { value: 'CREDIT', label: 'Credit' }
        ]
      },
      {
        key: 'is_active',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' }
        ]
      }
    ],
    exportOptions: {
      excel: true,
      pdf: true,
      csv: true
    },
    breadcrumbs: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Advance Setup', path: '/advance-setup' },
      { label: 'Account Types', path: '/account-types' }
    ]
  }
];

export default accountTypeModules; 