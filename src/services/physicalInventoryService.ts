import { api } from './api';
import { PhysicalInventory as PhysicalInventoryType, PhysicalInventoryFormData, PhysicalInventoryFilters, PhysicalInventoryStats } from '../types';

class PhysicalInventoryService {
  private static BASE_URL = '/physical-inventories';

  async getPhysicalInventories(
    page: number = 1,
    limit: number = 10,
    filters: PhysicalInventoryFilters = { search: '', status: 'all', storeId: '', startDate: '', endDate: '' },
    sortConfig?: { field: string; direction: 'asc' | 'desc' }
  ): Promise<{
    physicalInventories: PhysicalInventoryType[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      pageSize: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters.search && { search: filters.search }),
      ...(filters.status && filters.status !== 'all' && { status: filters.status }),
      ...(filters.storeId && { store_id: filters.storeId }),
      ...(filters.startDate && { start_date: filters.startDate }),
      ...(filters.endDate && { end_date: filters.endDate }),
      ...(sortConfig && { sort_by: sortConfig.field }),
      ...(sortConfig && { sort_order: sortConfig.direction })
    });

    const response = await api.get(`${PhysicalInventoryService.BASE_URL}?${params}`);
    // Backend returns { success: true, data: [...], pagination: {...} }
    // Frontend expects { physicalInventories: [...], pagination: {...} }
    return {
      physicalInventories: response.data.data || [],
      pagination: response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 10
      }
    };
  }

  async getPhysicalInventory(id: string): Promise<PhysicalInventoryType> {
    const response = await api.get(`${PhysicalInventoryService.BASE_URL}/${id}`);
    return response.data.data;
  }

  // Create Physical Inventory as Draft (new endpoint)
  async createPhysicalInventoryDraft(data: PhysicalInventoryFormData): Promise<PhysicalInventoryType> {
    const response = await api.post(`${PhysicalInventoryService.BASE_URL}/draft`, data);
    return response.data.data;
  }

  // Legacy method for backward compatibility
  async createPhysicalInventory(data: PhysicalInventoryFormData): Promise<PhysicalInventoryType> {
    return this.createPhysicalInventoryDraft(data);
  }

  async updatePhysicalInventory(id: string, data: PhysicalInventoryFormData): Promise<PhysicalInventoryType> {
    try {
      const response = await api.put(`${PhysicalInventoryService.BASE_URL}/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async deletePhysicalInventory(id: string): Promise<void> {
    await api.delete(`${PhysicalInventoryService.BASE_URL}/${id}`);
  }

  async submitPhysicalInventory(id: string): Promise<PhysicalInventoryType> {
    const response = await api.patch(`${PhysicalInventoryService.BASE_URL}/${id}/submit`);
    return response.data.data;
  }

  async approvePhysicalInventory(id: string, approvalNotes?: string): Promise<PhysicalInventoryType> {
    const response = await api.patch(`${PhysicalInventoryService.BASE_URL}/${id}/approve`, {
      approval_notes: approvalNotes
    });
    return response.data.data;
  }

  async rejectPhysicalInventory(id: string, rejectionReason: string): Promise<PhysicalInventoryType> {
    const response = await api.patch(`${PhysicalInventoryService.BASE_URL}/${id}/reject`, { 
      rejection_reason: rejectionReason 
    });
    return response.data.data;
  }

  async returnPhysicalInventoryForCorrection(id: string, returnReason: string): Promise<PhysicalInventoryType> {
    const response = await api.patch(`${PhysicalInventoryService.BASE_URL}/${id}/return`, { 
      return_reason: returnReason 
    });
    return response.data.data;
  }

  async acceptVariance(id: string, varianceData: {
    totalDeltaValue: number;
    positiveDeltaValue: number;
    negativeDeltaValue: number;
    notes?: string;
  }): Promise<PhysicalInventoryType> {
    const response = await api.patch(`${PhysicalInventoryService.BASE_URL}/${id}/accept-variance`, varianceData);
    return response.data.data;
  }

  async getPhysicalInventoryStats(): Promise<PhysicalInventoryStats> {
    const response = await api.get(`${PhysicalInventoryService.BASE_URL}/stats/overview`);
    return response.data.data;
  }

  // Item Management Methods
  async getPhysicalInventoryItems(physicalInventoryId: string): Promise<any[]> {
    const response = await api.get(`${PhysicalInventoryService.BASE_URL}/${physicalInventoryId}/items`);
    return response.data.data;
  }

  async addPhysicalInventoryItem(physicalInventoryId: string, itemData: any): Promise<any> {
    const response = await api.post(`${PhysicalInventoryService.BASE_URL}/${physicalInventoryId}/items`, itemData);
    return response.data.data;
  }

  async updatePhysicalInventoryItem(physicalInventoryId: string, itemId: string, itemData: any): Promise<any> {
    const response = await api.put(`${PhysicalInventoryService.BASE_URL}/${physicalInventoryId}/items/${itemId}`, itemData);
    return response.data.data;
  }

  async deletePhysicalInventoryItem(physicalInventoryId: string, itemId: string): Promise<void> {
    await api.delete(`${PhysicalInventoryService.BASE_URL}/${physicalInventoryId}/items/${itemId}`);
  }

  // Export methods (if needed in the future)
  async exportToExcel(filters: PhysicalInventoryFilters = { search: '', status: 'all', storeId: '', startDate: '', endDate: '' }): Promise<Blob> {
    const params = new URLSearchParams({
      ...(filters.search && { search: filters.search }),
      ...(filters.status && filters.status !== 'all' && { status: filters.status }),
      ...(filters.storeId && { store_id: filters.storeId }),
      ...(filters.startDate && { start_date: filters.startDate }),
      ...(filters.endDate && { end_date: filters.endDate })
    });

    const response = await api.get(`${PhysicalInventoryService.BASE_URL}/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportToPDF(filters: PhysicalInventoryFilters = { search: '', status: 'all', storeId: '', startDate: '', endDate: '' }): Promise<Blob> {
    const params = new URLSearchParams({
      ...(filters.search && { search: filters.search }),
      ...(filters.status && filters.status !== 'all' && { status: filters.status }),
      ...(filters.storeId && { store_id: filters.storeId }),
      ...(filters.startDate && { start_date: filters.startDate }),
      ...(filters.endDate && { end_date: filters.endDate })
    });

    const response = await api.get(`${PhysicalInventoryService.BASE_URL}/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadImportTemplate(): Promise<Blob> {
    const response = await api.get(`${PhysicalInventoryService.BASE_URL}/import-template`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
    return response.data;
  }

  // Validate imported items
  async validateItems(file: FormData, storeId?: string): Promise<{
    success: boolean;
    data: any[];
    errors: any[];
    summary: {
      totalRows: number;
      validRows: number;
      errorRows: number;
    };
  }> {
    for (const [key, value] of file.entries()) {
      }
    
    // Add store_id to FormData if provided
    if (storeId) {
      file.append('store_id', storeId);
      }
    
    const response = await api.post(`${PhysicalInventoryService.BASE_URL}/validate-items`, file, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }

  // Additional methods for dropdowns and related data

  async getAdjustmentReasons(): Promise<Array<{ id: string; name: string; adjustmentType: 'add' | 'deduct' }>> {
    const response = await api.get('/adjustment-reasons');
    return response.data.data || [];
  }

  async getStores(): Promise<Array<{ id: string; name: string }>> {
    const response = await api.get('/stores?status=active&limit=1000');
    return response.data.data || [];
  }

  async getCurrencies(): Promise<Array<{ id: string; name: string; code: string; symbol: string; is_default?: boolean }>> {
    const response = await api.get('/currencies?limit=1000');
    return response.data.currencies || [];
  }

  async getAccounts(): Promise<Array<{ id: string; name: string; code: string }>> {
    const response = await api.get('/accounts?limit=1000');
    return response.data.data || [];
  }

  // Get default system currency
  async getDefaultCurrency(): Promise<{ id: string; name: string; code: string; symbol: string } | null> {
    try {
      const currencies = await this.getCurrencies();
      const defaultCurrency = currencies.find(currency => currency.is_default);
      return defaultCurrency || currencies[0] || null;
    } catch (error) {
      return null;
    }
  }

  // Get products with store-specific stock
  async getProductsWithStock(storeId: string, searchTerm: string = '', filters: any = {}): Promise<any[]> {
    const params = new URLSearchParams({
      store_id: storeId,
      ...(searchTerm && { search: searchTerm }),
      ...(filters.category_id && { category_id: filters.category_id }),
      ...(filters.brand_id && { brand_id: filters.brand_id }),
      ...(filters.supplier_id && { supplier_id: filters.supplier_id }),
      ...(filters.has_stock !== undefined && { has_stock: filters.has_stock.toString() }),
      limit: '1000'
    });

    const response = await api.get(`/products/with-stock?${params}`);
    return response.data.data || [];
  }

  // Calculate item adjustments based on counted vs current quantity
  calculateItemAdjustments(currentQuantity: number, countedQuantity: number): {
    adjustment_in_quantity: number;
    adjustment_out_quantity: number;
    new_stock: number;
  } {
    const difference = countedQuantity - currentQuantity;
    
    return {
      adjustment_in_quantity: difference > 0 ? difference : 0,
      adjustment_out_quantity: difference < 0 ? Math.abs(difference) : 0,
      new_stock: countedQuantity
    };
  }

  // Calculate item total value
  calculateItemValue(quantity: number, unitCost: number, exchangeRate: number = 1): {
    total_value: number;
    equivalent_amount: number;
  } {
    const totalValue = quantity * unitCost;
    const equivalentAmount = totalValue * exchangeRate;

    return {
      total_value: totalValue,
      equivalent_amount: equivalentAmount
    };
  }
}

export const physicalInventoryService = new PhysicalInventoryService();
