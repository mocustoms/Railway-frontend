import api from './api';
import { ProductColor, ProductColorStats, ProductColorFilters, ProductColorSortConfig } from '../types';

export interface ProductColorListResponse {
  productColors: ProductColor[];
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  };
}

export interface ProductColorStatsResponse {
  stats: ProductColorStats;
}

class ProductColorService {
  // Get all product colors with pagination, search, and sorting
  async getProductColors(
    page: number = 1,
    limit: number = 25,
    filters?: ProductColorFilters,
    sort?: ProductColorSortConfig
  ): Promise<ProductColorListResponse> {
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

    if (sort?.column && sort?.direction) {
      params.append('sortBy', sort.column);
      params.append('sortOrder', sort.direction);
    }

    const response = await api.get(`/product-colors?${params}`);
    return response.data;
  }

  // Get product color by ID
  async getProductColor(id: string): Promise<ProductColor> {
    const response = await api.get(`/product-colors/${id}`);
    return response.data;
  }

  // Create new product color
  async createProductColor(productColorData: Partial<ProductColor>): Promise<ProductColor> {
    const response = await api.post('/product-colors', productColorData);
    return response.data;
  }

  // Update product color
  async updateProductColor(id: string, productColorData: Partial<ProductColor>): Promise<ProductColor> {
    const response = await api.put(`/product-colors/${id}`, productColorData);
    return response.data;
  }

  // Delete product color
  async deleteProductColor(id: string): Promise<void> {
    await api.delete(`/product-colors/${id}`);
  }

  // Toggle product color status
  async toggleProductColorStatus(id: string, isActive: boolean): Promise<ProductColor> {
    const response = await api.put(`/product-colors/${id}/toggle-status`, { is_active: isActive });
    return response.data;
  }

  // Get product color statistics
  async getProductColorStats(): Promise<ProductColorStats> {
    const response = await api.get('/product-colors/stats/overview');
    return response.data.stats;
  }

  // Check if product color code is available
  async checkCodeAvailability(code: string, excludeId?: string): Promise<boolean> {
    const params = new URLSearchParams({ code });
    if (excludeId) {
      params.append('exclude_id', excludeId);
    }
    
    const response = await api.get(`/product-colors/check-code/availability?${params}`);
    return response.data.available;
  }

  // Export to Excel
  async exportToExcel(filters?: ProductColorFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/product-colors/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Export to PDF
  async exportToPDF(filters?: ProductColorFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/product-colors/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get active product colors (for dropdowns)
  async getActiveProductColors(): Promise<ProductColor[]> {
    const response = await api.get('/product-colors/active/list');
    return response.data;
  }
}

export const productColorService = new ProductColorService();
