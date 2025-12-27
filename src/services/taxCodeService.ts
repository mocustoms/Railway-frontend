import api from './api';
import { TaxCode, TaxCodeStats, TaxCodeFilters, TaxCodeSortConfig } from '../types';

export interface TaxCodeListResponse {
  taxCodes: TaxCode[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaxCodeStatsResponse {
  stats: TaxCodeStats;
}

class TaxCodeService {
  // Get all tax codes with pagination, search, and sorting
  async getTaxCodes(
    page: number = 1,
    limit: number = 25,
    filters?: TaxCodeFilters,
    sort?: TaxCodeSortConfig
  ): Promise<TaxCodeListResponse> {
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

    if (filters?.rateRange?.min !== undefined) {
      params.append('rate_min', filters.rateRange.min.toString());
    }

    if (filters?.rateRange?.max !== undefined) {
      params.append('rate_max', filters.rateRange.max.toString());
    }

    if (sort?.column && sort?.direction) {
      params.append('sortBy', sort.column);
      params.append('sortOrder', sort.direction);
    }

    const response = await api.get(`/tax-codes?${params}`);
    return response.data;
  }

  // Get tax code by ID
  async getTaxCode(id: string): Promise<TaxCode> {
    const response = await api.get(`/tax-codes/${id}`);
    return response.data;
  }

  // Create new tax code
  async createTaxCode(taxCodeData: Partial<TaxCode>): Promise<TaxCode> {
    const response = await api.post('/tax-codes', taxCodeData);
    return response.data;
  }

  // Update tax code
  async updateTaxCode(id: string, taxCodeData: Partial<TaxCode>): Promise<TaxCode> {
    const response = await api.put(`/tax-codes/${id}`, taxCodeData);
    return response.data;
  }

  // Delete tax code
  async deleteTaxCode(id: string): Promise<void> {
    await api.delete(`/tax-codes/${id}`);
  }

  // Toggle tax code status
  async toggleTaxCodeStatus(id: string, isActive: boolean): Promise<TaxCode> {
    const response = await api.put(`/tax-codes/${id}/toggle-status`, { is_active: isActive });
    return response.data;
  }

  // Get tax code statistics
  async getTaxCodeStats(): Promise<TaxCodeStats> {
    const response = await api.get('/tax-codes/stats/overview');
    return response.data.stats;
  }

  // Check if tax code is available
  async checkCodeAvailability(code: string, excludeId?: string): Promise<boolean> {
    const params = new URLSearchParams({ code });
    if (excludeId) {
      params.append('exclude_id', excludeId);
    }
    
    const response = await api.get(`/tax-codes/check-code/availability?${params}`);
    return response.data.available;
  }

  // Export to Excel
  async exportToExcel(filters?: TaxCodeFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.rateRange?.min !== undefined) {
      params.append('rate_min', filters.rateRange.min.toString());
    }

    if (filters?.rateRange?.max !== undefined) {
      params.append('rate_max', filters.rateRange.max.toString());
    }

    const response = await api.get(`/tax-codes/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: TaxCodeFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.rateRange?.min !== undefined) {
      params.append('rate_min', filters.rateRange.min.toString());
    }

    if (filters?.rateRange?.max !== undefined) {
      params.append('rate_max', filters.rateRange.max.toString());
    }

    const response = await api.get(`/tax-codes/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get accounts for dropdowns
  async getAccounts(): Promise<any[]> {
    const response = await api.get('/accounts?limit=1000&status=active');
    return response.data.accounts || [];
  }
}

export const taxCodeService = new TaxCodeService(); 