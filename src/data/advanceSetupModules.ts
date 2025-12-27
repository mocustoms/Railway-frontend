import { 
  Building, 
  Store, 
  Coins, 
  ArrowLeftRight, 
  Calendar, 
  Hash, 
  FileText,
  Settings,
  Globe,
  Database,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Star,
  MapPin
} from 'lucide-react';

export interface AdvanceSetupModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  category: 'company' | 'store' | 'financial' | 'system' | 'documentation';
  tags: string[];
  color: string;
  gradient: string;
  features: string[];
  priority: 'high' | 'medium' | 'low';
  status?: 'active' | 'warning' | 'error' | 'pending';
  isRequired?: boolean;
}

export const ADVANCE_SETUP_MODULES: AdvanceSetupModule[] = [
  {
    id: 'company-setup',
    title: 'Company Setup',
    description: 'Configure company information, branding, and organizational details',
    icon: Building,
    path: '/advance-setup/company-setup',
    category: 'company',
    tags: ['company', 'setup', 'information', 'branding', 'organization'],
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    features: ['Company details', 'Branding configuration', 'Contact information', 'Legal details'],
    priority: 'high',
    status: 'active',
    isRequired: true
  },
  {
    id: 'store-setup',
    title: 'Store Setup',
    description: 'Manage store locations, branches, and operational settings',
    icon: Store,
    path: '/advance-setup/store-setup',
    category: 'store',
    tags: ['store', 'locations', 'settings', 'branches', 'operations'],
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    features: ['Store locations', 'Branch management', 'Operational settings', 'Store hierarchy'],
    priority: 'high',
    status: 'active',
    isRequired: true
  },
  {
    id: 'store-locations',
    title: 'Store Locations',
    description: 'Manage physical locations within stores (aisles, shelves, sections)',
    icon: MapPin,
    path: '/store-locations',
    category: 'store',
    tags: ['store', 'locations', 'aisles', 'shelves', 'sections', 'physical'],
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    features: ['Physical location management', 'Aisle and shelf organization', 'Capacity planning', 'Packaging type support'],
    priority: 'high',
    status: 'active',
    isRequired: false
  },
  {
    id: 'currency',
    title: 'Currency Configuration',
    description: 'Set up base currency and multi-currency support',
    icon: Coins,
    path: '/advance-setup/currency',
    category: 'financial',
    tags: ['currency', 'money', 'coins', 'base currency', 'multi-currency'],
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    features: ['Base currency setup', 'Multi-currency support', 'Currency symbols', 'Decimal places'],
    priority: 'high',
    status: 'active',
    isRequired: true
  },
  {
    id: 'exchange-rates',
    title: 'Exchange Rates',
    description: 'Manage currency exchange rates and automatic updates',
    icon: ArrowLeftRight,
    path: '/advance-setup/exchange-rates',
    category: 'financial',
    tags: ['exchange', 'rates', 'currency', 'conversion', 'updates'],
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    features: ['Exchange rate management', 'Automatic updates', 'Rate history', 'API integration'],
    priority: 'high',
    status: 'active',
    isRequired: false
  },
  {
    id: 'financial-year',
    title: 'Financial Year',
    description: 'Define financial periods and set current fiscal year',
    icon: Calendar,
    path: '/advance-setup/financial-year',
    category: 'financial',
    tags: ['financial', 'year', 'periods', 'calendar', 'fiscal'],
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    features: ['Financial periods', 'Fiscal year setup', 'Period management', 'Year-end processes'],
    priority: 'high',
    status: 'active',
    isRequired: true
  },
  {
    id: 'auto-code-manager',
    title: 'Auto Code Manager',
    description: 'Configure automatic code generation for products, accounts, and transactions',
    icon: Hash,
    path: '/advance-setup/auto-code-manager',
    category: 'system',
    tags: ['auto', 'code', 'generation', 'manager', 'sequences'],
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    features: ['Code sequences', 'Auto-generation rules', 'Prefix/suffix setup', 'Number formatting'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  },
  {
    id: 'reference-number-manager',
    title: 'Reference Number Manager',
    description: 'Manage reference number formats for invoices, receipts, and documents',
    icon: FileText,
    path: '/advance-setup/reference-number-manager',
    category: 'documentation',
    tags: ['reference', 'number', 'invoices', 'documents', 'formats'],
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    features: ['Document numbering', 'Format templates', 'Sequence management', 'Document types'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  },
  {
    id: 'system-parameters',
    title: 'System Parameters',
    description: 'Configure global system parameters and default settings',
    icon: Settings,
    path: '/advance-setup/system-parameters',
    category: 'system',
    tags: ['system', 'parameters', 'settings', 'defaults', 'configuration'],
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    features: ['Global parameters', 'Default settings', 'System preferences', 'Configuration backup'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  },
  {
    id: 'regional-settings',
    title: 'Regional Settings',
    description: 'Configure regional preferences, time zones, and localization',
    icon: Globe,
    path: '/advance-setup/regional-settings',
    category: 'system',
    tags: ['regional', 'settings', 'timezone', 'localization', 'preferences'],
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    features: ['Time zone setup', 'Date formats', 'Language settings', 'Regional preferences'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  },
  {
    id: 'database-configuration',
    title: 'Database Configuration',
    description: 'Manage database settings, connections, and backup configurations',
    icon: Database,
    path: '/advance-setup/database-configuration',
    category: 'system',
    tags: ['database', 'configuration', 'connections', 'backup', 'settings'],
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    features: ['Database settings', 'Connection management', 'Backup configuration', 'Performance tuning'],
    priority: 'high',
    status: 'active',
    isRequired: false
  },
  {
    id: 'security-settings',
    title: 'Security Settings',
    description: 'Configure security policies, authentication, and access controls',
    icon: Shield,
    path: '/advance-setup/security-settings',
    category: 'system',
    tags: ['security', 'settings', 'authentication', 'access', 'policies'],
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    features: ['Security policies', 'Authentication setup', 'Access controls', 'Password policies'],
    priority: 'high',
    status: 'active',
    isRequired: false
  },
  {
    id: 'backup-settings',
    title: 'Backup Settings',
    description: 'Configure automated backup schedules and retention policies',
    icon: Database,
    path: '/advance-setup/backup-settings',
    category: 'system',
    tags: ['backup', 'settings', 'automation', 'retention', 'schedules'],
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    features: ['Backup schedules', 'Retention policies', 'Automation rules', 'Backup monitoring'],
    priority: 'medium',
    status: 'active',
    isRequired: false
  }
];

export const ADVANCE_SETUP_CATEGORIES = [
  { value: 'all', label: 'All Modules', color: '#6b7280' },
  { value: 'company', label: 'Company', color: '#3b82f6' },
  { value: 'store', label: 'Store', color: '#10b981' },
  { value: 'financial', label: 'Financial', color: '#f59e0b' },
  { value: 'system', label: 'System', color: '#6366f1' },
  { value: 'documentation', label: 'Documentation', color: '#ec4899' }
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