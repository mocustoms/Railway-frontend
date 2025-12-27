import { 
  Warehouse, 
  Calendar,
  Users,
  Gift,
  FileText,
  TrendingUp,
  Package
} from 'lucide-react';

export interface ReportModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  category: 'financial' | 'inventory' | 'sales' | 'analytics' | 'operational';
  tags: string[];
  color: string;
  gradient: string;
  features: string[];
}

export const REPORT_MODULES: ReportModule[] = [
  {
    id: 'stock-balance',
    title: 'Stock Balance Report',
    description: 'View current stock balances by product and store location',
    icon: Warehouse,
    path: '/reports/stock-balance',
    category: 'inventory',
    tags: ['stock', 'inventory', 'balance', 'warehouse', 'products'],
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    features: ['Current stock levels', 'Store-wise breakdown', 'Product tracking', 'Balance reports']
  },
  {
    id: 'stock-balance-as-of-date',
    title: 'Stock Balance as of Date Report',
    description: 'View historical stock balances as of a specific date with detailed analysis',
    icon: Calendar,
    path: '/reports/stock-balance-as-of-date',
    category: 'inventory',
    tags: ['stock', 'inventory', 'balance', 'historical', 'date'],
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    features: ['Historical stock levels', 'Date-based analysis', 'Store-wise breakdown', 'Trend analysis']
  },
  {
    id: 'customer-list',
    title: 'Customer List Report',
    description: 'View comprehensive customer information including contact details, account balances, and loyalty card status',
    icon: Users,
    path: '/reports/sales/customer-list',
    category: 'sales',
    tags: ['customers', 'contact', 'account', 'loyalty', 'sales'],
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    features: ['Customer details', 'Contact information', 'Account balances', 'Loyalty card status', 'Group distribution']
  },
  {
    id: 'customer-birthdays',
    title: 'Customer Birthdays Report',
    description: 'Track and manage customer birthdays with upcoming birthday notifications and group analysis',
    icon: Gift,
    path: '/reports/sales/customer-birthdays',
    category: 'sales',
    tags: ['customers', 'birthdays', 'events', 'notifications', 'sales'],
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    features: ['Birthday tracking', 'Upcoming notifications', 'Group analysis', 'Contact management', 'Event planning']
  },
  {
    id: 'revenue',
    title: 'Revenue Report',
    description: 'View detailed revenue transaction information with comprehensive filtering and analysis',
    icon: TrendingUp,
    path: '/reports/sales/revenue',
    category: 'sales',
    tags: ['sales', 'transactions', 'details', 'analysis', 'reports', 'revenue'],
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    features: ['Transaction details', 'Multi-filter support', 'Financial analysis', 'Export capabilities']
  },
  {
    id: 'sales-details',
    title: 'Sales Details Report',
    description: 'View detailed line-item sales information showing individual products sold in invoices and orders',
    icon: Package,
    path: '/reports/sales/sales-details',
    category: 'sales',
    tags: ['sales', 'line items', 'products', 'invoices', 'orders', 'details'],
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    features: ['Line item details', 'Product breakdown', 'Invoice & order items', 'Export capabilities']
  },
  {
    id: 'trial-balance',
    title: 'Trial Balance Report',
    description: 'View account balances with hierarchical structure showing Account Types, Accounts, and Leaf Accounts',
    icon: FileText,
    path: '/reports/trial-balance',
    category: 'financial',
    tags: ['trial balance', 'accounts', 'financial', 'balance', 'debit', 'credit'],
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    features: ['Account hierarchy', 'Dr/Cr balances', 'Account type grouping', 'Financial totals']
  }
];

export const REPORT_CATEGORIES = [
  { value: 'all', label: 'All Reports', color: '#6b7280' },
  { value: 'inventory', label: 'Inventory Reports', color: '#8b5cf6' },
  { value: 'sales', label: 'Sales Reports', color: '#10b981' },
  { value: 'financial', label: 'Financial Reports', color: '#8b5cf6' }
];