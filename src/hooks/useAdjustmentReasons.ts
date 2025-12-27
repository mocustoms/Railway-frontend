import { useQuery } from '@tanstack/react-query';
import { AdjustmentReason } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { adjustmentReasonService } from '../services/adjustmentReasonService';

export const useAdjustmentReasons = () => {
  const { isAuthenticated } = useAuth();

  const {
    data: adjustmentReasons,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['all-adjustment-reasons'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      return await adjustmentReasonService.getAllAdjustmentReasons();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  return {
    adjustmentReasons: adjustmentReasons || [],
    isLoading,
    error,
    refetch
  };
};
