import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { priceCategoryService, PriceCategoryStats } from '../services/priceCategoryService';
import { PriceCategory, PriceCategoryFormData } from '../types';
import toast from 'react-hot-toast';

export const usePriceCategoryManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedChangeType, setSelectedChangeType] = useState('all');
  const [selectedScheduledType, setSelectedScheduledType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Query keys
  const priceCategoriesQueryKey = [
    'price-categories',
    searchTerm,
    selectedStatus,
    selectedChangeType,
    selectedScheduledType,
    currentPage,
    pageSize,
    sortBy,
    sortOrder
  ];

  const statsQueryKey = ['price-categories-stats'];

  // Fetch price categories
  const {
    data: priceCategoriesData,
    isLoading: isLoadingPriceCategories,
    error: priceCategoriesError
  } = useQuery({
    queryKey: priceCategoriesQueryKey,
    queryFn: async () => {
      if (!isAuthenticated) {
        return {
          priceCategories: [],
          pagination: {
            totalItems: 0,
            page: 1,
            limit: pageSize,
            totalPages: 0,
            startIndex: 0,
            endIndex: 0
          }
        };
      }
      const result = await priceCategoryService.getPriceCategories({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        sortBy,
        sortOrder,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        changeType: selectedChangeType !== 'all' ? selectedChangeType : undefined,
        scheduledType: selectedScheduledType !== 'all' ? selectedScheduledType : undefined
      });
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery<PriceCategoryStats>({
    queryKey: statsQueryKey,
    queryFn: async () => {
      if (!isAuthenticated) {
        return {
          totalCategories: 0,
          activeCategories: 0,
          inactiveCategories: 0,
          increaseCategories: 0,
          decreaseCategories: 0,
          scheduledCategories: 0,
          upcomingScheduledCategories: 0,
          lastUpdate: 'Never'
        } as PriceCategoryStats;
      }
      const result = await priceCategoryService.getPriceCategoryStats();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Permissions - Following established standards
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

  // Additional permissions for price categories
  const canSetDefault = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canToggleStatus = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user]);

  // Computed values
  const priceCategories = useMemo(() => {
    return priceCategoriesData?.priceCategories || [];
  }, [priceCategoriesData]);

  const totalItems = useMemo(() => {
    return priceCategoriesData?.pagination?.totalItems || 0;
  }, [priceCategoriesData]);

  const totalPages = useMemo(() => {
    return priceCategoriesData?.pagination?.totalPages || 0;
  }, [priceCategoriesData]);

  // Mutations - Following established standards
  const createMutation = useMutation({
    mutationFn: priceCategoryService.createPriceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-categories'] });
      queryClient.invalidateQueries({ queryKey: statsQueryKey });
      toast.success('Price category created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create price category';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PriceCategoryFormData> }) =>
      priceCategoryService.updatePriceCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-categories'] });
      queryClient.invalidateQueries({ queryKey: statsQueryKey });
      toast.success('Price category updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update price category';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: priceCategoryService.deletePriceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-categories'] });
      queryClient.invalidateQueries({ queryKey: statsQueryKey });
      toast.success('Price category deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete price category';
      toast.error(message);
    }
  });

  const exportExcelMutation = useMutation({
    mutationFn: priceCategoryService.exportToExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'price-categories.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel export completed!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export to Excel';
      toast.error(message);
    }
  });

  const exportPdfMutation = useMutation({
    mutationFn: priceCategoryService.exportToPDF,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'price-categories.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF export completed!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to export to PDF';
      toast.error(message);
    }
  });

  // Direct CRUD functions - Following established standards
  const createPriceCategory = useCallback(async (data: any) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);

  const updatePriceCategory = useCallback(async (id: string, data: any) => {
    return await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deletePriceCategory = useCallback(async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  // Event handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  }, []);

  const handleChangeTypeChange = useCallback((changeType: string) => {
    setSelectedChangeType(changeType);
    setCurrentPage(1);
  }, []);

  const handleScheduledTypeChange = useCallback((scheduledType: string) => {
    setSelectedScheduledType(scheduledType);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  }, []);

  const handleExportExcel = useCallback(() => {
    const filters = {
      search: searchTerm,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      changeType: selectedChangeType !== 'all' ? selectedChangeType : undefined,
      scheduledType: selectedScheduledType !== 'all' ? selectedScheduledType : undefined
    };
    exportExcelMutation.mutate(filters);
  }, [searchTerm, selectedStatus, selectedChangeType, selectedScheduledType, exportExcelMutation]);

  const handleExportPdf = useCallback(() => {
    const filters = {
      search: searchTerm,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      changeType: selectedChangeType !== 'all' ? selectedChangeType : undefined,
      scheduledType: selectedScheduledType !== 'all' ? selectedScheduledType : undefined
    };
    exportPdfMutation.mutate(filters);
  }, [searchTerm, selectedStatus, selectedChangeType, selectedScheduledType, exportPdfMutation]);

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: priceCategoryService.deactivatePriceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-categories'] });
      queryClient.invalidateQueries({ queryKey: statsQueryKey });
      toast.success('Price category deactivated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to deactivate price category';
      toast.error(message);
    }
  });

  // Check usage mutation
  const checkUsageMutation = useMutation({
    mutationFn: priceCategoryService.checkPriceCategoryUsage,
    onError: (error: any) => {
      }
  });

  // Direct CRUD functions that use mutations
  const handleDeactivate = useCallback(async (id: string) => {
    if (!isAuthenticated || !canEdit) return;
    await deactivateMutation.mutateAsync(id);
  }, [isAuthenticated, canEdit, deactivateMutation]);

  const handleCheckUsage = useCallback(async (id: string) => {
    if (!isAuthenticated) return null;
    return await checkUsageMutation.mutateAsync(id);
  }, [isAuthenticated, checkUsageMutation]);

  return {
    // State
    searchTerm,
    selectedStatus,
    selectedChangeType,
    selectedScheduledType,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    priceCategories,
    totalItems,
    totalPages,
    stats,
    isLoadingPriceCategories,
    isLoadingStats,
    priceCategoriesError,
    statsError,

    // Loading states - Following established standards
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isCheckingUsage: checkUsageMutation.isPending,
    isExportingExcel: exportExcelMutation.isPending,
    isExportingPdf: exportPdfMutation.isPending,

    // Permissions - Following established standards
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canView,
    canSetDefault,
    canToggleStatus,

    // Direct CRUD functions - Following established standards
    createPriceCategory,
    updatePriceCategory,
    deletePriceCategory,
    handleDeactivate,
    handleCheckUsage,

    // Mutations - Following established standards
    createMutation,
    updateMutation,
    deleteMutation,
    deactivateMutation,
    checkUsageMutation,
    exportExcelMutation,
    exportPdfMutation,

    // Event handlers - Following established standards
    setSearchTerm,
    setSelectedStatus,
    setSelectedChangeType,
    setSelectedScheduledType,
    setCurrentPage,
    setPageSize,
    setSortBy,
    setSortOrder,
    handleSearch,
    handleStatusChange,
    handleChangeTypeChange,
    handleScheduledTypeChange,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleExportExcel,
    handleExportPdf
  };
};
