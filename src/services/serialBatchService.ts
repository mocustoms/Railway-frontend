import api from './api';

export interface BatchNumber {
  id: string;
  batch_number: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  store_id: string;
  store_name?: string;
  current_quantity: number;
  expiry_date?: string | null;
  status?: string;
  unit_cost?: number;
  days_until_expiry?: number;
}

export interface SerialNumber {
  id: string;
  serial_number: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  store_id: string;
  store_name?: string;
  current_quantity: number;
  status?: string;
  unit_cost?: number;
}

const serialBatchService = {
  // Get available batch numbers for a product in a store
  getAvailableBatchNumbers: async (productId: string, storeId: string): Promise<BatchNumber[]> => {
    try {
      const response = await api.get('/serial-batch/batch-numbers/available', {
        params: {
          product_id: productId,
          store_id: storeId
        }
      });
      return response.data.batchNumbers || [];
    } catch (error: any) {
      return [];
    }
  },

  // Get available serial numbers for a product in a store
  getAvailableSerialNumbers: async (productId: string, storeId: string): Promise<SerialNumber[]> => {
    try {
      const response = await api.get('/serial-batch/serial-numbers/available', {
        params: {
          product_id: productId,
          store_id: storeId
        }
      });
      return response.data.serialNumbers || [];
    } catch (error: any) {
      return [];
    }
  },

  // Search batch numbers
  searchBatchNumbers: async (query: string, productId?: string, storeId?: string, limit: number = 20): Promise<BatchNumber[]> => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      const response = await api.get('/serial-batch/batch-numbers/search', {
        params: {
          query: query.trim(),
          product_id: productId,
          store_id: storeId,
          limit
        }
      });
      return response.data.batchNumbers || [];
    } catch (error: any) {
      return [];
    }
  },

  // Search serial numbers
  searchSerialNumbers: async (query: string, productId?: string, storeId?: string, limit: number = 20): Promise<SerialNumber[]> => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      const response = await api.get('/serial-batch/serial-numbers/search', {
        params: {
          query: query.trim(),
          product_id: productId,
          store_id: storeId,
          limit
        }
      });
      return response.data.serialNumbers || [];
    } catch (error: any) {
      return [];
    }
  }
};

export default serialBatchService;

