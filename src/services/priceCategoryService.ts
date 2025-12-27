import { api } from './api';
import { PriceCategory, PriceCategoryFormData, PaginatedPriceCategoryResponse } from '../types';

// Price Category Stats interface
export interface PriceCategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  increaseCategories: number;
  decreaseCategories: number;
  scheduledCategories: number;
  upcomingScheduledCategories: number;
  lastUpdate: string;
}

export interface PriceCategoryFilters {
  search?: string;
  status?: string;
  changeType?: string;
  scheduledType?: string;
}

export const priceCategoryService = {
  // Get all price categories with pagination and filters
  getPriceCategories: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    changeType?: string;
    scheduledType?: string;
  }): Promise<PaginatedPriceCategoryResponse> => {
    const response = await api.get<PaginatedPriceCategoryResponse>('/price-categories', { params });
    return response.data;
  },

  // Get single price category by ID
  getPriceCategory: async (id: string): Promise<PriceCategory> => {
    const response = await api.get<PriceCategory>(`/price-categories/${id}`);
    return response.data;
  },

  // Create new price category
  createPriceCategory: async (data: PriceCategoryFormData): Promise<PriceCategory> => {
    const response = await api.post<PriceCategory>('/price-categories', data);
    return response.data;
  },

  // Update existing price category
  updatePriceCategory: async (id: string, data: Partial<PriceCategoryFormData>): Promise<PriceCategory> => {
    const response = await api.put<PriceCategory>(`/price-categories/${id}`, data);
    return response.data;
  },

  // Delete price category (soft delete)
  deletePriceCategory: async (id: string): Promise<void> => {
    await api.delete(`/price-categories/${id}`);
  },

  // Restore price category (reactivate)
  restorePriceCategory: async (id: string): Promise<void> => {
    await api.put(`/price-categories/${id}/restore`);
  },

  // Hard delete price category (permanent removal)
  hardDeletePriceCategory: async (id: string): Promise<void> => {
    await api.delete(`/price-categories/${id}/permanent`);
  },

  // Get price category statistics
  getPriceCategoryStats: async (): Promise<PriceCategoryStats> => {
    try {
      const response = await api.get('/price-categories/stats');
      return response.data;
    } catch (error: any) {
      // Fallback data while backend is being developed
      return {
        totalCategories: 0,
        activeCategories: 0,
        inactiveCategories: 0,
        increaseCategories: 0,
        decreaseCategories: 0,
        scheduledCategories: 0,
        upcomingScheduledCategories: 0,
        lastUpdate: 'Not available yet'
      };
    }
  },

  // Export to Excel
  exportToExcel: async (filters?: PriceCategoryFilters): Promise<Blob> => {
    const response = await api.get('/price-categories/export/excel', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  // Export to PDF
  exportToPDF: async (filters?: PriceCategoryFilters): Promise<Blob> => {
    const response = await api.get('/price-categories/export/pdf', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  // Deactivate a price category (for used categories)
  deactivatePriceCategory: async (id: string): Promise<PriceCategory> => {
    const response = await api.put<PriceCategory>(`/price-categories/${id}/deactivate`);
    if (!response || !response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  },

  // Check if price category is being used
  checkPriceCategoryUsage: async (id: string): Promise<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  }> => {
    const response = await api.get<{
      isUsed: boolean;
      usageCount: number;
      message: string;
    }>(`/price-categories/${id}/usage`);
    if (!response || !response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }
};
