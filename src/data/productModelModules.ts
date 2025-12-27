import { Package } from 'lucide-react';

export const productModelModuleConfig = {
  title: 'Product Models Management',
  description: 'Manage product models, specifications, and brand information',
  icon: Package,
  path: '/product-models',
  apiEndpoint: '/product-models',
  
  // Table configuration
  table: {
    columns: [
      {
        key: 'code',
        label: 'Model Code',
        sortable: true,
        width: '120px'
      },
      {
        key: 'name',
        label: 'Model Name',
        sortable: true,
        width: '200px'
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        width: '250px'
      },
      {
        key: 'category_name',
        label: 'Category',
        sortable: false,
        width: '150px'
      },
      {
        key: 'brand',
        label: 'Brand',
        sortable: true,
        width: '120px'
      },
      {
        key: 'model_number',
        label: 'Model Number',
        sortable: true,
        width: '140px'
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
    pageSize: 10,
    pageSizeOptions: [10, 25, 50, 100]
  },

  // Form configuration
  form: {
    fields: [
      {
        name: 'code',
        label: 'Model Code',
        type: 'text',
        required: true,
        placeholder: 'Enter model code',
        validation: {
          minLength: 1,
          maxLength: 50
        }
      },
      {
        name: 'name',
        label: 'Model Name',
        type: 'text',
        required: true,
        placeholder: 'Enter model name',
        validation: {
          minLength: 1,
          maxLength: 255
        }
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        placeholder: 'Enter model description',
        rows: 3
      },
      {
        name: 'category_id',
        label: 'Category',
        type: 'select',
        required: false,
        placeholder: 'Select category',
        options: [], // Will be populated from API
        optionValue: 'id',
        optionLabel: 'name'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'Enter brand name',
        validation: {
          maxLength: 100
        }
      },
      {
        name: 'model_number',
        label: 'Model Number',
        type: 'text',
        required: false,
        placeholder: 'Enter model number',
        validation: {
          maxLength: 100
        }
      },
      {
        name: 'logo',
        label: 'Logo',
        type: 'file',
        required: false,
        accept: 'image/*',
        maxSize: 5 * 1024 * 1024 // 5MB
      },
      {
        name: 'specifications',
        label: 'Specifications',
        type: 'json',
        required: false,
        placeholder: 'Enter specifications as JSON'
      },
      {
        name: 'is_active',
        label: 'Status',
        type: 'switch',
        required: false,
        defaultValue: true
      }
    ]
  },

  // Stats configuration
  stats: [
    {
      key: 'totalProductModels',
      label: 'Total Models',
      icon: Package,
      color: 'blue'
    },
    {
      key: 'activeProductModels',
      label: 'Active Models',
      icon: Package,
      color: 'green'
    },
    {
      key: 'inactiveProductModels',
      label: 'Inactive Models',
      icon: Package,
      color: 'red'
    }
  ],

  // Export options
  exportOptions: {
    excel: true,
    pdf: true,
    csv: false
  }
};
