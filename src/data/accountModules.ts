import { 
  Layers,
  Network,
  Link as LinkIcon,
  Wallet,
  ArrowLeftRight,
  ClipboardList,
  BookOpen,
  Calculator,
  TrendingUp,
  Shield
} from 'lucide-react';

export interface AccountModule {
  path: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  searchTerms: string[];
  category: 'core' | 'financial' | 'management';
  color: string;
  gradient: string;
}

export const ACCOUNT_MODULES: AccountModule[] = [
  {
    path: '/accounts/chart-of-accounts',
    title: 'Chart of Accounts',
    icon: BookOpen,
    description: 'Manage and organize your financial accounts structure',
    searchTerms: ['chart', 'accounts', 'structure', 'organization'],
    category: 'core',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
  },
  {
    path: '/accounts/account-types',
    title: 'Account Types',
    icon: Layers,
    description: 'Define and manage different types of accounts',
    searchTerms: ['types', 'categories', 'classification'],
    category: 'core',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  {
    path: '/accounts/general-ledger',
    title: 'General Ledger',
    icon: ClipboardList,
    description: 'View and manage all financial transactions',
    searchTerms: ['ledger', 'transactions', 'journal', 'entries'],
    category: 'financial',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  {
    path: '/accounts/trial-balance',
    title: 'Trial Balance',
    icon: TrendingUp,
    description: 'Generate and review trial balance reports',
    searchTerms: ['trial', 'balance', 'reports', 'financial'],
    category: 'financial',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  {
    path: '/accounts/opening-balances',
    title: 'Opening Balances',
    icon: Wallet,
    description: 'Set and manage account opening balances',
    searchTerms: ['opening', 'balances', 'initial', 'setup'],
    category: 'financial',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
  {
    path: '/accounts/linked-accounts',
    title: 'Linked Accounts',
    icon: LinkIcon,
    description: 'Manage relationships between accounts',
    searchTerms: ['linked', 'relationships', 'connections'],
    category: 'management',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
  },
  {
    path: '/accounts/record-ledger-entries',
    title: 'Record Ledger Entries',
    icon: ArrowLeftRight,
    description: 'Create and manage ledger entries manually',
    searchTerms: ['record', 'entries', 'manual', 'transactions'],
    category: 'financial',
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)'
  },
  {
    path: '/accounts/transfer-money',
    title: 'Transfer Money',
    icon: Network,
    description: 'Transfer funds between accounts',
    searchTerms: ['transfer', 'money', 'funds', 'between'],
    category: 'financial',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
  }
];