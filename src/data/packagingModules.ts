import { PackagingStats } from '../types';

// Default packaging statistics
export const defaultPackagingStats: PackagingStats = {
  totalPackaging: 0,
  activePackaging: 0,
  inactivePackaging: 0,
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
export const packagingTableColumns = [
  { key: 'code', label: 'Code', sortable: true, visible: true },
  { key: 'name', label: 'Name', sortable: true, visible: true },
  { key: 'pieces', label: 'Pieces', sortable: true, visible: true },
  { key: 'status', label: 'Status', sortable: true, visible: true },
  { key: 'created_at', label: 'Created', sortable: true, visible: true },
  { key: 'updated_at', label: 'Updated', sortable: true, visible: true }
];

// Export file name templates
export const exportFileNameTemplates = {
  excel: (date: string) => `packaging-${date}.csv`,
  pdf: (date: string) => `packaging-${date}.pdf`
};
