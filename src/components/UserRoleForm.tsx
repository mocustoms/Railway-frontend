import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Shield,
  CheckCircle,
  X,
  Search,
  CheckSquare,
  Square,
  Eye,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Send,
  XCircle,
  RotateCcw,
  Upload,
  BarChart3,
  Settings,
  FileSpreadsheet,
  FileText,
  Package,
  Pill,
  Users,
  Store,
  ShoppingCart,
  ShoppingBag,
  BookOpen,
  Database,
  Clock,
  Building2,
  Coins,
  ArrowLeftRight,
  Calendar,
  CreditCard,
  DollarSign,
  Gift,
  TrendingUp,
  Warehouse,
  Link as LinkIcon,
  Percent,
  MapPin
} from 'lucide-react';
import { UserRoleFormData, UserRole, Permission } from '../types';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import { permissionCategories, getCategoryIcon } from '../data/userRoleModules';

// Validation schema
const validationSchema = yup.object({
  name: yup
    .string()
    .required('Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be less than 50 characters'),
  description: yup
    .string()
    .optional()
    .max(500, 'Description must be less than 500 characters'),
  permissions: yup
    .array()
    .of(yup.string())
    .min(1, 'At least one permission must be selected'),
  is_active: yup.boolean()
});

// Module structure with sub-modules and actions
interface SubModule {
  id: string;
  name: string;
  label: string;
  icon?: any;
  actions?: string[];
  moreOptions?: string[];
  additionalFeatures?: string[];
}

interface ModuleStructure {
  id: string;
  name: string;
  label: string;
  icon: any;
  subModules: SubModule[];
}

// Define module structure - Complete list matching the entire app
const moduleStructures: ModuleStructure[] = [
  {
    id: 'dashboard',
    name: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    subModules: [
      {
        id: 'dashboard',
        name: 'dashboard',
        label: 'Dashboard',
        actions: ['view'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'users',
    name: 'users',
    label: 'User Management',
    icon: Users,
    subModules: [
      {
        id: 'user-management',
        name: 'user-management',
        label: 'User Management',
        actions: ['view', 'add', 'edit', 'delete', 'approve'],
        moreOptions: ['view-stat-cards', 'import-users'],
        additionalFeatures: []
      },
      {
        id: 'user-roles',
        name: 'user-roles',
        label: 'User Roles',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'roles',
    name: 'roles',
    label: 'Role Management',
    icon: Shield,
    subModules: [
      {
        id: 'roles',
        name: 'roles',
        label: 'Roles',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'stores',
    name: 'stores',
    label: 'Store Management',
    icon: Store,
    subModules: [
      {
        id: 'stores',
        name: 'stores',
        label: 'Stores',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards', 'import-stores', 'set-current'],
        additionalFeatures: []
      },
      {
        id: 'store-locations',
        name: 'store-locations',
        label: 'Store Locations',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'products',
    name: 'products',
    label: 'Product Management',
    icon: Package,
    subModules: [
      {
        id: 'product-catalog',
        name: 'product-catalog',
        label: 'Product Catalog',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards', 'import-products'],
        additionalFeatures: ['manage-raw-materials', 'manage-doses']
      },
      {
        id: 'product-categories',
        name: 'product-categories',
        label: 'Product Categories',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'product-colors',
        name: 'product-colors',
        label: 'Product Colors',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'product-models',
        name: 'product-models',
        label: 'Product Models',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'product-brands',
        name: 'product-brands',
        label: 'Product Brands',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'product-manufacturers',
        name: 'product-manufacturers',
        label: 'Product Manufacturers',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'packaging',
        name: 'packaging',
        label: 'Packaging',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'price-categories',
        name: 'price-categories',
        label: 'Price Categories',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'inventory',
    name: 'inventory',
    label: 'Inventory Management',
    icon: Package,
    subModules: [
      {
        id: 'adjustment-reasons',
        name: 'adjustment-reasons',
        label: 'Adjustment Reasons',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'stock-adjustments',
        name: 'stock-adjustments',
        label: 'Stock Adjustments',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'physical-inventory',
        name: 'physical-inventory',
        label: 'Physical Inventory',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject', 'return-for-correction'],
        moreOptions: ['view-stat-cards', 'import-products'],
        additionalFeatures: ['import-products']
      },
      {
        id: 'store-requests',
        name: 'store-requests',
        label: 'Store Requests',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'store-issues',
        name: 'store-issues',
        label: 'Store Issues',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'store-receipts',
        name: 'store-receipts',
        label: 'Store Receipts',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'sales',
    name: 'sales',
    label: 'Sales Management',
    icon: ShoppingCart,
    subModules: [
      {
        id: 'proforma-invoices',
        name: 'proforma-invoices',
        label: 'Proforma Invoices',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'sales-orders',
        name: 'sales-orders',
        label: 'Sales Orders',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'sales-invoices',
        name: 'sales-invoices',
        label: 'Sales Invoices',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'sales-receipts',
        name: 'sales-receipts',
        label: 'Sales Receipts',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'customers',
        name: 'customers',
        label: 'Customers',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards', 'import-customers'],
        additionalFeatures: []
      },
      {
        id: 'customer-groups',
        name: 'customer-groups',
        label: 'Customer Groups',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'sales-agents',
        name: 'sales-agents',
        label: 'Sales Agents',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'return-reasons',
        name: 'return-reasons',
        label: 'Return Reasons',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'loyalty-cards',
        name: 'loyalty-cards',
        label: 'Loyalty Cards',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'purchases',
    name: 'purchases',
    label: 'Purchase Management',
    icon: ShoppingBag,
    subModules: [
      {
        id: 'purchase-orders',
        name: 'purchase-orders',
        label: 'Purchase Orders',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'purchase-invoices',
        name: 'purchase-invoices',
        label: 'Purchase Invoices',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'invoice-payments',
        name: 'invoice-payments',
        label: 'Invoice Payments',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'vendors',
        name: 'vendors',
        label: 'Vendors',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards', 'import-vendors'],
        additionalFeatures: []
      },
      {
        id: 'vendor-groups',
        name: 'vendor-groups',
        label: 'Vendor Groups',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'returns-out-reasons',
        name: 'returns-out-reasons',
        label: 'Returns Out Reasons',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'returns-out',
        name: 'returns-out',
        label: 'Returns Out',
        actions: ['view', 'add', 'edit', 'delete', 'submit', 'approve', 'reject'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'reports',
    name: 'reports',
    label: 'Reports & Analytics',
    icon: TrendingUp,
    subModules: [
      {
        id: 'stock-balance-report',
        name: 'stock-balance-report',
        label: 'Stock Balance Report',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'stock-balance-as-of-date',
        name: 'stock-balance-as-of-date',
        label: 'Stock Balance As Of Date',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'customer-list-report',
        name: 'customer-list-report',
        label: 'Customer List Report',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'customer-birthdays-report',
        name: 'customer-birthdays-report',
        label: 'Customer Birthdays Report',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'revenue-report',
        name: 'revenue-report',
        label: 'Revenue Report',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'sales-details-report',
        name: 'sales-details-report',
        label: 'Sales Details Report',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'trial-balance-report',
        name: 'trial-balance-report',
        label: 'Trial Balance Report',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'account-reports',
        name: 'account-reports',
        label: 'Account Reports',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'accounts',
    name: 'accounts',
    label: 'Accounts Management',
    icon: BookOpen,
    subModules: [
      {
        id: 'account-types',
        name: 'account-types',
        label: 'Account Types',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'chart-of-accounts',
        name: 'chart-of-accounts',
        label: 'Chart of Accounts',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'opening-balances',
        name: 'opening-balances',
        label: 'Opening Balances',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'record-ledger-entries',
        name: 'record-ledger-entries',
        label: 'Record Ledger Entries',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'linked-accounts',
        name: 'linked-accounts',
        label: 'Linked Accounts',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'account-reports',
        name: 'account-reports',
        label: 'Account Reports',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'trial-balance',
        name: 'trial-balance',
        label: 'Trial Balance',
        actions: ['view'],
        moreOptions: [],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'data-importation',
    name: 'data-importation',
    label: 'Data Importation',
    icon: Upload,
    subModules: [
      {
        id: 'import-products',
        name: 'import-products',
        label: 'Import Products',
        actions: ['view', 'import'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'import-customers',
        name: 'import-customers',
        label: 'Import Customers',
        actions: ['view', 'import'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'import-customer-deposits',
        name: 'import-customer-deposits',
        label: 'Import Customer Deposits',
        actions: ['view', 'import'],
        moreOptions: [],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'advance-setup',
    name: 'advance-setup',
    label: 'Advance Setup',
    icon: Settings,
    subModules: [
      {
        id: 'company-setup',
        name: 'company-setup',
        label: 'Company Setup',
        actions: ['view', 'edit'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'store-setup',
        name: 'store-setup',
        label: 'Store Setup',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards', 'import-stores'],
        additionalFeatures: []
      },
      {
        id: 'currency-setup',
        name: 'currency-setup',
        label: 'Currency Setup',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'exchange-rate-setup',
        name: 'exchange-rate-setup',
        label: 'Exchange Rate Setup',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'financial-year',
        name: 'financial-year',
        label: 'Financial Year',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'administrative',
    name: 'administrative',
    label: 'Administrative',
    icon: Settings,
    subModules: [
      {
        id: 'tax-codes',
        name: 'tax-codes',
        label: 'Tax Codes',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'payment-types',
        name: 'payment-types',
        label: 'Payment Types',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'payment-methods',
        name: 'payment-methods',
        label: 'Payment Methods',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'bank-details',
        name: 'bank-details',
        label: 'Bank Details',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'customer-deposits',
        name: 'customer-deposits',
        label: 'Customer Deposits',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'linked-accounts',
        name: 'linked-accounts',
        label: 'Linked Accounts',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      },
      {
        id: 'database-settings',
        name: 'database-settings',
        label: 'Database Settings',
        actions: ['view', 'edit'],
        moreOptions: [],
        additionalFeatures: []
      },
      {
        id: 'scheduler-management',
        name: 'scheduler-management',
        label: 'Scheduler Management',
        actions: ['view', 'add', 'edit', 'delete'],
        moreOptions: [],
        additionalFeatures: []
      }
    ]
  },
  {
    id: 'pos',
    name: 'pos',
    label: 'Point of Sale',
    icon: CreditCard,
    subModules: [
      {
        id: 'pos',
        name: 'pos',
        label: 'POS System',
        actions: ['view', 'access', 'sell', 'void', 'discount', 'returns'],
        moreOptions: ['view-stat-cards'],
        additionalFeatures: []
      }
    ]
  }
];

// Action labels mapping
const actionLabels: Record<string, string> = {
  'view': 'View',
  'add': 'Add',
  'edit': 'Edit',
  'delete': 'Delete',
  'approve': 'Approve',
  'submit': 'Submit',
  'reject': 'Reject',
  'return-for-correction': 'Return for Correction',
  'access': 'Access',
  'sell': 'Sell',
  'void': 'Void',
  'discount': 'Discount',
  'returns': 'Returns',
  'import': 'Import'
};

// More options labels mapping
const moreOptionsLabels: Record<string, string> = {
  'view-stat-cards': 'View Stat Cards',
  'import-users': 'Import Users',
  'import-stores': 'Import Stores',
  'import-products': 'Import Products',
  'import-customers': 'Import Customers',
  'import-vendors': 'Import Vendors',
  'import-customer-deposits': 'Import Customer Deposits',
  'set-current': 'Set Current'
};

// Additional functionalities labels mapping
const additionalFeaturesLabels: Record<string, string> = {
  'manage-raw-materials': 'Manage Raw Materials',
  'manage-doses': 'Manage Doses',
  'import-products': 'Import Products'
};

// Export options
const exportOptions = [
  { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { id: 'pdf', label: 'PDF', icon: FileText }
];

interface UserRoleFormProps {
  role?: UserRole | null;
  onSubmit: (data: UserRoleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  availablePermissions?: Permission[];
}

const UserRoleForm: React.FC<UserRoleFormProps> = ({
  role,
  onSubmit,
  onCancel,
  isLoading = false,
  availablePermissions = []
}) => {
  const isEdit = !!role;
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedSubModule, setSelectedSubModule] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<UserRoleFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
      is_active: true
    }
  });

  // Initialize form with role data
  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
        is_active: role.is_active
      });
      setSelectedPermissions(new Set(role.permissions || []));
    }
  }, [role, reset]);

  // Sync selectedPermissions with form value
  useEffect(() => {
    setValue('permissions', Array.from(selectedPermissions));
  }, [selectedPermissions, setValue]);

  // Get current module
  const currentModule = useMemo(() => {
    return moduleStructures.find(m => m.id === selectedModule);
  }, [selectedModule]);

  // Get current sub-module
  const currentSubModule = useMemo(() => {
    if (!currentModule || !selectedSubModule) return null;
    return currentModule.subModules.find(sm => sm.id === selectedSubModule);
  }, [currentModule, selectedSubModule]);

  // Generate permission key from module, sub-module, action, and option
  const generatePermissionKey = (
    moduleId: string,
    subModuleId: string,
    type: 'action' | 'more-option' | 'export' | 'additional',
    value: string
  ): string => {
    return `${moduleId}.${subModuleId}.${type}.${value}`;
  };

  // Toggle permission selection
  const togglePermission = (permissionKey: string) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionKey)) {
        newSet.delete(permissionKey);
      } else {
        newSet.add(permissionKey);
      }
      return newSet;
    });
  };

  // Toggle all permissions for a sub-module
  const toggleSubModulePermissions = (moduleId: string, subModule: SubModule, select: boolean) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      
      // Toggle actions
      subModule.actions?.forEach(action => {
        const key = generatePermissionKey(moduleId, subModule.id, 'action', action);
        if (select) {
          newSet.add(key);
        } else {
          newSet.delete(key);
        }
      });
      
      // Toggle more options
      subModule.moreOptions?.forEach(option => {
        const key = generatePermissionKey(moduleId, subModule.id, 'more-option', option);
        if (select) {
          newSet.add(key);
        } else {
          newSet.delete(key);
        }
      });
      
      // Toggle export options
      exportOptions.forEach(exportOpt => {
        const key = generatePermissionKey(moduleId, subModule.id, 'export', exportOpt.id);
        if (select) {
          newSet.add(key);
        } else {
          newSet.delete(key);
        }
      });
      
      // Toggle additional features
      subModule.additionalFeatures?.forEach(feature => {
        const key = generatePermissionKey(moduleId, subModule.id, 'additional', feature);
        if (select) {
          newSet.add(key);
        } else {
          newSet.delete(key);
        }
      });
      
      return newSet;
    });
  };

  // Check if permission is selected
  const isPermissionSelected = (permissionKey: string): boolean => {
    return selectedPermissions.has(permissionKey);
  };

  // Check if all sub-module permissions are selected
  const isSubModuleFullySelected = (moduleId: string, subModule: SubModule): boolean => {
    const allPermissions: string[] = [];
    
    subModule.actions?.forEach(action => {
      allPermissions.push(generatePermissionKey(moduleId, subModule.id, 'action', action));
    });
    
    subModule.moreOptions?.forEach(option => {
      allPermissions.push(generatePermissionKey(moduleId, subModule.id, 'more-option', option));
    });
    
    exportOptions.forEach(exportOpt => {
      allPermissions.push(generatePermissionKey(moduleId, subModule.id, 'export', exportOpt.id));
    });
    
    subModule.additionalFeatures?.forEach(feature => {
      allPermissions.push(generatePermissionKey(moduleId, subModule.id, 'additional', feature));
    });
    
    return allPermissions.length > 0 && allPermissions.every(key => selectedPermissions.has(key));
  };

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchTerm) return moduleStructures;
    
    const term = searchTerm.toLowerCase();
    return moduleStructures
      .map(module => ({
        ...module,
        subModules: module.subModules.filter(subModule =>
          module.label.toLowerCase().includes(term) ||
          subModule.label.toLowerCase().includes(term)
        )
      }))
      .filter(module => module.subModules.length > 0);
  }, [searchTerm]);

  const handleFormSubmit = (data: UserRoleFormData) => {
    onSubmit({
      ...data,
      permissions: Array.from(selectedPermissions)
    });
  };

  const selectedCount = selectedPermissions.size;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role Name <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('name')}
            placeholder="Enter role name (e.g., Sales Manager, Inventory Clerk)"
            error={errors.name?.message}
            disabled={isEdit && role?.is_system_role}
          />
          {isEdit && role?.is_system_role && (
            <p className="text-xs text-gray-500 mt-1">System roles cannot be renamed</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            {...register('description')}
            placeholder="Enter role description..."
            rows={3}
            error={errors.description?.message}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            {...register('is_active')}
            type="checkbox"
            id="is_active"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active Role
          </label>
        </div>
      </div>

      {/* Permissions Selection - Column Based */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{selectedCount} permission{selectedCount !== 1 ? 's' : ''} selected</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search modules or sub-modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Column Based Permission Selector */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 gap-0 h-[500px]">
            {/* Column 1: Modules */}
            <div className="border-r border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-3 bg-blue-600 text-white font-semibold text-sm sticky top-0 z-10">
                Modules
              </div>
              <div className="divide-y divide-gray-200">
                {filteredModules.map((module) => {
                  const ModuleIcon = module.icon;
                  const isSelected = selectedModule === module.id;
                  return (
                    <div
                      key={module.id}
                      onClick={() => {
                        setSelectedModule(module.id);
                        setSelectedSubModule(null);
                      }}
                      className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <ModuleIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">{module.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Sub Modules */}
            <div className="border-r border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-3 bg-blue-600 text-white font-semibold text-sm sticky top-0 z-10">
                Sub Modules
              </div>
              {currentModule ? (
                <div className="divide-y divide-gray-200">
                  {currentModule.subModules.map((subModule) => {
                    const isSelected = selectedSubModule === subModule.id;
                    const isFullySelected = isSubModuleFullySelected(currentModule.id, subModule);
                    return (
                      <div
                        key={subModule.id}
                        onClick={() => setSelectedSubModule(subModule.id)}
                        className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{subModule.label}</span>
                          {isFullySelected && (
                            <CheckSquare className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubModulePermissions(currentModule.id, subModule, !isFullySelected);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                        >
                          {isFullySelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Select a module
                </div>
              )}
            </div>

            {/* Column 3: Actions */}
            <div className="border-r border-gray-200 bg-white overflow-y-auto">
              <div className="p-3 bg-green-600 text-white font-semibold text-sm sticky top-0 z-10">
                Actions
              </div>
              {currentSubModule ? (
                <div className="divide-y divide-gray-200">
                  {currentSubModule.actions?.map((action) => {
                    const permissionKey = generatePermissionKey(
                      currentModule!.id,
                      currentSubModule.id,
                      'action',
                      action
                    );
                    const isSelected = isPermissionSelected(permissionKey);
                    const ActionIcon = action === 'view' ? Eye :
                                      action === 'add' ? Plus :
                                      action === 'edit' ? Edit :
                                      action === 'delete' ? Trash2 :
                                      action === 'approve' ? CheckCircle2 :
                                      action === 'submit' ? Send :
                                      action === 'reject' ? XCircle :
                                      action === 'return-for-correction' ? RotateCcw :
                                      Shield;
                    
                    return (
                      <div
                        key={action}
                        onClick={() => togglePermission(permissionKey)}
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                          <ActionIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-900">{actionLabels[action] || action}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Select a sub-module
                </div>
              )}
            </div>

            {/* Column 4: More Options */}
            <div className="border-r border-gray-200 bg-white overflow-y-auto">
              <div className="p-3 bg-purple-600 text-white font-semibold text-sm sticky top-0 z-10">
                More Options
              </div>
              {currentSubModule ? (
                <div className="divide-y divide-gray-200">
                  {currentSubModule.moreOptions?.map((option) => {
                    const permissionKey = generatePermissionKey(
                      currentModule!.id,
                      currentSubModule.id,
                      'more-option',
                      option
                    );
                    const isSelected = isPermissionSelected(permissionKey);
                    const OptionIcon = option.includes('import') ? Upload :
                                      option.includes('stat') ? BarChart3 :
                                      option.includes('set-current') ? Settings :
                                      Settings;
                    
                    return (
                      <div
                        key={option}
                        onClick={() => togglePermission(permissionKey)}
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                          <OptionIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-900">{moreOptionsLabels[option] || option}</span>
                        </div>
                      </div>
                    );
                  })}
                  {(!currentSubModule.moreOptions || currentSubModule.moreOptions.length === 0) && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No options available
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Select a sub-module
                </div>
              )}
            </div>

            {/* Column 5: Export */}
            <div className="border-r border-gray-200 bg-white overflow-y-auto">
              <div className="p-3 bg-orange-600 text-white font-semibold text-sm sticky top-0 z-10">
                Export
              </div>
              {currentSubModule ? (
                <div className="divide-y divide-gray-200">
                  {exportOptions.map((exportOpt) => {
                    const permissionKey = generatePermissionKey(
                      currentModule!.id,
                      currentSubModule.id,
                      'export',
                      exportOpt.id
                    );
                    const isSelected = isPermissionSelected(permissionKey);
                    const ExportIcon = exportOpt.icon;
                    
                    return (
                      <div
                        key={exportOpt.id}
                        onClick={() => togglePermission(permissionKey)}
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                          <ExportIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-900">{exportOpt.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Select a sub-module
                </div>
              )}
            </div>

            {/* Column 6: Additional Functionalities */}
            <div className="bg-white overflow-y-auto">
              <div className="p-3 bg-indigo-600 text-white font-semibold text-sm sticky top-0 z-10">
                Additional
              </div>
              {currentSubModule ? (
                <div className="divide-y divide-gray-200">
                  {currentSubModule.additionalFeatures?.map((feature) => {
                    const permissionKey = generatePermissionKey(
                      currentModule!.id,
                      currentSubModule.id,
                      'additional',
                      feature
                    );
                    const isSelected = isPermissionSelected(permissionKey);
                    const FeatureIcon = feature.includes('raw-materials') ? Package :
                                      feature.includes('doses') ? Pill :
                                      feature.includes('import') ? Upload :
                                      Package;
                    
                    return (
                      <div
                        key={feature}
                        onClick={() => togglePermission(permissionKey)}
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                          <FeatureIcon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-900">
                            {additionalFeaturesLabels[feature] || feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {(!currentSubModule.additionalFeatures || currentSubModule.additionalFeatures.length === 0) && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No additional features
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Select a sub-module
                </div>
              )}
            </div>
          </div>
        </div>

        {errors.permissions && (
          <p className="text-sm text-red-600 mt-1">{errors.permissions.message}</p>
        )}

        {selectedCount === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> No permissions selected. Users with this role will have no access.
            </p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || selectedCount === 0}
          className="flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>{isEdit ? 'Update Role' : 'Create Role'}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default UserRoleForm;
