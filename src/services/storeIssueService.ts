import api from './api';
import { StoreRequest, StoreRequestFormData, StoreRequestFilters, StoreRequestStats, PaginatedResponse } from '../types';

export const storeIssueService = {
  // Get all store issues with pagination, search, and filters
  getStoreIssues: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    requesting_store_id?: string;
    issuing_store_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<StoreRequest>> => {
    // Filter for issues only (request_type = 'issue')
    const issueParams = {
      ...params,
      request_type: 'issue'
    };
    const response = await api.get('/store-requests', { params: issueParams });
    return response.data;
  },

  // Get single store issue
  getStoreIssue: async (id: string): Promise<StoreRequest> => {
    const response = await api.get(`/store-requests/${id}`);
    return response.data.data;
  },

  // Create store issue
  createStoreIssue: async (storeIssueData: StoreRequestFormData): Promise<StoreRequest> => {
    // Ensure request_type is set to 'issue'
    const issueData = {
      ...storeIssueData,
      request_type: 'issue'
    };
    const response = await api.post('/store-requests', issueData);
    return response.data.data;
  },

  // Update store issue
  updateStoreIssue: async (id: string, storeIssueData: Partial<StoreRequestFormData>): Promise<StoreRequest> => {
    // Ensure request_type remains 'issue'
    const issueData = {
      ...storeIssueData,
      request_type: 'issue'
    };
    const response = await api.put(`/store-requests/${id}`, issueData);
    return response.data.data;
  },

  // Delete store issue
  deleteStoreIssue: async (id: string): Promise<void> => {
    await api.delete(`/store-requests/${id}`);
  },

  // Submit store issue for approval
  submitStoreIssue: async (id: string): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/submit`);
    return response.data.data;
  },

  // Approve store issue with quantity adjustments
  approveStoreIssue: async (id: string, approvalData: {
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

  // Reject store issue
  rejectStoreIssue: async (id: string, rejectionReason: string): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/reject`, {
      rejection_reason: rejectionReason
    });
    return response.data.data;
  },

  // Fulfill store issue
  fulfillStoreIssue: async (id: string): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/fulfill`);
    return response.data.data;
  },

  // Issue stock from issuer form
  issueStock: async (id: string, issueData: {
    items: Array<{
      id: string;
      issuing_quantity: number;
      notes?: string;
    }>;
    notes?: string;
  }): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/issue`, issueData);
    return response.data.data;
  },

  // Cancel store issue
  cancelStoreIssue: async (id: string): Promise<StoreRequest> => {
    const response = await api.patch(`/store-requests/${id}/cancel`);
    return response.data.data;
  },

  // Get store issue statistics
  getStoreIssueStats: async (): Promise<StoreRequestStats> => {
    const response = await api.get('/store-requests/stats/summary', {
      params: { request_type: 'issue' }
    });
    return response.data.data;
  },

  // Export store issues to Excel
  exportToExcel: async (filters?: StoreRequestFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    // Always filter for issues
    params.append('request_type', 'issue');
    
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

  // Export store issues to PDF
  exportToPDF: async (filters?: StoreRequestFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    // Always filter for issues
    params.append('request_type', 'issue');
    
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
  approveItem: async (issueId: string, itemId: string, approvedQuantity: number, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${issueId}/items/${itemId}/approve`, {
      approved_quantity: approvedQuantity,
      notes
    });
    return response.data.data;
  },

  issueItem: async (issueId: string, itemId: string, issuedQuantity: number, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${issueId}/items/${itemId}/issue`, {
      issued_quantity: issuedQuantity,
      notes
    });
    return response.data.data;
  },

  receiveItem: async (issueId: string, itemId: string, receivedQuantity: number, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${issueId}/items/${itemId}/receive`, {
      received_quantity: receivedQuantity,
      notes
    });
    return response.data.data;
  },

  fulfillItem: async (issueId: string, itemId: string, fulfilledQuantity: number, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${issueId}/items/${itemId}/fulfill`, {
      fulfilled_quantity: fulfilledQuantity,
      notes
    });
    return response.data.data;
  },

  rejectItem: async (issueId: string, itemId: string, reason: string, notes?: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${issueId}/items/${itemId}/reject`, {
      reason,
      notes
    });
    return response.data.data;
  },

  // Bulk operations
  approveAllItems: async (issueId: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${issueId}/approve-all`);
    return response.data;
  },

  issueAllItems: async (issueId: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${issueId}/issue-all`);
    return response.data;
  },

  receiveAllItems: async (issueId: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${issueId}/receive-all`);
    return response.data;
  },

  fulfillAllItems: async (issueId: string): Promise<any> => {
    const response = await api.patch(`/store-requests/${issueId}/fulfill-all`);
    return response.data;
  }
};

export default storeIssueService;
