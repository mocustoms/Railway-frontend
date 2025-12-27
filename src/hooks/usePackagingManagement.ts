import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packagingService } from '../services/packagingService';
import { Packaging, PackagingStats, PackagingFilters, PackagingSortConfig } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Default values
const defaultPackagingFilters: PackagingFilters = {
  search: '',
  status: 'all'
};

const defaultPackagingSortConfig: PackagingSortConfig = {
  column: 'created_at',
  direction: 'desc'
};

const defaultPackagingStats: PackagingStats = {
  totalPackaging: 0,
  activePackaging: 0,
  inactivePackaging: 0,
  lastUpdate: 'Never'
};

export const usePackagingManagement = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<PackagingFilters>(defaultPackagingFilters);
  const [sortConfig, setSortConfig] = useState<PackagingSortConfig>(defaultPackagingSortConfig);

  // Main packaging query
  const {
    data: packagingResponse,
    isLoading: isLoadingPackaging,
    error: packagingError,
    refetch: refetchPackaging
  } = useQuery({
    queryKey: ['packaging', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await packagingService.getPackaging(
        currentPage,
        pageSize,
        filters,
        sortConfig
      );
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Stats query
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery<PackagingStats>({
    queryKey: ['packagingStats'],
    queryFn: async () => {
      if (!isAuthenticated) {
        return defaultPackagingStats;
      }
      const result = await packagingService.getPackagingStats();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: packagingService.createPackaging,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging'] });
      queryClient.invalidateQueries({ queryKey: ['packagingStats'] });
      toast.success('Packaging created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create packaging';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Packaging> }) =>
      packagingService.updatePackaging(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging'] });
      queryClient.invalidateQueries({ queryKey: ['packagingStats'] });
      toast.success('Packaging updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update packaging';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: packagingService.deletePackaging,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging'] });
      queryClient.invalidateQueries({ queryKey: ['packagingStats'] });
      toast.success('Packaging deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete packaging';
      toast.error(message);
    }
  });

  const checkUsageMutation = useMutation({
    mutationFn: packagingService.checkPackagingUsage,
    onError: (error: any) => {
      toast.error('Failed to check usage');
    }
  });

  const deactivatePackagingMutation = useMutation({
    mutationFn: packagingService.deactivatePackaging,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging'] });
      queryClient.invalidateQueries({ queryKey: ['packagingStats'] });
      toast.success('Packaging deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to deactivate packaging');
    }
  });

  // Computed values
  const packaging = useMemo(() => packagingResponse?.data || [], [packagingResponse]);
  const totalItems = useMemo(() => packagingResponse?.pagination?.totalItems || 0, [packagingResponse]);
  const totalPages = useMemo(() => packagingResponse?.pagination?.totalPages || 1, [packagingResponse]);

  // Handler functions for usage check and deactivation
  const handleCheckUsage = useCallback(async (id: string) => {
    return await checkUsageMutation.mutateAsync(id);
  }, [checkUsageMutation]);

  const handleDeactivate = useCallback(async (id: string) => {
    return await deactivatePackagingMutation.mutateAsync(id);
  }, [deactivatePackagingMutation]);

  // Handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((column: keyof Packaging | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<PackagingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const createPackaging = useCallback(async (data: Partial<Packaging>) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updatePackaging = useCallback(async (id: string, data: Partial<Packaging>) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deletePackaging = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await packagingService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packaging-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Packaging exported to Excel successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export packaging';
      toast.error(message);
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await packagingService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packaging-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Packaging exported to PDF successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export packaging';
      toast.error(message);
    }
  }, [filters]);

  // Permissions
  const canCreate = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canEdit = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canDelete = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  return {
    // Data
    packaging,
    stats: stats || defaultPackagingStats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingPackaging,
    isLoadingStats,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeactivating: deactivatePackagingMutation.isPending,
    isCheckingUsage: checkUsageMutation.isPending,
    
    // Errors
    error: packagingError,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    createPackaging,
    updatePackaging,
    deletePackaging,
    handleCheckUsage,
    handleDeactivate,
    exportToExcel,
    exportToPDF,
    refetchPackaging,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    
    // State
    filters,
    sortConfig,
    setSortConfig,
    setCurrentPage
  };
};
