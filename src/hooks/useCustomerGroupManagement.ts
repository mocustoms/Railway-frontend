import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import customerGroupService, {
  CustomerGroup,
  CustomerGroupFormData,
  CustomerGroupFilters,
  CustomerGroupSortConfig,
  CustomerGroupStats,
  PaginatedCustomerGroupResponse,
  CustomerGroupUsage
} from '../services/customerGroupService';
import { useAuth } from '../contexts/AuthContext';

const defaultCustomerGroupFilters: CustomerGroupFilters = {
  search: '',
  status: 'all'
};

const defaultSortConfig: CustomerGroupSortConfig = {
  key: 'created_at',
  direction: 'desc'
};

export const useCustomerGroupManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [filters, setFilters] = useState<CustomerGroupFilters>(defaultCustomerGroupFilters);
  const [sortConfig, setSortConfig] = useState<CustomerGroupSortConfig>(defaultSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery<CustomerGroupStats>({
    queryKey: ['customerGroupStats'],
    queryFn: customerGroupService.getStats
  });

  const {
    data: customerGroupResponse,
    isLoading: isLoadingCustomerGroups,
    error: customerGroupsError,
    refetch: refetchCustomerGroups
  } = useQuery<PaginatedCustomerGroupResponse>({
    queryKey: ['customerGroups', currentPage, pageSize, filters, sortConfig],
    queryFn: () => customerGroupService.getCustomerGroups(currentPage, pageSize, filters, sortConfig)
  });

  const {
    data: activeCustomerGroups,
    isLoading: isLoadingActiveCustomerGroups,
    error: activeCustomerGroupsError
  } = useQuery<CustomerGroup[]>({
    queryKey: ['activeCustomerGroups'],
    queryFn: customerGroupService.getActiveCustomerGroups
  });

  // Accounts query for dropdowns
  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    error: accountsError
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: customerGroupService.getAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Liability accounts query for dropdowns
  const {
    data: liabilityAccounts,
    isLoading: isLoadingLiabilityAccounts,
    error: liabilityAccountsError
  } = useQuery({
    queryKey: ['liability-accounts'],
    queryFn: customerGroupService.getLiabilityAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: customerGroupService.createCustomerGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] });
      queryClient.invalidateQueries({ queryKey: ['customerGroupStats'] });
      queryClient.invalidateQueries({ queryKey: ['activeCustomerGroups'] });
      toast.success('Customer group created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create customer group');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerGroupFormData> }) =>
      customerGroupService.updateCustomerGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] });
      queryClient.invalidateQueries({ queryKey: ['customerGroupStats'] });
      queryClient.invalidateQueries({ queryKey: ['activeCustomerGroups'] });
      toast.success('Customer group updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update customer group');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: customerGroupService.deleteCustomerGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] });
      queryClient.invalidateQueries({ queryKey: ['customerGroupStats'] });
      queryClient.invalidateQueries({ queryKey: ['activeCustomerGroups'] });
      toast.success('Customer group deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete customer group');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: customerGroupService.toggleCustomerGroupStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerGroups'] });
      queryClient.invalidateQueries({ queryKey: ['customerGroupStats'] });
      queryClient.invalidateQueries({ queryKey: ['activeCustomerGroups'] });
      toast.success('Customer group status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update customer group status');
    }
  });

  const checkUsageMutation = useMutation({
    mutationFn: customerGroupService.checkCustomerGroupUsage,
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to check customer group usage');
    }
  });

  const exportExcelMutation = useMutation({
    mutationFn: customerGroupService.exportToExcel,
    onSuccess: (blob) => {
      customerGroupService.downloadFile(blob, 'customer-groups.xlsx');
      toast.success('Customer groups exported to Excel successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export customer groups to Excel');
    }
  });

  const exportPdfMutation = useMutation({
    mutationFn: customerGroupService.exportToPdf,
    onSuccess: (blob) => {
      customerGroupService.downloadFile(blob, 'customer-groups.pdf');
      toast.success('Customer groups exported to PDF successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export customer groups to PDF');
    }
  });

  // Computed values
  const customerGroups = useMemo(() => customerGroupResponse?.data || [], [customerGroupResponse]);
  const pagination = useMemo(() => customerGroupResponse?.pagination, [customerGroupResponse]);

  // Action handlers
  const handleFilter = useCallback((newFilters: Partial<CustomerGroupFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key: key as keyof CustomerGroup, direction });
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const createCustomerGroup = useCallback((data: CustomerGroupFormData) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const updateCustomerGroup = useCallback((id: string, data: Partial<CustomerGroupFormData>) => {
    updateMutation.mutate({ id, data });
  }, [updateMutation]);

  const deleteCustomerGroup = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const toggleCustomerGroupStatus = useCallback((id: string) => {
    toggleStatusMutation.mutate(id);
  }, [toggleStatusMutation]);

  const checkCustomerGroupUsage = useCallback((id: string): Promise<CustomerGroupUsage> => {
    return new Promise((resolve, reject) => {
      checkUsageMutation.mutate(id, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error)
      });
    });
  }, [checkUsageMutation]);

  const exportToExcel = useCallback(() => {
    exportExcelMutation.mutate(filters);
  }, [exportExcelMutation, filters]);

  const exportToPdf = useCallback(() => {
    exportPdfMutation.mutate(filters);
  }, [exportPdfMutation, filters]);

  // Permission checks
  const canCreate = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  const canUpdate = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  const canDelete = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  const canExport = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  return {
    // Data
    stats,
    customerGroups,
    activeCustomerGroups,
    accounts,
    liabilityAccounts,
    pagination,
    filters,
    sortConfig,

    // Loading states
    isLoadingStats,
    isLoadingCustomerGroups,
    isLoadingActiveCustomerGroups,
    isLoadingAccounts,
    isLoadingLiabilityAccounts,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isCheckingUsage: checkUsageMutation.isPending,
    isExportingExcel: exportExcelMutation.isPending,
    isExportingPdf: exportPdfMutation.isPending,

    // Error states
    statsError,
    customerGroupsError,
    activeCustomerGroupsError,
    accountsError,
    liabilityAccountsError,

    // Actions
    handleFilter,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    createCustomerGroup,
    updateCustomerGroup,
    deleteCustomerGroup,
    toggleCustomerGroupStatus,
    checkCustomerGroupUsage,
    exportToExcel,
    exportToPdf,
    refetchCustomerGroups,

    // Permissions
    canCreate,
    canUpdate,
    canDelete,
    canExport
  };
};
