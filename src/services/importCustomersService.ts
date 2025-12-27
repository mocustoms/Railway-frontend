import { api } from './api';

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportWarning {
  row: number;
  customer: string;
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
}

export const importCustomersService = {
  downloadTemplate: async (onProgress?: (progress: number) => void): Promise<void> => {
    try {
      const response = await api.get('/customers/import/template', {
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
      link.setAttribute('download', 'customer-import-template.xlsx');
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

      const response = await api.post('/customers/import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  importData: async (data: any[], onProgress?: (progress: number) => void): Promise<ImportResult> => {
    try {
      const response = await api.post('/customers/import/data', { data }, {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  validateData: async (data: any[]): Promise<ImportError[]> => {
    try {
      const response = await api.post('/customers/import/validate', { data });
      return response.data?.errors || [];
    } catch (error) {
      throw error;
    }
  }
};
