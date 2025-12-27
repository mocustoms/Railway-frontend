import api from './api';
import { ProductModel, ProductModelFormData, ProductModelListResponse, ProductModelStats, ProductModelFilters } from '../types/productModel';

class ProductModelService {
  // Get all product models with pagination and filters
  async getProductModels(filters: ProductModelFilters = {}): Promise<ProductModelListResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/product-models?${params}`);
    return response.data;
  }

  // Get a single product model by ID
  async getProductModel(id: string): Promise<ProductModel> {
    const response = await api.get(`/product-models/${id}`);
    return response.data;
  }

  // Create a new product model
  async createProductModel(data: ProductModelFormData): Promise<ProductModel> {
    const response = await api.post('/product-models', data);
    return response.data;
  }

  // Update an existing product model
  async updateProductModel(id: string, data: Partial<ProductModelFormData>): Promise<ProductModel> {
    const response = await api.put(`/product-models/${id}`, data);
    return response.data;
  }

  // Delete a product model
  async deleteProductModel(id: string): Promise<void> {
    await api.delete(`/product-models/${id}`);
  }

  // Get product model statistics
  async getProductModelStats(): Promise<ProductModelStats> {
    const response = await api.get('/product-models/stats/overview');
    return response.data;
  }

  // Get active product models (for dropdowns)
  async getActiveProductModels(): Promise<ProductModel[]> {
    const response = await api.get('/product-models/active/list');
    return response.data;
  }

  // Check if product model code is available
  async checkCodeAvailability(code: string, excludeId?: string): Promise<boolean> {
    const params = new URLSearchParams({ code });
    if (excludeId) {
      params.append('exclude_id', excludeId);
    }
    
    const response = await api.get(`/product-models/check-code/availability?${params}`);
    return response.data.available;
  }

  // Export to Excel
  async exportToExcel(filters: ProductModelFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/product-models/export/excel?${params}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Export to PDF
  async exportToPdf(filters: ProductModelFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    const response = await api.get(`/product-models/export/pdf?${params}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Upload logo
  async uploadLogo(file: File): Promise<{ logo: string }> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post('/product-models/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // The backend returns filePath, but we need to return logo for consistency
    return { logo: response.data.filePath };
  }

  // Check if product model is being used
  async checkProductModelUsage(id: string): Promise<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  }> {
    try {
      const response = await api.get(`/product-models/${id}/usage`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Deactivate product model
  async deactivateProductModel(id: string): Promise<ProductModel> {
    try {
      const response = await api.put(`/product-models/${id}/deactivate`);
      return response.data.productModel;
    } catch (error) {
      throw error;
    }
  }
}

export default new ProductModelService();
