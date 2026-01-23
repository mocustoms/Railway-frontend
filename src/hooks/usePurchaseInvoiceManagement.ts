import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PurchaseInvoiceFilters, PurchaseInvoiceSortConfig, PurchaseInvoiceFormData } from '../types';
import {
  defaultPurchaseInvoiceFilters,
  defaultPurchaseInvoiceSortConfig,
  defaultPurchaseInvoiceStats
} from '../data/purchaseInvoiceModules';
import { purchaseInvoiceService } from '../services/purchaseInvoiceService';
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

export const usePurchaseInvoiceManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState<PurchaseInvoiceFilters>(defaultPurchaseInvoiceFilters);
  const [queryFilters, setQueryFilters] = useState<PurchaseInvoiceFilters>(defaultPurchaseInvoiceFilters);
  const [sortConfig, setSortConfig] = useState<PurchaseInvoiceSortConfig>(defaultPurchaseInvoiceSortConfig);
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

  // Fetch purchase invoices with pagination
  const { 
    data: purchaseInvoicesResponse, 
    isLoading: isLoadingPurchaseInvoices, 
    error: purchaseInvoicesError,
    refetch: refetchPurchaseInvoices 
  } = useQuery({
    queryKey: ['purchaseInvoices', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: () => purchaseInvoiceService.getPurchaseInvoices(currentPage, pageSize, queryFilters, sortConfig),
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
    queryKey: ['purchaseInvoiceStats'],
    queryFn: purchaseInvoiceService.getPurchaseInvoiceStats,
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
    mutationFn: purchaseInvoiceService.createPurchaseInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoiceStats'] });
      toast.success('Purchase invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create purchase invoice');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PurchaseInvoiceFormData }) => 
      purchaseInvoiceService.updatePurchaseInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoiceStats'] });
      toast.success('Purchase invoice updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update purchase invoice');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: purchaseInvoiceService.deletePurchaseInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoiceStats'] });
      toast.success('Purchase invoice deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete purchase invoice');
    }
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: purchaseInvoiceService.sendPurchaseInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoiceStats'] });
      toast.success('Purchase invoice sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send purchase invoice');
    }
  });

  // Approve invoice mutation
  const approveInvoiceMutation = useMutation({
    mutationFn: (id: string) => 
      purchaseInvoiceService.approveInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoiceStats'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoice'] });
      toast.success('Invoice approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve invoice');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => 
      purchaseInvoiceService.rejectPurchaseInvoice(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoiceStats'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoice'] });
      toast.success('Purchase invoice rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject purchase invoice');
    }
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, cancellationReason }: { id: string; cancellationReason: string }) => 
      purchaseInvoiceService.cancelPurchaseInvoice(id, cancellationReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoiceStats'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoice'] });
      toast.success('Purchase invoice cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel purchase invoice');
    }
  });


  // Computed values
  const purchaseInvoices = useMemo(() => purchaseInvoicesResponse?.purchaseInvoices || [], [purchaseInvoicesResponse]);
  const totalItems = useMemo(() => purchaseInvoicesResponse?.pagination?.totalItems || 0, [purchaseInvoicesResponse]);
  const totalPages = useMemo(() => purchaseInvoicesResponse?.pagination?.totalPages || 0, [purchaseInvoicesResponse]);
  const isLoading = useMemo(() => isLoadingPurchaseInvoices || isLoadingStats, [isLoadingPurchaseInvoices, isLoadingStats]);
  const error = useMemo(() => purchaseInvoicesError || statsError, [purchaseInvoicesError, statsError]);

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

  const handleSort = useCallback((field: PurchaseInvoiceSortConfig['field'], direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<PurchaseInvoiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Update query filters for non-date filters
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<PurchaseInvoiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  const createPurchaseInvoice = useCallback(async (data: PurchaseInvoiceFormData) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updatePurchaseInvoice = useCallback(async (id: string, data: PurchaseInvoiceFormData) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deletePurchaseInvoice = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const sendPurchaseInvoice = useCallback(async (id: string) => {
    await sendMutation.mutateAsync(id);
  }, [sendMutation]);

  const approveInvoice = useCallback(async (id: string) => {
    await approveInvoiceMutation.mutateAsync(id);
  }, [approveInvoiceMutation]);

  const rejectPurchaseInvoice = useCallback(async (id: string, rejectionReason: string) => {
    await rejectMutation.mutateAsync({ id, rejectionReason });
  }, [rejectMutation]);

  const cancelPurchaseInvoice = useCallback(async (id: string, cancellationReason: string) => {
    await cancelMutation.mutateAsync({ id, cancellationReason });
  }, [cancelMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await purchaseInvoiceService.exportToExcel(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchase-invoices-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      const blob = await purchaseInvoiceService.exportToPDF(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchase-invoices-${new Date().toISOString().split('T')[0]}.pdf`;
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
  const canApprove = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);
  const canReject = useMemo(() => user?.role === 'admin' || user?.role === 'manager', [user?.role]);

  return {
    // Data
    purchaseInvoices,
    stats: stats || defaultPurchaseInvoiceStats,
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
    isApproving: approveInvoiceMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isCancelling: cancelMutation.isPending,
    
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
    createPurchaseInvoice,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
    sendPurchaseInvoice,
    approveInvoice,
    rejectPurchaseInvoice,
    cancelPurchaseInvoice,
    exportToExcel,
    exportToPDF,
    refetchPurchaseInvoices,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canSend,
    canApprove,
    canReject,
    canCancel: canReject // Same permissions as reject
  };
};
