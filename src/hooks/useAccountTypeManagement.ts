import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { AccountType } from '../types';
import toast from 'react-hot-toast';
import { accountTypeService, AccountTypeFilters } from '../services/accountTypeService';

interface AccountTypeSort {
  column: string;
  direction: 'asc' | 'desc';
}

interface UseAccountTypeManagementReturn {
  // State
  accountTypes: AccountType[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  searchTerm: string;
  filters: AccountTypeFilters;
  sort: AccountTypeSort;
  
  // Actions
  loadAccountTypes: () => Promise<void>;
  createAccountType: (data: Partial<AccountType>) => Promise<AccountType | null>;
  updateAccountType: (id: string, data: Partial<AccountType>) => Promise<AccountType | null>;
  deleteAccountType: (id: string) => Promise<boolean>;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: AccountTypeFilters) => void;
  setSort: (sort: AccountTypeSort) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  exportToExcel: (filters?: AccountTypeFilters) => Promise<void>;
  exportToPDF: (filters?: AccountTypeFilters) => Promise<void>;
  
  // Computed
  filteredAccountTypes: AccountType[];
  hasData: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export const useAccountTypeManagement = (): UseAccountTypeManagementReturn => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AccountTypeFilters>({});
  const [sort, setSort] = useState<AccountTypeSort>({ column: 'name', direction: 'asc' });

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
      sort: sort.column,
      order: sort.direction
    });

    if (searchTerm) {
      params.append('search', searchTerm);
    }

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    return params.toString();
  }, [currentPage, pageSize, searchTerm, filters, sort]);

  // Load account types with React Query
  const {
    data: accountTypesData,
    isLoading,
    error: loadError
  } = useQuery({
    queryKey: ['accountTypes', queryParams],
    queryFn: async () => {
      if (!isAuthenticated) return { data: [], total: 0, pagination: { pages: 0 } };
      return await accountTypeService.getAccountTypes(currentPage, pageSize, filters, sort);
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Partial<AccountType>) => {
      return await accountTypeService.createAccountType(data);
    },
    onSuccess: () => {
      toast.success('Account type created successfully');
      queryClient.invalidateQueries({ queryKey: ['accountTypes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to create account type');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AccountType> }) => {
      return await accountTypeService.updateAccountType(id, data);
    },
    onSuccess: () => {
      toast.success('Account type updated successfully');
      queryClient.invalidateQueries({ queryKey: ['accountTypes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to update account type');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await accountTypeService.deleteAccountType(id);
      return true;
    },
    onSuccess: () => {
      toast.success('Account type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['accountTypes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to delete account type');
    }
  });

  // Computed values
  const accountTypes = accountTypesData?.data || [];
  const totalItems = accountTypesData?.total || 0;
  const totalPages = accountTypesData?.pagination?.pages || 0;
  const hasData = useMemo(() => accountTypes.length > 0, [accountTypes]);

  // Permission checks - simplified JWT authentication
  const canCreate = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canUpdate = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canDelete = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canExport = useMemo(() => isAuthenticated, [isAuthenticated]);

  // Load account types function (for backward compatibility)
  const loadAccountTypes = useCallback(async () => {
    // This is now handled by React Query
    queryClient.invalidateQueries({ queryKey: ['accountTypes'] });
  }, [queryClient]);

  // Create account type function
  const createAccountType = useCallback(async (data: Partial<AccountType>): Promise<AccountType | null> => {
    if (!isAuthenticated || !canCreate) return null;
    return createMutation.mutateAsync(data);
  }, [isAuthenticated, canCreate, createMutation]);

  // Update account type function
  const updateAccountType = useCallback(async (id: string, data: Partial<AccountType>): Promise<AccountType | null> => {
    if (!isAuthenticated || !canUpdate) return null;
    return updateMutation.mutateAsync({ id, data });
  }, [isAuthenticated, canUpdate, updateMutation]);

  // Delete account type function
  const deleteAccountType = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated || !canDelete) return false;
    return deleteMutation.mutateAsync(id);
  }, [isAuthenticated, canDelete, deleteMutation]);

  // Filtered account types
  const filteredAccountTypes = useMemo(() => {
    return accountTypes;
  }, [accountTypes]);

  // Export functions
  const exportToExcel = useCallback(async (filters?: AccountTypeFilters) => {
    if (!isAuthenticated || !canExport) return;
    
    try {
      const blob = await accountTypeService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'account-types.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel export completed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export to Excel');
    }
  }, [isAuthenticated, canExport]);

  const exportToPDF = useCallback(async (filters?: AccountTypeFilters) => {
    if (!isAuthenticated || !canExport) return;
    
    try {
      const blob = await accountTypeService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'account-types.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF export completed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export to PDF');
    }
  }, [isAuthenticated, canExport]);

  return {
    // State
    accountTypes,
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchTerm,
    filters,
    sort,
    
    // Actions
    loadAccountTypes,
    createAccountType,
    updateAccountType,
    deleteAccountType,
    setSearchTerm,
    setFilters,
    setSort,
    setPage: setCurrentPage,
    setPageSize,
    exportToExcel,
    exportToPDF,
    
    // Computed
    filteredAccountTypes,
    hasData,
    canCreate,
    canUpdate,
    canDelete,
    canExport
  };
};

export default useAccountTypeManagement;