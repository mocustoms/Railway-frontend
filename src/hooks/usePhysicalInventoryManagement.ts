import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PhysicalInventory as PhysicalInventoryType, PhysicalInventoryFilters, PhysicalInventorySortConfig, PhysicalInventoryFormData } from '../types';
import { defaultPhysicalInventoryFilters, defaultPhysicalInventorySortConfig, defaultPhysicalInventoryStats } from '../data/physicalInventoryModules';
import { physicalInventoryService } from '../services/physicalInventoryService';
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

export const usePhysicalInventoryManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, stores: userStores } = useAuth();
  
  // State
  const [filters, setFilters] = useState<PhysicalInventoryFilters>(defaultPhysicalInventoryFilters);
  const [queryFilters, setQueryFilters] = useState<PhysicalInventoryFilters>(defaultPhysicalInventoryFilters);
  const [sortConfig, setSortConfig] = useState<PhysicalInventorySortConfig>(defaultPhysicalInventorySortConfig);
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
    data: physicalInventoriesResponse,
    isLoading: isLoadingPhysicalInventories,
    error: physicalInventoriesError,
    refetch: refetchPhysicalInventories
  } = useQuery({
    queryKey: ['physicalInventories', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: async () => {
      const result = await physicalInventoryService.getPhysicalInventories(
        currentPage,
        pageSize,
        queryFilters,
        sortConfig
      );
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 0, // Always consider data stale to allow refetching after mutations
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['physicalInventoryStats'],
    queryFn: async () => {
      return await physicalInventoryService.getPhysicalInventoryStats();
    },
    enabled: isAuthenticated,
    staleTime: 0, // Always consider data stale to allow refetching after mutations
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
    mutationFn: physicalInventoryService.createPhysicalInventoryDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalInventories'] });
      queryClient.invalidateQueries({ queryKey: ['physicalInventoryStats'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventories'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventoryStats'] });
      toast.success('Physical inventory saved as draft successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create physical inventory';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhysicalInventoryFormData }) =>
      physicalInventoryService.updatePhysicalInventory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalInventories'] });
      queryClient.invalidateQueries({ queryKey: ['physicalInventoryStats'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventories'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventoryStats'] });
      toast.success('Physical inventory updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update physical inventory';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: physicalInventoryService.deletePhysicalInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalInventories'] });
      queryClient.invalidateQueries({ queryKey: ['physicalInventoryStats'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventories'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventoryStats'] });
      toast.success('Physical inventory deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete physical inventory';
      toast.error(message);
    }
  });

  const submitMutation = useMutation({
    mutationFn: physicalInventoryService.submitPhysicalInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalInventories'] });
      queryClient.invalidateQueries({ queryKey: ['physicalInventoryStats'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventories'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventoryStats'] });
      toast.success('Physical inventory submitted for approval');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit physical inventory';
      toast.error(message);
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approvalNotes }: { id: string; approvalNotes?: string }) => 
      physicalInventoryService.approvePhysicalInventory(id, approvalNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalInventories'] });
      queryClient.invalidateQueries({ queryKey: ['physicalInventoryStats'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventories'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventoryStats'] });
      toast.success('Physical inventory approved');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to approve physical inventory';
      toast.error(message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      physicalInventoryService.rejectPhysicalInventory(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalInventories'] });
      queryClient.invalidateQueries({ queryKey: ['physicalInventoryStats'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventories'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventoryStats'] });
      toast.success('Physical inventory rejected');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reject physical inventory';
      toast.error(message);
    }
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      physicalInventoryService.returnPhysicalInventoryForCorrection(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalInventories'] });
      queryClient.invalidateQueries({ queryKey: ['physicalInventoryStats'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventories'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventoryStats'] });
      toast.success('Physical inventory returned for correction');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to return physical inventory for correction';
      toast.error(message);
    }
  });

  const acceptVarianceMutation = useMutation({
    mutationFn: ({ id, varianceData }: { id: string; varianceData: any }) =>
      physicalInventoryService.acceptVariance(id, varianceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physicalInventories'] });
      queryClient.invalidateQueries({ queryKey: ['physicalInventoryStats'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventories'] });
      queryClient.refetchQueries({ queryKey: ['physicalInventoryStats'] });
      toast.success('Variance accepted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to accept variance';
      toast.error(message);
    }
  });

  // Computed values
  const physicalInventories = useMemo(() => {
    const allInventories = physicalInventoriesResponse?.physicalInventories || [];
    
    // Log first few inventories to see their store IDs
    if (allInventories.length > 0) {
      }
    
    // If user has no assigned stores, return empty array
    if (!userStores || userStores.length === 0) {
      return [];
    }
    
    const userStoreIds = userStores.map(store => store.id);
    
    // Filter inventories where user has access to the store
    const filteredInventories = allInventories.filter(inventory => {
      const hasAccess = userStoreIds.includes(inventory.store_id);
      
      if (!hasAccess) {
        }
      
      return hasAccess;
    });
    
    return filteredInventories;
  }, [physicalInventoriesResponse, userStores]);
  
  const totalItems = useMemo(() => physicalInventories.length, [physicalInventories]);
  const totalPages = useMemo(() => Math.ceil(physicalInventories.length / pageSize), [physicalInventories, pageSize]);

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

  const handleSort = useCallback((column: keyof PhysicalInventoryType | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ field: column, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<PhysicalInventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Update query filters for non-date filters
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<PhysicalInventoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  const createPhysicalInventory = useCallback(async (data: PhysicalInventoryFormData) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updatePhysicalInventory = useCallback(async (id: string, data: PhysicalInventoryFormData) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deletePhysicalInventory = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const submitPhysicalInventory = useCallback(async (id: string) => {
    return await submitMutation.mutateAsync(id);
  }, [submitMutation]);

  const approvePhysicalInventory = useCallback(async (id: string, approvalNotes?: string) => {
    return await approveMutation.mutateAsync({ id, approvalNotes });
  }, [approveMutation]);

  const rejectPhysicalInventory = useCallback(async (id: string, reason: string) => {
    return await rejectMutation.mutateAsync({ id, reason });
  }, [rejectMutation]);

  const returnPhysicalInventoryForCorrection = useCallback(async (id: string, reason: string) => {
    return await returnMutation.mutateAsync({ id, reason });
  }, [returnMutation]);

  const acceptVariance = useCallback(async (id: string, varianceData: any) => {
    return await acceptVarianceMutation.mutateAsync({ id, varianceData });
  }, [acceptVarianceMutation]);

  const exportToExcel = useCallback(async (filters: PhysicalInventoryFilters) => {
    try {
      const blob = await physicalInventoryService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `physical_inventories_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel export completed');
    } catch (error) {
      toast.error('Failed to export to Excel');
    }
  }, []);

  const exportToPDF = useCallback(async (filters: PhysicalInventoryFilters) => {
    try {
      const blob = await physicalInventoryService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `physical_inventories_export_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF export completed');
    } catch (error) {
      toast.error('Failed to export to PDF');
    }
  }, []);

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
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canApprove = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  return {
    // Data
    physicalInventories,
    stats: stats || defaultPhysicalInventoryStats,
    stores: storesResponse?.data || [],
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingPhysicalInventories,
    isLoadingStats,
    isLoadingStores,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isReturning: returnMutation.isPending,
    isAcceptingVariance: acceptVarianceMutation.isPending,
    
    // Errors
    error: physicalInventoriesError,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    handleManualFetch,
    handleDateFilterChange,
    createPhysicalInventory,
    updatePhysicalInventory,
    deletePhysicalInventory,
    submitPhysicalInventory,
    approvePhysicalInventory,
    rejectPhysicalInventory,
    returnPhysicalInventoryForCorrection,
    acceptVariance,
    exportToExcel,
    exportToPDF,
    preloadStoreData,
    refetchPhysicalInventories,
    
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
