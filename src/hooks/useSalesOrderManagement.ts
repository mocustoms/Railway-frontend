import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SalesOrderFilters, SalesOrderSortConfig, SalesOrderFormData } from '../types';
import {
  defaultSalesOrderFilters,
  defaultSalesOrderSortConfig,
  defaultSalesOrderStats
} from '../data/salesOrderModules';
import { salesOrderService } from '../services/salesOrderService';
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

export const useSalesOrderManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState<SalesOrderFilters>(defaultSalesOrderFilters);
  const [queryFilters, setQueryFilters] = useState<SalesOrderFilters>(defaultSalesOrderFilters);
  const [sortConfig, setSortConfig] = useState<SalesOrderSortConfig>(defaultSalesOrderSortConfig);
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

  // Fetch sales orders with pagination
  const { 
    data: salesOrdersResponse, 
    isLoading: isLoadingSalesOrders, 
    error: salesOrdersError,
    refetch: refetchSalesOrders 
  } = useQuery({
    queryKey: ['salesOrders', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: () => salesOrderService.getSalesOrders(currentPage, pageSize, queryFilters, sortConfig),
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
    queryKey: ['salesOrderStats'],
    queryFn: salesOrderService.getSalesOrderStats,
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
    mutationFn: salesOrderService.createSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrderStats'] });
      toast.success('Sales order created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create sales order');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SalesOrderFormData }) => 
      salesOrderService.updateSalesOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrderStats'] });
      toast.success('Sales order updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update sales order');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: salesOrderService.deleteSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrderStats'] });
      toast.success('Sales order deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete sales order');
    }
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: salesOrderService.sendSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrderStats'] });
      toast.success('Sales order sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send sales order');
    }
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: salesOrderService.acceptSalesOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrderStats'] });
      toast.success('Sales order accepted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept sales order');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => 
      salesOrderService.rejectSalesOrder(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrderStats'] });
      toast.success('Sales order rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject sales order');
    }
  });

  // Fulfill mutation
  const fulfillMutation = useMutation({
    mutationFn: ({ id, deliveryDate }: { id: string; deliveryDate?: string }) => 
      salesOrderService.fulfillSalesOrder(id, deliveryDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrderStats'] });
      toast.success('Sales order delivered successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deliver sales order');
    }
  });

  // Reopen mutation
  const reopenMutation = useMutation({
    mutationFn: ({ id, validUntil }: { id: string; validUntil: string }) => 
      salesOrderService.reopenSalesOrder(id, validUntil),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrderStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrder'] });
      toast.success('Sales order reopened successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reopen sales order');
    }
  });

  // Computed values
  const salesOrders = useMemo(() => salesOrdersResponse?.salesOrders || [], [salesOrdersResponse]);
  const totalItems = useMemo(() => salesOrdersResponse?.pagination?.totalItems || 0, [salesOrdersResponse]);
  const totalPages = useMemo(() => salesOrdersResponse?.pagination?.totalPages || 0, [salesOrdersResponse]);
  const isLoading = useMemo(() => isLoadingSalesOrders || isLoadingStats, [isLoadingSalesOrders, isLoadingStats]);
  const error = useMemo(() => salesOrdersError || statsError, [salesOrdersError, statsError]);

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

  const handleSort = useCallback((field: SalesOrderSortConfig['field'], direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<SalesOrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Update query filters for non-date filters
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<SalesOrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  const createSalesOrder = useCallback(async (data: SalesOrderFormData) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateSalesOrder = useCallback(async (id: string, data: SalesOrderFormData) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteSalesOrder = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const sendSalesOrder = useCallback(async (id: string) => {
    await sendMutation.mutateAsync(id);
  }, [sendMutation]);

  const acceptSalesOrder = useCallback(async (id: string) => {
    await acceptMutation.mutateAsync(id);
  }, [acceptMutation]);

  const rejectSalesOrder = useCallback(async (id: string, rejectionReason: string) => {
    await rejectMutation.mutateAsync({ id, rejectionReason });
  }, [rejectMutation]);

  const fulfillSalesOrder = useCallback(async (id: string, deliveryDate?: string) => {
    await fulfillMutation.mutateAsync({ id, deliveryDate });
  }, [fulfillMutation]);

  const reopenSalesOrder = useCallback(async (id: string, validUntil: string) => {
    await reopenMutation.mutateAsync({ id, validUntil });
  }, [reopenMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await salesOrderService.exportToExcel(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-orders-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      const blob = await salesOrderService.exportToPDF(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-orders-${new Date().toISOString().split('T')[0]}.pdf`;
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
  const canFulfill = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);

  return {
    // Data
    salesOrders,
    stats: stats || defaultSalesOrderStats,
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
    isFulfilling: fulfillMutation.isPending,
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
    createSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
    sendSalesOrder,
    acceptSalesOrder,
    rejectSalesOrder,
    fulfillSalesOrder,
    reopenSalesOrder,
    exportToExcel,
    exportToPDF,
    refetchSalesOrders,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canSend,
    canAccept,
    canReject,
    canFulfill
  };
};

