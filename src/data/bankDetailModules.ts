import { Building2 } from 'lucide-react';
import { BankDetailFormData, BankDetailFilters, BankDetailSortConfig, BankDetailStats } from '../types';

// Default form data
export const defaultBankDetailFormData: BankDetailFormData = {
  code: '',
  bankName: '',
  branch: '',
  accountNumber: '',
  accountId: '',
  is_active: true
};

// Default filters
export const defaultBankDetailFilters: BankDetailFilters = {
  search: '',
  status: 'all'
};

// Default sort configuration
export const defaultBankDetailSortConfig: BankDetailSortConfig = {
  column: 'code',
  direction: 'asc'
};

// Default stats
export const defaultBankDetailStats: BankDetailStats = {
  totalBankDetails: 0,
  activeBankDetails: 0,
  inactiveBankDetails: 0,
  lastUpdate: undefined
};

// Validation rules
export const bankDetailValidationRules = {
  code: {
    required: true,
    minLength: 1,
    maxLength: 20,
    pattern: /^[A-Z0-9_]+$/,
    message: 'Code is required and must contain only uppercase letters, numbers, and underscores'
  },
  bankName: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'Bank name is required and must be between 1 and 100 characters'
  },
  branch: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'Branch is required and must be between 1 and 100 characters'
  },
  accountNumber: {
    required: true,
    minLength: 1,
    maxLength: 50,
    message: 'Account number is required and must be between 1 and 50 characters'
  },
  accountId: {
    required: true,
    message: 'Account selection is required'
  }
};

// Error messages
export const bankDetailErrorMessages = {
  code: {
    required: 'Bank detail code is required',
    minLength: 'Code must be at least 1 character long',
    maxLength: 'Code must not exceed 20 characters',
    pattern: 'Code must contain only uppercase letters, numbers, and underscores',
    unique: 'This code is already in use'
  },
  bankName: {
    required: 'Bank name is required',
    minLength: 'Bank name must be at least 1 character long',
    maxLength: 'Bank name must not exceed 100 characters'
  },
  branch: {
    required: 'Branch is required',
    minLength: 'Branch must be at least 1 character long',
    maxLength: 'Branch must not exceed 100 characters'
  },
  accountNumber: {
    required: 'Account number is required',
    minLength: 'Account number must be at least 1 character long',
    maxLength: 'Account number must not exceed 50 characters'
  },
  accountId: {
    required: 'Account selection is required',
    invalid: 'Invalid account selected'
  }
};

// Success messages
export const bankDetailSuccessMessages = {
  create: 'Bank detail created successfully',
  update: 'Bank detail updated successfully',
  delete: 'Bank detail deleted successfully',
  toggleStatus: 'Bank detail status updated successfully',
  exportExcel: 'Excel file exported successfully',
  exportPdf: 'PDF file exported successfully'
};

// Module configuration
export const bankDetailModuleConfig = {
  title: 'Bank Details',
  description: 'Manage bank details and branch information',
  icon: Building2,
  path: '/bank-details',
  tags: ['bank', 'details', 'branch', 'banking'],
  permissions: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'cashier'],
    update: ['admin', 'manager'],
    delete: ['admin'],
    export: ['admin', 'manager']
  }
};

// Statistics configuration
export const bankDetailStatisticsConfig = {
  totalBankDetails: {
    label: 'Total Bank Details',
    color: 'blue',
    icon: Building2
  },
  activeBankDetails: {
    label: 'Active Bank Details',
    color: 'green',
    icon: Building2
  },
  inactiveBankDetails: {
    label: 'Inactive Bank Details',
    color: 'red',
    icon: Building2
  }
};

// Column visibility configuration
export const bankDetailColumnVisibilityConfig = {
  code: true,
  bankName: true,
  branch: true,
  accountNumber: true,
  accountId: true,
  is_active: true,
  createdBy: false,
  updatedBy: false,
  createdAt: false,
  updatedAt: false
};
