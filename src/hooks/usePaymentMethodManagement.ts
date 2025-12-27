import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentMethod, PaymentMethodStats, PaymentMethodFilters, PaymentMethodSortConfig } from '../types';
import { defaultPaymentMethodFilters, defaultPaymentMethodSortConfig, defaultPaymentMethodStats } from '../data/paymentMethodModules';
import { paymentMethodService } from '../services/paymentMethodService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const usePaymentMethodManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<PaymentMethodFilters>(defaultPaymentMethodFilters);
  const [sortConfig, setSortConfig] = useState<PaymentMethodSortConfig>(defaultPaymentMethodSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Queries
  const {
    data: paymentMethodsResponse,
    isLoading: isLoadingPaymentMethods,
    error: paymentMethodsError,
    refetch: refetchPaymentMethods
  } = useQuery({
    queryKey: ['paymentMethods', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await paymentMethodService.getPaymentMethods(
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
    queryKey: ['paymentMethodStats'],
    queryFn: async () => {
      return await paymentMethodService.getPaymentMethodStats();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: paymentMethodService.createPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['paymentMethodStats'] });
      toast.success('Payment method created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to create payment method';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      paymentMethodService.updatePaymentMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['paymentMethodStats'] });
      toast.success('Payment method updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to update payment method';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: paymentMethodService.deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['paymentMethodStats'] });
      toast.success('Payment method deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to delete payment method';
      toast.error(message);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: paymentMethodService.togglePaymentMethodStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['paymentMethodStats'] });
      toast.success('Payment method status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to update payment method status';
      toast.error(message);
    }
  });

  const exportExcelMutation = useMutation({
    mutationFn: paymentMethodService.exportToExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-methods-${new Date().toISOString().split('T')[0]}.xlsx`;
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
    mutationFn: paymentMethodService.exportToPDF,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-methods-${new Date().toISOString().split('T')[0]}.pdf`;
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
  const paymentMethods = useMemo(() => {
    return paymentMethodsResponse?.paymentMethods || [];
  }, [paymentMethodsResponse]);

  const totalItems = useMemo(() => {
    return paymentMethodsResponse?.total || 0;
  }, [paymentMethodsResponse]);

  const totalPages = useMemo(() => {
    return paymentMethodsResponse?.totalPages || 1;
  }, [paymentMethodsResponse]);

  const isLoading = useMemo(() => {
    return isLoadingPaymentMethods || isLoadingStats;
  }, [isLoadingPaymentMethods, isLoadingStats]);

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

  const handleSort = useCallback((column: keyof PaymentMethod | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  }, []);

  const createPaymentMethod = useCallback(async (data: any) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updatePaymentMethod = useCallback(async (id: string, data: any) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deletePaymentMethod = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const togglePaymentMethodStatus = useCallback(async (id: string) => {
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
    paymentMethods,
    stats: stats?.stats || defaultPaymentMethodStats,
    
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
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethodStatus,
    exportToExcel,
    exportToPDF,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canExport,
    
    // Error handling
    error: paymentMethodsError,
    statsError
  };
};