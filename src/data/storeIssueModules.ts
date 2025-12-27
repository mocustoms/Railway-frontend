import { StoreRequestFilters, StoreRequestSortConfig } from '../types';

// Store Issue Module Configuration
export const storeIssueModuleConfig = {
  title: 'Store Issues Management',
  description: 'Issue stock to stores or departments with tracking and documentation',
  icon: 'Package',
  path: '/inventory-management/store-issues',
  category: 'Inventory Management',
  priority: 'high' as const,
  features: [
    'Create and manage store issues',
    'Issue stock to departments',
    'Approval workflow',
    'Quantity tracking (Requested, Approved, Issued, Received, Fulfilled)',
    'Export to Excel and PDF',
    'Search and filtering',
    'Multi-store support',
    'Currency and exchange rate support'
  ],
  permissions: ['store_issues.view', 'store_issues.create', 'store_issues.edit', 'store_issues.delete', 'store_issues.approve'],
  apiEndpoints: {
    list: '/store-requests',
    create: '/store-requests',
    update: '/store-requests/:id',
    delete: '/store-requests/:id',
    view: '/store-requests/:id',
    stats: '/store-requests/stats/summary',
    export: '/store-requests/export',
    submit: '/store-requests/:id/submit',
    approve: '/store-requests/:id/approve',
    reject: '/store-requests/:id/reject',
    fulfill: '/store-requests/:id/fulfill',
    cancel: '/store-requests/:id/cancel'
  },
  tableColumns: [
    { key: 'reference_number', label: 'Reference Number', sortable: true, width: '150px', defaultVisible: true },
    { key: 'request_date', label: 'Issue Date', sortable: true, width: '120px', defaultVisible: true },
    { key: 'requesting_store_name', label: 'Issued To', sortable: true, width: '150px', defaultVisible: true },
    { key: 'issuing_store_name', label: 'Issued From', sortable: true, width: '150px', defaultVisible: true },
    { key: 'priority', label: 'Priority', sortable: true, width: '100px', defaultVisible: true },
    { key: 'request_type', label: 'Type', sortable: true, width: '100px', defaultVisible: false },
    { key: 'total_items', label: 'Items', sortable: true, width: '80px', defaultVisible: false },
    { key: 'total_value', label: 'Total Value', sortable: true, width: '120px', defaultVisible: true },
    { key: 'currency', label: 'Currency', sortable: true, width: '100px', defaultVisible: true },
    { key: 'exchange_rate', label: 'Exchange Rate', sortable: true, width: '120px', defaultVisible: false },
    { key: 'notes', label: 'Notes', sortable: false, width: '200px', defaultVisible: false },
    { key: 'status', label: 'Status', sortable: true, width: '100px', defaultVisible: true },
    { key: 'expected_delivery_date', label: 'Expected Delivery', sortable: true, width: '130px', defaultVisible: false },
    { key: 'created_by_name', label: 'Created By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'created_at', label: 'Created Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'updated_by_name', label: 'Updated By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'updated_at', label: 'Updated Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'submitted_by_name', label: 'Submitted By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'submitted_at', label: 'Submitted Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'approved_by_name', label: 'Approved By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'approved_at', label: 'Approved Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'rejected_by_name', label: 'Rejected By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'rejected_at', label: 'Rejected Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'fulfilled_by_name', label: 'Fulfilled By', sortable: true, width: '120px', defaultVisible: false },
    { key: 'fulfilled_at', label: 'Fulfilled Date', sortable: true, width: '120px', defaultVisible: false },
    { key: 'actions', label: 'Actions', sortable: false, width: '120px', defaultVisible: true }
  ],
  formFields: [
    {
      key: 'reference_number',
      label: 'Reference Number',
      type: 'text',
      required: false,
      placeholder: 'Auto-generated if left empty',
      disabled: true,
      gridCols: 6
    },
    {
      key: 'request_date',
      label: 'Issue Date',
      type: 'date',
      required: true,
      gridCols: 6
    },
    {
      key: 'requesting_store_id',
      label: 'Issue To Store',
      type: 'select',
      required: true,
      options: 'stores',
      gridCols: 6
    },
    {
      key: 'issuing_store_id',
      label: 'Issue From Store',
      type: 'select',
      required: true,
      options: 'stores',
      gridCols: 6
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ],
      gridCols: 6
    },
    {
      key: 'expected_delivery_date',
      label: 'Expected Delivery Date',
      type: 'date',
      required: false,
      gridCols: 6
    },
    {
      key: 'currency_id',
      label: 'Currency',
      type: 'select',
      required: true,
      options: 'currencies',
      gridCols: 6
    },
    {
      key: 'exchange_rate',
      label: 'Exchange Rate',
      type: 'number',
      required: false,
      step: 0.0001,
      gridCols: 6
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Additional notes or comments...',
      gridCols: 12
    }
  ],
  statusConfig: {
    draft: { label: 'Draft', color: 'gray', icon: 'FileText' },
    submitted: { label: 'Submitted', color: 'blue', icon: 'Send' },
    approved: { label: 'Approved', color: 'green', icon: 'CheckCircle' },
    rejected: { label: 'Rejected', color: 'red', icon: 'XCircle' },
    fulfilled: { label: 'Fulfilled', color: 'purple', icon: 'Package' },
    partial_issued: { label: 'Partial Issued', color: 'orange', icon: 'PackageCheck' },
    cancelled: { label: 'Cancelled', color: 'orange', icon: 'X' }
  },
  priorityConfig: {
    low: { label: 'Low', color: 'gray', icon: 'ArrowDown' },
    medium: { label: 'Medium', color: 'blue', icon: 'Minus' },
    high: { label: 'High', color: 'orange', icon: 'ArrowUp' },
    urgent: { label: 'Urgent', color: 'red', icon: 'AlertTriangle' }
  },
  workflow: {
    states: ['draft', 'submitted', 'approved', 'rejected', 'fulfilled', 'partial_issued', 'cancelled'],
    transitions: {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'rejected', 'cancelled'],
      approved: ['fulfilled', 'partial_issued', 'cancelled'],
      rejected: ['submitted', 'cancelled'],
      fulfilled: [],
      partial_issued: ['fulfilled', 'cancelled'],
      cancelled: []
    },
    permissions: {
      draft: ['edit', 'delete', 'submit'],
      submitted: ['approve', 'reject', 'cancel'],
      approved: ['fulfill', 'cancel'],
      rejected: ['resubmit', 'cancel'],
      fulfilled: [],
      partial_issued: ['fulfill', 'cancel'],
      cancelled: []
    }
  },
  exportOptions: {
    formats: ['excel', 'pdf'],
    includeItems: true,
    includeTransactions: true,
    dateRange: true,
    statusFilter: true,
    storeFilter: true
  },
  bulkOperations: [
    { key: 'approve', label: 'Approve Selected', icon: 'CheckCircle', color: 'green' },
    { key: 'reject', label: 'Reject Selected', icon: 'XCircle', color: 'red' },
    { key: 'fulfill', label: 'Fulfill Selected', icon: 'Package', color: 'purple' },
    { key: 'cancel', label: 'Cancel Selected', icon: 'X', color: 'orange' }
  ]
};

// Store Issue Status Configuration
export const storeIssueStatusConfig = {
  draft: {
    label: 'Draft',
    color: 'gray',
    icon: 'FileText',
    description: 'Issue is being prepared and can be edited'
  },
  submitted: {
    label: 'Submitted',
    color: 'blue',
    icon: 'Send',
    description: 'Issue has been submitted for approval'
  },
  approved: {
    label: 'Approved',
    color: 'green',
    icon: 'CheckCircle',
    description: 'Issue has been approved and ready for fulfillment'
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    icon: 'XCircle',
    description: 'Issue has been rejected and needs revision'
  },
  fulfilled: {
    label: 'Fulfilled',
    color: 'purple',
    icon: 'Package',
    description: 'Issue has been completely fulfilled'
  },
  partial_issued: {
    label: 'Partial Issued',
    color: 'orange',
    icon: 'PackageCheck',
    description: 'Issue has been partially fulfilled and can be continued'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'orange',
    icon: 'X',
    description: 'Issue has been cancelled'
  }
};

// Store Issue Priority Configuration
export const storeIssuePriorityConfig = {
  low: {
    label: 'Low',
    color: 'gray',
    icon: 'ArrowDown',
    description: 'Low priority issue'
  },
  medium: {
    label: 'Medium',
    color: 'blue',
    icon: 'Minus',
    description: 'Medium priority issue'
  },
  high: {
    label: 'High',
    color: 'orange',
    icon: 'ArrowUp',
    description: 'High priority issue'
  },
  urgent: {
    label: 'Urgent',
    color: 'red',
    icon: 'AlertTriangle',
    description: 'Urgent priority issue'
  }
};

// Default filters
export const defaultStoreIssueFilters: StoreRequestFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  requesting_store_id: '',
  issuing_store_id: '',
  date_from: '',
  date_to: ''
};

// Default sort configuration
export const defaultStoreIssueSortConfig: StoreRequestSortConfig = {
  field: 'createdAt',
  direction: 'desc'
};

// Pagination options
export const paginationOptions = [
  { value: 10, label: '10 items' },
  { value: 25, label: '25 items' },
  { value: 50, label: '50 items' },
  { value: 100, label: '100 items' }
];

// Export options
export const exportOptions = {
  excel: {
    label: 'Export to Excel',
    icon: 'FileSpreadsheet',
    description: 'Download data in Excel format'
  },
  pdf: {
    label: 'Export to PDF',
    icon: 'FileText',
    description: 'Download data in PDF format'
  }
};
