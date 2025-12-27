import { api } from './api';
import { 
  Product, 
  ProductFormData, 
  ProductStats, 
  ProductFilters, 
  ProductSortConfig, 
  PaginatedProductResponse,
  ProductRawMaterial,
  ProductRawMaterialFormData,
  ProductPriceCategory,
  ProductStore
} from '../types';

// Product Catalog Service
export const productCatalogService = {
  // Get products with pagination, search, and filters
  async getProducts(
    page: number = 1,
    limit: number = 10,
    filters: ProductFilters = { search: '', status: 'all' },
    sortConfig: ProductSortConfig = { column: 'created_at', direction: 'desc' }
  ): Promise<PaginatedProductResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: filters.search || '',
      status: filters.status || 'all'
    });

    // Add optional filters
    if (filters.product_type) params.append('product_type', filters.product_type);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.brand_id) params.append('brand_id', filters.brand_id);
    if (filters.manufacturer_id) params.append('manufacturer_id', filters.manufacturer_id);
    if (filters.model_id) params.append('model_id', filters.model_id);
    if (filters.color_id) params.append('color_id', filters.color_id);
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.unit_id) params.append('unit_id', filters.unit_id);
    
    // Add boolean filters
    if (filters.lowStock) params.append('lowStock', 'true');
    if (filters.expiring) params.append('expiring', 'true');
    if (filters.has_image) params.append('has_image', 'true');
    if (filters.track_serial_number) params.append('track_serial_number', 'true');
    if (filters.price_tax_inclusive) params.append('price_tax_inclusive', 'true');

    // Add range filters
    if (filters.price_range?.min !== undefined) params.append('price_range_min', filters.price_range.min.toString());
    if (filters.price_range?.max !== undefined) params.append('price_range_max', filters.price_range.max.toString());
    if (filters.cost_range?.min !== undefined) params.append('cost_range_min', filters.cost_range.min.toString());
    if (filters.cost_range?.max !== undefined) params.append('cost_range_max', filters.cost_range.max.toString());
    if (filters.stock_range?.min !== undefined) params.append('stock_range_min', filters.stock_range.min.toString());
    if (filters.stock_range?.max !== undefined) params.append('stock_range_max', filters.stock_range.max.toString());

    // Add date range filters
    if (filters.created_date_range?.from) params.append('created_date_from', filters.created_date_range.from);
    if (filters.created_date_range?.to) params.append('created_date_to', filters.created_date_range.to);
    if (filters.updated_date_range?.from) params.append('updated_date_from', filters.updated_date_range.from);
    if (filters.updated_date_range?.to) params.append('updated_date_to', filters.updated_date_range.to);

    // Add sorting
    params.append('sortBy', sortConfig.column);
    params.append('sortOrder', sortConfig.direction);

    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  // Get products by store for stock adjustment
  async getProductsByStore(
    storeId: string, 
    search: string = '', 
    limit: number = 50,
    filters?: {
      category_id?: string;
      brand_id?: string;
      manufacturer_id?: string;
      color_id?: string;
      model_id?: string;
      unit_id?: string;
    }
  ): Promise<Product[]> {
    const params = new URLSearchParams({
      search: search,
      limit: limit.toString()
    });

    // Add filter parameters if provided and not empty
    if (filters) {
      if (filters.category_id && String(filters.category_id).trim() !== '') {
        params.append('category_id', String(filters.category_id).trim());
      }
      if (filters.brand_id && String(filters.brand_id).trim() !== '') {
        params.append('brand_id', String(filters.brand_id).trim());
      }
      if (filters.manufacturer_id && String(filters.manufacturer_id).trim() !== '') {
        params.append('manufacturer_id', String(filters.manufacturer_id).trim());
      }
      if (filters.color_id && String(filters.color_id).trim() !== '') {
        params.append('color_id', String(filters.color_id).trim());
      }
      if (filters.model_id && String(filters.model_id).trim() !== '') {
        params.append('model_id', String(filters.model_id).trim());
      }
      if (filters.unit_id && String(filters.unit_id).trim() !== '') {
        params.append('unit_id', String(filters.unit_id).trim());
      }
    }

    const response = await api.get(`/products/store/${storeId}?${params.toString()}`);
    return response.data.data || [];
  },

  // Get single product by ID
  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create new product
  async createProduct(data: ProductFormData): Promise<Product> {
    // Check if there's an image file to upload
    const hasImage = data.image && data.image instanceof File;
    
    if (hasImage) {
      // Use FormData only if there's an image
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'image' && value instanceof File) {
            formData.append('image', value);
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Use JSON for non-image uploads to preserve cookies
      const response = await api.post('/products', data);
      return response.data;
    }
  },

  // Update existing product
  async updateProduct(id: string, data: ProductFormData, existingImagePath?: string | null): Promise<Product> {
    // Check if there's an image file to upload
    const hasImage = data.image && data.image instanceof File;
    
    if (hasImage) {
      // Use FormData only if there's an image
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'image' && value instanceof File) {
            formData.append('image', value);
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      // Always include existingImagePath when updating with new image
      // This helps backend know if there's an old image to delete
      if (existingImagePath) {
        formData.append('existingImagePath', existingImagePath);
      }

      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Use JSON for non-image uploads to preserve cookies
      // If there's an existing image path, include it in the data
      const updateData = { ...data };
      if (existingImagePath) {
        (updateData as any).existingImagePath = existingImagePath;
      }
      
      const response = await api.put(`/products/${id}`, updateData);
      return response.data;
    }
  },

  // Delete product
  async deleteProduct(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Get product statistics
  async getProductStats(): Promise<ProductStats> {
    const response = await api.get('/products/stats');
    return response.data;
  },

  // Get next product code
  async getNextProductCode(): Promise<{ nextCode: string }> {
    const response = await api.get('/products/next-code');
    return response.data;
  },

  // Get next barcode
  async getNextBarcode(): Promise<{ nextBarcode: string }> {
    const response = await api.get('/products/next-barcode');
    return response.data;
  },

  // Get import template
  async getImportTemplate(): Promise<Blob> {
    const response = await api.get('/products/import-template', {
      responseType: 'blob'
    });
    return response.data;
  },

  // Import products from Excel
  async importProducts(file: File): Promise<{ message: string; imported: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Export products to Excel
  async exportToExcel(filters: ProductFilters = { search: '', status: 'all' }): Promise<Blob> {
    const params = new URLSearchParams();
    
    // Add filters to export
    if (filters.search) params.append('search', filters.search);
    if (filters.status !== 'all') params.append('status', filters.status);
    if (filters.product_type) params.append('product_type', filters.product_type);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.brand_id) params.append('brand_id', filters.brand_id);
    if (filters.manufacturer_id) params.append('manufacturer_id', filters.manufacturer_id);
    if (filters.model_id) params.append('model_id', filters.model_id);
    if (filters.color_id) params.append('color_id', filters.color_id);
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.lowStock) params.append('low_stock', 'true');
    if (filters.expiring) params.append('expiring', 'true');

    const response = await api.get(`/products/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export products to PDF
  async exportToPDF(filters: ProductFilters = { search: '', status: 'all' }): Promise<Blob> {
    const params = new URLSearchParams();
    
    // Add filters to export
    if (filters.search) params.append('search', filters.search);
    if (filters.status !== 'all') params.append('status', filters.status);
    if (filters.product_type) params.append('product_type', filters.product_type);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.brand_id) params.append('brand_id', filters.brand_id);
    if (filters.manufacturer_id) params.append('manufacturer_id', filters.manufacturer_id);
    if (filters.model_id) params.append('model_id', filters.model_id);
    if (filters.color_id) params.append('color_id', filters.color_id);
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.lowStock) params.append('low_stock', 'true');
    if (filters.expiring) params.append('expiring', 'true');

    const response = await api.get(`/products/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get product store stock
  async getProductStoreStock(productId: string, storeId: string): Promise<{ quantity: number }> {
    const response = await api.get(`/products/${productId}/store-stock?store_id=${storeId}`);
    return response.data;
  },

  // Raw Materials Management
  async getProductRawMaterials(productId: string): Promise<ProductRawMaterial[]> {
    const response = await api.get(`/products/${productId}/raw-materials`);
    return response.data;
  },

  async addRawMaterial(productId: string, data: ProductRawMaterialFormData): Promise<ProductRawMaterial> {
    const response = await api.post(`/products/${productId}/raw-materials`, data);
    return response.data;
  },

  async updateRawMaterial(productId: string, rawMaterialId: string, data: ProductRawMaterialFormData): Promise<ProductRawMaterial> {
    const response = await api.put(`/products/${productId}/raw-materials/${rawMaterialId}`, data);
    return response.data;
  },

  async deleteRawMaterial(productId: string, rawMaterialId: string): Promise<{ message: string }> {
    const response = await api.delete(`/products/${productId}/raw-materials/${rawMaterialId}`);
    return response.data;
  },

  // Price Categories Management
  async getProductPriceCategories(productId: string): Promise<ProductPriceCategory[]> {
    const response = await api.get(`/products/${productId}/price-categories`);
    return response.data;
  },

  async updateProductPriceCategories(productId: string, priceCategoryIds: string[]): Promise<ProductPriceCategory[]> {
    const response = await api.put(`/products/${productId}/price-categories`, {
      price_category_ids: priceCategoryIds
    });
    return response.data;
  },

  // Store Assignment
  async getProductStores(productId: string): Promise<ProductStore[]> {
    const response = await api.get(`/products/${productId}/stores`);
    return response.data;
  },

  async assignProductToStores(productId: string, storeIds: string[]): Promise<ProductStore[]> {
    const response = await api.post(`/products/${productId}/stores`, {
      store_ids: storeIds
    });
    return response.data;
  },

  async updateProductStore(productId: string, storeId: string, data: {
    min_quantity?: number;
    max_quantity?: number;
    reorder_point?: number;
    average_cost?: number;
  }): Promise<ProductStore> {
    const response = await api.put(`/products/${productId}/stores/${storeId}`, data);
    return response.data;
  },

  async removeProductFromStore(productId: string, storeId: string): Promise<{ message: string }> {
    const response = await api.delete(`/products/${productId}/stores/${storeId}`);
    return response.data;
  },

  async removeProductFromAllStores(productId: string): Promise<{ message: string }> {
    const response = await api.delete(`/products/${productId}/stores`);
    return response.data;
  },

  // Reference Data for Forms
  async getReferenceCategories(): Promise<{ id: string; name: string }[]> {
    const response = await api.get('/products/reference/categories');
    return response.data;
  },

  async getReferenceBrands(): Promise<{ id: string; name: string }[]> {
    const response = await api.get('/products/reference/brands');
    return response.data;
  },

  async getReferenceManufacturers(): Promise<{ id: string; name: string }[]> {
    const response = await api.get('/products/reference/manufacturers');
    return response.data;
  },

  async getReferenceModels(): Promise<{ id: string; name: string }[]> {
    const response = await api.get('/products/reference/models');
    return response.data;
  },

  async getReferenceColors(): Promise<{ id: string; name: string; hex_code: string }[]> {
    const response = await api.get('/products/reference/colors');
    return response.data;
  },

  async getReferencePackagings(): Promise<{ id: string; name: string }[]> {
    const response = await api.get('/products/reference/packagings');
    return response.data;
  },

  async getReferenceAccounts(): Promise<{ id: string; name: string; type: string }[]> {
    const response = await api.get('/products/reference/accounts');
    return response.data;
  },

  async getReferenceTaxCodes(): Promise<{ id: string; name: string; rate: number }[]> {
    const response = await api.get('/products/reference/taxcodes');
    return response.data;
  },

  async getReferencePriceCategories(): Promise<{ id: string; name: string; code: string; price_change_type: string; percentage_change: number }[]> {
    const response = await api.get('/products/reference/pricecategories');
    return response.data;
  },

  async getReferenceStores(): Promise<{ id: string; name: string; store_type: string; location: string; address?: string; is_active: boolean }[]> {
    const response = await api.get('/products/reference/stores');
    return response.data;
  }
};
