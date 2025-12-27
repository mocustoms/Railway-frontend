import { api } from './api';
import { AccountType } from '../types';

export interface AccountTypeListResponse {
  data: AccountType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  total: number;
}

export interface AccountTypeFilters {
  search?: string;
  category?: string;
  nature?: string;
  is_active?: string;
}

export interface AccountTypeSortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

class AccountTypeService {
  // Get all account types with pagination, search, filter, and sort
  async getAccountTypes(
    page: number = 1,
    limit: number = 25,
    filters?: AccountTypeFilters,
    sort?: AccountTypeSortConfig
  ): Promise<AccountTypeListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sort?.column || 'name',
      order: sort?.direction || 'asc'
    });

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.category) {
      params.append('category', filters.category);
    }

    if (filters?.nature) {
      params.append('nature', filters.nature);
    }

    if (filters?.is_active) {
      params.append('is_active', filters.is_active);
    }

    const response = await api.get(`/administration/account-types?${params}`);
    return response.data;
  }

  // Get a single account type by ID
  async getAccountType(id: string): Promise<AccountType> {
    const response = await api.get(`/administration/account-types/${id}`);
    return response.data;
  }

  // Create new account type
  async createAccountType(accountTypeData: Partial<AccountType>): Promise<AccountType> {
    const response = await api.post('/administration/account-types', accountTypeData);
    return response.data;
  }

  // Update account type
  async updateAccountType(id: string, accountTypeData: Partial<AccountType>): Promise<AccountType> {
    const response = await api.put(`/administration/account-types/${id}`, accountTypeData);
    return response.data;
  }

  // Delete account type
  async deleteAccountType(id: string): Promise<void> {
    await api.delete(`/administration/account-types/${id}`);
  }

  // Export to Excel
  async exportToExcel(filters?: AccountTypeFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.category) {
      params.append('category', filters.category);
    }

    if (filters?.nature) {
      params.append('nature', filters.nature);
    }

    if (filters?.is_active) {
      params.append('is_active', filters.is_active);
    }

    const response = await api.get(`/administration/account-types/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: AccountTypeFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.category) {
      params.append('category', filters.category);
    }

    if (filters?.nature) {
      params.append('nature', filters.nature);
    }

    if (filters?.is_active) {
      params.append('is_active', filters.is_active);
    }

    const response = await api.get(`/administration/account-types/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const accountTypeService = new AccountTypeService(); 