import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Receipt
} from 'lucide-react';
import { apiService } from '../services/api';
import StatCard from '../components/StatCard';
import GridLayout from '../components/GridLayout';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { Company } from '../types';

interface AccountsDashboardStats {
  totalDebitAmount: number;
  totalCreditAmount: number;
  delta: number;
  totalExpenses: number;
}


const AccountsDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch company data to get default currency
  const { data: companyData } = useQuery<Company | null>({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await apiService.get<Company>('/company');
      return response.success && response.data ? response.data : null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const defaultCurrencySymbol = companyData?.defaultCurrency?.symbol || '$';

  // Fetch accounts dashboard statistics from General Ledger
  const { data: dashboardStats, isLoading: loadingStats } = useQuery<AccountsDashboardStats>({
    queryKey: ['accountsDashboardStats'],
    queryFn: async () => {
      const response = await apiService.get<AccountsDashboardStats>('/accounts/dashboard-statistics');
      return response.success && response.data ? response.data : {
        totalDebitAmount: 0,
        totalCreditAmount: 0,
        delta: 0,
        totalExpenses: 0
      };
    },
    enabled: !!user,
    retry: 1,
    retryDelay: 2000
  });

  // Calculate balance (debit - credit)
  const netBalance = useMemo(() => {
    if (!dashboardStats) return 0;
    return dashboardStats.delta;
  }, [dashboardStats]);

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards - Debit, Credit, Difference, and Opening Balances */}
      <GridLayout cols={4} gap={6} className="product-grid-animation">
        {/* Debit Balance */}
        <StatCard
          title="Debit Balance"
          value={dashboardStats?.totalDebitAmount || 0}
          icon={TrendingDown}
          iconBgColor="#fee2e2"
          iconColor="#dc2626"
          formatValue={(val) => formatCurrency(Number(val), defaultCurrencySymbol)}
        />

        {/* Credit Balance */}
        <StatCard
          title="Credit Balance"
          value={dashboardStats?.totalCreditAmount || 0}
          icon={TrendingUp}
          iconBgColor="#dcfce7"
          iconColor="#16a34a"
          formatValue={(val) => formatCurrency(Number(val), defaultCurrencySymbol)}
        />

        {/* Difference */}
        <StatCard
          title="Difference"
          value={netBalance}
          icon={ArrowLeftRight}
          iconBgColor={netBalance >= 0 ? "#dbeafe" : "#fee2e2"}
          iconColor={netBalance >= 0 ? "#3b82f6" : "#dc2626"}
          formatValue={(val) => formatCurrency(Number(val), defaultCurrencySymbol)}
        />

        {/* Expenses */}
        <StatCard
          title="Expenses"
          value={dashboardStats?.totalExpenses || 0}
          icon={Receipt}
          iconBgColor="#fef3c7"
          iconColor="#d97706"
          formatValue={(val) => formatCurrency(Number(val), defaultCurrencySymbol)}
        />
      </GridLayout>
    </div>
  );
};

export default AccountsDashboard;

