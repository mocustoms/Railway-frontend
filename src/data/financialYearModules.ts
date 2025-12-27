import { Calendar, Plus, Settings, Users, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export interface FinancialYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  isCurrent: boolean;
  isActive: boolean;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  closingNotes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  closer?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface FinancialYearFormData {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface FinancialYearFilters {
  search: string;
  status: 'all' | 'open' | 'closed' | 'current';
}

export interface FinancialYearStats {
  totalYears: number;
  openYears: number;
  closedYears: number;
  currentYear?: FinancialYear | null;
}

export const financialYearStatusOptions = [
  { value: 'all', label: 'All Years', color: 'gray' },
  { value: 'open', label: 'Open Years', color: 'green' },
  { value: 'closed', label: 'Closed Years', color: 'red' },
  { value: 'current', label: 'Current Year', color: 'blue' }
];

export const financialYearFeatures = [
  'Create and manage financial year periods',
  'Set current financial year',
  'Close completed financial years',
  'Track year status and closing information',
  'Validate date ranges and overlaps',
  'Manage year transitions'
];

export const financialYearModule = {
  id: 'financial-year',
  title: 'Financial Year Management',
  description: 'Manage financial year periods, set current year, and handle year transitions',
  icon: Calendar,
  path: '/advance-setup/financial-year',
  category: 'Advance Setup',
  tags: ['financial', 'year', 'period', 'accounting'],
  color: 'blue',
  gradient: 'from-blue-500 to-blue-600',
  features: financialYearFeatures,
  priority: 'high' as const,
  status: 'active' as const,
  isRequired: true
};

export const financialYearActions = [
  {
    id: 'add',
    label: 'Add Financial Year',
    icon: Plus,
    action: 'create',
    color: 'blue'
  },
  {
    id: 'set-current',
    label: 'Set Current Year',
    icon: CheckCircle,
    action: 'update',
    color: 'green'
  },
  {
    id: 'close',
    label: 'Close Year',
    icon: XCircle,
    action: 'update',
    color: 'red'
  },
  {
    id: 'reopen',
    label: 'Reopen Year',
    icon: Clock,
    action: 'update',
    color: 'yellow'
  }
];

export const financialYearTableColumns = [
  {
    key: 'name',
    label: 'Financial Year',
    sortable: true,
    width: '20%'
  },
  {
    key: 'startDate',
    label: 'Start Date',
    sortable: true,
    width: '15%'
  },
  {
    key: 'endDate',
    label: 'End Date',
    sortable: true,
    width: '15%'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: false,
    width: '15%'
  },
  {
    key: 'closingInfo',
    label: 'Closing Information',
    sortable: false,
    width: '20%'
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    width: '15%'
  }
]; 