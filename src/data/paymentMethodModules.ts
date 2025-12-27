import { DollarSign } from 'lucide-react';
import { PaymentMethodFormData, PaymentMethodFilters, PaymentMethodSortConfig, PaymentMethodStats } from '../types';

// Default form data
export const defaultPaymentMethodFormData: PaymentMethodFormData = {
  // code is auto-generated, not included in form
  name: '',
  deductsFromCustomerAccount: false,
  requiresBankDetails: false,
  uploadDocument: false,
  is_active: true
};

// Default filters
export const defaultPaymentMethodFilters: PaymentMethodFilters = {
  search: '',
  status: 'all'
};

// Default sort configuration
export const defaultPaymentMethodSortConfig: PaymentMethodSortConfig = {
  column: 'name',
  direction: 'asc'
};

// Default stats
export const defaultPaymentMethodStats: PaymentMethodStats = {
  totalPaymentMethods: 0,
  activePaymentMethods: 0,
  inactivePaymentMethods: 0,
  lastUpdate: undefined
};

// Validation rules
export const paymentMethodValidationRules = {
  code: {
    required: true,
    minLength: 1,
    maxLength: 20,
    pattern: /^[A-Z0-9_]+$/,
    message: 'Code is required and must contain only uppercase letters, numbers, and underscores'
  },
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'Name is required and must be between 1 and 100 characters'
  }
};

// Error messages
export const paymentMethodErrorMessages = {
  code: {
    required: 'Payment method code is required',
    minLength: 'Code must be at least 1 character long',
    maxLength: 'Code must not exceed 20 characters',
    pattern: 'Code must contain only uppercase letters, numbers, and underscores',
    unique: 'This code is already in use'
  },
  name: {
    required: 'Payment method name is required',
    minLength: 'Name must be at least 1 character long',
    maxLength: 'Name must not exceed 100 characters'
  }
};

// Success messages
export const paymentMethodSuccessMessages = {
  create: 'Payment method created successfully',
  update: 'Payment method updated successfully',
  delete: 'Payment method deleted successfully',
  toggleStatus: 'Payment method status updated successfully',
  exportExcel: 'Excel file exported successfully',
  exportPdf: 'PDF file exported successfully'
};

// Module configuration
export const paymentMethodModuleConfig = {
  title: 'Payment Methods',
  description: 'Manage payment methods and their configurations',
  icon: DollarSign,
  path: '/payment-methods',
  tags: ['payment', 'methods', 'transactions'],
  permissions: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'cashier'],
    update: ['admin', 'manager'],
    delete: ['admin'],
    export: ['admin', 'manager']
  }
};

// Statistics configuration
export const paymentMethodStatisticsConfig = {
  totalPaymentMethods: {
    label: 'Total Payment Methods',
    color: 'blue',
    icon: DollarSign
  },
  activePaymentMethods: {
    label: 'Active Payment Methods',
    color: 'green',
    icon: DollarSign
  },
  inactivePaymentMethods: {
    label: 'Inactive Payment Methods',
    color: 'red',
    icon: DollarSign
  }
};

// Column visibility configuration
export const paymentMethodColumnVisibilityConfig = {
  code: true,
  name: true,
  deductsFromCustomerAccount: true,
  requiresBankDetails: true,
  uploadDocument: true,
  is_active: true,
  createdBy: false,
  updatedBy: false,
  createdAt: false,
  updatedAt: false
};