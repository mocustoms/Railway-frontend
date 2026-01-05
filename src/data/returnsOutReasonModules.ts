import { RotateCcw } from 'lucide-react';
import { ReturnReasonFilters, ReturnReasonSortConfig, ReturnReasonStats } from '../types';

export interface ReturnsOutReasonModule {
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

export const RETURNS_OUT_REASON_MODULE: ReturnsOutReasonModule = {
  id: 'returns-out-reasons',
  title: 'Returns Out Reasons',
  description: 'Manage reasons for returning products to vendors',
  icon: RotateCcw,
  path: '/purchases/returns-out-reasons',
  category: 'purchases',
  tags: ['returns', 'vendors', 'purchases', 'management'],
  color: '#f59e0b',
  gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  features: ['Return reason management', 'Vendor return tracking', 'Approval workflows', 'Account integration'],
  priority: 'high',
  status: 'active',
  isRequired: true
};

export const defaultReturnReasonFilters: ReturnReasonFilters = {
  search: '',
  returnType: undefined,
  isActive: undefined,
  requiresApproval: undefined,
  refundAccountId: undefined,
  inventoryAccountId: undefined
};

export const defaultReturnReasonSortConfig: ReturnReasonSortConfig = {
  field: 'name',
  direction: 'asc'
};

export const defaultReturnReasonStats: ReturnReasonStats = {
  total: 0,
  active: 0,
  inactive: 0,
  requiresApproval: 0,
  fullRefund: 0,
  partialRefund: 0,
  exchange: 0,
  storeCredit: 0
};

export const returnReasonStatusConfig = {
  active: { label: 'Active', color: '#10b981', bgColor: '#f0fdf4', textColor: 'text-green-800' },
  inactive: { label: 'Inactive', color: '#ef4444', bgColor: '#fef2f2', textColor: 'text-red-800' }
};

export const returnTypeConfig = {
  full_refund: { label: 'Full Refund', color: '#10b981', bgColor: '#f0fdf4', textColor: 'text-green-800' },
  partial_refund: { label: 'Partial Refund', color: '#f59e0b', bgColor: '#fffbeb', textColor: 'text-amber-800' },
  exchange: { label: 'Exchange', color: '#3b82f6', bgColor: '#eff6ff', textColor: 'text-blue-800' },
  store_credit: { label: 'Store Credit', color: '#8b5cf6', bgColor: '#f3e8ff', textColor: 'text-purple-800' }
};

export const approvalConfig = {
  true: { label: 'Requires Approval', color: '#ef4444', bgColor: '#fef2f2', textColor: 'text-red-800' },
  false: { label: 'Auto Approved', color: '#10b981', bgColor: '#f0fdf4', textColor: 'text-green-800' }
};

export const RETURNS_OUT_REASON_COLUMNS = [
  { key: 'name', label: 'Reason Name', sortable: true, visible: true },
  { key: 'code', label: 'Reason Code', sortable: true, visible: true },
  { key: 'description', label: 'Description', sortable: true, visible: true },
  { key: 'returnType', label: 'Return Type', sortable: true, visible: true },
  { key: 'requiresApproval', label: 'Approval Required', sortable: true, visible: true },
  { key: 'maxReturnDays', label: 'Max Return Days', sortable: true, visible: true },
  { key: 'refundAccount', label: 'Refund Account', sortable: true, visible: true },
  { key: 'inventoryAccount', label: 'Inventory Account', sortable: true, visible: true },
  { key: 'isActive', label: 'Status', sortable: true, visible: true },
  { key: 'createdBy', label: 'Created By', sortable: true, visible: true },
  { key: 'createdAt', label: 'Created Date', sortable: true, visible: true },
  { key: 'updatedBy', label: 'Updated By', sortable: true, visible: true },
  { key: 'updatedAt', label: 'Updated Date', sortable: true, visible: true }
];

