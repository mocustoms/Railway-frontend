import { api } from './api';
import { 
  AdjustmentReason, 
  AdjustmentReasonStats, 
  AdjustmentReasonFilters, 
  AdjustmentReasonSortConfig 
} from '../types';

export interface AdjustmentReasonResponse {
  data: AdjustmentReason[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Transform snake_case backend data to camelCase frontend data
const transformAdjustmentReason = (data: any): AdjustmentReason => {
  return {
    id: data.id,
    code: data.code,
    name: data.name,
    description: data.description,
    adjustmentType: data.adjustment_type,
    trackingAccountId: data.tracking_account_id,
    correspondingAccountId: data.corresponding_account_id,
    isActive: data.is_active,
    createdBy: data.created_by,
    updatedBy: data.updated_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdByUser: data.createdByUser ? {
      id: data.createdByUser.id,
      first_name: data.createdByUser.first_name,
      last_name: data.createdByUser.last_name,
      username: data.createdByUser.username,
      email: data.createdByUser.email || '',
      role: data.createdByUser.role || 'cashier',
      is_active: data.createdByUser.is_active ?? true,
      approval_status: data.createdByUser.approval_status || 'approved',
      createdAt: data.createdByUser.created_at || data.created_at,
      updatedAt: data.createdByUser.updated_at || data.updated_at
    } : undefined,
    updatedByUser: data.updatedByUser ? {
      id: data.updatedByUser.id,
      first_name: data.updatedByUser.first_name,
      last_name: data.updatedByUser.last_name,
      username: data.updatedByUser.username,
      email: data.updatedByUser.email || '',
      role: data.updatedByUser.role || 'cashier',
      is_active: data.updatedByUser.is_active ?? true,
      approval_status: data.updatedByUser.approval_status || 'approved',
      createdAt: data.updatedByUser.created_at || data.updated_at,
      updatedAt: data.updatedByUser.updated_at || data.updated_at
    } : undefined,
    trackingAccount: data.trackingAccount ? {
      id: data.trackingAccount.id,
      name: data.trackingAccount.name,
      code: data.trackingAccount.code,
      type: data.trackingAccount.type,
      status: data.trackingAccount.status,
      nature: data.trackingAccount.nature
    } : undefined,
    correspondingAccount: data.correspondingAccount ? {
      id: data.correspondingAccount.id,
      name: data.correspondingAccount.name,
      code: data.correspondingAccount.code,
      type: data.correspondingAccount.type,
      status: data.correspondingAccount.status,
      nature: data.correspondingAccount.nature
    } : undefined
  };
};

export const adjustmentReasonService = {
  // Get all adjustment reasons with pagination, filtering, and sorting
  getAdjustmentReasons: async (
    page: number = 1,
    limit: number = 10,
    filters?: AdjustmentReasonFilters,
    sortConfig?: AdjustmentReasonSortConfig
  ): Promise<AdjustmentReasonResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    // Add filters
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.adjustmentType) {
      params.append('adjustmentType', filters.adjustmentType);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.trackingAccountId) {
      params.append('trackingAccountId', filters.trackingAccountId);
    }

    // Add sorting
    if (sortConfig?.field) {
      params.append('sortBy', sortConfig.field);
    }
    if (sortConfig?.direction) {
      params.append('sortOrder', sortConfig.direction.toUpperCase());
    }

    const response = await api.get(`/adjustment-reasons?${params}`);
    return {
      data: response.data.data.map(transformAdjustmentReason),
      pagination: response.data.pagination
    };
  },

  // Get adjustment reason by ID
  getAdjustmentReason: async (id: string): Promise<AdjustmentReason> => {
    const response = await api.get(`/adjustment-reasons/${id}`);
    return transformAdjustmentReason(response.data);
  },

  // Get all active adjustment reasons for dropdowns
  getAllAdjustmentReasons: async (): Promise<AdjustmentReason[]> => {
    const response = await api.get('/adjustment-reasons/all');
    return response.data.map(transformAdjustmentReason);
  },

  // Create new adjustment reason
  createAdjustmentReason: async (data: Partial<AdjustmentReason>): Promise<AdjustmentReason> => {
    const response = await api.post('/adjustment-reasons', data);
    return transformAdjustmentReason(response.data);
  },

  // Update adjustment reason
  updateAdjustmentReason: async (id: string, data: Partial<AdjustmentReason>): Promise<AdjustmentReason> => {
    const response = await api.put(`/adjustment-reasons/${id}`, data);
    return transformAdjustmentReason(response.data);
  },

  // Delete adjustment reason
  deleteAdjustmentReason: async (id: string): Promise<void> => {
    await api.delete(`/adjustment-reasons/${id}`);
  },

  // Get adjustment reason statistics
  getAdjustmentReasonStats: async (): Promise<AdjustmentReasonStats> => {
    const response = await api.get('/adjustment-reasons/stats/overview');
    return response.data.stats;
  },

  // Export to Excel
  exportToExcel: async (filters?: AdjustmentReasonFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.adjustmentType) {
      params.append('adjustmentType', filters.adjustmentType);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.trackingAccountId) {
      params.append('trackingAccountId', filters.trackingAccountId);
    }

    const response = await api.get(`/adjustment-reasons/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export to PDF
  exportToPDF: async (filters?: AdjustmentReasonFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.adjustmentType) {
      params.append('adjustmentType', filters.adjustmentType);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.trackingAccountId) {
      params.append('trackingAccountId', filters.trackingAccountId);
    }

    const response = await api.get(`/adjustment-reasons/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
