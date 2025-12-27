import { 
  ClipboardCheck, 
  Boxes, 
  Sliders, 
  Truck, 
  Package,
  Warehouse,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Activity,
  Target,
  ShoppingCart,
  CreditCard,
  FileText,
  Settings,
  Database,
  Shield,
  LucideIcon
} from 'lucide-react';

export interface InventoryModule {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  category: 'stock' | 'physical' | 'requests' | 'issues' | 'analytics';
  tags: string[];
  color: string;
  gradient: string;
  features: string[];
  priority: 'high' | 'medium' | 'low';
  status?: 'active' | 'warning' | 'error' | 'pending';
  isRequired?: boolean;
  stockLevel?: 'normal' | 'low' | 'critical' | 'overstock';
}

export const INVENTORY_MODULES: InventoryModule[] = [
  {
    id: 'adjustment-reasons',
    title: 'Adjustment Reasons',
    description: 'Manage reasons for inventory adjustments and stock corrections',
    icon: ClipboardCheck,
    path: '/inventory/adjustment-reasons',
    category: 'stock',
    tags: ['adjustment', 'reasons', 'inventory', 'corrections', 'management'],
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    features: ['Reason management', 'Adjustment tracking', 'Audit trail', 'Category organization'],
    priority: 'high',
    status: 'active',
    isRequired: true
  },
  {
    id: 'physical-inventory',
    title: 'Physical Inventory',
    description: 'Perform and track physical stock counts and cycle counting',
    icon: Boxes,
    path: '/inventory/physical-inventory',
    category: 'physical',
    tags: ['physical', 'inventory', 'stock', 'counts', 'cycle counting'],
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    features: ['Stock counting', 'Cycle counting', 'Variance tracking', 'Count sheets'],
    priority: 'high',
    status: 'active',
    isRequired: true
  },
  {
    id: 'stock-adjustment',
    title: 'Stock Adjustment',
    description: 'Adjust stock levels for products and manage inventory corrections',
    icon: Sliders,
    path: '/inventory/stock-adjustment',
    category: 'stock',
    tags: ['stock', 'adjustment', 'levels', 'products', 'corrections'],
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    features: ['Stock adjustments', 'Level management', 'Reason tracking', 'Approval workflow'],
    priority: 'high',
    status: 'active',
    isRequired: true
  },
  {
    id: 'store-requests',
    title: 'Store Requests',
    description: 'Request stock from other stores or warehouses with approval workflow',
    icon: Truck,
    path: '/inventory/store-requests',
    category: 'requests',
    tags: ['store', 'requests', 'stock', 'warehouses', 'approval'],
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    features: ['Stock requests', 'Approval workflow', 'Store transfers', 'Request tracking'],
    priority: 'high',
    status: 'active',
    isRequired: false
  },
  {
    id: 'store-issues',
    title: 'Store Issues',
    description: 'Issue stock to stores or departments with tracking and documentation',
    icon: Package,
    path: '/inventory/store-issues',
    category: 'issues',
    tags: ['store', 'issues', 'stock', 'departments', 'tracking'],
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    features: ['Stock issues', 'Department tracking', 'Documentation', 'Issue history'],
    priority: 'high',
    status: 'active',
    isRequired: false
  },
  {
    id: 'store-receipts',
    title: 'Store Receipts',
    description: 'Receive stock from other stores or warehouses with tracking and documentation',
    icon: ShoppingCart,
    path: '/inventory/store-receipts',
    category: 'requests',
    tags: ['store', 'receipts', 'stock', 'warehouses', 'receiving'],
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    features: ['Stock receipts', 'Receiving workflow', 'Store transfers', 'Receipt tracking'],
    priority: 'high',
    status: 'active',
    isRequired: false
  },
  {
    id: 'stock-balance',
    title: 'Stock Balance',
    description: 'View current stock balances and inventory levels across all locations',
    icon: Warehouse,
    path: '/inventory/stock-balance',
    category: 'analytics',
    tags: ['stock', 'balance', 'levels', 'locations', 'inventory'],
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    features: ['Stock balances', 'Location tracking', 'Level monitoring', 'Balance reports'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  },
  {
    id: 'inventory-reports',
    title: 'Inventory Reports',
    description: 'Generate comprehensive inventory reports and analytics',
    icon: BarChart3,
    path: '/inventory/reports',
    category: 'analytics',
    tags: ['inventory', 'reports', 'analytics', 'data', 'insights'],
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    features: ['Inventory reports', 'Analytics dashboard', 'Data insights', 'Export options'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  },
  {
    id: 'stock-movements',
    title: 'Stock Movements',
    description: 'Track all stock movements and inventory transactions',
    icon: TrendingUp,
    path: '/inventory/stock-movements',
    category: 'analytics',
    tags: ['stock', 'movements', 'transactions', 'tracking', 'history'],
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    features: ['Movement tracking', 'Transaction history', 'Audit trail', 'Movement analysis'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  },
  {
    id: 'low-stock-alerts',
    title: 'Low Stock Alerts',
    description: 'Monitor and manage low stock alerts and reorder points',
    icon: AlertTriangle,
    path: '/inventory/low-stock-alerts',
    category: 'stock',
    tags: ['low', 'stock', 'alerts', 'reorder', 'monitoring'],
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    features: ['Low stock alerts', 'Reorder points', 'Alert management', 'Notification system'],
    priority: 'high',
    status: 'active',
    isRequired: false
  },
  {
    id: 'inventory-audit',
    title: 'Inventory Audit',
    description: 'Perform inventory audits and compliance checks',
    icon: CheckCircle,
    path: '/inventory/audit',
    category: 'physical',
    tags: ['inventory', 'audit', 'compliance', 'checks', 'verification'],
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    features: ['Audit management', 'Compliance checks', 'Verification process', 'Audit reports'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  },
  {
    id: 'cycle-counting',
    title: 'Cycle Counting',
    description: 'Manage cycle counting schedules and procedures',
    icon: Clock,
    path: '/inventory/cycle-counting',
    category: 'physical',
    tags: ['cycle', 'counting', 'schedules', 'procedures', 'management'],
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    features: ['Cycle counting', 'Schedule management', 'Procedure tracking', 'Count accuracy'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  },
  {
    id: 'inventory-settings',
    title: 'Inventory Settings',
    description: 'Configure inventory management settings and parameters',
    icon: Settings,
    path: '/inventory/settings',
    category: 'stock',
    tags: ['inventory', 'settings', 'configuration', 'parameters', 'management'],
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    features: ['Settings management', 'Parameter configuration', 'System preferences', 'Default values'],
    priority: 'low',
    status: 'active',
    isRequired: false
  }
];

export const INVENTORY_CATEGORIES = [
  { value: 'all', label: 'All Modules', color: '#6b7280' },
  { value: 'stock', label: 'Stock Management', color: '#3b82f6' },
  { value: 'physical', label: 'Physical Inventory', color: '#10b981' },
  { value: 'requests', label: 'Store Requests', color: '#8b5cf6' },
  { value: 'issues', label: 'Store Issues', color: '#ec4899' },
  { value: 'analytics', label: 'Analytics', color: '#06b6d4' }
];

export const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: '#ef4444', bgColor: '#fef2f2' },
  medium: { label: 'Medium Priority', color: '#f59e0b', bgColor: '#fffbeb' },
  low: { label: 'Low Priority', color: '#10b981', bgColor: '#f0fdf4' }
};

export const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10b981', icon: CheckCircle },
  warning: { label: 'Warning', color: '#f59e0b', icon: AlertTriangle },
  error: { label: 'Error', color: '#ef4444', icon: AlertTriangle },
  pending: { label: 'Pending', color: '#6b7280', icon: Clock }
};

export const STOCK_LEVEL_CONFIG = {
  normal: { label: 'Normal', color: '#10b981', bgColor: '#f0fdf4' },
  low: { label: 'Low Stock', color: '#f59e0b', bgColor: '#fffbeb' },
  critical: { label: 'Critical', color: '#ef4444', bgColor: '#fef2f2' },
  overstock: { label: 'Overstock', color: '#8b5cf6', bgColor: '#faf5ff' }
};