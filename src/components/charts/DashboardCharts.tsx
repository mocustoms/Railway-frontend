import React from 'react';
import { useQuery } from '@tanstack/react-query';
import SalesChart from './SalesChart';
import InventoryChart from './InventoryChart';
import StorePerformanceChart from './StorePerformanceChart';
import { chartService } from '../../services/chartService';

const DashboardCharts: React.FC = () => {
  // Fetch sales trend data
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-trend'],
    queryFn: () => chartService.getSalesTrend('monthly'),
  });

  // Fetch inventory levels
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-levels'],
    queryFn: () => chartService.getInventoryLevels(),
  });

  // Fetch low stock alerts
  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => chartService.getLowStockAlerts(),
  });

  // Fetch store performance
  const { data: storePerformanceData, isLoading: storePerformanceLoading } = useQuery({
    queryKey: ['store-performance'],
    queryFn: () => chartService.getStorePerformance(),
  });

  // Fetch top products
  const { data: topProductsData, isLoading: topProductsLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => chartService.getTopProducts(5),
  });

  // Fetch revenue breakdown
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-breakdown'],
    queryFn: () => chartService.getRevenueBreakdown(),
  });

  if (salesLoading || inventoryLoading || lowStockLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row - Sales and Revenue */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {salesData && (
          <SalesChart
            data={salesData}
            title="Monthly Sales Trend"
            height={350}
          />
        )}
        {revenueData && (
          <InventoryChart
            type="doughnut"
            data={revenueData}
            title="Revenue Breakdown"
            height={350}
          />
        )}
      </div>

      {/* Second Row - Inventory and Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {inventoryData && (
          <InventoryChart
            type="bar"
            data={inventoryData}
            title="Inventory Levels by Category"
            height={350}
          />
        )}
        {storePerformanceData && (
          <StorePerformanceChart
            type="radar"
            data={storePerformanceData}
            title="Store Performance Comparison"
            height={350}
          />
        )}
      </div>

      {/* Third Row - Alerts and Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {lowStockData && (
          <InventoryChart
            type="bar"
            data={lowStockData}
            title="Low Stock Alerts"
            height={300}
          />
        )}
        {topProductsData && (
          <InventoryChart
            type="bar"
            data={topProductsData}
            title="Top 5 Products"
            height={300}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;
