import { useMemo, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import customerService, { Customer, CustomerFormData, PaginatedResponse } from '../services/customerService';

export interface CustomerFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export interface CustomerSortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const defaultFilters: CustomerFilters = { search: '', status: 'all' };
const defaultSort: CustomerSortConfig = { key: 'created_at', direction: 'desc' };

export const useCustomerManagement = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<CustomerFilters>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<CustomerSortConfig>(defaultSort);

  const customersQuery = useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', page, limit, filters, sortConfig],
    queryFn: () => customerService.getCustomers({
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
    queryKey: ['customers-stats'],
    queryFn: () => customerService.getStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data]);
  const pagination = customersQuery.data?.pagination;

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
      toast.success('Customer created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create customer');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => customerService.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
      toast.success('Customer updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update customer');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete customer');
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
    customers,
    pagination,
    page,
    limit,
    isLoading: customersQuery.isLoading,
    error: customersQuery.error as any,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    setPage,
    setLimit,
    handleSearch,
    handleStatusFilter,
    handleSort,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: (id: string, data: Partial<CustomerFormData>) => updateMutation.mutateAsync({ id, data }),
    deleteCustomer: deleteMutation.mutateAsync,
    exportExcel: customerService.exportExcel,
    exportPdf: customerService.exportPdf
  };
};

export default useCustomerManagement;


