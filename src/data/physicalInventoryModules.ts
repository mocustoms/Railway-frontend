import { Clock, CheckCircle, XCircle, AlertCircle, ClipboardList, RotateCcw } from 'lucide-react';
import { PhysicalInventoryFilters } from '../types';

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

export const physicalInventoryStatusConfig = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: Clock
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-800',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: AlertCircle
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: CheckCircle
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: XCircle
  },
  returned_for_correction: {
    label: 'Returned for Correction',
    color: 'bg-orange-100 text-orange-800',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: RotateCcw
  }
};

export const physicalInventoryModuleConfig = {
  title: 'Physical Inventory',
  description: 'Manage physical inventory counts and adjustments',
  icon: ClipboardList,
  route: '/physical-inventory',
  tableColumns: [
    {
      key: 'reference_number',
      label: 'Reference Number',
      sortable: true,
      width: '150px',
      defaultVisible: true
    },
    {
      key: 'inventory_date',
      label: 'Inventory Date',
      sortable: true,
      width: '120px',
      defaultVisible: true
    },
    {
      key: 'store_name',
      label: 'Store',
      sortable: true,
      width: '150px',
      defaultVisible: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '100px',
      defaultVisible: true
    },
    {
      key: 'total_items',
      label: 'Total Items',
      sortable: true,
      width: '80px',
      defaultVisible: false
    },
    {
      key: 'total_value',
      label: 'Total Value',
      sortable: true,
      width: '120px',
      defaultVisible: true
    },
    {
      key: 'currency_symbol',
      label: 'Currency',
      sortable: true,
      width: '100px',
      defaultVisible: false
    },
    {
      key: 'exchange_rate',
      label: 'Exchange Rate',
      sortable: true,
      width: '120px',
      defaultVisible: false
    },
    {
      key: 'notes',
      label: 'Notes',
      sortable: false,
      width: '200px',
      defaultVisible: false
    },
    {
      key: 'created_by_name',
      label: 'Created By',
      sortable: true,
      width: '120px',
      defaultVisible: true
    },
    {
      key: 'created_at',
      label: 'Created Date & Time',
      sortable: true,
      width: '150px',
      defaultVisible: true
    },
    {
      key: 'updated_by_name',
      label: 'Updated By',
      sortable: true,
      width: '120px',
      defaultVisible: false
    },
    {
      key: 'updated_at',
      label: 'Updated Date & Time',
      sortable: true,
      width: '150px',
      defaultVisible: false
    },
    {
      key: 'submitted_by_name',
      label: 'Submitted By',
      sortable: true,
      width: '120px',
      defaultVisible: false
    },
    {
      key: 'submitted_at',
      label: 'Submitted Date & Time',
      sortable: true,
      width: '150px',
      defaultVisible: false
    },
    {
      key: 'approved_by_name',
      label: 'Approved By',
      sortable: true,
      width: '120px',
      defaultVisible: false
    },
    {
      key: 'approved_at',
      label: 'Approved Date & Time',
      sortable: true,
      width: '150px',
      defaultVisible: false
    },
    {
      key: 'rejection_reason',
      label: 'Rejection Reason',
      sortable: false,
      width: '200px',
      defaultVisible: false
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '120px',
      defaultVisible: true
    }
  ],
  sortOptions: [
    { value: 'reference_number', label: 'Reference Number' },
    { value: 'inventory_date', label: 'Inventory Date' },
    { value: 'store_name', label: 'Store' },
    { value: 'status', label: 'Status' },
    { value: 'total_items', label: 'Total Items' },
    { value: 'total_value', label: 'Total Value' },
    { value: 'created_by_name', label: 'Created By' },
    { value: 'created_at', label: 'Created Date & Time' },
    { value: 'updated_by_name', label: 'Updated By' },
    { value: 'updated_at', label: 'Updated Date & Time' },
    { value: 'submitted_by_name', label: 'Submitted By' },
    { value: 'submitted_at', label: 'Submitted Date & Time' },
    { value: 'approved_by_name', label: 'Approved By' },
    { value: 'approved_at', label: 'Approved Date & Time' }
  ],
  filterOptions: [
    { value: 'status', label: 'Status', type: 'select', options: [
      { value: 'all', label: 'All Statuses' },
      { value: 'draft', label: 'Draft' },
      { value: 'submitted', label: 'Submitted' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'returned_for_correction', label: 'Returned for Correction' }
    ]},
    { value: 'storeId', label: 'Store', type: 'select', options: [] },
    { value: 'startDate', label: 'Start Date', type: 'date' },
    { value: 'endDate', label: 'End Date', type: 'date' }
  ],
  actions: [
    { key: 'view', label: 'View', icon: 'Eye', color: 'blue' },
    { key: 'edit', label: 'Edit', icon: 'Edit', color: 'amber', condition: 'status === "draft"' },
    { key: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', condition: 'status === "draft"' },
    { key: 'approve', label: 'Approve', icon: 'CheckCircle', color: 'green', condition: 'status === "submitted"' },
    { key: 'reject', label: 'Reject', icon: 'XCircle', color: 'red', condition: 'status === "submitted"' }
  ]
};

export const defaultPhysicalInventoryFilters: PhysicalInventoryFilters = {
  search: '',
  status: 'all',
  storeId: '',
  ...getCurrentMonthRange()
};

export const defaultPhysicalInventorySortConfig = {
  field: 'created_at' as const,
  direction: 'desc' as const
};

export const defaultPhysicalInventoryStats = {
  totalInventories: 0,
  draftInventories: 0,
  submittedInventories: 0,
  approvedInventories: 0,
  rejectedInventories: 0,
  totalValue: 0,
  lastUpdate: null
};
