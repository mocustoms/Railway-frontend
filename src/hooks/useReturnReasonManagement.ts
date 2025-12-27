import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReturnReason, ReturnReasonFilters, ReturnReasonSortConfig } from '../types';
import { 
  defaultReturnReasonFilters, 
  defaultReturnReasonSortConfig, 
  defaultReturnReasonStats 
} from '../data/returnReasonModules';
import { returnReasonService } from '../services/returnReasonService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useReturnReasonManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<ReturnReasonFilters>(defaultReturnReasonFilters);
  const [sortConfig, setSortConfig] = useState<ReturnReasonSortConfig>(defaultReturnReasonSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const {
    data: returnReasonsResponse,
    isLoading: isLoadingReturnReasons,
    error: returnReasonsError,
    refetch: refetchReturnReasons
  } = useQuery({
    queryKey: ['returnReasons', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await returnReasonService.getReturnReasons(
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

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['returnReasonStats'],
    queryFn: async () => {
      return await returnReasonService.getReturnReasonStats();
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: returnReasonService.createReturnReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returnReasons'] });
      queryClient.invalidateQueries({ queryKey: ['returnReasonStats'] });
      toast.success('Return reason created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create return reason';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReturnReason> }) =>
      returnReasonService.updateReturnReason(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returnReasons'] });
      queryClient.invalidateQueries({ queryKey: ['returnReasonStats'] });
      toast.success('Return reason updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update return reason';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: returnReasonService.deleteReturnReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returnReasons'] });
      queryClient.invalidateQueries({ queryKey: ['returnReasonStats'] });
      toast.success('Return reason deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete return reason';
      toast.error(message);
    }
  });

  // Computed values
  const returnReasons = useMemo(() => {
    return returnReasonsResponse?.data || [];
  }, [returnReasonsResponse]);

  const totalItems = useMemo(() => {
    return returnReasonsResponse?.pagination?.totalItems || 0;
  }, [returnReasonsResponse]);

  const totalPages = useMemo(() => {
    return returnReasonsResponse?.pagination?.totalPages || 0;
  }, [returnReasonsResponse]);

  const isLoading = useMemo(() => {
    return isLoadingReturnReasons || isLoadingStats;
  }, [isLoadingReturnReasons, isLoadingStats]);

  const error = useMemo(() => {
    return returnReasonsError || statsError;
  }, [returnReasonsError, statsError]);

  // Handlers
  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: ReturnReasonSortConfig['field'], direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<ReturnReasonFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const createReturnReason = useCallback(async (data: Partial<ReturnReason>) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateReturnReason = useCallback(async (id: string, data: Partial<ReturnReason>) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteReturnReason = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await returnReasonService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `return-reasons-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel export completed successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export to Excel';
      toast.error(message);
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await returnReasonService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `return-reasons-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF export completed successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export to PDF';
      toast.error(message);
    }
  }, [filters]);

  // Permissions (based on user role)
  const canCreate = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  const canEdit = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  const canDelete = useMemo(() => {
    return user?.role === 'admin';
  }, [user?.role]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  return {
    // Data
    returnReasons,
    stats: stats || defaultReturnReasonStats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Error states
    error,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    createReturnReason,
    updateReturnReason,
    deleteReturnReason,
    exportToExcel,
    exportToPDF,
    refetchReturnReasons,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    
    // State
    filters,
    sortConfig
  };
};
