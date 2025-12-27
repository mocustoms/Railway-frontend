import { apiService, api } from './api';
import { User, UserFormData, UserStats, PaginatedResponse } from '../types';

export const userService = {
  // Get all users with pagination and filters
  getUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortField?: string;
    sortDirection?: string;
    approval_status?: string;
  }): Promise<PaginatedResponse<User>> => {
    try {
      const response = await apiService.get('/users', { 
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 10,
          search: params?.search || '',
          sortField: params?.sortField || 'first_name',
          sortDirection: params?.sortDirection || 'asc',
          approval_status: params?.approval_status || ''
        }
      });
      
      // Transform backend response to frontend expected format
      const backendData = response.data as any || response;
      return {
        data: backendData.users || [],
        total: backendData.total || 0,
        page: backendData.page || 1,
        limit: backendData.pageSize || 10,
        totalPages: backendData.totalPages || 1,
        pagination: {
          totalItems: backendData.total || 0,
          currentPage: backendData.page || 1,
          totalPages: backendData.totalPages || 1,
          hasNextPage: (backendData.page || 1) < (backendData.totalPages || 1),
          hasPrevPage: (backendData.page || 1) > 1,
          limit: backendData.pageSize || 10
        }
      };
    } catch (error) {
      // Return empty data structure on error
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        pagination: {
          totalItems: 0,
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10
        }
      };
    }
  },

  // Get single user
  getUser: async (id: string): Promise<User> => {
    const response = await apiService.get<User>(`/users/${id}`);
    return response.data!;
  },

  // Create user
  createUser: async (userData: UserFormData): Promise<User> => {
    const response = await apiService.post<User>('/users', userData);
    return response.data!;
  },

  // Update user
  updateUser: async (id: string, userData: Partial<UserFormData>): Promise<User> => {
    const response = await apiService.put<User>(`/users/${id}`, userData);
    return response.data!;
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    await apiService.delete(`/users/${id}`);
  },

  // Approve user
  approveUser: async (id: string): Promise<User> => {
    const response = await apiService.patch<User>(`/users/${id}/approve`);
    return response.data!;
  },

  // Reject user
  rejectUser: async (id: string, rejectionReason: string): Promise<User> => {
    const response = await apiService.patch<User>(`/users/${id}/reject`, {
      rejection_reason: rejectionReason
    });
    return response.data!;
  },

  // Toggle user status (active/inactive)
  toggleUserStatus: async (id: string): Promise<User> => {
    const response = await apiService.patch<User>(`/users/${id}/toggle-status`);
    return response.data!;
  },

  // Get user statistics
  getUserStats: async (): Promise<UserStats> => {
    try {
      const response = await api.get('/users/stats/summary');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get pending users for approval
  getPendingUsers: async (): Promise<User[]> => {
    const response = await apiService.get<User[]>('/users/pending/approval');
    return response.data!;
  },

  // Assign stores to user
  assignStoresToUser: async (id: string, storeAssignments: any[]): Promise<void> => {
    await apiService.post(`/users/${id}/stores`, {
      store_assignments: storeAssignments
    });
  },

  // Get user's store assignments
  getUserStores: async (id: string): Promise<any[]> => {
    const response = await apiService.get<any[]>(`/users/${id}/stores`);
    return response.data!;
  },

  // Get user's POS stores (assigned, can_sale_products=true, is_active=true)
  getUserPOSStores: async (id: string): Promise<any[]> => {
    try {
      // Backend returns array directly, so use api.get directly instead of apiService
      const response = await api.get(`/users/${id}/stores/pos`);
      // Backend returns array directly in response.data
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      // Return empty array on error instead of throwing
      return [];
    }
  },

  // Remove store assignment from user
  removeStoreAssignment: async (userId: string, storeId: string): Promise<void> => {
    await apiService.delete(`/users/${userId}/stores/${storeId}`);
  },

  // Update user's last login
  updateLastLogin: async (id: string): Promise<void> => {
    await apiService.patch(`/users/${id}/last-login`);
  },

  // Export users to Excel
  exportToExcel: async (filters: any = {}): Promise<Blob> => {
    const response = await apiService.get('/users/export/excel', {
      params: filters,
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  // Export users to PDF
  exportToPDF: async (filters: any = {}): Promise<Blob> => {
    const response = await apiService.get('/users/export/pdf', {
      params: filters,
      responseType: 'blob'
    });
    return response.data as Blob;
  }
};

export default userService; 