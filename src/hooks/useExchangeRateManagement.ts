import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from './useConfirm';
import {
  getExchangeRates,
  getAllActiveExchangeRates,
  getExchangeRate,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  toggleExchangeRateStatus,
  getExchangeRateStats,
  getExchangeRateHistory,
  exportToExcel,
  exportToPdf,
  getCurrencies
} from '../services/exchangeRateService';
import {
  ExchangeRate,
  ExchangeRateFilters,
  ExchangeRateSortConfig,
  ExchangeRateFormData,
  ExchangeRateStats,
  ExchangeRateHistory
} from '../types';
import {
  defaultFilters,
  defaultSortConfig,
  defaultPageSize,
  exchangeRateErrorMessages,
  exchangeRateSuccessMessages
} from '../data/exchangeRateModules';

export const useExchangeRateManagement = () => {
  const { isAuthenticated } = useAuth();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ExchangeRateFilters>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<ExchangeRateSortConfig>(defaultSortConfig);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<{
    history: ExchangeRateHistory[];
    fromCurrency: any;
    toCurrency: any;
  } | null>(null);

  // Permission checks
  const canView = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canCreate = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canUpdate = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canDelete = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canExport = useMemo(() => isAuthenticated, [isAuthenticated]);

  // Query keys
  const exchangeRatesQueryKey = ['exchangeRates', page, pageSize, searchTerm, sortConfig.field, sortConfig.direction, filters];
  const allActiveExchangeRatesQueryKey = ['allActiveExchangeRates'];
  const statsQueryKey = ['exchangeRateStats'];
  const currenciesQueryKey = ['currencies'];

  // Data queries
  const {
    data: exchangeRatesData,
    isLoading,
    error: exchangeRatesError
  } = useQuery({
    queryKey: exchangeRatesQueryKey,
    queryFn: () => getExchangeRates(page, pageSize, searchTerm, sortConfig.field, sortConfig.direction, filters),
    enabled: canView,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError
  } = useQuery({
    queryKey: statsQueryKey,
    queryFn: getExchangeRateStats,
    enabled: canView
  });

  const {
    data: currencies,
    isLoading: isCurrenciesLoading,
    error: currenciesError
  } = useQuery({
    queryKey: currenciesQueryKey,
    queryFn: getCurrencies,
    enabled: canView
  });

  const {
    data: allActiveExchangeRates,
    isLoading: isAllActiveExchangeRatesLoading,
    error: allActiveExchangeRatesError
  } = useQuery({
    queryKey: allActiveExchangeRatesQueryKey,
    queryFn: getAllActiveExchangeRates,
    enabled: canView,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createExchangeRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
      queryClient.invalidateQueries({ queryKey: ['exchangeRateStats'] });
      setShowForm(false);
      setEditingRate(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExchangeRateFormData }) => 
      updateExchangeRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
      queryClient.invalidateQueries({ queryKey: ['exchangeRateStats'] });
      setShowForm(false);
      setEditingRate(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExchangeRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
      queryClient.invalidateQueries({ queryKey: ['exchangeRateStats'] });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      toggleExchangeRateStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
      queryClient.invalidateQueries({ queryKey: ['exchangeRateStats'] });
    }
  });

  // Computed values
  const exchangeRates = useMemo(() => exchangeRatesData?.data || [], [exchangeRatesData]);
  
  // Ensure currencies is always an array
  const currenciesArray = useMemo(() => {
    if (!currencies) return [];
    return Array.isArray(currencies) ? currencies : [];
  }, [currencies]);
  const totalItems = useMemo(() => exchangeRatesData?.total || 0, [exchangeRatesData]);
  const totalPages = useMemo(() => exchangeRatesData?.totalPages || 0, [exchangeRatesData]);
  const currentStats = useMemo(() => statsData || {
    totalRates: 0,
    activeRates: 0,
    expiredRates: 0,
    lastUpdate: 'Today'
  }, [statsData]);

  // Event handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleSort = useCallback((field: keyof ExchangeRate) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<ExchangeRateFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingRate(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((rate: ExchangeRate) => {
    setEditingRate(rate);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Exchange Rate',
      message: 'Are you sure you want to delete this exchange rate? This action cannot be undone.',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) { return; }
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [deleteMutation, confirm]);

  const handleToggleStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({ id, isActive });
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [toggleStatusMutation]);

  const handleSave = useCallback(async (data: ExchangeRateFormData) => {
    try {
      if (editingRate) {
        await updateMutation.mutateAsync({ id: editingRate.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      throw error;
    }
  }, [editingRate, createMutation, updateMutation]);

  const handleViewHistory = useCallback(async (fromCurrencyId: string, toCurrencyId: string) => {
    try {
      const data = await getExchangeRateHistory(fromCurrencyId, toCurrencyId);
      setHistoryData(data);
      setShowHistory(true);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, []);

  const handleExportExcel = useCallback(async () => {
    try {
      const blob = await exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exchange-rates-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [filters]);

  const handleExportPdf = useCallback(async () => {
    try {
      const blob = await exportToPdf(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exchange-rates-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [filters]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingRate(null);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setShowHistory(false);
    setHistoryData(null);
  }, []);

  return {
    // Data
    exchangeRates,
    allActiveExchangeRates,
    currencies: currenciesArray,
    currentStats,
    historyData,
    totalItems,
    totalPages,
    page,
    pageSize,
    searchTerm,
    filters,
    sortConfig,
    editingRate,

    // Loading states
    isLoading,
    isStatsLoading,
    isCurrenciesLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,

    // Error states
    exchangeRatesError,
    statsError,
    currenciesError,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,

    // UI states
    showForm,
    showHistory,

    // Permissions
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canExport,

    // Event handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilterChange,
    handleAddNew,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    handleSave,
    handleViewHistory,
    handleExportExcel,
    handleExportPdf,
    handleCloseForm,
    handleCloseHistory
  };
}; 