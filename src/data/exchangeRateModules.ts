import { ExchangeRate, ExchangeRateFilters, ExchangeRateSortConfig, ExchangeRateFormData } from '../types';

// Exchange Rate Status Options
export const exchangeRateStatusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

// Sortable Columns Configuration
export const sortableColumns: (keyof ExchangeRate)[] = [
  'from_currency_id',
  'to_currency_id', 
  'rate',
  'effective_date',
  'is_active',
  'created_at',
  'updated_at'
];

// Sort Configuration
export const defaultSortConfig: ExchangeRateSortConfig = {
  field: 'effective_date',
  direction: 'desc'
};

// Default Form Data
export const defaultExchangeRateFormData: ExchangeRateFormData = {
  from_currency_id: '',
  to_currency_id: '',
  rate: 1.0,
  effective_date: new Date().toISOString().split('T')[0],
  is_active: true
};

// Default Filters
export const defaultFilters: ExchangeRateFilters = {
  search: '',
  fromCurrency: '',
  toCurrency: '',
  status: 'all',
  dateFrom: '',
  dateTo: ''
};

// Module Configuration
export const exchangeRateModuleConfig = {
  name: 'Exchange Rates',
  description: 'Manage currency exchange rates for multi-currency support',
  icon: 'Exchange',
  path: '/exchange-rates',
  apiEndpoints: {
    list: '/api/exchange-rates',
    create: '/api/exchange-rates',
    update: '/api/exchange-rates/:id',
    delete: '/api/exchange-rates/:id',
    stats: '/api/exchange-rates/statistics',
    history: '/api/exchange-rates/history/:fromCurrencyId/:toCurrencyId',
    toggleStatus: '/api/exchange-rates/:id/toggle-status',
    exportExcel: '/api/exchange-rates/export/excel',
    exportPdf: '/api/exchange-rates/export/pdf'
  },
  tableColumns: [
    { key: 'fromCurrency', label: 'From Currency', sortable: true, width: 'w-1/6' },
    { key: 'toCurrency', label: 'To Currency', sortable: true, width: 'w-1/6' },
    { key: 'rate', label: 'Exchange Rate', sortable: true, width: 'w-1/6' },
    { key: 'effective_date', label: 'Effective Date', sortable: true, width: 'w-1/6' },
    { key: 'is_active', label: 'Status', sortable: true, width: 'w-1/6' },
    { key: 'actions', label: 'Actions', sortable: false, width: 'w-1/6' }
  ],
  searchFields: ['fromCurrency.code', 'fromCurrency.name', 'toCurrency.code', 'toCurrency.name'],
  sortOptions: [
    { key: 'effective_date', label: 'Effective Date' },
    { key: 'from_currency_id', label: 'From Currency' },
    { key: 'to_currency_id', label: 'To Currency' },
    { key: 'rate', label: 'Exchange Rate' },
    { key: 'created_at', label: 'Created Date' }
  ],
  filters: [
    {
      key: 'status',
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      placeholder: 'Select Status',
      options: exchangeRateStatusOptions
    },
    {
      key: 'dateFrom',
      name: 'dateFrom',
      label: 'Date From',
      type: 'date' as const,
      placeholder: 'Select Start Date'
    },
    {
      key: 'dateTo',
      name: 'dateTo',
      label: 'Date To',
      type: 'date' as const,
      placeholder: 'Select End Date'
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
      { key: 'fromCurrency', label: 'From Currency', visible: true },
      { key: 'toCurrency', label: 'To Currency', visible: true },
      { key: 'rate', label: 'Exchange Rate', visible: true },
      { key: 'effective_date', label: 'Effective Date', visible: true },
      { key: 'is_active', label: 'Status', visible: true },
      { key: 'created_at', label: 'Created Date', visible: true },
      { key: 'creator', label: 'Created By', visible: true }
    ]
  }
};

// Validation Rules
export const exchangeRateValidationRules = {
  from_currency_id: {
    required: 'From Currency is required',
    validate: (value: string) => {
      if (!value) return 'From Currency is required';
      return true;
    }
  },
  to_currency_id: {
    required: 'To Currency is required',
    validate: (value: string, formData: ExchangeRateFormData) => {
      if (!value) return 'To Currency is required';
      if (value === formData.from_currency_id) {
        return 'From Currency and To Currency cannot be the same';
      }
      return true;
    }
  },
  rate: {
    required: 'Exchange Rate is required',
    min: { value: 0.000001, message: 'Exchange Rate must be greater than 0' },
    max: { value: 999999.999999, message: 'Exchange Rate must be less than 1,000,000' },
    validate: (value: number) => {
      if (!value || value <= 0) return 'Exchange Rate must be greater than 0';
      if (value > 999999.999999) return 'Exchange Rate must be less than 1,000,000';
      return true;
    }
  },
  effective_date: {
    required: 'Effective Date is required',
    validate: (value: string) => {
      if (!value) return 'Effective Date is required';
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Invalid date format';
      return true;
    }
  }
};

// Error Messages
export const exchangeRateErrorMessages = {
  FETCH_FAILED: 'Failed to fetch exchange rates',
  CREATE_FAILED: 'Failed to create exchange rate',
  UPDATE_FAILED: 'Failed to update exchange rate',
  DELETE_FAILED: 'Failed to delete exchange rate',
  TOGGLE_STATUS_FAILED: 'Failed to toggle exchange rate status',
  EXPORT_FAILED: 'Failed to export exchange rates',
  HISTORY_FETCH_FAILED: 'Failed to fetch exchange rate history',
  DUPLICATE_RATE: 'An exchange rate already exists for this currency pair and effective date',
  INVALID_CURRENCY_PAIR: 'From Currency and To Currency cannot be the same',
  INVALID_RATE: 'Exchange Rate must be a positive number',
  INVALID_DATE: 'Effective Date must be a valid date',
  REQUIRED_FIELDS: 'Please fill in all required fields'
};

// Success Messages
export const exchangeRateSuccessMessages = {
  CREATED: 'Exchange rate created successfully',
  UPDATED: 'Exchange rate updated successfully',
  DELETED: 'Exchange rate deleted successfully',
  STATUS_TOGGLED: 'Exchange rate status updated successfully',
  EXPORTED: 'Exchange rates exported successfully'
};

// Page Size Options
export const pageSizeOptions = [
  { value: 10, label: '10 per page' },
  { value: 25, label: '25 per page' },
  { value: 50, label: '50 per page' },
  { value: 100, label: '100 per page' }
];

// Default Page Size
export const defaultPageSize = 25; 