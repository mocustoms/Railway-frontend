import { apiService } from './api';
import { 
  PhysicalInventory, 
  AdjustmentReason,
  PaginatedResponse 
} from '../types';

export const inventoryService = {
  // Physical Inventory CRUD operations
  getPhysicalInventories: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    storeId?: number;
    status?: string;
  }): Promise<PaginatedResponse<PhysicalInventory>> => {
    const response = await apiService.get<PaginatedResponse<PhysicalInventory>>('/physical-inventories', { params });
    return response.data!;
  },

  getPhysicalInventory: async (id: number): Promise<PhysicalInventory> => {
    const response = await apiService.get<PhysicalInventory>(`/physical-inventories/${id}`);
    return response.data!;
  },

  createPhysicalInventory: async (inventoryData: Partial<PhysicalInventory>): Promise<PhysicalInventory> => {
    const response = await apiService.post<PhysicalInventory>('/physical-inventories', inventoryData);
    return response.data!;
  },

  updatePhysicalInventory: async (id: number, inventoryData: Partial<PhysicalInventory>): Promise<PhysicalInventory> => {
    const response = await apiService.put<PhysicalInventory>(`/physical-inventories/${id}`, inventoryData);
    return response.data!;
  },

  deletePhysicalInventory: async (id: number): Promise<void> => {
    await apiService.delete(`/physical-inventories/${id}`);
  },

  // Physical Inventory Status Management
  startPhysicalInventory: async (id: number): Promise<PhysicalInventory> => {
    const response = await apiService.patch<PhysicalInventory>(`/physical-inventories/${id}/start`);
    return response.data!;
  },

  completePhysicalInventory: async (id: number): Promise<PhysicalInventory> => {
    const response = await apiService.patch<PhysicalInventory>(`/physical-inventories/${id}/complete`);
    return response.data!;
  },

  approvePhysicalInventory: async (id: number): Promise<PhysicalInventory> => {
    const response = await apiService.patch<PhysicalInventory>(`/physical-inventories/${id}/approve`);
    return response.data!;
  },

  rejectPhysicalInventory: async (id: number, reason?: string): Promise<PhysicalInventory> => {
    const response = await apiService.patch<PhysicalInventory>(`/physical-inventories/${id}/reject`, { reason });
    return response.data!;
  },

  // Stock Balance
  getStockBalance: async (params?: {
    storeId?: number;
    productId?: number;
    categoryId?: number;
    lowStock?: boolean;
  }): Promise<any[]> => {
    const response = await apiService.get<any[]>('/stock-balance', { params });
    return response.data!;
  },

  getStockBalanceByProduct: async (productId: number, storeId?: number): Promise<any> => {
    const response = await apiService.get<any>(`/stock-balance/product/${productId}`, { 
      params: { storeId } 
    });
    return response.data!;
  },

  getStockBalanceByStore: async (storeId: number): Promise<any[]> => {
    const response = await apiService.get<any[]>(`/stock-balance/store/${storeId}`);
    return response.data!;
  },

  // Adjustment Reasons
  getAdjustmentReasons: async (): Promise<AdjustmentReason[]> => {
    const response = await apiService.get<AdjustmentReason[]>('/adjustment-reasons');
    return response.data!;
  },

  createAdjustmentReason: async (reasonData: Partial<AdjustmentReason>): Promise<AdjustmentReason> => {
    const response = await apiService.post<AdjustmentReason>('/adjustment-reasons', reasonData);
    return response.data!;
  },

  updateAdjustmentReason: async (id: number, reasonData: Partial<AdjustmentReason>): Promise<AdjustmentReason> => {
    const response = await apiService.put<AdjustmentReason>(`/adjustment-reasons/${id}`, reasonData);
    return response.data!;
  },

  deleteAdjustmentReason: async (id: number): Promise<void> => {
    await apiService.delete(`/adjustment-reasons/${id}`);
  },

  // Stock Movement History
  getStockMovementHistory: async (params?: {
    page?: number;
    limit?: number;
    productId?: number;
    storeId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<PaginatedResponse<any>> => {
    const response = await apiService.get<PaginatedResponse<any>>('/stock-movements', { params });
    return response.data!;
  },

  // Reports
  getInventoryReport: async (params?: {
    storeId?: number;
    startDate?: string;
    endDate?: string;
    categoryId?: number;
  }): Promise<any> => {
    const response = await apiService.get<any>('/inventory/report', { params });
    return response.data!;
  },

  exportStockBalance: async (filters?: any): Promise<Blob> => {
    const response = await apiService.get('/stock-balance/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  exportStockMovements: async (filters?: any): Promise<Blob> => {
    const response = await apiService.get('/stock-movements/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};

export default inventoryService; 