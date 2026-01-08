import { apiService, api } from './api';
import { UserRole, UserRoleFormData, UserRoleStats, PaginatedResponse } from '../types';

export const userRoleService = {
  // Get all roles with pagination and filters
  getRoles: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortField?: string;
    sortDirection?: string;
    is_active?: string;
    is_system_role?: string;
  }): Promise<PaginatedResponse<UserRole>> => {
    try {
      const response = await apiService.get('/user-roles', { 
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 10,
          search: params?.search || '',
          sortField: params?.sortField || 'name',
          sortDirection: params?.sortDirection || 'asc',
          is_active: params?.is_active || '',
          is_system_role: params?.is_system_role || ''
        }
      });
      
      // Transform backend response to frontend expected format
      const backendData = response.data as any || response;
      return {
        data: backendData.roles || backendData.data || [],
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

  // Get single role
  getRole: async (id: string): Promise<UserRole> => {
    const response = await apiService.get<UserRole>(`/user-roles/${id}`);
    return response.data!;
  },

  // Create role
  createRole: async (roleData: UserRoleFormData): Promise<UserRole> => {
    const response = await apiService.post<UserRole>('/user-roles', roleData);
    return response.data!;
  },

  // Update role
  updateRole: async (id: string, roleData: Partial<UserRoleFormData>): Promise<UserRole> => {
    const response = await apiService.put<UserRole>(`/user-roles/${id}`, roleData);
    return response.data!;
  },

  // Delete role
  deleteRole: async (id: string): Promise<void> => {
    await apiService.delete(`/user-roles/${id}`);
  },

  // Toggle role status (active/inactive)
  toggleRoleStatus: async (id: string): Promise<UserRole> => {
    const response = await apiService.patch<UserRole>(`/user-roles/${id}/toggle-status`);
    return response.data!;
  },

  // Get role statistics
  getRoleStats: async (): Promise<UserRoleStats> => {
    try {
      const response = await api.get('/user-roles/stats/summary');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get available permissions
  getAvailablePermissions: async (): Promise<any[]> => {
    try {
      const response = await apiService.get('/user-roles/permissions');
      const data = response.data as any;
      return data?.permissions || (Array.isArray(data) ? data : []);
    } catch (error: any) {
      // Return default permissions if API fails
      return [];
    }
  },

  // Check if role is in use
  checkRoleUsage: async (id: string): Promise<{ isUsed: boolean; usageCount: number }> => {
    try {
      const response = await apiService.get(`/user-roles/${id}/usage`);
      const data = response.data as any;
      if (data && typeof data.isUsed === 'boolean' && typeof data.usageCount === 'number') {
        return data;
      }
      return { isUsed: false, usageCount: 0 };
    } catch (error: any) {
      return { isUsed: false, usageCount: 0 };
    }
  },

  // Export roles to Excel
  exportToExcel: async (filters: any = {}): Promise<Blob> => {
    const response = await apiService.get('/user-roles/export/excel', {
      params: filters,
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  // Export roles to PDF
  exportToPDF: async (filters: any = {}): Promise<Blob> => {
    const response = await apiService.get('/user-roles/export/pdf', {
      params: filters,
      responseType: 'blob'
    });
    return response.data as Blob;
  }
};

export default userRoleService;
