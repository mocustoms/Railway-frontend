import api from './api';
import { StoreRequest, StoreRequestFormData, StoreRequestFilters, StoreRequestStats, PaginatedResponse } from '../types';

export const storeRequestService = {
  // Get all store requests with pagination, search, and filters
  getStoreRequests: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    requesting_store_id?: string;
    issuing_store_id?: string;
    date_from?: string;
    date_to?: string;
    request_type?: string;
    exclude_status?: string;
    include_partial_requests?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<StoreRequest>> => {
    const response = await api.get('/store-requests', { params });
    return response.data;
  },

  // Get single store request
  getStoreRequest: async (id: string): Promise<StoreRequest> => {
    const response = await api.get(`/store-requests/${id}`);
    return response.data.data;
  },

  // Create store request
  createStoreRequest: async (storeRequestData: StoreRequestFormData): Promise<StoreRequest> => {
    const response = await api.post('/store-requests', storeRequestData);
    return response.data.data;
  },

  // Update store request
  updateStoreRequest: async (id: string, storeRequestData: Partial<StoreRequestFormData>): Promise<StoreRequest> => {
    const response = await api.put(`/store-requests/${id}`, storeRequestData);
    return response.data.data;
  },

  // Delete store request
  deleteStoreRequest: async (id: string): Promise<void> => {
    await api.delete(`/store-requests/${id}`);
  },

  // Submit store request for approval
  submitStoreRequest: async (id: string): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/submit`);
    return response.data.data;
  },

  // Approve store request with quantity adjustments
  approveStoreRequest: async (id: string, approvalData: {
    approval_notes?: string;
    approved_items: Array<{
      item_id: string;
      approved_quantity: number;
    }>;
  }): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/approve`, approvalData, {
      timeout: 60000 // 60 seconds timeout
    });
    return response.data.data;
  },

  // Reject store request
  rejectStoreRequest: async (id: string, rejectionReason: string): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/reject`, {
      rejection_reason: rejectionReason
    });
    return response.data.data;
  },

  // Fulfill store request
  fulfillStoreRequest: async (id: string): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/fulfill`);
    return response.data.data;
  },

  // Cancel store request
  cancelStoreRequest: async (id: string): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/cancel`);
    return response.data.data;
  },

  // Cancel store request receipt
  cancelStoreRequestReceipt: async (id: string): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/cancel-receipt`);
    return response.data.data;
  },

  // Get store request statistics
  getStoreRequestStats: async (request_type?: string, exclude_status?: string, filters?: {
    search?: string;
    status?: string;
    priority?: string;
    requesting_store_id?: string;
    issuing_store_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<StoreRequestStats> => {
    const params: any = {};
    if (request_type) params.request_type = request_type;
    if (exclude_status) params.exclude_status = exclude_status;
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.requesting_store_id) params.requesting_store_id = filters.requesting_store_id;
    if (filters?.issuing_store_id) params.issuing_store_id = filters.issuing_store_id;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    const response = await api.get('/store-requests/stats/summary', { params });
    return response.data.data;
  },

  // Export store requests to Excel
  exportToExcel: async (filters?: StoreRequestFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    // Always filter by request_type for store requests
    params.append('request_type', 'request');
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      params.append('priority', filters.priority);
    }
    if (filters?.requesting_store_id) {
      params.append('requesting_store_id', filters.requesting_store_id);
    }
    if (filters?.issuing_store_id) {
      params.append('issuing_store_id', filters.issuing_store_id);
    }
    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }

    const response = await api.get(`/store-requests/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export store requests to PDF
  exportToPDF: async (filters?: StoreRequestFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    // Always filter by request_type for store requests
    params.append('request_type', 'request');
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      params.append('priority', filters.priority);
    }
    if (filters?.requesting_store_id) {
      params.append('requesting_store_id', filters.requesting_store_id);
    }
    if (filters?.issuing_store_id) {
      params.append('issuing_store_id', filters.issuing_store_id);
    }
    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }

    const response = await api.get(`/store-requests/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Item-level operations
  approveItem: async (requestId: string, itemId: string, approvedQuantity: number, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${requestId}/items/${itemId}/approve`, {
      approved_quantity: approvedQuantity,
      notes
    });
    return response.data.data;
  },

  issueItem: async (requestId: string, itemId: string, issuedQuantity: number, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${requestId}/items/${itemId}/issue`, {
      issued_quantity: issuedQuantity,
      notes
    });
    return response.data.data;
  },

  receiveItem: async (requestId: string, itemId: string, receivedQuantity: number, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${requestId}/items/${itemId}/receive`, {
      received_quantity: receivedQuantity,
      notes
    });
    return response.data.data;
  },

  fulfillItem: async (requestId: string, itemId: string, fulfilledQuantity: number, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${requestId}/items/${itemId}/fulfill`, {
      fulfilled_quantity: fulfilledQuantity,
      notes
    });
    return response.data.data;
  },

  rejectItem: async (requestId: string, itemId: string, reason: string, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${requestId}/items/${itemId}/reject`, {
      reason,
      notes
    });
    return response.data.data;
  },

  // Bulk operations
  approveAllItems: async (requestId: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${requestId}/approve-all`);
    return response.data;
  },

  issueAllItems: async (requestId: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${requestId}/issue-all`);
    return response.data;
  },

  receiveAllItems: async (requestId: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${requestId}/receive-all`);
    return response.data;
  },

  fulfillAllItems: async (requestId: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${requestId}/fulfill-all`);
    return response.data;
  },

  // Get Current Stock Balance Report Data (from ProductStore table)
  getCurrentStockBalance: async (filters?: {
    storeId?: string;
    storeLocationIds?: string[];
    categoryIds?: string[];
    brandNameIds?: string[];
    manufacturerIds?: string[];
    modelIds?: string[];
    colorIds?: string[];
  }): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      productCode: string;
      productName: string;
      partNumber: string;
      category: string;
      brandName: string;
      manufacturer: string;
      model: string;
      color: string;
      storeName: string;
      storeLocation: string;
      quantity: number;
      unitCost: number;
      totalValue: number;
      lastUpdated: string;
    }>;
    total: number;
  }> => {
    const params: any = {};
    
    if (filters?.storeId) params.storeId = filters.storeId;
    if (filters?.storeLocationIds && filters.storeLocationIds.length > 0) {
      params.storeLocationIds = filters.storeLocationIds.join(',');
    }
    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      params.categoryIds = filters.categoryIds.join(',');
    }
    if (filters?.brandNameIds && filters.brandNameIds.length > 0) {
      params.brandNameIds = filters.brandNameIds.join(',');
    }
    if (filters?.manufacturerIds && filters.manufacturerIds.length > 0) {
      params.manufacturerIds = filters.manufacturerIds.join(',');
    }
    if (filters?.modelIds && filters.modelIds.length > 0) {
      params.modelIds = filters.modelIds.join(',');
    }
    if (filters?.colorIds && filters.colorIds.length > 0) {
      params.colorIds = filters.colorIds.join(',');
    }

    const response = await api.get('/store-requests/current-stock-balance', { params });
    return response.data;
  },

  // Get Historical Stock Balance Report Data (from ProductTransaction table)
  getStockBalance: async (filters?: {
    asOfDate?: string;
    storeId?: string;
    storeLocationIds?: string[];
    categoryIds?: string[];
    brandNameIds?: string[];
    manufacturerIds?: string[];
    modelIds?: string[];
    colorIds?: string[];
  }): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      productCode: string;
      productName: string;
      partNumber: string;
      category: string;
      brandName: string;
      manufacturer: string;
      model: string;
      color: string;
      storeName: string;
      storeLocation: string;
      quantity: number;
      unitCost: number;
      totalValue: number;
      lastUpdated: string;
    }>;
    total: number;
  }> => {
    const params: any = {};
    
    if (filters?.asOfDate) params.asOfDate = filters.asOfDate;
    if (filters?.storeId) params.storeId = filters.storeId;
    if (filters?.storeLocationIds && filters.storeLocationIds.length > 0) {
      params.storeLocationIds = filters.storeLocationIds.join(',');
    }
    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      params.categoryIds = filters.categoryIds.join(',');
    }
    if (filters?.brandNameIds && filters.brandNameIds.length > 0) {
      params.brandNameIds = filters.brandNameIds.join(',');
    }
    if (filters?.manufacturerIds && filters.manufacturerIds.length > 0) {
      params.manufacturerIds = filters.manufacturerIds.join(',');
    }
    if (filters?.modelIds && filters.modelIds.length > 0) {
      params.modelIds = filters.modelIds.join(',');
    }
    if (filters?.colorIds && filters.colorIds.length > 0) {
      params.colorIds = filters.colorIds.join(',');
    }

    const response = await api.get('/store-requests/stock-balance', { params });
    return response.data;
  },

  // Export Current Stock Balance as PDF
  exportCurrentStockBalancePDF: async (filters?: {
    storeId?: string;
    storeLocationIds?: string[];
    categoryIds?: string[];
    brandNameIds?: string[];
    manufacturerIds?: string[];
    modelIds?: string[];
    colorIds?: string[];
  }, searchTerm?: string): Promise<Blob> => {
    const response = await api.post('/store-requests/export-current-stock-balance-pdf', {
      filters,
      searchTerm
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export Historical Stock Balance as PDF
  exportStockBalanceAsOfDatePDF: async (filters?: {
    asOfDate?: string;
    storeId?: string;
    storeLocationIds?: string[];
    categoryIds?: string[];
    brandNameIds?: string[];
    manufacturerIds?: string[];
    modelIds?: string[];
    colorIds?: string[];
  }, searchTerm?: string): Promise<Blob> => {
    const response = await api.post('/store-requests/export-stock-balance-as-of-date-pdf', {
      filters,
      searchTerm
    }, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default storeRequestService;
