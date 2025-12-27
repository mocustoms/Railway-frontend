import { api } from './api';
import { Account } from '../types';

export interface AccountListResponse {
  accounts: Account[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AccountFilters {
  search?: string;
  type?: string;
  status?: string;
  parentId?: string;
}

export interface AccountSortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

class AccountService {
  // Get all accounts with pagination, search, filter, and sort
  async getAccounts(
    page: number = 1,
    limit: number = 25,
    filters?: AccountFilters,
    sort?: AccountSortConfig
  ): Promise<AccountListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sort?.column || 'name',
      order: sort?.direction || 'asc'
    });

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.type) {
      params.append('type', filters.type);
    }

    if (filters?.status) {
      params.append('status', filters.status);
    }

    if (filters?.parentId) {
      params.append('parentId', filters.parentId);
    }

    const response = await api.get(`/accounts?${params}`);
    return response.data;
  }

  // Get a single account by ID
  async getAccount(id: string): Promise<Account> {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  }

  // Create new account
  async createAccount(accountData: Partial<Account>): Promise<Account> {
    const response = await api.post('/accounts', accountData);
    return response.data;
  }

  // Update account
  async updateAccount(id: string, accountData: Partial<Account>): Promise<Account> {
    const response = await api.put(`/accounts/${id}`, accountData);
    return response.data;
  }

  // Delete account
  async deleteAccount(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`);
  }

  // Get all accounts as flat list (for dropdowns)
  async getAccountsFlat(): Promise<Account[]> {
    const response = await api.get('/accounts/all');
    return response.data;
  }

  // Get accounts as tree structure (for Chart of Accounts)
  async getAccountsTree(): Promise<Account[]> {
    const response = await api.get('/accounts');
    return response.data;
  }

  // Get leaf accounts (accounts without children)
  async getLeafAccounts(): Promise<Account[]> {
    const response = await api.get('/accounts/leaf');
    return response.data;
  }

  // Export to Excel
  async exportToExcel(filters?: AccountFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.type) {
      params.append('type', filters.type);
    }

    if (filters?.status) {
      params.append('status', filters.status);
    }

    const response = await api.get(`/accounts/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: AccountFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.type) {
      params.append('type', filters.type);
    }

    if (filters?.status) {
      params.append('status', filters.status);
    }

    const response = await api.get(`/accounts/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const accountService = new AccountService(); 