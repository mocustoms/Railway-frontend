import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { storeService } from '../services/storeService';
import { User, UserFormData, UserFilters, UserSortConfig, UserStats, PaginatedResponse } from '../types';
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
const defaultUserFilters: UserFilters = {
  search: '',
  role: '',
  approval_status: '',
  is_active: ''
};

const defaultUserSortConfig: UserSortConfig = {
  field: 'first_name',
  direction: 'asc'
};

export const useUserManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<UserFilters>(defaultUserFilters);
  const [sortConfig, setSortConfig] = useState<UserSortConfig>(defaultUserSortConfig);
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
    data: usersResponse,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['users', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      const result = await userService.getUsers({
        page: currentPage,
        pageSize,
        search: filters.search,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction,
        approval_status: filters.approval_status
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
    queryKey: ['userStats'],
    queryFn: async () => {
      const result = await userService.getUserStats();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  const {
    data: stores,
    isLoading: isLoadingStores,
    error: storesError
  } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeService.getStores({ limit: 1000, status: 'active' }),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  });

  const approveMutation = useMutation({
    mutationFn: userService.approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      toast.success('User approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve user');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      userService.rejectUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      toast.success('User rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject user');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: userService.toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      toast.success('User status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    }
  });

  const assignStoresMutation = useMutation({
    mutationFn: ({ id, storeAssignments }: { id: string; storeAssignments: any[] }) =>
      userService.assignStoresToUser(id, storeAssignments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Store assignments updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update store assignments');
    }
  });

  // Computed values
  const users = useMemo(() => usersResponse?.data || [], [usersResponse]);
  const totalItems = useMemo(() => usersResponse?.total || 0, [usersResponse]);
  const totalPages = useMemo(() => usersResponse?.totalPages || 0, [usersResponse]);

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

  const handleFilter = useCallback((filterType: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultUserFilters);
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Action handlers
  const createUser = useCallback(async (userData: UserFormData) => {
    return createMutation.mutateAsync(userData);
  }, [createMutation]);

  const updateUser = useCallback(async (id: string, userData: Partial<UserFormData>) => {
    return updateMutation.mutateAsync({ id, data: userData });
  }, [updateMutation]);

  const deleteUser = useCallback(async (id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const approveUser = useCallback(async (id: string) => {
    return approveMutation.mutateAsync(id);
  }, [approveMutation]);

  const rejectUser = useCallback(async (id: string, reason: string) => {
    return rejectMutation.mutateAsync({ id, reason });
  }, [rejectMutation]);

  const toggleUserStatus = useCallback(async (id: string) => {
    return toggleStatusMutation.mutateAsync(id);
  }, [toggleStatusMutation]);

  const assignStoresToUser = useCallback(async (id: string, storeAssignments: any[]) => {
    return assignStoresMutation.mutateAsync({ id, storeAssignments });
  }, [assignStoresMutation]);

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

  const canApprove = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canManageStores = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  return {
    // Data
    users,
    stats,
    stores,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingUsers,
    isLoadingStats,
    isLoadingStores,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isAssigningStores: assignStoresMutation.isPending,
    
    // Error states
    error: usersError,
    statsError,
    storesError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    clearFilters,
    
    // Actions
    createUser,
    updateUser,
    deleteUser,
    approveUser,
    rejectUser,
    toggleUserStatus,
    assignStoresToUser,
    
    // State
    filters,
    sortConfig,
    searchTerm,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canManageStores,
    canExport,
    
    // Export functions
    exportToExcel: async () => {
      try {
        const blob = await userService.exportToExcel({
          search: searchTerm,
          role: filters.role,
          approval_status: filters.approval_status,
          is_active: filters.is_active
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Users exported to Excel successfully');
      } catch (error) {
        toast.error('Failed to export users to Excel');
      }
    },

    exportToPDF: async () => {
      try {
        const blob = await userService.exportToPDF({
          search: searchTerm,
          role: filters.role,
          approval_status: filters.approval_status,
          is_active: filters.is_active
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users-export-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Users exported to PDF successfully');
      } catch (error) {
        toast.error('Failed to export users to PDF');
      }
    },
    
    // Utilities
    refetchUsers
  };
};

export default useUserManagement;