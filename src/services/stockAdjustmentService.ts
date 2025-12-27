import { StockAdjustment as StockAdjustmentType, StockAdjustmentStats, StockAdjustmentFilters, StockAdjustmentSortConfig, StockAdjustmentFormData, PaginatedStockAdjustmentResponse } from '../types';
import api from './api';

class StockAdjustmentService {
  private static readonly BASE_URL = '/stock-adjustments';

  async getStockAdjustments(
    page: number = 1,
    limit: number = 10,
    filters: StockAdjustmentFilters = { search: '', status: 'all', adjustmentType: 'all' },
    sortConfig: StockAdjustmentSortConfig = { field: 'created_at', direction: 'desc' }
  ): Promise<PaginatedStockAdjustmentResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortConfig.field,
      sortOrder: sortConfig.direction,
      ...(filters.search && { search: filters.search }),
      ...(filters.status && filters.status !== 'all' && { status: filters.status }),
      ...(filters.storeId && { store_id: filters.storeId }),
      ...(filters.startDate && { start_date: filters.startDate }),
      ...(filters.endDate && { end_date: filters.endDate })
    });

    const response = await api.get(`${StockAdjustmentService.BASE_URL}?${params}`);
    return response.data;
  }

  async getStockAdjustment(id: string): Promise<StockAdjustmentType> {
    const response = await api.get(`${StockAdjustmentService.BASE_URL}/${id}`);
    return response.data;
  }

  async createStockAdjustment(data: StockAdjustmentFormData): Promise<StockAdjustmentType> {
    const response = await api.post(StockAdjustmentService.BASE_URL, data);
    return response.data;
  }

  async updateStockAdjustment(id: string, data: Partial<StockAdjustmentType>): Promise<StockAdjustmentType> {
    const response = await api.put(`${StockAdjustmentService.BASE_URL}/${id}`, data);
    return response.data;
  }

  async deleteStockAdjustment(id: string): Promise<void> {
    await api.delete(`${StockAdjustmentService.BASE_URL}/${id}`);
  }

  async submitStockAdjustment(id: string): Promise<StockAdjustmentType> {
    const response = await api.patch(`${StockAdjustmentService.BASE_URL}/${id}/submit`);
    return response.data;
  }

  async approveStockAdjustment(id: string): Promise<StockAdjustmentType> {
    const response = await api.patch(`${StockAdjustmentService.BASE_URL}/${id}/approve`);
    return response.data;
  }

  async rejectStockAdjustment(id: string, reason: string): Promise<StockAdjustmentType> {
    const response = await api.patch(`${StockAdjustmentService.BASE_URL}/${id}/reject`, { reason });
    return response.data;
  }

  async getStockAdjustmentStats(): Promise<StockAdjustmentStats> {
    const response = await api.get(`${StockAdjustmentService.BASE_URL}/stats/overview`);
    return response.data;
  }

  async exportToExcel(filters: StockAdjustmentFilters = { search: '', status: 'all', adjustmentType: 'all' }): Promise<Blob> {
    const params = new URLSearchParams({
      ...(filters.search && { search: filters.search }),
      ...(filters.status && filters.status !== 'all' && { status: filters.status }),
      ...(filters.storeId && { store_id: filters.storeId }),
      ...(filters.startDate && { start_date: filters.startDate }),
      ...(filters.endDate && { end_date: filters.endDate })
    });

    const response = await api.get(`${StockAdjustmentService.BASE_URL}/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportToPDF(filters: StockAdjustmentFilters = { search: '', status: 'all', adjustmentType: 'all' }): Promise<Blob> {
    const params = new URLSearchParams({
      ...(filters.search && { search: filters.search }),
      ...(filters.status && filters.status !== 'all' && { status: filters.status }),
      ...(filters.storeId && { store_id: filters.storeId }),
      ...(filters.startDate && { start_date: filters.startDate }),
      ...(filters.endDate && { end_date: filters.endDate })
    });

    const response = await api.get(`${StockAdjustmentService.BASE_URL}/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Additional methods for dropdowns and related data

  async getAdjustmentReasons(): Promise<Array<{ id: string; name: string }>> {
    const response = await api.get('/adjustment-reasons');
    return response.data.map((reason: any) => ({
      id: reason.id,
      name: reason.name
    }));
  }

  async getProducts(searchTerm?: string): Promise<Array<{ id: string; name: string; code: string; currentQuantity: number }>> {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    
    const response = await api.get(`/products?${params}`);
    return response.data.map((product: any) => ({
      id: product.id,
      name: product.name,
      code: product.code,
      currentQuantity: product.currentQuantity || 0
    }));
  }

  async getProductDetails(productId: string): Promise<{
    id: string;
    name: string;
    code: string;
    currentQuantity: number;
    unitCost: number;
    serialNumbers?: string[];
    expiryDates?: string[];
  }> {
    const response = await api.get(`/products/${productId}`);
    return {
      id: response.data.id,
      name: response.data.name,
      code: response.data.code,
      currentQuantity: response.data.currentQuantity || 0,
      unitCost: response.data.unitCost || 0,
      serialNumbers: response.data.serialNumbers || [],
      expiryDates: response.data.expiryDates || []
    };
  }
}

export const stockAdjustmentService = new StockAdjustmentService();
