import { CreditCard } from 'lucide-react';
import { PaymentTypeFormData, PaymentTypeFilters, PaymentTypeSortConfig, PaymentTypeStats } from '../types';

// Default form data
export const defaultPaymentTypeFormData: PaymentTypeFormData = {
  // code is auto-generated, not included in form
  name: '',
  payment_method_id: '',
  order_of_display: 1,
  default_account_id: '',
  used_in_sales: false,
  used_in_debtor_payments: false,
  used_in_credit_payments: false,
  used_in_customer_deposits: false,
  used_in_refunds: false,
  display_in_cashier_report: false,
  used_in_banking: false,
  is_active: true
};

// Default filters
export const defaultPaymentTypeFilters: PaymentTypeFilters = {
  search: '',
  status: 'all',
  paymentMethodId: ''
};

// Default sort configuration
export const defaultPaymentTypeSortConfig: PaymentTypeSortConfig = {
  column: 'name',
  direction: 'asc'
};

// Default stats
export const defaultPaymentTypeStats: PaymentTypeStats = {
  totalPaymentTypes: 0,
  activePaymentTypes: 0,
  inactivePaymentTypes: 0,
  lastUpdate: undefined
};

// Validation rules
export const paymentTypeValidationRules = {
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
  },
  payment_method_id: {
    required: true,
    message: 'Payment method is required'
  },
  order_of_display: {
    required: true,
    min: 1,
    max: 9999,
    message: 'Display order must be between 1 and 9999'
  }
};

// Error messages
export const paymentTypeErrorMessages = {
  code: {
    required: 'Payment type code is required',
    minLength: 'Code must be at least 1 character long',
    maxLength: 'Code must not exceed 20 characters',
    pattern: 'Code must contain only uppercase letters, numbers, and underscores',
    unique: 'This code is already in use'
  },
  name: {
    required: 'Payment type name is required',
    minLength: 'Name must be at least 1 character long',
    maxLength: 'Name must not exceed 100 characters'
  },
  payment_method_id: {
    required: 'Payment method is required'
  },
  order_of_display: {
    required: 'Display order is required',
    min: 'Display order must be at least 1',
    max: 'Display order must not exceed 9999'
  },
  default_account_id: {
    invalid: 'Invalid account selected'
  }
};

// Success messages
export const paymentTypeSuccessMessages = {
  create: 'Payment type created successfully',
  update: 'Payment type updated successfully',
  delete: 'Payment type deleted successfully',
  toggleStatus: 'Payment type status updated successfully',
  exportExcel: 'Excel file exported successfully',
  exportPdf: 'PDF file exported successfully'
};

// Module configuration
export const paymentTypeModuleConfig = {
  title: 'Payment Types',
  description: 'Manage payment types and their configurations',
  icon: CreditCard,
  path: '/payment-types',
  tags: ['payment', 'types', 'methods', 'transactions'],
  permissions: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'cashier'],
    update: ['admin', 'manager'],
    delete: ['admin'],
    export: ['admin', 'manager']
  }
};

// Statistics configuration
export const paymentTypeStatisticsConfig = {
  totalPaymentTypes: {
    label: 'Total Payment Types',
    color: 'blue',
    icon: CreditCard
  },
  activePaymentTypes: {
    label: 'Active Payment Types',
    color: 'green',
    icon: CreditCard
  },
  inactivePaymentTypes: {
    label: 'Inactive Payment Types',
    color: 'red',
    icon: CreditCard
  }
};

// Column visibility configuration
export const paymentTypeColumnVisibilityConfig = {
  code: true,
  name: true,
  payment_method: true,
  order_of_display: true,
  default_account: false,
  used_in_sales: false,
  used_in_debtor_payments: false,
  used_in_credit_payments: false,
  used_in_customer_deposits: false,
  used_in_refunds: false,
  display_in_cashier_report: false,
  used_in_banking: false,
  is_active: true,
  created_by_name: false,
  updated_by_name: false,
  created_at: false,
  updated_at: false
};
