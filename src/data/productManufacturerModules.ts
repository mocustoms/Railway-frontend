import { Factory } from 'lucide-react';

export const productManufacturerModuleConfig = {
  title: 'Product Manufacturers Management',
  description: 'Manage product manufacturers, logos, and contact information',
  icon: Factory,
  path: '/product-manufacturers',
  apiEndpoint: '/product-manufacturers',
  
  // Table configuration
  table: {
    columns: [
      {
        key: 'name',
        label: 'Manufacturer Name',
        sortable: true,
        width: '200px'
      },
      {
        key: 'code',
        label: 'Manufacturer Code',
        sortable: true,
        width: '150px'
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        width: '250px'
      },
      {
        key: 'website',
        label: 'Website',
        sortable: false,
        width: '150px'
      },
      {
        key: 'contact_email',
        label: 'Contact Email',
        sortable: false,
        width: '180px'
      },
      {
        key: 'contact_phone',
        label: 'Contact Phone',
        sortable: false,
        width: '140px'
      },
      {
        key: 'country',
        label: 'Country',
        sortable: true,
        width: '120px'
      },
      {
        key: 'is_active',
        label: 'Status',
        sortable: true,
        width: '100px',
        render: (value: boolean) => ({
          type: 'status',
          value: value ? 'active' : 'inactive'
        })
      },
      {
        key: 'created_by_name',
        label: 'Created By',
        sortable: false,
        width: '150px'
      },
      {
        key: 'created_at',
        label: 'Created Date',
        sortable: true,
        width: '140px',
        render: (value: string) => ({
          type: 'date',
          value
        })
      },
      {
        key: 'updated_by_name',
        label: 'Updated By',
        sortable: false,
        width: '150px'
      },
      {
        key: 'updated_at',
        label: 'Updated Date',
        sortable: true,
        width: '140px',
        render: (value: string) => ({
          type: 'date',
          value
        })
      }
    ],
    defaultSort: {
      field: 'name',
      direction: 'asc'
    },
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100]
  },

  // Form configuration
  form: {
    fields: [
      {
        name: 'name',
        label: 'Manufacturer Name',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter manufacturer name',
        validation: {
          required: 'Manufacturer name is required',
          minLength: { value: 1, message: 'Name must be at least 1 character' },
          maxLength: { value: 255, message: 'Name must not exceed 255 characters' }
        }
      },
      {
        name: 'code',
        label: 'Manufacturer Code',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter manufacturer code',
        validation: {
          required: 'Manufacturer code is required',
          minLength: { value: 1, message: 'Code must be at least 1 character' },
          maxLength: { value: 50, message: 'Code must not exceed 50 characters' },
          pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Code can only contain letters, numbers, hyphens, and underscores' }
        }
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Enter manufacturer description',
        validation: {
          maxLength: { value: 1000, message: 'Description must not exceed 1000 characters' }
        }
      },
      {
        name: 'website',
        label: 'Website',
        type: 'text' as const,
        required: false,
        placeholder: 'https://example.com',
        validation: {
          pattern: { value: /^https?:\/\/.+/, message: 'Please enter a valid URL starting with http:// or https://' }
        }
      },
      {
        name: 'contact_email',
        label: 'Contact Email',
        type: 'email' as const,
        required: false,
        placeholder: 'contact@manufacturer.com',
        validation: {
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address' }
        }
      },
      {
        name: 'contact_phone',
        label: 'Contact Phone',
        type: 'text' as const,
        required: false,
        placeholder: '+1234567890',
        validation: {
          pattern: { value: /^[\+]?[1-9][\d]{0,15}$/, message: 'Please enter a valid phone number' }
        }
      },
      {
        name: 'address',
        label: 'Address',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Enter manufacturer address',
        validation: {
          maxLength: { value: 500, message: 'Address must not exceed 500 characters' }
        }
      },
      {
        name: 'country',
        label: 'Country',
        type: 'text' as const,
        required: false,
        placeholder: 'Enter country',
        validation: {
          maxLength: { value: 100, message: 'Country must not exceed 100 characters' }
        }
      },
      {
        name: 'logo',
        label: 'Manufacturer Logo',
        type: 'file' as const,
        required: false,
        accept: 'image/*',
        validation: {
          fileSize: { value: 5 * 1024 * 1024, message: 'Logo must be less than 5MB' },
          fileType: { value: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], message: 'Only image files are allowed' }
        }
      },
      {
        name: 'is_active',
        label: 'Status',
        type: 'checkbox' as const,
        required: false,
        defaultChecked: true
      }
    ]
  },

  // Search configuration
  search: {
    fields: ['name', 'code', 'description'],
    placeholder: 'Search manufacturers by name, code, or description...'
  },

  // Filter configuration
  filters: [
    {
      key: 'status',
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      key: 'country',
      name: 'country',
      label: 'Country',
      type: 'text' as const,
      placeholder: 'Filter by country'
    }
  ],

  // Export configuration
  export: {
    excel: true,
    pdf: true,
    csv: false
  },

  // Permissions
  permissions: {
    view: 'product_manufacturers.view',
    create: 'product_manufacturers.create',
    edit: 'product_manufacturers.edit',
    delete: 'product_manufacturers.delete',
    export: 'product_manufacturers.export'
  },

  // Breadcrumbs
  breadcrumbs: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Products', path: '/products' },
    { label: 'Product Manufacturers', path: '/product-manufacturers' }
  ]
};
