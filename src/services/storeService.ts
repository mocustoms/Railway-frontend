import api from './api';
import { Store, PaginatedResponse, StoreStats, StoreType } from '../types';

export const storeService = {
  // Get all stores with pagination, search, and filters
  getStores: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    store_type?: string;
    status?: 'all' | 'active' | 'inactive';
    has_manufacturing?: boolean;
    has_storage?: boolean;
    has_temperature_control?: boolean;
  }): Promise<PaginatedResponse<Store>> => {
    const response = await api.get(`/stores?${new URLSearchParams(params as any)}`);
    return response.data;
  },

  // Get single store
  getStore: async (id: string): Promise<Store> => {
    const response = await api.get(`/stores/${id}`);
    // Backend returns { success: true, store: {...} }
    return response.data.store || response.data;
  },

  // Create store
  createStore: async (storeData: Partial<Store>): Promise<Store> => {
    const response = await api.post('/stores', storeData);
    return response.data;
  },

  // Update store
  updateStore: async (id: string, storeData: Partial<Store>): Promise<Store> => {
    const response = await api.put(`/stores/${id}`, storeData);
    return response.data;
  },

  // Delete store
  deleteStore: async (id: string): Promise<void> => {
    await api.delete(`/stores/${id}`);
  },

  // Toggle store status
  toggleStoreStatus: async (id: string): Promise<Store> => {
    const response = await api.patch(`/stores/${id}/toggle-status`);
    return response.data;
  },

  // Get store statistics
  getStoreStats: async (): Promise<StoreStats> => {
    const response = await api.get('/stores/statistics');
    return response.data;
  },

  // Get store types
  getStoreTypes: async (): Promise<StoreType[]> => {
    const response = await api.get('/stores/types');
    return response.data.storeTypes;
  },

  // Get active price categories for dropdowns
  getActivePriceCategories: async (): Promise<{ id: string; code: string; name: string; percentage_change: number; price_change_type: string }[]> => {
    const response = await api.get('/price-categories', { 
      params: { 
        page: 1, 
        limit: 1000,
        status: 'active'
      } 
    });
    return response.data.priceCategories || [];
  },

  // Get active stores for dropdowns
  getActiveStores: async (): Promise<{ id: string; name: string; location: string }[]> => {
    const response = await api.get('/stores/active');
    return response.data.stores;
  },

  // Export to Excel
  exportToExcel: async (params?: {
    search?: string;
    store_type?: string;
    status?: 'all' | 'active' | 'inactive';
    has_manufacturing?: boolean;
    has_storage?: boolean;
    has_temperature_control?: boolean;
  }): Promise<Blob> => {
    const response = await api.get(`/stores/export/excel?${new URLSearchParams(params as any)}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export to PDF
  exportToPdf: async (params?: {
    search?: string;
    store_type?: string;
    status?: 'all' | 'active' | 'inactive';
    has_manufacturing?: boolean;
    has_storage?: boolean;
    has_temperature_control?: boolean;
  }): Promise<Blob> => {
    const response = await api.get(`/stores/export/pdf?${new URLSearchParams(params as any)}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get user stores
  getUserStores: async (): Promise<Store[]> => {
    const response = await api.get('/stores/user');
    return response.data;
  },

  // Set current store
  setCurrentStore: async (storeId: string): Promise<void> => {
    await api.post('/stores/set-current', { storeId });
  },

  // Get store inventory summary
  getStoreInventorySummary: async (storeId: string): Promise<any> => {
    const response = await api.get(`/stores/${storeId}/inventory-summary`);
    return response.data;
  },

  // Import functionality
  // Get CSV template
  getImportTemplate: async (): Promise<Blob> => {
    const response = await api.get('/stores/template', {
      responseType: 'blob'
    });
    return response.data;
  },

  // Preview import data
  previewImport: async (formData: FormData): Promise<{
    data: any[];
    validation: {
      totalRows: number;
      validRows: number;
      invalidRows: number;
      errors: any[];
    };
  }> => {
    const response = await api.post('/stores/review', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Final import
  importStores: async (stores: any[]): Promise<{
    message: string;
    importedCount: number;
  }> => {
    const response = await api.post('/stores/import-final', { stores });
    return response.data;
  },
};

export default storeService; 