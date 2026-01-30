import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

// Get the base URL for API calls.
// - Local: use .env REACT_APP_API_URL (e.g. your Railway backend).
// - Railway deploy: set REACT_APP_API_URL in Railway Variables (baked in at build).
// - Production without env: same-origin /api (if backend is same app).
const getBaseUrl = (): string => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//${hostname}${portSuffix}/api`;
  }
  return 'http://localhost:3000/api';
};

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  withCredentials: true, // Include cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add CSRF token
api.interceptors.request.use(
  async (config) => {
    // Get CSRF token from localStorage/sessionStorage (same as working modules)
    let csrfToken = localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken');
    
    // If no CSRF token, try to get a fresh one
    if (!csrfToken) {
      try {
        const authService = (await import('./authService')).default;
        csrfToken = await authService.getFreshCSRFToken();
      } catch (error) {
        }
    }
    
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        const authService = (await import('./authService')).default;
        const refreshed = await authService.refreshToken();
        
        if (refreshed) {
          // Retry the original request
          const originalRequest = error.config;
          const csrfToken = localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken');
          if (csrfToken) {
            originalRequest.headers['X-CSRF-Token'] = csrfToken;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        }
      
      // If refresh failed, redirect to login
      const authService = (await import('./authService')).default;
      await authService.logout();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Handle CSRF token mismatch - try to get fresh CSRF token
      try {
        const authService = (await import('./authService')).default;
        const freshCSRFToken = await authService.getFreshCSRFToken();
        
        if (freshCSRFToken) {
          // Retry the original request with fresh CSRF token
          const originalRequest = error.config;
          originalRequest.headers['X-CSRF-Token'] = freshCSRFToken;
          return api(originalRequest);
        }
      } catch (csrfError) {
        // Failed to refresh CSRF token - silently handle
      }
    }
    return Promise.reject(error);
  }
);

// Generic API methods
export const apiService = {
  // GET request
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.get<ApiResponse<T>>(url, config);
      return response.data as ApiResponse<T>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  // GET request for blob responses (returns raw Axios response)
  getBlob: async (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<Blob>> => {
    try {
      const response = await api.get<Blob>(url, config);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  // POST request
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.post<ApiResponse<T>>(url, data, config);
      return response.data as ApiResponse<T>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  // PUT request
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.put<ApiResponse<T>>(url, data, config);
      return response.data as ApiResponse<T>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  // DELETE request
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.delete<ApiResponse<T>>(url, config);
      return response.data as ApiResponse<T>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  // PATCH request
  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.patch<ApiResponse<T>>(url, data, config);
      return response.data as ApiResponse<T>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },
};

export { api };
export default api; 