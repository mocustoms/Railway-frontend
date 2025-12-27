import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productBrandNameService from '../services/productBrandNameService';
import { 
  ProductBrandName, 
  ProductBrandNameFormData, 
  ProductBrandNameStats, 
  ProductBrandNameFilters, 
  ProductBrandNameSortConfig 
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Default values
const defaultProductBrandNameFilters: ProductBrandNameFilters = {
  search: '',
  status: 'all'
};

const defaultProductBrandNameSortConfig: ProductBrandNameSortConfig = {
  column: 'created_at',
  direction: 'desc'
};

const defaultProductBrandNameStats: ProductBrandNameStats = {
  totalBrandNames: 0,
  activeBrandNames: 0,
  inactiveBrandNames: 0,
  lastUpdate: 'Never'
};

export const useProductBrandNameManagement = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<ProductBrandNameFilters>(defaultProductBrandNameFilters);
  const [sortConfig, setSortConfig] = useState<ProductBrandNameSortConfig>(defaultProductBrandNameSortConfig);

  // Main product brand names query
  const {
    data: productBrandNameResponse,
    isLoading: isLoadingProductBrandNames,
    error: productBrandNameError,
    refetch: refetchProductBrandNames
  } = useQuery({
    queryKey: ['productBrandNames', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await productBrandNameService.getProductBrandNames(
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
  } = useQuery<ProductBrandNameStats>({
    queryKey: ['productBrandNameStats'],
    queryFn: async () => {
      if (!isAuthenticated) {
        return defaultProductBrandNameStats;
      }
      const result = await productBrandNameService.getProductBrandNameStats();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Computed values
  const productBrandNames = useMemo(() => {
    return productBrandNameResponse?.data || [];
  }, [productBrandNameResponse]);

  const totalItems = useMemo(() => {
    return productBrandNameResponse?.pagination.totalItems || 0;
  }, [productBrandNameResponse]);

  const totalPages = useMemo(() => {
    return productBrandNameResponse?.pagination.totalPages || 1;
  }, [productBrandNameResponse]);

  // Mutations
  const createProductBrandNameMutation = useMutation({
    mutationFn: productBrandNameService.createProductBrandName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBrandNames'] });
      queryClient.invalidateQueries({ queryKey: ['productBrandNameStats'] });
      toast.success('Product brand name created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create product brand name');
    }
  });

  const updateProductBrandNameMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductBrandNameFormData }) =>
      productBrandNameService.updateProductBrandName(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBrandNames'] });
      queryClient.invalidateQueries({ queryKey: ['productBrandNameStats'] });
      toast.success('Product brand name updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update product brand name');
    }
  });

  const deleteProductBrandNameMutation = useMutation({
    mutationFn: productBrandNameService.deleteProductBrandName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBrandNames'] });
      queryClient.invalidateQueries({ queryKey: ['productBrandNameStats'] });
      toast.success('Product brand name deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete product brand name');
    }
  });

  const checkUsageMutation = useMutation({
    mutationFn: productBrandNameService.checkProductBrandNameUsage,
    onError: (error: any) => {
      toast.error('Failed to check usage');
    }
  });

  const deactivateProductBrandNameMutation = useMutation({
    mutationFn: productBrandNameService.deactivateProductBrandName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productBrandNames'] });
      queryClient.invalidateQueries({ queryKey: ['productBrandNameStats'] });
      toast.success('Product brand name deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to deactivate product brand name');
    }
  });

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

  const handleSort = useCallback((column: keyof ProductBrandName | 'created_at' | 'updated_at') => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  }, []);

  const createProductBrandName = useCallback(async (data: ProductBrandNameFormData) => {
    return await createProductBrandNameMutation.mutateAsync(data);
  }, [createProductBrandNameMutation]);

  const updateProductBrandName = useCallback(async (id: string, data: ProductBrandNameFormData) => {
    return await updateProductBrandNameMutation.mutateAsync({ id, data });
  }, [updateProductBrandNameMutation]);

  const deleteProductBrandName = useCallback(async (id: string) => {
    return await deleteProductBrandNameMutation.mutateAsync(id);
  }, [deleteProductBrandNameMutation]);

  const handleCheckUsage = useCallback(async (id: string) => {
    return await checkUsageMutation.mutateAsync(id);
  }, [checkUsageMutation]);

  const handleDeactivate = useCallback(async (id: string) => {
    return await deactivateProductBrandNameMutation.mutateAsync(id);
  }, [deactivateProductBrandNameMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await productBrandNameService.exportProductBrandNamesToExcel(filters, sortConfig);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-brand-names-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export completed successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  }, [filters, sortConfig]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await productBrandNameService.exportProductBrandNamesToPDF(filters, sortConfig);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-brand-names-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export completed successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  }, [filters, sortConfig]);

  // Permissions (based on user role)
  const canCreate = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  const canEdit = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  const canDelete = useMemo(() => {
    return user?.role === 'admin';
  }, [user?.role]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  return {
    // Data
    productBrandNames,
    stats: stats || defaultProductBrandNameStats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingProductBrandNames,
    isLoadingStats,
    isCreating: createProductBrandNameMutation.isPending,
    isUpdating: updateProductBrandNameMutation.isPending,
    isDeleting: deleteProductBrandNameMutation.isPending,
    isDeactivating: deactivateProductBrandNameMutation.isPending,
    isCheckingUsage: checkUsageMutation.isPending,
    isExportingExcel: false, // Will be updated when we add mutations
    isExportingPdf: false,   // Will be updated when we add mutations
    
    // Errors
    error: productBrandNameError,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleStatusFilter,
    createProductBrandName,
    updateProductBrandName,
    deleteProductBrandName,
    handleCheckUsage,
    handleDeactivate,
    exportToExcel,
    exportToPDF,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    
    // State
    filters,
    sortConfig,
    
    // Utilities
    refetchProductBrandNames
  };
};
