import api from './api';

export interface ReturnsOutItemFormData {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  tax_percentage?: number;
  tax_amount?: number;
  refund_amount?: number;
  notes?: string;
  serial_numbers?: string[];
  batch_number?: string;
  expiry_date?: string;
}

export interface ReturnsOutItem extends ReturnsOutItemFormData {
  id: string;
  returns_out_id: string;
  line_total: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    code: string;
    name: string;
    barcode?: string;
    product_type?: string;
  };
}

export interface ReturnsOutFormData {
  return_date: string; // ISO date
  store_id: string;
  vendor_id: string;
  return_reason_id?: string;
  currency_id?: string;
  exchange_rate?: number;
  items: ReturnsOutItemFormData[];
  notes?: string;
}

export interface ReturnsOut extends Omit<ReturnsOutFormData, 'items'> {
  id: string;
  return_ref_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  refund_amount: number;
  equivalent_amount?: number;
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected';
  refund_status: 'pending' | 'partial' | 'completed';
  created_by: string;
  updated_by?: string;
  approved_by?: string;
  approved_at?: string;
  completed_by?: string;
  completed_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  items: ReturnsOutItem[];
  vendor_name?: string;
  vendor_code?: string;
  store_name?: string;
  return_reason_name?: string;
  return_reason_code?: string;
  created_by_name?: string;
  updated_by_name?: string;
  approved_by_name?: string;
  completed_by_name?: string;
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
  };
}

export interface ReturnsOutStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  completed: number;
  cancelled: number;
  totalRefundAmount: number;
}

const returnsOutService = {
  async getReturnsOut(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    refundStatus?: string;
    vendorId?: string;
    storeId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<ReturnsOut>> {
    const response = await api.get('/returns-out', { params });
    return response.data;
  },

  async getReturnsOutById(id: string): Promise<ReturnsOut> {
    const response = await api.get(`/returns-out/${id}`);
    return response.data.data;
  },

  async createReturnsOut(data: ReturnsOutFormData): Promise<ReturnsOut> {
    const response = await api.post('/returns-out', data);
    return response.data.data;
  },

  async updateReturnsOut(id: string, data: Partial<ReturnsOutFormData>): Promise<ReturnsOut> {
    const response = await api.put(`/returns-out/${id}`, data);
    return response.data.data;
  },

  async deleteReturnsOut(id: string): Promise<void> {
    await api.delete(`/returns-out/${id}`);
  },

  async approveReturnsOut(id: string): Promise<ReturnsOut> {
    const response = await api.patch(`/returns-out/${id}/approve`);
    return response.data.data;
  },

  async completeReturnsOut(id: string): Promise<ReturnsOut> {
    const response = await api.patch(`/returns-out/${id}/complete`);
    return response.data.data;
  },

  async cancelReturnsOut(id: string, cancellationReason?: string): Promise<ReturnsOut> {
    const response = await api.patch(`/returns-out/${id}/cancel`, { cancellation_reason: cancellationReason });
    return response.data.data;
  },

  async getStats(): Promise<ReturnsOutStats> {
    const response = await api.get('/returns-out/stats');
    return response.data.data;
  },

  async exportExcel(params?: { search?: string; status?: string; vendorId?: string; storeId?: string }): Promise<Blob> {
    const response = await api.get('/returns-out/export/excel', { responseType: 'blob', params });
    return response.data;
  },

  async exportPdf(params?: { search?: string; status?: string; vendorId?: string; storeId?: string }): Promise<Blob> {
    const response = await api.get('/returns-out/export/pdf', { responseType: 'blob', params });
    return response.data;
  }
};

export default returnsOutService;

