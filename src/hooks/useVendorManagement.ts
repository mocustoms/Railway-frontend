import { useMemo, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import vendorService, { Vendor, VendorFormData, PaginatedResponse } from '../services/vendorService';

export interface VendorFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export interface VendorSortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const defaultFilters: VendorFilters = { search: '', status: 'all' };
const defaultSort: VendorSortConfig = { key: 'created_at', direction: 'desc' };

export const useVendorManagement = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<VendorFilters>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<VendorSortConfig>(defaultSort);

  const vendorsQuery = useQuery<PaginatedResponse<Vendor>>({
    queryKey: ['vendors', page, limit, filters, sortConfig],
    queryFn: () => vendorService.getVendors({
      page,
      limit,
      search: filters.search,
      status: filters.status,
      sort_by: sortConfig.key,
      sort_order: sortConfig.direction
    }),
    staleTime: 0
  });

  const statsQuery = useQuery({
    queryKey: ['vendors-stats'],
    queryFn: () => vendorService.getStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const vendors = useMemo(() => vendorsQuery.data?.data || [], [vendorsQuery.data]);
  const pagination = vendorsQuery.data?.pagination;

  const createMutation = useMutation({
    mutationFn: (data: VendorFormData) => vendorService.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-stats'] });
      toast.success('Vendor created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create vendor');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorFormData> }) => vendorService.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-stats'] });
      toast.success('Vendor updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update vendor');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorService.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-stats'] });
      toast.success('Vendor deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete vendor');
    }
  });

  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, status }));
    setPage(1);
  }, []);

  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  }, []);

  return {
    vendors,
    pagination,
    page,
    limit,
    isLoading: vendorsQuery.isLoading,
    error: vendorsQuery.error as any,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    setPage,
    setLimit,
    handleSearch,
    handleStatusFilter,
    handleSort,
    createVendor: createMutation.mutateAsync,
    updateVendor: (id: string, data: Partial<VendorFormData>) => updateMutation.mutateAsync({ id, data }),
    deleteVendor: deleteMutation.mutateAsync,
    exportExcel: vendorService.exportExcel,
    exportPdf: vendorService.exportPdf
  };
};

export default useVendorManagement;

