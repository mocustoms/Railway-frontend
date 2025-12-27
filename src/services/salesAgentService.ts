import api from './api';
import { SalesAgent, SalesAgentFormData, SalesAgentFilters, SalesAgentSortConfig, SalesAgentStats, PaginatedResponse } from '../types';

export const salesAgentService = {
  // Get all sales agents with pagination, search, and filters
  getSalesAgents: async (
    page: number = 1,
    limit: number = 10,
    filters: SalesAgentFilters = { search: '', status: 'all' },
    sortConfig: SalesAgentSortConfig = { key: 'created_at', direction: 'desc' }
  ): Promise<PaginatedResponse<SalesAgent>> => {
    const params = {
      page,
      limit,
      search: filters.search,
      status: filters.status === 'all' ? undefined : filters.status,
      sort_by: sortConfig.key,
      sort_order: sortConfig.direction
    };

    const response = await api.get('/sales-agents', { params });
    return response.data;
  },

  // Get single sales agent
  getSalesAgent: async (id: string): Promise<SalesAgent> => {
    const response = await api.get(`/sales-agents/${id}`);
    return response.data.data;
  },

  // Create sales agent
  createSalesAgent: async (salesAgentData: SalesAgentFormData): Promise<SalesAgent> => {
    const formData = new FormData();
    
    // Append basic fields
    formData.append('agentNumber', salesAgentData.agentNumber);
    formData.append('fullName', salesAgentData.fullName);
    formData.append('status', salesAgentData.status);
    
    // Append photo if provided
    if (salesAgentData.photo instanceof File) {
      formData.append('photo', salesAgentData.photo);
    }

    const response = await api.post('/sales-agents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Update sales agent
  updateSalesAgent: async (id: string, salesAgentData: Partial<SalesAgentFormData>): Promise<SalesAgent> => {
    const formData = new FormData();
    
    // Append basic fields
    if (salesAgentData.agentNumber) formData.append('agentNumber', salesAgentData.agentNumber);
    if (salesAgentData.fullName) formData.append('fullName', salesAgentData.fullName);
    if (salesAgentData.status) formData.append('status', salesAgentData.status);
    
    // Append photo if provided
    if (salesAgentData.photo instanceof File) {
      formData.append('photo', salesAgentData.photo);
    }

    const response = await api.put(`/sales-agents/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Delete sales agent
  deleteSalesAgent: async (id: string): Promise<void> => {
    await api.delete(`/sales-agents/${id}`);
  },

  // Deactivate sales agent
  deactivateSalesAgent: async (id: string): Promise<SalesAgent> => {
    const response = await api.patch(`/sales-agents/${id}/deactivate`);
    return response.data.data;
  },

  // Check sales agent usage
  checkSalesAgentUsage: async (id: string): Promise<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  }> => {
    const response = await api.get(`/sales-agents/${id}/usage`);
    return response.data;
  },

  // Get sales agent statistics
  getSalesAgentStats: async (): Promise<SalesAgentStats> => {
    const response = await api.get('/sales-agents/stats');
    return response.data.data; // Extract data from the nested response structure
  },

  // Export to Excel
  exportToExcel: async (filters: SalesAgentFilters = { search: '', status: 'all' }): Promise<Blob> => {
    const response = await api.get('/sales-agents/export/excel', {
      params: {
        search: filters.search,
        status: filters.status === 'all' ? undefined : filters.status
      },
      responseType: 'blob'
    });
    return response.data;
  },

  // Export to PDF
  exportToPDF: async (filters: SalesAgentFilters = { search: '', status: 'all' }): Promise<Blob> => {
    const response = await api.get('/sales-agents/export/pdf', {
      params: {
        search: filters.search,
        status: filters.status === 'all' ? undefined : filters.status
      },
      responseType: 'blob'
    });
    return response.data;
  },

  // Upload photo
  uploadPhoto: async (id: string, photo: File): Promise<SalesAgent> => {
    const formData = new FormData();
    formData.append('photo', photo);

    const response = await api.post(`/sales-agents/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Get photo URL (deprecated - use imageUtils.getImageUrl instead)
  getPhotoUrl: (photoPath: string): string => {
    if (!photoPath) return '';
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    const serverBaseUrl = baseUrl.replace('/api', '');
    return `${serverBaseUrl}/uploads/sales-agent-photos/${photoPath}`;
  }
};

export default salesAgentService;
