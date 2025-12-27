import api from './api';
import { PaymentType, PaymentTypeStats, PaymentTypeFilters, PaymentTypeSortConfig } from '../types';

export interface PaymentTypeListResponse {
  paymentTypes: PaymentType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentTypeStatsResponse {
  stats: PaymentTypeStats;
}

class PaymentTypeService {
  // Get all payment types with pagination, search, and sorting
  async getPaymentTypes(
    page: number = 1,
    limit: number = 25,
    filters?: PaymentTypeFilters,
    sort?: PaymentTypeSortConfig
  ): Promise<PaymentTypeListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.paymentMethodId) {
      params.append('payment_method_id', filters.paymentMethodId);
    }

    if (sort?.column && sort?.direction) {
      params.append('sortBy', sort.column);
      params.append('sortOrder', sort.direction);
    }

    const response = await api.get(`/payment-types?${params}`);
    const data = response.data;
    
    // Transform the response to match the expected interface
    return {
      paymentTypes: data.paymentTypes,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || page,
      limit: data.pagination?.limit || limit,
      totalPages: data.pagination?.totalPages || 1
    };
  }

  // Get payment type statistics
  async getPaymentTypeStats(): Promise<PaymentTypeStatsResponse> {
    const response = await api.get('/payment-types/stats');
    return response.data;
  }

  // Get a single payment type by ID
  async getPaymentType(id: string): Promise<PaymentType> {
    const response = await api.get(`/payment-types/${id}`);
    return response.data;
  }

  // Create a new payment type
  async createPaymentType(data: any): Promise<PaymentType> {
    const response = await api.post('/payment-types', data);
    return response.data;
  }

  // Update a payment type
  async updatePaymentType(id: string, data: any): Promise<PaymentType> {
    const response = await api.put(`/payment-types/${id}`, data);
    return response.data;
  }

  // Delete a payment type
  async deletePaymentType(id: string): Promise<void> {
    await api.delete(`/payment-types/${id}`);
  }

  // Toggle payment type status
  async togglePaymentTypeStatus(id: string): Promise<PaymentType> {
    const response = await api.put(`/payment-types/${id}/toggle-status`);
    return response.data;
  }

  // Export to Excel
  async exportToExcel(filters?: PaymentTypeFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.paymentMethodId) {
      params.append('payment_method_id', filters.paymentMethodId);
    }

    const response = await api.get(`/payment-types/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: PaymentTypeFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.paymentMethodId) {
      params.append('payment_method_id', filters.paymentMethodId);
    }

    const response = await api.get(`/payment-types/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get payment methods for dropdown
  async getPaymentMethods(): Promise<any[]> {
    const response = await api.get('/payment-methods');
    return response.data;
  }

  // Get leaf accounts for dropdown
  async getAccounts(): Promise<any[]> {
    const response = await api.get('/accounts/leaf');
    return response.data;
  }
}

export const paymentTypeService = new PaymentTypeService();
