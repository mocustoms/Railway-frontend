import api from './api';

export interface VendorFormData {
  vendor_group_id: string;
  full_name: string;
  address?: string;
  default_payable_account_id?: string;
  fax?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  is_active?: boolean;
}

export interface Vendor extends VendorFormData {
  id: string;
  vendor_id: string;
  group_name?: string;
  default_liability_account_id?: string;
  default_liability_account_name?: string;
  account_payable_name?: string;
  account_balance?: number;
  debt_balance?: number;
  deposit_balance?: number;
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

const vendorService = {
  async getVendors(params: { page?: number; limit?: number; search?: string; status?: 'all' | 'active' | 'inactive'; sort_by?: string; sort_order?: 'asc' | 'desc'; }): Promise<PaginatedResponse<Vendor>> {
    const response = await api.get('/vendors', { params });
    return response.data;
  },

  async createVendor(data: VendorFormData): Promise<Vendor> {
    const response = await api.post('/vendors', data);
    return response.data.data;
  },

  async updateVendor(id: string, data: Partial<VendorFormData>): Promise<Vendor> {
    const response = await api.put(`/vendors/${id}`, data);
    return response.data.data;
  },

  async deleteVendor(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`);
  },

  async getStats(): Promise<{ total: number; active: number; inactive: number; lastUpdate: string | null }> {
    const response = await api.get('/vendors/stats');
    return response.data.data;
  },

  async exportExcel(params?: { search?: string; status?: 'all' | 'active' | 'inactive' }): Promise<Blob> {
    const response = await api.get('/vendors/export/excel', { responseType: 'blob', params });
    return response.data;
  },

  async exportPdf(params?: { search?: string; status?: 'all' | 'active' | 'inactive' }): Promise<Blob> {
    const response = await api.get('/vendors/export/pdf', { responseType: 'blob', params });
    return response.data;
  },

  // Get products assigned to a vendor
  async getVendorProducts(vendorId: string): Promise<Array<{ id: string; code: string; name: string; product_type: string; barcode?: string; assigned_at: string }>> {
    const response = await api.get(`/vendors/${vendorId}/products`);
    return response.data.data;
  },

  // Assign products to a vendor
  async assignProducts(vendorId: string, productIds: string[]): Promise<{ assigned: number; skipped: number }> {
    const response = await api.post(`/vendors/${vendorId}/products`, { product_ids: productIds });
    return response.data.data;
  },

  // Unassign a product from a vendor
  async unassignProduct(vendorId: string, productId: string): Promise<void> {
    await api.delete(`/vendors/${vendorId}/products/${productId}`);
  },

  // Bulk unassign products from a vendor
  async bulkUnassignProducts(vendorId: string, productIds: string[]): Promise<{ unassigned: number }> {
    const response = await api.post(`/vendors/${vendorId}/products/bulk-remove`, { product_ids: productIds });
    return response.data.data;
  }
};

export default vendorService;

