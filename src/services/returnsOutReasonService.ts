import { api } from './api';
import { 
  ReturnReason, 
  ReturnReasonStats, 
  ReturnReasonFilters, 
  ReturnReasonSortConfig 
} from '../types';

export interface ReturnsOutReasonResponse {
  data: ReturnReason[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Transform snake_case backend data to camelCase frontend data
const transformReturnsOutReason = (data: any): ReturnReason => {
  return {
    id: data.id,
    code: data.code,
    name: data.name,
    description: data.description,
    returnType: data.return_type,
    requiresApproval: data.requires_approval,
    maxReturnDays: data.max_return_days,
    refundAccountId: data.refund_account_id,
    inventoryAccountId: data.inventory_account_id,
    isActive: data.is_active,
    createdBy: data.created_by,
    updatedBy: data.updated_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdByUserReturnReason: data.createdByUserReturnReason ? {
      id: data.createdByUserReturnReason.id,
      first_name: data.createdByUserReturnReason.first_name,
      last_name: data.createdByUserReturnReason.last_name,
      username: data.createdByUserReturnReason.username,
      email: data.createdByUserReturnReason.email || '',
      role: data.createdByUserReturnReason.role || 'cashier',
      is_active: data.createdByUserReturnReason.is_active ?? true,
      approval_status: data.createdByUserReturnReason.approval_status || 'approved',
      createdAt: data.createdByUserReturnReason.created_at || data.created_at,
      updatedAt: data.createdByUserReturnReason.updated_at || data.updated_at
    } : undefined,
    updatedByUserReturnReason: data.updatedByUserReturnReason ? {
      id: data.updatedByUserReturnReason.id,
      first_name: data.updatedByUserReturnReason.first_name,
      last_name: data.updatedByUserReturnReason.last_name,
      username: data.updatedByUserReturnReason.username,
      email: data.updatedByUserReturnReason.email || '',
      role: data.updatedByUserReturnReason.role || 'cashier',
      is_active: data.updatedByUserReturnReason.is_active ?? true,
      approval_status: data.updatedByUserReturnReason.approval_status || 'approved',
      createdAt: data.updatedByUserReturnReason.created_at || data.updated_at,
      updatedAt: data.updatedByUserReturnReason.updated_at || data.updated_at
    } : undefined,
    refundAccount: data.refundAccount ? {
      id: data.refundAccount.id,
      name: data.refundAccount.name,
      code: data.refundAccount.code,
      type: data.refundAccount.type,
      status: data.refundAccount.status,
      nature: data.refundAccount.nature
    } : undefined,
    inventoryAccount: data.inventoryAccount ? {
      id: data.inventoryAccount.id,
      name: data.inventoryAccount.name,
      code: data.inventoryAccount.code,
      type: data.inventoryAccount.type,
      status: data.inventoryAccount.status,
      nature: data.inventoryAccount.nature
    } : undefined
  };
};

export const returnsOutReasonService = {
  // Get all returns out reasons with pagination, filtering, and sorting
  getReturnsOutReasons: async (
    page: number = 1,
    limit: number = 10,
    filters?: ReturnReasonFilters,
    sortConfig?: ReturnReasonSortConfig
  ): Promise<ReturnsOutReasonResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    // Add filters
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.returnType) {
      params.append('returnType', filters.returnType);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.requiresApproval !== undefined) {
      params.append('requiresApproval', filters.requiresApproval.toString());
    }
    if (filters?.refundAccountId) {
      params.append('refundAccountId', filters.refundAccountId);
    }
    if (filters?.inventoryAccountId) {
      params.append('inventoryAccountId', filters.inventoryAccountId);
    }

    // Add sorting
    if (sortConfig?.field) {
      params.append('sortBy', sortConfig.field);
    }
    if (sortConfig?.direction) {
      params.append('sortOrder', sortConfig.direction.toUpperCase());
    }

    const response = await api.get(`/returns-out-reasons?${params}`);
    return {
      data: response.data.data.map(transformReturnsOutReason),
      pagination: response.data.pagination
    };
  },

  // Get returns out reason by ID
  getReturnsOutReason: async (id: string): Promise<ReturnReason> => {
    const response = await api.get(`/returns-out-reasons/${id}`);
    return transformReturnsOutReason(response.data);
  },

  // Get all active returns out reasons for dropdowns
  getAllReturnsOutReasons: async (): Promise<ReturnReason[]> => {
    const response = await api.get('/returns-out-reasons/all');
    return response.data.map(transformReturnsOutReason);
  },

  // Create new returns out reason
  createReturnsOutReason: async (data: Partial<ReturnReason>): Promise<ReturnReason> => {
    const response = await api.post('/returns-out-reasons', data);
    return transformReturnsOutReason(response.data);
  },

  // Update returns out reason
  updateReturnsOutReason: async (id: string, data: Partial<ReturnReason>): Promise<ReturnReason> => {
    const response = await api.put(`/returns-out-reasons/${id}`, data);
    return transformReturnsOutReason(response.data);
  },

  // Delete returns out reason
  deleteReturnsOutReason: async (id: string): Promise<void> => {
    await api.delete(`/returns-out-reasons/${id}`);
  },

  // Get returns out reason statistics
  getReturnsOutReasonStats: async (): Promise<ReturnReasonStats> => {
    const response = await api.get('/returns-out-reasons/stats/overview');
    return response.data.stats;
  },

  // Export to Excel
  exportToExcel: async (filters?: ReturnReasonFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.returnType) {
      params.append('returnType', filters.returnType);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.requiresApproval !== undefined) {
      params.append('requiresApproval', filters.requiresApproval.toString());
    }
    if (filters?.refundAccountId) {
      params.append('refundAccountId', filters.refundAccountId);
    }
    if (filters?.inventoryAccountId) {
      params.append('inventoryAccountId', filters.inventoryAccountId);
    }

    const response = await api.get(`/returns-out-reasons/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export to PDF
  exportToPDF: async (filters?: ReturnReasonFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.returnType) {
      params.append('returnType', filters.returnType);
    }
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    if (filters?.requiresApproval !== undefined) {
      params.append('requiresApproval', filters.requiresApproval.toString());
    }
    if (filters?.refundAccountId) {
      params.append('refundAccountId', filters.refundAccountId);
    }
    if (filters?.inventoryAccountId) {
      params.append('inventoryAccountId', filters.inventoryAccountId);
    }

    const response = await api.get(`/returns-out-reasons/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

