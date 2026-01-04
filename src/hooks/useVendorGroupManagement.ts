import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import vendorGroupService, {
  VendorGroup,
  VendorGroupFormData,
  VendorGroupFilters,
  VendorGroupSortConfig,
  VendorGroupStats,
  PaginatedVendorGroupResponse,
  VendorGroupUsage
} from '../services/vendorGroupService';
import { useAuth } from '../contexts/AuthContext';

const defaultVendorGroupFilters: VendorGroupFilters = {
  search: '',
  status: 'all'
};

const defaultSortConfig: VendorGroupSortConfig = {
  key: 'created_at',
  direction: 'desc'
};

export const useVendorGroupManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [filters, setFilters] = useState<VendorGroupFilters>(defaultVendorGroupFilters);
  const [sortConfig, setSortConfig] = useState<VendorGroupSortConfig>(defaultSortConfig);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery<VendorGroupStats>({
    queryKey: ['vendorGroupStats'],
    queryFn: vendorGroupService.getStats
  });

  const {
    data: vendorGroupResponse,
    isLoading: isLoadingVendorGroups,
    error: vendorGroupsError,
    refetch: refetchVendorGroups
  } = useQuery<PaginatedVendorGroupResponse>({
    queryKey: ['vendorGroups', currentPage, pageSize, filters, sortConfig],
    queryFn: () => vendorGroupService.getVendorGroups(currentPage, pageSize, filters, sortConfig)
  });

  const {
    data: activeVendorGroups,
    isLoading: isLoadingActiveVendorGroups,
    error: activeVendorGroupsError
  } = useQuery<VendorGroup[]>({
    queryKey: ['activeVendorGroups'],
    queryFn: vendorGroupService.getActiveVendorGroups
  });

  // Accounts query for dropdowns
  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    error: accountsError
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: vendorGroupService.getAccounts,
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
    queryFn: vendorGroupService.getLiabilityAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: vendorGroupService.createVendorGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorGroups'] });
      queryClient.invalidateQueries({ queryKey: ['vendorGroupStats'] });
      queryClient.invalidateQueries({ queryKey: ['activeVendorGroups'] });
      toast.success('Vendor group created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create vendor group');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorGroupFormData> }) =>
      vendorGroupService.updateVendorGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorGroups'] });
      queryClient.invalidateQueries({ queryKey: ['vendorGroupStats'] });
      queryClient.invalidateQueries({ queryKey: ['activeVendorGroups'] });
      toast.success('Vendor group updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update vendor group');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: vendorGroupService.deleteVendorGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorGroups'] });
      queryClient.invalidateQueries({ queryKey: ['vendorGroupStats'] });
      queryClient.invalidateQueries({ queryKey: ['activeVendorGroups'] });
      toast.success('Vendor group deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete vendor group');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: vendorGroupService.toggleVendorGroupStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorGroups'] });
      queryClient.invalidateQueries({ queryKey: ['vendorGroupStats'] });
      queryClient.invalidateQueries({ queryKey: ['activeVendorGroups'] });
      toast.success('Vendor group status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update vendor group status');
    }
  });

  const checkUsageMutation = useMutation({
    mutationFn: vendorGroupService.checkVendorGroupUsage,
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to check vendor group usage');
    }
  });

  const exportExcelMutation = useMutation({
    mutationFn: vendorGroupService.exportToExcel,
    onSuccess: (blob) => {
      vendorGroupService.downloadFile(blob, 'vendor-groups.xlsx');
      toast.success('Vendor groups exported to Excel successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export vendor groups to Excel');
    }
  });

  const exportPdfMutation = useMutation({
    mutationFn: vendorGroupService.exportToPdf,
    onSuccess: (blob) => {
      vendorGroupService.downloadFile(blob, 'vendor-groups.pdf');
      toast.success('Vendor groups exported to PDF successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export vendor groups to PDF');
    }
  });

  // Computed values
  const vendorGroups = useMemo(() => vendorGroupResponse?.data || [], [vendorGroupResponse]);
  const pagination = useMemo(() => vendorGroupResponse?.pagination, [vendorGroupResponse]);

  // Action handlers
  const handleFilter = useCallback((newFilters: Partial<VendorGroupFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key: key as keyof VendorGroup, direction });
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const createVendorGroup = useCallback((data: VendorGroupFormData) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const updateVendorGroup = useCallback((id: string, data: Partial<VendorGroupFormData>) => {
    updateMutation.mutate({ id, data });
  }, [updateMutation]);

  const deleteVendorGroup = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const toggleVendorGroupStatus = useCallback((id: string) => {
    toggleStatusMutation.mutate(id);
  }, [toggleStatusMutation]);

  const checkVendorGroupUsage = useCallback((id: string): Promise<VendorGroupUsage> => {
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
    vendorGroups,
    activeVendorGroups,
    accounts,
    liabilityAccounts,
    pagination,
    filters,
    sortConfig,

    // Loading states
    isLoadingStats,
    isLoadingVendorGroups,
    isLoadingActiveVendorGroups,
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
    vendorGroupsError,
    activeVendorGroupsError,
    accountsError,
    liabilityAccountsError,

    // Actions
    handleFilter,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    createVendorGroup,
    updateVendorGroup,
    deleteVendorGroup,
    toggleVendorGroupStatus,
    checkVendorGroupUsage,
    exportToExcel,
    exportToPdf,
    refetchVendorGroups,

    // Permissions
    canCreate,
    canUpdate,
    canDelete,
    canExport
  };
};

