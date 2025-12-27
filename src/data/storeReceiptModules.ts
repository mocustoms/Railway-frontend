import { ModuleConfig } from '../types';

export const storeReceiptModuleConfig: ModuleConfig = {
  name: 'Store Receipts',
  description: 'Manage store receipts for receiving stock from other stores',
  icon: 'Package',
  path: '/inventory/store-receipts',
  permissions: {
    create: 'store_receipts:create',
    read: 'store_receipts:read',
    update: 'store_receipts:update',
    delete: 'store_receipts:delete',
    approve: 'store_receipts:approve',
    export: 'store_receipts:export'
  },
  tableColumns: [
    {
      key: 'reference_number',
      label: 'Reference',
      sortable: true,
      defaultVisible: true,
      width: 'w-32'
    },
    {
      key: 'request_date',
      label: 'Receipt Date',
      sortable: true,
      defaultVisible: true,
      width: 'w-32'
    },
    {
      key: 'requesting_store_name',
      label: 'Receive To Store',
      sortable: true,
      defaultVisible: true,
      width: 'w-40'
    },
    {
      key: 'issuing_store_name',
      label: 'Receive From Store',
      sortable: true,
      defaultVisible: true,
      width: 'w-40'
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      defaultVisible: true,
      width: 'w-24'
    },
    {
      key: 'request_type',
      label: 'Type',
      sortable: true,
      defaultVisible: true,
      width: 'w-24'
    },
    {
      key: 'total_items',
      label: 'Total Items',
      sortable: true,
      defaultVisible: true,
      width: 'w-28'
    },
    {
      key: 'total_value',
      label: 'Total Value',
      sortable: true,
      defaultVisible: true,
      width: 'w-32'
    },
    {
      key: 'currency',
      label: 'Currency',
      sortable: true,
      defaultVisible: false,
      width: 'w-24'
    },
    {
      key: 'exchange_rate',
      label: 'Exchange Rate',
      sortable: true,
      defaultVisible: false,
      width: 'w-28'
    },
    {
      key: 'notes',
      label: 'Notes',
      sortable: false,
      defaultVisible: false,
      width: 'w-48'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      defaultVisible: true,
      width: 'w-28'
    },
    {
      key: 'expected_delivery_date',
      label: 'Expected Delivery',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'created_by_name',
      label: 'Created By',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'updated_by_name',
      label: 'Updated By',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'submitted_by_name',
      label: 'Submitted By',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'submitted_at',
      label: 'Submitted At',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'approved_by_name',
      label: 'Approved By',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'approved_at',
      label: 'Approved At',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'rejected_by_name',
      label: 'Rejected By',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'rejected_at',
      label: 'Rejected At',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'fulfilled_by_name',
      label: 'Fulfilled By',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'fulfilled_at',
      label: 'Fulfilled At',
      sortable: true,
      defaultVisible: false,
      width: 'w-32'
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      defaultVisible: true,
      width: 'w-32'
    }
  ],
  filters: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'fulfilled', label: 'Fulfilled' },
        { value: 'partial_received', label: 'Partial Received' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      defaultValue: 'all'
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'all', label: 'All Priority' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ],
      defaultValue: 'all'
    },
    {
      key: 'requesting_store_id',
      label: 'Receive To Store',
      type: 'select',
      options: [], // Will be populated dynamically
      defaultValue: 'all'
    },
    {
      key: 'requested_from_store_id',
      label: 'Receive From Store',
      type: 'select',
      options: [], // Will be populated dynamically
      defaultValue: 'all'
    },
    {
      key: 'date_from',
      label: 'Date From',
      type: 'date',
      defaultValue: ''
    },
    {
      key: 'date_to',
      label: 'Date To',
      type: 'date',
      defaultValue: ''
    }
  ],
  statusOptions: [
    { value: 'draft', label: 'Draft', color: 'gray' },
    { value: 'submitted', label: 'Submitted', color: 'blue' },
    { value: 'approved', label: 'Approved', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'fulfilled', label: 'Fulfilled', color: 'green' },
    { value: 'partial_received', label: 'Partial Received', color: 'yellow' },
    { value: 'cancelled', label: 'Cancelled', color: 'orange' }
  ],
  priorityOptions: [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ],
  formFields: [
    {
      key: 'reference_number',
      label: 'Reference Number',
      type: 'text',
      required: false,
      disabled: true,
      placeholder: 'Auto-generated',
      width: 'w-full'
    },
    {
      key: 'request_date',
      label: 'Receipt Date',
      type: 'date',
      required: true,
      width: 'w-full'
    },
    {
      key: 'requesting_store_id',
      label: 'Receive To Store',
      type: 'select',
      required: true,
      width: 'w-full',
      options: [] // Will be populated dynamically
    },
    {
      key: 'requested_from_store_id',
      label: 'Receive From Store',
      type: 'select',
      required: true,
      width: 'w-full',
      options: [] // Will be populated dynamically
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      required: true,
      width: 'w-full',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]
    },
    {
      key: 'expected_delivery_date',
      label: 'Expected Delivery Date',
      type: 'date',
      required: false,
      width: 'w-full'
    },
    {
      key: 'currency_id',
      label: 'Currency',
      type: 'select',
      required: true,
      width: 'w-full',
      options: [] // Will be populated dynamically
    },
    {
      key: 'exchange_rate',
      label: 'Exchange Rate',
      type: 'number',
      required: false,
      width: 'w-full',
      step: '0.0001',
      min: '0.0001'
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      width: 'w-full',
      rows: 3,
      maxLength: 500
    }
  ],
  itemFormFields: [
    {
      key: 'product_id',
      label: 'Product',
      type: 'select',
      required: true,
      width: 'w-full',
      options: [] // Will be populated dynamically
    },
    {
      key: 'requested_quantity',
      label: 'Requested Quantity',
      type: 'number',
      required: true,
      width: 'w-32',
      step: '0.001',
      min: '0.001'
    },
    {
      key: 'unit_cost',
      label: 'Unit Cost',
      type: 'number',
      required: false,
      width: 'w-32',
      step: '0.01',
      min: '0'
    },
    {
      key: 'currency_id',
      label: 'Currency',
      type: 'select',
      required: false,
      width: 'w-32',
      options: [] // Will be populated dynamically
    },
    {
      key: 'exchange_rate',
      label: 'Exchange Rate',
      type: 'number',
      required: false,
      width: 'w-32',
      step: '0.0001',
      min: '0.0001'
    },
    {
      key: 'equivalent_amount',
      label: 'Equivalent Amount',
      type: 'number',
      required: false,
      width: 'w-32',
      step: '0.01',
      min: '0',
      disabled: true
    },
    {
      key: 'notes',
      label: 'Item Notes',
      type: 'text',
      required: false,
      width: 'w-full',
      maxLength: 200
    }
  ],
  workflow: {
    states: [
      {
        key: 'draft',
        label: 'Draft',
        color: 'gray',
        actions: ['edit', 'delete', 'submit'],
        nextStates: ['submitted']
      },
      {
        key: 'submitted',
        label: 'Submitted',
        color: 'blue',
        actions: ['approve', 'reject', 'cancel'],
        nextStates: ['approved', 'rejected', 'cancelled']
      },
      {
        key: 'approved',
        label: 'Approved',
        color: 'green',
        actions: ['fulfill', 'cancel'],
        nextStates: ['fulfilled', 'cancelled']
      },
      {
        key: 'rejected',
        label: 'Rejected',
        color: 'red',
        actions: ['resubmit'],
        nextStates: ['submitted']
      },
      {
        key: 'fulfilled',
        label: 'Fulfilled',
        color: 'green',
        actions: [],
        nextStates: []
      },
      {
        key: 'partial_received',
        label: 'Partial Received',
        color: 'yellow',
        actions: ['fulfill', 'cancel'],
        nextStates: ['fulfilled', 'cancelled']
      },
      {
        key: 'cancelled',
        label: 'Cancelled',
        color: 'orange',
        actions: [],
        nextStates: []
      }
    ],
    transitions: [
      {
        from: 'draft',
        to: 'submitted',
        action: 'submit',
        label: 'Submit for Approval',
        icon: 'Truck'
      },
      {
        from: 'submitted',
        to: 'approved',
        action: 'approve',
        label: 'Approve',
        icon: 'CheckCircle'
      },
      {
        from: 'submitted',
        to: 'rejected',
        action: 'reject',
        label: 'Reject',
        icon: 'XCircle'
      },
      {
        from: 'approved',
        to: 'fulfilled',
        action: 'fulfill',
        label: 'Fulfill',
        icon: 'Package'
      },
      {
        from: 'approved',
        to: 'partial_received',
        action: 'partial_fulfill',
        label: 'Partial Fulfill',
        icon: 'Package'
      },
      {
        from: 'submitted',
        to: 'cancelled',
        action: 'cancel',
        label: 'Cancel',
        icon: 'X'
      },
      {
        from: 'approved',
        to: 'cancelled',
        action: 'cancel',
        label: 'Cancel',
        icon: 'X'
      },
      {
        from: 'rejected',
        to: 'submitted',
        action: 'resubmit',
        label: 'Resubmit',
        icon: 'Truck'
      }
    ]
  },
  exportOptions: {
    excel: {
      enabled: true,
      filename: 'store-receipts',
      sheets: ['receipts', 'items', 'summary']
    },
    pdf: {
      enabled: true,
      filename: 'store-receipts',
      orientation: 'landscape',
      format: 'A4'
    }
  },
  validation: {
    rules: {
      reference_number: {
        required: false,
        pattern: /^[A-Z0-9-]+$/,
        message: 'Reference number must contain only uppercase letters, numbers, and hyphens'
      },
      request_date: {
        required: true,
        message: 'Receipt date is required'
      },
      requesting_store_id: {
        required: true,
        message: 'Receive to store is required'
      },
      requested_from_store_id: {
        required: true,
        message: 'Receive from store is required'
      },
      priority: {
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        message: 'Priority must be one of: low, medium, high, urgent'
      },
      currency_id: {
        required: true,
        message: 'Currency is required'
      },
      exchange_rate: {
        required: false,
        min: 0.0001,
        message: 'Exchange rate must be greater than 0'
      },
      notes: {
        required: false,
        maxLength: 500,
        message: 'Notes must not exceed 500 characters'
      }
    },
    itemRules: {
      product_id: {
        required: true,
        message: 'Product is required'
      },
      requested_quantity: {
        required: true,
        min: 0.001,
        message: 'Requested quantity must be greater than 0'
      },
      unit_cost: {
        required: false,
        min: 0,
        message: 'Unit cost must be non-negative'
      },
      notes: {
        required: false,
        maxLength: 200,
        message: 'Item notes must not exceed 200 characters'
      }
    }
  },
  notifications: {
    onCreate: {
      enabled: true,
      message: 'Store receipt created successfully',
      type: 'success'
    },
    onUpdate: {
      enabled: true,
      message: 'Store receipt updated successfully',
      type: 'success'
    },
    onDelete: {
      enabled: true,
      message: 'Store receipt deleted successfully',
      type: 'success'
    },
    onSubmit: {
      enabled: true,
      message: 'Store receipt submitted for approval',
      type: 'info'
    },
    onApprove: {
      enabled: true,
      message: 'Store receipt approved successfully',
      type: 'success'
    },
    onReject: {
      enabled: true,
      message: 'Store receipt rejected',
      type: 'warning'
    },
    onFulfill: {
      enabled: true,
      message: 'Store receipt fulfilled successfully',
      type: 'success'
    },
    onCancel: {
      enabled: true,
      message: 'Store receipt cancelled',
      type: 'warning'
    }
  },
  analytics: {
    enabled: true,
    metrics: [
      {
        key: 'total_receipts',
        label: 'Total Receipts',
        type: 'count',
        color: 'blue'
      },
      {
        key: 'approved_receipts',
        label: 'Approved Receipts',
        type: 'count',
        color: 'green'
      },
      {
        key: 'fulfilled_receipts',
        label: 'Fulfilled Receipts',
        type: 'count',
        color: 'purple'
      },
      {
        key: 'partial_received_receipts',
        label: 'Partial Received',
        type: 'count',
        color: 'orange'
      },
      {
        key: 'total_value',
        label: 'Total Value',
        type: 'currency',
        color: 'green'
      },
      {
        key: 'average_fulfillment_time',
        label: 'Avg. Fulfillment Time',
        type: 'duration',
        color: 'blue'
      }
    ],
    charts: [
      {
        key: 'receipts_by_status',
        label: 'Receipts by Status',
        type: 'pie',
        dataKey: 'status'
      },
      {
        key: 'receipts_by_priority',
        label: 'Receipts by Priority',
        type: 'bar',
        dataKey: 'priority'
      },
      {
        key: 'receipts_trend',
        label: 'Receipts Trend',
        type: 'line',
        dataKey: 'date'
      },
      {
        key: 'value_by_store',
        label: 'Value by Store',
        type: 'bar',
        dataKey: 'store'
      }
    ]
  }
};

export default storeReceiptModuleConfig;
