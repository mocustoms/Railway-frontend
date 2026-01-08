import { UserRole, Permission, PermissionCategory } from '../types';
import { Shield, Users, Store, Package, ShoppingCart, FileText, Settings, DollarSign, BarChart3, Building2 } from 'lucide-react';

// Permission Categories and Permissions
export const permissionCategories: PermissionCategory[] = [
  {
    name: 'users',
    label: 'User Management',
    permissions: [
      { key: 'users.create', label: 'Create Users', description: 'Create new user accounts', category: 'users', module: 'User Management' },
      { key: 'users.read', label: 'View Users', description: 'View user list and details', category: 'users', module: 'User Management' },
      { key: 'users.update', label: 'Update Users', description: 'Edit user information', category: 'users', module: 'User Management' },
      { key: 'users.delete', label: 'Delete Users', description: 'Delete user accounts', category: 'users', module: 'User Management' },
      { key: 'users.approve', label: 'Approve Users', description: 'Approve pending user requests', category: 'users', module: 'User Management' },
      { key: 'users.export', label: 'Export Users', description: 'Export user data to Excel/PDF', category: 'users', module: 'User Management' }
    ]
  },
  {
    name: 'roles',
    label: 'Role Management',
    permissions: [
      { key: 'roles.create', label: 'Create Roles', description: 'Create new custom roles', category: 'roles', module: 'Role Management' },
      { key: 'roles.read', label: 'View Roles', description: 'View role list and details', category: 'roles', module: 'Role Management' },
      { key: 'roles.update', label: 'Update Roles', description: 'Edit role permissions', category: 'roles', module: 'Role Management' },
      { key: 'roles.delete', label: 'Delete Roles', description: 'Delete custom roles', category: 'roles', module: 'Role Management' },
      { key: 'roles.export', label: 'Export Roles', description: 'Export role data', category: 'roles', module: 'Role Management' }
    ]
  },
  {
    name: 'stores',
    label: 'Store Management',
    permissions: [
      { key: 'stores.create', label: 'Create Stores', description: 'Create new store locations', category: 'stores', module: 'Store Management' },
      { key: 'stores.read', label: 'View Stores', description: 'View store list and details', category: 'stores', module: 'Store Management' },
      { key: 'stores.update', label: 'Update Stores', description: 'Edit store information', category: 'stores', module: 'Store Management' },
      { key: 'stores.delete', label: 'Delete Stores', description: 'Delete store locations', category: 'stores', module: 'Store Management' },
      { key: 'stores.export', label: 'Export Stores', description: 'Export store data', category: 'stores', module: 'Store Management' }
    ]
  },
  {
    name: 'products',
    label: 'Product Management',
    permissions: [
      { key: 'products.create', label: 'Create Products', description: 'Add new products to catalog', category: 'products', module: 'Product Management' },
      { key: 'products.read', label: 'View Products', description: 'View product list and details', category: 'products', module: 'Product Management' },
      { key: 'products.update', label: 'Update Products', description: 'Edit product information', category: 'products', module: 'Product Management' },
      { key: 'products.delete', label: 'Delete Products', description: 'Delete products from catalog', category: 'products', module: 'Product Management' },
      { key: 'products.export', label: 'Export Products', description: 'Export product data', category: 'products', module: 'Product Management' }
    ]
  },
  {
    name: 'inventory',
    label: 'Inventory Management',
    permissions: [
      { key: 'inventory.create', label: 'Create Inventory', description: 'Create inventory records', category: 'inventory', module: 'Inventory Management' },
      { key: 'inventory.read', label: 'View Inventory', description: 'View inventory levels and details', category: 'inventory', module: 'Inventory Management' },
      { key: 'inventory.update', label: 'Update Inventory', description: 'Adjust inventory levels', category: 'inventory', module: 'Inventory Management' },
      { key: 'inventory.delete', label: 'Delete Inventory', description: 'Delete inventory records', category: 'inventory', module: 'Inventory Management' },
      { key: 'inventory.export', label: 'Export Inventory', description: 'Export inventory data', category: 'inventory', module: 'Inventory Management' }
    ]
  },
  {
    name: 'sales',
    label: 'Sales Management',
    permissions: [
      { key: 'sales.create', label: 'Create Sales', description: 'Create sales orders and invoices', category: 'sales', module: 'Sales Management' },
      { key: 'sales.read', label: 'View Sales', description: 'View sales transactions', category: 'sales', module: 'Sales Management' },
      { key: 'sales.update', label: 'Update Sales', description: 'Edit sales orders and invoices', category: 'sales', module: 'Sales Management' },
      { key: 'sales.delete', label: 'Delete Sales', description: 'Delete sales records', category: 'sales', module: 'Sales Management' },
      { key: 'sales.approve', label: 'Approve Sales', description: 'Approve sales orders', category: 'sales', module: 'Sales Management' },
      { key: 'sales.export', label: 'Export Sales', description: 'Export sales data', category: 'sales', module: 'Sales Management' }
    ]
  },
  {
    name: 'purchases',
    label: 'Purchase Management',
    permissions: [
      { key: 'purchases.create', label: 'Create Purchases', description: 'Create purchase orders', category: 'purchases', module: 'Purchase Management' },
      { key: 'purchases.read', label: 'View Purchases', description: 'View purchase transactions', category: 'purchases', module: 'Purchase Management' },
      { key: 'purchases.update', label: 'Update Purchases', description: 'Edit purchase orders', category: 'purchases', module: 'Purchase Management' },
      { key: 'purchases.delete', label: 'Delete Purchases', description: 'Delete purchase records', category: 'purchases', module: 'Purchase Management' },
      { key: 'purchases.approve', label: 'Approve Purchases', description: 'Approve purchase orders', category: 'purchases', module: 'Purchase Management' },
      { key: 'purchases.export', label: 'Export Purchases', description: 'Export purchase data', category: 'purchases', module: 'Purchase Management' }
    ]
  },
  {
    name: 'customers',
    label: 'Customer Management',
    permissions: [
      { key: 'customers.create', label: 'Create Customers', description: 'Add new customers', category: 'customers', module: 'Customer Management' },
      { key: 'customers.read', label: 'View Customers', description: 'View customer list and details', category: 'customers', module: 'Customer Management' },
      { key: 'customers.update', label: 'Update Customers', description: 'Edit customer information', category: 'customers', module: 'Customer Management' },
      { key: 'customers.delete', label: 'Delete Customers', description: 'Delete customer records', category: 'customers', module: 'Customer Management' },
      { key: 'customers.export', label: 'Export Customers', description: 'Export customer data', category: 'customers', module: 'Customer Management' }
    ]
  },
  {
    name: 'vendors',
    label: 'Vendor Management',
    permissions: [
      { key: 'vendors.create', label: 'Create Vendors', description: 'Add new vendors', category: 'vendors', module: 'Vendor Management' },
      { key: 'vendors.read', label: 'View Vendors', description: 'View vendor list and details', category: 'vendors', module: 'Vendor Management' },
      { key: 'vendors.update', label: 'Update Vendors', description: 'Edit vendor information', category: 'vendors', module: 'Vendor Management' },
      { key: 'vendors.delete', label: 'Delete Vendors', description: 'Delete vendor records', category: 'vendors', module: 'Vendor Management' },
      { key: 'vendors.export', label: 'Export Vendors', description: 'Export vendor data', category: 'vendors', module: 'Vendor Management' }
    ]
  },
  {
    name: 'reports',
    label: 'Reports & Analytics',
    permissions: [
      { key: 'reports.sales', label: 'Sales Reports', description: 'View sales reports and analytics', category: 'reports', module: 'Reports' },
      { key: 'reports.inventory', label: 'Inventory Reports', description: 'View inventory reports', category: 'reports', module: 'Reports' },
      { key: 'reports.financial', label: 'Financial Reports', description: 'View financial reports', category: 'reports', module: 'Reports' },
      { key: 'reports.custom', label: 'Custom Reports', description: 'Create and view custom reports', category: 'reports', module: 'Reports' },
      { key: 'reports.export', label: 'Export Reports', description: 'Export reports to various formats', category: 'reports', module: 'Reports' }
    ]
  },
  {
    name: 'settings',
    label: 'System Settings',
    permissions: [
      { key: 'settings.company', label: 'Company Settings', description: 'Manage company information', category: 'settings', module: 'Settings' },
      { key: 'settings.accounts', label: 'Chart of Accounts', description: 'Manage chart of accounts', category: 'settings', module: 'Settings' },
      { key: 'settings.taxes', label: 'Tax Settings', description: 'Manage tax codes and rates', category: 'settings', module: 'Settings' },
      { key: 'settings.currencies', label: 'Currency Settings', description: 'Manage currencies and exchange rates', category: 'settings', module: 'Settings' },
      { key: 'settings.general', label: 'General Settings', description: 'Manage general system settings', category: 'settings', module: 'Settings' }
    ]
  },
  {
    name: 'pos',
    label: 'Point of Sale',
    permissions: [
      { key: 'pos.access', label: 'Access POS', description: 'Access point of sale system', category: 'pos', module: 'POS' },
      { key: 'pos.sell', label: 'Process Sales', description: 'Process sales transactions', category: 'pos', module: 'POS' },
      { key: 'pos.void', label: 'Void Transactions', description: 'Void or cancel transactions', category: 'pos', module: 'POS' },
      { key: 'pos.discount', label: 'Apply Discounts', description: 'Apply discounts to sales', category: 'pos', module: 'POS' },
      { key: 'pos.returns', label: 'Process Returns', description: 'Process product returns', category: 'pos', module: 'POS' }
    ]
  }
];

// Helper function to get all permissions as flat array
export const getAllPermissions = (): Permission[] => {
  return permissionCategories.flatMap(category => category.permissions);
};

// Helper function to get permissions by category
export const getPermissionsByCategory = (categoryName: string): Permission[] => {
  const category = permissionCategories.find(cat => cat.name === categoryName);
  return category ? category.permissions : [];
};

// Helper function to get category icon
export const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, any> = {
    users: Users,
    roles: Shield,
    stores: Store,
    products: Package,
    inventory: Package,
    sales: ShoppingCart,
    purchases: ShoppingCart,
    customers: Users,
    vendors: Building2,
    reports: BarChart3,
    settings: Settings,
    pos: DollarSign
  };
  return iconMap[categoryName] || Settings;
};

// User Role Module Configuration
export const userRoleModuleConfig = {
  // Module metadata
  moduleId: 'user-role-management',
  title: 'User Role Management',
  description: 'Create and manage custom user roles with specific permissions',
  
  // Status configuration
  statusConfig: {
    active: {
      label: 'Active',
      color: 'green',
      icon: 'CheckCircle'
    },
    inactive: {
      label: 'Inactive',
      color: 'red',
      icon: 'XCircle'
    }
  },
  
  // Table columns configuration
  tableColumns: [
    {
      key: 'name',
      label: 'Role Name',
      sortable: true,
      width: '200px',
      defaultVisible: true
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      width: '250px',
      defaultVisible: true
    },
    {
      key: 'permissions',
      label: 'Permissions',
      sortable: false,
      width: '200px',
      defaultVisible: true
    },
    {
      key: 'user_count',
      label: 'Users',
      sortable: true,
      width: '100px',
      defaultVisible: true
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      width: '100px',
      defaultVisible: true
    },
    {
      key: 'is_system_role',
      label: 'Type',
      sortable: true,
      width: '120px',
      defaultVisible: true
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      width: '150px',
      defaultVisible: false
    }
  ],
  
  // Filter options
  filterOptions: [
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'true', label: 'Active Only' },
        { value: 'false', label: 'Inactive Only' }
      ]
    },
    {
      key: 'is_system_role',
      label: 'Type',
      type: 'select',
      options: [
        { value: '', label: 'All Types' },
        { value: 'true', label: 'System Roles' },
        { value: 'false', label: 'Custom Roles' }
      ]
    }
  ],
  
  // Permissions
  permissions: {
    create: ['admin'],
    read: ['admin', 'manager'],
    update: ['admin'],
    delete: ['admin'],
    export: ['admin', 'manager']
  }
};

// Helper functions
export const formatRolePermissions = (role: UserRole): string => {
  if (!role.permissions || role.permissions.length === 0) {
    return 'No permissions';
  }
  if (role.permissions.length <= 3) {
    return role.permissions.length.toString();
  }
  return `${role.permissions.length} permissions`;
};

export const getRoleTypeLabel = (isSystemRole: boolean): string => {
  return isSystemRole ? 'System Role' : 'Custom Role';
};

export const getRoleTypeColor = (isSystemRole: boolean): string => {
  return isSystemRole ? 'purple' : 'blue';
};

export default userRoleModuleConfig;
