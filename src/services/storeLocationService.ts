import { api } from './api';
import { StoreLocation, StoreLocationStats, StoreLocationFilters, StoreLocationSortConfig } from '../types';

export interface StoreLocationListResponse {
  success: boolean;
  data: StoreLocation[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface StoreLocationStatsResponse {
  stats: StoreLocationStats;
}

class StoreLocationService {
  // Get all store locations with filters, pagination, and sorting
  async getStoreLocations(
    page: number = 1,
    pageSize: number = 10,
    filters?: StoreLocationFilters,
    sort?: StoreLocationSortConfig
  ): Promise<StoreLocationListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.store_id) {
      params.append('store_id', filters.store_id);
    }

    if (sort?.column && sort?.direction) {
      params.append('sortBy', sort.column);
      params.append('sortOrder', sort.direction);
    }

    const response = await api.get(`/product-store-locations?${params}`);
    
    // Transform backend response to match frontend expectations
    const backendData = response.data;
    return {
      success: true,
      data: backendData.storeLocations || [],
      pagination: {
        currentPage: backendData.pagination?.page || page,
        totalPages: backendData.pagination?.totalPages || 1,
        totalItems: backendData.pagination?.totalItems || 0,
        itemsPerPage: backendData.pagination?.limit || pageSize,
        hasNextPage: backendData.pagination?.endIndex < backendData.pagination?.totalItems,
        hasPrevPage: page > 1
      }
    };
  }

  // Get store location by ID
  async getStoreLocationById(id: string): Promise<StoreLocation> {
    const response = await api.get(`/product-store-locations/${id}`);
    return response.data;
  }

  // Create new store location
  async createStoreLocation(storeLocationData: Partial<StoreLocation>): Promise<StoreLocation> {
    const response = await api.post('/product-store-locations', storeLocationData);
    return response.data;
  }

  // Update store location
  async updateStoreLocation(id: string, storeLocationData: Partial<StoreLocation>): Promise<StoreLocation> {
    const response = await api.put(`/product-store-locations/${id}`, storeLocationData);
    return response.data;
  }

  // Delete store location
  async deleteStoreLocation(id: string): Promise<void> {
    await api.delete(`/product-store-locations/${id}`);
  }

  // Get store location statistics
  async getStoreLocationStats(): Promise<StoreLocationStats> {
    try {
      const response = await api.get('/product-store-locations/stats/summary');
      return {
        totalLocations: response.data.data.total || 0,
        activeLocations: response.data.data.active || 0,
        inactiveLocations: response.data.data.inactive || 0,
        lastUpdate: new Date().toLocaleDateString()
      };
    } catch (error: any) {
      return {
        totalLocations: 0,
        activeLocations: 0,
        inactiveLocations: 0,
        lastUpdate: 'Not available yet'
      };
    }
  }

  // Get locations by store ID
  async getLocationsByStore(storeId: string): Promise<StoreLocation[]> {
    const response = await api.get(`/product-store-locations/store/${storeId}`);
    return response.data;
  }

  // Get active store locations for dropdowns
  async getActiveStoreLocations(): Promise<any[]> {
    try {
      const response = await api.get('/product-store-locations/active');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Export to Excel
  async exportToExcel(filters?: StoreLocationFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.store_id) {
      params.append('store_id', filters.store_id);
    }

    const response = await api.get(`/product-store-locations/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: StoreLocationFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.store_id) {
      params.append('store_id', filters.store_id);
    }

    const response = await api.get(`/product-store-locations/export/pdf?${params}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Check if store location is being used
  async checkStoreLocationUsage(id: string): Promise<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  }> {
    try {
      const response = await api.get(`/product-store-locations/${id}/usage`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Deactivate store location
  async deactivateStoreLocation(id: string): Promise<StoreLocation> {
    try {
      const response = await api.put(`/product-store-locations/${id}/deactivate`);
      return response.data.storeLocation;
    } catch (error) {
      throw error;
    }
  }
}

export const storeLocationService = new StoreLocationService();
