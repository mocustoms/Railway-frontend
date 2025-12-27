import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import productModelService from '../services/productModelService';
import { ProductModelFormData, ProductModelFilters } from '../types/productModel';
import toast from 'react-hot-toast';

export const useProductModelManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'name',
    direction: 'asc'
  });

  // Build filters object
  const filters: ProductModelFilters = useMemo(() => ({
    search: searchTerm,
    status: statusFilter,
    category_id: categoryFilter || undefined,
    brand: brandFilter || undefined,
    sortBy: sortConfig.field,
    sortOrder: sortConfig.direction,
    page: currentPage,
    limit: pageSize
  }), [searchTerm, statusFilter, categoryFilter, brandFilter, sortConfig, currentPage, pageSize]);

  // Queries
  const {
    data: productModelsResponse,
    isLoading: isLoadingProductModels,
    error: productModelsError,
    refetch: refetchProductModels
  } = useQuery({
    queryKey: ['productModels', filters],
    queryFn: () => productModelService.getProductModels(filters),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['productModelStats'],
    queryFn: () => productModelService.getProductModelStats(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations
  const createProductModelMutation = useMutation({
    mutationFn: (data: ProductModelFormData) => productModelService.createProductModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productModels'] });
      queryClient.invalidateQueries({ queryKey: ['productModelStats'] });
      toast.success('Product model created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product model');
    }
  });

  const updateProductModelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductModelFormData> }) =>
      productModelService.updateProductModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productModels'] });
      queryClient.invalidateQueries({ queryKey: ['productModelStats'] });
      toast.success('Product model updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product model');
    }
  });

  const deleteProductModelMutation = useMutation({
    mutationFn: (id: string) => productModelService.deleteProductModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productModels'] });
      queryClient.invalidateQueries({ queryKey: ['productModelStats'] });
      toast.success('Product model deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product model');
    }
  });

  const checkUsageMutation = useMutation({
    mutationFn: productModelService.checkProductModelUsage,
    onError: (error: any) => {
      toast.error('Failed to check usage');
    }
  });

  const deactivateProductModelMutation = useMutation({
    mutationFn: productModelService.deactivateProductModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productModels'] });
      queryClient.invalidateQueries({ queryKey: ['productModelStats'] });
      toast.success('Product model deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to deactivate product model');
    }
  });

  // Computed values
  const productModels = useMemo(() => productModelsResponse?.productModels || [], [productModelsResponse]);
  const totalItems = useMemo(() => productModelsResponse?.pagination?.totalItems || 0, [productModelsResponse]);
  const totalPages = useMemo(() => productModelsResponse?.pagination?.totalPages || 1, [productModelsResponse]);

  // Handler functions for usage check and deactivation
  const handleCheckUsage = useCallback(async (id: string) => {
    return await checkUsageMutation.mutateAsync(id);
  }, [checkUsageMutation]);

  const handleDeactivate = useCallback(async (id: string) => {
    return await deactivateProductModelMutation.mutateAsync(id);
  }, [deactivateProductModelMutation]);

  // Permission checks
  const canCreate = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canEdit = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  const canDelete = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canView = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'cashier';
  }, [user]);

  // Action handlers
  const handleCreate = async (data: ProductModelFormData) => {
    if (!canCreate) {
      toast.error('You do not have permission to create product models');
      return;
    }
    await createProductModelMutation.mutateAsync(data);
  };

  const handleUpdate = async (id: string, data: Partial<ProductModelFormData>) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit product models');
      return;
    }
    await updateProductModelMutation.mutateAsync({ id, data });
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete product models');
      return;
    }
    await deleteProductModelMutation.mutateAsync(id);
  };

  const handleExportExcel = async () => {
    try {
      const blob = await productModelService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-models-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel export completed');
    } catch (error) {
      toast.error('Failed to export to Excel');
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await productModelService.exportToPdf(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-models-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF export completed');
    } catch (error) {
      toast.error('Failed to export to PDF');
    }
  };

  return {
    // Data
    productModels,
    stats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoadingProductModels,
    isLoadingStats,
    isCreating: createProductModelMutation.isPending,
    isUpdating: updateProductModelMutation.isPending,
    isDeleting: deleteProductModelMutation.isPending,
    isDeactivating: deactivateProductModelMutation.isPending,
    isCheckingUsage: checkUsageMutation.isPending,
    
    // Errors
    productModelsError,
    statsError,
    
    // Filters and search
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    brandFilter,
    setBrandFilter,
    sortConfig,
    setSortConfig,
    
    // Pagination
    setCurrentPage,
    setPageSize,
    
    // Actions
    handleCreate,
    handleUpdate,
    handleDelete,
    handleCheckUsage,
    handleDeactivate,
    handleExportExcel,
    handleExportPdf,
    refetchProductModels,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canView
  };
};
