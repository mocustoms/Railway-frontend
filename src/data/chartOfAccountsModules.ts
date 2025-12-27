import { Module } from '../types';

export const chartOfAccountsModules: Module[] = [
  {
    id: 'chart-of-accounts',
    title: 'Chart of Accounts',
    description: 'Organize and structure your account hierarchy with parent-child relationships',
    icon: 'Network',
    path: '/chart-of-accounts',
    category: 'Financial Management',
    priority: 'high',
    status: 'active',
    features: [
      'Hierarchical account structure',
      'Parent-child relationships',
      'Account type integration',
      'Smart code suggestions',
      'Real-time search',
      'Expand/collapse tree',
      'CRUD operations',
      'Form validation'
    ],
    permissions: ['admin', 'manager'],
    apiEndpoints: {
      list: '/api/accounts',
      create: '/api/accounts',
      update: '/api/accounts/:id',
      delete: '/api/accounts/:id',
      view: '/api/accounts/:id'
    },
    tableColumns: [
      { key: 'name', label: 'Name', sortable: true, width: '200px' },
      { key: 'code', label: 'Code', sortable: true, width: '120px' },
      { key: 'type', label: 'Type', sortable: true, width: '150px' },
      { key: 'status', label: 'Status', sortable: true, width: '100px' },
      { key: 'actions', label: 'Actions', sortable: false, width: '120px' }
    ],
    formFields: [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Enter account name',
        validation: {
          minLength: 2,
          maxLength: 100
        }
      },
      {
        name: 'code',
        label: 'Code',
        type: 'text',
        required: true,
        placeholder: 'Enter code',
        validation: {
          minLength: 3,
          maxLength: 10,
          pattern: /^\d{3,10}$/
        }
      },
      {
        name: 'type',
        label: 'Type',
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
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        placeholder: 'Enter description',
        validation: {
          maxLength: 500
        }
      }
    ],
    searchFields: ['name', 'code', 'type', 'status', 'description'],
    sortOptions: [
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created Date' }
    ],
    filters: [
      {
        key: 'type',
        label: 'Type',
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
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
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
    breadcrumbs: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Accounts', path: '/accounts' },
      { label: 'Chart of Accounts', path: '/chart-of-accounts' }
    ]
  }
];

export const accountTypeRanges = {
  'ASSET': { start: 1000, end: 1999, color: '#10b981', bgColor: '#dcfce7' },
  'LIABILITY': { start: 2000, end: 2999, color: '#ef4444', bgColor: '#fef2f2' },
  'EQUITY': { start: 3000, end: 3999, color: '#3b82f6', bgColor: '#dbeafe' },
  'REVENUE': { start: 4000, end: 4999, color: '#f59e0b', bgColor: '#fef3c7' },
  'EXPENSE': { start: 5000, end: 5999, color: '#8b5cf6', bgColor: '#f3e8ff' }
};

export const accountTypeIcons = {
  'ASSET': 'PiggyBank',
  'LIABILITY': 'CreditCard',
  'EQUITY': 'TrendingUp',
  'REVENUE': 'ArrowUp',
  'EXPENSE': 'ArrowDown'
};

export const accountTypeDescriptions = {
  'ASSET': 'Resources owned by the business that have economic value',
  'LIABILITY': 'Obligations and debts owed by the business',
  'EQUITY': 'Owner\'s investment and retained earnings',
  'REVENUE': 'Income generated from business activities',
  'EXPENSE': 'Costs incurred in running the business'
};

export const validationRules = {
  code: {
    pattern: /^\d{3,10}$/,
    message: 'Code must be 3-10 digits (numbers only)'
  },
  name: {
    minLength: 2,
    maxLength: 100
  },
  description: {
    maxLength: 500,
    message: 'Description must not exceed 500 characters'
  }
};

export const searchFields = [
  'name',
  'code',
  'type',
  'status',
  'description'
];

export const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'type', label: 'Type' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created Date' }
];

export const filterOptions = {
  type: [
    { value: 'ASSET', label: 'Asset' },
    { value: 'LIABILITY', label: 'Liability' },
    { value: 'EQUITY', label: 'Equity' },
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'EXPENSE', label: 'Expense' }
  ],
  status: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]
};

export default chartOfAccountsModules; 