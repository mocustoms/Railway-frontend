import { apiService } from './api';
import { api } from './api';

export interface SalesTransactionStats {
  summary: {
    totalTransactions: number;
    totalAmount: number;
    totalEquivalentAmount: number; // Total equivalent amount in system currency
    totalPaid: number;
    totalBalance: number;
    invoiceCount: number;
    orderCount: number;
    statusBreakdown: Array<{
      status: string;
      count: number;
      total: number;
    }>;
  };
}

export interface SalesTransactionStatsParams {
  dateFrom?: string;
  dateTo?: string;
  transactionType?: string;
  storeId?: string;
  financialYearId?: string;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface RevenueChartData {
  labels: string[];
  data: number[];
}

export const salesTransactionService = {
  /**
   * Get summary statistics for sales transactions
   * This includes total revenue (totalAmount)
   */
  getStats: async (params?: SalesTransactionStatsParams): Promise<SalesTransactionStats> => {
    const queryParams = new URLSearchParams();
    
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
    if (params?.storeId) queryParams.append('storeId', params.storeId);
    if (params?.financialYearId) queryParams.append('financialYearId', params.financialYearId);

    const url = `/sales-transactions/stats/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiService.get<SalesTransactionStats>(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to fetch sales transaction stats');
  },

  /**
   * Get revenue data grouped by date for charting
   * Fetches transactions in date range and groups by date
   */
  getRevenueByDate: async (dateFrom: string, dateTo: string): Promise<RevenueDataPoint[]> => {
    try {
      // Fetch only approved Sales Invoices in the date range
      const queryParams = new URLSearchParams();
      queryParams.append('dateFrom', dateFrom);
      queryParams.append('dateTo', dateTo);
      queryParams.append('transactionType', 'invoice'); // Only sales invoices
      queryParams.append('status', 'approved'); // Only approved invoices
      queryParams.append('limit', '10000'); // Large limit to get all transactions
      queryParams.append('page', '1');

      // The sales-transactions endpoint returns data directly, not wrapped in ApiResponse
      const response = await api.get<{
        salesTransactions?: Array<{
          transactionDate?: string;
          transaction_date?: string;
          totalAmount?: number;
          total_amount?: number;
        }>;
        pagination?: any;
      }>(`/sales-transactions?${queryParams.toString()}`);

      // Handle direct response (not wrapped in ApiResponse)
      const data = response.data;

      if (data?.salesTransactions && Array.isArray(data.salesTransactions)) {
        // Group transactions by date and sum revenue
        const revenueByDate = new Map<string, number>();
        
        data.salesTransactions.forEach((transaction) => {
          // Handle both camelCase and snake_case field names
          const dateStr = transaction.transactionDate || transaction.transaction_date;
          const amount = transaction.totalAmount || transaction.total_amount || 0;
          
          if (dateStr) {
            const date = dateStr.split('T')[0]; // Get date part only
            const currentRevenue = revenueByDate.get(date) || 0;
            revenueByDate.set(date, currentRevenue + amount);
          }
        });

        // Convert to array and sort by date
        const revenueData: RevenueDataPoint[] = Array.from(revenueByDate.entries())
          .map(([date, revenue]) => ({ date, revenue }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return revenueData;
      }

      return [];
    } catch (error) {
      return [];
    }
  },
};

export default salesTransactionService;

