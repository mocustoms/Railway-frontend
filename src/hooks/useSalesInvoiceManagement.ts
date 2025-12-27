import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SalesInvoiceFilters, SalesInvoiceSortConfig, SalesInvoiceFormData } from '../types';
import {
  defaultSalesInvoiceFilters,
  defaultSalesInvoiceSortConfig,
  defaultSalesInvoiceStats
} from '../data/salesInvoiceModules';
import { salesInvoiceService } from '../services/salesInvoiceService';
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

export const useSalesInvoiceManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState<SalesInvoiceFilters>(defaultSalesInvoiceFilters);
  const [queryFilters, setQueryFilters] = useState<SalesInvoiceFilters>(defaultSalesInvoiceFilters);
  const [sortConfig, setSortConfig] = useState<SalesInvoiceSortConfig>(defaultSalesInvoiceSortConfig);
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
    data: salesInvoicesResponse, 
    isLoading: isLoadingSalesInvoices, 
    error: salesInvoicesError,
    refetch: refetchSalesInvoices 
  } = useQuery({
    queryKey: ['salesInvoices', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: () => salesInvoiceService.getSalesInvoices(currentPage, pageSize, queryFilters, sortConfig),
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
    queryKey: ['salesInvoiceStats'],
    queryFn: salesInvoiceService.getSalesInvoiceStats,
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
    mutationFn: salesInvoiceService.createSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoiceStats'] });
      toast.success('Sales order created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create sales order');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SalesInvoiceFormData }) => 
      salesInvoiceService.updateSalesInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoiceStats'] });
      toast.success('Sales order updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update sales order');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: salesInvoiceService.deleteSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoiceStats'] });
      toast.success('Sales order deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete sales order');
    }
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: salesInvoiceService.sendSalesInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoiceStats'] });
      toast.success('Sales order sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send sales order');
    }
  });

  // Approve invoice mutation
  const approveInvoiceMutation = useMutation({
    mutationFn: (id: string) => 
      salesInvoiceService.approveInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoiceStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoice'] });
      toast.success('Invoice approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve invoice');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => 
      salesInvoiceService.rejectSalesInvoice(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoiceStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoice'] });
      toast.success('Sales invoice rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject sales invoice');
    }
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, cancellationReason }: { id: string; cancellationReason: string }) => 
      salesInvoiceService.cancelSalesInvoice(id, cancellationReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoiceStats'] });
      queryClient.invalidateQueries({ queryKey: ['salesInvoice'] });
      toast.success('Sales invoice cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel sales invoice');
    }
  });

  // Computed values
  const salesInvoices = useMemo(() => salesInvoicesResponse?.salesInvoices || [], [salesInvoicesResponse]);
  const totalItems = useMemo(() => salesInvoicesResponse?.pagination?.totalItems || 0, [salesInvoicesResponse]);
  const totalPages = useMemo(() => salesInvoicesResponse?.pagination?.totalPages || 0, [salesInvoicesResponse]);
  const isLoading = useMemo(() => isLoadingSalesInvoices || isLoadingStats, [isLoadingSalesInvoices, isLoadingStats]);
  const error = useMemo(() => salesInvoicesError || statsError, [salesInvoicesError, statsError]);

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

  const handleSort = useCallback((field: SalesInvoiceSortConfig['field'], direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<SalesInvoiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Update query filters for non-date filters
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<SalesInvoiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  const createSalesInvoice = useCallback(async (data: SalesInvoiceFormData) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateSalesInvoice = useCallback(async (id: string, data: SalesInvoiceFormData) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteSalesInvoice = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const sendSalesInvoice = useCallback(async (id: string) => {
    await sendMutation.mutateAsync(id);
  }, [sendMutation]);

  const approveInvoice = useCallback(async (id: string) => {
    await approveInvoiceMutation.mutateAsync(id);
  }, [approveInvoiceMutation]);

  const rejectSalesInvoice = useCallback(async (id: string, rejectionReason: string) => {
    await rejectMutation.mutateAsync({ id, rejectionReason });
  }, [rejectMutation]);

  const cancelSalesInvoice = useCallback(async (id: string, cancellationReason: string) => {
    await cancelMutation.mutateAsync({ id, cancellationReason });
  }, [cancelMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await salesInvoiceService.exportToExcel(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-invoices-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      const blob = await salesInvoiceService.exportToPDF(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-invoices-${new Date().toISOString().split('T')[0]}.pdf`;
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
    salesInvoices,
    stats: stats || defaultSalesInvoiceStats,
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
    createSalesInvoice,
    updateSalesInvoice,
    deleteSalesInvoice,
    sendSalesInvoice,
    approveInvoice,
    rejectSalesInvoice,
    cancelSalesInvoice,
    exportToExcel,
    exportToPDF,
    refetchSalesInvoices,
    
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

