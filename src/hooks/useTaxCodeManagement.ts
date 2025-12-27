import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaxCode, TaxCodeStats, TaxCodeFilters, TaxCodeSortConfig } from '../types';
import { defaultTaxCodeFilters, defaultTaxCodeSortConfig, defaultTaxCodeStats } from '../data/taxCodeModules';
import { taxCodeService } from '../services/taxCodeService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useTaxCodeManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<TaxCodeFilters>(defaultTaxCodeFilters);
  const [sortConfig, setSortConfig] = useState<TaxCodeSortConfig>(defaultTaxCodeSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Queries
  const {
    data: taxCodesResponse,
    isLoading: isLoadingTaxCodes,
    error: taxCodesError,
    refetch: refetchTaxCodes
  } = useQuery({
    queryKey: ['taxCodes', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await taxCodeService.getTaxCodes(
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
    queryKey: ['taxCodeStats'],
    queryFn: async () => {
      return await taxCodeService.getTaxCodeStats();
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    error: accountsError
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      return await taxCodeService.getAccounts();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: taxCodeService.createTaxCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxCodes'] });
      queryClient.invalidateQueries({ queryKey: ['taxCodeStats'] });
      toast.success('Tax code created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create tax code';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaxCode> }) =>
      taxCodeService.updateTaxCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxCodes'] });
      queryClient.invalidateQueries({ queryKey: ['taxCodeStats'] });
      toast.success('Tax code updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update tax code';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: taxCodeService.deleteTaxCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxCodes'] });
      queryClient.invalidateQueries({ queryKey: ['taxCodeStats'] });
      toast.success('Tax code deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete tax code';
      toast.error(message);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      taxCodeService.toggleTaxCodeStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxCodes'] });
      queryClient.invalidateQueries({ queryKey: ['taxCodeStats'] });
      toast.success('Tax code status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update tax code status';
      toast.error(message);
    }
  });

  // Computed values
  const taxCodes = useMemo(() => taxCodesResponse?.taxCodes || [], [taxCodesResponse]);
  const totalItems = useMemo(() => taxCodesResponse?.total || 0, [taxCodesResponse]);
  const totalPages = useMemo(() => taxCodesResponse?.totalPages || 1, [taxCodesResponse]);
  const statsData = useMemo(() => stats || defaultTaxCodeStats, [stats]);

  // Loading states
  const isLoading = isLoadingTaxCodes || isLoadingStats;
  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isTogglingStatus = toggleStatusMutation.isPending;

  // Handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<TaxCodeFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((column: keyof TaxCode | 'created_at' | 'updated_at') => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const createTaxCode = useCallback(async (data: Partial<TaxCode>) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateTaxCode = useCallback(async (id: string, data: Partial<TaxCode>) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteTaxCode = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const toggleTaxCodeStatus = useCallback(async (id: string, isActive: boolean) => {
    return await toggleStatusMutation.mutateAsync({ id, isActive });
  }, [toggleStatusMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await taxCodeService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-codes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Tax codes exported to Excel successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export tax codes';
      toast.error(message);
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await taxCodeService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-codes-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Tax codes exported to PDF successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export tax codes';
      toast.error(message);
    }
  }, [filters]);

  // Permission checks
  const canCreate = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canEdit = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canDelete = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canToggleStatus = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  return {
    // Data
    taxCodes,
    stats: statsData,
    accounts: accounts || [],
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
    isLoadingAccounts,
    
    // Filters and sorting
    filters,
    sortConfig,
    
    // Handlers
    handleSearch,
    handleFilterChange,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    
    // CRUD operations
    createTaxCode,
    updateTaxCode,
    deleteTaxCode,
    toggleTaxCodeStatus,
    
    // Export
    exportToExcel,
    exportToPDF,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canExport,
    
    // Refetch
    refetchTaxCodes
  };
}; 