import { SalesAgentStats } from '../types';

// Default sales agent statistics
export const defaultSalesAgentStats: SalesAgentStats = {
  totalAgents: 0,
  activeAgents: 0,
  inactiveAgents: 0,
  lastUpdate: 'Never'
};

// Page size options for pagination
export const pageSizeOptions = [
  { value: 10, label: '10 per page' },
  { value: 25, label: '25 per page' },
  { value: 50, label: '50 per page' },
  { value: 100, label: '100 per page' }
];

// Status filter options
export const statusFilterOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

// Table column configuration
export const salesAgentTableColumns = [
  { key: 'agentNumber', label: 'Agent Number', sortable: true, visible: true },
  { key: 'fullName', label: 'Full Name', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'created_at', label: 'Created Date', sortable: true, visible: true },
  { key: 'updated_at', label: 'Updated Date', sortable: true, visible: true }
];

// Column visibility options
export const columnVisibilityOptions = [
  { id: 'showAgentNumber', label: 'Agent Number', columnKey: 'agentNumber' },
  { id: 'showFullName', label: 'Full Name', columnKey: 'fullName' },
  { id: 'showStatus', label: 'Status', columnKey: 'status' },
  { id: 'showCreatedDate', label: 'Created Date', columnKey: 'created_at' },
  { id: 'showUpdatedDate', label: 'Updated Date', columnKey: 'updated_at' }
];

// Export file name templates
export const exportFileNameTemplates = {
  excel: (date: string) => `sales-agents-${date}.csv`,
  pdf: (date: string) => `sales-agents-${date}.pdf`
};

// Form validation rules
export const salesAgentValidationRules = {
  agentNumber: {
    required: 'Agent number is required',
    minLength: { value: 3, message: 'Agent number must be at least 3 characters' },
    maxLength: { value: 20, message: 'Agent number must be 20 characters or less' },
    pattern: {
      value: /^[A-Za-z0-9_-]+$/,
      message: 'Agent number can only contain letters, numbers, underscores, and hyphens'
    }
  },
  fullName: {
    required: 'Full name is required',
    minLength: { value: 2, message: 'Full name must be at least 2 characters' },
    maxLength: { value: 100, message: 'Full name must be 100 characters or less' }
  },
  photo: {
    fileSize: { value: 5 * 1024 * 1024, message: 'Photo file size must be 5MB or less' },
    fileType: { value: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], message: 'Only image files are allowed' }
  }
};

// Default form data
export const defaultSalesAgentFormData = {
  agentNumber: '',
  fullName: '',
  photo: null,
  status: 'active'
};

// Photo upload configuration
export const photoUploadConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  uploadPath: '/uploads/sales-agent-photos/'
};

// Default filters
export const defaultSalesAgentFilters = {
  search: '',
  status: 'all'
};

// Default sort configuration
export const defaultSalesAgentSortConfig = {
  key: 'created_at' as const,
  direction: 'desc' as const
};
