import { ShoppingCart } from 'lucide-react';
import { SalesOrderFilters, SalesOrderSortConfig, SalesOrderStats } from '../types';

export interface SalesOrderModule {
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

export const SALES_ORDER_MODULE: SalesOrderModule = {
  id: 'sales-orders',
  title: 'Sales Orders',
  description: 'Create and manage sales orders for customers',
  icon: ShoppingCart,
  path: '/sales/sales-orders',
  category: 'sales',
  tags: ['orders', 'sales', 'customers', 'fulfillment'],
  color: '#10b981',
  gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  features: ['Order creation', 'Customer management', 'Multi-currency support', 'Status tracking', 'Fulfillment tracking', 'Export functionality'],
  priority: 'high',
  status: 'active',
  isRequired: true
};

export const defaultSalesOrderFilters: SalesOrderFilters = {
  search: '',
  status: undefined,
  storeId: undefined,
  customerId: undefined,
  currencyId: undefined,
  dateFrom: undefined,
  dateTo: undefined
};

export const defaultSalesOrderSortConfig: SalesOrderSortConfig = {
  field: 'createdAt',
  direction: 'desc'
};

export const defaultSalesOrderStats: SalesOrderStats = {
  total: 0,
  draft: 0,
  sent: 0,
  accepted: 0,
  rejected: 0,
  expired: 0,
  delivered: 0,
  totalValue: 0,
  thisMonth: 0,
  lastMonth: 0
};

export const salesOrderStatusConfig = {
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
  },
  delivered: { 
    label: 'Delivered', 
    color: '#8b5cf6', 
    bgColor: '#faf5ff', 
    textColor: 'text-purple-800',
    icon: 'fas fa-check-double'
  }
};

export const salesOrderModuleConfig = {
  title: 'Sales Orders Management',
  description: 'Create and manage sales orders for customers',
  icon: 'ShoppingCart',
  path: '/sales/sales-orders',
  category: 'Sales',
  priority: 'high' as const,
  features: [
    'Create sales orders',
    'Customer selection and details',
    'Multi-step order creation',
    'Product line items management',
    'Tax and discount calculations',
    'Multi-currency support',
    'Status workflow (Draft → Sent → Accepted → Delivered/Rejected)',
    'Delivery date and shipping address tracking',
    'Export to Excel and PDF',
    'Search and filtering',
    'Store-based operations'
  ],
  permissions: ['sales_orders.view', 'sales_orders.create', 'sales_orders.edit', 'sales_orders.delete'],
  apiEndpoints: {
    list: '/sales-orders',
    create: '/sales-orders',
    update: '/sales-orders/:id',
    delete: '/sales-orders/:id',
    view: '/sales-orders/:id',
    stats: '/sales-orders/stats/overview',
    export: '/sales-orders/export'
  },
  tableColumns: [
    { key: 'salesOrderRefNumber', label: 'Reference Number', sortable: true, width: '150px', defaultVisible: true },
    { key: 'salesOrderDate', label: 'Date', sortable: true, width: '100px', defaultVisible: true },
    { key: 'customerName', label: 'Customer', sortable: true, width: '200px', defaultVisible: true },
    { key: 'storeName', label: 'Store', sortable: true, width: '150px', defaultVisible: true },
    { key: 'status', label: 'Status', sortable: true, width: '100px', defaultVisible: true },
    { key: 'totalAmount', label: 'Total Amount', sortable: true, width: '120px', defaultVisible: true },
    { key: 'deliveryDate', label: 'Delivery Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'currencyName', label: 'Currency', sortable: true, width: '100px', defaultVisible: false },
    { key: 'validUntil', label: 'Valid Until', sortable: true, width: '100px', defaultVisible: false },
    { key: 'createdByName', label: 'Created By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'createdAt', label: 'Created Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'fulfilledByName', label: 'Fulfilled By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'fulfilledAt', label: 'Fulfilled Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'actions', label: 'Actions', sortable: false, width: '120px', defaultVisible: true }
  ],
  formFields: [
    {
      name: 'salesOrderRefNumber',
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
      name: 'salesOrderDate',
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
      name: 'validUntil',
      label: 'Valid Until',
      type: 'date' as const,
      required: false,
      validation: {}
    },
    {
      name: 'deliveryDate',
      label: 'Delivery Date',
      type: 'date' as const,
      required: false,
      validation: {}
    },
    {
      name: 'shippingAddress',
      label: 'Shipping Address',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Enter shipping address (optional)',
      validation: {
        maxLength: { value: 500, message: 'Shipping address must not exceed 500 characters' }
      }
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
  searchFields: ['salesOrderRefNumber', 'customerName', 'storeName', 'notes', 'shippingAddress'],
  sortOptions: [
    { key: 'salesOrderRefNumber', label: 'Reference Number', direction: 'asc' },
    { key: 'salesOrderDate', label: 'Date', direction: 'desc' },
    { key: 'customerName', label: 'Customer', direction: 'asc' },
    { key: 'storeName', label: 'Store', direction: 'asc' },
    { key: 'status', label: 'Status', direction: 'asc' },
    { key: 'totalAmount', label: 'Total Amount', direction: 'desc' },
    { key: 'deliveryDate', label: 'Delivery Date', direction: 'desc' },
    { key: 'fulfilledAt', label: 'Fulfilled Date', direction: 'desc' },
    { key: 'createdAt', label: 'Created Date', direction: 'desc' },
    { key: 'updatedAt', label: 'Updated Date', direction: 'desc' }
  ],
  filterOptions: [
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'accepted', label: 'Accepted' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'expired', label: 'Expired' },
      { value: 'delivered', label: 'Delivered' }
    ]},
    { key: 'storeId', label: 'Store', type: 'select', options: [] },
    { key: 'customerId', label: 'Customer', type: 'select', options: [] },
    { key: 'currencyId', label: 'Currency', type: 'select', options: [] },
    { key: 'dateFrom', label: 'Date From', type: 'date' },
    { key: 'dateTo', label: 'Date To', type: 'date' }
  ]
};

