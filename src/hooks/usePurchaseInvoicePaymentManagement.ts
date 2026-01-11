import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PurchaseInvoicePaymentFilters, PurchaseInvoicePaymentSortConfig } from '../types';
import { purchaseInvoicePaymentService } from '../services/purchaseInvoicePaymentService';
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

// Default filters
const defaultPaymentFilters: PurchaseInvoicePaymentFilters = {
  search: '',
  status: undefined,
  vendorId: undefined,
  purchaseInvoiceId: undefined,
  currencyId: undefined,
  paymentTypeId: undefined,
  dateFrom: undefined,
  dateTo: undefined
};

// Default sort config
const defaultPaymentSortConfig: PurchaseInvoicePaymentSortConfig = {
  field: 'transactionDate',
  direction: 'desc'
};

export const usePurchaseInvoicePaymentManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState<PurchaseInvoicePaymentFilters>(defaultPaymentFilters);
  const [queryFilters, setQueryFilters] = useState<PurchaseInvoicePaymentFilters>(defaultPaymentFilters);
  const [sortConfig, setSortConfig] = useState<PurchaseInvoicePaymentSortConfig>(defaultPaymentSortConfig);
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

  // Fetch payments with pagination
  const { 
    data: paymentsResponse, 
    isLoading: isLoadingPayments, 
    error: paymentsError,
    refetch: refetchPayments 
  } = useQuery({
    queryKey: ['purchase-invoice-payments', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: () => purchaseInvoicePaymentService.getPayments(currentPage, pageSize, queryFilters, sortConfig),
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
    queryKey: ['purchaseInvoicePaymentStats'],
    queryFn: purchaseInvoicePaymentService.getPaymentStats,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Computed values
  const payments = useMemo(() => paymentsResponse?.payments || [], [paymentsResponse]);
  const totalItems = useMemo(() => paymentsResponse?.pagination?.totalItems || 0, [paymentsResponse]);
  const totalPages = useMemo(() => paymentsResponse?.pagination?.totalPages || 0, [paymentsResponse]);
  const isLoading = useMemo(() => isLoadingPayments || isLoadingStats, [isLoadingPayments, isLoadingStats]);
  const error = useMemo(() => paymentsError || statsError, [paymentsError, statsError]);

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

  const handleSort = useCallback((field: PurchaseInvoicePaymentSortConfig['field'], direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<PurchaseInvoicePaymentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters);
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<PurchaseInvoicePaymentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Permissions (read-only for payments)
  const canView = useMemo(() => {
    if (!user) return false;
    // All authenticated users can view payments
    return true;
  }, [user]);

  return {
    payments,
    stats: stats || {
      total: 0,
      active: 0,
      reversed: 0,
      cancelled: 0,
      totalAmount: 0,
      thisMonth: 0,
      lastMonth: 0
    },
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    handleManualFetch,
    handleDateFilterChange,
    refetchPayments,
    sortConfig,
    filters,
    searchTerm,
    canView
  };
};
