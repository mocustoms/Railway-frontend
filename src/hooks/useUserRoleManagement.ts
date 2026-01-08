import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRoleService } from '../services/userRoleService';
import { UserRole, UserRoleFormData, UserRoleFilters, UserRoleSortConfig, UserRoleStats, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } => {
  let timeoutId: NodeJS.Timeout;
  
  const debouncedFunction = ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };
  
  debouncedFunction.cancel = () => clearTimeout(timeoutId);
  
  return debouncedFunction;
};

// Default configurations
const defaultRoleFilters: UserRoleFilters = {
  search: '',
  is_active: '',
  is_system_role: ''
};

const defaultRoleSortConfig: UserRoleSortConfig = {
  field: 'name',
  direction: 'asc'
};

export const useUserRoleManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<UserRoleFilters>(defaultRoleFilters);
  const [sortConfig, setSortConfig] = useState<UserRoleSortConfig>(defaultRoleSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search effect
  useEffect(() => {
    const debouncedSearch = debounce((term: string) => {
      setFilters(prev => ({ ...prev, search: term }));
      setCurrentPage(1);
    }, 300);

    debouncedSearch(searchTerm);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm]);

  // Queries
  const {
    data: rolesResponse,
    isLoading: isLoadingRoles,
    error: rolesError,
    refetch: refetchRoles
  } = useQuery({
    queryKey: ['userRoles', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      const result = await userRoleService.getRoles({
        page: currentPage,
        pageSize,
        search: filters.search,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction,
        is_active: filters.is_active,
        is_system_role: filters.is_system_role
      });
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['userRoleStats'],
    queryFn: async () => {
      const result = await userRoleService.getRoleStats();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  const {
    data: availablePermissions,
    isLoading: isLoadingPermissions
  } = useQuery({
    queryKey: ['availablePermissions'],
    queryFn: async () => {
      const result = await userRoleService.getAvailablePermissions();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30 minutes - permissions don't change often
    refetchOnWindowFocus: false
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: userRoleService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['userRoleStats'] });
      toast.success('Role created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create role');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserRoleFormData> }) =>
      userRoleService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['userRoleStats'] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: userRoleService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['userRoleStats'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete role');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: userRoleService.toggleRoleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['userRoleStats'] });
      toast.success('Role status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update role status');
    }
  });

  // Computed values
  const roles = useMemo(() => rolesResponse?.data || [], [rolesResponse]);
  const totalItems = useMemo(() => rolesResponse?.total || 0, [rolesResponse]);
  const totalPages = useMemo(() => rolesResponse?.totalPages || 0, [rolesResponse]);

  // Handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((filterType: keyof UserRoleFilters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultRoleFilters);
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Action handlers
  const createRole = useCallback(async (roleData: UserRoleFormData) => {
    return createMutation.mutateAsync(roleData);
  }, [createMutation]);

  const updateRole = useCallback(async (id: string, roleData: Partial<UserRoleFormData>) => {
    return updateMutation.mutateAsync({ id, data: roleData });
  }, [updateMutation]);

  const deleteRole = useCallback(async (id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const toggleRoleStatus = useCallback(async (id: string) => {
    return toggleStatusMutation.mutateAsync(id);
  }, [toggleStatusMutation]);

  const checkRoleUsage = useCallback(async (id: string) => {
    try {
      return await userRoleService.checkRoleUsage(id);
    } catch (error) {
      return { isUsed: false, usageCount: 0 };
    }
  }, []);

  // Permissions
  const canCreate = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canEdit = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canDelete = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  return {
    // Data
    roles,
    stats,
    availablePermissions,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingRoles,
    isLoadingStats,
    isLoadingPermissions,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    
    // Error states
    error: rolesError,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    clearFilters,
    
    // Actions
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    checkRoleUsage,
    
    // State
    filters,
    sortConfig,
    searchTerm,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    
    // Export functions
    exportToExcel: async () => {
      try {
        const blob = await userRoleService.exportToExcel({
          search: searchTerm,
          is_active: filters.is_active,
          is_system_role: filters.is_system_role
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user-roles-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Roles exported to Excel successfully');
      } catch (error) {
        toast.error('Failed to export roles to Excel');
      }
    },

    exportToPDF: async () => {
      try {
        const blob = await userRoleService.exportToPDF({
          search: searchTerm,
          is_active: filters.is_active,
          is_system_role: filters.is_system_role
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user-roles-export-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Roles exported to PDF successfully');
      } catch (error) {
        toast.error('Failed to export roles to PDF');
      }
    },
    
    // Utilities
    refetchRoles
  };
};

export default useUserRoleManagement;
