import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentType, PaymentTypeStats, PaymentTypeFilters, PaymentTypeSortConfig } from '../types';
import { defaultPaymentTypeFilters, defaultPaymentTypeSortConfig, defaultPaymentTypeStats } from '../data/paymentTypeModules';
import { paymentTypeService } from '../services/paymentTypeService';
import { paymentMethodService } from '../services/paymentMethodService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const usePaymentTypeManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<PaymentTypeFilters>(defaultPaymentTypeFilters);
  const [sortConfig, setSortConfig] = useState<PaymentTypeSortConfig>(defaultPaymentTypeSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Queries
  const {
    data: paymentTypesResponse,
    isLoading: isLoadingPaymentTypes,
    error: paymentTypesError,
    refetch: refetchPaymentTypes
  } = useQuery({
    queryKey: ['paymentTypes', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await paymentTypeService.getPaymentTypes(
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
    queryKey: ['paymentTypeStats'],
    queryFn: async () => {
      return await paymentTypeService.getPaymentTypeStats();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const {
    data: paymentMethodsResponse,
    isLoading: isLoadingPaymentMethods,
    error: paymentMethodsError
  } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      return await paymentMethodService.getPaymentMethods();
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    error: accountsError
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      return await paymentTypeService.getAccounts();
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: paymentTypeService.createPaymentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['paymentTypeStats'] });
      toast.success('Payment type created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to create payment type';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      paymentTypeService.updatePaymentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['paymentTypeStats'] });
      toast.success('Payment type updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to update payment type';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: paymentTypeService.deletePaymentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['paymentTypeStats'] });
      toast.success('Payment type deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to delete payment type';
      toast.error(message);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: paymentTypeService.togglePaymentTypeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['paymentTypeStats'] });
      toast.success('Payment type status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to update payment type status';
      toast.error(message);
    }
  });

  const exportExcelMutation = useMutation({
    mutationFn: paymentTypeService.exportToExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-types-${new Date().toISOString().split('T')[0]}.xlsx`;
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
    mutationFn: paymentTypeService.exportToPDF,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-types-${new Date().toISOString().split('T')[0]}.pdf`;
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
  const paymentTypes = useMemo(() => {
    return paymentTypesResponse?.paymentTypes || [];
  }, [paymentTypesResponse]);

  const totalItems = useMemo(() => {
    return paymentTypesResponse?.total || 0;
  }, [paymentTypesResponse]);

  const totalPages = useMemo(() => {
    return paymentTypesResponse?.totalPages || 1;
  }, [paymentTypesResponse]);

  const isLoading = useMemo(() => {
    return isLoadingPaymentTypes || isLoadingStats || isLoadingPaymentMethods || isLoadingAccounts;
  }, [isLoadingPaymentTypes, isLoadingStats, isLoadingPaymentMethods, isLoadingAccounts]);

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

  const handleSort = useCallback((column: keyof PaymentType | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  }, []);

  const createPaymentType = useCallback(async (data: any) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updatePaymentType = useCallback(async (id: string, data: any) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deletePaymentType = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const togglePaymentTypeStatus = useCallback(async (id: string) => {
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
    paymentTypes,
    stats: stats?.stats || defaultPaymentTypeStats,
    paymentMethods: paymentMethodsResponse?.paymentMethods || [],
    accounts: accounts || [],
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
    isExportingExcel,
    isExportingPdf,
    isLoadingStats,
    isLoadingPaymentMethods,
    isLoadingAccounts,
    
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
    createPaymentType,
    updatePaymentType,
    deletePaymentType,
    togglePaymentTypeStatus,
    exportToExcel,
    exportToPDF,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canExport,
    
    // Error handling
    error: paymentTypesError,
    statsError,
    paymentMethodsError,
    accountsError
  };
};
