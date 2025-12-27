import api from './api';

export interface CustomerListReportItem {
  id: string;
  customerId: string;
  fullName: string;
  customerGroup: string;
  customerGroupCode: string;
  receivableAccount: string;
  receivableAccountCode: string;
  phone: string;
  email: string;
  website: string;
  fax: string;
  birthday: string;
  loyaltyCard: string;
  loyaltyCardPoints: number;
  loyaltyCardStatus: string;
  address: string;
  accountBalance: number;
  isActive: boolean;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface CustomerListReportFilters {
  customerGroupId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerListReportStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalAccountBalance: number;
  groupDistribution: Array<{
    groupName: string;
    count: number;
  }>;
  lastUpdate: string;
}

export interface CustomerListReportResponse {
  success: boolean;
  data: CustomerListReportItem[];
  total: number;
}

export interface CustomerListReportStatsResponse {
  success: boolean;
  stats: CustomerListReportStats;
}

export const customerListReportService = {
  // Get Customer List Report Data
  getCustomerListReport: async (filters?: CustomerListReportFilters): Promise<CustomerListReportResponse> => {
    const params: any = {};
    
    if (filters?.customerGroupId) params.customerGroupId = filters.customerGroupId;
    if (filters?.status) params.status = filters.status;
    if (filters?.search) params.search = filters.search;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    const response = await api.get('/customer-list-report', { params });
    return response.data;
  },

  // Get Customer List Report Statistics
  getCustomerListReportStats: async (filters?: CustomerListReportFilters): Promise<CustomerListReportStatsResponse> => {
    const params: any = {};
    
    if (filters?.customerGroupId) params.customerGroupId = filters.customerGroupId;
    if (filters?.status) params.status = filters.status;
    if (filters?.search) params.search = filters.search;

    const response = await api.get('/customer-list-report/stats', { params });
    return response.data;
  }
};

export default customerListReportService;
