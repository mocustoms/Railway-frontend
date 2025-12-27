import { User, UserFilters, UserSortConfig } from '../types';

// User Management Module Configuration
export const userManagementConfig = {
  // Module metadata
  moduleId: 'user-management',
  title: 'User Management',
  description: 'Manage system users, roles, permissions, and store assignments',
  
  // Status configuration
  statusConfig: {
    pending: {
      label: 'Pending Approval',
      color: 'yellow',
      icon: 'Clock'
    },
    approved: {
      label: 'Approved',
      color: 'green',
      icon: 'CheckCircle'
    },
    rejected: {
      label: 'Rejected',
      color: 'red',
      icon: 'XCircle'
    }
  },
  
  // Role configuration
  roleConfig: {
    admin: {
      label: 'Administrator',
      color: 'purple',
      icon: 'Shield',
      description: 'Full system access'
    },
    manager: {
      label: 'Manager',
      color: 'blue',
      icon: 'Users',
      description: 'Store management access'
    },
    cashier: {
      label: 'Cashier',
      color: 'green',
      icon: 'CreditCard',
      description: 'Point of sale access'
    }
  },
  
  // Store role configuration
  storeRoleConfig: {
    manager: {
      label: 'Store Manager',
      color: 'blue',
      icon: 'Users',
      description: 'Manage store operations'
    },
    cashier: {
      label: 'Cashier',
      color: 'green',
      icon: 'CreditCard',
      description: 'Process transactions'
    },
    viewer: {
      label: 'Viewer',
      color: 'gray',
      icon: 'Eye',
      description: 'View-only access'
    }
  },
  
  // Table columns configuration
  tableColumns: [
    {
      key: 'full_name',
      label: 'Full Name',
      sortable: true,
      width: '200px',
      defaultVisible: true
    },
    {
      key: 'username',
      label: 'Username',
      sortable: true,
      width: '150px',
      defaultVisible: true
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: '200px',
      defaultVisible: true
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      width: '120px',
      defaultVisible: true
    },
    {
      key: 'approval_status',
      label: 'Status',
      sortable: true,
      width: '140px',
      defaultVisible: true
    },
    {
      key: 'is_active',
      label: 'Active',
      sortable: true,
      width: '80px',
      defaultVisible: true
    },
    {
      key: 'assignedStores',
      label: 'Stores',
      sortable: false,
      width: '150px',
      defaultVisible: true
    },
    {
      key: 'last_login',
      label: 'Last Login',
      sortable: true,
      width: '150px',
      defaultVisible: false
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false,
      width: '130px',
      defaultVisible: false
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      width: '150px',
      defaultVisible: false
    }
  ],
  
  // Sort options
  sortOptions: [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'approval_status', label: 'Approval Status' },
    { key: 'is_active', label: 'Active Status' },
    { key: 'last_login', label: 'Last Login' },
    { key: 'createdAt', label: 'Created Date' }
  ],
  
  // Filter options
  filterOptions: [
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: '', label: 'All Roles' },
        { value: 'admin', label: 'Administrator' },
        { value: 'manager', label: 'Manager' },
        { value: 'cashier', label: 'Cashier' }
      ]
    },
    {
      key: 'approval_status',
      label: 'Approval Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending Approval' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    },
    {
      key: 'is_active',
      label: 'Active Status',
      type: 'select',
      options: [
        { value: '', label: 'All Users' },
        { value: 'true', label: 'Active Only' },
        { value: 'false', label: 'Inactive Only' }
      ]
    }
  ],
  
  // Form fields configuration
  formFields: {
    basic: [
      {
        name: 'first_name',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'Enter first name'
      },
      {
        name: 'last_name',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Enter last name'
      },
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Enter username'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'Enter email address'
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Enter password'
      },
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        required: true,
        options: [
          { value: 'cashier', label: 'Cashier' },
          { value: 'manager', label: 'Manager' },
          { value: 'admin', label: 'Administrator' }
        ]
      }
    ],
    additional: [
      {
        name: 'phone',
        label: 'Phone',
        type: 'text',
        required: false,
        placeholder: 'Enter phone number'
      },
      {
        name: 'address',
        label: 'Address',
        type: 'textarea',
        required: false,
        placeholder: 'Enter address'
      }
    ],
    status: [
      {
        name: 'is_active',
        label: 'Active',
        type: 'checkbox',
        required: false
      },
      {
        name: 'approval_status',
        label: 'Approval Status',
        type: 'select',
        required: false,
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' }
        ]
      }
    ]
  },
  
  // Validation rules
  validationRules: {
    first_name: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    last_name: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    username: {
      required: true,
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_]+$/
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      required: true,
      minLength: 6,
      maxLength: 100
    },
    phone: {
      required: false,
      pattern: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  
  // Export configuration
  exportConfig: {
    formats: ['excel', 'pdf'],
    columns: [
      { key: 'full_name', label: 'Full Name', visible: true },
      { key: 'username', label: 'Username', visible: true },
      { key: 'email', label: 'Email', visible: true },
      { key: 'role', label: 'Role', visible: true },
      { key: 'approval_status', label: 'Status', visible: true },
      { key: 'is_active', label: 'Active', visible: true },
      { key: 'phone', label: 'Phone', visible: true },
      { key: 'last_login', label: 'Last Login', visible: true },
      { key: 'createdAt', label: 'Created Date', visible: true }
    ]
  },
  
  // Permissions
  permissions: {
    create: ['admin'],
    read: ['admin', 'manager'],
    update: ['admin'],
    delete: ['admin'],
    approve: ['admin'],
    manageStores: ['admin']
  }
};

// Helper functions
export const getUserStatusInfo = (status: string) => {
  return userManagementConfig.statusConfig[status as keyof typeof userManagementConfig.statusConfig] || {
    label: status,
    color: 'gray',
    icon: 'Circle'
  };
};

export const getUserRoleInfo = (role: string) => {
  return userManagementConfig.roleConfig[role as keyof typeof userManagementConfig.roleConfig] || {
    label: role,
    color: 'gray',
    icon: 'User'
  };
};

export const getStoreRoleInfo = (role: string) => {
  return userManagementConfig.storeRoleConfig[role as keyof typeof userManagementConfig.storeRoleConfig] || {
    label: role,
    color: 'gray',
    icon: 'Store'
  };
};

export const formatUserFullName = (user: User) => {
  return `${user.first_name} ${user.last_name}`.trim();
};

export const formatUserStores = (user: User) => {
  if (!user.assignedStores || user.assignedStores.length === 0) {
    return 'No stores assigned';
  }
  
  const storeNames = user.assignedStores
    .filter(assignment => assignment.is_active)
    .map(assignment => assignment.Store?.name || 'Unknown Store')
    .join(', ');
    
  return storeNames || 'No active stores';
};

export const getUserInitials = (user: User) => {
  const firstName = user.first_name?.charAt(0) || '';
  const lastName = user.last_name?.charAt(0) || '';
  return `${firstName}${lastName}`.toUpperCase();
};

export const canUserBeDeleted = (user: User, currentUser: User | null) => {
  // Cannot delete yourself
  if (currentUser && user.id === currentUser.id) {
    return false;
  }
  
  // Cannot delete the last admin user
  if (user.role === 'admin') {
    return false; // This should be checked on the backend
  }
  
  return true;
};

export const canUserBeDeactivated = (user: User, currentUser: User | null) => {
  // Cannot deactivate yourself
  if (currentUser && user.id === currentUser.id) {
    return false;
  }
  
  // Cannot deactivate the last admin user
  if (user.role === 'admin') {
    return false; // This should be checked on the backend
  }
  
  return true;
};

export default userManagementConfig;
