// User Management Types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'cashier';
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_date?: string;
  approved_by?: string;
  rejection_reason?: string;
  last_login?: string;
  phone?: string;
  address?: string;
  profile_picture?: string;
  companyId?: string | null; // UUID of the company (null for super-admin or before company registration)
  isSystemAdmin?: boolean; // Flag for system administrators
  createdAt: string;
  updatedAt: string;
  // Computed fields
  full_name?: string;
  assignedStores?: UserStoreAssignment[];
}

export interface UserStoreAssignment {
  id: string;
  user_id: string;
  store_id: string;
  role: 'manager' | 'cashier' | 'viewer';
  is_active: boolean;
  assigned_by: string;
  assigned_at: string;
  // Store details
  Store?: {
    id: string;
    name: string;
    store_type: string;
    location: string;
    phone?: string;
    email?: string;
  };
}

export interface UserFormData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'cashier';
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  phone?: string;
  address?: string;
  store_assignments: SimpleStoreAssignment[];
}

export interface SimpleStoreAssignment {
  store_id: string;
  role: 'manager' | 'cashier' | 'viewer';
  is_active: boolean;
}

export interface UserFilters {
  search: string;
  role: string;
  approval_status: string;
  is_active: string;
}

export interface UserSortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  adminUsers: number;
  managerUsers: number;
  cashierUsers: number;
  recentLogins: number;
  usersWithStores: number;
}

// User Role Management Types
export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // Array of permission keys
  is_active: boolean;
  is_system_role: boolean; // System roles cannot be deleted
  user_count?: number; // Number of users assigned to this role
  created_by?: string;
  updated_by?: string;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  updater?: User;
}

export interface UserRoleFormData {
  name: string;
  description?: string;
  permissions: string[];
  is_active: boolean;
}

export interface UserRoleFilters {
  search: string;
  is_active: string;
  is_system_role: string;
}

export interface UserRoleSortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface UserRoleStats {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  systemRoles: number;
  customRoles: number;
  rolesWithUsers: number;
}

export interface Permission {
  key: string;
  label: string;
  description?: string;
  category: string;
  module?: string;
}

export interface PermissionCategory {
  name: string;
  label: string;
  permissions: Permission[];
}

// Store Management Types
export interface Store {
  id: string;
  name: string;
  store_type: 'pharmacy' | 'retail_shop' | 'restaurant' | 'barber_shop' | 'supermarket' | 'clothing_store' | 'electronics_store' | 'hardware_store' | 'jewelry_store' | 'bookstore' | 'other';
  location: string;
  phone: string;
  email: string;
  address: string;
  description?: string;
  is_active: boolean;
  
  // Currency relationship
  default_currency_id?: string;
  defaultCurrency?: Currency;
  
  // Price Category relationship
  default_price_category_id?: string;
  defaultPriceCategory?: PriceCategory;
  
  // GPS Coordinates
  latitude?: number;
  longitude?: number;
  
  // Store Capabilities
  is_manufacturing: boolean;
  can_receive_po: boolean;
  can_issue_to_store: boolean;
  can_receive_from_store: boolean;
  can_sale_products: boolean;
  is_storage_facility: boolean;
  has_temperature_control: boolean;
  temperature_min?: number;
  temperature_max?: number;
  settings?: any;
  
  // Audit fields
  created_by?: string;
  updated_by?: string;
  createdAt?: string;
  updatedAt?: string;
  creator?: User;
  updater?: User;
}

export interface StoreStats {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  manufacturingStores: number;
  storageFacilities: number;
  lastUpdate: string;
}

export interface StoreFilters {
  search?: string;
  storeType?: string;
  status?: 'all' | 'active' | 'inactive';
  hasManufacturing?: boolean;
  hasStorage?: boolean;
  hasTemperatureControl?: boolean;
}

export interface StoreSortConfig {
  field: keyof Store | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface StoreFormData {
  name: string;
  store_type: Store['store_type'];
  location: string;
  phone: string;
  email: string;
  address: string;
  description?: string;
  default_currency_id?: string;
  default_price_category_id?: string;
  latitude?: number;
  longitude?: number;
  is_manufacturing: boolean;
  can_receive_po: boolean;
  can_issue_to_store: boolean;
  can_receive_from_store: boolean;
  can_sale_products: boolean;
  is_storage_facility: boolean;
  has_temperature_control: boolean;
  temperature_min?: number;
  temperature_max?: number;
  settings?: any;
}

export interface StoreType {
  value: string;
  label: string;
  icon: string;
  description: string;
}

// Minimal Product interface for inventory management (Product Catalog removed)
export interface Product {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  tax_code_id?: string;
  purchases_tax_id?: string;
  cogs_account_id?: string;
  income_account_id?: string;
  asset_account_id?: string;
  is_active: boolean;
  color?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  // Related data fields
  tax_code_name?: string;
  purchases_tax_name?: string;
  cogs_account_name?: string;
  income_account_name?: string;
  asset_account_name?: string;
  created_by_name?: string;
  updated_by_name?: string;
  // Related objects (for form dropdowns)
  taxCode?: { id: string; name: string; rate: number };
  purchasesTax?: { id: string; name: string; rate: number };
  cogsAccount?: { id: string; code: string; name: string };
  incomeAccount?: { id: string; code: string; name: string };
  assetAccount?: { id: string; code: string; name: string };
}

export interface ProductPharmaceuticalInfo {
  id: string;
  product_id: string;
  max_dose?: number;
  frequency?: number;
  duration?: number;
  adjustments?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPharmaceuticalInfoFormData {
  max_dose?: number;
  frequency?: number;
  duration?: number;
  adjustments?: string;
}

export interface ProductCategoryFormData {
  code?: string; // Optional - auto-generated by backend
  name: string;
  description?: string;
  tax_code_id?: string;
  purchases_tax_id?: string;
  cogs_account_id?: string;
  income_account_id?: string;
  asset_account_id?: string;
  is_active: boolean;
  color?: string;
}

export interface ProductCategoryStats {
  total: number;
  active: number;
  inactive: number;
  lastUpdate: string;
}

export interface ProductCategoryFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export interface ProductCategorySortConfig {
  field: keyof ProductCategory | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface PaginatedProductCategoryResponse {
  productCategories: ProductCategory[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  };
}

// Related entities for form dropdowns - using existing TaxCode interface below
export interface Account {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface ProductBrandName {
  id: string;
  code: string;
  name: string;
  description?: string;
  logo?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  created_by_name?: string;
  updated_by_name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductBrandNameFormData {
  code: string;
  name: string;
  description?: string;
  logo?: File | null;
  is_active: boolean;
}

export interface ProductBrandNameStats {
  totalBrandNames: number;
  activeBrandNames: number;
  inactiveBrandNames: number;
  lastUpdate: string;
}

export interface ProductBrandNameFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface ProductBrandNameSortConfig {
  column: keyof ProductBrandName | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface PaginatedProductBrandNameResponse {
  data: ProductBrandName[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ProductManufacturer {
  id: string;
  code: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  country?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  updated_by_name?: string;
  createdByUser?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updatedByUser?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface ProductManufacturerStats {
  totalManufacturers: number;
  activeManufacturers: number;
  inactiveManufacturers: number;
  lastUpdate: string;
}

export interface ProductManufacturerFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  country?: string;
}

export interface ProductManufacturerSortConfig {
  column: keyof ProductManufacturer | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface ProductManufacturerFormData {
  code: string;
  name: string;
  description?: string;
  logo?: File;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  country?: string;
  is_active: boolean;
}

export interface ProductModel {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface ProductColor {
  id: string;
  name: string;
  code: string;
  hex_code: string;
  description?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  created_by_name?: string;
  updated_by_name?: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}

export interface ProductColorStats {
  totalProductColors: number;
  activeProductColors: number;
  inactiveProductColors: number;
  lastUpdate: string;
}

export interface ProductColorFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface ProductColorSortConfig {
  column: keyof ProductColor | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface ProductColorFormData {
  name: string;
  code: string;
  hex_code: string;
  description?: string;
  is_active: boolean;
}

export interface Packaging {
  id: string;
  code: string;
  name: string;
  pieces: number;
  status: 'active' | 'inactive';
  createdBy?: string;
  updatedBy?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Related data
  created_by_name?: string;
  updated_by_name?: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}

export interface PackagingStats {
  totalPackaging: number;
  activePackaging: number;
  inactivePackaging: number;
  lastUpdate: string;
}

export interface PackagingFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface PackagingSortConfig {
  column: keyof Packaging | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface PackagingFormData {
  code: string;
  name: string;
  pieces: number;
  status: 'active' | 'inactive';
}

export interface ProductStoreLocation {
  id: number;
  productId: number;
  storeId: number;
  quantity: number;
  product: Product;
  store: Store;
}

// Store Location Management (Physical locations within stores)
export interface StoreLocation {
  id: string;
  store_id: string;
  location_code: string;
  location_name: string;
  location_capacity?: number;
  packaging_type: string[];
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  store_name?: string;
  store_location?: string;
  created_by_name?: string;
  updated_by_name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreLocationFormData {
  store_id: string;
  location_code: string;
  location_name: string;
  location_capacity?: number;
  packaging_type: string[];
  is_active: boolean;
}

export interface StoreLocationStats {
  totalLocations: number;
  activeLocations: number;
  inactiveLocations: number;
  lastUpdate: string;
}

export interface StoreLocationFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  store_id?: string;
}

export interface StoreLocationSortConfig {
  column: keyof StoreLocation | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

// Inventory Management Types
export interface AdjustmentReason {
  id: string;
  code: string;
  name: string;
  description?: string;
  adjustmentType: 'add' | 'deduct';
  trackingAccountId: string;
  correspondingAccountId?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  createdByUser?: User;
  updatedByUser?: User;
  trackingAccount?: Account;
  correspondingAccount?: Account;
}

export interface AdjustmentReasonStats {
  total: number;
  active: number;
  inactive: number;
  addType: number;
  deductType: number;
}

export interface AdjustmentReasonFilters {
  search?: string;
  adjustmentType?: 'add' | 'deduct';
  isActive?: boolean;
  trackingAccountId?: string;
}

export interface AdjustmentReasonSortConfig {
  field: 'name' | 'code' | 'adjustmentType' | 'isActive' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'trackingAccount';
  direction: 'asc' | 'desc';
}

// Return Reasons Types
export interface ReturnReason {
  id: string;
  code: string;
  name: string;
  description?: string;
  returnType: 'full_refund' | 'partial_refund' | 'exchange' | 'store_credit';
  requiresApproval: boolean;
  maxReturnDays?: number;
  refundAccountId?: string;
  inventoryAccountId?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  createdByUser?: User;
  updatedByUser?: User;
  createdByUserReturnReason?: User;
  updatedByUserReturnReason?: User;
  refundAccount?: Account;
  inventoryAccount?: Account;
}

export interface ReturnReasonStats {
  total: number;
  active: number;
  inactive: number;
  requiresApproval: number;
  fullRefund: number;
  partialRefund: number;
  exchange: number;
  storeCredit: number;
}

export interface ReturnReasonFilters {
  search?: string;
  returnType?: 'full_refund' | 'partial_refund' | 'exchange' | 'store_credit';
  isActive?: boolean;
  requiresApproval?: boolean;
  refundAccountId?: string;
  inventoryAccountId?: string;
}

export interface ReturnReasonSortConfig {
  field: 'name' | 'code' | 'returnType' | 'isActive' | 'requiresApproval' | 'maxReturnDays' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'refundAccount' | 'inventoryAccount';
  direction: 'asc' | 'desc';
}

// Financial Management Types
export interface Account {
  id: string;
  name: string;
  code: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  description?: string;
  accountTypeId?: string;
  parentId?: string;
  status: 'active' | 'inactive';
  nature?: 'DEBIT' | 'CREDIT';
  isAccountType?: boolean;
  accountCount?: number;
  createdAt?: string;
  updatedAt?: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  updater?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  parentAccount?: Account;
  children?: Account[];
}

export interface TrialBalance {
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountType {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  nature: 'DEBIT' | 'CREDIT';
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  updater?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

export interface FinancialYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  isClosed: boolean;
  createdBy: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
  creator: User;
  closer?: User;
}

export interface OpeningBalance {
  id: string;
  accountId: string;
  accountTypeId?: string;
  amount: number;
  originalAmount?: number;
  type: 'debit' | 'credit';
  nature?: 'DEBIT' | 'CREDIT';
  date: string;
  description?: string;
  currencyId?: string;
  exchangeRateId?: string;
  exchangeRate?: number;
  financialYearId?: string;
  equivalentAmount?: number;
  transactionTypeId: string;
  referenceNumber: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  account: Account;
  accountType?: AccountType;
  currency?: Currency;
  exchangeRateRecord?: ExchangeRate;
  financialYear?: FinancialYear;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}

// Currency Management Types
export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  country?: string;
  flag?: string;
  is_default: boolean;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}

export interface ExchangeRate {
  id: string;
  from_currency_id: string;
  to_currency_id: string;
  rate: number;
  effective_date: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  fromCurrency?: Currency;
  toCurrency?: Currency;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}

export interface ExchangeRateStats {
  totalRates: number;
  activeRates: number;
  expiredRates: number;
  lastUpdate: string;
}

export interface ExchangeRateFilters {
  search?: string;
  fromCurrency?: string;
  toCurrency?: string;
  status?: 'all' | 'active' | 'inactive';
  dateFrom?: string;
  dateTo?: string;
}

export interface ExchangeRateSortConfig {
  field: keyof ExchangeRate;
  direction: 'asc' | 'desc';
}

export interface ExchangeRateFormData {
  from_currency_id: string;
  to_currency_id: string;
  rate: number;
  effective_date: string;
  is_active: boolean;
}

export interface ExchangeRateHistory {
  id: string;
  rate: number;
  effective_date: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  creator: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  stores?: Store[];
  csrfToken?: string;
  requiresCompanyRegistration?: boolean;
  requiresInitialization?: boolean;
  company?: {
    id: string;
    name: string;
  };
  autoInitialized?: {
    account_types: boolean;
    accounts: boolean;
    result?: any;
  };
}

export interface AuthContextType {
  user: User | null;
  stores: Store[];
  currentStore: Store | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  setCurrentStore: (store: Store) => void;
  setUser?: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pagination?: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date';
  required?: boolean;
  readonly?: boolean;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  validation?: any;
}

// UI Types
export interface SidebarItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  children?: SidebarItem[];
  permission?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Module Configuration Types
export interface ModuleConfig {
  name: string;
  description: string;
  icon: string;
  path: string;
  permissions: {
    create: string;
    read: string;
    update: string;
    delete: string;
    approve: string;
    export: string;
  };
  tableColumns: Array<{
    key: string;
    label: string;
    sortable: boolean;
    defaultVisible?: boolean;
    width?: string;
  }>;
  filters: Array<{
    key: string;
    label: string;
    type: string;
    options?: Array<{ value: string; label: string }>;
    defaultValue?: string;
  }>;
  statusOptions: Array<{
    value: string;
    label: string;
    color: string;
  }>;
  priorityOptions: Array<{
    value: string;
    label: string;
    color: string;
  }>;
  formFields: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    width?: string;
    step?: string;
    min?: string;
    maxLength?: number;
    rows?: number;
    options?: Array<{ value: string; label: string }>;
  }>;
  itemFormFields: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    width?: string;
    step?: string;
    min?: string;
    maxLength?: number;
    disabled?: boolean;
    options?: Array<{ value: string; label: string }>;
  }>;
  workflow: {
    states: Array<{
      key: string;
      label: string;
      color: string;
      actions: string[];
      nextStates: string[];
    }>;
    transitions: Array<{
      from: string;
      to: string;
      action: string;
      label: string;
      icon: string;
    }>;
  };
  exportOptions: {
    excel: {
      enabled: boolean;
      filename: string;
      sheets: string[];
    };
    pdf: {
      enabled: boolean;
      filename: string;
      orientation: string;
      format: string;
    };
  };
  validation: {
    rules: any;
    itemRules: any;
  };
  notifications: {
    onCreate: any;
    onUpdate: any;
    onDelete: any;
    onSubmit: any;
    onApprove: any;
    onReject: any;
    onFulfill: any;
    onCancel: any;
  };
  analytics: {
    enabled: boolean;
    metrics: Array<{
      key: string;
      label: string;
      type: string;
      color: string;
    }>;
    charts: Array<{
      key: string;
      label: string;
      type: string;
      dataKey: string;
    }>;
  };
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status?: 'active' | 'warning' | 'error' | 'pending';
  features: string[];
  permissions?: string[];
  apiEndpoints?: {
    list: string;
    create: string;
    update: string;
    delete: string;
    view: string;
    import?: string;
    export?: string;
  };
  tableColumns?: {
    key: string;
    label: string;
    sortable: boolean;
    width: string;
  }[];
  formFields?: {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date';
    required?: boolean;
    readonly?: boolean;
    options?: { value: string | number; label: string }[];
    placeholder?: string;
    validation?: any;
  }[];
  searchFields?: string[];
  sortOptions?: { key: string; label: string }[];
  filters?: {
    key?: string;
    name?: string;
    label: string;
    type: 'select' | 'text' | 'date';
    placeholder?: string;
    options?: { value: string; label: string }[];
  }[];
  exportOptions?: {
    excel?: boolean;
    pdf?: boolean;
    csv?: boolean;
  };
  importConfig?: {
    templateFields: {
      name: string;
      label: string;
      required: boolean;
    }[];
    validationRules: {
      [key: string]: {
        required?: boolean;
        pattern?: RegExp;
      };
    };
  };
  exportConfig?: {
    formats: string[];
    columns: {
      key: string;
      label: string;
      visible: boolean;
    }[];
  };
  breadcrumbs?: { label: string; path: string }[];
}

// Company Management Types
export interface Company {
  id: string; // UUID
  name: string;
  code: string;
  address: string;
  phone: string;
  fax?: string;
  email: string;
  website?: string;
  tin?: string;
  vrn?: string;
  businessRegistrationNumber?: string;
  businessType?: string;
  industry?: string;
  country?: string;
  region?: string;
  timezone?: string;
  defaultCurrencyId?: string;
  logo?: string;
  description?: string;
  costingMethod?: string; // UUID reference to CostingMethod
  efdSettings?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  defaultCurrency?: Currency;
  costingMethodDetails?: CostingMethod;
}

export interface CostingMethod {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Sales Agent Types
export interface SalesAgent {
  id: string;
  agentNumber: string;
  fullName: string;
  photo?: string;
  status: 'active' | 'inactive';
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  created_by_name?: string;
  updated_by_name?: string;
}

export interface SalesAgentFormData {
  agentNumber: string;
  fullName: string;
  photo?: File | string | null;
  status: 'active' | 'inactive';
}

export interface SalesAgentFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export interface SalesAgentSortConfig {
  key: keyof SalesAgent | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface SalesAgentStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  lastUpdate: string;
}

// Tax Code Management Types
export interface TaxCode {
  id: string;
  code: string;
  name: string;
  rate: number | string; // Can be number or string from database
  indicator?: string;
  efd_department_code?: string;
  sales_tax_account_id?: string; // Changed from number to string (UUID)
  purchases_tax_account_id?: string; // Changed from number to string (UUID)
  is_active: boolean;
  is_wht: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  salesTaxAccount?: Account;
  purchasesTaxAccount?: Account;
}

export interface TaxCodeStats {
  totalTaxCodes: number;
  activeTaxCodes: number;
  inactiveTaxCodes: number;
  averageRate: number | string; // Can be number or string from database
  lastUpdate: string;
}

export interface TaxCodeFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  rateRange?: {
    min?: number;
    max?: number;
  };
}

export interface TaxCodeSortConfig {
  column: keyof TaxCode | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface TaxCodeFormData {
  code?: string; // Optional - auto-generated by backend
  name: string;
  rate: number | string; // Can be number or string from database
  indicator?: string;
  efd_department_code?: string;
  sales_tax_account_id?: string; // Changed from number to string (UUID)
  purchases_tax_account_id?: string; // Changed from number to string (UUID)
  is_active: boolean;
  is_wht: boolean;
} 

// Payment Type Management
export interface PaymentType {
  id: string;
  code: string;
  name: string;
  payment_method_id: string;
  order_of_display: number;
  default_account_id?: string;
  used_in_sales: boolean;
  used_in_debtor_payments: boolean;
  used_in_credit_payments: boolean;
  used_in_customer_deposits: boolean;
  used_in_refunds: boolean;
  display_in_cashier_report: boolean;
  used_in_banking: boolean;
  is_active: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  payment_method?: {
    id: string;
    code: string;
    name: string;
  };
  default_account?: {
    id: string;
    code: string;
    name: string;
  };
  created_by_name?: string;
  updated_by_name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentTypeStats {
  totalPaymentTypes: number;
  activePaymentTypes: number;
  inactivePaymentTypes: number;
  lastUpdate?: string;
}

export interface PaymentTypeFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  paymentMethodId?: string;
}

export interface PaymentTypeSortConfig {
  column: keyof PaymentType | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface PaymentTypeFormData {
  code?: string; // Optional - auto-generated by backend
  name: string;
  payment_method_id: string;
  order_of_display: number;
  default_account_id?: string;
  used_in_sales: boolean;
  used_in_debtor_payments: boolean;
  used_in_credit_payments: boolean;
  used_in_customer_deposits: boolean;
  used_in_refunds: boolean;
  display_in_cashier_report: boolean;
  used_in_banking: boolean;
  is_active: boolean;
}

// Expense Type Management
export interface ExpenseType {
  id: string;
  code: string;
  name: string;
  description?: string;
  account_id: string;
  order_of_display: number;
  is_active: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  updated_by_name?: string;

  // Related data
  account?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ExpenseTypeStats {
  totalExpenseTypes: number;
  activeExpenseTypes: number;
  inactiveExpenseTypes: number;
  lastUpdate?: string;
}

export interface ExpenseTypeFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  accountId?: string;
}

export interface ExpenseTypeSortConfig {
  column: keyof ExpenseType | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface ExpenseTypeFormData {
  code?: string; // Optional - auto-generated by backend
  name: string;
  description?: string;
  account_id: string;
  order_of_display: number;
  is_active: boolean;
}

// Payment Method Management
export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  deductsFromCustomerAccount: boolean;
  requiresBankDetails: boolean;
  uploadDocument: boolean;
  is_active: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Related data
  creator?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  updater?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export interface PaymentMethodStats {
  totalPaymentMethods: number;
  activePaymentMethods: number;
  inactivePaymentMethods: number;
  lastUpdate?: string;
}

export interface PaymentMethodFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface PaymentMethodSortConfig {
  column: keyof PaymentMethod | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface PaymentMethodFormData {
  code?: string; // Optional - auto-generated by backend
  name: string;
  deductsFromCustomerAccount: boolean;
  requiresBankDetails: boolean;
  uploadDocument: boolean;
  is_active: boolean;
}

// Bank Detail Management
export interface BankDetail {
  id: string;
  code: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  accountId: string;
  is_active: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Related data
  creator?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  updater?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  account?: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
}

export interface BankDetailStats {
  totalBankDetails: number;
  activeBankDetails: number;
  inactiveBankDetails: number;
  lastUpdate?: string;
}

export interface BankDetailFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface BankDetailSortConfig {
  column: keyof BankDetail | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface BankDetailFormData {
  code: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  accountId: string;
  is_active: boolean;
}

// Price Category Management
export interface PriceCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  price_change_type: 'increase' | 'decrease';
  percentage_change: number;
  scheduled_type: 'not_scheduled' | 'one_time' | 'recurring';
  recurring_period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  scheduled_date?: string;
  
  // Enhanced recurring scheduling fields
  recurring_day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  recurring_date?: number; // 1-31 for monthly/yearly
  recurring_month?: 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  created_by_name?: string;
  updated_by_name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PriceCategoryFormData {
  code: string;
  name: string;
  description?: string;
  price_change_type: 'increase' | 'decrease';
  percentage_change: number;
  scheduled_type: 'not_scheduled' | 'one_time' | 'recurring';
  recurring_period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  scheduled_date?: string;
  
  // Enhanced recurring scheduling fields
  recurring_day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  recurring_date?: number; // 1-31 for monthly/yearly
  recurring_month?: 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  
  is_active: boolean;
}

export interface PriceCategoryFilters {
  search?: string;
  status?: string;
  changeType?: string;
  scheduledType?: string;
}

export interface PaginatedPriceCategoryResponse {
  priceCategories: PriceCategory[];
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  };
} 

// Product Catalog Management Types
export interface Product {
  id: string;
  product_type: 'resale' | 'raw_materials' | 'manufactured' | 'services' | 'pharmaceuticals';
  code: string;
  barcode?: string;
  name: string;
  part_number?: string;
  image?: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  manufacturer_id?: string;
  model_id?: string;
  color_id?: string;
  store_location_id?: string;
  unit_id?: string;
  cogs_account_id?: string;
  income_account_id?: string;
  asset_account_id?: string;
  average_cost?: number;
  selling_price?: number;
  currentQuantity?: number; // Add currentQuantity field for store-specific stock
  purchases_tax_id?: string;
  sales_tax_id?: string;
  default_packaging_id?: string;
  default_quantity?: number;
  price_tax_inclusive: boolean;
  expiry_notification_days?: number;
  track_serial_number: boolean;
  is_active: boolean;
  min_quantity: number;
  max_quantity: number;
  reorder_point: number;
  
  // Pharmaceutical-specific fields
  max_dose?: string;
  frequency?: string;
  duration?: string;
  adjustments?: string;
  
  // Manufacturing fields
  manufacturing_process?: string;
  production_time?: number;
  
  // Audit fields
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Related data (populated from API)
  category?: ProductCategory;
  brand?: ProductBrandName;
  manufacturer?: ProductManufacturer;
  model?: ProductModel;
  color?: ProductColor;
  storeLocation?: StoreLocation;
  unit?: Packaging;
  cogsAccount?: Account;
  incomeAccount?: Account;
  assetAccount?: Account;
  purchasesTax?: TaxCode;
  salesTax?: TaxCode;
  defaultPackaging?: Packaging;
  priceCategories?: ProductPriceCategory[];
  createdByUser?: User;
  updatedByUser?: User;
  
  // Manufacturing and pharmaceutical info
  manufacturingInfo?: {
    manufacturing_process?: string;
    production_time_hours?: number;
  };
  pharmaceuticalInfo?: {
    max_dose?: string;
    frequency?: string;
    duration?: string;
    adjustments?: string;
  };
  
  // Store associations
  stores?: Store[];
  assignedStores?: Store[];
  
  // Computed fields
  category_name?: string;
  brand_name?: string;
  manufacturer_name?: string;
  model_name?: string;
  color_name?: string;
  store_location_name?: string;
  unit_name?: string;
  cogs_account_name?: string;
  income_account_name?: string;
  asset_account_name?: string;
  purchases_tax_name?: string;
  sales_tax_name?: string;
  default_packaging_name?: string;
  created_by_name?: string;
  updated_by_name?: string;
  
  // Store-specific fields
  store_balance?: number;
  
  // Related collections
  productStores?: ProductStore[];
  rawMaterials?: ProductRawMaterial[];
}

export interface ProductFormData {
  product_type: 'resale' | 'raw_materials' | 'manufactured' | 'services' | 'pharmaceuticals';
  code: string;
  barcode?: string;
  name: string;
  part_number?: string;
  image?: File | null;
  description?: string;
  category_id?: string | null;
  brand_id?: string | null;
  manufacturer_id?: string | null;
  model_id?: string | null;
  color_id?: string | null;
  store_location_id?: string | null;
  unit_id?: string | null;
  cogs_account_id?: string | null;
  income_account_id?: string | null;
  asset_account_id?: string | null;
  average_cost?: number;
  selling_price?: number;
  purchases_tax_id?: string | null;
  sales_tax_id?: string | null;
  default_packaging_id?: string | null;
  default_quantity?: number;
  price_tax_inclusive: boolean;
  expiry_notification_days?: number;
  track_serial_number: boolean;
  is_active: boolean;
  min_quantity?: number;
  max_quantity?: number;
  reorder_point?: number;
  
  // Pharmaceutical fields
  max_dose?: string;
  frequency?: string;
  duration?: string;
  adjustments?: string;
  
  // Manufacturing fields
  manufacturing_process?: string;
  production_time?: number;
  
  // Store assignments
  store_ids: string[];
  
  // Price categories
  price_category_ids: string[];
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  productsByType: {
    resale: number;
    raw_materials: number;
    manufactured: number;
    services: number;
    pharmaceuticals: number;
  };
  lowStockProducts: number;
  expiringProducts: number;
  lastUpdate: string;
}

export interface ProductFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  product_type?: string;
  category_id?: string;
  brand_id?: string;
  manufacturer_id?: string;
  model_id?: string;
  color_id?: string;
  store_id?: string;
  unit_id?: string;
  lowStock?: boolean;
  expiring?: boolean;
  price_range?: {
    min?: number;
    max?: number;
  };
  cost_range?: {
    min?: number;
    max?: number;
  };
  stock_range?: {
    min?: number;
    max?: number;
  };
  created_date_range?: {
    from?: string;
    to?: string;
  };
  updated_date_range?: {
    from?: string;
    to?: string;
  };
  has_image?: boolean;
  track_serial_number?: boolean;
  price_tax_inclusive?: boolean;
}

export interface ProductSortConfig {
  column: keyof Product | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface PaginatedProductResponse {
  products: Product[];
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  };
}

// Raw Materials Management
export interface ProductRawMaterial {
  id: string;
  manufactured_product_id: string;
  raw_material_id: string;
  quantity_per_unit: number;
  unit: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  raw_material?: Product;
  manufactured_product?: Product;
  
  // Computed fields
  product_name?: string;
  product_code?: string;
  quantity?: number;
  unit_name?: string;
  cost?: number;
}

export interface ProductRawMaterialFormData {
  raw_material_id: string;
  quantity_per_unit: number;
  unit: string;
}

// Product Price Categories
export interface ProductPriceCategory {
  id: string;
  product_id: string;
  price_category_id: string;
  calculated_price: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Related data
  priceCategory?: PriceCategory;
  product?: Product;
  
  // Computed fields
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
}

// Product Store Assignment
export interface ProductStore {
  id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  reorder_point: number;
  average_cost: number;
  last_updated: string;
  assigned_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data
  store?: Store;
  product?: Product;
  
  // Computed fields
  store_name?: string;
} 

// Transaction Type interface
export interface TransactionType {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  creator?: User;
  updater?: User;
}

// Stock Adjustment Management Types
export interface StockAdjustment {
  id: string;
  reference_number: string;
  adjustment_date: string;
  store_id: string;
  store_name: string;
  adjustment_type: 'add' | 'deduct';
  reason_id: string;
  adjustment_reason_name: string;
  account_id: string;
  inventory_account_name?: string;
  corresponding_account_id?: string;
  inventory_corresponding_account_name?: string;
  document_type?: string;
  document_number?: string;
  currency_id?: string;
  currency_name?: string;
  currency_symbol?: string;
  exchange_rate?: number;
  system_default_currency_id?: string;
  exchange_rate_id?: string;
  equivalent_amount?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  total_items: number;
  total_value: number;
  notes?: string;
  created_by: string;
  created_by_name: string;
  updated_by?: string;
  updated_by_name?: string;
  submitted_by?: string;
  submitted_by_name?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  items?: StockAdjustmentItem[];
}

export interface StockAdjustmentItem {
  id: string;
  stock_adjustment_id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  current_quantity: number;
  new_quantity: number;
  difference: number;
  unit_cost: number;
  total_value: number;
  serial_numbers?: string[];
  expiry_dates?: string[];
  notes?: string;
  new_stock?: number;
  product?: {
    id: string;
    name: string;
    code: string;
    average_cost: number;
    current_stock?: number; // Add current_stock field
  };
}

export interface StockAdjustmentFormData {
  reference_number: string;
  adjustment_date: string;
  store_id: string;
  adjustment_type: 'add' | 'deduct';
  reason_id: string;
  inventory_account_id: string;
  inventory_corresponding_account_id?: string;
  document_type?: string;
  document_number?: string;
  notes?: string;
  currency_id?: string;
  exchange_rate?: number;
  system_default_currency_id?: string;
  exchange_rate_id?: string;
  items: StockAdjustmentItemFormData[];
}

export interface StockAdjustmentItemFormData {
  product_id: string;
  current_stock: number;
  adjusted_stock: number;
  user_unit_cost: number;
  serial_numbers?: string[];
  expiry_date?: string;
  batch_number?: string;
  notes?: string;
  new_stock?: number;
}

export interface StockAdjustmentStats {
  total: number;
  stockIn: number;
  stockOut: number;
  totalValue: number;
  lastUpdate: string;
}

// Physical Inventory Types
export interface PhysicalInventory {
  id: string;
  reference_number: string;
  inventory_date: string;
  store_id: string;
  store_name?: string;
  total_items: number;
  total_value: number;
  currency_id: string;
  currency_symbol?: string;
  exchange_rate: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'returned_for_correction';
  notes?: string;
  inventory_in_reason_id?: string;
  inventory_out_reason_id?: string;
  inventory_in_account_id?: string;
  inventory_in_corresponding_account_id?: string;
  inventory_out_account_id?: string;
  inventory_out_corresponding_account_id?: string;
  created_by: string;
  created_by_name?: string;
  updated_by?: string;
  updated_by_name?: string;
  submitted_by?: string;
  submitted_by_name?: string;
  approved_by?: string;
  approved_by_name?: string;
  created_at: string;
  updated_at?: string;
  submitted_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  return_reason?: string;
  returned_by?: string;
  returned_by_name?: string;
  returned_at?: string;
  variance_accepted_by?: string;
  variance_accepted_by_name?: string;
  variance_accepted_at?: string;
  total_delta_value?: number;
  positive_delta_value?: number;
  negative_delta_value?: number;
  variance_notes?: string;
  approval_notes?: string;
  inventory_account_id?: string;
  gain_account_id?: string;
  loss_account_id?: string;
  items?: PhysicalInventoryItem[];
  // Related data
  store?: { id: string; name: string };
  inventoryInReason?: { id: string; name: string; adjustmentType: 'add' | 'deduct' };
  inventoryOutReason?: { id: string; name: string; adjustmentType: 'add' | 'deduct' };
  inventoryInAccount?: { id: string; name: string; code: string };
  inventoryInCorrespondingAccount?: { id: string; name: string; code: string };
  inventoryOutAccount?: { id: string; name: string; code: string };
  inventoryOutCorrespondingAccount?: { id: string; name: string; code: string };
  inventoryAccount?: { id: string; name: string; code: string };
  gainAccount?: { id: string; name: string; code: string };
  lossAccount?: { id: string; name: string; code: string };
  currency?: { id: string; name: string; code: string; symbol: string };
  creator?: { id: string; name: string };
  updater?: { id: string; name: string };
  submitter?: { id: string; name: string };
  approver?: { id: string; name: string };
  returner?: { id: string; name: string };
  varianceAcceptor?: { id: string; name: string };
}

export interface PhysicalInventoryItem {
  id: string;
  physical_inventory_id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  current_quantity: number;
  counted_quantity: number;
  adjustment_in_quantity: number;
  adjustment_out_quantity: number;
  adjustment_in_reason_id?: string;
  adjustment_out_reason_id?: string;
  adjustment_in_reason_name?: string;
  adjustment_out_reason_name?: string;
  unit_cost: number;
  unit_average_cost: number;
  new_stock: number;
  total_value: number;
  delta_quantity: number;
  delta_value: number;
  exchange_rate: number;
  equivalent_amount: number;
  expiry_date?: string;
  batch_number?: string;
  serial_numbers?: string[];
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Related data
  product?: { id: string; name: string; code: string; average_cost: number };
  adjustmentInReason?: { id: string; name: string; adjustmentType: 'add' | 'deduct' };
  adjustmentOutReason?: { id: string; name: string; adjustmentType: 'add' | 'deduct' };
}

export interface PhysicalInventoryFormData {
  store_id: string;
  inventory_date: string;
  currency_id: string;
  exchange_rate: number;
  inventory_in_reason_id: string;
  inventory_out_reason_id: string;
  inventory_in_account_id: string;
  inventory_in_corresponding_account_id: string;
  inventory_out_account_id: string;
  inventory_out_corresponding_account_id: string;
  notes?: string;
  status?: 'draft' | 'submitted';
  items: PhysicalInventoryItemFormData[];
}

export interface PhysicalInventoryItemFormData {
  product_id: string;
  current_quantity: number;
  counted_quantity: number;
  adjustment_in_reason_id?: string;
  adjustment_out_reason_id?: string;
  unit_cost: number;
  unit_average_cost?: number;
  new_stock?: number;
  total_value?: number;
  exchange_rate?: number;
  equivalent_amount?: number;
  expiry_date?: string;
  batch_number?: string;
  serial_numbers?: string[];
  notes?: string;
}

export interface PhysicalInventoryFilters {
  search: string;
  status: 'all' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'returned_for_correction';
  storeId: string;
  startDate: string;
  endDate: string;
}

export interface PhysicalInventorySortConfig {
  field: keyof PhysicalInventory | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface PhysicalInventoryStats {
  totalInventories: number;
  totalDraft: number;
  totalSubmitted: number;
  totalApproved: number;
  totalRejected: number;
}

export interface StockAdjustmentFilters {
  search: string;
  status: 'all' | 'draft' | 'submitted' | 'approved' | 'rejected';
  adjustmentType: 'all' | 'add' | 'deduct';
  storeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface StockAdjustmentSortConfig {
  field: keyof StockAdjustment | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface PaginatedStockAdjustmentResponse {
  stockAdjustments: StockAdjustment[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  };
}

// Store Request Types
export interface StoreRequest {
  id: string;
  reference_number: string;
  request_date: string;
  requested_by_store_id: string;
  requested_from_store_id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled' | 'partial_issued' | 'partially_received' | 'fully_received' | 'cancelled' | 'partial_issued_cancelled' | 'partially_received_cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  request_type: 'request' | 'issue';
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  notes?: string;
  rejection_reason?: string;
  total_items: number;
  total_value: number;
  currency_id?: string;
  exchange_rate: number;
  
  // Approval workflow fields
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  fulfilled_by?: string;
  fulfilled_at?: string;
  
  // Audit fields
  created_by: string;
  updated_by?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Associations
  requestingStore?: Store;
  issuingStore?: Store;
  currency?: Currency;
  storeRequestCurrency?: Currency;
  createdByUser?: User;
  submittedByUser?: User;
  approvedByUser?: User;
  rejectedByUser?: User;
  fulfilledByUser?: User;
  updatedByUser?: User;
  storeRequestItems?: StoreRequestItem[];
}

export interface StoreRequestItem {
  id: string;
  store_request_id: string;
  product_id: string;
  
  // Complete quantity tracking
  requested_quantity: number;
  approved_quantity: number;
  issued_quantity: number;
  received_quantity: number;
  fulfilled_quantity: number;
  remaining_quantity: number;
  remaining_receiving_quantity: number;
  
  // Cost tracking
  unit_cost: number;
  total_cost: number;
  currency_id?: string;
  exchange_rate: number;
  equivalent_amount: number;
  
  // Status tracking
  status: 'pending' | 'approved' | 'issued' | 'received' | 'fulfilled' | 'rejected' | 'partial_issued' | 'partially_received' | 'fully_received' | 'closed_partially_received';
  notes?: string;
  
  // Transaction type integration
  transaction_type_id?: string;
  
  // Audit fields
  created_by: string;
  updated_by?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Associations
  storeRequest?: StoreRequest;
  product?: Product;
  storeRequestProduct?: Product;
  currency?: Currency;
  storeRequestItemCurrency?: Currency;
  transactionType?: TransactionType;
  createdByUser?: User;
  updatedByUser?: User;
  itemTransactions?: StoreRequestItemTransaction[];
}

export interface StoreRequestItemTransaction {
  id: string;
  store_request_item_id: string;
  
  // Transaction details
  transaction_type: 'requested' | 'approved' | 'issued' | 'received' | 'fulfilled' | 'rejected';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  
  // User and timestamp
  performed_by: string;
  performed_at: string;
  
  // Additional info
  notes?: string;
  reason?: string;
  
  // Audit fields
  created_at: string;
  
  // Associations
  storeRequestItem?: StoreRequestItem;
  performedByUser?: User;
}

export interface StoreRequestFormData {
  reference_number?: string;
  request_date: string;
  requesting_store_id: string;
  requested_from_store_id: string;
  request_type: 'request' | 'issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_delivery_date?: string;
  notes?: string;
  currency_id?: string;
  exchange_rate?: number;
  items: StoreRequestItemFormData[];
}

export interface StoreRequestItemFormData {
  product_id: string;
  requested_quantity: number;
  approved_quantity?: number;
  issuing_quantity?: number;
  issued_quantity?: number;
  received_quantity?: number;
  remaining_quantity?: number;
  receiving_quantity?: number;
  unit_cost: number;
  currency_id?: string;
  exchange_rate?: number;
  equivalent_amount?: number;
  notes?: string;
}

export interface StoreRequestFilters {
  search: string;
  status: 'all' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled' | 'partial_issued' | 'cancelled' | 'partial_issued_cancelled' | 'partially_received' | 'partially_received_cancelled' | 'fully_received' | 'closed_partially_received';
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  requesting_store_id: string;
  issuing_store_id: string;
  date_from?: string;
  date_to?: string;
}

export interface StoreRequestSortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface StoreRequestStats {
  totalRequests: number;
  draftRequests: number;
  submittedRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  fulfilledRequests: number;
  partialIssuedRequests: number;
  partiallyReceivedRequests: number;
  fullyReceivedRequests: number;
  closedPartiallyReceivedRequests: number;
  cancelledRequests: number;
}

// Store Issue Types (aliases for Store Request types with request_type = 'issue')
export type StoreIssue = StoreRequest;
export type StoreIssueItem = StoreRequestItem;
export type StoreIssueItemTransaction = StoreRequestItemTransaction;
export type StoreIssueFormData = StoreRequestFormData;
export type StoreIssueItemFormData = StoreRequestItemFormData;
export type StoreIssueFilters = StoreRequestFilters;
export type StoreIssueSortConfig = StoreRequestSortConfig;
export type StoreIssueStats = StoreRequestStats;

// Store Receipt Types (aliases for Store Request types with request_type = 'request')
export type StoreReceipt = StoreRequest;
export type StoreReceiptItem = StoreRequestItem;
export type StoreReceiptItemTransaction = StoreRequestItemTransaction;
export type StoreReceiptFormData = StoreRequestFormData;
export type StoreReceiptItemFormData = StoreRequestItemFormData;
export type StoreReceiptFilters = StoreRequestFilters;
export type StoreReceiptSortConfig = StoreRequestSortConfig;
export type StoreReceiptStats = StoreRequestStats;

// Customer Deposit Management
export interface CustomerDeposit {
  id: string;
  depositReferenceNumber: string;
  customerId: string;
  paymentTypeId: string;
  chequeNumber?: string;
  bankDetailId?: string;
  branch?: string;
  currencyId: string;
  exchangeRate: number;
  exchangeRateId?: string;
  documentPath?: string;
  depositAmount: number;
  equivalentAmount?: number; // Calculated field: depositAmount * exchangeRate
  description?: string;
  liabilityAccountId: string;
  assetAccountId: string;
  transactionDate: string;
  is_active: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Related data
  customer?: {
    id: string;
    customer_id: string;
    full_name: string;
    account_balance: number;
    debt_balance: number;
    deposit_balance: number;
    loyalty_points: number;
  };
  paymentType?: {
    id: string;
    name: string;
    code: string;
    paymentMethod?: {
      name: string;
      requiresBankDetails: boolean;
      uploadDocument: boolean;
    };
  };
  bankDetail?: {
    id: string;
    bankName: string;
    branch: string;
    accountNumber: string;
  };
  currency?: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  };
  liabilityAccount?: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
  assetAccount?: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
  creator?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  updater?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export interface CustomerDepositStats {
  totalDeposits: number;
  activeDeposits: number;
  inactiveDeposits: number;
  totalDepositAmount: number;
  totalEquivalentAmount: number;
  lastUpdate?: string;
}

export interface CustomerDepositFilters {
  search?: string;
  customerId?: string;
  paymentTypeId?: string;
  currencyId?: string;
  bankDetailId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'all' | 'active' | 'inactive';
  minAmount?: number;
  maxAmount?: number;
}

export interface CustomerDepositSortConfig {
  column: keyof CustomerDeposit | 'created_at' | 'updated_at' | 'transaction_date';
  direction: 'asc' | 'desc';
}

export interface CustomerDepositFormData {
  customerId: string;
  paymentTypeId: string;
  chequeNumber?: string;
  bankDetailId?: string;
  branch?: string;
  currencyId: string;
  exchangeRate?: number;
  exchangeRateId?: string;
  documentPath?: string;
  document?: File; // For file upload
  depositAmount: number;
  equivalentAmount: number;
  description?: string;
  liabilityAccountId: string;
  assetAccountId: string;
  transactionDate: string;
}

export interface Customer {
  id: string;
  customer_id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  account_balance: number;
  debt_balance: number;
  deposit_balance: number;
  loyalty_points: number;
}

export interface Vendor {
  id: string;
  vendor_id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  address?: string;
  fax?: string;
  account_balance?: number;
  debt_balance?: number;
  deposit_balance?: number;
  default_payable_account_id?: string;
}

export interface PaymentType {
  id: string;
  name: string;
  code: string;
  paymentMethod?: {
    requiresBankDetails: boolean;
    uploadDocument: boolean;
  };
}

export interface BankDetail {
  id: string;
  bankName: string;
  branch: string;
  accountNumber: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
}

// Proforma Invoice Types
export interface ProformaInvoice {
  id: string;
  proformaRefNumber: string;
  proformaDate: string;
  storeId: string;
  storeName?: string;
  customerId: string;
  customerName?: string;
  customerCode?: string;
  customerAddress?: string;
  customerFax?: string;
  customerPhone?: string;
  customerEmail?: string;
  currencyId?: string;
  currencyName?: string;
  currencySymbol?: string;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  priceCategory?: PriceCategory;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountAfterDiscount?: number;
  totalWhtAmount?: number;
  amountAfterWht?: number;
  equivalentAmount?: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    isConverted?: boolean;
  validUntil?: string;
  notes?: string;
  termsConditions?: string;
  createdBy: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  sentBy?: string;
  sentByName?: string;
  sentAt?: string;
  acceptedBy?: string;
  acceptedByName?: string;
  acceptedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  items?: ProformaInvoiceItem[];
  store?: Store;
  customer?: Customer;
  currency?: Currency;
  systemDefaultCurrency?: Currency;
  exchangeRateRecord?: ExchangeRate;
  createdByUser?: User;
  updatedByUser?: User;
  sentByUser?: User;
  acceptedByUser?: User;
  rejectedByUser?: User;
}

export interface ProformaInvoiceItem {
  id: string;
  proformaInvoiceId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  salesTaxId?: string | null;
  salesTaxCode?: TaxCode;
  whtTaxId?: string | null;
  whtTaxCode?: TaxCode;
      whtAmount?: number;
      priceTaxInclusive?: boolean;
      currencyId?: string | null;
      currency?: Currency;
      exchangeRate?: number;
      equivalentAmount?: number;
      amountAfterDiscount?: number;
      amountAfterWht?: number;
      lineTotal: number;
      notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  product?: Product;
  createdByUser?: User;
  updatedByUser?: User;
}

export interface ProformaInvoiceFormData {
  proformaRefNumber: string;
  proformaDate: string;
  storeId: string;
  customerId: string;
  currencyId?: string;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  validUntil?: string;
  notes?: string;
  termsConditions?: string;
  items: ProformaInvoiceItemFormData[];
}

export interface ProformaInvoiceItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  salesTaxId?: string | null;
  whtTaxId?: string | null;
  whtAmount?: number;
  currencyId?: string | null;
  exchangeRate?: number;
  equivalentAmount?: number;
  lineTotal: number;
  notes?: string;
  price_tax_inclusive?: boolean;
}

export interface ProformaInvoiceStats {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  totalValue: number;
  thisMonth: number;
  lastMonth: number;
}

export interface ProformaInvoiceFilters {
  search?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  storeId?: string;
  customerId?: string;
  currencyId?: string;
  dateFrom?: string;
  dateTo?: string;
  converted?: 'true' | 'false';
}

export interface ProformaInvoiceSortConfig {
  field: 'proformaRefNumber' | 'proformaDate' | 'customerName' | 'storeName' | 'totalAmount' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'sentAt' | 'sentByName' | 'acceptedAt' | 'acceptedByName' | 'rejectedAt' | 'rejectedByName' | 'validUntil';
  direction: 'asc' | 'desc';
}

export interface PaginatedProformaInvoiceResponse {
  proformaInvoices: ProformaInvoice[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Sales Order Types
export interface SalesOrder {
  id: string;
  salesOrderRefNumber: string;
  salesOrderDate: string;
  storeId: string;
  storeName?: string;
  customerId: string;
  customerName?: string;
  customerCode?: string;
  customerAddress?: string;
  customerFax?: string;
  customerPhone?: string;
  customerEmail?: string;
  currencyId?: string;
  currencyName?: string;
  currencySymbol?: string;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  priceCategory?: PriceCategory;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountAfterDiscount?: number;
  totalWhtAmount?: number;
  amountAfterWht?: number;
  equivalentAmount?: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'delivered';
  isConverted?: boolean;
  validUntil?: string;
  deliveryDate?: string;
  shippingAddress?: string;
  notes?: string;
  termsConditions?: string;
  createdBy: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  sentBy?: string;
  sentByName?: string;
  sentAt?: string;
  acceptedBy?: string;
  acceptedByName?: string;
  acceptedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  fulfilledBy?: string;
  fulfilledByName?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: SalesOrderItem[];
  store?: Store;
  customer?: Customer;
  currency?: Currency;
  systemDefaultCurrency?: Currency;
  exchangeRateRecord?: ExchangeRate;
  createdByUser?: User;
  updatedByUser?: User;
  sentByUser?: User;
  acceptedByUser?: User;
  rejectedByUser?: User;
  fulfilledByUser?: User;
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  salesTaxId?: string | null;
  salesTaxCode?: TaxCode;
  whtTaxId?: string | null;
  whtTaxCode?: TaxCode;
  whtAmount?: number;
  priceTaxInclusive?: boolean;
  currencyId?: string | null;
  currency?: Currency;
  exchangeRate?: number;
  equivalentAmount?: number;
  amountAfterDiscount?: number;
  amountAfterWht?: number;
  lineTotal: number;
  notes?: string;
  serialNumbers?: string[];
  batchNumber?: string;
  expiryDate?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  product?: Product;
  createdByUser?: User;
  updatedByUser?: User;
}

export interface SalesOrderFormData {
  salesOrderRefNumber?: string;
  salesOrderDate: string;
  storeId: string;
  customerId: string;
  currencyId?: string;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  validUntil?: string;
  deliveryDate?: string;
  shippingAddress?: string;
  notes?: string;
  termsConditions?: string;
  items: SalesOrderItemFormData[];
}

export interface SalesOrderItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  salesTaxId?: string | null;
  whtTaxId?: string | null;
  whtAmount?: number;
  currencyId?: string | null;
  exchangeRate?: number;
  equivalentAmount?: number;
  amountAfterDiscount?: number;
  amountAfterWht?: number;
  lineTotal: number;
  notes?: string;
  price_tax_inclusive?: boolean;
  serialNumbers?: string[];
  batchNumber?: string;
  expiryDate?: string;
}

export interface SalesOrderStats {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  delivered: number;
  totalValue: number;
  thisMonth: number;
  lastMonth: number;
}

export interface SalesOrderFilters {
  search?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'delivered';
  storeId?: string;
  customerId?: string;
  currencyId?: string;
  dateFrom?: string;
  dateTo?: string;
  converted?: 'true' | 'false';
}

export interface SalesOrderSortConfig {
  field: 'salesOrderRefNumber' | 'salesOrderDate' | 'customerName' | 'storeName' | 'totalAmount' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'sentAt' | 'sentByName' | 'acceptedAt' | 'acceptedByName' | 'rejectedAt' | 'rejectedByName' | 'fulfilledAt' | 'fulfilledByName' | 'validUntil' | 'deliveryDate';
  direction: 'asc' | 'desc';
}

export interface PaginatedSalesOrderResponse {
  salesOrders: SalesOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Sales Invoice Types
export interface SalesInvoice {
  id: string;
  invoiceRefNumber: string;
  invoiceDate: string;
  dueDate?: string;
  storeId: string;
  storeName?: string;
  customerId: string;
  customerName?: string;
  customerCode?: string;
  customerAddress?: string;
  customerFax?: string;
  customerPhone?: string;
  customerEmail?: string;
  salesOrderId?: string;
  salesOrderRefNumber?: string;
  proformaInvoiceId?: string;
  proformaRefNumber?: string;
  salesAgentId?: string;
  salesAgentName?: string;
  salesAgentNumber?: string;
  discountAllowedAccountId?: string;
  discountAllowedAccount?: {
    id: string;
    code: string;
    name: string;
  };
  accountReceivableId?: string;
  accountReceivable?: {
    id: string;
    code: string;
    name: string;
  };
  currencyId?: string;
  currencyName?: string;
  currencySymbol?: string;
  exchangeRate?: number;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  priceCategory?: PriceCategory;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountAfterDiscount?: number;
  totalWhtAmount?: number;
  amountAfterWht?: number;
  equivalentAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  status: 'draft' | 'sent' | 'approved' | 'paid' | 'partial_paid' | 'overdue' | 'cancelled' | 'rejected';
  scheduledType?: 'not_scheduled' | 'one_time' | 'recurring';
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  scheduledDate?: string;
  recurringDayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  recurringDate?: number; // 1-31 for monthly/yearly
  recurringMonth?: 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  parentInvoiceId?: string; // Reference to parent scheduled invoice for auto-generated invoices
  notes?: string;
  termsConditions?: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  sentBy?: string;
  sentByName?: string;
  sentAt?: string;
  paidAt?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  items: SalesInvoiceItem[];
  itemPaidAmounts?: Record<string, number>; // Map of invoice item ID to total paid amount (as of now)
  store?: Store;
  customer?: Customer;
  salesOrder?: SalesOrder;
  proformaInvoice?: ProformaInvoice;
  currency?: Currency;
  systemDefaultCurrency?: Currency;
  exchangeRateRecord?: ExchangeRate;
  createdByUser?: User;
  updatedByUser?: User;
  sentByUser?: User;
  cancelledByUser?: User;
  rejectedByUser?: User;
  approvedByUser?: User;
}

export interface SalesInvoiceItem {
  id: string;
  salesInvoiceId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  salesTaxId?: string | null;
  salesTaxCode?: TaxCode;
  whtTaxId?: string | null;
  whtTaxCode?: TaxCode;
  whtAmount?: number;
  priceTaxInclusive?: boolean;
  currencyId?: string | null;
  currency?: Currency;
  exchangeRate?: number;
  equivalentAmount?: number;
  amountAfterDiscount?: number;
  amountAfterWht?: number;
  lineTotal: number;
  notes?: string;
  serialNumbers?: string[];
  batchNumber?: string;
  expiryDate?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  product?: Product;
  createdByUser?: User;
  updatedByUser?: User;
}

export interface SalesInvoiceFormData {
  invoiceRefNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  storeId: string;
  customerId: string;
  salesOrderId?: string;
  proformaInvoiceId?: string;
  salesAgentId?: string;
  discountAllowedAccountId?: string;
  accountReceivableId?: string;
  currencyId?: string;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  scheduledType?: 'not_scheduled' | 'one_time' | 'recurring';
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  scheduledDate?: string;
  recurringDayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  recurringDate?: number; // 1-31 for monthly/yearly
  recurringMonth?: 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  notes?: string;
  termsConditions?: string;
  items: SalesInvoiceItemFormData[];
}

export interface SalesInvoiceItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  salesTaxId?: string | null;
  whtTaxId?: string | null;
  whtAmount?: number;
  currencyId?: string | null;
  exchangeRate?: number;
  equivalentAmount?: number;
  amountAfterDiscount?: number;
  amountAfterWht?: number;
  lineTotal: number;
  notes?: string;
  price_tax_inclusive?: boolean;
  serialNumbers?: string[];
  batchNumber?: string;
  expiryDate?: string;
}

export interface SalesInvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  partialPaid: number;
  overdue: number;
  cancelled: number;
  totalValue: number;
  thisMonth: number;
  lastMonth: number;
}

export interface SalesInvoiceFilters {
  search?: string;
  status?: 'draft' | 'sent' | 'approved' | 'paid' | 'partial_paid' | 'overdue' | 'cancelled' | 'rejected';
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  storeId?: string;
  customerId?: string;
  currencyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SalesInvoiceSortConfig {
  field: 'invoiceRefNumber' | 'invoiceDate' | 'dueDate' | 'customerName' | 'storeName' | 'totalAmount' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'sentAt' | 'sentByName' | 'paidAt' | 'cancelledAt' | 'cancelledByName' | 'rejectedAt' | 'rejectedByName' | 'paidAmount' | 'balanceAmount';
  direction: 'asc' | 'desc';
}

export interface PaginatedSalesInvoiceResponse {
  salesInvoices: SalesInvoice[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Receipt Types
export interface Receipt {
  id: string;
  receiptReferenceNumber: string;
  salesInvoiceId: string;
  salesInvoiceRefNumber?: string;
  customerId: string;
  customerName?: string;
  customerCode?: string;
  salesAgentId?: string;
  salesAgentName?: string;
  paymentAmount: number;
  currencyId: string;
  currencyName?: string;
  currencySymbol?: string;
  exchangeRate: number;
  exchangeRateId?: string;
  systemDefaultCurrencyId: string;
  systemDefaultCurrencyName?: string;
  systemDefaultCurrencySymbol?: string;
  equivalentAmount: number;
  paymentTypeId?: string;
  paymentTypeName?: string;
  useCustomerDeposit: boolean;
  depositAmount: number;
  useLoyaltyPoints: boolean;
  loyaltyPointsAmount: number;
  loyaltyPointsValue: number;
  chequeNumber?: string;
  bankDetailId?: string;
  bankDetailName?: string;
  branch?: string;
  receivableAccountId: string;
  receivableAccountName?: string;
  receivableAccountCode?: string;
  assetAccountId?: string;
  assetAccountName?: string;
  assetAccountCode?: string;
  liabilityAccountId?: string;
  liabilityAccountName?: string;
  liabilityAccountCode?: string;
  transactionDate: string;
  financialYearId: string;
  financialYearName?: string;
  description?: string;
  status: 'active' | 'reversed' | 'cancelled';
  reversedAt?: string;
  reversedBy?: string;
  reversedByName?: string;
  reversalReason?: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: ReceiptItem[];
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  salesInvoiceId: string;
  salesInvoiceItemId: string;
  salesAgentId?: string;
  paymentAmount: number;
  currencyId: string;
  exchangeRate: number;
  equivalentAmount: number;
  itemTotal: number;
  itemRemaining: number;
  createdAt?: string;
  updatedAt?: string;
  product?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ReceiptStats {
  total: number;
  active: number;
  reversed: number;
  cancelled: number;
  totalAmount: number;
  thisMonth: number;
  lastMonth: number;
}

export interface ReceiptFilters {
  search?: string;
  status?: 'active' | 'reversed' | 'cancelled';
  customerId?: string;
  salesInvoiceId?: string;
  currencyId?: string;
  paymentTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReceiptSortConfig {
  field: 'receiptRefNumber' | 'transactionDate' | 'paymentAmount' | 'equivalentAmount' | 'customerName' | 'salesInvoiceRefNumber' | 'status' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface PaginatedReceiptResponse {
  receipts: Receipt[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Purchasing Order Types
export interface PurchasingOrder {
  id: string;
  purchasingOrderRefNumber: string;
  purchasingOrderDate: string;
  storeId: string;
  storeName?: string;
  vendorId: string;
  vendorName?: string;
  vendorCode?: string;
  vendorAddress?: string;
  vendorFax?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  currencyId?: string;
  currencyName?: string;
  currencySymbol?: string;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  priceCategory?: PriceCategory;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountAfterDiscount?: number;
  totalWhtAmount?: number;
  amountAfterWht?: number;
  equivalentAmount?: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'received';
  isConverted?: boolean;
  validUntil?: string;
  expectedDeliveryDate?: string;
  shippingAddress?: string;
  notes?: string;
  termsConditions?: string;
  createdBy: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  sentBy?: string;
  sentByName?: string;
  sentAt?: string;
  acceptedBy?: string;
  acceptedByName?: string;
  acceptedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  receivedBy?: string;
  receivedByName?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: PurchasingOrderItem[];
  store?: Store;
  vendor?: {
    id: string;
    vendor_id: string;
    full_name: string;
    address?: string;
    phone_number?: string;
    email?: string;
    fax?: string;
  };
  currency?: Currency;
  systemDefaultCurrency?: Currency;
  exchangeRateRecord?: ExchangeRate;
  createdByUser?: User;
  updatedByUser?: User;
  sentByUser?: User;
  acceptedByUser?: User;
  rejectedByUser?: User;
  receivedByUser?: User;
}

export interface PurchasingOrderItem {
  id: string;
  purchasingOrderId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  purchasesTaxId?: string | null;
  purchasesTaxCode?: TaxCode;
  whtTaxId?: string | null;
  whtTaxCode?: TaxCode;
  whtAmount?: number;
  priceTaxInclusive?: boolean;
  currencyId?: string | null;
  currency?: Currency;
  exchangeRate?: number;
  equivalentAmount?: number;
  amountAfterDiscount?: number;
  amountAfterWht?: number;
  lineTotal: number;
  notes?: string;
  serialNumbers?: string[];
  batchNumber?: string;
  expiryDate?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  product?: Product;
  createdByUser?: User;
  updatedByUser?: User;
}

export interface PurchasingOrderFormData {
  purchasingOrderRefNumber?: string;
  purchasingOrderDate: string;
  storeId: string;
  vendorId: string;
  currencyId?: string;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  validUntil?: string;
  expectedDeliveryDate?: string;
  shippingAddress?: string;
  notes?: string;
  termsConditions?: string;
  items: PurchasingOrderItemFormData[];
}

export interface PurchasingOrderItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  purchasesTaxId?: string | null;
  whtTaxId?: string | null;
  whtAmount?: number;
  currencyId?: string | null;
  exchangeRate?: number;
  equivalentAmount?: number;
  amountAfterDiscount?: number;
  amountAfterWht?: number;
  lineTotal: number;
  notes?: string;
  price_tax_inclusive?: boolean;
  serialNumbers?: string[];
  batchNumber?: string;
  expiryDate?: string;
}

export interface PurchasingOrderStats {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  received: number;
  totalValue: number;
  thisMonth: number;
  lastMonth: number;
}

export interface PurchasingOrderFilters {
  search?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'received';
  storeId?: string;
  vendorId?: string;
  currencyId?: string;
  dateFrom?: string;
  dateTo?: string;
  converted?: 'true' | 'false';
}

export interface PurchasingOrderSortConfig {
  field: 'purchasingOrderRefNumber' | 'purchasingOrderDate' | 'vendorName' | 'storeName' | 'totalAmount' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'sentAt' | 'sentByName' | 'acceptedAt' | 'acceptedByName' | 'rejectedAt' | 'rejectedByName' | 'receivedAt' | 'receivedByName' | 'validUntil' | 'expectedDeliveryDate';
  direction: 'asc' | 'desc';
}

export interface PaginatedPurchasingOrderResponse {
  purchasingOrders: PurchasingOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Purchase Invoice Types
export interface PurchaseInvoice {
  id: string;
  invoiceRefNumber: string;
  invoiceDate: string;
  dueDate?: string;
  storeId: string;
  storeName?: string;
  vendorId: string;
  vendorName?: string;
  vendorCode?: string;
  vendorAddress?: string;
  vendorFax?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  purchasingOrderId?: string;
  purchasingOrderRefNumber?: string;
  discountReceivedAccountId?: string;
  discountReceivedAccount?: {
    id: string;
    code: string;
    name: string;
  };
  accountPayableId?: string;
  accountPayable?: {
    id: string;
    code: string;
    name: string;
  };
  currencyId?: string;
  currencyName?: string;
  currencySymbol?: string;
  exchangeRate?: number;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  priceCategory?: PriceCategory;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountAfterDiscount?: number;
  totalWhtAmount?: number;
  amountAfterWht?: number;
  equivalentAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  status: 'draft' | 'sent' | 'approved' | 'paid' | 'partial_paid' | 'overdue' | 'cancelled' | 'rejected';
  scheduledType?: 'not_scheduled' | 'one_time' | 'recurring';
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  scheduledDate?: string;
  recurringDayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  recurringDate?: number; // 1-31 for monthly/yearly
  recurringMonth?: 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  parentInvoiceId?: string; // Reference to parent scheduled invoice for auto-generated invoices
  notes?: string;
  termsConditions?: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  sentBy?: string;
  sentByName?: string;
  sentAt?: string;
  paidAt?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  items: PurchaseInvoiceItem[];
  itemPaidAmounts?: Record<string, number>; // Map of invoice item ID to total paid amount (as of now)
  store?: Store;
  vendor?: Vendor;
  purchasingOrder?: PurchasingOrder;
  currency?: Currency;
  systemDefaultCurrency?: Currency;
  exchangeRateRecord?: ExchangeRate;
  createdByUser?: User;
  updatedByUser?: User;
  sentByUser?: User;
  cancelledByUser?: User;
  rejectedByUser?: User;
  approvedByUser?: User;
}

// Purchase Invoice Payment Types
export interface PurchaseInvoicePayment {
  id: string;
  paymentReferenceNumber: string;
  purchaseInvoiceId: string;
  purchaseInvoiceRefNumber?: string;
  vendorId: string;
  vendorName?: string;
  vendorCode?: string;
  paymentAmount: number;
  currencyId: string;
  currencyName?: string;
  currencySymbol?: string;
  exchangeRate: number;
  exchangeRateId?: string;
  systemDefaultCurrencyId: string;
  systemDefaultCurrencyName?: string;
  systemDefaultCurrencySymbol?: string;
  equivalentAmount: number;
  paymentTypeId?: string;
  paymentTypeName?: string;
  useVendorDeposit: boolean;
  depositAmount: number;
  chequeNumber?: string;
  bankDetailId?: string;
  bankDetailName?: string;
  branch?: string;
  payableAccountId: string;
  payableAccountName?: string;
  payableAccountCode?: string;
  assetAccountId?: string;
  assetAccountName?: string;
  assetAccountCode?: string;
  liabilityAccountId?: string;
  liabilityAccountName?: string;
  liabilityAccountCode?: string;
  transactionDate: string;
  financialYearId: string;
  financialYearName?: string;
  description?: string;
  status: 'active' | 'reversed' | 'cancelled';
  reversedAt?: string;
  reversedBy?: string;
  reversedByName?: string;
  reversalReason?: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: PurchaseInvoicePaymentItem[];
}

export interface PurchaseInvoicePaymentItem {
  id: string;
  paymentId: string;
  purchaseInvoiceId: string;
  purchaseInvoiceItemId: string;
  paymentAmount: number;
  currencyId: string;
  exchangeRate: number;
  equivalentAmount: number;
  itemTotal: number;
  itemRemaining: number;
  createdAt?: string;
  updatedAt?: string;
  product?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface PurchaseInvoicePaymentStats {
  total: number;
  active: number;
  reversed: number;
  cancelled: number;
  totalAmount: number;
  thisMonth: number;
  lastMonth: number;
}

export interface PurchaseInvoicePaymentFilters {
  search?: string;
  status?: 'active' | 'reversed' | 'cancelled';
  vendorId?: string;
  purchaseInvoiceId?: string;
  currencyId?: string;
  paymentTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PurchaseInvoicePaymentSortConfig {
  field: 'paymentRefNumber' | 'transactionDate' | 'paymentAmount' | 'equivalentAmount' | 'vendorName' | 'purchaseInvoiceRefNumber' | 'status' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface PaginatedPurchaseInvoicePaymentResponse {
  payments: PurchaseInvoicePayment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PurchaseInvoiceItem {
  id: string;
  purchaseInvoiceId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  purchasesTaxId?: string | null;
  purchasesTaxCode?: TaxCode;
  whtTaxId?: string | null;
  whtTaxCode?: TaxCode;
  whtAmount?: number;
  priceTaxInclusive?: boolean;
  currencyId?: string | null;
  currency?: Currency;
  exchangeRate?: number;
  equivalentAmount?: number;
  amountAfterDiscount?: number;
  amountAfterWht?: number;
  lineTotal: number;
  notes?: string;
  serialNumbers?: string[];
  batchNumber?: string;
  expiryDate?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  product?: Product;
  createdByUser?: User;
  updatedByUser?: User;
}

export interface PurchaseInvoiceFormData {
  invoiceRefNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  storeId: string;
  vendorId: string;
  purchasingOrderId?: string;
  discountReceivedAccountId?: string;
  accountPayableId?: string;
  currencyId?: string;
  exchangeRateValue?: number;
  systemDefaultCurrencyId?: string;
  exchangeRateId?: string;
  priceCategoryId?: string;
  scheduledType?: 'not_scheduled' | 'one_time' | 'recurring';
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  scheduledDate?: string;
  recurringDayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  recurringDate?: number; // 1-31 for monthly/yearly
  recurringMonth?: 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  notes?: string;
  termsConditions?: string;
  items: PurchaseInvoiceItemFormData[];
}

export interface PurchaseInvoiceItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  purchasesTaxId?: string | null;
  whtTaxId?: string | null;
  whtAmount?: number;
  currencyId?: string | null;
  exchangeRate?: number;
  equivalentAmount?: number;
  amountAfterDiscount?: number;
  amountAfterWht?: number;
  lineTotal: number;
  notes?: string;
  price_tax_inclusive?: boolean;
  serialNumbers?: string[];
  batchNumber?: string;
  expiryDate?: string;
}

export interface PurchaseInvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  partialPaid: number;
  overdue: number;
  cancelled: number;
  totalValue: number;
  thisMonth: number;
  lastMonth: number;
}

export interface PurchaseInvoiceFilters {
  search?: string;
  status?: 'draft' | 'sent' | 'approved' | 'paid' | 'partial_paid' | 'overdue' | 'cancelled' | 'rejected';
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  storeId?: string;
  vendorId?: string;
  currencyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PurchaseInvoiceSortConfig {
  field: 'invoiceRefNumber' | 'invoiceDate' | 'dueDate' | 'vendorName' | 'storeName' | 'totalAmount' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'sentAt' | 'sentByName' | 'paidAt' | 'cancelledAt' | 'cancelledByName' | 'rejectedAt' | 'rejectedByName' | 'paidAmount' | 'balanceAmount';
  direction: 'asc' | 'desc';
}

export interface PaginatedPurchaseInvoiceResponse {
  purchaseInvoices: PurchaseInvoice[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}