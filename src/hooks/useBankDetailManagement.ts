import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BankDetail, BankDetailStats, BankDetailFilters, BankDetailSortConfig } from '../types';
import { defaultBankDetailFilters, defaultBankDetailSortConfig, defaultBankDetailStats } from '../data/bankDetailModules';
import { bankDetailService } from '../services/bankDetailService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useBankDetailManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<BankDetailFilters>(defaultBankDetailFilters);
  const [sortConfig, setSortConfig] = useState<BankDetailSortConfig>(defaultBankDetailSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Queries
  const {
    data: bankDetailsResponse,
    isLoading: isLoadingBankDetails,
    error: bankDetailsError,
    refetch: refetchBankDetails
  } = useQuery({
    queryKey: ['bankDetails', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await bankDetailService.getBankDetails(
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
    queryKey: ['bankDetailStats'],
    queryFn: async () => {
      return await bankDetailService.getBankDetailStats();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: bankDetailService.createBankDetail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankDetails'] });
      queryClient.invalidateQueries({ queryKey: ['bankDetailStats'] });
      toast.success('Bank detail created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to create bank detail';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      bankDetailService.updateBankDetail(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankDetails'] });
      queryClient.invalidateQueries({ queryKey: ['bankDetailStats'] });
      toast.success('Bank detail updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to update bank detail';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: bankDetailService.deleteBankDetail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankDetails'] });
      queryClient.invalidateQueries({ queryKey: ['bankDetailStats'] });
      toast.success('Bank detail deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to delete bank detail';
      toast.error(message);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: bankDetailService.toggleBankDetailStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankDetails'] });
      queryClient.invalidateQueries({ queryKey: ['bankDetailStats'] });
      toast.success('Bank detail status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to update bank detail status';
      toast.error(message);
    }
  });

  const exportExcelMutation = useMutation({
    mutationFn: bankDetailService.exportToExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bank-details-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel file exported successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to export Excel file';
      toast.error(message);
    }
  });

  const exportPdfMutation = useMutation({
    mutationFn: bankDetailService.exportToPDF,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bank-details-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF file exported successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to export PDF file';
      toast.error(message);
    }
  });

  // Computed values
  const bankDetails = useMemo(() => {
    return bankDetailsResponse?.bankDetails || [];
  }, [bankDetailsResponse]);

  const totalItems = useMemo(() => {
    return bankDetailsResponse?.total || 0;
  }, [bankDetailsResponse]);

  const totalPages = useMemo(() => {
    return bankDetailsResponse?.totalPages || 1;
  }, [bankDetailsResponse]);

  const isLoading = useMemo(() => {
    return isLoadingBankDetails || isLoadingStats;
  }, [isLoadingBankDetails, isLoadingStats]);

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isTogglingStatus = toggleStatusMutation.isPending;
  const isExportingExcel = exportExcelMutation.isPending;
  const isExportingPdf = exportPdfMutation.isPending;

  // Actions
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

  const handleSort = useCallback((column: keyof BankDetail | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  }, []);

  const createBankDetail = useCallback(async (data: any) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateBankDetail = useCallback(async (id: string, data: any) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteBankDetail = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const toggleBankDetailStatus = useCallback(async (id: string) => {
    await toggleStatusMutation.mutateAsync(id);
  }, [toggleStatusMutation]);

  const exportToExcel = useCallback(async () => {
    await exportExcelMutation.mutateAsync(filters);
  }, [exportExcelMutation, filters]);

  const exportToPDF = useCallback(async () => {
    await exportPdfMutation.mutateAsync(filters);
  }, [exportPdfMutation, filters]);

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

  const canToggleStatus = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  return {
    // Data
    bankDetails,
    stats: stats?.stats || defaultBankDetailStats,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
    isExportingExcel,
    isExportingPdf,
    isLoadingStats,
    
    // Pagination
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    
    // Filters and sorting
    filters,
    sortConfig,
    
    // Actions
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleStatusFilter,
    createBankDetail,
    updateBankDetail,
    deleteBankDetail,
    toggleBankDetailStatus,
    exportToExcel,
    exportToPDF,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canExport,
    
    // Error handling
    error: bankDetailsError,
    statsError
  };
};
