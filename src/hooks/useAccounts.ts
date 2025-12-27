import { useQuery } from '@tanstack/react-query';
import { Account } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { accountService } from '../services/accountService';

export const useAccounts = () => {
  const { isAuthenticated } = useAuth();

  const {
    data: accounts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['leaf-accounts'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      return await accountService.getLeafAccounts();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  return {
    accounts: accounts || [],
    isLoading,
    error,
    refetch
  };
};
