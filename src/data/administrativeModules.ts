import { 
  Sliders, 
  Database, 
  History, 
  Shield, 
  CreditCard, 
  DollarSign, 
  Printer, 
  Percent,
  Settings,
  HardDrive,
  Activity,
  Lock,
  FileText,
  Cog,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export interface AdministrativeModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  category: 'system' | 'security' | 'payment' | 'hardware' | 'compliance';
  tags: string[];
  color: string;
  gradient: string;
  features: string[];
  priority: 'high' | 'medium' | 'low';
  status?: 'active' | 'warning' | 'error';
}

export const ADMINISTRATIVE_MODULES: AdministrativeModule[] = [
  {
    id: 'system-settings',
    title: 'System Settings',
    description: 'Configure core system parameters and global settings',
    icon: Sliders,
    path: '/administrative/system-settings',
    category: 'system',
    tags: ['system', 'settings', 'parameters', 'configuration'],
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    features: ['Global parameters', 'System preferences', 'Default values', 'Configuration backup'],
    priority: 'high',
    status: 'active'
  },
  {
    id: 'data-backup',
    title: 'Data Backup & Restore',
    description: 'Manage database backups and system restoration',
    icon: Database,
    path: '/administrative/data-backup',
    category: 'system',
    tags: ['data', 'backup', 'restore', 'database', 'recovery'],
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    features: ['Automated backups', 'Manual backups', 'Data restoration', 'Backup scheduling'],
    priority: 'high',
    status: 'active'
  },
  {
    id: 'audit-trail',
    title: 'Audit Trail',
    description: 'View system activity logs and user action history',
    icon: History,
    path: '/administrative/audit-trail',
    category: 'compliance',
    tags: ['audit', 'trail', 'activity', 'history', 'logs'],
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    features: ['User activity logs', 'System events', 'Data changes', 'Export logs'],
    priority: 'medium',
    status: 'active'
  },
  {
    id: 'security',
    title: 'Security Settings',
    description: 'Manage security configurations and access controls',
    icon: Shield,
    path: '/administrative/security',
    category: 'security',
    tags: ['security', 'settings', 'protection', 'access', 'authentication'],
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    features: ['Password policies', 'Session management', 'Access controls', 'Security logs'],
    priority: 'high',
    status: 'active'
  },
  {
    id: 'payment-types',
    title: 'Payment Types',
    description: 'Configure accepted payment methods and transaction types',
    icon: CreditCard,
    path: '/administrative/payment-types',
    category: 'payment',
    tags: ['payment', 'types', 'methods', 'credit', 'debit'],
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    features: ['Payment method setup', 'Transaction types', 'Processing fees', 'Method status'],
    priority: 'high',
    status: 'active'
  },
  {
    id: 'payment-methods',
    title: 'Payment Methods',
    description: 'Manage payment method configurations and processing settings',
    icon: DollarSign,
    path: '/administrative/payment-methods',
    category: 'payment',
    tags: ['payment', 'methods', 'configurations', 'processing'],
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    features: ['Method configuration', 'Processing settings', 'Gateway setup', 'Test mode'],
    priority: 'high',
    status: 'active'
  },
  {
    id: 'printer-setup',
    title: 'Printer Setup',
    description: 'Configure receipt printers and printing preferences',
    icon: Printer,
    path: '/administrative/printer-setup',
    category: 'hardware',
    tags: ['printer', 'setup', 'receipt', 'configure', 'hardware'],
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    features: ['Printer configuration', 'Receipt templates', 'Print testing', 'Driver setup'],
    priority: 'medium',
    status: 'active'
  },
  {
    id: 'tax-codes',
    title: 'Tax Codes',
    description: 'Set up and manage tax codes and rates',
    icon: Percent,
    path: '/administrative/tax-codes',
    category: 'compliance',
    tags: ['tax', 'codes', 'percentage', 'rates', 'compliance'],
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    features: ['Tax rate setup', 'Code management', 'Rate calculations', 'Compliance reporting'],
    priority: 'high',
    status: 'active'
  },
  {
    id: 'user-management',
    title: 'User Management',
    description: 'Manage system users, roles, and permissions',
    icon: Settings,
    path: '/administrative/user-management',
    category: 'security',
    tags: ['users', 'roles', 'permissions', 'access', 'management'],
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    features: ['User accounts', 'Role assignment', 'Permission management', 'Access logs'],
    priority: 'high',
    status: 'active'
  },
  {
    id: 'system-logs',
    title: 'System Logs',
    description: 'View detailed system logs and error reports',
    icon: Activity,
    path: '/administrative/system-logs',
    category: 'system',
    tags: ['logs', 'system', 'errors', 'monitoring', 'debugging'],
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    features: ['Error logs', 'System monitoring', 'Performance metrics', 'Log filtering'],
    priority: 'medium',
    status: 'active'
  },
  {
    id: 'backup-schedule',
    title: 'Backup Schedule',
    description: 'Configure automated backup schedules and retention policies',
    icon: HardDrive,
    path: '/administrative/backup-schedule',
    category: 'system',
    tags: ['backup', 'schedule', 'automation', 'retention', 'policies'],
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    features: ['Schedule configuration', 'Retention policies', 'Automation rules', 'Backup monitoring'],
    priority: 'medium',
    status: 'active'
  },
  {
    id: 'compliance-reports',
    title: 'Compliance Reports',
    description: 'Generate compliance reports and audit documentation',
    icon: FileText,
    path: '/administrative/compliance-reports',
    category: 'compliance',
    tags: ['compliance', 'reports', 'audit', 'documentation', 'regulations'],
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    features: ['Compliance reports', 'Audit documentation', 'Regulatory updates', 'Report scheduling'],
    priority: 'medium',
    status: 'active'
  }
];

export const ADMINISTRATIVE_CATEGORIES = [
  { value: 'all', label: 'All Modules', color: '#6b7280' },
  { value: 'system', label: 'System', color: '#3b82f6' },
  { value: 'security', label: 'Security', color: '#ef4444' },
  { value: 'payment', label: 'Payment', color: '#8b5cf6' },
  { value: 'hardware', label: 'Hardware', color: '#84cc16' },
  { value: 'compliance', label: 'Compliance', color: '#f59e0b' }
];

export const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: '#ef4444', bgColor: '#fef2f2' },
  medium: { label: 'Medium Priority', color: '#f59e0b', bgColor: '#fffbeb' },
  low: { label: 'Low Priority', color: '#10b981', bgColor: '#f0fdf4' }
};

export const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10b981', icon: CheckCircle },
  warning: { label: 'Warning', color: '#f59e0b', icon: AlertTriangle },
  error: { label: 'Error', color: '#ef4444', icon: AlertTriangle }
};