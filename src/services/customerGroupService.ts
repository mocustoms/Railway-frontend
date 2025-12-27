import { api } from './api';

export interface CustomerGroup {
  id: string;
  group_name: string;
  group_code: string;
  is_default: boolean;
  description?: string;
  is_active: boolean;
  account_receivable_id?: string;
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
  accountReceivable?: {
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
  account_receivable_name?: string;
  default_liability_account_name?: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface CustomerGroupFormData {
  group_name: string;
  is_default: boolean;
  description?: string;
  account_receivable_id?: string;
  default_liability_account_id?: string;
}

export interface CustomerGroupFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export interface CustomerGroupSortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface CustomerGroupStats {
  totalGroups: number;
  activeGroups: number;
  inactiveGroups: number;
  defaultGroups: number;
  lastUpdate: string;
}

export interface PaginatedCustomerGroupResponse {
  data: CustomerGroup[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CustomerGroupUsage {
  usageCount: number;
  isUsed: boolean;
}

// Customer Group Service
export const customerGroupService = {
  // Get customer group statistics
  async getStats(): Promise<CustomerGroupStats> {
    const response = await api.get('/customer-groups/stats');
    return response.data;
  },

  // Get all customer groups with pagination and filters
  async getCustomerGroups(
    page: number = 1,
    limit: number = 10,
    filters: CustomerGroupFilters = { search: '', status: 'all' },
    sortConfig: CustomerGroupSortConfig = { key: 'created_at', direction: 'desc' }
  ): Promise<PaginatedCustomerGroupResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: filters.search,
      status: filters.status,
      sortBy: sortConfig.key,
      sortOrder: sortConfig.direction
    });

    const response = await api.get(`/customer-groups?${params}`);
    return response.data;
  },

  // Get active customer groups for dropdowns
  async getActiveCustomerGroups(): Promise<CustomerGroup[]> {
    const response = await api.get('/customer-groups/active');
    return response.data;
  },

  // Get customer group by ID
  async getCustomerGroupById(id: string): Promise<CustomerGroup> {
    const response = await api.get(`/customer-groups/${id}`);
    return response.data;
  },

  // Create new customer group
  async createCustomerGroup(data: CustomerGroupFormData): Promise<CustomerGroup> {
    const response = await api.post('/customer-groups', data);
    return response.data;
  },

  // Update customer group
  async updateCustomerGroup(id: string, data: Partial<CustomerGroupFormData>): Promise<CustomerGroup> {
    const response = await api.put(`/customer-groups/${id}`, data);
    return response.data;
  },

  // Toggle customer group status
  async toggleCustomerGroupStatus(id: string): Promise<{ message: string; is_active: boolean }> {
    const response = await api.patch(`/customer-groups/${id}/toggle-status`);
    return response.data;
  },

  // Check customer group usage
  async checkCustomerGroupUsage(id: string): Promise<CustomerGroupUsage> {
    const response = await api.get(`/customer-groups/${id}/usage`);
    return response.data;
  },

  // Delete customer group
  async deleteCustomerGroup(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/customer-groups/${id}`);
    return response.data;
  },

  // Export customer groups to Excel
  async exportToExcel(filters: CustomerGroupFilters = { search: '', status: 'all' }): Promise<Blob> {
    const params = new URLSearchParams({
      search: filters.search,
      status: filters.status
    });

    const response = await api.get(`/customer-groups/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export customer groups to PDF
  async exportToPdf(filters: CustomerGroupFilters = { search: '', status: 'all' }): Promise<Blob> {
    const params = new URLSearchParams({
      search: filters.search,
      status: filters.status
    });

    const response = await api.get(`/customer-groups/export/pdf?${params}`, {
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

export default customerGroupService;