import api from './api';
import { 
  ProductCategory, 
  ProductCategoryFormData, 
  ProductCategoryStats, 
  PaginatedProductCategoryResponse,
  TaxCode,
  Account
} from '../types';

export const getProductCategories = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}): Promise<PaginatedProductCategoryResponse> => {
  const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc', status } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    sortBy,
    sortOrder,
  });

  if (status && status !== 'all') {
    queryParams.append('status', status);
  }

  const response = await api.get(`/product-categories?${queryParams}`);
  return response.data;
};

export const getProductCategory = async (id: string): Promise<ProductCategory> => {
  const response = await api.get(`/product-categories/${id}`);
  return response.data;
};

export const createProductCategory = async (data: ProductCategoryFormData): Promise<ProductCategory> => {
  const response = await api.post('/product-categories', data);
  return response.data;
};

export const updateProductCategory = async (id: string, data: ProductCategoryFormData): Promise<ProductCategory> => {
  const response = await api.put(`/product-categories/${id}`, data);
  return response.data;
};

export const deleteProductCategory = async (id: string): Promise<void> => {
  await api.delete(`/product-categories/${id}`);
};

export const getProductCategoryStats = async (): Promise<ProductCategoryStats> => {
  const response = await api.get('/product-categories/stats');
  return response.data;
};

export const exportProductCategoriesToExcel = async (params: {
  search?: string;
  status?: string;
}): Promise<Blob> => {
  const { search = '', status } = params;
  
  const queryParams = new URLSearchParams({
    search,
  });

  if (status && status !== 'all') {
    queryParams.append('status', status);
  }

  const response = await api.get(`/product-categories/export/excel?${queryParams}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const exportProductCategoriesToPDF = async (params: {
  search?: string;
  status?: string;
}): Promise<Blob> => {
  const { search = '', status } = params;
  
  const queryParams = new URLSearchParams({
    search,
  });

  if (status && status !== 'all') {
    queryParams.append('status', status);
  }

  const response = await api.get(`/product-categories/export/pdf?${queryParams}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const getActiveProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    const response = await api.get('/product-categories?limit=1000&status=active');
    if (response.data.productCategories && response.data.productCategories.length > 0) {
      const firstCategory = response.data.productCategories[0];
      }
    
    return response.data.productCategories;
  } catch (error) {
    throw error;
  }
};

// Check if product category is being used by other entities
export const checkProductCategoryUsage = async (id: string): Promise<{
  isUsed: boolean;
  usageCount: number;
  productCount: number;
  modelCount: number;
  manufacturerCount: number;
  message: string;
}> => {
  const response = await api.get(`/product-categories/${id}/usage`);
  return response.data;
};

// Deactivate product category instead of deleting when it's in use
export const deactivateProductCategory = async (id: string): Promise<ProductCategory> => {
  const response = await api.put(`/product-categories/${id}/deactivate`);
  return response.data;
};

// Get tax codes for dropdown
export const getTaxCodes = async (): Promise<TaxCode[]> => {
  const response = await api.get('/tax-codes?limit=1000&status=active');
  return response.data.taxCodes || [];
};

// Get accounts for dropdown
export const getAccounts = async (): Promise<Account[]> => {
  const response = await api.get('/accounts?limit=1000&status=active');
  return response.data.accounts || [];
};
