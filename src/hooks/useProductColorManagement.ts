import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductColor, ProductColorStats, ProductColorFilters, ProductColorSortConfig } from '../types';
import { defaultProductColorFilters, defaultProductColorSortConfig, defaultProductColorStats } from '../data/productColorModules';
import { productColorService } from '../services/productColorService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useProductColorManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<ProductColorFilters>(defaultProductColorFilters);
  const [sortConfig, setSortConfig] = useState<ProductColorSortConfig>(defaultProductColorSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const {
    data: productColorsResponse,
    isLoading: isLoadingProductColors,
    error: productColorsError,
    refetch: refetchProductColors
  } = useQuery({
    queryKey: ['productColors', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await productColorService.getProductColors(
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
    queryKey: ['productColorStats'],
    queryFn: async () => {
      return await productColorService.getProductColorStats();
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: productColorService.createProductColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productColors'] });
      queryClient.invalidateQueries({ queryKey: ['productColorStats'] });
      toast.success('Product color created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create product color';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductColor> }) =>
      productColorService.updateProductColor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productColors'] });
      queryClient.invalidateQueries({ queryKey: ['productColorStats'] });
      toast.success('Product color updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update product color';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: productColorService.deleteProductColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productColors'] });
      queryClient.invalidateQueries({ queryKey: ['productColorStats'] });
      toast.success('Product color deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete product color';
      toast.error(message);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productColorService.toggleProductColorStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productColors'] });
      queryClient.invalidateQueries({ queryKey: ['productColorStats'] });
      toast.success('Product color status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update product color status';
      toast.error(message);
    }
  });

  // Computed values
  const productColors = useMemo(() => productColorsResponse?.productColors || [], [productColorsResponse]);
  const totalItems = useMemo(() => productColorsResponse?.pagination?.totalItems || 0, [productColorsResponse]);
  const totalPages = useMemo(() => productColorsResponse?.pagination?.totalPages || 1, [productColorsResponse]);

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

  const handleSort = useCallback((column: keyof ProductColor | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });
    setCurrentPage(1);
  }, []);

  const handleFilter = useCallback((newFilters: Partial<ProductColorFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const createProductColor = useCallback(async (data: Partial<ProductColor>) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateProductColor = useCallback(async (id: string, data: Partial<ProductColor>) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteProductColor = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const toggleProductColorStatus = useCallback(async (id: string, isActive: boolean) => {
    return await toggleStatusMutation.mutateAsync({ id, isActive });
  }, [toggleStatusMutation]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await productColorService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-colors-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Product colors exported to Excel successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export product colors';
      toast.error(message);
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await productColorService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-colors-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Product colors exported to PDF successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export product colors';
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

  const canToggleStatus = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  return {
    // Data
    productColors,
    stats: stats || defaultProductColorStats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingProductColors,
    isLoadingStats,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    
    // Errors
    error: productColorsError,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    createProductColor,
    updateProductColor,
    deleteProductColor,
    toggleProductColorStatus,
    exportToExcel,
    exportToPDF,
    refetchProductColors,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canExport,
    
    // State
    filters,
    sortConfig,
    setSortConfig,
    setCurrentPage
  };
};
