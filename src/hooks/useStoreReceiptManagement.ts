import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { storeReceiptService, StoreReceiptFilters, StoreReceiptStats } from '../services/storeReceiptService';
import { storeRequestService } from '../services/storeRequestService';
import { storeService } from '../services/storeService';
import { StoreRequest, StoreRequestFormData } from '../types';

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

export const useStoreReceiptManagement = () => {
  const { user, stores: userStores } = useAuth();
  const queryClient = useQueryClient();

  // State for pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualFetchTrigger, setManualFetchTrigger] = useState(0);
  const [filters, setFilters] = useState<StoreReceiptFilters>({
    status: 'partial_issued,fulfilled,partially_received,fully_received,partial_issued_cancelled,partially_received_cancelled', // Show all receivable statuses by default
    priority: 'all',
    request_type: 'request', // Filter for receipts only
    ...getCurrentMonthRange()
  });
  const [queryFilters, setQueryFilters] = useState<StoreReceiptFilters>({
    status: 'partial_issued,fulfilled,partially_received,fully_received,partial_issued_cancelled,partially_received_cancelled', // Show all receivable statuses by default
    priority: 'all',
    request_type: 'request', // Filter for receipts only
    ...getCurrentMonthRange()
  });

  // State for sorting
  const [sortField, setSortField] = useState<keyof StoreRequest | 'created_at' | 'updated_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get user's assigned store IDs for filtering
  const userStoreIds = userStores?.map(store => store.id) || [];

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

  // Fetch store receipts
  const {
    data: storeReceiptsData,
    isLoading: isLoadingStoreReceipts,
    error: storeReceiptsError,
    refetch: refetchStoreReceipts
  } = useQuery({
    queryKey: ['storeReceipts', currentPage, pageSize, queryFilters, sortField, sortDirection, userStoreIds, manualFetchTrigger],
    queryFn: () => storeReceiptService.getStoreReceipts(currentPage, pageSize, {
      ...queryFilters,
      requesting_store_id: userStoreIds.length > 0 ? userStoreIds.join(',') : undefined // Filter by user's assigned stores
    }),
    enabled: !!user && userStoreIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch store receipt statistics
  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['storeReceiptStats', queryFilters, userStoreIds],
    queryFn: () => storeReceiptService.getStoreReceiptStats({
      ...queryFilters,
      requesting_store_id: userStoreIds.length > 0 ? userStoreIds.join(',') : undefined // Filter by user's assigned stores
    }),
    enabled: !!user && userStoreIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Use user's assigned stores instead of fetching all stores
  const storesData = userStores || [];
  const isLoadingStores = false;
  const storesError = null;

  // Create store receipt mutation
  const createStoreReceiptMutation = useMutation({
    mutationFn: (data: StoreRequestFormData) => storeReceiptService.createStoreReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['storeReceiptStats'] });
      toast.success('Store receipt created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create store receipt');
    }
  });

  // Update store receipt mutation
  const updateStoreReceiptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StoreRequestFormData> }) => 
      storeReceiptService.updateStoreReceipt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['storeReceiptStats'] });
      toast.success('Store receipt updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update store receipt');
    }
  });

  // Delete store receipt mutation
  const deleteStoreReceiptMutation = useMutation({
    mutationFn: (id: string) => storeReceiptService.deleteStoreReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['storeReceiptStats'] });
      toast.success('Store receipt deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete store receipt');
    }
  });

  // Submit store receipt mutation
  const submitStoreReceiptMutation = useMutation({
    mutationFn: (id: string) => storeReceiptService.submitStoreReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['storeReceiptStats'] });
      toast.success('Store receipt submitted for approval');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit store receipt');
    }
  });

  // Approve store receipt mutation
  const approveStoreReceiptMutation = useMutation({
    mutationFn: ({ id, approvalData }: { id: string; approvalData?: any }) => 
      storeReceiptService.approveStoreReceipt(id, approvalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['storeReceiptStats'] });
      toast.success('Store receipt approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve store receipt');
    }
  });

  // Reject store receipt mutation
  const rejectStoreReceiptMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      storeReceiptService.rejectStoreReceipt(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['storeReceiptStats'] });
      toast.success('Store receipt rejected');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject store receipt');
    }
  });

  // Fulfill store receipt mutation
  const fulfillStoreReceiptMutation = useMutation({
    mutationFn: (id: string) => storeReceiptService.fulfillStoreReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['storeReceiptStats'] });
      toast.success('Store receipt fulfilled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to fulfill store receipt');
    }
  });

  // Cancel store receipt mutation
  const cancelStoreReceiptMutation = useMutation({
    mutationFn: (id: string) => storeRequestService.cancelStoreRequestReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['storeReceiptStats'] });
      toast.success('Store receipt cancelled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel store receipt');
    }
  });

  // Export to Excel mutation
  const exportToExcelMutation = useMutation({
    mutationFn: (filters: StoreReceiptFilters) => storeReceiptService.exportToExcel(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `store-receipts-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Store receipts exported to Excel successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to export to Excel');
    }
  });

  // Export to PDF mutation
  const exportToPDFMutation = useMutation({
    mutationFn: (filters: StoreReceiptFilters) => storeReceiptService.exportToPDF(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `store-receipts-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Store receipts exported to PDF successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to export to PDF');
    }
  });

  // Handler functions
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleSort = useCallback((field: keyof StoreRequest | 'created_at' | 'updated_at') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleFilter = useCallback((newFilters: Partial<StoreReceiptFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Update query filters for non-date filters
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<StoreReceiptFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  // Action handlers
  const createStoreReceipt = useCallback(async (data: StoreRequestFormData) => {
    return createStoreReceiptMutation.mutateAsync(data);
  }, [createStoreReceiptMutation]);

  const updateStoreReceipt = useCallback(async (id: string, data: Partial<StoreRequestFormData>) => {
    return updateStoreReceiptMutation.mutateAsync({ id, data });
  }, [updateStoreReceiptMutation]);

  const deleteStoreReceipt = useCallback(async (id: string) => {
    return deleteStoreReceiptMutation.mutateAsync(id);
  }, [deleteStoreReceiptMutation]);

  const submitStoreReceipt = useCallback(async (id: string) => {
    return submitStoreReceiptMutation.mutateAsync(id);
  }, [submitStoreReceiptMutation]);

  const approveStoreReceipt = useCallback(async (id: string, approvalData?: any) => {
    return approveStoreReceiptMutation.mutateAsync({ id, approvalData });
  }, [approveStoreReceiptMutation]);

  const rejectStoreReceipt = useCallback(async (id: string, reason: string) => {
    return rejectStoreReceiptMutation.mutateAsync({ id, reason });
  }, [rejectStoreReceiptMutation]);

  const fulfillStoreReceipt = useCallback(async (id: string) => {
    return fulfillStoreReceiptMutation.mutateAsync(id);
  }, [fulfillStoreReceiptMutation]);

  const cancelStoreReceipt = useCallback(async (id: string) => {
    return cancelStoreReceiptMutation.mutateAsync(id);
  }, [cancelStoreReceiptMutation]);

  const exportToExcel = useCallback(async (filters: StoreReceiptFilters) => {
    return exportToExcelMutation.mutateAsync(filters);
  }, [exportToExcelMutation]);

  const exportToPDF = useCallback(async (filters: StoreReceiptFilters) => {
    return exportToPDFMutation.mutateAsync(filters);
  }, [exportToPDFMutation]);

  // Permission checks based on user role
  const canCreate = user?.role === 'admin' || user?.role === 'manager' || false;
  const canEdit = user?.role === 'admin' || user?.role === 'manager' || false;
  const canDelete = user?.role === 'admin' || false;
  const canApprove = user?.role === 'admin' || user?.role === 'manager' || false;
  const canExport = user?.role === 'admin' || user?.role === 'manager' || false;

  // Computed values
  const storeReceipts = storeReceiptsData?.storeRequests || [];
  const stats = statsData?.stats;
  const stores = storesData || [];
  const totalItems = storeReceiptsData?.totalItems || 0;
  const totalPages = storeReceiptsData?.totalPages || 0;

  // Loading states
  const isLoading = isLoadingStoreReceipts || isLoadingStats || isLoadingStores;
  const isCreating = createStoreReceiptMutation.isPending;
  const isUpdating = updateStoreReceiptMutation.isPending;
  const isDeleting = deleteStoreReceiptMutation.isPending;
  const isSubmitting = submitStoreReceiptMutation.isPending;
  const isApproving = approveStoreReceiptMutation.isPending;
  const isRejecting = rejectStoreReceiptMutation.isPending;
  const isFulfilling = fulfillStoreReceiptMutation.isPending;
  const isCancelling = cancelStoreReceiptMutation.isPending;
  const isExportingExcel = exportToExcelMutation.isPending;
  const isExportingPdf = exportToPDFMutation.isPending;

  // Errors
  const error = storeReceiptsError || statsError || storesError;

  return {
    // Data
    storeReceipts,
    stats,
    stores,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isSubmitting,
    isApproving,
    isRejecting,
    isFulfilling,
    isCancelling,
    isExportingExcel,
    isExportingPdf,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    handleManualFetch,
    handleDateFilterChange,
    
    // Actions
    createStoreReceipt,
    updateStoreReceipt,
    deleteStoreReceipt,
    submitStoreReceipt,
    approveStoreReceipt,
    rejectStoreReceipt,
    fulfillStoreReceipt,
    cancelStoreReceipt,
    exportToExcel,
    exportToPDF,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canExport,
    
    // State
    filters,
    searchTerm,
    
    // Refetch
    refetchStoreReceipts,
    
    // Error
    error
  };
};
