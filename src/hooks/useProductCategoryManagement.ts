import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import * as productCategoryService from '../services/productCategoryService';
import { 
  ProductCategory, 
  ProductCategoryFormData, 
  ProductCategoryFilters, 
  ProductCategorySortConfig,
  TaxCode,
  Account
} from '../types';
import { defaultStats } from '../data/productCategoryModules';

export const useProductCategoryManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<ProductCategoryFilters>({
    search: '',
    status: 'all',
  });
  const [sortConfig, setSortConfig] = useState<ProductCategorySortConfig>({
    field: 'created_at',
    direction: 'desc',
  });

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

  const canView = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'cashier';
  }, [user]);

  // Queries
  const productCategoriesQuery = useQuery({
    queryKey: ['productCategories', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      if (!isAuthenticated) {
        return { productCategories: [], pagination: { totalItems: 0, totalPages: 1, startIndex: 0, endIndex: 0 } };
      }
      return await productCategoryService.getProductCategories({
        page: currentPage,
        limit: pageSize,
        search: filters.search,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
        status: filters.status,
      });
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const statsQuery = useQuery({
    queryKey: ['productCategoryStats'],
    queryFn: async () => {
      if (!isAuthenticated) {
        return defaultStats;
      }
      const result = await productCategoryService.getProductCategoryStats();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const taxCodesQuery = useQuery({
    queryKey: ['taxCodes'],
    queryFn: async () => {
      if (!isAuthenticated) {
        return [];
      }
      return await productCategoryService.getTaxCodes();
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      if (!isAuthenticated) {
        return [];
      }
      return await productCategoryService.getAccounts();
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Mutations
  const createProductCategoryMutation = useMutation({
    mutationFn: productCategoryService.createProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      queryClient.invalidateQueries({ queryKey: ['productCategoryStats'] });
      toast.success('Product category created successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create product category';
      toast.error(errorMessage);
    },
  });

  const updateProductCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductCategoryFormData }) =>
      productCategoryService.updateProductCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      queryClient.invalidateQueries({ queryKey: ['productCategoryStats'] });
      toast.success('Product category updated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update product category';
      toast.error(errorMessage);
    },
  });

  const deleteProductCategoryMutation = useMutation({
    mutationFn: productCategoryService.deleteProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      queryClient.invalidateQueries({ queryKey: ['productCategoryStats'] });
      toast.success('Product category deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete product category';
      toast.error(errorMessage);
    },
  });

  const checkUsageMutation = useMutation({
    mutationFn: productCategoryService.checkProductCategoryUsage,
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to check category usage';
      toast.error(errorMessage);
    },
  });

  const deactivateProductCategoryMutation = useMutation({
    mutationFn: productCategoryService.deactivateProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
      queryClient.invalidateQueries({ queryKey: ['productCategoryStats'] });
      toast.success('Product category deactivated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to deactivate product category';
      toast.error(errorMessage);
    },
  });

  const exportExcelMutation = useMutation({
    mutationFn: productCategoryService.exportProductCategoriesToExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-categories-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel export completed');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to export to Excel';
      toast.error(errorMessage);
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: productCategoryService.exportProductCategoriesToPDF,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-categories-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF export completed');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to export to PDF';
      toast.error(errorMessage);
    },
  });

  // Handler functions
  const handleCreateProductCategory = useCallback(async (data: ProductCategoryFormData) => {
    await createProductCategoryMutation.mutateAsync(data);
  }, [createProductCategoryMutation]);

  const handleUpdateProductCategory = useCallback(async (id: string, data: ProductCategoryFormData) => {
    await updateProductCategoryMutation.mutateAsync({ id, data });
  }, [updateProductCategoryMutation]);

  const handleDeleteProductCategory = useCallback(async (id: string) => {
    await deleteProductCategoryMutation.mutateAsync(id);
  }, [deleteProductCategoryMutation]);

  const handleCheckUsage = useCallback(async (id: string) => {
    return await checkUsageMutation.mutateAsync(id);
  }, [checkUsageMutation]);

  const handleDeactivate = useCallback(async (id: string) => {
    await deactivateProductCategoryMutation.mutateAsync(id);
  }, [deactivateProductCategoryMutation]);

  const handleExportExcel = useCallback(async () => {
    if (!isAuthenticated || !canExport) return;
    await exportExcelMutation.mutateAsync({
      search: filters.search,
      status: filters.status,
    });
  }, [isAuthenticated, canExport, exportExcelMutation, filters]);

  const handleExportPdf = useCallback(async () => {
    if (!isAuthenticated || !canExport) return;
    await exportPdfMutation.mutateAsync({
      search: filters.search,
      status: filters.status,
    });
  }, [isAuthenticated, canExport, exportPdfMutation, filters]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<ProductCategoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: keyof ProductCategory | 'created_at' | 'updated_at') => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['productCategories'] });
    queryClient.invalidateQueries({ queryKey: ['productCategoryStats'] });
  }, [queryClient]);

  // Computed values
  const productCategories = useMemo(() => 
    productCategoriesQuery.data?.productCategories || [], 
    [productCategoriesQuery.data]
  );

  const pagination = useMemo(() => 
    productCategoriesQuery.data?.pagination || {
      page: 1,
      limit: pageSize,
      totalItems: 0,
      totalPages: 1,
      startIndex: 0,
      endIndex: 0,
    }, 
    [productCategoriesQuery.data, pageSize]
  );

  const stats = useMemo(() => 
    statsQuery.data || defaultStats, 
    [statsQuery.data]
  );

  const taxCodes = useMemo(() => 
    taxCodesQuery.data || [], 
    [taxCodesQuery.data]
  );

  const accounts = useMemo(() => 
    accountsQuery.data || [], 
    [accountsQuery.data]
  );

  return {
    // Data
    productCategories,
    pagination,
    stats,
    taxCodes,
    accounts,
    
    // State
    currentPage,
    pageSize,
    filters,
    sortConfig,
    
    // Loading states
    isLoading: productCategoriesQuery.isLoading,
    isStatsLoading: statsQuery.isLoading,
    isTaxCodesLoading: taxCodesQuery.isLoading,
    isAccountsLoading: accountsQuery.isLoading,
    isCreating: createProductCategoryMutation.isPending,
    isUpdating: updateProductCategoryMutation.isPending,
    isDeleting: deleteProductCategoryMutation.isPending,
    isCheckingUsage: checkUsageMutation.isPending,
    isDeactivating: deactivateProductCategoryMutation.isPending,
    isExportingExcel: exportExcelMutation.isPending,
    isExportingPdf: exportPdfMutation.isPending,
    
    // Error states
    error: productCategoriesQuery.error,
    statsError: statsQuery.error,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canView,
    canExport,
    
    // Handlers
    handleCreateProductCategory,
    handleUpdateProductCategory,
    handleDeleteProductCategory,
    handleCheckUsage,
    handleDeactivate,
    handleExportExcel,
    handleExportPdf,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleSort,
    handleRefresh,
  };
};
