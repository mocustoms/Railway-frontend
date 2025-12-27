import api from './api';
import { BankDetail, BankDetailStats, BankDetailFilters, BankDetailSortConfig, Account } from '../types';

export interface BankDetailListResponse {
  bankDetails: BankDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BankDetailStatsResponse {
  stats: BankDetailStats;
}

class BankDetailService {
  // Get all bank details with pagination, search, and sorting
  async getBankDetails(
    page: number = 1,
    limit: number = 25,
    filters?: BankDetailFilters,
    sort?: BankDetailSortConfig
  ): Promise<BankDetailListResponse> {
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

    const response = await api.get(`/bank-details?${params}`);
    const data = response.data;
    
    // Transform the response to match the expected interface
    return {
      bankDetails: data.bankDetails,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || page,
      limit: data.pagination?.limit || limit,
      totalPages: data.pagination?.totalPages || 1
    };
  }

  // Get bank detail statistics
  async getBankDetailStats(): Promise<BankDetailStatsResponse> {
    const response = await api.get('/bank-details/stats');
    return response.data;
  }

  // Get a single bank detail by ID
  async getBankDetail(id: string): Promise<BankDetail> {
    const response = await api.get(`/bank-details/${id}`);
    return response.data;
  }

  // Create a new bank detail
  async createBankDetail(data: any): Promise<BankDetail> {
    const response = await api.post('/bank-details', data);
    return response.data;
  }

  // Update a bank detail
  async updateBankDetail(id: string, data: any): Promise<BankDetail> {
    const response = await api.put(`/bank-details/${id}`, data);
    return response.data;
  }

  // Delete a bank detail
  async deleteBankDetail(id: string): Promise<void> {
    await api.delete(`/bank-details/${id}`);
  }

  // Toggle bank detail status
  async toggleBankDetailStatus(id: string): Promise<BankDetail> {
    const response = await api.put(`/bank-details/${id}/toggle-status`);
    return response.data;
  }

  // Export to Excel
  async exportToExcel(filters?: BankDetailFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/bank-details/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: BankDetailFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/bank-details/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get leaf accounts for dropdown
  async getLeafAccounts(): Promise<Account[]> {
    const response = await api.get('/accounts/leaf');
    return response.data;
  }
}

export const bankDetailService = new BankDetailService();
