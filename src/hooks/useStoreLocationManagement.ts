import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeLocationService } from '../services/storeLocationService';
import { storeService } from '../services/storeService';
import { packagingService } from '../services/packagingService';
import { StoreLocation, StoreLocationStats, StoreLocationFilters, StoreLocationSortConfig, StoreLocationFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Interface for store dropdown (only what we need)
interface StoreOption {
  id: string;
  name: string;
  location?: string;
}

// Default values
const defaultStoreLocationFilters: StoreLocationFilters = {
  search: '',
  status: 'all'
};

const defaultStoreLocationSortConfig: StoreLocationSortConfig = {
  column: 'created_at',
  direction: 'desc'
};

const defaultStoreLocationStats: StoreLocationStats = {
  totalLocations: 0,
  activeLocations: 0,
  inactiveLocations: 0,
  lastUpdate: 'Never'
};

export const useStoreLocationManagement = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<StoreLocationFilters>(defaultStoreLocationFilters);
  const [sortConfig, setSortConfig] = useState<StoreLocationSortConfig>(defaultStoreLocationSortConfig);

  // Main store locations query
  const {
    data: storeLocationResponse,
    isLoading: isLoadingStoreLocations,
    error: storeLocationError,
    refetch: refetchStoreLocations
  } = useQuery({
    queryKey: ['storeLocations', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await storeLocationService.getStoreLocations(
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

  // Stats query
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery<StoreLocationStats>({
    queryKey: ['storeLocationStats'],
    queryFn: async () => {
      if (!isAuthenticated) {
        return defaultStoreLocationStats;
      }
      const result = await storeLocationService.getStoreLocationStats();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Stores query for dropdown
  const {
    data: stores,
    isLoading: isLoadingStores
  } = useQuery({
    queryKey: ['activeStores'],
    queryFn: async () => {
      return await storeService.getActiveStores();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Packaging types query for dropdown
  const {
    data: packagingTypes,
    isLoading: isLoadingPackagingTypes
  } = useQuery({
    queryKey: ['packagingTypes'],
    queryFn: async () => {
      return await packagingService.getActivePackaging();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: storeLocationService.createStoreLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeLocations'] });
      queryClient.invalidateQueries({ queryKey: ['storeLocationStats'] });
      toast.success('Store location created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create store location';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StoreLocation> }) =>
      storeLocationService.updateStoreLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeLocations'] });
      queryClient.invalidateQueries({ queryKey: ['storeLocationStats'] });
      toast.success('Store location updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update store location';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: storeLocationService.deleteStoreLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeLocations'] });
      queryClient.invalidateQueries({ queryKey: ['storeLocationStats'] });
      toast.success('Store location deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete store location';
      toast.error(message);
    }
  });

  const checkUsageMutation = useMutation({
    mutationFn: storeLocationService.checkStoreLocationUsage,
    onError: (error: any) => {
      toast.error('Failed to check usage');
    }
  });

  const deactivateStoreLocationMutation = useMutation({
    mutationFn: storeLocationService.deactivateStoreLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeLocations'] });
      queryClient.invalidateQueries({ queryKey: ['storeLocationStats'] });
      toast.success('Store location deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to deactivate store location');
    }
  });

  // Computed values
  const storeLocations = useMemo(() => storeLocationResponse?.data || [], [storeLocationResponse]);
  const totalItems = useMemo(() => storeLocationResponse?.pagination?.totalItems || 0, [storeLocationResponse]);
  const totalPages = useMemo(() => storeLocationResponse?.pagination?.totalPages || 1, [storeLocationResponse]);

  // Handler functions for usage check and deactivation
  const handleCheckUsage = useCallback(async (id: string) => {
    return await checkUsageMutation.mutateAsync(id);
  }, [checkUsageMutation]);

  const handleDeactivate = useCallback(async (id: string) => {
    return await deactivateStoreLocationMutation.mutateAsync(id);
  }, [deactivateStoreLocationMutation]);

  // Handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((column: keyof StoreLocation | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<StoreLocationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const createStoreLocation = useCallback(async (data: StoreLocationFormData) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateStoreLocation = useCallback(async (id: string, data: Partial<StoreLocation>) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteStoreLocation = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await storeLocationService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store-locations-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Store locations exported to Excel successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export store locations';
      toast.error(message);
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await storeLocationService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store-locations-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Store locations exported to PDF successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export store locations';
      toast.error(message);
    }
  }, [filters]);

  // Permissions
  const canCreate = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canEdit = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canDelete = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  return {
    // Data
    storeLocations,
    stats: stats || defaultStoreLocationStats,
    stores: (stores || []) as StoreOption[],
    packagingTypes: packagingTypes || [],
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingStoreLocations,
    isLoadingStats,
    isLoadingStores,
    isLoadingPackagingTypes,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeactivating: deactivateStoreLocationMutation.isPending,
    isCheckingUsage: checkUsageMutation.isPending,
    
    // Errors
    error: storeLocationError,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    createStoreLocation,
    updateStoreLocation,
    deleteStoreLocation,
    handleCheckUsage,
    handleDeactivate,
    exportToExcel,
    exportToPDF,
    refetchStoreLocations,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    
    // State
    filters,
    sortConfig,
    setSortConfig,
    setCurrentPage
  };
};
