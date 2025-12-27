import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { financialYearService } from '../services/financialYearService';
import { useAuth } from '../contexts/AuthContext';
import { PaginatedResponse } from '../types';
import {
  FinancialYear,
  FinancialYearFormData,
  FinancialYearFilters,
  FinancialYearStats
} from '../data/financialYearModules';

// No need for ENDPOINTS object - using service methods instead

export const useFinancialYearManagement = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [filters, setFilters] = useState<FinancialYearFilters>({
    search: '',
    status: 'all'
  });
  const [sortConfig, setSortConfig] = useState<{
    field: keyof FinancialYear;
    direction: 'asc' | 'desc';
  }>({
    field: 'startDate',
    direction: 'desc'
  });

  // Queries
  const {
    data: financialYearsResponse,
    isLoading: isLoadingYears,
    error: yearsError,
    isFetching: isFetchingYears,
    isStale: isStaleYears
  } = useQuery({
    queryKey: ['financialYears'],
    queryFn: async (): Promise<PaginatedResponse<FinancialYear>> => {
      const response = await financialYearService.getFinancialYears();
      return response;
    },
    enabled: isAuthenticated, // Only run query if authenticated
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  const financialYears = useMemo(() => {
    // Handle different response structures
    let result = [];
    if (financialYearsResponse) {
      if (Array.isArray(financialYearsResponse)) {
        // Direct array response
        result = financialYearsResponse;
      } else if (financialYearsResponse.data && Array.isArray(financialYearsResponse.data)) {
        // Paginated response
        result = financialYearsResponse.data;
      } else if ((financialYearsResponse as any).rows && Array.isArray((financialYearsResponse as any).rows)) {
        // Sequelize response
        result = (financialYearsResponse as any).rows;
      }
    }
    
    return result;
  }, [financialYearsResponse]);

  const {
    data: currentYear,
    isLoading: isLoadingCurrentYear,
    error: currentYearError,
    isFetching: isFetchingCurrentYear,
    isStale: isStaleCurrentYear
  } = useQuery({
    queryKey: ['currentFinancialYear'],
    queryFn: async (): Promise<FinancialYear | null> => {
      const result = await financialYearService.getCurrentFinancialYear();
      return result || null;
    },
    enabled: isAuthenticated, // Only run query if authenticated
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors (no current year found)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: FinancialYearFormData): Promise<FinancialYear> => {
      return await financialYearService.createFinancialYear(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialYears'] });
      queryClient.invalidateQueries({ queryKey: ['currentFinancialYear'] });
      toast.success('Financial year created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create financial year';
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinancialYearFormData> }): Promise<FinancialYear> => {
      return await financialYearService.updateFinancialYear(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialYears'] });
      queryClient.invalidateQueries({ queryKey: ['currentFinancialYear'] });
      toast.success('Financial year updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update financial year';
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await financialYearService.deleteFinancialYear(id);
      },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialYears'] });
      queryClient.invalidateQueries({ queryKey: ['currentFinancialYear'] });
      toast.success('Financial year deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete financial year';
      toast.error(message);
    }
  });

  const setCurrentMutation = useMutation({
    mutationFn: async (id: string): Promise<FinancialYear> => {
      return await financialYearService.setCurrentFinancialYear(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialYears'] });
      queryClient.invalidateQueries({ queryKey: ['currentFinancialYear'] });
      toast.success('Current financial year updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to set current financial year';
      toast.error(message);
    }
  });

  const closeMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }): Promise<FinancialYear> => {
      return await financialYearService.closeFinancialYear(id, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialYears'] });
      queryClient.invalidateQueries({ queryKey: ['currentFinancialYear'] });
      toast.success('Financial year closed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to close financial year';
      toast.error(message);
    }
  });

  const reopenMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }): Promise<FinancialYear> => {
      return await financialYearService.reopenFinancialYear(id, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialYears'] });
      queryClient.invalidateQueries({ queryKey: ['currentFinancialYear'] });
      toast.success('Financial year reopened successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reopen financial year';
      toast.error(message);
    }
  });

  // Computed values
  const filteredAndSortedYears = useMemo(() => {
    let filtered = financialYears;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((year: FinancialYear) =>
        year.name.toLowerCase().includes(searchLower) ||
        year.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((year: FinancialYear) => {
        switch (filters.status) {
          case 'open':
            return !year.isClosed; // Show all open years regardless of isActive
          case 'closed':
            return year.isClosed; // Show all closed years regardless of isActive
          case 'current':
            return year.isCurrent;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a: FinancialYear, b: FinancialYear) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [financialYears, filters, sortConfig]);

  const stats: FinancialYearStats = useMemo(() => {
    const totalYears = financialYears.length;
    const openYears = financialYears.filter((year: FinancialYear) => !year.isClosed).length; // Include all open years
    const closedYears = financialYears.filter((year: FinancialYear) => year.isClosed).length; // Include all closed years

    return {
      totalYears,
      openYears,
      closedYears,
      currentYear
    };
  }, [financialYears, currentYear]);

  // Handlers
  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleStatusFilter = useCallback((status: FinancialYearFilters['status']) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const handleSort = useCallback((field: keyof FinancialYear) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const createFinancialYear = useCallback((data: FinancialYearFormData) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateFinancialYear = useCallback((id: string, data: Partial<FinancialYearFormData>) => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteFinancialYear = useCallback((id: string) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const setCurrentFinancialYear = useCallback((id: string) => {
    return setCurrentMutation.mutateAsync(id);
  }, [setCurrentMutation]);

  const closeFinancialYear = useCallback((id: string, notes?: string) => {
    return closeMutation.mutateAsync({ id, notes });
  }, [closeMutation]);

  const reopenFinancialYear = useCallback((id: string, notes?: string) => {
    return reopenMutation.mutateAsync({ id, notes });
  }, [reopenMutation]);

  // Permission checks
  const canCreate = useMemo(() => {
    return isAuthenticated && user && ['admin', 'manager'].includes(user.role);
  }, [isAuthenticated, user]);

  const canUpdate = useMemo(() => {
    return isAuthenticated && user && ['admin', 'manager'].includes(user.role);
  }, [isAuthenticated, user]);

  const canDelete = useMemo(() => {
    return isAuthenticated && user && ['admin'].includes(user.role);
  }, [isAuthenticated, user]);

  const canSetCurrent = useMemo(() => {
    return isAuthenticated && user && ['admin', 'manager'].includes(user.role);
  }, [isAuthenticated, user]);

  const canClose = useMemo(() => {
    return isAuthenticated && user && ['admin', 'manager'].includes(user.role);
  }, [isAuthenticated, user]);

  const canReopen = useMemo(() => {
    return isAuthenticated && user && ['admin'].includes(user.role);
  }, [isAuthenticated, user]);

  return {
    // Data
    financialYears: filteredAndSortedYears,
    currentYear,
    stats,
    
    // Loading states
    isLoading: isLoadingYears || isLoadingCurrentYear,
    isLoadingYears,
    isLoadingCurrentYear,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingCurrent: setCurrentMutation.isPending,
    isClosing: closeMutation.isPending,
    isReopening: reopenMutation.isPending,
    
    // Errors
    error: yearsError || currentYearError,
    
    // Filters and sorting
    filters,
    sortConfig,
    
    // Permissions
    canCreate,
    canUpdate,
    canDelete,
    canSetCurrent,
    canClose,
    canReopen,
    
    // Handlers
    handleSearch,
    handleStatusFilter,
    handleSort,
    createFinancialYear,
    updateFinancialYear,
    deleteFinancialYear,
    setCurrentFinancialYear,
    closeFinancialYear,
    reopenFinancialYear
  };
}; 