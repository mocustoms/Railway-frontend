import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Store, 
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { SalesChart, InventoryChart, StorePerformanceChart } from '../components/charts';
import { chartService } from '../services/chartService';

const Analytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedStore, setSelectedStore] = useState<string>('all');

  // Fetch all chart data
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-trend', selectedPeriod],
    queryFn: () => chartService.getSalesTrend(selectedPeriod),
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-levels'],
    queryFn: () => chartService.getInventoryLevels(),
  });

  const { data: storePerformanceData, isLoading: storePerformanceLoading } = useQuery({
    queryKey: ['store-performance'],
    queryFn: () => chartService.getStorePerformance(),
  });

  const { data: topProductsData, isLoading: topProductsLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => chartService.getTopProducts(10),
  });

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => chartService.getLowStockAlerts(),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-breakdown'],
    queryFn: () => chartService.getRevenueBreakdown(),
  });

  const handleExport = (chartType: string) => {
    // Implement chart export functionality
    // Exporting chart
  };

  const isLoading = salesLoading || inventoryLoading || storePerformanceLoading || 
                   topProductsLoading || lowStockLoading || revenueLoading;

  return (
    <div className="space-y-6">

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Store className="h-4 w-4 text-gray-400" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Stores</option>
              <option value="store1">Store A</option>
              <option value="store2">Store B</option>
              <option value="store3">Store C</option>
            </select>
          </div>

          <button
            onClick={() => handleExport('all')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-150 text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Sales Analytics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Sales Analytics
              </h3>
              <button
                onClick={() => handleExport('sales')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {salesData && (
                <SalesChart
                  data={salesData}
                  title={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Sales Trend`}
                  height={400}
                />
              )}
              {revenueData && (
                <InventoryChart
                  type="doughnut"
                  data={revenueData}
                  title="Revenue Distribution"
                  height={400}
                />
              )}
            </div>
          </div>

          {/* Inventory Analytics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-600" />
                Inventory Analytics
              </h3>
              <button
                onClick={() => handleExport('inventory')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {inventoryData && (
                <InventoryChart
                  type="bar"
                  data={inventoryData}
                  title="Inventory Levels by Category"
                  height={400}
                />
              )}
              {lowStockData && (
                <InventoryChart
                  type="bar"
                  data={lowStockData}
                  title="Low Stock Alerts"
                  height={400}
                />
              )}
            </div>
          </div>

          {/* Store Performance */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Store className="h-5 w-5 mr-2 text-purple-600" />
                Store Performance
              </h3>
              <button
                onClick={() => handleExport('performance')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {storePerformanceData && (
                <StorePerformanceChart
                  type="radar"
                  data={storePerformanceData}
                  title="Store Performance Comparison"
                  height={400}
                />
              )}
              {topProductsData && (
                <InventoryChart
                  type="bar"
                  data={topProductsData}
                  title="Top 10 Products"
                  height={400}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
