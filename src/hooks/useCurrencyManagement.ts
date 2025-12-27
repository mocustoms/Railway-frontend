import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Currency } from '../types';
import { CurrencyStats, CurrencyFilters, CurrencySortConfig, defaultCurrencyFormData } from '../data/currencyModules';
import { currencyService } from '../services/currencyService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useCurrencyManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<CurrencyFilters>({
    search: '',
    status: 'all',
    isDefault: 'all'
  });
  const [sortConfig, setSortConfig] = useState<CurrencySortConfig>({
    column: 'name',
    direction: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const {
    data: currenciesResponse,
    isLoading: isLoadingCurrencies,
    error: currenciesError,
    refetch: refetchCurrencies
  } = useQuery({
    queryKey: ['currencies', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await currencyService.getCurrencies(
        currentPage,
        pageSize,
        filters,
        sortConfig
      );
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['currencyStats'],
    queryFn: async () => {
      return await currencyService.getCurrencyStats();
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: currencyService.createCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      queryClient.invalidateQueries({ queryKey: ['currencyStats'] });
      toast.success('Currency created successfully');
    },
    onError: (error: any) => {
      // Handle simplified error format (matching price category pattern)
      let message = 'Failed to create currency';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle error message
        if (errorData.error) {
          message = errorData.error;
        }
        
        // Handle validation errors array
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((e: any) => 
            e.message || e.msg || e.field
          ).join(', ');
          message = `Validation errors: ${errorMessages}`;
        }
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Currency> }) =>
      currencyService.updateCurrency(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      queryClient.invalidateQueries({ queryKey: ['currencyStats'] });
      toast.success('Currency updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update currency';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: currencyService.deleteCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      queryClient.invalidateQueries({ queryKey: ['currencyStats'] });
      toast.success('Currency deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete currency';
      toast.error(message);
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: currencyService.setDefaultCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      queryClient.invalidateQueries({ queryKey: ['currencyStats'] });
      toast.success('Default currency updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to set default currency';
      toast.error(message);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      currencyService.toggleCurrencyStatus(id, isActive),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      queryClient.invalidateQueries({ queryKey: ['currencyStats'] });
      toast.success(`Currency ${isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to toggle currency status';
      toast.error(message);
    }
  });

  // Computed values
  const currencies = useMemo(() => {
    return currenciesResponse?.currencies || [];
  }, [currenciesResponse]);

  const totalItems = useMemo(() => {
    return currenciesResponse?.total || 0;
  }, [currenciesResponse]);

  const totalPages = useMemo(() => {
    return currenciesResponse?.totalPages || 0;
  }, [currenciesResponse]);

  const defaultStats: CurrencyStats = {
    totalCurrencies: 0,
    activeCurrencies: 0,
    defaultCurrency: 'None',
    lastUpdate: 'Today'
  };

  const currentStats = useMemo(() => {
    return stats || defaultStats;
  }, [stats]);

  // Permissions
  const canCreate = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canUpdate = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canDelete = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canView = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canSetDefault = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canToggleStatus = useMemo(() => isAuthenticated, [isAuthenticated]);

  // Handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: CurrencyFilters['status']) => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  }, []);

  const handleDefaultFilter = useCallback((isDefault: CurrencyFilters['isDefault']) => {
    setFilters(prev => ({ ...prev, isDefault }));
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((column: keyof Currency) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // CRUD operations
  const createCurrency = useCallback((currencyData: Partial<Currency>) => {
    return createMutation.mutateAsync(currencyData);
  }, [createMutation]);

  const updateCurrency = useCallback((id: string, currencyData: Partial<Currency>) => {
    return updateMutation.mutateAsync({ id, data: currencyData });
  }, [updateMutation]);

  const deleteCurrency = useCallback((id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const setDefaultCurrency = useCallback((id: string) => {
    return setDefaultMutation.mutateAsync(id);
  }, [setDefaultMutation]);

  const toggleCurrencyStatus = useCallback((id: string, isActive: boolean) => {
    return toggleStatusMutation.mutateAsync({ id, isActive });
  }, [toggleStatusMutation]);

  // Check code availability
  const checkCodeAvailability = useCallback(async (code: string, excludeId?: string) => {
    try {
      return await currencyService.checkCodeAvailability(code, excludeId);
    } catch (error) {
      return false;
    }
  }, []);

  // Export functions
  const exportToExcel = useCallback(async () => {
    try {
      const blob = await currencyService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'currencies.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Currencies exported to Excel successfully');
    } catch (error) {
      toast.error('Failed to export to Excel');
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await currencyService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'currencies.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Currencies exported to PDF successfully');
    } catch (error) {
      toast.error('Failed to export to PDF');
    }
  }, [filters]);

  return {
    // Data
    currencies,
    stats: currentStats,
    
    // Loading states
    isLoading: isLoadingCurrencies || isLoadingStats,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    
    // Errors
    error: currenciesError || statsError,
    
    // Pagination
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    
    // Filters and sorting
    filters,
    sortConfig,
    
    // Permissions
    canCreate,
    canUpdate,
    canDelete,
    canView,
    canSetDefault,
    canToggleStatus,
    
    // Handlers
    handleSearch,
    handleStatusFilter,
    handleDefaultFilter,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    
    // CRUD operations
    createCurrency,
    updateCurrency,
    deleteCurrency,
    setDefaultCurrency,
    toggleCurrencyStatus,
    
    // Utility functions
    checkCodeAvailability,
    exportToExcel,
    exportToPDF,
    
    // Refetch functions
    refetchCurrencies
  };
}; 