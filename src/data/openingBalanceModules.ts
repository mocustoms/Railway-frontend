import { Module } from '../types';

// Account type nature mapping
export const accountTypeNature: Record<string, 'DEBIT' | 'CREDIT'> = {
  'ASSET': 'DEBIT',
  'LIABILITY': 'CREDIT',
  'EQUITY': 'CREDIT',
  'REVENUE': 'CREDIT',
  'EXPENSE': 'DEBIT'
};

// Account type icons for display
export const accountTypeIcons: Record<string, string> = {
  'ASSET': 'fa-building',
  'LIABILITY': 'fa-credit-card',
  'EQUITY': 'fa-chart-line',
  'REVENUE': 'fa-arrow-up',
  'EXPENSE': 'fa-arrow-down'
};

// Opening balance type options
export const openingBalanceTypes = [
  { value: 'debit', label: 'Debit', color: 'text-red-600' },
  { value: 'credit', label: 'Credit', color: 'text-green-600' }
];

// Form validation schema
export const openingBalanceValidation = {
  accountId: {
    required: 'Account is required'
  },
  date: {
    required: 'Date is required',
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Date must be in YYYY-MM-DD format'
  },
  amount: {
    required: 'Amount is required',
    min: 0,
    message: 'Amount must be a positive number'
  },
  type: {
    required: 'Type is required',
    enum: ['debit', 'credit']
  },
  currencyId: {
    optional: true
  },
  financialYearId: {
    optional: true
  },
  description: {
    maxLength: 500,
    message: 'Description must not exceed 500 characters'
  }
};

// Column visibility configuration
export const columnVisibilityConfig = {
  showAccountCode: { key: 'account_code', label: 'Account Code', defaultVisible: true },
  showAccountType: { key: 'account_type', label: 'Account Type', defaultVisible: true },
  showCurrency: { key: 'currency', label: 'Currency', defaultVisible: true },
  showExchangeRate: { key: 'exchange_rate', label: 'Exchange Rate', defaultVisible: true },
  showFinancialYear: { key: 'financial_year', label: 'Financial Year', defaultVisible: true },
  showCreatedBy: { key: 'created_by', label: 'Created By', defaultVisible: true },
  showCreatedDate: { key: 'created_at', label: 'Created Date', defaultVisible: true },
  showUpdatedBy: { key: 'updated_by', label: 'Updated By', defaultVisible: true },
  showUpdatedDate: { key: 'updated_at', label: 'Updated Date', defaultVisible: true }
};

// Statistics configuration
export const statisticsConfig = {
  totalOpeningBalances: {
    label: 'Total Opening Balances',
    icon: 'fa-file-invoice-dollar',
    color: 'bg-blue-500',
    description: 'Total number of opening balance entries'
  },
  totalDebitAmount: {
    label: 'Total Debit Amount',
    icon: 'fa-arrow-down',
    color: 'bg-red-500',
    description: 'Sum of all debit opening balances'
  },
  totalCreditAmount: {
    label: 'Total Credit Amount',
    icon: 'fa-arrow-up',
    color: 'bg-green-500',
    description: 'Sum of all credit opening balances'
  },
  activeFinancialYears: {
    label: 'Active Financial Years',
    icon: 'fa-calendar-alt',
    color: 'bg-purple-500',
    description: 'Number of financial years with opening balances'
  }
};

// Import configuration
export const importConfig = {
  templateFields: [
    { name: 'accountCode', label: 'Account Code', required: true },
    { name: 'accountName', label: 'Account Name', required: false },
    { name: 'amount', label: 'Amount', required: true },
    { name: 'type', label: 'Type (debit/credit)', required: true },
    { name: 'date', label: 'Date (YYYY-MM-DD)', required: true },
    { name: 'description', label: 'Description', required: false },
    { name: 'currencyCode', label: 'Currency Code', required: false },
    { name: 'exchangeRate', label: 'Exchange Rate', required: false },
    { name: 'financialYear', label: 'Financial Year', required: false }
  ],
  validationRules: {
    accountCode: {
      required: true,
      pattern: /^[A-Z0-9]+$/
    },
    amount: {
      required: true,
      pattern: /^\d+(\.\d{1,2})?$/
    },
    type: {
      required: true,
      enum: ['debit', 'credit']
    },
    date: {
      required: true,
      pattern: /^\d{4}-\d{2}-\d{2}$/
    }
  }
};

// Export configuration
export const exportConfig = {
  formats: ['excel', 'pdf', 'csv'],
  columns: [
    { key: 'account', label: 'Account', visible: true },
    { key: 'account_code', label: 'Account Code', visible: true },
    { key: 'account_type', label: 'Account Type', visible: true },
    { key: 'type', label: 'Type', visible: true },
    { key: 'date', label: 'Date', visible: true },
    { key: 'description', label: 'Description', visible: true },
    { key: 'amount', label: 'Amount', visible: true },
    { key: 'equivalent_amount', label: 'Equivalent Amount', visible: true },
    { key: 'currency', label: 'Currency', visible: true },
    { key: 'exchange_rate', label: 'Exchange Rate', visible: true },
    { key: 'financial_year', label: 'Financial Year', visible: true },
    { key: 'reference_number', label: 'Reference Number', visible: true },
    { key: 'created_by', label: 'Created By', visible: true },
    { key: 'created_at', label: 'Created Date', visible: true },
    { key: 'updated_by', label: 'Updated By', visible: true },
    { key: 'updated_at', label: 'Updated Date', visible: true }
  ]
};

export const openingBalanceModules: Module[] = [
  {
    id: 'opening-balances',
    title: 'Opening Balances',
    description: 'Manage opening balances for financial accounts with multi-currency support and exchange rate calculations',
    icon: 'fa-file-invoice-dollar',
    path: '/accounts/opening-balances',
    category: 'Financial Management',
    priority: 'high',
    status: 'active',
    features: [
      'Create and manage opening balances',
      'Multi-currency support with exchange rates',
      'Financial year assignment',
      'Account-based opening balances',
      'Import from Excel/CSV',
      'Export to Excel/PDF',
      'Reference number generation',
      'Audit trail and history',
      'General ledger integration',
      'Statistics dashboard'
    ],
    permissions: ['admin', 'manager', 'accountant'],
    apiEndpoints: {
      list: '/api/opening-balances',
      create: '/api/opening-balances',
      update: '/api/opening-balances/:id',
      delete: '/api/opening-balances/:id',
      view: '/api/opening-balances/:id',
      import: '/api/opening-balances/import',
      export: '/api/opening-balances/export'
    },
    tableColumns: [
      { key: 'account', label: 'Account', sortable: true, width: '200px' },
      { key: 'account_code', label: 'Account Code', sortable: true, width: '120px' },
      { key: 'account_type', label: 'Account Type', sortable: true, width: '150px' },
      { key: 'type', label: 'Type', sortable: true, width: '100px' },
      { key: 'date', label: 'Date', sortable: true, width: '120px' },
      { key: 'description', label: 'Description', sortable: true, width: '250px' },
      { key: 'amount', label: 'Amount', sortable: true, width: '120px' },
      { key: 'equivalent_amount', label: 'Equivalent Amount', sortable: false, width: '150px' },
      { key: 'currency', label: 'Currency', sortable: true, width: '100px' },
      { key: 'exchange_rate', label: 'Exchange Rate', sortable: true, width: '120px' },
      { key: 'financial_year', label: 'Financial Year', sortable: true, width: '150px' },
      { key: 'reference_number', label: 'Reference Number', sortable: true, width: '150px' },
      { key: 'created_by', label: 'Created By', sortable: true, width: '120px' },
      { key: 'created_at', label: 'Created Date', sortable: true, width: '120px' },
      { key: 'updated_by', label: 'Updated By', sortable: true, width: '120px' },
      { key: 'updated_at', label: 'Updated Date', sortable: true, width: '120px' },
      { key: 'actions', label: 'Actions', sortable: false, width: '120px' }
    ],
    formFields: [
      {
        name: 'accountId',
        label: 'Account',
        type: 'select',
        required: true,
        placeholder: 'Select Account',
        validation: {
          required: 'Account is required'
        }
      },
      {
        name: 'date',
        label: 'Date',
        type: 'date',
        required: true,
        validation: {
          required: 'Date is required'
        }
      },
      {
        name: 'amount',
        label: 'Amount',
        type: 'number',
        required: true,
        placeholder: '0.00',
        validation: {
          required: 'Amount is required',
          min: 0,
          pattern: /^\d+(\.\d{1,2})?$/
        }
      },
      {
        name: 'type',
        label: 'Nature',
        type: 'text',
        required: true,
        readonly: true,
        validation: {
          required: 'Nature is required'
        }
      },
      {
        name: 'currencyId',
        label: 'Currency',
        type: 'select',
        required: false,
        placeholder: 'Select Currency',
        validation: {}
      },
      {
        name: 'financialYearId',
        label: 'Financial Year',
        type: 'select',
        required: false,
        placeholder: 'Select Financial Year',
        validation: {}
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        placeholder: 'Enter description...',
        validation: {
          maxLength: 500
        }
      }
    ],
    searchFields: ['account.name', 'account.code', 'description', 'referenceNumber'],
    sortOptions: [
      { key: 'account', label: 'Account' },
      { key: 'account_code', label: 'Account Code' },
      { key: 'account_type', label: 'Account Type' },
      { key: 'type', label: 'Type' },
      { key: 'date', label: 'Date' },
      { key: 'amount', label: 'Amount' },
      { key: 'currency', label: 'Currency' },
      { key: 'financial_year', label: 'Financial Year' },
      { key: 'reference_number', label: 'Reference Number' },
      { key: 'created_at', label: 'Created Date' },
      { key: 'updated_at', label: 'Updated Date' }
    ],
    filters: [
      {
        key: 'financialYearId',
        name: 'financialYearId',
        label: 'Financial Year',
        type: 'select',
        placeholder: 'All Financial Years'
      },
      {
        key: 'accountId',
        name: 'accountId',
        label: 'Account',
        type: 'select',
        placeholder: 'All Accounts'
      },
      {
        key: 'currencyId',
        name: 'currencyId',
        label: 'Currency',
        type: 'select',
        placeholder: 'All Currencies'
      },
      {
        key: 'type',
        name: 'type',
        label: 'Type',
        type: 'select',
        placeholder: 'All Types',
        options: [
          { value: 'debit', label: 'Debit' },
          { value: 'credit', label: 'Credit' }
        ]
      }
    ],
    exportOptions: {
      excel: true,
      pdf: true,
      csv: true
    },
    importConfig,
    exportConfig,
    breadcrumbs: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Accounts', path: '/accounts' },
      { label: 'Opening Balances', path: '/accounts/opening-balances' }
    ]
  }
];

// Default form data
export const defaultOpeningBalanceData = {
  accountId: '',
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  type: 'debit' as const,
  currencyId: '',
  financialYearId: '',
  referenceNumber: '',
  description: ''
};

// Error messages
export const errorMessages = {
  accountRequired: 'Account is required',
  dateRequired: 'Date is required',
  amountRequired: 'Amount is required',
  amountPositive: 'Amount must be a positive number',
  accountNotFound: 'Account not found',
  currencyNotFound: 'Currency not found',
  financialYearNotFound: 'Financial year not found',
  openingBalanceExists: 'Opening balance already exists for this account and financial year',
  cannotEditPreviousYear: 'Cannot edit opening balance for previous financial year',
  cannotDeletePreviousYear: 'Cannot delete opening balance for previous financial year',
  importFailed: 'Failed to import opening balances',
  exportFailed: 'Failed to export opening balances',
  templateDownloadFailed: 'Failed to download template',
  exchangeRateNotFound: 'Exchange rate not found for the selected currency'
};

// Success messages
export const successMessages = {
  created: 'Opening balance created successfully',
  updated: 'Opening balance updated successfully',
  deleted: 'Opening balance deleted successfully',
  imported: 'Opening balances imported successfully',
  exported: 'Opening balances exported successfully'
}; 