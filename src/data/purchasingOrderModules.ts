import { ShoppingBag } from 'lucide-react';
import { PurchasingOrderFilters, PurchasingOrderSortConfig, PurchasingOrderStats } from '../types';

export interface PurchasingOrderModule {
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

export const PURCHASING_ORDER_MODULE: PurchasingOrderModule = {
  id: 'purchasing-orders',
  title: 'Purchasing Orders',
  description: 'Create and manage purchase orders from vendors',
  icon: ShoppingBag,
  path: '/purchases/purchasing-order',
  category: 'purchases',
  tags: ['orders', 'purchases', 'vendors', 'fulfillment'],
  color: '#8b5cf6',
  gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  features: ['Order creation', 'Vendor management', 'Multi-currency support', 'Status tracking', 'Receipt tracking', 'Export functionality'],
  priority: 'high',
  status: 'active',
  isRequired: true
};

export const defaultPurchasingOrderFilters: PurchasingOrderFilters = {
  search: '',
  status: undefined,
  storeId: undefined,
  vendorId: undefined,
  currencyId: undefined,
  dateFrom: undefined,
  dateTo: undefined
};

export const defaultPurchasingOrderSortConfig: PurchasingOrderSortConfig = {
  field: 'createdAt',
  direction: 'desc'
};

export const defaultPurchasingOrderStats: PurchasingOrderStats = {
  total: 0,
  draft: 0,
  sent: 0,
  accepted: 0,
  rejected: 0,
  expired: 0,
  received: 0,
  totalValue: 0,
  thisMonth: 0,
  lastMonth: 0
};

export const purchasingOrderStatusConfig = {
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
  received: { 
    label: 'Received', 
    color: '#8b5cf6', 
    bgColor: '#faf5ff', 
    textColor: 'text-purple-800',
    icon: 'fas fa-check-double'
  }
};

export const purchasingOrderModuleConfig = {
  title: 'Purchasing Orders Management',
  description: 'Create and manage purchase orders from vendors',
  icon: 'ShoppingBag',
  path: '/purchases/purchasing-order',
  category: 'Purchases',
  priority: 'high' as const,
  features: [
    'Create purchasing orders',
    'Vendor selection and details',
    'Multi-step order creation',
    'Product line items management',
    'Tax and discount calculations',
    'Multi-currency support',
    'Status workflow (Draft → Sent → Accepted → Received/Rejected)',
    'Expected delivery date and shipping address tracking',
    'Export to Excel and PDF',
    'Search and filtering',
    'Store-based operations'
  ],
  permissions: ['purchasing_orders.view', 'purchasing_orders.create', 'purchasing_orders.edit', 'purchasing_orders.delete'],
  apiEndpoints: {
    list: '/purchasing-orders',
    create: '/purchasing-orders',
    update: '/purchasing-orders/:id',
    delete: '/purchasing-orders/:id',
    view: '/purchasing-orders/:id',
    stats: '/purchasing-orders/stats/overview',
    export: '/purchasing-orders/export'
  },
  tableColumns: [
    { key: 'purchasingOrderRefNumber', label: 'Reference Number', sortable: true, width: '150px', defaultVisible: true },
    { key: 'purchasingOrderDate', label: 'Date', sortable: true, width: '100px', defaultVisible: true },
    { key: 'vendorName', label: 'Vendor', sortable: true, width: '200px', defaultVisible: true },
    { key: 'storeName', label: 'Store', sortable: true, width: '150px', defaultVisible: true },
    { key: 'status', label: 'Status', sortable: true, width: '100px', defaultVisible: true },
    { key: 'totalAmount', label: 'Total Amount', sortable: true, width: '120px', defaultVisible: true },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'currencyName', label: 'Currency', sortable: true, width: '100px', defaultVisible: false },
    { key: 'validUntil', label: 'Valid Until', sortable: true, width: '100px', defaultVisible: false },
    { key: 'createdByName', label: 'Created By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'createdAt', label: 'Created Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'receivedByName', label: 'Received By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'receivedAt', label: 'Received Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'actions', label: 'Actions', sortable: false, width: '120px', defaultVisible: true }
  ],
  formFields: [
    {
      name: 'purchasingOrderRefNumber',
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
      name: 'purchasingOrderDate',
      label: 'Purchasing Order Date',
      type: 'date' as const,
      required: true,
      validation: {
        required: 'Purchasing order date is required'
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
      name: 'validUntil',
      label: 'Valid Until',
      type: 'date' as const,
      required: false,
      validation: {}
    },
    {
      name: 'expectedDeliveryDate',
      label: 'Expected Delivery Date',
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
  searchFields: ['purchasingOrderRefNumber', 'vendorName', 'storeName', 'notes', 'shippingAddress'],
  sortOptions: [
    { key: 'purchasingOrderRefNumber', label: 'Reference Number', direction: 'asc' },
    { key: 'purchasingOrderDate', label: 'Date', direction: 'desc' },
    { key: 'vendorName', label: 'Vendor', direction: 'asc' },
    { key: 'storeName', label: 'Store', direction: 'asc' },
    { key: 'status', label: 'Status', direction: 'asc' },
    { key: 'totalAmount', label: 'Total Amount', direction: 'desc' },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery Date', direction: 'desc' },
    { key: 'receivedAt', label: 'Received Date', direction: 'desc' },
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
      { value: 'received', label: 'Received' }
    ]},
    { key: 'storeId', label: 'Store', type: 'select', options: [] },
    { key: 'vendorId', label: 'Vendor', type: 'select', options: [] },
    { key: 'currencyId', label: 'Currency', type: 'select', options: [] },
    { key: 'dateFrom', label: 'Date From', type: 'date' },
    { key: 'dateTo', label: 'Date To', type: 'date' }
  ]
};
