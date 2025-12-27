import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import storeService from '../services/storeService';
import { Store, StoreFormData, StoreFilters, StoreSortConfig, StoreStats } from '../types';
import { toast } from 'react-hot-toast';
import { useConfirm } from './useConfirm';

export const useStoreManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  // State management
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<StoreSortConfig>({
    field: 'createdAt',
    direction: 'desc'
  });
  const [filters, setFilters] = useState<StoreFilters>({
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Permissions
  const canView = user?.role === 'admin' || user?.role === 'manager';
  const canCreate = user?.role === 'admin' || user?.role === 'manager';
  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';
  const canToggleStatus = user?.role === 'admin' || user?.role === 'manager';
  const canImport = user?.role === 'admin' || user?.role === 'manager';

  // Query keys
  const storesQueryKey = useMemo(() => 
    ['stores', page, pageSize, searchTerm, sortConfig.field, sortConfig.direction, filters], 
    [page, pageSize, searchTerm, sortConfig.field, sortConfig.direction, filters]
  );

  // Queries
  const {
    data: storesData,
    isLoading: isLoadingStores,
    error: storesError,
    refetch: refetchStores
  } = useQuery({
    queryKey: storesQueryKey,
    queryFn: () => storeService.getStores({
      page,
      limit: pageSize,
      search: searchTerm,
      sort: sortConfig.field,
      order: sortConfig.direction,
      ...filters
    }),
    enabled: canView,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const {
    data: storeStats,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ['storeStats'],
    queryFn: storeService.getStoreStats,
    enabled: canView,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  const {
    data: storeTypes,
    isLoading: isLoadingStoreTypes
  } = useQuery({
    queryKey: ['storeTypes'],
    queryFn: storeService.getStoreTypes,
    enabled: canView,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Mutations
  const createStoreMutation = useMutation({
    mutationFn: (data: StoreFormData) => storeService.createStore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['storeStats'] });
      toast.success('Store created successfully');
      setShowForm(false);
      setSelectedStore(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create store');
    }
  });

  const updateStoreMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StoreFormData }) => 
      storeService.updateStore(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['storeStats'] });
      toast.success('Store updated successfully');
      setShowForm(false);
      setSelectedStore(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update store');
    }
  });

  const deleteStoreMutation = useMutation({
    mutationFn: (id: string) => storeService.deleteStore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['storeStats'] });
      toast.success('Store deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete store');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => storeService.toggleStoreStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['storeStats'] });
      toast.success('Store status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update store status');
    }
  });

  // Handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  const handleSort = useCallback((field: keyof Store) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<StoreFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleAddNew = useCallback(() => {
    setSelectedStore(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((store: Store) => {
    setSelectedStore(store);
    setShowForm(true);
  }, []);

  const handleView = useCallback((store: Store) => {
    setSelectedStore(store);
    setShowViewModal(true);
  }, []);

  const handleDelete = useCallback(async (store: Store) => {
    const confirmed = await confirm({
      title: 'Delete Store',
      message: `Are you sure you want to delete "${store.name}"? This action cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }
    
    deleteStoreMutation.mutate(store.id);
  }, [deleteStoreMutation, confirm]);

  const handleToggleStatus = useCallback(async (store: Store) => {
    const action = store.is_active ? 'deactivate' : 'activate';
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Store`,
      message: `Are you sure you want to ${action} "${store.name}"?`,
      confirmText: `Yes, ${action}`,
      cancelText: 'Cancel',
      type: 'warning'
    });
    
    if (!confirmed) {
      return;
    }
    
    toggleStatusMutation.mutate(store.id);
  }, [toggleStatusMutation, confirm]);

  const handleSubmit = useCallback((data: StoreFormData) => {
    if (selectedStore) {
      updateStoreMutation.mutate({ id: selectedStore.id, data });
    } else {
      createStoreMutation.mutate(data);
    }
  }, [selectedStore, updateStoreMutation, createStoreMutation]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedStore(null);
  }, []);

  const handleCloseViewModal = useCallback(() => {
    setShowViewModal(false);
    setSelectedStore(null);
  }, []);

  const handleExportExcel = useCallback(async () => {
    try {
      const blob = await storeService.exportToExcel({
        search: searchTerm,
        ...filters
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stores-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel export completed');
    } catch (error: any) {
      toast.error('Failed to export Excel file');
    }
  }, [searchTerm, filters]);

  const handleExportPdf = useCallback(async () => {
    try {
      const blob = await storeService.exportToPdf({
        search: searchTerm,
        ...filters
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stores-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF export completed');
    } catch (error: any) {
      toast.error('Failed to export PDF file');
    }
  }, [searchTerm, filters]);

  const handleImport = useCallback(() => {
    // Navigate to import page

    navigate('/advance-setup/store/import');
  }, [navigate]);

  // Computed values
  const stores = storesData?.data || [];
  const totalStores = storesData?.total || 0;
  const totalPages = storesData?.totalPages || 0;

  const isLoading = isLoadingStores || isLoadingStats || isLoadingStoreTypes;
  const isCreating = createStoreMutation.isPending;
  const isUpdating = updateStoreMutation.isPending;
  const isDeleting = deleteStoreMutation.isPending;
  const isTogglingStatus = toggleStatusMutation.isPending;

  return {
    // Data
    stores,
    storeStats,
    storeTypes,
    selectedStore,
    totalStores,
    totalPages,
    
    // State
    page,
    pageSize,
    searchTerm,
    sortConfig,
    filters,
    showFilters,
    showForm,
    showViewModal,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isLoadingStoreTypes,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
    
    // Permissions
    canView,
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canImport,
    
    // Handlers
    handleSearch,
    handleSort,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleView,
    handleDelete,
    handleToggleStatus,
    handleSubmit,
    handleCloseForm,
    handleCloseViewModal,
    handleExportExcel,
    handleExportPdf,
    handleImport,
    setShowFilters,
    
    // Utilities
    refetchStores
  };
}; 