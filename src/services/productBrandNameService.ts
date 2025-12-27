import { api } from './api';
import { 
  ProductBrandName, 
  ProductBrandNameFormData, 
  ProductBrandNameStats, 
  ProductBrandNameFilters, 
  ProductBrandNameSortConfig,
  PaginatedProductBrandNameResponse 
} from '../types';

// Get all product brand names with pagination, search, and filtering
export const getProductBrandNames = async (
  page: number = 1,
  limit: number = 10,
  filters?: ProductBrandNameFilters,
  sortConfig?: ProductBrandNameSortConfig
): Promise<PaginatedProductBrandNameResponse> => {
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

  if (sortConfig?.column) {
    params.append('sortBy', sortConfig.column);
  }

  if (sortConfig?.direction) {
    params.append('sortOrder', sortConfig.direction.toUpperCase());
  }

  const response = await api.get(`/product-brand-names?${params.toString()}`);
  return response.data;
};

// Get single product brand name by ID
export const getProductBrandName = async (id: string): Promise<ProductBrandName> => {
  const response = await api.get(`/product-brand-names/${id}`);
  return response.data;
};

// Create new product brand name
export const createProductBrandName = async (data: ProductBrandNameFormData): Promise<ProductBrandName> => {
  const formData = new FormData();
  
  formData.append('code', data.code);
  formData.append('name', data.name);
  formData.append('is_active', data.is_active.toString());
  
  if (data.description) {
    formData.append('description', data.description);
  }
  
  if (data.logo) {
    formData.append('logo', data.logo);
  }

  const response = await api.post('/product-brand-names', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Update existing product brand name
export const updateProductBrandName = async (id: string, data: ProductBrandNameFormData): Promise<ProductBrandName> => {
  const formData = new FormData();
  
  formData.append('code', data.code);
  formData.append('name', data.name);
  formData.append('is_active', data.is_active.toString());
  
  if (data.description) {
    formData.append('description', data.description);
  }
  
  if (data.logo) {
    formData.append('logo', data.logo);
  }

  const response = await api.put(`/product-brand-names/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Delete product brand name
export const deleteProductBrandName = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/product-brand-names/${id}`);
  return response.data;
};

// Get product brand name statistics
export const getProductBrandNameStats = async (): Promise<ProductBrandNameStats> => {
  try {
    const response = await api.get('/product-brand-names/stats');
    return response.data;
  } catch (error) {
    // If stats endpoint doesn't exist, calculate from data
    const allBrandNames = await getProductBrandNames(1, 1000);
    const totalBrandNames = allBrandNames.pagination.totalItems;
    const activeBrandNames = allBrandNames.data.filter(brand => brand.is_active).length;
    const inactiveBrandNames = totalBrandNames - activeBrandNames;
    
    return {
      totalBrandNames,
      activeBrandNames,
      inactiveBrandNames,
      lastUpdate: new Date().toISOString()
    };
  }
};

// Export to Excel
export const exportProductBrandNamesToExcel = async (
  filters?: ProductBrandNameFilters,
  sortConfig?: ProductBrandNameSortConfig
): Promise<Blob> => {
  const params = new URLSearchParams();
  
  if (filters?.search) {
    params.append('search', filters.search);
  }

  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }

  if (sortConfig?.column) {
    params.append('sortBy', sortConfig.column);
  }

  if (sortConfig?.direction) {
    params.append('sortOrder', sortConfig.direction.toUpperCase());
  }

  const response = await api.get(`/product-brand-names/export/excel?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Export to PDF
export const exportProductBrandNamesToPDF = async (
  filters?: ProductBrandNameFilters,
  sortConfig?: ProductBrandNameSortConfig
): Promise<Blob> => {
  const params = new URLSearchParams();
  
  if (filters?.search) {
    params.append('search', filters.search);
  }

  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }

  if (sortConfig?.column) {
    params.append('sortBy', sortConfig.column);
  }

  if (sortConfig?.direction) {
    params.append('sortOrder', sortConfig.direction.toUpperCase());
  }

  const response = await api.get(`/product-brand-names/export/pdf?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Get all active product brand names (for dropdowns)
export const getActiveProductBrandNames = async (): Promise<ProductBrandName[]> => {
  const response = await getProductBrandNames(1, 1000, { status: 'active' });
  return response.data;
};

// Check if product brand name is being used
export const checkProductBrandNameUsage = async (id: string): Promise<{
  isUsed: boolean;
  usageCount: number;
  message: string;
}> => {
  try {
    const response = await api.get(`/product-brand-names/${id}/usage`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Deactivate product brand name
export const deactivateProductBrandName = async (id: string): Promise<ProductBrandName> => {
  try {
    const response = await api.put(`/product-brand-names/${id}/deactivate`);
    return response.data.brandName;
  } catch (error) {
    throw error;
  }
};

// Utility function to get logo URL
export const getLogoUrl = (logoPath: string): string => {
  if (!logoPath) return '';
  const baseUrl = 'http://localhost:3000/api';
  const serverBaseUrl = baseUrl.replace('/api', '');
  return `${serverBaseUrl}${logoPath}`;
};
