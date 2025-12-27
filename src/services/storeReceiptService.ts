import { api } from './api';
import { StoreRequest, StoreRequestFormData, StoreRequestItemFormData } from '../types';
import { storeRequestService } from './storeRequestService';

export interface StoreReceiptStats {
  totalRequests: number;
  draftRequests: number;
  submittedRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  fulfilledRequests: number;
  partialIssuedRequests: number;
  cancelledRequests: number;
}

export interface StoreReceiptFilters {
  status?: string;
  priority?: string;
  requesting_store_id?: string;
  requested_from_store_id?: string;
  request_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface StoreReceiptListResponse {
  storeRequests: StoreRequest[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface StoreReceiptStatsResponse {
  stats: StoreReceiptStats;
}

export interface ReceiveStockData {
  items: Array<{
    id: string;
    receiving_quantity: number;
    notes?: string;
  }>;
  notes?: string;
}

class StoreReceiptService {
  private baseUrl = '/store-requests';

  // Get store receipts with filters and pagination
  async getStoreReceipts(
    page: number = 1,
    pageSize: number = 10,
    filters: StoreReceiptFilters = {}
  ): Promise<StoreReceiptListResponse> {
    try {
      const result = await storeRequestService.getStoreRequests({
        page,
        limit: pageSize,
        search: filters.search,
        status: filters.status ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        requesting_store_id: filters.requesting_store_id || undefined,
        issuing_store_id: filters.requested_from_store_id || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        request_type: 'request', // Filter for receipts only
        exclude_status: 'draft', // Exclude draft requests from store receipts
        include_partial_requests: true, // Include partial_issued requests
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      return {
        storeRequests: result.data,
        totalItems: result.total,
        totalPages: result.totalPages,
        currentPage: result.page,
        pageSize: result.limit
      };
    } catch (error) {
      throw error;
    }
  }

  // Get store receipt statistics
  async getStoreReceiptStats(filters: StoreReceiptFilters = {}): Promise<StoreReceiptStatsResponse> {
    try {
      const result = await storeRequestService.getStoreRequestStats('request', 'draft', {
        search: filters.search,
        status: filters.status ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        requesting_store_id: filters.requesting_store_id || undefined,
        issuing_store_id: filters.requested_from_store_id || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined
      });
      return { stats: result };
    } catch (error) {
      throw error;
    }
  }

  // Get a single store receipt by ID
  async getStoreReceipt(id: string): Promise<StoreRequest> {
    try {
      return await storeRequestService.getStoreRequest(id);
    } catch (error) {
      throw error;
    }
  }

  // Create a new store receipt
  async createStoreReceipt(data: StoreRequestFormData): Promise<StoreRequest> {
    try {
      const receiptData = {
        ...data,
        request_type: 'request' as const // Ensure it's a receipt
      };
      
      return await storeRequestService.createStoreRequest(receiptData);
    } catch (error) {
      throw error;
    }
  }

  // Update an existing store receipt
  async updateStoreReceipt(id: string, data: Partial<StoreRequestFormData>): Promise<StoreRequest> {
    try {
      const receiptData = {
        ...data,
        request_type: 'request' as const // Ensure it's a receipt
      };
      
      return await storeRequestService.updateStoreRequest(id, receiptData);
    } catch (error) {
      throw error;
    }
  }

  // Delete a store receipt
  async deleteStoreReceipt(id: string): Promise<void> {
    try {
      await storeRequestService.deleteStoreRequest(id);
    } catch (error) {
      throw error;
    }
  }

  // Submit store receipt for approval
  async submitStoreReceipt(id: string): Promise<StoreRequest> {
    try {
      return await storeRequestService.submitStoreRequest(id);
    } catch (error) {
      throw error;
    }
  }

  // Approve store receipt
  async approveStoreReceipt(id: string, approvalData?: any): Promise<StoreRequest> {
    try {
      return await storeRequestService.approveStoreRequest(id, approvalData);
    } catch (error) {
      throw error;
    }
  }

  // Reject store receipt
  async rejectStoreReceipt(id: string, reason: string): Promise<StoreRequest> {
    try {
      return await storeRequestService.rejectStoreRequest(id, reason);
    } catch (error) {
      throw error;
    }
  }

  // Fulfill store receipt
  async fulfillStoreReceipt(id: string): Promise<StoreRequest> {
    try {
      return await storeRequestService.fulfillStoreRequest(id);
    } catch (error) {
      throw error;
    }
  }

  // Cancel store receipt
  async cancelStoreReceipt(id: string): Promise<StoreRequest> {
    try {
      return await storeRequestService.cancelStoreRequest(id);
    } catch (error) {
      throw error;
    }
  }

  // Receive stock for a store receipt using existing endpoints
  async receiveStock(id: string, data: ReceiveStockData): Promise<StoreRequest> {
    try {
      // Use the existing receiveAllItems endpoint for bulk operations
      const response = await api.patch(`${this.baseUrl}/${id}/receive-all`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Receive individual items with specific quantities
  async receiveItems(id: string, items: Array<{itemId: string, quantity: number, notes?: string}>): Promise<void> {
    try {
      // Use individual item receive endpoints
      for (const item of items) {
        await api.patch(`${this.baseUrl}/${id}/items/${item.itemId}/receive`, {
          received_quantity: item.quantity,
          notes: item.notes
        });
      }
    } catch (error) {
      throw error;
    }
  }

  // Export store receipts to Excel
  async exportToExcel(filters: StoreReceiptFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        request_type: 'request', // Filter for receipts only
        exclude_status: 'draft', // Exclude draft requests from store receipts
        include_partial_requests: 'true', // Include partial_issued requests
        ...filters
      });

      const response = await api.get(`${this.baseUrl}/export/excel?${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Export store receipts to PDF
  async exportToPDF(filters: StoreReceiptFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        request_type: 'request', // Filter for receipts only
        exclude_status: 'draft', // Exclude draft requests from store receipts
        include_partial_requests: 'true', // Include partial_issued requests
        ...filters
      });

      const response = await api.get(`${this.baseUrl}/export/pdf?${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get store receipt items
  async getStoreReceiptItems(id: string): Promise<StoreRequestItemFormData[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/items`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update store receipt item
  async updateStoreReceiptItem(
    id: string, 
    itemId: string, 
    data: Partial<StoreRequestItemFormData>
  ): Promise<StoreRequestItemFormData> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/items/${itemId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete store receipt item
  async deleteStoreReceiptItem(id: string, itemId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}/items/${itemId}`);
    } catch (error) {
      throw error;
    }
  }

  // Get store receipt history/audit trail
  async getStoreReceiptHistory(id: string): Promise<any[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/history`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get store receipt status options
  async getStoreReceiptStatusOptions(): Promise<string[]> {
    try {
      const response = await api.get(`${this.baseUrl}/status-options`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get store receipt priority options
  async getStoreReceiptPriorityOptions(): Promise<string[]> {
    try {
      const response = await api.get(`${this.baseUrl}/priority-options`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Validate store receipt data
  async validateStoreReceipt(data: StoreRequestFormData): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const response = await api.post(`${this.baseUrl}/validate`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get store receipt templates
  async getStoreReceiptTemplates(): Promise<any[]> {
    try {
      const response = await api.get(`${this.baseUrl}/templates`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Create store receipt from template
  async createStoreReceiptFromTemplate(templateId: string, data: Partial<StoreRequestFormData>): Promise<StoreRequest> {
    try {
      const response = await api.post(`${this.baseUrl}/templates/${templateId}/create`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Duplicate store receipt
  async duplicateStoreReceipt(id: string, data: Partial<StoreRequestFormData> = {}): Promise<StoreRequest> {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/duplicate`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Bulk operations
  async bulkApproveStoreReceipts(ids: string[], approvalData?: any): Promise<StoreRequest[]> {
    try {
      const response = await api.post(`${this.baseUrl}/bulk/approve`, { ids, ...approvalData });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async bulkRejectStoreReceipts(ids: string[], reason: string): Promise<StoreRequest[]> {
    try {
      const response = await api.post(`${this.baseUrl}/bulk/reject`, { ids, reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async bulkCancelStoreReceipts(ids: string[]): Promise<StoreRequest[]> {
    try {
      const response = await api.post(`${this.baseUrl}/bulk/cancel`, { ids });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get store receipt analytics
  async getStoreReceiptAnalytics(filters: StoreReceiptFilters = {}): Promise<any> {
    try {
      const params = new URLSearchParams({
        request_type: 'request', // Filter for receipts only
        ...filters
      });

      const response = await api.get(`${this.baseUrl}/analytics?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get store receipt performance metrics
  async getStoreReceiptPerformanceMetrics(filters: StoreReceiptFilters = {}): Promise<any> {
    try {
      const params = new URLSearchParams({
        request_type: 'request', // Filter for receipts only
        ...filters
      });

      const response = await api.get(`${this.baseUrl}/performance?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const storeReceiptService = new StoreReceiptService();
