import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdjustmentReason, AdjustmentReasonStats, AdjustmentReasonFilters, AdjustmentReasonSortConfig } from '../types';
import { 
  defaultAdjustmentReasonFilters, 
  defaultAdjustmentReasonSortConfig, 
  defaultAdjustmentReasonStats 
} from '../data/adjustmentReasonModules';
import { adjustmentReasonService } from '../services/adjustmentReasonService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useAdjustmentReasonManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<AdjustmentReasonFilters>(defaultAdjustmentReasonFilters);
  const [sortConfig, setSortConfig] = useState<AdjustmentReasonSortConfig>(defaultAdjustmentReasonSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const {
    data: adjustmentReasonsResponse,
    isLoading: isLoadingAdjustmentReasons,
    error: adjustmentReasonsError,
    refetch: refetchAdjustmentReasons
  } = useQuery({
    queryKey: ['adjustmentReasons', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await adjustmentReasonService.getAdjustmentReasons(
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
    queryKey: ['adjustmentReasonStats'],
    queryFn: async () => {
      return await adjustmentReasonService.getAdjustmentReasonStats();
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: adjustmentReasonService.createAdjustmentReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustmentReasons'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentReasonStats'] });
      toast.success('Adjustment reason created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create adjustment reason';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdjustmentReason> }) =>
      adjustmentReasonService.updateAdjustmentReason(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustmentReasons'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentReasonStats'] });
      toast.success('Adjustment reason updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update adjustment reason';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: adjustmentReasonService.deleteAdjustmentReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustmentReasons'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentReasonStats'] });
      toast.success('Adjustment reason deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete adjustment reason';
      toast.error(message);
    }
  });

  // Computed values
  const adjustmentReasons = useMemo(() => {
    return adjustmentReasonsResponse?.data || [];
  }, [adjustmentReasonsResponse]);

  const totalItems = useMemo(() => {
    return adjustmentReasonsResponse?.pagination?.totalItems || 0;
  }, [adjustmentReasonsResponse]);

  const totalPages = useMemo(() => {
    return adjustmentReasonsResponse?.pagination?.totalPages || 0;
  }, [adjustmentReasonsResponse]);

  const isLoading = useMemo(() => {
    return isLoadingAdjustmentReasons || isLoadingStats;
  }, [isLoadingAdjustmentReasons, isLoadingStats]);

  const error = useMemo(() => {
    return adjustmentReasonsError || statsError;
  }, [adjustmentReasonsError, statsError]);

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

  const handleSort = useCallback((field: AdjustmentReasonSortConfig['field'], direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<AdjustmentReasonFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const createAdjustmentReason = useCallback(async (data: Partial<AdjustmentReason>) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateAdjustmentReason = useCallback(async (id: string, data: Partial<AdjustmentReason>) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteAdjustmentReason = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await adjustmentReasonService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `adjustment-reasons-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      const blob = await adjustmentReasonService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `adjustment-reasons-${new Date().toISOString().split('T')[0]}.pdf`;
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
    adjustmentReasons,
    stats: stats || defaultAdjustmentReasonStats,
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
    createAdjustmentReason,
    updateAdjustmentReason,
    deleteAdjustmentReason,
    exportToExcel,
    exportToPDF,
    refetchAdjustmentReasons,
    
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
