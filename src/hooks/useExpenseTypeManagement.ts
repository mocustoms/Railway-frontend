import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseType, ExpenseTypeStats, ExpenseTypeFilters, ExpenseTypeSortConfig } from '../types';
import { defaultExpenseTypeFilters, defaultExpenseTypeSortConfig, defaultExpenseTypeStats } from '../data/expenseTypeModules';
import { expenseTypeService } from '../services/expenseTypeService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useExpenseTypeManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<ExpenseTypeFilters>(defaultExpenseTypeFilters);
  const [sortConfig, setSortConfig] = useState<ExpenseTypeSortConfig>(defaultExpenseTypeSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Queries
  const {
    data: expenseTypesResponse,
    isLoading: isLoadingExpenseTypes,
    error: expenseTypesError,
    refetch: refetchExpenseTypes
  } = useQuery({
    queryKey: ['expenseTypes', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await expenseTypeService.getExpenseTypes(
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
    queryKey: ['expenseTypeStats'],
    queryFn: async () => {
      return await expenseTypeService.getExpenseTypeStats();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    error: accountsError
  } = useQuery({
    queryKey: ['expenseTypeAccounts'],
    queryFn: async () => {
      return await expenseTypeService.getAccounts();
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: expenseTypeService.createExpenseType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      queryClient.invalidateQueries({ queryKey: ['expenseTypeStats'] });
      toast.success('Expense type created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to create expense type';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      expenseTypeService.updateExpenseType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      queryClient.invalidateQueries({ queryKey: ['expenseTypeStats'] });
      toast.success('Expense type updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to update expense type';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: expenseTypeService.deleteExpenseType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      queryClient.invalidateQueries({ queryKey: ['expenseTypeStats'] });
      toast.success('Expense type deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to delete expense type';
      toast.error(message);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: expenseTypeService.toggleExpenseTypeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      queryClient.invalidateQueries({ queryKey: ['expenseTypeStats'] });
      toast.success('Expense type status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || 'Failed to update expense type status';
      toast.error(message);
    }
  });

  const exportExcelMutation = useMutation({
    mutationFn: expenseTypeService.exportToExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-types-${new Date().toISOString().split('T')[0]}.xlsx`;
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
    mutationFn: expenseTypeService.exportToPDF,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-types-${new Date().toISOString().split('T')[0]}.pdf`;
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
  const expenseTypes = useMemo(() => {
    return expenseTypesResponse?.expenseTypes || [];
  }, [expenseTypesResponse]);

  const totalItems = useMemo(() => {
    return expenseTypesResponse?.total || 0;
  }, [expenseTypesResponse]);

  const totalPages = useMemo(() => {
    return expenseTypesResponse?.totalPages || 1;
  }, [expenseTypesResponse]);

  const isLoading = useMemo(() => {
    return isLoadingExpenseTypes || isLoadingStats || isLoadingAccounts;
  }, [isLoadingExpenseTypes, isLoadingStats, isLoadingAccounts]);

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

  const handleSort = useCallback((column: keyof ExpenseType | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  }, []);

  const createExpenseType = useCallback(async (data: any) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateExpenseType = useCallback(async (id: string, data: any) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteExpenseType = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const toggleExpenseTypeStatus = useCallback(async (id: string) => {
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
    expenseTypes,
    stats: stats?.stats || defaultExpenseTypeStats,
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
    createExpenseType,
    updateExpenseType,
    deleteExpenseType,
    toggleExpenseTypeStatus,
    exportToExcel,
    exportToPDF,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canExport,
    
    // Error handling
    error: expenseTypesError,
    statsError,
    accountsError
  };
};
