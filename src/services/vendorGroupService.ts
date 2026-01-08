import { api } from './api';

export interface VendorGroup {
  id: string;
  vendor_group_name: string;
  vendor_group_code: string;
  is_default: boolean;
  description?: string;
  is_active: boolean;
  account_payable_id?: string;
  default_liability_account_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  accountPayable?: {
    id: string;
    code: string;
    name: string;
  };
  defaultLiabilityAccount?: {
    id: string;
    code: string;
    name: string;
  };
  // Computed fields
  account_payable_name?: string;
  default_liability_account_name?: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface VendorGroupFormData {
  vendor_group_name: string;
  is_default: boolean;
  description?: string;
  account_payable_id?: string;
  default_liability_account_id?: string;
}

export interface VendorGroupFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export interface VendorGroupSortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface VendorGroupStats {
  totalGroups: number;
  activeGroups: number;
  inactiveGroups: number;
  defaultGroups: number;
  lastUpdate: string;
}

export interface PaginatedVendorGroupResponse {
  data: VendorGroup[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface VendorGroupUsage {
  usageCount: number;
  isUsed: boolean;
}

// Vendor Group Service
export const vendorGroupService = {
  // Get vendor group statistics
  async getStats(): Promise<VendorGroupStats> {
    const response = await api.get('/vendor-groups/stats');
    return response.data;
  },

  // Get all vendor groups with pagination and filters
  async getVendorGroups(
    page: number = 1,
    limit: number = 10,
    filters: VendorGroupFilters = { search: '', status: 'all' },
    sortConfig: VendorGroupSortConfig = { key: 'created_at', direction: 'desc' }
  ): Promise<PaginatedVendorGroupResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: filters.search,
      status: filters.status,
      sortBy: sortConfig.key,
      sortOrder: sortConfig.direction
    });

    const response = await api.get(`/vendor-groups?${params}`);
    console.log('Vendor Groups Response:', response.data);
    return response.data;
  },

  // Get active vendor groups for dropdowns
  async getActiveVendorGroups(): Promise<VendorGroup[]> {
    const response = await api.get('/vendor-groups/active');
    return response.data;
  },

  // Get vendor group by ID
  async getVendorGroupById(id: string): Promise<VendorGroup> {
    const response = await api.get(`/vendor-groups/${id}`);
    return response.data;
  },

  // Create new vendor group
  async createVendorGroup(data: VendorGroupFormData): Promise<VendorGroup> {
    const response = await api.post('/vendor-groups', data);
    return response.data;
  },

  // Update vendor group
  async updateVendorGroup(id: string, data: Partial<VendorGroupFormData>): Promise<VendorGroup> {
    const response = await api.put(`/vendor-groups/${id}`, data);
    return response.data;
  },

  // Toggle vendor group status
  async toggleVendorGroupStatus(id: string): Promise<{ message: string; is_active: boolean }> {
    const response = await api.patch(`/vendor-groups/${id}/toggle-status`);
    return response.data;
  },

  // Check vendor group usage
  async checkVendorGroupUsage(id: string): Promise<VendorGroupUsage> {
    const response = await api.get(`/vendor-groups/${id}/usage`);
    return response.data;
  },

  // Delete vendor group
  async deleteVendorGroup(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/vendor-groups/${id}`);
    return response.data;
  },

  // Export vendor groups to Excel
  async exportToExcel(filters: VendorGroupFilters = { search: '', status: 'all' }): Promise<Blob> {
    const params = new URLSearchParams({
      search: filters.search,
      status: filters.status
    });

    const response = await api.get(`/vendor-groups/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export vendor groups to PDF
  async exportToPdf(filters: VendorGroupFilters = { search: '', status: 'all' }): Promise<Blob> {
    const params = new URLSearchParams({
      search: filters.search,
      status: filters.status
    });

    const response = await api.get(`/vendor-groups/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get accounts for dropdowns
  async getAccounts(): Promise<any[]> {
    const response = await api.get('/accounts?limit=1000&status=active');
    return response.data.accounts || [];
  },

  // Get leaf accounts for default liability account dropdown (all leaf accounts, no filter)
  async getLiabilityAccounts(): Promise<any[]> {
    const response = await api.get('/accounts/leaf');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Download exported file
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default vendorGroupService;

