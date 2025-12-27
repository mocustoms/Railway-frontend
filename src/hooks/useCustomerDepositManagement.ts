import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import customerDepositService from '../services/customerDepositService';
import { 
  CustomerDepositFilters, 
  CustomerDepositSortConfig, 
  CustomerDepositFormData,
  CustomerDepositStats
} from '../types';
import { toast } from 'react-hot-toast';

export const useCustomerDepositManagement = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CustomerDepositFilters>({
    search: '',
    customerId: '',
    paymentTypeId: '',
    currencyId: '',
    bankDetailId: '',
    startDate: '',
    endDate: '',
    status: 'all',
    minAmount: undefined,
    maxAmount: undefined
  });
  const [queryFilters, setQueryFilters] = useState<CustomerDepositFilters>({
    search: '',
    customerId: '',
    paymentTypeId: '',
    currencyId: '',
    bankDetailId: '',
    startDate: '',
    endDate: '',
    status: 'all',
    minAmount: undefined,
    maxAmount: undefined
  });
  const [manualFetchTrigger, setManualFetchTrigger] = useState(0);
  const [sortConfig, setSortConfig] = useState<CustomerDepositSortConfig>({
    column: 'transactionDate',
    direction: 'desc'
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Fetch customer deposits
  const {
    data: depositsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['customer-deposits', page, limit, queryFilters, sortConfig, manualFetchTrigger],
    queryFn: () => customerDepositService.getAll(page, limit, queryFilters, sortConfig),
    placeholderData: (previousData) => previousData
  });

  // Fetch statistics
  const { data: stats } = useQuery<CustomerDepositStats>({
    queryKey: ['customer-deposit-stats', queryFilters],
    queryFn: () => customerDepositService.getStats(queryFilters),
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch customers for search
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-search', filters.search],
    queryFn: () => customerDepositService.searchCustomers(filters.search),
    enabled: !!filters.search && filters.search.length >= 2
  });

  // Fetch payment types
  const { data: paymentTypes = [] } = useQuery({
    queryKey: ['customer-deposit-management-payment-types'],
    queryFn: customerDepositService.getPaymentTypes
  });

  // Fetch bank details
  const { data: bankDetails = [] } = useQuery({
    queryKey: ['customer-deposit-management-bank-details'],
    queryFn: customerDepositService.getBankDetails
  });

  // Fetch currencies
  const { data: currencies = [] } = useQuery({
    queryKey: ['customer-deposit-management-currencies'],
    queryFn: customerDepositService.getCurrencies
  });

  // Fetch leaf accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['leaf-accounts'],
    queryFn: customerDepositService.getLeafAccounts
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CustomerDepositFormData) => customerDepositService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['customer-deposit-stats'] });
      toast.success('Customer deposit created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create customer deposit');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerDepositFormData }) =>
      customerDepositService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['customer-deposit-stats'] });
      toast.success('Customer deposit updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update customer deposit');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerDepositService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['customer-deposit-stats'] });
      toast.success('Customer deposit deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete customer deposit');
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => customerDepositService.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['customer-deposit-stats'] });
      toast.success('Customer deposit status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update customer deposit status');
    }
  });


  // Filter handlers
  const updateFilters = useCallback((newFilters: Partial<CustomerDepositFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setQueryFilters(prev => ({ ...prev, ...newFilters })); // Also update query filters for immediate search
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleDateFilterChange = useCallback((newFilters: Partial<CustomerDepositFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Don't trigger fetch automatically for date changes
  }, []);

  const handleManualFetch = useCallback(() => {
    setQueryFilters(filters); // Copy current display filters to query filters
    setManualFetchTrigger(prev => prev + 1);
    setPage(1);
  }, [filters]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {
      search: '',
      customerId: '',
      paymentTypeId: '',
      currencyId: '',
      bankDetailId: '',
      startDate: '',
      endDate: ''
    };
    setFilters(clearedFilters);
    setQueryFilters(clearedFilters);
    setPage(1);
  }, []);

  // Sort handlers
  const updateSortConfig = useCallback((newSortConfig: CustomerDepositSortConfig) => {
    setSortConfig(newSortConfig);
  }, []);

  // Pagination handlers
  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    if ((depositsData as any)?.pagination && page < (depositsData as any).pagination.totalPages) {
      setPage(page + 1);
    }
  }, [page, depositsData]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  // Action handlers
  const createDeposit = useCallback(async (data: CustomerDepositFormData) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateDeposit = useCallback(async (id: string, data: CustomerDepositFormData) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteDeposit = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const toggleDepositStatus = useCallback(async (id: string) => {
    await toggleStatusMutation.mutateAsync(id);
  }, [toggleStatusMutation]);

  const exportToExcel = useCallback(async () => {
    return await customerDepositService.exportToExcel(filters);
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    return await customerDepositService.exportToPDF(filters);
  }, [filters]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  return {
    // Data
    deposits: (depositsData as any)?.deposits || [],
    pagination: (depositsData as any)?.pagination,
    stats: stats || {
      totalDeposits: 0,
      activeDeposits: 0,
      inactiveDeposits: 0,
      totalDepositAmount: 0,
      totalEquivalentAmount: 0
    },
    customers,
    paymentTypes,
    bankDetails,
    currencies,
    accounts,
    
    // State
    filters,
    sortConfig,
    page,
    limit,
    setLimit,
    
    // Loading states
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isExportingExcel: false,
    isExportingPdf: false,
    
    // Error states
    error,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    toggleStatusError: toggleStatusMutation.error,
    
    // Actions
    updateFilters,
    handleDateFilterChange,
    handleManualFetch,
    clearFilters,
    updateSortConfig,
    goToPage,
    nextPage,
    prevPage,
    createDeposit,
    updateDeposit,
    deleteDeposit,
    toggleDepositStatus,
    exportToExcel,
    exportToPDF,
    refetch
  };
};
