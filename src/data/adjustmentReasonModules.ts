import { ClipboardCheck } from 'lucide-react';
import { AdjustmentReasonFilters, AdjustmentReasonSortConfig, AdjustmentReasonStats } from '../types';

export interface AdjustmentReasonModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  category: 'inventory';
  tags: string[];
  color: string;
  gradient: string;
  features: string[];
  priority: 'high' | 'medium' | 'low';
  status?: 'active' | 'warning' | 'error' | 'pending';
  isRequired?: boolean;
}

export const ADJUSTMENT_REASON_MODULE: AdjustmentReasonModule = {
  id: 'adjustment-reasons',
  title: 'Adjustment Reasons',
  description: 'Manage reasons for inventory adjustments and stock corrections',
  icon: ClipboardCheck,
  path: '/inventory/adjustment-reasons',
  category: 'inventory',
  tags: ['adjustment', 'reasons', 'inventory', 'corrections', 'management'],
  color: '#3b82f6',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  features: ['Reason management', 'Adjustment tracking', 'Audit trail', 'Category organization'],
  priority: 'high',
  status: 'active',
  isRequired: true
};

export const defaultAdjustmentReasonFilters: AdjustmentReasonFilters = {
  search: '',
  adjustmentType: undefined,
  isActive: undefined,
  trackingAccountId: undefined
};

export const defaultAdjustmentReasonSortConfig: AdjustmentReasonSortConfig = {
  field: 'name',
  direction: 'asc'
};

export const defaultAdjustmentReasonStats: AdjustmentReasonStats = {
  total: 0,
  active: 0,
  inactive: 0,
  addType: 0,
  deductType: 0
};

export const adjustmentReasonStatusConfig = {
  active: { label: 'Active', color: '#10b981', bgColor: '#f0fdf4', textColor: 'text-green-800' },
  inactive: { label: 'Inactive', color: '#ef4444', bgColor: '#fef2f2', textColor: 'text-red-800' }
};

export const adjustmentTypeConfig = {
  add: { label: 'Add (Increase Stock)', color: '#10b981', bgColor: '#f0fdf4', textColor: 'text-green-800' },
  deduct: { label: 'Deduct (Decrease Stock)', color: '#ef4444', bgColor: '#fef2f2', textColor: 'text-red-800' }
};

export const ADJUSTMENT_REASON_COLUMNS = [
  { key: 'name', label: 'Reason Name', sortable: true, visible: true },
  { key: 'code', label: 'Reason Code', sortable: true, visible: true },
  { key: 'description', label: 'Description', sortable: true, visible: true },
  { key: 'adjustmentType', label: 'Adjustment Type', sortable: true, visible: true },
  { key: 'trackingAccount', label: 'Tracking Account', sortable: true, visible: true },
  { key: 'isActive', label: 'Status', sortable: true, visible: true },
  { key: 'createdBy', label: 'Created By', sortable: true, visible: true },
  { key: 'createdAt', label: 'Created Date', sortable: true, visible: true },
  { key: 'updatedBy', label: 'Updated By', sortable: true, visible: true },
  { key: 'updatedAt', label: 'Updated Date', sortable: true, visible: true }
];
