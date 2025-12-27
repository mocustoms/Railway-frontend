import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { SalesAgent, SalesAgentFormData, SalesAgentFilters, SalesAgentSortConfig, SalesAgentStats, PaginatedResponse } from '../types';
import { salesAgentService } from '../services/salesAgentService';
import { defaultSalesAgentFilters, defaultSalesAgentSortConfig, defaultSalesAgentStats } from '../data/salesAgentModules';
import toast from 'react-hot-toast';

export const useSalesAgentManagement = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<SalesAgentFilters>({
    search: '',
    status: 'all'
  });
  const [sortConfig, setSortConfig] = useState<SalesAgentSortConfig>(defaultSalesAgentSortConfig);

  // Main sales agents query
  const {
    data: salesAgentResponse,
    isLoading: isLoadingSalesAgents,
    error: salesAgentError,
    refetch: refetchSalesAgents
  } = useQuery({
    queryKey: ['salesAgents', currentPage, pageSize, filters, sortConfig],
    queryFn: async () => {
      return await salesAgentService.getSalesAgents(
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
  } = useQuery<SalesAgentStats>({
    queryKey: ['salesAgentStats'],
    queryFn: async () => {
      if (!isAuthenticated) {
        return defaultSalesAgentStats;
      }
      const result = await salesAgentService.getSalesAgentStats();
      return result;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Computed values
  const salesAgents = useMemo(() => {
    return salesAgentResponse?.data || [];
  }, [salesAgentResponse]);

  const totalItems = useMemo(() => {
    return salesAgentResponse?.pagination?.totalItems || 0;
  }, [salesAgentResponse]);

  const totalPages = useMemo(() => {
    return salesAgentResponse?.pagination?.totalPages || 1;
  }, [salesAgentResponse]);

  // Mutations
  const createSalesAgentMutation = useMutation({
    mutationFn: (data: SalesAgentFormData) => salesAgentService.createSalesAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesAgents'] });
      queryClient.invalidateQueries({ queryKey: ['salesAgentStats'] });
      toast.success('Sales agent created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create sales agent');
    }
  });

  const updateSalesAgentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SalesAgentFormData }) => 
      salesAgentService.updateSalesAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesAgents'] });
      queryClient.invalidateQueries({ queryKey: ['salesAgentStats'] });
      toast.success('Sales agent updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update sales agent');
    }
  });

  const deleteSalesAgentMutation = useMutation({
    mutationFn: (id: string) => salesAgentService.deleteSalesAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesAgents'] });
      queryClient.invalidateQueries({ queryKey: ['salesAgentStats'] });
      toast.success('Sales agent deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete sales agent');
    }
  });

  const deactivateSalesAgentMutation = useMutation({
    mutationFn: (id: string) => salesAgentService.deactivateSalesAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesAgents'] });
      queryClient.invalidateQueries({ queryKey: ['salesAgentStats'] });
      toast.success('Sales agent deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to deactivate sales agent');
    }
  });

  const checkUsageMutation = useMutation({
    mutationFn: (id: string) => salesAgentService.checkSalesAgentUsage(id),
  });

  // Handlers
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSort = (key: keyof SalesAgent | 'created_at' | 'updated_at', direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  };

  const createSalesAgent = async (data: SalesAgentFormData) => {
    return await createSalesAgentMutation.mutateAsync(data);
  };

  const updateSalesAgent = async (id: string, data: SalesAgentFormData) => {
    return await updateSalesAgentMutation.mutateAsync({ id, data });
  };

  const deleteSalesAgent = async (id: string) => {
    return await deleteSalesAgentMutation.mutateAsync(id);
  };

  const handleDeactivate = async (id: string) => {
    return await deactivateSalesAgentMutation.mutateAsync(id);
  };

  const handleCheckUsage = async (id: string) => {
    return await checkUsageMutation.mutateAsync(id);
  };

  const exportToExcel = async () => {
    try {
      const blob = await salesAgentService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-agents-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Sales agents exported to Excel successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export sales agents to Excel');
    }
  };

  const exportToPDF = async () => {
    try {
      const blob = await salesAgentService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-agents-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Sales agents exported to PDF successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export sales agents to PDF');
    }
  };

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
    salesAgents,
    stats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading: isLoadingSalesAgents,
    isLoadingStats,
    isCreating: createSalesAgentMutation.isPending,
    isUpdating: updateSalesAgentMutation.isPending,
    isDeleting: deleteSalesAgentMutation.isPending,
    isDeactivating: deactivateSalesAgentMutation.isPending,
    isCheckingUsage: checkUsageMutation.isPending,
    
    // Errors
    error: salesAgentError,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleStatusFilter,
    createSalesAgent,
    updateSalesAgent,
    deleteSalesAgent,
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
    filters
  };
};
