import { StockAdjustmentStats, StockAdjustmentFilters, StockAdjustmentSortConfig, StockAdjustmentFormData, StockAdjustment as StockAdjustmentType } from '../types';

// Helper function to get current month date range
const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  
  return {
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: endOfMonth.toISOString().split('T')[0]
  };
};

// Stock Adjustment Module Configuration
export const stockAdjustmentModuleConfig = {
  title: 'Stock Adjustments Management',
  description: 'Manage stock adjustments and inventory corrections',
  icon: 'Package',
  path: '/inventory-management/stock-adjustments',
  category: 'Inventory Management',
  priority: 'high' as const,
  features: [
    'Create and manage stock adjustments',
    'Stock in and stock out operations',
    'Serial number and expiry date tracking',
    'Approval workflow',
    'Export to Excel and PDF',
    'Search and filtering',
    'Multi-store support'
  ],
  permissions: ['stock_adjustments.view', 'stock_adjustments.create', 'stock_adjustments.edit', 'stock_adjustments.delete'],
  apiEndpoints: {
    list: '/stock-adjustments',
    create: '/stock-adjustments',
    update: '/stock-adjustments/:id',
    delete: '/stock-adjustments/:id',
    view: '/stock-adjustments/:id',
    stats: '/stock-adjustments/stats/overview',
    export: '/stock-adjustments/export'
  },
  tableColumns: [
    { key: 'reference_number', label: 'Reference Number', sortable: true, width: '150px', defaultVisible: true },
    { key: 'adjustment_date', label: 'Adjustment Date', sortable: true, width: '120px', defaultVisible: true },
    { key: 'store_name', label: 'Store', sortable: true, width: '150px', defaultVisible: true },
    { key: 'adjustment_type', label: 'Type', sortable: true, width: '100px', defaultVisible: true },
    { key: 'adjustment_reason_name', label: 'Reason', sortable: true, width: '150px', defaultVisible: true },
    { key: 'total_items', label: 'Items', sortable: true, width: '80px', defaultVisible: false },
    { key: 'total_value', label: 'Total Value', sortable: true, width: '120px', defaultVisible: true },
    { key: 'currency_symbol', label: 'Currency', sortable: true, width: '100px', defaultVisible: false },
    { key: 'exchange_rate', label: 'Exchange Rate', sortable: true, width: '120px', defaultVisible: false },
    { key: 'notes', label: 'Notes', sortable: false, width: '200px', defaultVisible: false },
    { key: 'status', label: 'Status', sortable: true, width: '100px', defaultVisible: true },
    { key: 'created_by_name', label: 'Created By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'created_at', label: 'Created Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'updated_by_name', label: 'Updated By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'updated_at', label: 'Updated Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'submitted_by_name', label: 'Submitted By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'submitted_at', label: 'Submitted Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'approved_by_name', label: 'Approved By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'approved_at', label: 'Approved Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'rejection_reason', label: 'Rejection Reason', sortable: false, width: '200px', defaultVisible: false },
    { key: 'actions', label: 'Actions', sortable: false, width: '120px', defaultVisible: true }
  ],
  formFields: [
    {
      name: 'reference_number',
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
      name: 'adjustment_date',
      label: 'Adjustment Date',
      type: 'date' as const,
      required: true,
      validation: {
        required: 'Adjustment date is required'
      }
    },
    {
      name: 'store_id',
      label: 'Store',
      type: 'select' as const,
      required: true,
      validation: {
        required: 'Store is required'
      }
    },
    {
      name: 'adjustment_type',
      label: 'Adjustment Type',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'add', label: 'Stock In' },
        { value: 'deduct', label: 'Stock Out' }
      ],
      validation: {
        required: 'Adjustment type is required'
      }
    },
    {
      name: 'reason_id',
      label: 'Adjustment Reason',
      type: 'select' as const,
      required: true,
      validation: {
        required: 'Adjustment reason is required'
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
    }
  ],
  searchFields: ['reference_number', 'store_name', 'adjustment_reason_name', 'notes'],
  sortOptions: [
    { key: 'reference_number', label: 'Reference Number' },
    { key: 'adjustment_date', label: 'Adjustment Date' },
    { key: 'store_name', label: 'Store' },
    { key: 'adjustment_type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created Date' },
    { key: 'updated_at', label: 'Updated Date' },
    { key: 'submitted_at', label: 'Submitted Date' },
    { key: 'approved_at', label: 'Approved Date' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'submitted_by_name', label: 'Submitted By' },
    { key: 'approved_by_name', label: 'Approved By' }
  ],
  filters: [
    {
      key: 'status',
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      placeholder: 'All Statuses',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    },
    {
      key: 'adjustmentType',
      name: 'adjustmentType',
      label: 'Type',
      type: 'select' as const,
      placeholder: 'All Types',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'add', label: 'Stock In' },
        { value: 'deduct', label: 'Stock Out' }
      ]
    }
  ],
  exportOptions: {
    excel: true,
    pdf: true,
    csv: false
  }
};

// Default configurations
export const defaultStockAdjustmentFilters: StockAdjustmentFilters = {
  search: '',
  status: 'all',
  adjustmentType: 'all',
  storeId: '',
  ...getCurrentMonthRange()
};

export const defaultStockAdjustmentSortConfig: StockAdjustmentSortConfig = {
  field: 'created_at',
  direction: 'desc'
};

export const defaultStockAdjustmentStats: StockAdjustmentStats = {
  total: 0,
  stockIn: 0,
  stockOut: 0,
  totalValue: 0,
  lastUpdate: 'Never'
};

export const defaultStockAdjustmentFormData: StockAdjustmentFormData = {
  reference_number: '',
  adjustment_date: new Date().toISOString().split('T')[0],
  store_id: '',
  adjustment_type: 'add',
  reason_id: '',
  inventory_account_id: '',
  inventory_corresponding_account_id: '',
  document_type: '',
  document_number: '',
  notes: '',
  currency_id: '',
  items: []
};

// Validation rules
export const stockAdjustmentValidationRules = {
  reference_number: {
    required: 'Reference number is required'
  },
  adjustment_date: {
    required: 'Adjustment date is required'
  },
  store_id: {
    required: 'Store is required'
  },
  adjustment_type: {
    required: 'Adjustment type is required'
  },
  reason_id: {
    required: 'Adjustment reason is required'
  },
  currency_id: {
    required: 'Currency is required'
  },
  notes: {
    maxLength: { value: 500, message: 'Notes must not exceed 500 characters' }
  }
};

// Status configurations
export const stockAdjustmentStatusConfig = {
  draft: {
    label: 'Draft',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  submitted: {
    label: 'Submitted',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  },
  approved: {
    label: 'Approved',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  }
};

// Column visibility configuration
export const stockAdjustmentColumnVisibilityConfig = {
  reference_number: { visible: true, label: 'Reference Number' },
  adjustment_date: { visible: true, label: 'Adjustment Date' },
  store_name: { visible: true, label: 'Store' },
  adjustment_type: { visible: true, label: 'Type' },
  adjustment_reason_name: { visible: true, label: 'Reason' },
  total_items: { visible: true, label: 'Items' },
  total_value: { visible: true, label: 'Total Value' },
  status: { visible: true, label: 'Status' },
  created_by_name: { visible: true, label: 'Created By' },
  created_at: { visible: true, label: 'Created Date' },
  updated_by_name: { visible: false, label: 'Updated By' },
  updated_at: { visible: false, label: 'Updated Date' },
  submitted_by_name: { visible: false, label: 'Submitted By' },
  submitted_at: { visible: false, label: 'Submitted Date' },
  approved_by_name: { visible: false, label: 'Approved By' },
  approved_at: { visible: false, label: 'Approved Date' },
  rejection_reason: { visible: false, label: 'Rejection Reason' }
};
