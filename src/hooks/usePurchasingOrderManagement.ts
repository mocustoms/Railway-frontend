import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PurchasingOrderFilters, PurchasingOrderSortConfig, PurchasingOrderFormData } from '../types';
import {
  defaultPurchasingOrderFilters,
  defaultPurchasingOrderSortConfig,
  defaultPurchasingOrderStats
} from '../data/purchasingOrderModules';
import { purchasingOrderService } from '../services/purchasingOrderService';
import storeService from '../services/storeService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } => {
  let timeout: NodeJS.Timeout | null = null;
  
  const debouncedFunction = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };
  
  debouncedFunction.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };
  
  return debouncedFunction;
};

export const usePurchasingOrderManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState<PurchasingOrderFilters>(defaultPurchasingOrderFilters);
  const [queryFilters, setQueryFilters] = useState<PurchasingOrderFilters>(defaultPurchasingOrderFilters);
  const [sortConfig, setSortConfig] = useState<PurchasingOrderSortConfig>(defaultPurchasingOrderSortConfig);
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

  // Fetch purchasing orders with pagination
  const { 
    data: purchasingOrdersResponse, 
    isLoading: isLoadingPurchasingOrders, 
    error: purchasingOrdersError,
    refetch: refetchPurchasingOrders 
  } = useQuery({
    queryKey: ['purchasingOrders', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: () => purchasingOrderService.getPurchasingOrders(currentPage, pageSize, queryFilters, sortConfig),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  // Fetch stats
  const { 
    data: stats, 
    isLoading: isLoadingStats, 
    error: statsError 
  } = useQuery({
    queryKey: ['purchasingOrderStats'],
    queryFn: purchasingOrderService.getPurchasingOrderStats,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch stores for filters
  const { 
    data: storesResponse, 
    isLoading: isLoadingStores 
  } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeService.getStores({ limit: 1000, status: 'active' }),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: purchasingOrderService.createPurchasingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchasingOrderStats'] });
      toast.success('Purchasing order created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create purchasing order');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PurchasingOrderFormData }) => 
      purchasingOrderService.updatePurchasingOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchasingOrderStats'] });
      toast.success('Purchasing order updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update purchasing order');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: purchasingOrderService.deletePurchasingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchasingOrderStats'] });
      toast.success('Purchasing order deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete purchasing order');
    }
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: purchasingOrderService.sendPurchasingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchasingOrderStats'] });
      toast.success('Purchasing order sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send purchasing order');
    }
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: purchasingOrderService.acceptPurchasingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchasingOrderStats'] });
      toast.success('Purchasing order accepted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept purchasing order');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => 
      purchasingOrderService.rejectPurchasingOrder(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchasingOrderStats'] });
      toast.success('Purchasing order rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject purchasing order');
    }
  });

  // Receive mutation
  const receiveMutation = useMutation({
    mutationFn: ({ id, receivedDate }: { id: string; receivedDate?: string }) => 
      purchasingOrderService.receivePurchasingOrder(id, receivedDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchasingOrderStats'] });
      toast.success('Purchasing order received successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to receive purchasing order');
    }
  });

  // Reopen mutation
  const reopenMutation = useMutation({
    mutationFn: ({ id, validUntil }: { id: string; validUntil: string }) => 
      purchasingOrderService.reopenPurchasingOrder(id, validUntil),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasingOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchasingOrderStats'] });
      queryClient.invalidateQueries({ queryKey: ['purchasingOrder'] });
      toast.success('Purchasing order reopened successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reopen purchasing order');
    }
  });
  // Computed values
  const purchasingOrders = useMemo(() => purchasingOrdersResponse?.purchasingOrders || [], [purchasingOrdersResponse]);
  const totalItems = useMemo(() => purchasingOrdersResponse?.pagination?.totalItems || 0, [purchasingOrdersResponse]);
  const totalPages = useMemo(() => purchasingOrdersResponse?.pagination?.totalPages || 0, [purchasingOrdersResponse]);
  const isLoading = useMemo(() => isLoadingPurchasingOrders || isLoadingStats, [isLoadingPurchasingOrders, isLoadingStats]);
  const error = useMemo(() => purchasingOrdersError || statsError, [purchasingOrdersError, statsError]);

  // Handlers
  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: PurchasingOrderSortConfig['field'], direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<PurchasingOrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Update query filters for non-date filters
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<PurchasingOrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  const createPurchasingOrder = useCallback(async (data: PurchasingOrderFormData) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updatePurchasingOrder = useCallback(async (id: string, data: PurchasingOrderFormData) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deletePurchasingOrder = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const sendPurchasingOrder = useCallback(async (id: string) => {
    await sendMutation.mutateAsync(id);
  }, [sendMutation]);

  const acceptPurchasingOrder = useCallback(async (id: string) => {
    await acceptMutation.mutateAsync(id);
  }, [acceptMutation]);

  const rejectPurchasingOrder = useCallback(async (id: string, rejectionReason: string) => {
    await rejectMutation.mutateAsync({ id, rejectionReason });
  }, [rejectMutation]);

  const receivePurchasingOrder = useCallback(async (id: string, receivedDate?: string) => {
    await receiveMutation.mutateAsync({ id, receivedDate });
  }, [receiveMutation]);

  const reopenPurchasingOrder = useCallback(async (id: string, validUntil: string) => {
    await reopenMutation.mutateAsync({ id, validUntil });
  }, [reopenMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await purchasingOrderService.exportToExcel(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchasing-orders-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to export to Excel');
    }
  }, [queryFilters]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await purchasingOrderService.exportToPDF(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchasing-orders-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF file downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to export to PDF');
    }
  }, [queryFilters]);

  // Permission checks
  const canCreate = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);
  const canEdit = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);
  const canDelete = useMemo(() => user?.role === 'admin', [user?.role]);
  const canExport = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);
  const canSend = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);
  const canAccept = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);
  const canReject = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);
  const canReceive = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);

  // console.log('purchasing orders', purchasingOrders);

  return {
    // Data
    purchasingOrders,
    stats: stats || defaultPurchasingOrderStats,
    stores: storesResponse?.data || [],
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    filters,
    sortConfig,
    searchTerm,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSending: sendMutation.isPending,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isReceiving: receiveMutation.isPending,
    isReopening: reopenMutation.isPending,
    
    // Error states
    error,
    statsError,
    
    // Actions
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    handleManualFetch,
    handleDateFilterChange,
    createPurchasingOrder,
    updatePurchasingOrder,
    deletePurchasingOrder,
    sendPurchasingOrder,
    acceptPurchasingOrder,
    rejectPurchasingOrder,
    receivePurchasingOrder,
    reopenPurchasingOrder,
    exportToExcel,
    exportToPDF,
    refetchPurchasingOrders,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canSend,
    canAccept,
    canReject,
    canReceive
  };
};
