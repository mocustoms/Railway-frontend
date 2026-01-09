import api from './api';
import { ExpenseType, ExpenseTypeStats, ExpenseTypeFilters, ExpenseTypeSortConfig } from '../types';

export interface ExpenseTypeListResponse {
  expenseTypes: ExpenseType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseTypeStatsResponse {
  stats: ExpenseTypeStats;
}

class ExpenseTypeService {
  // Get all expense types with pagination, search, and sorting
  async getExpenseTypes(
    page: number = 1,
    limit: number = 25,
    filters?: ExpenseTypeFilters,
    sort?: ExpenseTypeSortConfig
  ): Promise<ExpenseTypeListResponse> {
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

    if (filters?.accountId) {
      params.append('account_id', filters.accountId);
    }

    if (sort?.column && sort?.direction) {
      params.append('sortBy', sort.column);
      params.append('sortOrder', sort.direction);
    }

    const response = await api.get(`/expense-types?${params}`);
    const data = response.data;
    
    // Transform the response to match the expected interface
    return {
      expenseTypes: data.expenseTypes || data.data || [],
      total: data.pagination?.total || data.total || 0,
      page: data.pagination?.page || data.page || page,
      limit: data.pagination?.limit || data.limit || limit,
      totalPages: data.pagination?.totalPages || data.totalPages || 1
    };
  }

  // Get expense type statistics
  async getExpenseTypeStats(): Promise<ExpenseTypeStatsResponse> {
    const response = await api.get('/expense-types/stats');
    return response.data;
  }

  // Get a single expense type by ID
  async getExpenseType(id: string): Promise<ExpenseType> {
    const response = await api.get(`/expense-types/${id}`);
    return response.data;
  }

  // Create a new expense type
  async createExpenseType(data: any): Promise<ExpenseType> {
    const response = await api.post('/expense-types', data);
    return response.data;
  }

  // Update an expense type
  async updateExpenseType(id: string, data: any): Promise<ExpenseType> {
    const response = await api.put(`/expense-types/${id}`, data);
    return response.data;
  }

  // Delete an expense type
  async deleteExpenseType(id: string): Promise<void> {
    await api.delete(`/expense-types/${id}`);
  }

  // Toggle expense type status
  async toggleExpenseTypeStatus(id: string): Promise<ExpenseType> {
    const response = await api.put(`/expense-types/${id}/toggle-status`);
    return response.data;
  }

  // Export to Excel
  async exportToExcel(filters?: ExpenseTypeFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.accountId) {
      params.append('account_id', filters.accountId);
    }

    const response = await api.get(`/expense-types/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: ExpenseTypeFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.accountId) {
      params.append('account_id', filters.accountId);
    }

    const response = await api.get(`/expense-types/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get leaf accounts for dropdown
  async getAccounts(): Promise<any[]> {
    const response = await api.get('/accounts/leaf');
    return response.data;
  }
}

export const expenseTypeService = new ExpenseTypeService();
