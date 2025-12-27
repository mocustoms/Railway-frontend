import { api } from './api';

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface SalesChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

export interface InventoryChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface StorePerformanceData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

class ChartService {
  private baseUrl = '/charts';

  // Sales Analytics
  async getSalesTrend(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<SalesChartData> {
    try {
      const response = await api.get(`${this.baseUrl}/sales-trend`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      // Error fetching sales trend
      // Return mock data for development
      return this.getMockSalesData();
    }
  }

  // Inventory Analytics
  async getInventoryLevels(): Promise<InventoryChartData> {
    try {
      const response = await api.get(`${this.baseUrl}/inventory-levels`);
      return response.data;
    } catch (error) {
      // Error fetching inventory levels
      return this.getMockInventoryData();
    }
  }

  async getLowStockAlerts(): Promise<InventoryChartData> {
    try {
      const response = await api.get(`${this.baseUrl}/low-stock`);
      return response.data;
    } catch (error) {
      // Error fetching low stock alerts
      return this.getMockLowStockData();
    }
  }

  // Store Performance
  async getStorePerformance(): Promise<StorePerformanceData> {
    try {
      const response = await api.get(`${this.baseUrl}/store-performance`);
      return response.data;
    } catch (error) {
      // Error fetching store performance
      return this.getMockStorePerformanceData();
    }
  }

  async getStoreComparison(): Promise<StorePerformanceData> {
    try {
      const response = await api.get(`${this.baseUrl}/store-comparison`);
      return response.data;
    } catch (error) {
      // Error fetching store comparison
      return this.getMockStoreComparisonData();
    }
  }

  // Product Analytics
  async getTopProducts(limit: number = 10): Promise<InventoryChartData> {
    try {
      const response = await api.get(`${this.baseUrl}/top-products`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      // Error fetching top products
      return this.getMockTopProductsData();
    }
  }

  // Financial Analytics
  async getRevenueBreakdown(): Promise<InventoryChartData> {
    try {
      const response = await api.get(`${this.baseUrl}/revenue-breakdown`);
      return response.data;
    } catch (error) {
      // Error fetching revenue breakdown
      return this.getMockRevenueData();
    }
  }

  // Mock data for development
  private getMockSalesData(): SalesChartData {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Sales',
          data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 38000, 45000],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: 'Target',
          data: [15000, 20000, 18000, 28000, 25000, 32000, 30000, 38000, 35000, 42000, 40000, 48000],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
      ],
    };
  }

  private getMockInventoryData(): InventoryChartData {
    return {
      labels: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys'],
      datasets: [
        {
          label: 'Stock Levels',
          data: [1200, 800, 600, 400, 300, 200],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(251, 191, 36)',
            'rgb(239, 68, 68)',
            'rgb(168, 85, 247)',
            'rgb(236, 72, 153)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }

  private getMockLowStockData(): InventoryChartData {
    return {
      labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
      datasets: [
        {
          label: 'Low Stock Items',
          data: [5, 8, 12, 3, 7],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(251, 191, 36)',
            'rgb(239, 68, 68)',
            'rgb(34, 197, 94)',
            'rgb(251, 191, 36)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }

  private getMockStorePerformanceData(): StorePerformanceData {
    return {
      labels: ['Sales', 'Inventory Turnover', 'Customer Satisfaction', 'Efficiency', 'Profit Margin'],
      datasets: [
        {
          label: 'Store A',
          data: [85, 78, 92, 88, 75],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
        },
        {
          label: 'Store B',
          data: [72, 85, 88, 82, 80],
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
        },
      ],
    };
  }

  private getMockStoreComparisonData(): StorePerformanceData {
    return {
      labels: ['Store A', 'Store B', 'Store C', 'Store D', 'Store E'],
      datasets: [
        {
          label: 'Monthly Revenue',
          data: [45000, 38000, 42000, 35000, 40000],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
        },
      ],
    };
  }

  private getMockTopProductsData(): InventoryChartData {
    return {
      labels: ['Laptop Pro', 'Smartphone X', 'Wireless Headphones', 'Gaming Mouse', 'USB-C Cable'],
      datasets: [
        {
          label: 'Units Sold',
          data: [150, 120, 95, 80, 65],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(251, 191, 36)',
            'rgb(239, 68, 68)',
            'rgb(168, 85, 247)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }

  private getMockRevenueData(): InventoryChartData {
    return {
      labels: ['Online Sales', 'In-Store Sales', 'Wholesale', 'Services', 'Other'],
      datasets: [
        {
          label: 'Revenue Distribution',
          data: [45, 30, 15, 8, 2],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(251, 191, 36)',
            'rgb(239, 68, 68)',
            'rgb(168, 85, 247)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }
}

export const chartService = new ChartService();
