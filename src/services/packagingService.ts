import { api } from './api';
import { Packaging, PackagingStats, PackagingFilters, PackagingSortConfig } from '../types';

export interface PackagingListResponse {
  success: boolean;
  data: Packaging[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PackagingStatsResponse {
  stats: PackagingStats;
}

class PackagingService {
  // Get all packaging with filters, pagination, and sorting
  async getPackaging(
    page: number = 1,
    pageSize: number = 25,
    filters?: PackagingFilters,
    sort?: PackagingSortConfig
  ): Promise<PackagingListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());

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

    const response = await api.get(`/packaging?${params}`);
    return response.data;
  }

  // Get packaging by ID
  async getPackagingById(id: string): Promise<Packaging> {
    const response = await api.get(`/packaging/${id}`);
    return response.data.data;
  }

  // Create new packaging
  async createPackaging(packagingData: Partial<Packaging>): Promise<Packaging> {
    const response = await api.post('/packaging', packagingData);
    return response.data.data;
  }

  // Update packaging
  async updatePackaging(id: string, packagingData: Partial<Packaging>): Promise<Packaging> {
    const response = await api.put(`/packaging/${id}`, packagingData);
    return response.data.data;
  }

  // Delete packaging
  async deletePackaging(id: string): Promise<void> {
    await api.delete(`/packaging/${id}`);
  }

  // Get packaging statistics
  async getPackagingStats(): Promise<PackagingStats> {
    try {
      const response = await api.get('/packaging/stats/summary');
      return {
        totalPackaging: response.data.data.total || 0,
        activePackaging: response.data.data.active || 0,
        inactivePackaging: response.data.data.inactive || 0,
        lastUpdate: new Date().toLocaleDateString()
      };
    } catch (error: any) {
      return {
        totalPackaging: 0,
        activePackaging: 0,
        inactivePackaging: 0,
        lastUpdate: 'Not available yet'
      };
    }
  }

  // Check if packaging code is available
  async checkCodeAvailability(code: string, excludeId?: string): Promise<boolean> {
    const params = new URLSearchParams({ code });
    if (excludeId) {
      params.append('exclude_id', excludeId);
    }
    
    const response = await api.get(`/packaging/check-code/availability?${params}`);
    return response.data.available;
  }

  // Export to Excel
  async exportToExcel(filters?: PackagingFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/packaging/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: PackagingFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/packaging/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get active packaging (for dropdowns)
  async getActivePackaging(): Promise<Packaging[]> {
    const response = await api.get('/packaging/active/list');
    return response.data.data;
  }

  // Check if packaging is being used
  async checkPackagingUsage(id: string): Promise<{
    isUsed: boolean;
    usageCount: number;
    unitUsageCount: number;
    defaultPackagingUsageCount: number;
    message: string;
  }> {
    try {
      const response = await api.get(`/packaging/${id}/usage`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Deactivate packaging
  async deactivatePackaging(id: string): Promise<Packaging> {
    try {
      const response = await api.put(`/packaging/${id}/deactivate`);
      return response.data.packaging;
    } catch (error) {
      throw error;
    }
  }
}

export const packagingService = new PackagingService();
