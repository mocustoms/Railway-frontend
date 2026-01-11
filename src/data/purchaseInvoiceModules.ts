import { FileText } from 'lucide-react';
import { PurchaseInvoiceFilters, PurchaseInvoiceSortConfig, PurchaseInvoiceStats } from '../types';

export interface PurchaseInvoiceModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  category: 'purchases';
  tags: string[];
  color: string;
  gradient: string;
  features: string[];
  priority: 'high' | 'medium' | 'low';
  status?: 'active' | 'warning' | 'error' | 'pending';
  isRequired?: boolean;
}

export const PURCHASE_INVOICE_MODULE: PurchaseInvoiceModule = {
  id: 'purchase-invoices',
  title: 'Purchase Invoices',
  description: 'Create and manage purchase invoices for vendors',
  icon: FileText,
  path: '/purchases/purchase-invoices',
  category: 'purchases',
  tags: ['orders', 'purchases', 'vendors', 'fulfillment'],
  color: '#8b5cf6',
  gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  features: ['Invoice creation', 'Vendor management', 'Multi-currency support', 'Status tracking', 'Payment tracking', 'Export functionality'],
  priority: 'high',
  status: 'active',
  isRequired: true
};

export const defaultPurchaseInvoiceFilters: PurchaseInvoiceFilters = {
  search: '',
  status: undefined,
  storeId: undefined,
  vendorId: undefined,
  currencyId: undefined,
  dateFrom: undefined,
  dateTo: undefined
};

export const defaultPurchaseInvoiceSortConfig: PurchaseInvoiceSortConfig = {
  field: 'createdAt',
  direction: 'desc'
};

export const defaultPurchaseInvoiceStats: PurchaseInvoiceStats = {
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

export const purchaseInvoiceStatusConfig = {
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

export const purchaseInvoiceModuleConfig = {
  title: 'Purchase Invoices Management',
  description: 'Create and manage purchase invoices for vendors',
  icon: 'FileText',
  path: '/purchases/purchase-invoices',
  category: 'Purchases',
  priority: 'high' as const,
  features: [
    'Create purchase invoices',
    'Vendor selection and details',
    'Multi-step invoice creation',
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
  permissions: ['purchase_invoices.view', 'purchase_invoices.create', 'purchase_invoices.edit', 'purchase_invoices.delete'],
  apiEndpoints: {
    list: '/purchase-invoices',
    create: '/purchase-invoices',
    update: '/purchase-invoices/:id',
    delete: '/purchase-invoices/:id',
    view: '/purchase-invoices/:id',
    stats: '/purchase-invoices/stats',
    export: '/purchase-invoices/export'
  },
  tableColumns: [
    { key: 'invoiceRefNumber', label: 'Reference Number', sortable: true, width: '150px', defaultVisible: true },
    { key: 'invoiceDate', label: 'Invoice Date', sortable: true, width: '100px', defaultVisible: true },
    { key: 'dueDate', label: 'Due Date', sortable: true, width: '100px', defaultVisible: true },
    { key: 'vendorName', label: 'Vendor', sortable: true, width: '200px', defaultVisible: true },
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
      name: 'purchaseInvoiceRefNumber',
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
      name: 'purchaseInvoiceDate',
      label: 'Purchase Invoice Date',
      type: 'date' as const,
      required: true,
      validation: {
        required: 'Purchase invoice date is required'
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
      name: 'vendorId',
      label: 'Vendor',
      type: 'select' as const,
      required: true,
      validation: {
        required: 'Vendor is required'
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
      label: 'Due Date',
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
  searchFields: ['invoiceRefNumber', 'vendorName', 'storeName', 'notes'],
  sortOptions: [
    { key: 'invoiceRefNumber', label: 'Reference Number', direction: 'asc' },
    { key: 'invoiceDate', label: 'Invoice Date', direction: 'desc' },
    { key: 'dueDate', label: 'Due Date', direction: 'desc' },
    { key: 'vendorName', label: 'Vendor', direction: 'asc' },
    { key: 'storeName', label: 'Store', direction: 'asc' },
    { key: 'status', label: 'Status', direction: 'asc' },
    { key: 'totalAmount', label: 'Total Amount', direction: 'desc' },
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
    { key: 'vendorId', label: 'Vendor', type: 'select', options: [] },
    { key: 'currencyId', label: 'Currency', type: 'select', options: [] },
    { key: 'dateFrom', label: 'Date From', type: 'date' },
    { key: 'dateTo', label: 'Date To', type: 'date' }
  ]
};
