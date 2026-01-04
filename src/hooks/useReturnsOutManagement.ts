import { useMemo, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import returnsOutService, { ReturnsOut, ReturnsOutFormData, ReturnsOutStats } from '../services/returnsOutService';

export interface ReturnsOutFilters {
  search: string;
  status?: string;
  refundStatus?: string;
  vendorId?: string;
  storeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReturnsOutSortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const defaultFilters: ReturnsOutFilters = { search: '' };
const defaultSort: ReturnsOutSortConfig = { key: 'created_at', direction: 'desc' };

export const useReturnsOutManagement = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<ReturnsOutFilters>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<ReturnsOutSortConfig>(defaultSort);

  const returnsOutQuery = useQuery({
    queryKey: ['returns-out', page, limit, filters, sortConfig],
    queryFn: () => returnsOutService.getReturnsOut({
      page,
      limit,
      search: filters.search,
      status: filters.status,
      refundStatus: filters.refundStatus,
      vendorId: filters.vendorId,
      storeId: filters.storeId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sortBy: sortConfig.key,
      sortOrder: sortConfig.direction
    }),
    staleTime: 0
  });

  const statsQuery = useQuery({
    queryKey: ['returns-out-stats'],
    queryFn: () => returnsOutService.getStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const returnsOut = useMemo(() => returnsOutQuery.data?.data || [], [returnsOutQuery.data]);
  const pagination = returnsOutQuery.data?.pagination;

  const createMutation = useMutation({
    mutationFn: (data: ReturnsOutFormData) => returnsOutService.createReturnsOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-out'] });
      queryClient.invalidateQueries({ queryKey: ['returns-out-stats'] });
      toast.success('Return created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create return');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReturnsOutFormData> }) => returnsOutService.updateReturnsOut(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-out'] });
      queryClient.invalidateQueries({ queryKey: ['returns-out-stats'] });
      toast.success('Return updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update return');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => returnsOutService.deleteReturnsOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-out'] });
      queryClient.invalidateQueries({ queryKey: ['returns-out-stats'] });
      toast.success('Return deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete return');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => returnsOutService.approveReturnsOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-out'] });
      queryClient.invalidateQueries({ queryKey: ['returns-out-stats'] });
      toast.success('Return approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve return');
    }
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => returnsOutService.completeReturnsOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-out'] });
      queryClient.invalidateQueries({ queryKey: ['returns-out-stats'] });
      toast.success('Return completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to complete return');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => returnsOutService.cancelReturnsOut(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-out'] });
      queryClient.invalidateQueries({ queryKey: ['returns-out-stats'] });
      toast.success('Return cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel return');
    }
  });

  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((status?: string) => {
    setFilters(prev => ({ ...prev, status }));
    setPage(1);
  }, []);

  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  }, []);

  return {
    returnsOut,
    pagination,
    page,
    limit,
    isLoading: returnsOutQuery.isLoading,
    error: returnsOutQuery.error as any,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    setPage,
    setLimit,
    handleSearch,
    handleStatusFilter,
    handleSort,
    createReturnsOut: createMutation.mutateAsync,
    updateReturnsOut: (id: string, data: Partial<ReturnsOutFormData>) => updateMutation.mutateAsync({ id, data }),
    deleteReturnsOut: deleteMutation.mutateAsync,
    approveReturnsOut: approveMutation.mutateAsync,
    completeReturnsOut: completeMutation.mutateAsync,
    cancelReturnsOut: (id: string, reason?: string) => cancelMutation.mutateAsync({ id, reason }),
    exportExcel: returnsOutService.exportExcel,
    exportPdf: returnsOutService.exportPdf
  };
};

export default useReturnsOutManagement;

