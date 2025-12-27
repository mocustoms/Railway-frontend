import api from './api';

export interface CustomerBirthday {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  address: string;
  daysLeft: number;
  birthday: string;
  customerGroup: string;
  loyaltyCard: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface CustomerBirthdayStats {
  totalCustomers: number;
  upcomingBirthdays: number;
  thisWeekBirthdays: number;
  todayBirthdays: number;
}

export interface CustomerBirthdayFilters {
  customerGroupId?: string;
  loyaltyCardId?: string;
  daysBefore?: number;
  search?: string;
}

export interface CustomerBirthdayResponse {
  success: boolean;
  data: CustomerBirthday[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CustomerBirthdayStatsResponse {
  success: boolean;
  stats: CustomerBirthdayStats;
}

class CustomerBirthdaysReportService {
  // Fetch customer birthdays data
  async getCustomerBirthdays(filters: CustomerBirthdayFilters = {}): Promise<CustomerBirthdayResponse> {
    const params = new URLSearchParams();
    
    if (filters.customerGroupId) params.append('customerGroupId', filters.customerGroupId);
    if (filters.loyaltyCardId) params.append('loyaltyCardId', filters.loyaltyCardId);
    if (filters.daysBefore) params.append('daysBefore', filters.daysBefore.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/customer-birthdays-report?${params.toString()}`);
    return response.data;
  }

  // Fetch customer birthdays statistics
  async getCustomerBirthdaysStats(filters: CustomerBirthdayFilters = {}): Promise<CustomerBirthdayStatsResponse> {
    const params = new URLSearchParams();
    
    if (filters.customerGroupId) params.append('customerGroupId', filters.customerGroupId);
    if (filters.loyaltyCardId) params.append('loyaltyCardId', filters.loyaltyCardId);
    if (filters.daysBefore) params.append('daysBefore', filters.daysBefore.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/customer-birthdays-report/stats?${params.toString()}`);
    return response.data;
  }

  // Export to Excel
  async exportToExcel(filters: CustomerBirthdayFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.customerGroupId) params.append('customerGroupId', filters.customerGroupId);
    if (filters.loyaltyCardId) params.append('loyaltyCardId', filters.loyaltyCardId);
    if (filters.daysBefore) params.append('daysBefore', filters.daysBefore.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/customer-birthdays-report/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters: CustomerBirthdayFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.customerGroupId) params.append('customerGroupId', filters.customerGroupId);
    if (filters.loyaltyCardId) params.append('loyaltyCardId', filters.loyaltyCardId);
    if (filters.daysBefore) params.append('daysBefore', filters.daysBefore.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/customer-birthdays-report/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const customerBirthdaysReportService = new CustomerBirthdaysReportService();
export default customerBirthdaysReportService;
