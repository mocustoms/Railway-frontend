import { apiService } from './api';
import api from './api';
import { 
  ProductManufacturer, 
  ProductManufacturerFormData, 
  ProductManufacturerStats,
  PaginatedResponse 
} from '../types';

// Utility function to get the correct upload URL
const getUploadUrl = (path: string): string => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  const serverBaseUrl = baseUrl.replace('/api', '');
  return `${serverBaseUrl}${path}`;
};

const productManufacturerService = {
  // Get all product manufacturers with pagination and filters
  getProductManufacturers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
    country?: string;
  } = {}): Promise<PaginatedResponse<ProductManufacturer>> => {
    const response = await api.get<PaginatedResponse<ProductManufacturer>>('/product-manufacturers', { params });
    if (!response || !response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  },

  // Get a single product manufacturer by ID
  getProductManufacturer: async (id: string): Promise<ProductManufacturer> => {
    const response = await api.get<ProductManufacturer>(`/product-manufacturers/${id}`);
    if (!response || !response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  },

  // Create a new product manufacturer
  createProductManufacturer: async (data: ProductManufacturerFormData): Promise<ProductManufacturer> => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('code', data.code);
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.website) formData.append('website', data.website);
    if (data.contact_email) formData.append('contact_email', data.contact_email);
    if (data.contact_phone) formData.append('contact_phone', data.contact_phone);
    if (data.address) formData.append('address', data.address);
    if (data.country) formData.append('country', data.country);
    formData.append('is_active', data.is_active.toString());
    
    // Add logo file if present
    if (data.logo) {
      formData.append('logo', data.logo);
    }

    try {
      const response = await api.post<ProductManufacturer>('/product-manufacturers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (!response || !response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error: any) {
      // Log detailed validation errors if available
      if (error.response?.data?.details) {
        error.response.data.details.forEach((detail: any, index: number) => {
          });
      }
      
      throw error;
    }
  },

  // Update an existing product manufacturer
  updateProductManufacturer: async (id: string, data: Partial<ProductManufacturerFormData>): Promise<ProductManufacturer> => {
    const formData = new FormData();
    
    // Add text fields (only if present)
    if (data.code !== undefined) formData.append('code', data.code);
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.website !== undefined) formData.append('website', data.website);
    if (data.contact_email !== undefined) formData.append('contact_email', data.contact_email);
    if (data.contact_phone !== undefined) formData.append('contact_phone', data.contact_phone);
    if (data.address !== undefined) formData.append('address', data.address);
    if (data.country !== undefined) formData.append('country', data.country);
    if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString());
    
    // Add logo file if present
    if (data.logo) {
      formData.append('logo', data.logo);
    }
    try {
      const response = await api.put<ProductManufacturer>(`/product-manufacturers/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (!response || !response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error: any) {
      // Log detailed validation errors if available
      if (error.response?.data?.details) {
        error.response.data.details.forEach((detail: any, index: number) => {
          });
      }
      
      throw error;
    }
  },

  // Delete a product manufacturer
  deleteProductManufacturer: async (id: string): Promise<void> => {
    await api.delete(`/product-manufacturers/${id}`);
  },

  // Deactivate a product manufacturer (for used manufacturers)
  deactivateProductManufacturer: async (id: string): Promise<ProductManufacturer> => {
    const response = await api.put<ProductManufacturer>(`/product-manufacturers/${id}/deactivate`);
    if (!response || !response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  },

  // Check if manufacturer is being used
  checkManufacturerUsage: async (id: string): Promise<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  }> => {
    const response = await api.get<{
      isUsed: boolean;
      usageCount: number;
      message: string;
    }>(`/product-manufacturers/${id}/usage`);
    if (!response || !response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  },

  // Get manufacturer statistics
  getManufacturerStats: async (): Promise<ProductManufacturerStats> => {
    const response = await api.get<ProductManufacturerStats>('/product-manufacturers/stats');
    if (!response || !response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  },

  // Export manufacturers to Excel
  exportToExcel: async (params: {
    search?: string;
    status?: string;
    country?: string;
  } = {}): Promise<Blob> => {
    const response = await api.get('/product-manufacturers/export/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Export manufacturers to PDF
  exportToPdf: async (params: {
    search?: string;
    status?: string;
    country?: string;
  } = {}): Promise<Blob> => {
    const response = await api.get('/product-manufacturers/export/pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Get active manufacturers for dropdowns
  getActiveManufacturers: async (): Promise<ProductManufacturer[]> => {
    try {
      const response = await api.get<ProductManufacturer[]>('/product-manufacturers/active');
      if (!response || !response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Utility function to get logo URL
  getLogoUrl: (logoPath: string, lastModified?: string): string => {
    if (!logoPath) return '';
    const baseUrl = getUploadUrl(logoPath);
    // Add cache-busting parameter using lastModified timestamp if available
    if (lastModified) {
      const timestamp = new Date(lastModified).getTime();
      return `${baseUrl}?t=${timestamp}`;
    }
    return baseUrl;
  },
};

export default productManufacturerService;
