import { CreditCard } from 'lucide-react';
import { CustomerDepositFormData, CustomerDepositFilters, CustomerDepositSortConfig, CustomerDepositStats } from '../types';

export const defaultCustomerDepositFormData: CustomerDepositFormData = {
  customerId: '',
  paymentTypeId: '',
  chequeNumber: '',
  bankDetailId: '',
  branch: '',
  currencyId: '',
  exchangeRate: 1.0,
  exchangeRateId: '',
  documentPath: '',
  document: undefined,
  depositAmount: 0,
  equivalentAmount: 0,
  description: '',
  liabilityAccountId: '',
  assetAccountId: '',
  transactionDate: new Date().toISOString().split('T')[0]
};

export const defaultCustomerDepositFilters: CustomerDepositFilters = {
  search: '',
  customerId: '',
  paymentTypeId: '',
  currencyId: '',
  bankDetailId: '',
  startDate: '',
  endDate: ''
};

export const defaultCustomerDepositSortConfig: CustomerDepositSortConfig = {
  column: 'transactionDate',
  direction: 'desc'
};

export const defaultCustomerDepositStats: CustomerDepositStats = {
  totalDeposits: 0,
  activeDeposits: 0,
  inactiveDeposits: 0,
  totalDepositAmount: 0,
  totalEquivalentAmount: 0,
  lastUpdate: new Date().toISOString()
};

export const customerDepositValidationRules = {
  customerId: {
    required: true,
    message: 'Customer selection is required'
  },
  paymentTypeId: {
    required: true,
    message: 'Payment type selection is required'
  },
  currencyId: {
    required: true,
    message: 'Currency selection is required'
  },
  exchangeRate: {
    required: true,
    min: 0.0001,
    message: 'Exchange rate must be greater than 0'
  },
  depositAmount: {
    required: true,
    min: 0.01,
    message: 'Deposit amount must be greater than 0'
  },
  liabilityAccountId: {
    required: true,
    message: 'Liability account selection is required'
  },
  assetAccountId: {
    required: true,
    message: 'Asset account selection is required'
  },
  transactionDate: {
    required: true,
    message: 'Transaction date is required'
  },
  chequeNumber: {
    maxLength: 50,
    message: 'Cheque number must not exceed 50 characters'
  },
  description: {
    maxLength: 500,
    message: 'Description must not exceed 500 characters'
  }
};

export const customerDepositErrorMessages = {
  customerId: {
    required: 'Customer selection is required',
    invalid: 'Invalid customer selected'
  },
  paymentTypeId: {
    required: 'Payment type selection is required',
    invalid: 'Invalid payment type selected'
  },
  currencyId: {
    required: 'Currency selection is required',
    invalid: 'Invalid currency selected'
  },
  exchangeRate: {
    required: 'Exchange rate is required',
    min: 'Exchange rate must be greater than 0',
    invalid: 'Invalid exchange rate'
  },
  depositAmount: {
    required: 'Deposit amount is required',
    min: 'Deposit amount must be greater than 0',
    invalid: 'Invalid deposit amount'
  },
  liabilityAccountId: {
    required: 'Liability account selection is required',
    invalid: 'Invalid liability account selected'
  },
  assetAccountId: {
    required: 'Asset account selection is required',
    invalid: 'Invalid asset account selected'
  },
  transactionDate: {
    required: 'Transaction date is required',
    invalid: 'Invalid transaction date'
  },
  chequeNumber: {
    maxLength: 'Cheque number must not exceed 50 characters'
  },
  description: {
    maxLength: 'Description must not exceed 500 characters'
  }
};

export const customerDepositColumnVisibilityConfig = {
  depositReferenceNumber: true,
  customer: true,
  paymentType: true,
  chequeNumber: true,
  bankDetail: true,
  currency: true,
  depositAmount: true,
  liabilityAccount: true,
  assetAccount: true,
  transactionDate: true,
  is_active: true,
  createdBy: false,
  updatedBy: false,
  createdAt: false,
  updatedAt: false
};

export const customerDepositModuleConfig = {
  title: 'Customer Deposits',
  description: 'Manage customer deposits and account balances',
  icon: CreditCard,
  path: '/customer-deposits',
  permissions: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'cashier'],
    update: ['admin', 'manager'],
    delete: ['admin', 'manager']
  },
  table: {
    columns: [
      { key: 'depositReferenceNumber', header: 'Reference', sortable: true },
      { key: 'customer', header: 'Customer', sortable: true },
      { key: 'paymentType', header: 'Payment Type', sortable: true },
      { key: 'chequeNumber', header: 'Cheque Number', sortable: true },
      { key: 'bankDetail', header: 'Bank Details', sortable: true },
      { key: 'currency', header: 'Currency', sortable: true },
      { key: 'depositAmount', header: 'Amount', sortable: true },
      { key: 'equivalentAmount', header: 'Equivalent Amount', sortable: true },
      { key: 'liabilityAccount', header: 'Liability Account', sortable: true },
      { key: 'assetAccount', header: 'Asset Account', sortable: true },
      { key: 'transactionDate', header: 'Transaction Date', sortable: true },
      { key: 'is_active', header: 'Status', sortable: true },
      { key: 'createdBy', header: 'Created By', sortable: true },
      { key: 'createdAt', header: 'Created Date', sortable: true }
    ],
    defaultSort: { column: 'transactionDate', direction: 'desc' as const },
    pageSize: 25,
    showColumnControls: true
  },
  filters: {
    search: {
      enabled: true,
      placeholder: 'Search by reference, customer, payment type...',
      fields: ['depositReferenceNumber', 'customer.full_name', 'paymentType.name']
    },
    status: {
      enabled: true,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    dateRange: {
      enabled: true,
      fields: ['transactionDate']
    }
  },
  statusOptions: [
    { value: true, label: 'Active', color: 'green' },
    { value: false, label: 'Inactive', color: 'red' }
  ],
  form: {
    fields: [
      {
        name: 'customerId',
        label: 'Customer',
        type: 'searchableDropdown',
        required: true,
        placeholder: 'Search and select customer...',
        searchPlaceholder: 'Search by name, ID, phone, or email...'
      },
      {
        name: 'paymentTypeId',
        label: 'Payment Type',
        type: 'dropdown',
        required: true,
        placeholder: 'Select payment type...'
      },
      {
        name: 'chequeNumber',
        label: 'Cheque Number',
        type: 'text',
        required: false,
        placeholder: 'Enter cheque number',
        conditional: {
          field: 'paymentTypeId',
          condition: 'requiresBankDetails'
        }
      },
      {
        name: 'bankDetailId',
        label: 'Bank',
        type: 'dropdown',
        required: false,
        placeholder: 'Select bank...',
        conditional: {
          field: 'paymentTypeId',
          condition: 'requiresBankDetails'
        }
      },
      {
        name: 'currencyId',
        label: 'Currency',
        type: 'dropdown',
        required: true,
        placeholder: 'Select currency...'
      },
      {
        name: 'documentPath',
        label: 'Document',
        type: 'file',
        required: false,
        placeholder: 'Upload document',
        conditional: {
          field: 'paymentTypeId',
          condition: 'uploadDocument'
        }
      },
      {
        name: 'depositAmount',
        label: 'Deposit Amount',
        type: 'number',
        required: true,
        placeholder: 'Enter deposit amount',
        min: 0.01,
        step: 0.01
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        placeholder: 'Enter description...',
        rows: 3
      },
      {
        name: 'liabilityAccountId',
        label: 'Liability Account',
        type: 'dropdown',
        required: true,
        placeholder: 'Select liability account...'
      },
      {
        name: 'assetAccountId',
        label: 'Asset Account',
        type: 'dropdown',
        required: true,
        placeholder: 'Select asset account...'
      },
      {
        name: 'transactionDate',
        label: 'Transaction Date',
        type: 'date',
        required: true,
        placeholder: 'Select transaction date'
      }
    ],
    layout: 'grid',
    gridColumns: 2
  },
  workflow: {
    create: {
      enabled: true,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to create this customer deposit?'
    },
    update: {
      enabled: true,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to update this customer deposit?'
    },
    delete: {
      enabled: true,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to delete this customer deposit? This action cannot be undone.'
    },
    toggleStatus: {
      enabled: true,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to change the status of this customer deposit?'
    }
  },
  export: {
    excel: {
      enabled: true,
      filename: 'customer-deposits',
      includeFilters: true
    },
    pdf: {
      enabled: true,
      filename: 'customer-deposits',
      includeFilters: true
    }
  },
  validation: {
    rules: customerDepositValidationRules,
    messages: customerDepositErrorMessages
  },
  notifications: {
    create: {
      success: 'Customer deposit created successfully',
      error: 'Failed to create customer deposit'
    },
    update: {
      success: 'Customer deposit updated successfully',
      error: 'Failed to update customer deposit'
    },
    delete: {
      success: 'Customer deposit deleted successfully',
      error: 'Failed to delete customer deposit'
    },
    toggleStatus: {
      success: 'Customer deposit status updated successfully',
      error: 'Failed to update customer deposit status'
    }
  },
  analytics: {
    enabled: true,
    metrics: [
      'totalDeposits',
      'activeDeposits',
      'inactiveDeposits',
      'totalDepositAmount'
    ]
  }
};
