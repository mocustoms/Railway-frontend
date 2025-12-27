import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Building,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  ArrowUpDown,
  ArrowLeft,
  Search
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import SearchableMultiSelect from '../components/SearchableMultiSelect';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { storeLocationService } from '../services/storeLocationService';
import { storeService } from '../services/storeService';
import { getProductCategories } from '../services/productCategoryService';
import { getProductBrandNames } from '../services/productBrandNameService';
import productManufacturerService from '../services/productManufacturerService';
import productModelService from '../services/productModelService';
import { productColorService } from '../services/productColorService';
import { storeRequestService } from '../services/storeRequestService';
import { EnhancedStockBalanceChart } from '../components/charts';
import { exportTableToExcel, exportChartToExcel, exportCompleteReportToExcel } from '../utils/excelExporter';
// import { generateStockBalancePDF } from '../utils/pdfGenerator';

interface StockBalanceFilters {
  asOfDate: string;
  storeId: string;
  storeLocationIds: string[];
  categoryIds: string[];
  brandNameIds: string[];
  manufacturerIds: string[];
  modelIds: string[];
  colorIds: string[];
}

interface StockBalanceItem {
  id: string;
  productCode: string;
  productName: string;
  partNumber: string;
  category: string;
  brandName: string;
  manufacturer: string;
  model: string;
  color: string;
  storeName: string;
  storeLocation: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  lastUpdated: string;
}

const StockBalanceAsOfDateReport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<StockBalanceFilters>({
    asOfDate: new Date().toISOString().split('T')[0],
    storeId: '',
    storeLocationIds: [],
    categoryIds: [],
    brandNameIds: [],
    manufacturerIds: [],
    modelIds: [],
    colorIds: []
  });

  const [queryFilters, setQueryFilters] = useState<StockBalanceFilters>(filters);
  const [manualFetchTrigger, setManualFetchTrigger] = useState(0);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [isChartCollapsed, setIsChartCollapsed] = useState(true); // Collapsed by default
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    productCode: true,
    productName: true,
    partNumber: true,
    category: false,
    brandName: false,
    manufacturer: false,
    model: false,
    color: false,
    storeName: false,
    storeLocation: false,
    quantity: true,
    unitCost: true,
    totalValue: true,
    lastUpdated: false
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });

  // Fetch reference data
  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeService.getStores({ limit: 1000 }),
    enabled: !!user
  });

  const { data: storeLocations } = useQuery({
    queryKey: ['store-locations'],
    queryFn: () => storeLocationService.getStoreLocations(1, 1000),
    enabled: !!user
  });

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => getProductCategories({ limit: 1000 })
  });

  const { data: brandNames } = useQuery({
    queryKey: ['product-brand-names'],
    queryFn: () => getProductBrandNames(1, 1000)
  });

  const { data: manufacturers } = useQuery({
    queryKey: ['product-manufacturers'],
    queryFn: () => productManufacturerService.getProductManufacturers({ page: 1, limit: 1000 })
  });

  const { data: models } = useQuery({
    queryKey: ['product-models'],
    queryFn: () => productModelService.getProductModels({ page: 1, limit: 1000 })
  });

  const { data: colors } = useQuery({
    queryKey: ['product-colors'],
    queryFn: () => productColorService.getProductColors(1, 1000)
  });

  // Fetch stock balance data from API
  const { data: stockBalanceData, isLoading, error } = useQuery({
    queryKey: ['stock-balance', queryFilters, manualFetchTrigger],
    queryFn: async () => {
      const response = await storeRequestService.getStockBalance(queryFilters);
      return response.data;
    },
    enabled: manualFetchTrigger > 0, // Only fetch when user clicks "Get Data"
    retry: 1
  });

  const handleFilterChange = (key: keyof StockBalanceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleManualFetch = () => {
    setQueryFilters(filters);
    setManualFetchTrigger(prev => prev + 1);
  };

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!stockBalanceData || !searchTerm.trim()) {
      return stockBalanceData || [];
    }

    const searchLower = searchTerm.toLowerCase();
    return stockBalanceData.filter(item => 
      (item.productCode || '').toLowerCase().includes(searchLower) ||
      (item.productName || '').toLowerCase().includes(searchLower) ||
      (item.partNumber || '').toLowerCase().includes(searchLower) ||
      (item.category || '').toLowerCase().includes(searchLower) ||
      (item.brandName || '').toLowerCase().includes(searchLower) ||
      (item.manufacturer || '').toLowerCase().includes(searchLower) ||
      (item.model || '').toLowerCase().includes(searchLower) ||
      (item.color || '').toLowerCase().includes(searchLower) ||
      (item.storeName || '').toLowerCase().includes(searchLower) ||
      (item.storeLocation || '').toLowerCase().includes(searchLower)
    );
  }, [stockBalanceData, searchTerm]);

  // Process data for pie chart by category
  const chartData = React.useMemo(() => {
    if (!stockBalanceData || stockBalanceData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Stock Balance by Category',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1
        }]
      };
    }

    // Group data by category and sum quantities
    const categoryTotals = stockBalanceData.reduce((acc: { [key: string]: number }, item) => {
      const category = item.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + (item.quantity || 0);
      return acc;
    }, {});

    // Convert to arrays for Chart.js
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Generate colors for each category
    const colors = [
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ];

    const backgroundColor = labels.map((_, index) => colors[index % colors.length]);
    const borderColor = backgroundColor.map(color => color);

    return {
      labels,
      datasets: [{
        label: 'Stock Balance by Category',
        data,
        backgroundColor,
        borderColor,
        borderWidth: 1
      }]
    };
  }, [stockBalanceData]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (format === 'pdf') {
      try {
        // Dynamic import to avoid build issues
        const { generateStockBalancePDF } = await import('../utils/pdfGenerator');
        
        // Pass exactly what the user sees
        const exportData = {
          data: filteredData, // Only visible/filtered data
          filters: queryFilters,
          searchTerm,
          visibleColumns: visibleColumns, // Which columns are shown
          sortConfig: sortConfig, // Current sort order
          reportType: 'historical' as const
        };
        
        const blob = await generateStockBalancePDF(exportData);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-balance-as-of-date-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        // Error exporting PDF
        alert('Failed to export PDF. Please try again.');
      }
    } else if (format === 'excel') {
      try {
        // Prepare table data for Excel export
        const tableHeaders = [
          'Product Code', 'Product Name', 'Part Number', 'Category', 'Brand', 
          'Manufacturer', 'Model', 'Color', 'Location', 'Quantity', 'Unit Cost', 'Total Value'
        ];
        
        const tableExportData = {
          data: filteredData,
          headers: tableHeaders,
          title: 'Stock Balance as of Date Report',
          reportType: 'historical' as const,
          asOfDate: filters.asOfDate,
          filters: queryFilters,
          searchTerm: searchTerm
        };
        
        // Prepare chart data for Excel export
        const chartExportData = {
          chartData: chartData,
          title: 'Stock Balance by Category',
          reportType: 'historical' as const,
          asOfDate: filters.asOfDate
        };
        
        // Export complete report with both table and chart data
        const result = exportCompleteReportToExcel(tableExportData, chartExportData);
        
        if (result.success) {
          // Excel export successful
        } else {
          // Excel export failed
          alert('Failed to export Excel. Please try again.');
        }
      } catch (error) {
        // Error exporting Excel
        alert('Failed to export Excel. Please try again.');
      }
    }
  };

  // const formatCurrency = (amount: number) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD'
  //   }).format(amount);
  // };

  const formatNumber = (num: number) => {
    if (isNaN(num) || num === null || num === undefined) {
      return '0';
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Helper function to format display values
  const formatDisplayValue = (value: any) => {
    if (value === null || value === undefined || value === '' || value === 'N/A') {
      return '--';
    }
    return value;
  };

  // Helper function to format currency values safely (without dollar sign)
  const formatCurrencySafe = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Sorting functions
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          key,
          direction: 'asc'
        };
      }
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  const sortData = (data: any[]) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key!];
      let bValue = b[sortConfig.key!];

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('more-columns-dropdown');
      const button = document.querySelector('button[onclick*="more-columns-dropdown"]');
      
      if (dropdown && button && !dropdown.contains(event.target as Node) && !button.contains(event.target as Node)) {
        dropdown.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Reports
        </button>
      </div>

      {/* Report Parameters */}
      <Card className="p-6">
        {/* Collapsible Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Report Parameters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-sm">
              {isFiltersCollapsed ? 'Show Filters' : 'Hide Filters'}
            </span>
            {isFiltersCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Collapsible Content */}
        {!isFiltersCollapsed && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* As of Date */}
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4 mr-2" />
              As of Date
            </label>
            <Input
              type="date"
              value={filters.asOfDate}
              onChange={(e) => handleFilterChange('asOfDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Store */}
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Building className="h-4 w-4 mr-2" />
              Store
            </label>
            <Select
              value={filters.storeId}
              onChange={(e) => handleFilterChange('storeId', e.target.value)}
            >
              <option value="">All Stores</option>
              {stores?.data?.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Store Locations */}
          <div className="space-y-1">
            <SearchableMultiSelect
              label="Store Locations"
              options={storeLocations?.data?.map(location => ({
                id: location.id,
                name: location.location_name
              })) || []}
              value={filters.storeLocationIds}
              onChange={(value) => handleFilterChange('storeLocationIds', value)}
              placeholder={filters.storeLocationIds.length === 0 ? "All Store Locations" : "Select Store Locations"}
            />
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <SearchableMultiSelect
              label="Categories"
              options={categories?.productCategories?.map(category => ({
                id: category.id,
                name: category.name
              })) || []}
              value={filters.categoryIds}
              onChange={(value) => handleFilterChange('categoryIds', value)}
              placeholder={filters.categoryIds.length === 0 ? "All Categories" : "Select Categories"}
            />
          </div>

          {/* Brand Names */}
          <div className="space-y-1">
            <SearchableMultiSelect
              label="Brand Names"
              options={brandNames?.data?.map(brand => ({
                id: brand.id,
                name: brand.name
              })) || []}
              value={filters.brandNameIds}
              onChange={(value) => handleFilterChange('brandNameIds', value)}
              placeholder={filters.brandNameIds.length === 0 ? "All Brand Names" : "Select Brand Names"}
            />
          </div>

          {/* Manufacturers */}
          <div className="space-y-1">
            <SearchableMultiSelect
              label="Manufacturers"
              options={manufacturers?.data?.map(manufacturer => ({
                id: manufacturer.id,
                name: manufacturer.name
              })) || []}
              value={filters.manufacturerIds}
              onChange={(value) => handleFilterChange('manufacturerIds', value)}
              placeholder={filters.manufacturerIds.length === 0 ? "All Manufacturers" : "Select Manufacturers"}
            />
          </div>

          {/* Models */}
          <div className="space-y-1">
            <SearchableMultiSelect
              label="Models"
              options={models?.productModels?.map(model => ({
                id: model.id,
                name: model.name
              })) || []}
              value={filters.modelIds}
              onChange={(value) => handleFilterChange('modelIds', value)}
              placeholder={filters.modelIds.length === 0 ? "All Models" : "Select Models"}
            />
          </div>

          {/* Colors */}
          <div className="space-y-1">
            <SearchableMultiSelect
              label="Colors"
              options={colors?.productColors?.map(color => ({
                id: color.id,
                name: color.name
              })) || []}
              value={filters.colorIds}
              onChange={(value) => handleFilterChange('colorIds', value)}
              placeholder={filters.colorIds.length === 0 ? "All Colors" : "Select Colors"}
            />
          </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={handleManualFetch}
                className="flex items-center space-x-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Get Data</span>
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg font-medium mb-2">
              Error Loading Data
            </div>
            <div className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'An error occurred while fetching stock balance data.'}
            </div>
            <Button
              onClick={handleManualFetch}
              className="flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {stockBalanceData && stockBalanceData.length > 0 && (
        <Card title={`Stock Balance as at ${filters.asOfDate ? new Date(filters.asOfDate).toLocaleDateString() : 'Date'}`} className="p-6">
          {/* Total Products Count */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                Total Products: {stockBalanceData.length}
              </span>
            </div>
          </div>

          {/* Stock Balance Chart - Collapsible */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Stock Balance Chart</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChartCollapsed(!isChartCollapsed)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <span className="text-sm">
                  {isChartCollapsed ? 'Show Chart' : 'Hide Chart'}
                </span>
                {isChartCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Collapsible Chart Content */}
            {!isChartCollapsed && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                <EnhancedStockBalanceChart 
                  data={chartData}
                  title="Stock Balance by Category"
                  height={300}
                  reportType="historical"
                  asOfDate={filters.asOfDate}
                />
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Category Summary</h4>
                  <div className="space-y-1">
                    {chartData.labels.map((label, index) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }}
                          ></div>
                          <span className="text-sm text-gray-700">{label}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {chartData.datasets[0].data[index].toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Products */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search products by name, code, category, brand, manufacturer, model, color, store, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {filteredData.length} of {stockBalanceData.length} products
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {/* More Columns Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    const dropdown = document.getElementById('more-columns-dropdown');
                    if (dropdown) {
                      dropdown.classList.toggle('hidden');
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <MoreHorizontal size={16} className="mr-1" />
                  More Columns
                </button>
                
                {/* Dropdown Menu */}
                <div
                  id="more-columns-dropdown"
                  className="hidden absolute w-64 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] transition-all duration-200"
                  style={{
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    maxHeight: '300px'
                  }}
                >
                  <div className="py-2">
                    {/* Toggle All Button */}
                    <button
                      onClick={() => {
                        const allVisible = Object.values(visibleColumns).every(v => v);
                        const newState = Object.keys(visibleColumns).reduce((acc, key) => ({
                          ...acc,
                          [key]: !allVisible
                        }), {} as typeof visibleColumns);
                        setVisibleColumns(newState);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                    >
                      {Object.values(visibleColumns).every(v => v) ? 'Hide All Optional' : 'Show All'}
                    </button>
                    
                    {/* Scrollable Column List */}
                    <div className="max-h-64 overflow-y-auto">
                      {Object.entries(visibleColumns).map(([key, visible]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setVisibleColumns(prev => ({
                              ...prev,
                              [key]: !prev[key as keyof typeof prev]
                            }));
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between text-gray-700"
                        >
                          <span className="truncate capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {visible ? (
                              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                            ) : (
                              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('excel')}
                disabled={!stockBalanceData || stockBalanceData.length === 0}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={!stockBalanceData || stockBalanceData.length === 0}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <FileText size={16} className="mr-2" />
                Export PDF
              </button>
            </div>
          </div>

          <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10 border-b-2 border-blue-200">
                <tr>
                  {visibleColumns.productCode && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('productCode')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Product Code</span>
                        {getSortIcon('productCode')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.productName && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-48"
                      onClick={() => handleSort('productName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Product Name</span>
                        {getSortIcon('productName')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.partNumber && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-36"
                      onClick={() => handleSort('partNumber')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Part Number</span>
                        {getSortIcon('partNumber')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.category && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Category</span>
                        {getSortIcon('category')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.brandName && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('brandName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Brand</span>
                        {getSortIcon('brandName')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.manufacturer && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('manufacturer')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Manufacturer</span>
                        {getSortIcon('manufacturer')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.model && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('model')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Model</span>
                        {getSortIcon('model')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.color && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-28"
                      onClick={() => handleSort('color')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Color</span>
                        {getSortIcon('color')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.storeName && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('storeName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Store</span>
                        {getSortIcon('storeName')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.storeLocation && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('storeLocation')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Location</span>
                        {getSortIcon('storeLocation')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.quantity && (
                    <th 
                      className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Quantity</span>
                        {getSortIcon('quantity')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.unitCost && (
                    <th 
                      className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                      onClick={() => handleSort('unitCost')}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Unit Cost</span>
                        {getSortIcon('unitCost')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.totalValue && (
                    <th 
                      className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                      onClick={() => handleSort('totalValue')}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Total Value</span>
                        {getSortIcon('totalValue')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.lastUpdated && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('lastUpdated')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Last Updated</span>
                        {getSortIcon('lastUpdated')}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortData(filteredData).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {visibleColumns.productCode && (
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 w-32">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.productCode)}>
                          {formatDisplayValue(item.productCode)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.productName && (
                      <td className="px-4 py-4 text-sm text-gray-900 w-48">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.productName)}>
                          {formatDisplayValue(item.productName)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.partNumber && (
                      <td className="px-4 py-4 text-sm text-gray-900 w-36">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.partNumber)}>
                          {formatDisplayValue(item.partNumber)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.category && (
                      <td className="px-4 py-4 text-sm text-gray-900 w-32">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.category)}>
                          {formatDisplayValue(item.category)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.brandName && (
                      <td className="px-4 py-4 text-sm text-gray-900 w-32">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.brandName)}>
                          {formatDisplayValue(item.brandName)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.manufacturer && (
                      <td className="px-4 py-4 text-sm text-gray-900 w-32">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.manufacturer)}>
                          {formatDisplayValue(item.manufacturer)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.model && (
                      <td className="px-4 py-4 text-sm text-gray-900 w-32">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.model)}>
                          {formatDisplayValue(item.model)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.color && (
                      <td className="px-4 py-4 text-sm text-gray-900 w-28">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.color)}>
                          {formatDisplayValue(item.color)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.storeName && (
                      <td className="px-4 py-4 text-sm text-gray-900 w-32">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.storeName)}>
                          {formatDisplayValue(item.storeName)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.storeLocation && (
                      <td className="px-4 py-4 text-sm text-gray-900 w-32">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.storeLocation)}>
                          {formatDisplayValue(item.storeLocation)}
                        </div>
                      </td>
                    )}
                    {visibleColumns.quantity && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatNumber(item.quantity)}
                      </td>
                    )}
                    {visibleColumns.unitCost && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrencySafe(item.unitCost)}
                      </td>
                    )}
                    {visibleColumns.totalValue && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrencySafe(item.totalValue)}
                      </td>
                    )}
                    {visibleColumns.lastUpdated && (
                      <td className="px-4 py-4 text-sm text-gray-500 w-32">
                        <div className="break-words leading-tight" title={formatDisplayValue(item.lastUpdated)}>
                          {formatDisplayValue(item.lastUpdated)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              
              {/* Summary Totals Row */}
              {stockBalanceData && stockBalanceData.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-300 sticky bottom-0 z-10">
                  <tr>
                    {visibleColumns.productCode && (
                      <td className="px-6 py-3 text-base font-bold text-gray-900">
                        <strong>Total</strong>
                      </td>
                    )}
                    {visibleColumns.productName && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for product name */}
                      </td>
                    )}
                    {visibleColumns.partNumber && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for part number */}
                      </td>
                    )}
                    {visibleColumns.category && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for category */}
                      </td>
                    )}
                    {visibleColumns.brandName && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for brand name */}
                      </td>
                    )}
                    {visibleColumns.manufacturer && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for manufacturer */}
                      </td>
                    )}
                    {visibleColumns.model && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for model */}
                      </td>
                    )}
                    {visibleColumns.color && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for color */}
                      </td>
                    )}
                    {visibleColumns.storeName && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for store name */}
                      </td>
                    )}
                    {visibleColumns.storeLocation && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for store location */}
                      </td>
                    )}
                    {visibleColumns.quantity && (
                      <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                        <strong>{formatNumber(filteredData.reduce((sum, item) => sum + (item.quantity || 0), 0))}</strong>
                      </td>
                    )}
                    {visibleColumns.unitCost && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                        {/* Empty cell for unit cost */}
                      </td>
                    )}
                    {visibleColumns.totalValue && (
                      <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                        <strong>{formatCurrencySafe(filteredData.reduce((sum, item) => sum + (item.totalValue || 0), 0))}</strong>
                      </td>
                    )}
                    {visibleColumns.lastUpdated && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for last updated */}
                      </td>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading stock balance data...</span>
            </div>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {queryFilters && !isLoading && (!stockBalanceData || stockBalanceData.length === 0) && (
        <Card className="p-6">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-500">
              No stock balance data found for the selected criteria. Try adjusting your filters.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StockBalanceAsOfDateReport;
