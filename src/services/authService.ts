import { apiService } from './api';
import axios from 'axios';
import { LoginCredentials, AuthResponse, User, Store } from '../types';

interface RegisterCredentials {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

// Get the base URL for API calls (same logic as api.ts)
const getBaseUrl = (): string => {
  // In production, try to detect the current hostname if REACT_APP_API_URL is not set
  if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
    // Use the current window location to determine the API URL
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${protocol}//${hostname}${port}/api`;
    }
  }
  return process.env.REACT_APP_API_URL || 'https://railway-backend-production-ac2b.up.railway.app/api';
};

// Create a direct axios instance for auth endpoints (they don't use ApiResponse wrapper)
const authApi = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  withCredentials: true, // Include cookies with requests (for JWT tokens)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add CSRF token to authenticated endpoints
authApi.interceptors.request.use(
  (config) => {
    // Get CSRF token from storage (set during login/register)
    const csrfToken = localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken');
    
    // Add CSRF token to header if available (required for authenticated endpoints like register-company)
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // For FormData requests, don't set Content-Type - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  // Register user - Step 1: Account registration only
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      // Use direct axios for auth endpoints since they don't use ApiResponse wrapper
      const response = await authApi.post<AuthResponse>('/auth/register', {
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        username: credentials.username,
        email: credentials.email,
        password: credentials.password
      });

      const authData = response.data;

      if (!authData) {
        throw new Error('Registration failed: No response received');
      }

      if (!authData.user) {
        throw new Error('Registration failed: User data not received');
      }

      // Store user data (tokens are now in httpOnly cookies)
      // Even if company registration is required, we store user for the next step
      localStorage.setItem('user', JSON.stringify(authData.user));
      if (authData.stores) {
        localStorage.setItem('stores', JSON.stringify(authData.stores));
        if (authData.stores.length > 0) {
          localStorage.setItem('currentStore', JSON.stringify(authData.stores[0]));
        }
      }
      
      // Store CSRF token for API calls
      if (authData.csrfToken) {
        localStorage.setItem('csrfToken', authData.csrfToken);
      }
      
      return authData;
    } catch (error: any) {
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('An error occurred. Please check your connection and try again.');
      }
    }
  },

  // Register company - Step 2: Company registration (requires authentication)
  registerCompany: async (companyData: {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    companyWebsite?: string;
    companyTin?: string;
    companyVrn?: string;
    companyBusinessRegistrationNumber?: string;
    companyBusinessType?: string;
    companyIndustry?: string;
    companyCountry?: string;
    companyRegion?: string;
    companyTimezone?: string;
  }): Promise<AuthResponse> => {
    try {
      const response = await authApi.post<AuthResponse>('/auth/register-company', companyData);

      const authData = response.data;

      if (!authData) {
        throw new Error('Company registration failed: No response received');
      }

      if (!authData.user) {
        throw new Error('Company registration failed: User data not received');
      }

      // Update stored user data with company information
      localStorage.setItem('user', JSON.stringify(authData.user));
      if (authData.stores) {
        localStorage.setItem('stores', JSON.stringify(authData.stores));
        if (authData.stores.length > 0) {
          localStorage.setItem('currentStore', JSON.stringify(authData.stores[0]));
        }
      }
      
      // Update CSRF token
      if (authData.csrfToken) {
        localStorage.setItem('csrfToken', authData.csrfToken);
      }
      
      return authData;
    } catch (error: any) {
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('An error occurred. Please check your connection and try again.');
      }
    }
  },

  // Login user - adapted from original login.js
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Use direct axios for auth endpoints since they don't use ApiResponse wrapper
      const response = await authApi.post<AuthResponse>('/auth/login', {
        username: credentials.username,
        password: credentials.password,
        remember: credentials.remember
      });

      const authData = response.data;

      if (!authData) {
        throw new Error('Login failed: No response received');
      }

      if (!authData.user) {
        throw new Error('Login failed: User data not received');
      }

      // Store user data (tokens are now in httpOnly cookies)
      const storage = credentials.remember ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(authData.user));
      if (authData.stores) {
        storage.setItem('stores', JSON.stringify(authData.stores));
        if (authData.stores.length > 0) {
          storage.setItem('currentStore', JSON.stringify(authData.stores[0]));
        }
      }
      
      // Store CSRF token for API calls
      if (authData.csrfToken) {
        storage.setItem('csrfToken', authData.csrfToken);
      }
      
      return authData;
    } catch (error: any) {
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('An error occurred. Please check your connection and try again.');
      }
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      // Call logout endpoint to clear cookies
      await authApi.post('/auth/logout');
    } catch (error) {
      } finally {
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('stores');
      localStorage.removeItem('currentStore');
      localStorage.removeItem('csrfToken');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('stores');
      sessionStorage.removeItem('currentStore');
      sessionStorage.removeItem('csrfToken');
    }
  },

  // Get current user from storage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  },

  // Get CSRF token
  getCSRFToken: (): string | null => {
    return localStorage.getItem('csrfToken') || sessionStorage.getItem('csrfToken');
  },

  // Get fresh CSRF token from server
  getFreshCSRFToken: async (): Promise<string | null> => {
    try {
      const response = await authApi.get('/auth/csrf-token');
      if (response.data?.csrfToken) {
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('csrfToken', response.data.csrfToken);
        return response.data.csrfToken;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  // Get user stores
  getUserStores: (): Store[] => {
    const storesStr = localStorage.getItem('stores') || sessionStorage.getItem('stores');
    if (storesStr) {
      try {
        return JSON.parse(storesStr);
      } catch (error) {
        return [];
      }
    }
    return [];
  },

  // Get current store
  getCurrentStore: (): Store | null => {
    const storeStr = localStorage.getItem('currentStore') || sessionStorage.getItem('currentStore');
    if (storeStr) {
      try {
        return JSON.parse(storeStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  },

  // Set current store
  setCurrentStore: (store: Store): void => {
    const user = localStorage.getItem('user');
    if (user) {
      localStorage.setItem('currentStore', JSON.stringify(store));
    } else {
      sessionStorage.setItem('currentStore', JSON.stringify(store));
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return !!user; // Tokens are now in httpOnly cookies, so we check for user data
  },

  // Refresh token (if needed)
  refreshToken: async (): Promise<boolean> => {
    try {
      const response = await authApi.post<{ csrfToken: string }>('/auth/refresh');
      if (response.data && response.data.csrfToken) {
        // Update CSRF token
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('csrfToken', response.data.csrfToken);
        return true;
      }
    } catch (error) {
      await authService.logout();
    }
    return false;
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    await apiService.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiService.post('/auth/reset-password', { token, newPassword });
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiService.post('/auth/change-password', { currentPassword, newPassword });
  },

  // Update profile
  updateProfile: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
  }): Promise<User> => {
    const response = await apiService.put<User>('/auth/profile', userData);
    if (response.success && response.data) {
      // Update stored user data in same location (localStorage or sessionStorage)
      const userStr = JSON.stringify(response.data);
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      storage.setItem('user', userStr);
      
      // Also update stores if they exist
      const storesStr = storage.getItem('stores');
      if (storesStr) {
        // Keep stores in sync
        storage.setItem('stores', storesStr);
      }
    }
    return response.data!;
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<{ profilePicture: string }> => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    // Note: Don't set Content-Type header - browser will set it automatically with boundary
    // The CSRF token will be added by the request interceptor
    const response = await authApi.post<{ success: boolean; message: string; profilePicture: string }>(
      '/auth/profile/picture',
      formData
    );

    if (!response.data.success || !response.data.profilePicture) {
      throw new Error(response.data.message || 'Failed to upload profile picture');
    }

    // Update stored user data with new profile picture
    // Use the same storage location (localStorage or sessionStorage) as the current user
    const currentUser = authService.getCurrentUser();
    if (currentUser && response.data.profilePicture) {
      currentUser.profile_picture = response.data.profilePicture;
      const userStr = JSON.stringify(currentUser);
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      storage.setItem('user', userStr);
      
      // Also update stores if they exist
      const storesStr = storage.getItem('stores');
      if (storesStr) {
        storage.setItem('stores', storesStr);
      }
    }

    return { profilePicture: response.data.profilePicture };
  },
};

export default authService; 