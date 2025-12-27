import { FileText } from 'lucide-react';
import { ProformaInvoiceFilters, ProformaInvoiceSortConfig, ProformaInvoiceStats } from '../types';

export interface ProformaInvoiceModule {
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

export const PROFORMA_INVOICE_MODULE: ProformaInvoiceModule = {
  id: 'proforma-invoices',
  title: 'Proforma Invoices',
  description: 'Create and manage proforma invoices for customers',
  icon: FileText,
  path: '/sales/proforma-invoices',
  category: 'sales',
  tags: ['invoices', 'proforma', 'sales', 'customers', 'quotes'],
  color: '#3b82f6',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  features: ['Invoice creation', 'Customer management', 'Multi-currency support', 'Status tracking', 'Export functionality'],
  priority: 'high',
  status: 'active',
  isRequired: true
};

export const defaultProformaInvoiceFilters: ProformaInvoiceFilters = {
  search: '',
  status: undefined,
  storeId: undefined,
  customerId: undefined,
  currencyId: undefined,
  dateFrom: undefined,
  dateTo: undefined
};

export const defaultProformaInvoiceSortConfig: ProformaInvoiceSortConfig = {
  field: 'createdAt',
  direction: 'desc'
};

export const defaultProformaInvoiceStats: ProformaInvoiceStats = {
  total: 0,
  draft: 0,
  sent: 0,
  accepted: 0,
  rejected: 0,
  expired: 0,
  totalValue: 0,
  thisMonth: 0,
  lastMonth: 0
};

export const proformaInvoiceStatusConfig = {
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
  accepted: { 
    label: 'Accepted', 
    color: '#10b981', 
    bgColor: '#f0fdf4', 
    textColor: 'text-green-800',
    icon: 'fas fa-check-circle'
  },
  rejected: { 
    label: 'Rejected', 
    color: '#ef4444', 
    bgColor: '#fef2f2', 
    textColor: 'text-red-800',
    icon: 'fas fa-times-circle'
  },
  expired: { 
    label: 'Expired', 
    color: '#f59e0b', 
    bgColor: '#fffbeb', 
    textColor: 'text-yellow-800',
    icon: 'fas fa-clock'
  }
};

export const proformaInvoiceModuleConfig = {
  title: 'Proforma Invoices Management',
  description: 'Create and manage proforma invoices for customers',
  icon: 'FileText',
  path: '/sales/proforma-invoices',
  category: 'Sales',
  priority: 'high' as const,
  features: [
    'Create proforma invoices',
    'Customer selection and details',
    'Multi-step invoice creation',
    'Product line items management',
    'Tax and discount calculations',
    'Multi-currency support',
    'Status workflow (Draft → Sent → Accepted/Rejected)',
    'Export to Excel and PDF',
    'Search and filtering',
    'Store-based operations'
  ],
  permissions: ['proforma_invoices.view', 'proforma_invoices.create', 'proforma_invoices.edit', 'proforma_invoices.delete'],
  apiEndpoints: {
    list: '/proforma-invoices',
    create: '/proforma-invoices',
    update: '/proforma-invoices/:id',
    delete: '/proforma-invoices/:id',
    view: '/proforma-invoices/:id',
    stats: '/proforma-invoices/stats/overview',
    export: '/proforma-invoices/export'
  },
  tableColumns: [
    { key: 'proformaRefNumber', label: 'Reference Number', sortable: true, width: '150px', defaultVisible: true },
    { key: 'proformaDate', label: 'Date', sortable: true, width: '100px', defaultVisible: true },
    { key: 'customerName', label: 'Customer', sortable: true, width: '200px', defaultVisible: true },
    { key: 'storeName', label: 'Store', sortable: true, width: '150px', defaultVisible: true },
    { key: 'status', label: 'Status', sortable: true, width: '100px', defaultVisible: true },
    { key: 'totalAmount', label: 'Total Amount', sortable: true, width: '120px', defaultVisible: true },
    { key: 'currencyName', label: 'Currency', sortable: true, width: '100px', defaultVisible: false },
    { key: 'validUntil', label: 'Valid Until', sortable: true, width: '100px', defaultVisible: false },
    { key: 'createdByName', label: 'Created By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'createdAt', label: 'Created Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'updatedByName', label: 'Updated By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'updatedAt', label: 'Updated Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'actions', label: 'Actions', sortable: false, width: '120px', defaultVisible: true }
  ],
  formFields: [
    {
      name: 'proformaRefNumber',
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
      name: 'proformaDate',
      label: 'Proforma Date',
      type: 'date' as const,
      required: true,
      validation: {
        required: 'Proforma date is required'
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
      name: 'validUntil',
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
  searchFields: ['proformaRefNumber', 'customerName', 'storeName', 'notes'],
  sortOptions: [
    { key: 'proformaRefNumber', label: 'Reference Number', direction: 'asc' },
    { key: 'proformaDate', label: 'Date', direction: 'desc' },
    { key: 'customerName', label: 'Customer', direction: 'asc' },
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
      { value: 'accepted', label: 'Accepted' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'expired', label: 'Expired' }
    ]},
    { key: 'storeId', label: 'Store', type: 'select', options: [] },
    { key: 'customerId', label: 'Customer', type: 'select', options: [] },
    { key: 'currencyId', label: 'Currency', type: 'select', options: [] },
    { key: 'dateFrom', label: 'Date From', type: 'date' },
    { key: 'dateTo', label: 'Date To', type: 'date' }
  ]
};
