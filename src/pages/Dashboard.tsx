import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Receipt
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import { userService } from '../services/userService';
import { productCatalogService } from '../services/productCatalogService';
import customerService from '../services/customerService';
import { salesOrderService } from '../services/salesOrderService';
import { salesTransactionService } from '../services/salesTransactionService';
import { receiptService } from '../services/receiptService';
import { apiService } from '../services/api';
import { revenueReportService, TopProduct as RevenueTopProduct } from '../services/revenueReportService';
import StatCard from '../components/StatCard';
import GridLayout from '../components/GridLayout';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { Company } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  revenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalReceipts: number;
  receiptsTotalValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  receiptsGrowth: number;
}

// TopProduct interface is now imported from revenueReportService


const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [revenuePeriod, setRevenuePeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [productFilter, setProductFilter] = useState<'top' | 'bottom'>('top');

  // Get date ranges for current and previous month (for growth calculation)
  const getPeriodDates = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
      currentStart: currentMonthStart.toISOString().split('T')[0],
      currentEnd: now.toISOString().split('T')[0],
      previousStart: previousMonthStart.toISOString().split('T')[0],
      previousEnd: previousMonthEnd.toISOString().split('T')[0]
    };
  };

  const periodDates = getPeriodDates();

  // Fetch company data to get default currency
  const { data: companyData } = useQuery<Company | null>({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await apiService.get<Company>('/company');
      return response.success && response.data ? response.data : null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get default currency symbol
  const defaultCurrencySymbol = companyData?.defaultCurrency?.symbol || '$';
  const defaultCurrencyCode = companyData?.defaultCurrency?.code || 'USD';

  // Fetch dashboard data only if user is authenticated

  // Fetch receipt statistics
  const { data: receiptStats } = useQuery({
    queryKey: ['receiptStats'],
    queryFn: () => receiptService.getReceiptStats(),
    enabled: !!user, // Only run query if user is authenticated
    retry: 1,
    retryDelay: 2000
  });

  // Fetch customer statistics
  const { data: customerStats } = useQuery({
    queryKey: ['customerStats'],
    queryFn: () => customerService.getStats(),
    enabled: !!user, // Only run query if user is authenticated
    retry: 1,
    retryDelay: 2000
  });

  // Fetch current month customer count
  const { data: currentMonthCustomers } = useQuery({
    queryKey: ['currentMonthCustomers', periodDates.currentStart, periodDates.currentEnd],
    queryFn: async () => {
      // We need to count customers created in current month
      // Since the API doesn't have date filtering, we'll use a workaround
      // by fetching and counting on the frontend, or we can create a new endpoint
      // For now, let's use the sales transaction approach - count customers created in date range
      const allCustomers = await customerService.getCustomers({
        page: 1,
        limit: 10000 // Large limit to get all
      });
      const currentMonthStart = new Date(periodDates.currentStart);
      const currentMonthEnd = new Date(periodDates.currentEnd);
      const count = allCustomers.data.filter((c: any) => {
        const created = new Date(c.created_at);
        return created >= currentMonthStart && created <= currentMonthEnd;
      }).length;
      return count;
    },
    enabled: !!user && !!periodDates,
    retry: 1,
    retryDelay: 2000
  });

  // Fetch previous month customer count
  const { data: previousMonthCustomers } = useQuery({
    queryKey: ['previousMonthCustomers', periodDates.previousStart, periodDates.previousEnd],
    queryFn: async () => {
      const allCustomers = await customerService.getCustomers({
        page: 1,
        limit: 10000
      });
      const previousMonthStart = new Date(periodDates.previousStart);
      const previousMonthEnd = new Date(periodDates.previousEnd);
      const count = allCustomers.data.filter((c: any) => {
        const created = new Date(c.created_at);
        return created >= previousMonthStart && created <= previousMonthEnd;
      }).length;
      return count;
    },
    enabled: !!user && !!periodDates,
    retry: 1,
    retryDelay: 2000
  });

  // Fetch sales order statistics (includes thisMonth and lastMonth counts)
  const { data: salesOrderStats, error: salesOrderStatsError } = useQuery({
    queryKey: ['salesOrderStats'],
    queryFn: () => salesOrderService.getSalesOrderStats(),
    enabled: !!user, // Only run query if user is authenticated
    retry: 1,
    retryDelay: 2000
  });

  // Fetch all-time sales transaction statistics (total revenue)
  const { data: salesTransactionStats } = useQuery({
    queryKey: ['salesTransactionStats'],
    queryFn: () => salesTransactionService.getStats(),
    enabled: !!user, // Only run query if user is authenticated
    retry: 1,
    retryDelay: 2000
  });

  // Fetch current month revenue for growth calculation
  const { data: currentMonthStats } = useQuery({
    queryKey: ['currentMonthRevenue', periodDates.currentStart, periodDates.currentEnd],
    queryFn: () => salesTransactionService.getStats({
      dateFrom: periodDates.currentStart,
      dateTo: periodDates.currentEnd
    }),
    enabled: !!user,
    retry: 1,
    retryDelay: 2000
  });

  // Fetch previous month revenue for growth calculation
  const { data: previousPeriodStats } = useQuery({
    queryKey: ['previousPeriodRevenue', periodDates.previousStart, periodDates.previousEnd],
    queryFn: () => salesTransactionService.getStats({
      dateFrom: periodDates.previousStart,
      dateTo: periodDates.previousEnd
    }),
    enabled: !!user,
    retry: 1,
    retryDelay: 2000
  });


  // Memoized stats calculation
  const stats = useMemo((): DashboardStats => {
    const totalCustomers = customerStats?.total || 0;
    // Show only accepted (approved) orders count
    // The backend returns 'accepted' field for accepted orders
    // Note: 'accepted' status in sales orders is equivalent to 'approved'
    const totalOrders = salesOrderStats?.accepted ?? 0;
    
    // Get revenue from sales transactions (equivalentAmount) - all-time revenue in system currency
    const revenue = salesTransactionStats?.summary?.totalEquivalentAmount || 0;
    
    // Get receipts data
    const totalReceipts = receiptStats?.total || 0;
    const receiptsTotalValue = receiptStats?.totalAmount || 0;
    
    // Calculate revenue growth percentage (current month vs previous month)
    const currentMonthRevenue = currentMonthStats?.summary?.totalEquivalentAmount || 0;
    const previousMonthRevenue = previousPeriodStats?.summary?.totalEquivalentAmount || 0;
    let revenueGrowth = 0;
    if (previousMonthRevenue > 0 && currentMonthRevenue > 0) {
      revenueGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    } else if (currentMonthRevenue > 0 && previousMonthRevenue === 0) {
      revenueGrowth = 100; // 100% growth if no previous month revenue
    }
    
    // Calculate orders growth percentage (current month vs previous month)
    // Sales order stats already includes thisMonth and lastMonth counts
    const currentMonthOrders = salesOrderStats?.thisMonth || 0;
    const previousMonthOrders = salesOrderStats?.lastMonth || 0;
    let ordersGrowth = 0;
    if (previousMonthOrders > 0 && currentMonthOrders > 0) {
      ordersGrowth = ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100;
    } else if (currentMonthOrders > 0 && previousMonthOrders === 0) {
      ordersGrowth = 100; // 100% growth if no previous month orders
    }
    
    // Calculate customers growth percentage (current month vs previous month)
    const currentMonthCustomersCount = currentMonthCustomers || 0;
    const previousMonthCustomersCount = previousMonthCustomers || 0;
    let customersGrowth = 0;
    if (previousMonthCustomersCount > 0 && currentMonthCustomersCount > 0) {
      customersGrowth = ((currentMonthCustomersCount - previousMonthCustomersCount) / previousMonthCustomersCount) * 100;
    } else if (currentMonthCustomersCount > 0 && previousMonthCustomersCount === 0) {
      customersGrowth = 100; // 100% growth if no previous month customers
    }
    
    // Calculate receipts growth percentage (current month vs previous month)
    const currentMonthReceipts = receiptStats?.thisMonth || 0;
    const previousMonthReceipts = receiptStats?.lastMonth || 0;
    let receiptsGrowth = 0;
    if (previousMonthReceipts > 0 && currentMonthReceipts > 0) {
      receiptsGrowth = ((currentMonthReceipts - previousMonthReceipts) / previousMonthReceipts) * 100;
    } else if (currentMonthReceipts > 0 && previousMonthReceipts === 0) {
      receiptsGrowth = 100; // 100% growth if no previous month receipts
    }
    
    return {
      revenue,
      totalOrders,
      totalCustomers,
      totalReceipts,
      receiptsTotalValue,
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
      ordersGrowth: parseFloat(ordersGrowth.toFixed(1)),
      customersGrowth: parseFloat(customersGrowth.toFixed(1)),
      receiptsGrowth: parseFloat(receiptsGrowth.toFixed(1))
    };
  }, [
    customerStats, 
    salesOrderStats, 
    salesTransactionStats, 
    receiptStats,
    currentMonthStats, 
    previousPeriodStats,
    currentMonthCustomers,
    previousMonthCustomers
  ]);

  // Get date range for revenue chart based on selected period
  const getRevenueChartDateRange = () => {
    const now = new Date();
    
    if (revenuePeriod === 'weekly') {
      // Get start of current week (Monday)
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      // Adjust to Monday (day 1), where Sunday is 0
      const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days, otherwise go to Monday
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      return {
        dateFrom: startOfWeek.toISOString().split('T')[0],
        dateTo: now.toISOString().split('T')[0],
      };
    } else {
      // Get start of current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return {
        dateFrom: startOfMonth.toISOString().split('T')[0],
        dateTo: now.toISOString().split('T')[0],
      };
    }
  };

  const revenueChartDateRange = getRevenueChartDateRange();

  // Fetch top/bottom products by revenue
  const { data: topProducts = [], isLoading: isLoadingProducts } = useQuery<RevenueTopProduct[]>({
    queryKey: ['topProducts', revenueChartDateRange.dateFrom, revenueChartDateRange.dateTo, productFilter],
    queryFn: async () => {
      return await revenueReportService.getTopProducts(
        {
          dateFrom: revenueChartDateRange.dateFrom,
          dateTo: revenueChartDateRange.dateTo,
        },
        productFilter,
        5 // Limit to 5 products
      );
    },
    enabled: !!user && !!revenueChartDateRange.dateFrom && !!revenueChartDateRange.dateTo,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });


  // Fetch revenue data for chart
  const { data: revenueChartData, isLoading: isLoadingRevenueChart } = useQuery({
    queryKey: ['revenueChartData', revenuePeriod, revenueChartDateRange.dateFrom, revenueChartDateRange.dateTo],
    queryFn: () => salesTransactionService.getRevenueByDate(
      revenueChartDateRange.dateFrom,
      revenueChartDateRange.dateTo
    ),
    enabled: !!user,
    retry: 1,
    retryDelay: 2000
  });

  // Process revenue data for chart
  const chartData = useMemo(() => {
    if (!revenueChartData || revenueChartData.length === 0) {
      // Return empty chart data
      return {
        labels: [],
    datasets: [
      {
            label: 'Revenue',
            data: [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
    ],
  };
    }

    // Generate all dates in the range
    const startDate = new Date(revenueChartDateRange.dateFrom);
    const endDate = new Date(revenueChartDateRange.dateTo);
    const allDates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create a map of revenue by date
    const revenueMap = new Map<string, number>();
    revenueChartData.forEach((point) => {
      revenueMap.set(point.date, point.revenue);
    });

    // Generate labels and data arrays
    const labels = allDates.map((date) => {
      const d = new Date(date);
      if (revenuePeriod === 'weekly') {
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    });

    const data = allDates.map((date) => revenueMap.get(date) || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4, // Smooth curve
        },
      ],
    };
  }, [revenueChartData, revenuePeriod, revenueChartDateRange]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => {
            // Format y-axis labels (amount only, no currency symbol)
            if (typeof value === 'number') {
              if (value >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}K`;
              }
              return value.toLocaleString();
            }
            return value;
          },
        },
      },
    },
  }), []);

  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      // Use the default currency symbol from company settings
      return formatCurrency(value, defaultCurrencyCode, defaultCurrencySymbol);
    }
    return value.toString();
  };


  return (
    <div className="space-y-6">

      {/* Statistics Cards */}
      <GridLayout cols={4} gap={6} className="product-grid-animation">
        <StatCard
          title="Revenue"
          value={stats.revenue}
          icon={TrendingUp}
          iconBgColor="#dbeafe"
          iconColor="#3b82f6"
          formatValue={formatValue}
        />
        <StatCard
          title="Receipts"
          value={stats.receiptsTotalValue}
          icon={Receipt}
          iconBgColor="#fed7aa"
          iconColor="#ea580c"
          formatValue={formatValue}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          iconBgColor="#dcfce7"
          iconColor="#16a34a"
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={Users}
          iconBgColor="#f3e8ff"
          iconColor="#7c3aed"
        />
      </GridLayout>

      {/* Charts Section */}
      <GridLayout cols={2} gap={6} className="product-grid-animation">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            {/* Period Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRevenuePeriod('weekly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  revenuePeriod === 'weekly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setRevenuePeriod('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  revenuePeriod === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          {isLoadingRevenueChart ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chartData.labels.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No revenue data available for the selected period
            </div>
          ) : (
          <Line data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {productFilter === 'top' ? 'Top Products' : 'Bottom Products'}
            </h3>
            {/* Product Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProductFilter('top')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  productFilter === 'top'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Top
              </button>
              <button
                onClick={() => setProductFilter('bottom')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  productFilter === 'bottom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bottom
              </button>
            </div>
          </div>
          {isLoadingProducts ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No product data available for the selected period
            </div>
          ) : (
          <div className="space-y-0">
            {/* Table Header */}
            <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
              <div className="font-semibold text-sm text-gray-700">Product Name</div>
              <div className="font-semibold text-sm text-gray-700 text-right">
                Amount ({defaultCurrencySymbol || defaultCurrencyCode})
              </div>
            </div>
            {/* Table Rows */}
            {topProducts.map((product, index) => (
              <div 
                key={product.id || index} 
                className="grid grid-cols-2 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors last:rounded-b-lg last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900 truncate">{product.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </GridLayout>
    </div>
  );
};

export default Dashboard;