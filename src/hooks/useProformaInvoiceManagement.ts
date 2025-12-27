import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProformaInvoiceFilters, ProformaInvoiceSortConfig, ProformaInvoiceFormData } from '../types';
import {
  defaultProformaInvoiceFilters,
  defaultProformaInvoiceSortConfig,
  defaultProformaInvoiceStats
} from '../data/proformaInvoiceModules';
import { proformaInvoiceService } from '../services/proformaInvoiceService';
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

export const useProformaInvoiceManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState<ProformaInvoiceFilters>(defaultProformaInvoiceFilters);
  const [queryFilters, setQueryFilters] = useState<ProformaInvoiceFilters>(defaultProformaInvoiceFilters);
  const [sortConfig, setSortConfig] = useState<ProformaInvoiceSortConfig>(defaultProformaInvoiceSortConfig);
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

  // Fetch proforma invoices with pagination
  const { 
    data: proformaInvoicesResponse, 
    isLoading: isLoadingProformaInvoices, 
    error: proformaInvoicesError,
    refetch: refetchProformaInvoices 
  } = useQuery({
    queryKey: ['proformaInvoices', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: () => proformaInvoiceService.getProformaInvoices(currentPage, pageSize, queryFilters, sortConfig),
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
    queryKey: ['proformaInvoiceStats'],
    queryFn: proformaInvoiceService.getProformaInvoiceStats,
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
    mutationFn: proformaInvoiceService.createProformaInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoiceStats'] });
      toast.success('Proforma invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create proforma invoice');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProformaInvoiceFormData }) => 
      proformaInvoiceService.updateProformaInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoiceStats'] });
      toast.success('Proforma invoice updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update proforma invoice');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: proformaInvoiceService.deleteProformaInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoiceStats'] });
      toast.success('Proforma invoice deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete proforma invoice');
    }
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: proformaInvoiceService.sendProformaInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoiceStats'] });
      toast.success('Proforma invoice sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send proforma invoice');
    }
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: proformaInvoiceService.acceptProformaInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoiceStats'] });
      toast.success('Proforma invoice accepted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept proforma invoice');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => 
      proformaInvoiceService.rejectProformaInvoice(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoiceStats'] });
      toast.success('Proforma invoice rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject proforma invoice');
    }
  });

  // Reopen mutation
  const reopenMutation = useMutation({
    mutationFn: ({ id, validUntil }: { id: string; validUntil: string }) => 
      proformaInvoiceService.reopenProformaInvoice(id, validUntil),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proformaInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoiceStats'] });
      queryClient.invalidateQueries({ queryKey: ['proformaInvoice'] });
      toast.success('Proforma invoice reopened successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reopen proforma invoice');
    }
  });

  // Computed values
  const proformaInvoices = useMemo(() => proformaInvoicesResponse?.proformaInvoices || [], [proformaInvoicesResponse]);
  const totalItems = useMemo(() => proformaInvoicesResponse?.pagination?.totalItems || 0, [proformaInvoicesResponse]);
  const totalPages = useMemo(() => proformaInvoicesResponse?.pagination?.totalPages || 0, [proformaInvoicesResponse]);
  const isLoading = useMemo(() => isLoadingProformaInvoices || isLoadingStats, [isLoadingProformaInvoices, isLoadingStats]);
  const error = useMemo(() => proformaInvoicesError || statsError, [proformaInvoicesError, statsError]);

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

  const handleSort = useCallback((field: ProformaInvoiceSortConfig['field'], direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<ProformaInvoiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Update query filters for non-date filters
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<ProformaInvoiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  const createProformaInvoice = useCallback(async (data: ProformaInvoiceFormData) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateProformaInvoice = useCallback(async (id: string, data: ProformaInvoiceFormData) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteProformaInvoice = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const sendProformaInvoice = useCallback(async (id: string) => {
    await sendMutation.mutateAsync(id);
  }, [sendMutation]);

  const acceptProformaInvoice = useCallback(async (id: string) => {
    await acceptMutation.mutateAsync(id);
  }, [acceptMutation]);

  const rejectProformaInvoice = useCallback(async (id: string, rejectionReason: string) => {
    await rejectMutation.mutateAsync({ id, rejectionReason });
  }, [rejectMutation]);

  const reopenProformaInvoice = useCallback(async (id: string, validUntil: string) => {
    await reopenMutation.mutateAsync({ id, validUntil });
  }, [reopenMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await proformaInvoiceService.exportToExcel(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proforma-invoices-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      const blob = await proformaInvoiceService.exportToPDF(queryFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proforma-invoices-${new Date().toISOString().split('T')[0]}.pdf`;
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

  return {
    // Data
    proformaInvoices,
    stats: stats || defaultProformaInvoiceStats,
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
    createProformaInvoice,
    updateProformaInvoice,
    deleteProformaInvoice,
    sendProformaInvoice,
    acceptProformaInvoice,
    rejectProformaInvoice,
    reopenProformaInvoice,
    exportToExcel,
    exportToPDF,
    refetchProformaInvoices,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canSend,
    canAccept,
    canReject
  };
};
