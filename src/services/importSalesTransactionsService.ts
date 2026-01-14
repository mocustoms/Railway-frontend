import { api } from './api';

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportWarning {
  row: number;
  transaction: string;
  message: string;
}

export interface UploadResult {
  data: any[];
  errors: ImportError[];
  warnings: ImportWarning[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
  invoicesCreated: number;
  receiptsCreated: number;
  creditTransactions: number;
}

export const importSalesTransactionsService = {
  downloadTemplate: async (onProgress?: (progress: number) => void): Promise<void> => {
    try {
      const response = await api.get('/sales-transactions/import/template', {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales-transactions-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  },

  uploadFile: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/sales-transactions/import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 120 second timeout for large files
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      return response.data;
    } catch (error: any) {
      // Handle specific error types
      if (error.code === 'ERR_UPLOAD_FILE_CHANGED') {
        throw new Error('File was modified during upload. Please try again.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout. Please try again.');
      } else if (error.response?.status === 413) {
        throw new Error('File too large. Maximum size is 10MB.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || 'Invalid file format.');
      }
      
      throw error;
    }
  },

  importData: async (data: any[], onProgress?: (progress: number) => void): Promise<ImportResult> => {
    try {
      const response = await api.post('/sales-transactions/import/data', { data }, {
        timeout: 120000, // 120 second timeout for large imports
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  validateData: async (data: any[]): Promise<ImportError[]> => {
    try {
      const response = await api.post('/sales-transactions/import/validate', { data });
      return response.data?.errors || [];
    } catch (error) {
      throw error;
    }
  }
};
