import { ShoppingCart, FileText } from 'lucide-react';
import { SalesInvoiceFilters, SalesInvoiceSortConfig, SalesInvoiceStats } from '../types';

export interface SalesInvoiceModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  category: 'sales';
  tags: string[];
  color: string;
  gradient: string;
  features: string[];
  priority: 'high' | 'medium' | 'low';
  status?: 'active' | 'warning' | 'error' | 'pending';
  isRequired?: boolean;
}

export const SALES_INVOICE_MODULE: SalesInvoiceModule = {
  id: 'sales-invoices',
  title: 'Sales Invoices',
  description: 'Create and manage sales invoices for customers',
  icon: FileText,
  path: '/sales/sales-invoices',
  category: 'sales',
  tags: ['orders', 'sales', 'customers', 'fulfillment'],
  color: '#10b981',
  gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  features: ['Order creation', 'Customer management', 'Multi-currency support', 'Status tracking', 'Fulfillment tracking', 'Export functionality'],
  priority: 'high',
  status: 'active',
  isRequired: true
};

export const defaultSalesInvoiceFilters: SalesInvoiceFilters = {
  search: '',
  status: undefined,
  storeId: undefined,
  customerId: undefined,
  currencyId: undefined,
  dateFrom: undefined,
  dateTo: undefined
};

export const defaultSalesInvoiceSortConfig: SalesInvoiceSortConfig = {
  field: 'createdAt',
  direction: 'desc'
};

export const defaultSalesInvoiceStats: SalesInvoiceStats = {
  total: 0,
  draft: 0,
  sent: 0,
  paid: 0,
  partialPaid: 0,
  overdue: 0,
  cancelled: 0,
  totalValue: 0,
  thisMonth: 0,
  lastMonth: 0
};

export const salesInvoiceStatusConfig = {
  draft: { 
    label: 'Draft', 
    color: '#6b7280', 
    bgColor: '#f9fafb', 
    textColor: 'text-gray-800',
    icon: 'fas fa-edit'
  },
  sent: { 
    label: 'Sent', 
    color: '#3b82f6', 
    bgColor: '#eff6ff', 
    textColor: 'text-blue-800',
    icon: 'fas fa-paper-plane'
  },
  paid: { 
    label: 'Paid', 
    color: '#10b981', 
    bgColor: '#f0fdf4', 
    textColor: 'text-green-800',
    icon: 'fas fa-check-circle'
  },
  partial_paid: { 
    label: 'Partial Paid', 
    color: '#3b82f6', 
    bgColor: '#eff6ff', 
    textColor: 'text-blue-800',
    icon: 'fas fa-check-double'
  },
  overdue: { 
    label: 'Overdue', 
    color: '#ef4444', 
    bgColor: '#fef2f2', 
    textColor: 'text-red-800',
    icon: 'fas fa-exclamation-triangle'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: '#6b7280', 
    bgColor: '#f9fafb', 
    textColor: 'text-gray-800',
    icon: 'fas fa-times-circle'
  }
};

export const salesInvoiceModuleConfig = {
  title: 'Sales Orders Management',
  description: 'Create and manage sales orders for customers',
  icon: 'ShoppingCart',
  path: '/sales/sales-orders',
  category: 'Sales',
  priority: 'high' as const,
  features: [
    'Create sales invoices',
    'Customer selection and details',
    'Multi-step order creation',
    'Product line items management',
    'Tax and discount calculations',
    'Multi-currency support',
    'Status workflow (Draft → Sent → Paid/Partial Paid/Overdue/Cancelled)',
    'Payment tracking (paid amount, balance amount)',
    'Due date tracking and overdue detection',
    'Export to Excel and PDF',
    'Search and filtering',
    'Store-based operations'
  ],
  permissions: ['sales_invoices.view', 'sales_invoices.create', 'sales_invoices.edit', 'sales_invoices.delete'],
  apiEndpoints: {
    list: '/sales-invoices',
    create: '/sales-invoices',
    update: '/sales-invoices/:id',
    delete: '/sales-invoices/:id',
    view: '/sales-invoices/:id',
    stats: '/sales-invoices/stats',
    export: '/sales-invoices/export'
  },
  tableColumns: [
    { key: 'invoiceRefNumber', label: 'Reference Number', sortable: true, width: '150px', defaultVisible: true },
    { key: 'invoiceDate', label: 'Invoice Date', sortable: true, width: '100px', defaultVisible: true },
    { key: 'dueDate', label: 'Due Date', sortable: true, width: '100px', defaultVisible: true },
    { key: 'customerName', label: 'Customer', sortable: true, width: '200px', defaultVisible: true },
    { key: 'storeName', label: 'Store', sortable: true, width: '150px', defaultVisible: true },
    { key: 'status', label: 'Status', sortable: true, width: '100px', defaultVisible: true },
    { key: 'totalAmount', label: 'Total Amount', sortable: true, width: '120px', defaultVisible: true },
    { key: 'paidAmount', label: 'Paid Amount', sortable: true, width: '120px', defaultVisible: true },
    { key: 'balanceAmount', label: 'Balance', sortable: true, width: '120px', defaultVisible: true },
    { key: 'currencyName', label: 'Currency', sortable: true, width: '100px', defaultVisible: false },
    { key: 'createdByName', label: 'Created By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'createdAt', label: 'Created Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'paidAt', label: 'Paid Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'cancelledByName', label: 'Cancelled By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'cancelledAt', label: 'Cancelled Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'actions', label: 'Actions', sortable: false, width: '120px', defaultVisible: true }
  ],
  formFields: [
    {
      name: 'salesInvoiceRefNumber',
      label: 'Reference Number',
      type: 'text' as const,
      required: true,
      placeholder: 'Auto-generated',
      readonly: true,
      validation: {
        required: 'Reference number is required'
      }
    },
    {
      name: 'salesInvoiceDate',
      label: 'Sales Order Date',
      type: 'date' as const,
      required: true,
      validation: {
        required: 'Sales order date is required'
      }
    },
    {
      name: 'storeId',
      label: 'Store',
      type: 'select' as const,
      required: true,
      validation: {
        required: 'Store is required'
      }
    },
    {
      name: 'customerId',
      label: 'Customer',
      type: 'select' as const,
      required: true,
      validation: {
        required: 'Customer is required'
      }
    },
    {
      name: 'currencyId',
      label: 'Currency',
      type: 'select' as const,
      required: false,
      validation: {}
    },
    {
      name: 'dueDate',
      label: 'Valid Until',
      type: 'date' as const,
      required: false,
      validation: {}
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Enter additional notes (optional)',
      validation: {
        maxLength: { value: 500, message: 'Notes must not exceed 500 characters' }
      }
    },
    {
      name: 'termsConditions',
      label: 'Terms & Conditions',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Enter terms and conditions (optional)',
      validation: {
        maxLength: { value: 1000, message: 'Terms & conditions must not exceed 1000 characters' }
      }
    }
  ],
  searchFields: ['invoiceRefNumber', 'customerName', 'storeName', 'notes'],
  sortOptions: [
    { key: 'invoiceRefNumber', label: 'Reference Number', direction: 'asc' },
    { key: 'invoiceDate', label: 'Invoice Date', direction: 'desc' },
    { key: 'dueDate', label: 'Due Date', direction: 'desc' },
    { key: 'customerName', label: 'Customer', direction: 'asc' },
    { key: 'storeName', label: 'Store', direction: 'asc' },
    { key: 'status', label: 'Status', direction: 'asc' },
    { key: 'totalAmount', label: 'Total Amount', direction: 'desc' },
    { key: 'fulfilledAt', label: 'Fulfilled Date', direction: 'desc' },
    { key: 'createdAt', label: 'Created Date', direction: 'desc' },
    { key: 'updatedAt', label: 'Updated Date', direction: 'desc' }
  ],
  filterOptions: [
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
      { value: 'partial_paid', label: 'Partial Paid' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'cancelled', label: 'Cancelled' }
    ]},
    { key: 'storeId', label: 'Store', type: 'select', options: [] },
    { key: 'customerId', label: 'Customer', type: 'select', options: [] },
    { key: 'currencyId', label: 'Currency', type: 'select', options: [] },
    { key: 'dateFrom', label: 'Date From', type: 'date' },
    { key: 'dateTo', label: 'Date To', type: 'date' }
  ]
};

