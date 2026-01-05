import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReturnReason, ReturnReasonFilters, ReturnReasonSortConfig } from '../types';
import { 
  defaultReturnReasonFilters, 
  defaultReturnReasonSortConfig, 
  defaultReturnReasonStats 
} from '../data/returnsOutReasonModules';
import { returnsOutReasonService } from '../services/returnsOutReasonService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useReturnsOutReasonManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<ReturnReasonFilters>(defaultReturnReasonFilters);
  const [sortConfig, setSortConfig] = useState<ReturnReasonSortConfig>(defaultReturnReasonSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const {
    data: returnsOutReasonsResponse,
    isLoading: isLoadingReturnsOutReasons,
    error: returnsOutReasonsError,
    refetch: refetchReturnsOutReasons
  } = useQuery({
    queryKey: ['returnsOutReasons', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await returnsOutReasonService.getReturnsOutReasons(
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
    queryKey: ['returnsOutReasonStats'],
    queryFn: async () => {
      return await returnsOutReasonService.getReturnsOutReasonStats();
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: returnsOutReasonService.createReturnsOutReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returnsOutReasons'] });
      queryClient.invalidateQueries({ queryKey: ['returnsOutReasonStats'] });
      toast.success('Returns out reason created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create returns out reason';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReturnReason> }) =>
      returnsOutReasonService.updateReturnsOutReason(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returnsOutReasons'] });
      queryClient.invalidateQueries({ queryKey: ['returnsOutReasonStats'] });
      toast.success('Returns out reason updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update returns out reason';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: returnsOutReasonService.deleteReturnsOutReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returnsOutReasons'] });
      queryClient.invalidateQueries({ queryKey: ['returnsOutReasonStats'] });
      toast.success('Returns out reason deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete returns out reason';
      toast.error(message);
    }
  });

  // Computed values
  const returnsOutReasons = useMemo(() => {
    return returnsOutReasonsResponse?.data || [];
  }, [returnsOutReasonsResponse]);

  const totalItems = useMemo(() => {
    return returnsOutReasonsResponse?.pagination?.totalItems || 0;
  }, [returnsOutReasonsResponse]);

  const totalPages = useMemo(() => {
    return returnsOutReasonsResponse?.pagination?.totalPages || 0;
  }, [returnsOutReasonsResponse]);

  const isLoading = useMemo(() => {
    return isLoadingReturnsOutReasons || isLoadingStats;
  }, [isLoadingReturnsOutReasons, isLoadingStats]);

  const error = useMemo(() => {
    return returnsOutReasonsError || statsError;
  }, [returnsOutReasonsError, statsError]);

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

  const createReturnsOutReason = useCallback(async (data: Partial<ReturnReason>) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateReturnsOutReason = useCallback(async (id: string, data: Partial<ReturnReason>) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteReturnsOutReason = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await returnsOutReasonService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `returns-out-reasons-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      const blob = await returnsOutReasonService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `returns-out-reasons-${new Date().toISOString().split('T')[0]}.pdf`;
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
    returnsOutReasons,
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
    createReturnsOutReason,
    updateReturnsOutReason,
    deleteReturnsOutReason,
    exportToExcel,
    exportToPDF,
    refetchReturnsOutReasons,
    
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

