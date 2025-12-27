import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StoreRequestFormData, StoreRequestFilters, StoreRequestSortConfig } from '../types';
import { storeRequestService } from '../services/storeRequestService';
import { storeService } from '../services/storeService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Helper function to get current month date range
const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  
  return {
    date_from: startOfMonth.toISOString().split('T')[0],
    date_to: endOfMonth.toISOString().split('T')[0]
  };
};

// Default filters with current month
const defaultStoreRequestFilters: StoreRequestFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  requesting_store_id: '',
  issuing_store_id: '',
  ...getCurrentMonthRange()
};

// Default sort config
const defaultStoreRequestSortConfig: StoreRequestSortConfig = {
  field: 'createdAt',
  direction: 'desc'
};

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

export const useStoreRequestManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, stores: userStores } = useAuth();
  
  // State
  const [filters, setFilters] = useState<StoreRequestFilters>(defaultStoreRequestFilters);
  const [queryFilters, setQueryFilters] = useState<StoreRequestFilters>(defaultStoreRequestFilters);
  const [sortConfig, setSortConfig] = useState<StoreRequestSortConfig>(defaultStoreRequestSortConfig);
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
    data: storeRequestsResponse,
    isLoading: isLoadingStoreRequests,
    error: storeRequestsError,
    refetch: refetchStoreRequests
  } = useQuery({
    queryKey: ['storeRequests', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: async () => {
      const result = await storeRequestService.getStoreRequests({
        page: currentPage,
        limit: pageSize,
        search: queryFilters.search,
        status: queryFilters.status !== 'all' ? queryFilters.status : undefined,
        priority: queryFilters.priority !== 'all' ? queryFilters.priority : undefined,
        requesting_store_id: queryFilters.requesting_store_id || undefined,
        issuing_store_id: queryFilters.issuing_store_id || undefined,
        date_from: queryFilters.date_from || undefined,
        date_to: queryFilters.date_to || undefined,
        request_type: 'request', // Only show store requests, not store issues
        sort_by: sortConfig.field,
        sort_order: sortConfig.direction
      });
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['storeRequestStats', 'request', queryFilters],
    queryFn: async () => {
      const result = await storeRequestService.getStoreRequestStats('request', undefined, {
        search: queryFilters.search,
        status: queryFilters.status !== 'all' ? queryFilters.status : undefined,
        priority: queryFilters.priority !== 'all' ? queryFilters.priority : undefined,
        requesting_store_id: queryFilters.requesting_store_id || undefined,
        issuing_store_id: queryFilters.issuing_store_id || undefined,
        date_from: queryFilters.date_from || undefined,
        date_to: queryFilters.date_to || undefined
      });
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  const {
    data: stores,
    isLoading: isLoadingStores,
    error: storesError
  } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeService.getStores({ limit: 1000, status: 'active' }),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: storeRequestService.createStoreRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeRequests'] });
      queryClient.invalidateQueries({ queryKey: ['storeRequestStats'] });
      toast.success('Store request created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create store request');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StoreRequestFormData> }) =>
      storeRequestService.updateStoreRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeRequests'] });
      queryClient.invalidateQueries({ queryKey: ['storeRequestStats'] });
      toast.success('Store request updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update store request');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: storeRequestService.deleteStoreRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeRequests'] });
      queryClient.invalidateQueries({ queryKey: ['storeRequestStats'] });
      toast.success('Store request deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete store request');
    }
  });

  const submitMutation = useMutation({
    mutationFn: storeRequestService.submitStoreRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeRequests'] });
      queryClient.invalidateQueries({ queryKey: ['storeRequestStats'] });
      toast.success('Store request submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit store request');
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approvalData }: { id: string; approvalData: any }) => 
      storeRequestService.approveStoreRequest(id, approvalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeRequests'] });
      queryClient.invalidateQueries({ queryKey: ['storeRequestStats'] });
      toast.success('Store request approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve store request');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => 
      storeRequestService.rejectStoreRequest(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeRequests'] });
      queryClient.invalidateQueries({ queryKey: ['storeRequestStats'] });
      toast.success('Store request rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject store request');
    }
  });

  const fulfillMutation = useMutation({
    mutationFn: storeRequestService.fulfillStoreRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeRequests'] });
      queryClient.invalidateQueries({ queryKey: ['storeRequestStats'] });
      toast.success('Store request fulfilled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to fulfill store request');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: storeRequestService.cancelStoreRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeRequests'] });
      queryClient.invalidateQueries({ queryKey: ['storeRequestStats'] });
      toast.success('Store request cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel store request');
    }
  });

  // Export mutations
  const exportExcelMutation = useMutation({
    mutationFn: storeRequestService.exportToExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `store-requests-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Store requests exported to Excel successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to export store requests to Excel');
    }
  });

  const exportPdfMutation = useMutation({
    mutationFn: storeRequestService.exportToPDF,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `store-requests-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Store requests exported to PDF successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to export store requests to PDF');
    }
  });

  // Computed values
  const storeRequests = useMemo(() => {
    const allRequests = storeRequestsResponse?.data || [];
    
    // Log first few requests to see their store IDs
    if (allRequests.length > 0) {
      }
    
    // If user has no assigned stores, return empty array
    if (!userStores || userStores.length === 0) {
      return [];
    }
    
    const userStoreIds = userStores.map(store => store.id);
    
    // Filter requests where user has access to either requesting or issuing store
    const filteredRequests = allRequests.filter(request => {
      const hasAccess = userStoreIds.includes(request.requested_by_store_id) || 
                       userStoreIds.includes(request.requested_from_store_id);
      
      if (!hasAccess) {
        }
      
      return hasAccess;
    });
    
    return filteredRequests;
  }, [storeRequestsResponse, userStores]);
  const totalItems = useMemo(() => storeRequests.length, [storeRequests]);
  const totalPages = useMemo(() => Math.ceil(storeRequests.length / pageSize), [storeRequests, pageSize]);

  // Handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<StoreRequestFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Update query filters for non-date filters
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<StoreRequestFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  // Actions
  const createStoreRequest = useCallback((data: StoreRequestFormData) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateStoreRequest = useCallback((id: string, data: Partial<StoreRequestFormData>) => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteStoreRequest = useCallback((id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const submitStoreRequest = useCallback(async (id: string, onSuccess?: () => void) => {
    try {
      const result = await submitMutation.mutateAsync(id);
      if (onSuccess) {
        onSuccess();
      }
      return result;
    } catch (error) {
      throw error;
    }
  }, [submitMutation]);

  const approveStoreRequest = useCallback((id: string, approvalData: any) => {
    return approveMutation.mutateAsync({ id, approvalData });
  }, [approveMutation]);

  const rejectStoreRequest = useCallback((id: string, rejectionReason: string) => {
    return rejectMutation.mutateAsync({ id, rejectionReason });
  }, [rejectMutation]);

  const fulfillStoreRequest = useCallback((id: string) => {
    return fulfillMutation.mutateAsync(id);
  }, [fulfillMutation]);

  const cancelStoreRequest = useCallback((id: string) => {
    return cancelMutation.mutateAsync(id);
  }, [cancelMutation]);

  const exportToExcel = useCallback((filters?: StoreRequestFilters) => {
    return exportExcelMutation.mutateAsync(filters);
  }, [exportExcelMutation]);

  const exportToPDF = useCallback((filters?: StoreRequestFilters) => {
    return exportPdfMutation.mutateAsync(filters);
  }, [exportPdfMutation]);

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
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  return {
    // Data
    storeRequests,
    stats,
    stores: stores?.data || [],
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    filters,
    sortConfig,
    searchTerm,

    // Loading states
    isLoading: isLoadingStoreRequests,
    isLoadingStats,
    isLoadingStores,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isFulfilling: fulfillMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isExportingExcel: exportExcelMutation.isPending,
    isExportingPdf: exportPdfMutation.isPending,

    // Errors
    error: storeRequestsError,
    statsError,
    storesError,

    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    handleManualFetch,
    handleDateFilterChange,

    // Actions
    createStoreRequest,
    updateStoreRequest,
    deleteStoreRequest,
    submitStoreRequest,
    approveStoreRequest,
    rejectStoreRequest,
    fulfillStoreRequest,
    cancelStoreRequest,
    exportToExcel,
    exportToPDF,

    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canExport,

    // Refetch
    refetchStoreRequests
  };
};
