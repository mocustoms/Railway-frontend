import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import loyaltyCardService, {
  CreateLoyaltyCardConfigRequest,
  UpdateLoyaltyCardConfigRequest
} from '../services/loyaltyCardService';
import { useAuth } from '../contexts/AuthContext';

export interface LoyaltyCardFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export interface LoyaltyCardSortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface LoyaltyCardStats {
  totalConfigs: number;
  activeConfigs: number;
  inactiveConfigs: number;
  defaultConfigs: number;
  cashEnabledConfigs: number;
  lastUpdate: string;
}

const defaultFilters: LoyaltyCardFilters = {
  search: '',
  status: 'all'
};

const defaultSortConfig: LoyaltyCardSortConfig = {
  key: 'created_at',
  direction: 'desc'
};

const defaultStats: LoyaltyCardStats = {
  totalConfigs: 0,
  activeConfigs: 0,
  inactiveConfigs: 0,
  defaultConfigs: 0,
  cashEnabledConfigs: 0,
  lastUpdate: 'Never'
};

export const useLoyaltyCardManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [filters, setFilters] = useState<LoyaltyCardFilters>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<LoyaltyCardSortConfig>(defaultSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const {
    data: loyaltyCardResponse,
    isLoading: isLoadingLoyaltyCards,
    error: loyaltyCardsError,
    refetch: refetchLoyaltyCards
  } = useQuery({
    queryKey: ['loyaltyCardConfigs', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await loyaltyCardService.getLoyaltyCardConfigs({
        page: currentPage,
        limit: pageSize,
        search: filters.search,
        status: filters.status
      });
    },
    enabled: !!user,
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
  } = useQuery<LoyaltyCardStats>({
    queryKey: ['loyaltyCardStats'],
    queryFn: async () => {
      const response = await loyaltyCardService.getLoyaltyCardConfigStats();
      
      return {
        totalConfigs: response.data.totalConfigs || 0,
        activeConfigs: response.data.activeConfigs || 0,
        inactiveConfigs: response.data.inactiveConfigs || 0,
        defaultConfigs: response.data.defaultConfigs || 0,
        cashEnabledConfigs: 0, // This would need to be calculated
        lastUpdate: new Date().toISOString()
      };
    },
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Mutations
  const createConfigMutation = useMutation({
    mutationFn: loyaltyCardService.createLoyaltyCardConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyCardConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['loyaltyCardStats'] });
      toast.success('Loyalty card configuration created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create loyalty card configuration');
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLoyaltyCardConfigRequest }) =>
      loyaltyCardService.updateLoyaltyCardConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyCardConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['loyaltyCardStats'] });
      toast.success('Loyalty card configuration updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update loyalty card configuration');
    }
  });

  const deleteConfigMutation = useMutation({
    mutationFn: loyaltyCardService.deleteLoyaltyCardConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyCardConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['loyaltyCardStats'] });
      toast.success('Loyalty card configuration deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete loyalty card configuration');
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: loyaltyCardService.setDefaultLoyaltyCardConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyCardConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['loyaltyCardStats'] });
      toast.success('Default loyalty card configuration updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set default configuration');
    }
  });

  const exportExcelMutation = useMutation({
    mutationFn: async () => {
      const response = await loyaltyCardService.getLoyaltyCardConfigs({
        page: 1,
        limit: 1000,
        search: filters.search,
        status: filters.status
      });
      
      const data = response.data || [];
      const headers = ['Card Name', 'Card Code', 'Color', 'Entrance Points', 'Redemption Rate', 'Status', 'Default'];
      const csvContent = [
        headers.join(','),
        ...data.map(config => [
          `"${config.loyalty_card_name}"`,
          `"${config.loyalty_card_code}"`,
          `"${config.card_color || '#FFD700'}"`,
          config.entrance_points,
          config.redemption_rate || 100,
          config.is_active ? 'Active' : 'Inactive',
          config.is_default ? 'Yes' : 'No'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `loyalty-card-configs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('Loyalty card configurations exported to Excel successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to export loyalty card configurations to Excel');
    }
  });

  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      const response = await loyaltyCardService.getLoyaltyCardConfigs({
        page: 1,
        limit: 1000,
        search: filters.search,
        status: filters.status
      });
      
      const data = response.data || [];
      const content = data.map(config => 
        `${config.loyalty_card_name} (${config.loyalty_card_code}) - ${config.is_active ? 'Active' : 'Inactive'}`
      ).join('\n');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `loyalty-card-configs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('Loyalty card configurations exported to PDF successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to export loyalty card configurations to PDF');
    }
  });

  // Computed values
  const loyaltyCards = useMemo(() => loyaltyCardResponse?.data || [], [loyaltyCardResponse]);
  const totalItems = useMemo(() => loyaltyCardResponse?.pagination?.total || 0, [loyaltyCardResponse]);
  const totalPages = useMemo(() => loyaltyCardResponse?.pagination?.pages || 1, [loyaltyCardResponse]);

  // Action handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const createLoyaltyCard = useCallback((data: CreateLoyaltyCardConfigRequest) => {
    createConfigMutation.mutate(data);
  }, [createConfigMutation]);

  const updateLoyaltyCard = useCallback((id: string, data: UpdateLoyaltyCardConfigRequest) => {
    updateConfigMutation.mutate({ id, data });
  }, [updateConfigMutation]);

  const deleteLoyaltyCard = useCallback((id: string) => {
    deleteConfigMutation.mutate(id);
  }, [deleteConfigMutation]);

  const setDefaultLoyaltyCard = useCallback((id: string) => {
    setDefaultMutation.mutate(id);
  }, [setDefaultMutation]);

  const exportToExcel = useCallback(() => {
    exportExcelMutation.mutate();
  }, [exportExcelMutation]);

  const exportToPDF = useCallback(() => {
    exportPdfMutation.mutate();
  }, [exportPdfMutation]);

  // Permission checks
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
    loyaltyCards,
    stats: stats || defaultStats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingLoyaltyCards,
    isLoadingStats,
    isCreating: createConfigMutation.isPending,
    isUpdating: updateConfigMutation.isPending,
    isDeleting: deleteConfigMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
    isExportingExcel: exportExcelMutation.isPending,
    isExportingPdf: exportPdfMutation.isPending,
    
    // Errors
    error: loyaltyCardsError,
    statsError,
    
    // Handlers
    handleSearch,
    handleStatusFilter,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    createLoyaltyCard,
    updateLoyaltyCard,
    deleteLoyaltyCard,
    setDefaultLoyaltyCard,
    exportToExcel,
    exportToPDF,
    refetchLoyaltyCards,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    
    // State
    filters
  };
};
