import { Package, Palette, Building2, Tag, MapPin, Calculator, FileText, Settings } from 'lucide-react';

// Product Catalog Module Configuration
export const productCatalogModuleConfig = {
  id: 'product-catalog',
  title: 'Product Catalog',
  description: 'Comprehensive product management system with inventory tracking, pricing, and manufacturing support',
  icon: Package,
  path: '/product-catalog',
  category: 'Products',
  priority: 'high' as const,
  status: 'active' as const,
  features: [
    'Product lifecycle management',
    'Multi-category support',
    'Inventory tracking',
    'Pricing management',
    'Manufacturing support',
    'Pharmaceutical features',
    'Serial number tracking',
    'Expiry date management',
    'Multi-store assignment',
    'Financial account integration'
  ],
  permissions: ['products:read', 'products:create', 'products:update', 'products:delete'],
  apiEndpoints: {
    list: '/api/products',
    create: '/api/products',
    update: '/api/products/:id',
    delete: '/api/products/:id',
    view: '/api/products/:id',
    import: '/api/products/import',
    export: '/api/products/export',
    nextCode: '/api/products/next-code',
    nextBarcode: '/api/products/next-barcode'
  },
  tableColumns: [
    { key: 'name', label: 'Product Name', sortable: true, width: '200px' },
    { key: 'code', label: 'Product Code', sortable: true, width: '120px' },
    { key: 'product_type', label: 'Product Type', sortable: true, width: '120px' },
    { key: 'barcode', label: 'Barcode', sortable: false, width: '120px' },
    { key: 'category_name', label: 'Category', sortable: true, width: '150px' },
    { key: 'brand_name', label: 'Brand', sortable: true, width: '120px' },
    { key: 'manufacturer_name', label: 'Manufacturer', sortable: true, width: '150px' },
    { key: 'model_name', label: 'Model', sortable: true, width: '120px' },
    { key: 'color_name', label: 'Color', sortable: true, width: '100px' },
    { key: 'unit_name', label: 'Unit', sortable: true, width: '80px' },
    { key: 'average_cost', label: 'Average Cost', sortable: true, width: '120px' },
    { key: 'selling_price', label: 'Selling Price', sortable: true, width: '120px' },
    { key: 'current_stock', label: 'Current Stock', sortable: true, width: '100px' },
    { key: 'is_active', label: 'Status', sortable: true, width: '80px' },
    { key: 'created_by_name', label: 'Created By', sortable: true, width: '120px' },
    { key: 'created_at', label: 'Created Date', sortable: true, width: '120px' },
    { key: 'updated_by_name', label: 'Updated By', sortable: true, width: '120px' },
    { key: 'updated_at', label: 'Updated Date', sortable: true, width: '120px' },
    { key: 'min_quantity', label: 'Min Quantity', sortable: true, width: '100px' },
    { key: 'max_quantity', label: 'Max Quantity', sortable: true, width: '100px' },
    { key: 'reorder_point', label: 'Reorder Point', sortable: true, width: '100px' }
  ],
  formFields: [
    { name: 'product_type', label: 'Product Type', type: 'select', required: true, options: [
      { value: 'resale', label: 'Resale' },
      { value: 'raw_materials', label: 'Raw Materials' },
      { value: 'manufactured', label: 'Manufactured' },
      { value: 'services', label: 'Services' },
      { value: 'pharmaceuticals', label: 'Pharmaceuticals' }
    ]},
    { name: 'code', label: 'Product Code', type: 'text', required: true, readonly: true },
    { name: 'barcode', label: 'Barcode', type: 'text', required: false },
    { name: 'name', label: 'Product Name', type: 'text', required: true },
    { name: 'part_number', label: 'Part Number', type: 'text', required: false },
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'image', label: 'Product Image', type: 'file', required: false },
    { name: 'category_id', label: 'Category', type: 'select', required: true },
    { name: 'brand_id', label: 'Brand', type: 'select', required: false },
    { name: 'manufacturer_id', label: 'Manufacturer', type: 'select', required: false },
    { name: 'model_id', label: 'Model', type: 'select', required: false },
    { name: 'color_id', label: 'Color', type: 'select', required: false },
    { name: 'store_location_id', label: 'Store Location', type: 'select', required: false },
    { name: 'unit_id', label: 'Unit', type: 'select', required: true },
    { name: 'cogs_account_id', label: 'COGS Account', type: 'select', required: false },
    { name: 'income_account_id', label: 'Income Account', type: 'select', required: false },
    { name: 'asset_account_id', label: 'Asset Account', type: 'select', required: false },
    { name: 'average_cost', label: 'Average Cost', type: 'number', required: false },
    { name: 'selling_price', label: 'Selling Price', type: 'number', required: false },
    { name: 'purchases_tax_id', label: 'Purchases Tax', type: 'select', required: false },
    { name: 'sales_tax_id', label: 'Sales Tax', type: 'select', required: false },
    { name: 'default_packaging_id', label: 'Default Packaging', type: 'select', required: false },
    { name: 'default_quantity', label: 'Default Quantity', type: 'number', required: false },
    { name: 'price_tax_inclusive', label: 'Price is Tax Inclusive', type: 'checkbox', required: false },
    { name: 'expiry_notification_days', label: 'Expiry Notification Days', type: 'number', required: false },
    { name: 'track_serial_number', label: 'Track Serial Number', type: 'checkbox', required: false },
    { name: 'is_active', label: 'Status', type: 'select', required: true, options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' }
    ]},
    { name: 'min_quantity', label: 'Min Quantity', type: 'number', required: false },
    { name: 'max_quantity', label: 'Max Quantity', type: 'number', required: false },
    { name: 'reorder_point', label: 'Reorder Point', type: 'number', required: false }
  ],
  searchFields: ['name', 'code', 'barcode', 'part_number', 'description'],
  sortOptions: [
    { key: 'name', label: 'Product Name' },
    { key: 'code', label: 'Product Code' },
    { key: 'product_type', label: 'Product Type' },
    { key: 'category_name', label: 'Category' },
    { key: 'brand_name', label: 'Brand' },
    { key: 'manufacturer_name', label: 'Manufacturer' },
    { key: 'average_cost', label: 'Average Cost' },
    { key: 'selling_price', label: 'Selling Price' },
    { key: 'current_stock', label: 'Current Stock' },
    { key: 'created_at', label: 'Created Date' },
    { key: 'updated_at', label: 'Updated Date' }
  ],
  filters: [
    { key: 'status', name: 'Status', label: 'Status', type: 'select', placeholder: 'All Statuses', options: [
      { value: 'all', label: 'All Statuses' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]},
    { key: 'product_type', name: 'Product Type', label: 'Product Type', type: 'select', placeholder: 'All Types', options: [
      { value: '', label: 'All Types' },
      { value: 'resale', label: 'Resale' },
      { value: 'raw_materials', label: 'Raw Materials' },
      { value: 'manufactured', label: 'Manufactured' },
      { value: 'services', label: 'Services' },
      { value: 'pharmaceuticals', label: 'Pharmaceuticals' }
    ]},
    { key: 'category_id', name: 'Category', label: 'Category', type: 'select', placeholder: 'All Categories' },
    { key: 'brand_id', name: 'Brand', label: 'Brand', type: 'select', placeholder: 'All Brands' },
    { key: 'manufacturer_id', name: 'Manufacturer', label: 'Manufacturer', type: 'select', placeholder: 'All Manufacturers' },
    { key: 'model_id', name: 'Model', label: 'Model', type: 'select', placeholder: 'All Models' },
    { key: 'color_id', name: 'Color', label: 'Color', type: 'select', placeholder: 'All Colors' },
    { key: 'store_id', name: 'Store', label: 'Store', type: 'select', placeholder: 'All Stores' },
    { key: 'lowStock', name: 'Low Stock', label: 'Low Stock', type: 'checkbox' },
    { key: 'expiring', name: 'Expiring', label: 'Expiring Soon', type: 'checkbox' }
  ],
  exportOptions: {
    excel: true,
    pdf: true,
    csv: false
  },
  importConfig: {
    templateFields: [
      { name: 'code', label: 'Product Code', required: false },
      { name: 'product_type', label: 'Product Type', required: true },
      { name: 'barcode', label: 'Barcode', required: false },
      { name: 'name', label: 'Product Name', required: true },
      { name: 'part_number', label: 'Part Number', required: false },
      { name: 'description', label: 'Description', required: false },
      { name: 'category_id', label: 'Category', required: true },
      { name: 'brand_id', label: 'Brand', required: false },
      { name: 'manufacturer_id', label: 'Manufacturer', required: false },
      { name: 'model_id', label: 'Model', required: false },
      { name: 'color_id', label: 'Color', required: false },
      { name: 'packaging_id', label: 'Packaging', required: false },
      { name: 'unit', label: 'Unit', required: true },
      { name: 'average_cost', label: 'Average Cost', required: false },
      { name: 'selling_price', label: 'Selling Price', required: false },
      { name: 'min_quantity', label: 'Min Quantity', required: false },
      { name: 'max_quantity', label: 'Max Quantity', required: false },
      { name: 'reorder_point', label: 'Reorder Point', required: false },
      { name: 'is_active', label: 'Active Status', required: false }
    ],
    validationRules: {
      name: { required: true },
      category_id: { required: true },
      unit: { required: true }
    }
  },
  exportConfig: {
    formats: ['excel', 'pdf'],
    columns: [
      { key: 'name', label: 'Product Name', visible: true },
      { key: 'code', label: 'Product Code', visible: true },
      { key: 'product_type', label: 'Product Type', visible: true },
      { key: 'barcode', label: 'Barcode', visible: true },
      { key: 'category_name', label: 'Category', visible: true },
      { key: 'brand_name', label: 'Brand', visible: true },
      { key: 'manufacturer_name', label: 'Manufacturer', visible: true },
      { key: 'model_name', label: 'Model', visible: true },
      { key: 'color_name', label: 'Color', visible: true },
      { key: 'unit_name', label: 'Unit', visible: true },
      { key: 'average_cost', label: 'Average Cost', visible: true },
      { key: 'selling_price', label: 'Selling Price', visible: true },
      { key: 'current_stock', label: 'Current Stock', visible: true },
      { key: 'min_quantity', label: 'Min Quantity', visible: true },
      { key: 'max_quantity', label: 'Max Quantity', visible: true },
      { key: 'reorder_point', label: 'Reorder Point', visible: true },
      { key: 'is_active', label: 'Status', visible: true },
      { key: 'created_at', label: 'Created Date', visible: true },
      { key: 'updated_at', label: 'Updated Date', visible: true }
    ]
  },
  breadcrumbs: [
    { label: 'Products', path: '/products' },
    { label: 'Product Catalog', path: '/product-catalog' }
  ]
};

// Product Type Configuration
export const productTypeConfig = {
  resale: {
    label: 'Resale',
    icon: Tag,
    color: 'blue',
    description: 'Products purchased for resale',
    features: ['Inventory tracking', 'Pricing management', 'Tax handling']
  },
  raw_materials: {
    label: 'Raw Materials',
    icon: Package,
    color: 'green',
    description: 'Materials used in manufacturing',
    features: ['Cost tracking', 'Supplier management', 'Batch tracking']
  },
  manufactured: {
    label: 'Manufactured',
    icon: Building2,
    color: 'purple',
    description: 'Products manufactured in-house',
    features: ['Raw materials tracking', 'Production time', 'Manufacturing process']
  },
  services: {
    label: 'Services',
    icon: Calculator,
    color: 'orange',
    description: 'Service offerings',
    features: ['Service description', 'Pricing', 'No inventory tracking']
  },
  pharmaceuticals: {
    label: 'Pharmaceuticals',
    icon: FileText,
    color: 'red',
    description: 'Medical and pharmaceutical products',
    features: ['Dosage tracking', 'Expiry management', 'Regulatory compliance']
  }
};

// Status Configuration
export const productStatusConfig = {
  active: {
    label: 'Active',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  inactive: {
    label: 'Inactive',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  }
};

// Column Visibility Configuration
export const columnVisibilityConfig = {
  showProductType: { key: 'product_type', label: 'Product Type', default: true },
  showBarcode: { key: 'barcode', label: 'Barcode', default: true },
  showCategory: { key: 'category_name', label: 'Category', default: true },
  showBrand: { key: 'brand_name', label: 'Brand', default: true },
  showManufacturer: { key: 'manufacturer_name', label: 'Manufacturer', default: true },
  showModel: { key: 'model_name', label: 'Model', default: true },
  showColor: { key: 'color_name', label: 'Color', default: true },
  showUnit: { key: 'unit_name', label: 'Unit', default: true },
  showAverageCost: { key: 'average_cost', label: 'Average Cost', default: true },
  showSellingPrice: { key: 'selling_price', label: 'Selling Price', default: true },
  showPriceCategories: { key: 'price_categories', label: 'Price Categories', default: true },
  showStatus: { key: 'is_active', label: 'Status', default: true },
  showCreatedDate: { key: 'created_at', label: 'Created Date', default: true },
  showUpdatedBy: { key: 'updated_by_name', label: 'Updated By', default: true },
  showUpdatedDate: { key: 'updated_at', label: 'Updated Date', default: true },
  showMinQuantity: { key: 'min_quantity', label: 'Min Quantity', default: true },
  showMaxQuantity: { key: 'max_quantity', label: 'Max Quantity', default: true },
  showReorderPoint: { key: 'reorder_point', label: 'Reorder Point', default: true }
};
