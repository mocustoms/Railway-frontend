import { api } from './api';
import { 
  PaginatedResponse 
} from '../types';
import { 
  FinancialYear,
  FinancialYearFormData, 
  FinancialYearFilters,
  FinancialYearStats
} from '../data/financialYearModules';

export const financialYearService = {
  // Get all financial years with pagination and filters
  getFinancialYears: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<FinancialYear>> => {
    // Convert boolean to string for query params
    // Don't pass isActive if undefined - let backend return all financial years
    const queryParams: any = { ...params };
    if (params?.isActive !== undefined) {
      queryParams.isActive = params.isActive.toString();
    }
    const response = await api.get('/financial-years', { params: queryParams });
    return response.data;
  },

  // Get a single financial year by ID
  getFinancialYear: async (id: string): Promise<FinancialYear> => {
    const response = await api.get(`/financial-years/${id}`);
    return response.data;
  },

  // Get current financial year
  getCurrentFinancialYear: async (): Promise<FinancialYear | null> => {
    try {
      const response = await api.get('/financial-years/current');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Create a new financial year
  createFinancialYear: async (data: FinancialYearFormData): Promise<FinancialYear> => {
    const response = await api.post('/financial-years', data);
    return response.data;
  },

  // Update an existing financial year
  updateFinancialYear: async (id: string, data: Partial<FinancialYearFormData>): Promise<FinancialYear> => {
    const response = await api.put(`/financial-years/${id}`, data);
    return response.data;
  },

  // Delete a financial year
  deleteFinancialYear: async (id: string): Promise<void> => {
    await api.delete(`/financial-years/${id}`);
  },

  // Set a financial year as current
  setCurrentFinancialYear: async (id: string): Promise<FinancialYear> => {
    const response = await api.post(`/financial-years/${id}/set-current`);
    return response.data;
  },

  // Close a financial year
  closeFinancialYear: async (id: string, notes?: string): Promise<FinancialYear> => {
    const response = await api.post(`/financial-years/${id}/close`, { notes });
    return response.data;
  },

  // Reopen a financial year
  reopenFinancialYear: async (id: string, notes?: string): Promise<FinancialYear> => {
    const response = await api.post(`/financial-years/${id}/reopen`, { notes });
    return response.data;
  },

  // Get financial year statistics
  getFinancialYearStats: async (): Promise<FinancialYearStats> => {
    const response = await api.get('/financial-years/stats');
    return response.data;
  },

  // Export financial years
  exportFinancialYears: async (format: 'excel' | 'pdf', filters?: FinancialYearFilters): Promise<Blob> => {
    try {
      const response = await api.get(`/financial-years/export/${format}`, {
        params: filters,
        responseType: 'blob'
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      if (!(response.data instanceof Blob)) {
        throw new Error('Invalid response format - expected Blob');
      }
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}; 