import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReceiptFilters, ReceiptSortConfig } from '../types';
import { receiptService } from '../services/receiptService';
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
const defaultReceiptFilters: ReceiptFilters = {
  search: '',
  status: undefined,
  customerId: undefined,
  salesInvoiceId: undefined,
  currencyId: undefined,
  paymentTypeId: undefined,
  dateFrom: undefined,
  dateTo: undefined
};

// Default sort config
const defaultReceiptSortConfig: ReceiptSortConfig = {
  field: 'transactionDate',
  direction: 'desc'
};

export const useReceiptManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [filters, setFilters] = useState<ReceiptFilters>(defaultReceiptFilters);
  const [queryFilters, setQueryFilters] = useState<ReceiptFilters>(defaultReceiptFilters);
  const [sortConfig, setSortConfig] = useState<ReceiptSortConfig>(defaultReceiptSortConfig);
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

  // Fetch receipts with pagination
  const { 
    data: receiptsResponse, 
    isLoading: isLoadingReceipts, 
    error: receiptsError,
    refetch: refetchReceipts 
  } = useQuery({
    queryKey: ['receipts', currentPage, pageSize, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: () => receiptService.getReceipts(currentPage, pageSize, queryFilters, sortConfig),
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
    queryKey: ['receiptStats'],
    queryFn: receiptService.getReceiptStats,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Computed values
  const receipts = useMemo(() => receiptsResponse?.receipts || [], [receiptsResponse]);
  const totalItems = useMemo(() => receiptsResponse?.pagination?.totalItems || 0, [receiptsResponse]);
  const totalPages = useMemo(() => receiptsResponse?.pagination?.totalPages || 0, [receiptsResponse]);
  const isLoading = useMemo(() => isLoadingReceipts || isLoadingStats, [isLoadingReceipts, isLoadingStats]);
  const error = useMemo(() => receiptsError || statsError, [receiptsError, statsError]);

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

  const handleSort = useCallback((field: ReceiptSortConfig['field'], direction: 'asc' | 'desc') => {
    setSortConfig({ field, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<ReceiptFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters);
    setManualFetchTrigger(prev => prev + 1);
    setCurrentPage(1);
  }, [filters]);

  const handleDateFilterChange = useCallback((newFilters: Partial<ReceiptFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Permissions (read-only for receipts)
  const canView = useMemo(() => {
    if (!user) return false;
    // All authenticated users can view receipts
    return true;
  }, [user]);

  return {
    receipts,
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
    refetchReceipts,
    sortConfig,
    filters,
    searchTerm,
    canView
  };
};

