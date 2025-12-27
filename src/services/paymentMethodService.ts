import api from './api';
import { PaymentMethod, PaymentMethodStats, PaymentMethodFilters, PaymentMethodSortConfig } from '../types';

export interface PaymentMethodListResponse {
  paymentMethods: PaymentMethod[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentMethodStatsResponse {
  stats: PaymentMethodStats;
}

class PaymentMethodService {
  // Get all payment methods with pagination, search, and sorting
  async getPaymentMethods(
    page: number = 1,
    limit: number = 25,
    filters?: PaymentMethodFilters,
    sort?: PaymentMethodSortConfig
  ): Promise<PaymentMethodListResponse> {
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

    if (sort?.column && sort?.direction) {
      params.append('sortBy', sort.column);
      params.append('sortOrder', sort.direction);
    }

    const response = await api.get(`/payment-methods?${params}`);
    const data = response.data;
    
    // Transform the response to match the expected interface
    return {
      paymentMethods: data.paymentMethods,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || page,
      limit: data.pagination?.limit || limit,
      totalPages: data.pagination?.totalPages || 1
    };
  }

  // Get payment method statistics
  async getPaymentMethodStats(): Promise<PaymentMethodStatsResponse> {
    const response = await api.get('/payment-methods/stats');
    return response.data;
  }

  // Get a single payment method by ID
  async getPaymentMethod(id: string): Promise<PaymentMethod> {
    const response = await api.get(`/payment-methods/${id}`);
    return response.data;
  }

  // Create a new payment method
  async createPaymentMethod(data: any): Promise<PaymentMethod> {
    const response = await api.post('/payment-methods', data);
    return response.data;
  }

  // Update a payment method
  async updatePaymentMethod(id: string, data: any): Promise<PaymentMethod> {
    const response = await api.put(`/payment-methods/${id}`, data);
    return response.data;
  }

  // Delete a payment method
  async deletePaymentMethod(id: string): Promise<void> {
    await api.delete(`/payment-methods/${id}`);
  }

  // Toggle payment method status
  async togglePaymentMethodStatus(id: string): Promise<PaymentMethod> {
    const response = await api.put(`/payment-methods/${id}/toggle-status`);
    return response.data;
  }

  // Export to Excel
  async exportToExcel(filters?: PaymentMethodFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/payment-methods/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: PaymentMethodFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/payment-methods/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const paymentMethodService = new PaymentMethodService();
