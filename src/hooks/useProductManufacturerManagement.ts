import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import productManufacturerService from '../services/productManufacturerService';
import { 
  ProductManufacturerFormData,
  ProductManufacturerFilters,
  ProductManufacturerSortConfig
} from '../types';

export const useProductManufacturerManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductManufacturerFilters>({
    status: 'all',
    country: ''
  });
  const [sortConfig, setSortConfig] = useState<ProductManufacturerSortConfig>({
    column: 'name',
    direction: 'asc'
  });

  // Query keys
  const manufacturersQueryKey = useMemo(() => [
    'product-manufacturers',
    currentPage,
    pageSize,
    searchTerm,
    filters,
    sortConfig
  ], [currentPage, pageSize, searchTerm, filters, sortConfig]);

  const statsQueryKey = useMemo(() => ['product-manufacturers-stats'], []);

  // Fetch manufacturers
  const {
    data: manufacturersData,
    isLoading: isLoadingManufacturers,
    refetch: refetchManufacturers,
    error: manufacturersError
  } = useQuery({
    queryKey: manufacturersQueryKey,
    queryFn: async () => {
      if (!isAuthenticated) {
        return { 
          data: [], 
          total: 0, 
          totalPages: 1, 
          currentPage: 1, 
          itemsPerPage: pageSize 
        };
      }
      const result = await productManufacturerService.getProductManufacturers({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        sortBy: sortConfig.column,
        sortOrder: sortConfig.direction as 'asc' | 'desc',
        status: filters.status === 'all' ? undefined : filters.status,
        country: filters.country || undefined
      });
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // Fetch stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      if (!isAuthenticated) {
        return {
          totalManufacturers: 0,
          activeManufacturers: 0,
          inactiveManufacturers: 0,
          lastUpdate: 'Never'
        };
      }
      const result = await productManufacturerService.getManufacturerStats();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: productManufacturerService.createProductManufacturer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-manufacturers'] });
      queryClient.invalidateQueries({ queryKey: ['product-manufacturers-stats'] });
      toast.success('Product manufacturer created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create product manufacturer';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductManufacturerFormData> }) =>
      productManufacturerService.updateProductManufacturer(id, data),
    onSuccess: (updatedManufacturer) => {
      queryClient.invalidateQueries({ queryKey: ['product-manufacturers'] });
      queryClient.invalidateQueries({ queryKey: ['product-manufacturers-stats'] });
      // Also refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: ['product-manufacturers'] });
      toast.success('Product manufacturer updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update product manufacturer';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: productManufacturerService.deleteProductManufacturer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-manufacturers'] });
      queryClient.invalidateQueries({ queryKey: ['product-manufacturers-stats'] });
      toast.success('Product manufacturer deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete product manufacturer';
      toast.error(message);
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: productManufacturerService.deactivateProductManufacturer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-manufacturers'] });
      queryClient.invalidateQueries({ queryKey: ['product-manufacturers-stats'] });
      toast.success('Product manufacturer deactivated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to deactivate product manufacturer';
      toast.error(message);
    }
  });

  // Check usage mutation
  const checkUsageMutation = useMutation({
    mutationFn: productManufacturerService.checkManufacturerUsage,
    onError: (error: any) => {
      // Error handling is done by toast notifications
    }
  });

  // Export mutations
  const exportExcelMutation = useMutation({
    mutationFn: productManufacturerService.exportToExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-manufacturers-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel export completed!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to export to Excel';
      toast.error(message);
    }
  });

  const exportPdfMutation = useMutation({
    mutationFn: productManufacturerService.exportToPdf,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-manufacturers-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF export completed!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to export to PDF';
      toast.error(message);
    }
  });

  // Computed values
  const manufacturers = useMemo(() => {
    // The service returns data in the format { data: [...], total: ..., totalPages: ... }
    return manufacturersData?.data || [];
  }, [manufacturersData]);
  
  const totalItems = useMemo(() => {
    return manufacturersData?.total || 0;
  }, [manufacturersData]);
  
  const totalPages = useMemo(() => {
    return manufacturersData?.totalPages || 1;
  }, [manufacturersData]);

  // Action handlers
  const handleCreate = useCallback(async (data: ProductManufacturerFormData) => {
    if (!isAuthenticated || !canCreate) return;
    await createMutation.mutateAsync(data);
  }, [isAuthenticated, canCreate, createMutation]);

  const handleUpdate = useCallback(async (id: string, data: ProductManufacturerFormData) => {
    if (!isAuthenticated || !canEdit) return;
    await updateMutation.mutateAsync({ id, data });
  }, [isAuthenticated, canEdit, updateMutation]);

  const handleDelete = useCallback(async (id: string) => {
    if (!isAuthenticated || !canDelete) return;
    await deleteMutation.mutateAsync(id);
  }, [isAuthenticated, canDelete, deleteMutation]);

  const handleDeactivate = useCallback(async (id: string) => {
    if (!isAuthenticated || !canEdit) return;
    await deactivateMutation.mutateAsync(id);
  }, [isAuthenticated, canEdit, deactivateMutation]);

  const handleCheckUsage = useCallback(async (id: string) => {
    if (!isAuthenticated) return null;
    return await checkUsageMutation.mutateAsync(id);
  }, [isAuthenticated, checkUsageMutation]);

  const handleExportExcel = useCallback(async () => {
    if (!isAuthenticated || !canExport) return;
    await exportExcelMutation.mutateAsync({
      search: searchTerm,
      status: filters.status === 'all' ? undefined : filters.status,
      country: filters.country || undefined
    });
  }, [isAuthenticated, canExport, exportExcelMutation, searchTerm, filters]);

  const handleExportPdf = useCallback(async () => {
    if (!isAuthenticated || !canExport) return;
    await exportPdfMutation.mutateAsync({
      search: searchTerm,
      status: filters.status === 'all' ? undefined : filters.status,
      country: filters.country || undefined
    });
  }, [isAuthenticated, canExport, exportPdfMutation, searchTerm, filters]);

  // Filter handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<ProductManufacturerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((newSortConfig: ProductManufacturerSortConfig) => {
    setSortConfig(newSortConfig);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    // Data
    manufacturers,
    stats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoadingManufacturers,
    isLoadingStats,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isCheckingUsage: checkUsageMutation.isPending,
    isExportingExcel: exportExcelMutation.isPending,
    isExportingPdf: exportPdfMutation.isPending,
    
    // Error states
    manufacturersError,
    statsError,
    
    // Filters and search
    searchTerm,
    filters,
    sortConfig,
    
    // Action handlers
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDeactivate,
    handleCheckUsage,
    handleExportExcel,
    handleExportPdf,
    
    // Filter handlers
    handleSearch,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canView,
    canExport,
    
    // Utilities
    refetchManufacturers,
    getLogoUrl: (logoPath: string, lastModified?: string) => 
      productManufacturerService.getLogoUrl(logoPath, lastModified)
  };
};
