import api from './api';

export interface CustomerFormData {
  customer_group_id: string;
  full_name: string;
  address?: string;
  default_receivable_account_id?: string;
  fax?: string;
  loyalty_card_number?: string;
  loyalty_card_config_id?: string;
  birthday?: string; // ISO date
  phone_number?: string;
  email?: string;
  website?: string;
  is_active?: boolean;
}

export interface Customer extends CustomerFormData {
  id: string;
  customer_id: string;
  group_name?: string;
  default_liability_account_id?: string;
  default_liability_account_name?: string;
  account_receivable_name?: string;
  loyalty_card_name?: string;
  account_balance?: number;
  debt_balance?: number;
  deposit_balance?: number;
  loyalty_points?: number;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }
}

const customerService = {
  async getCustomers(params: { page?: number; limit?: number; search?: string; status?: 'all' | 'active' | 'inactive'; sort_by?: string; sort_order?: 'asc' | 'desc'; }): Promise<PaginatedResponse<Customer>> {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  async createCustomer(data: CustomerFormData): Promise<Customer> {
    const response = await api.post('/customers', data);
    return response.data.data;
  },

  async updateCustomer(id: string, data: Partial<CustomerFormData>): Promise<Customer> {
    const response = await api.put(`/customers/${id}`, data);
    return response.data.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  async getStats(): Promise<{ total: number; active: number; inactive: number; lastUpdate: string | null }> {
    const response = await api.get('/customers/stats');
    return response.data.data;
  },

  async exportExcel(params?: { search?: string; status?: 'all' | 'active' | 'inactive' }): Promise<Blob> {
    const response = await api.get('/customers/export/excel', { responseType: 'blob', params });
    return response.data;
  },

  async exportPdf(params?: { search?: string; status?: 'all' | 'active' | 'inactive' }): Promise<Blob> {
    const response = await api.get('/customers/export/pdf', { responseType: 'blob', params });
    return response.data;
  }
};

export default customerService;


