import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StockAdjustment as StockAdjustmentType, StockAdjustmentStats, StockAdjustmentFilters, StockAdjustmentSortConfig, StockAdjustmentFormData } from '../types';
import { defaultStockAdjustmentFilters, defaultStockAdjustmentSortConfig, defaultStockAdjustmentStats } from '../data/stockAdjustmentModules';
import { stockAdjustmentService } from '../services/stockAdjustmentService';
import { storeService } from '../services/storeService';
import { adjustmentReasonService } from '../services/adjustmentReasonService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Simple debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  const debouncedFunction = (...args: any[]) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  debouncedFunction.cancel = () => {
    clearTimeout(timeout);
  };
  
  return debouncedFunction;
};

export const useStockAdjustmentManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, stores: userStores } = useAuth();
  
  // State
  const [filters, setFilters] = useState<StockAdjustmentFilters>(defaultStockAdjustmentFilters);
  const [queryFilters, setQueryFilters] = useState<StockAdjustmentFilters>(defaultStockAdjustmentFilters);
  const [sortConfig, setSortConfig] = useState<StockAdjustmentSortConfig>(defaultStockAdjustmentSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualFetchTrigger, setManualFetchTrigger] = useState(0);

  // Debounced search effect
  useEffect(() => {
    const debouncedSearch = debounce((term: string) => {
      setFilters(prev => ({ ...prev, search: term }));
      setQueryFilters(prev => ({ ...prev, search: term }));
      setCurrentPage(1);
    }, 300);

    debouncedSearch(searchTerm);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm]);

  // Queries
  const {
    data: stockAdjustmentsResponse,
    isLoading: isLoadingStockAdjustments,
    error: stockAdjustmentsError,
    refetch: refetchStockAdjustments
  } = useQuery({
    queryKey: ['stockAdjustments', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: async () => {
      return await stockAdjustmentService.getStockAdjustments(
        currentPage,
        pageSize,
        queryFilters,
        sortConfig
      );
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['stockAdjustmentStats'],
    queryFn: async () => {
      return await stockAdjustmentService.getStockAdjustmentStats();
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const {
    data: storesResponse,
    isLoading: isLoadingStores
  } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      return await storeService.getStores({ limit: 1000, status: 'active' });
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes - stores don't change often
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: stockAdjustmentService.createStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stockAdjustmentStats'] });
      toast.success('Stock adjustment created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create stock adjustment';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StockAdjustmentType> }) =>
      stockAdjustmentService.updateStockAdjustment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stockAdjustmentStats'] });
      toast.success('Stock adjustment updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update stock adjustment';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: stockAdjustmentService.deleteStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stockAdjustmentStats'] });
      toast.success('Stock adjustment deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete stock adjustment';
      toast.error(message);
    }
  });

  const submitMutation = useMutation({
    mutationFn: stockAdjustmentService.submitStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stockAdjustmentStats'] });
      toast.success('Stock adjustment submitted for approval');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit stock adjustment';
      toast.error(message);
    }
  });

  const approveMutation = useMutation({
    mutationFn: stockAdjustmentService.approveStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stockAdjustmentStats'] });
      toast.success('Stock adjustment approved');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to approve stock adjustment';
      toast.error(message);
      // Error handled by toast
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      stockAdjustmentService.rejectStockAdjustment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['stockAdjustmentStats'] });
      toast.success('Stock adjustment rejected');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reject stock adjustment';
      toast.error(message);
    }
  });

  // Computed values
  const stockAdjustments = useMemo(() => {
    const allAdjustments = stockAdjustmentsResponse?.stockAdjustments || [];

    // Admin and manager see all company adjustments (matches stat cards; backend already filters by company).
    // When user has no assigned stores, show all from API.
    const showAllForRole = user?.role === 'admin' || user?.role === 'manager';
    const noStoreFilter = !userStores || userStores.length === 0;

    if (showAllForRole || noStoreFilter) {
      return allAdjustments;
    }

    // Normalize to strings so UUIDs match; support store_id, storeId, or nested store.id from list API
    const getStoreId = (store: { id?: string; Store?: { id?: string }; store_id?: string }) =>
      store?.id ?? store?.Store?.id ?? store?.store_id;
    const userStoreIdSet = new Set(
      userStores.map(s => String(getStoreId(s as any)).toLowerCase()).filter(Boolean)
    );
    return allAdjustments.filter(adjustment => {
      const adjStoreId = adjustment.store_id ?? (adjustment as { storeId?: string }).storeId ?? (adjustment as { store?: { id?: string } }).store?.id;
      return adjStoreId != null && userStoreIdSet.has(String(adjStoreId).toLowerCase());
    });
  }, [stockAdjustmentsResponse, userStores, user?.role]);
  
  const totalItems = useMemo(() => stockAdjustments.length, [stockAdjustments]);
  const totalPages = useMemo(() => Math.ceil(stockAdjustments.length / pageSize), [stockAdjustments, pageSize]);

  // Handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setSearchTerm(searchTerm);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((column: keyof StockAdjustmentType | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ field: column, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<StockAdjustmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Update query filters for non-date filters
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<StockAdjustmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  const createStockAdjustment = useCallback(async (data: StockAdjustmentFormData) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateStockAdjustment = useCallback(async (id: string, data: Partial<StockAdjustmentType>) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteStockAdjustment = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const submitStockAdjustment = useCallback(async (id: string) => {
    return await submitMutation.mutateAsync(id);
  }, [submitMutation]);

  const approveStockAdjustment = useCallback(async (id: string) => {
    return await approveMutation.mutateAsync(id);
  }, [approveMutation]);

  const rejectStockAdjustment = useCallback(async (id: string, reason: string) => {
    return await rejectMutation.mutateAsync({ id, reason });
  }, [rejectMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await stockAdjustmentService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-adjustments-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Stock adjustments exported to Excel successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export stock adjustments';
      toast.error(message);
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await stockAdjustmentService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-adjustments-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Stock adjustments exported to PDF successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export stock adjustments';
      toast.error(message);
    }
  }, [filters]);

  // Preload store-related data for better performance
  const preloadStoreData = useCallback(async () => {
    try {
      // Load stores and adjustment reasons in parallel
      const [storesResponse, reasonsResponse] = await Promise.all([
        storeService.getStores({ limit: 1000, status: 'active' }),
        adjustmentReasonService.getAllAdjustmentReasons()
      ]);
      
      // Cache the data for faster access
      queryClient.setQueryData(['stores'], storesResponse);
      queryClient.setQueryData(['all-adjustment-reasons'], reasonsResponse);
      
      return {
        stores: storesResponse,
        adjustmentReasons: reasonsResponse
      };
    } catch (error) {
      return null;
    }
  }, [queryClient]);

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

  const canApprove = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  return {
    // Data
    stockAdjustments,
    stats: stats || defaultStockAdjustmentStats,
    stores: storesResponse?.data || [],
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingStockAdjustments,
    isLoadingStats,
    isLoadingStores,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    
    // Errors
    error: stockAdjustmentsError,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    handleManualFetch,
    handleDateFilterChange,
    createStockAdjustment,
    updateStockAdjustment,
    deleteStockAdjustment,
    submitStockAdjustment,
    approveStockAdjustment,
    rejectStockAdjustment,
    exportToExcel,
    exportToPDF,
    preloadStoreData,
    refetchStockAdjustments,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canExport,
    
    // State
    filters,
    sortConfig,
    setSortConfig,
    setCurrentPage,
    searchTerm
  };
};
