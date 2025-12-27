export interface ProductModel {
  id: string;
  code: string;
  name: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  brand?: string;
  model_number?: string;
  logo?: string;
  specifications?: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  created_by_name?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductModelFormData {
  code: string;
  name: string;
  description?: string;
  category_id?: string;
  brand?: string;
  model_number?: string;
  logo?: string;
  specifications?: Record<string, any>;
  is_active: boolean;
}

export interface ProductModelListResponse {
  productModels: ProductModel[];
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  };
}

export interface ProductModelStats {
  totalProductModels: number;
  activeProductModels: number;
  inactiveProductModels: number;
  lastUpdate?: string;
}

export interface ProductModelFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  category_id?: string;
  brand?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
