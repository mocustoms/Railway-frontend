import { Receipt } from 'lucide-react';
import { ExpenseTypeFormData, ExpenseTypeFilters, ExpenseTypeSortConfig, ExpenseTypeStats } from '../types';

// Default form data
export const defaultExpenseTypeFormData: ExpenseTypeFormData = {
  // code is auto-generated, not included in form
  name: '',
  description: '',
  account_id: '',
  order_of_display: 1,
  is_active: true
};

// Default filters
export const defaultExpenseTypeFilters: ExpenseTypeFilters = {
  search: '',
  status: 'all',
  accountId: ''
};

// Default sort configuration
export const defaultExpenseTypeSortConfig: ExpenseTypeSortConfig = {
  column: 'name',
  direction: 'asc'
};

// Default stats
export const defaultExpenseTypeStats: ExpenseTypeStats = {
  totalExpenseTypes: 0,
  activeExpenseTypes: 0,
  inactiveExpenseTypes: 0,
  lastUpdate: undefined
};

// Validation rules
export const expenseTypeValidationRules = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'Name is required and must be between 1 and 100 characters'
  },
  account_id: {
    required: true,
    message: 'Account is required'
  },
  order_of_display: {
    required: true,
    min: 1,
    max: 9999,
    message: 'Display order must be between 1 and 9999'
  }
};

// Error messages
export const expenseTypeErrorMessages = {
  name: {
    required: 'Expense type name is required',
    minLength: 'Name must be at least 1 character long',
    maxLength: 'Name must not exceed 100 characters'
  },
  account_id: {
    required: 'Account is required',
    invalid: 'Invalid account selected'
  },
  order_of_display: {
    required: 'Display order is required',
    min: 'Display order must be at least 1',
    max: 'Display order must not exceed 9999'
  }
};

// Success messages
export const expenseTypeSuccessMessages = {
  create: 'Expense type created successfully',
  update: 'Expense type updated successfully',
  delete: 'Expense type deleted successfully',
  toggleStatus: 'Expense type status updated successfully',
  exportExcel: 'Excel file exported successfully',
  exportPdf: 'PDF file exported successfully'
};

// Module configuration
export const expenseTypeModuleConfig = {
  title: 'Expense Types',
  description: 'Manage expense types and link them to chart of accounts',
  icon: Receipt,
  path: '/app-accounts/settings/expenses',
  tags: ['expense', 'types', 'accounts', 'financial'],
  permissions: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'accountant'],
    update: ['admin', 'manager'],
    delete: ['admin'],
    export: ['admin', 'manager']
  }
};

// Statistics configuration
export const expenseTypeStatisticsConfig = {
  totalExpenseTypes: {
    label: 'Total Expense Types',
    color: 'blue',
    icon: Receipt
  },
  activeExpenseTypes: {
    label: 'Active Expense Types',
    color: 'green',
    icon: Receipt
  },
  inactiveExpenseTypes: {
    label: 'Inactive Expense Types',
    color: 'red',
    icon: Receipt
  }
};

// Column visibility configuration
export const expenseTypeColumnVisibilityConfig = {
  code: true,
  name: true,
  description: true,
  account: true,
  order_of_display: true,
  is_active: true,
  created_by_name: false,
  updated_by_name: false,
  created_at: false,
  updated_at: false
};
