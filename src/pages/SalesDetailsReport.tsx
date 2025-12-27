import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  ArrowUpDown,
  ArrowLeft,
  Search,
  Calendar,
  Building,
  Users,
  User,
  Tag,
  DollarSign,
  Package
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { storeService } from '../services/storeService';
import customerService from '../services/customerService';
import { salesAgentService } from '../services/salesAgentService';
import { getProductCategories } from '../services/productCategoryService';
import { getProductBrandNames } from '../services/productBrandNameService';
import productManufacturerService from '../services/productManufacturerService';
import productModelService from '../services/productModelService';
import { productColorService } from '../services/productColorService';
import { priceCategoryService } from '../services/priceCategoryService';
import { productCatalogService } from '../services/productCatalogService';
import { 
  salesDetailsReportService, 
  SalesDetailsReportFilters, 
  SalesDetailsReportItem 
} from '../services/salesDetailsReportService';
import { exportTableToExcel, ExcelExportData } from '../utils/excelExporter';
import { apiService } from '../services/api';
import { Company } from '../types';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface SalesDetailsFilters {
  dateFrom: string;
  dateTo: string;
  storeId: string;
  customerId: string;
  salesAgentId: string;
  productId: string;
  productType: string;
  productCategoryId: string;
  brandNameId: string;
  manufacturerId: string;
  modelId: string;
  colorId: string;
  priceCategoryId: string;
}

const SalesDetailsReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SalesDetailsFilters>({
    dateFrom: '',
    dateTo: '',
    storeId: '',
    customerId: '',
    salesAgentId: '',
    productId: '',
    productType: '',
    productCategoryId: '',
    brandNameId: '',
    manufacturerId: '',
    modelId: '',
    colorId: '',
    priceCategoryId: ''
  });

  const [queryFilters, setQueryFilters] = useState<SalesDetailsReportFilters>({});
  const [manualFetchTrigger, setManualFetchTrigger] = useState(0);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [isChartCollapsed, setIsChartCollapsed] = useState(true);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Column label mappings
  const columnLabels: Record<string, string> = {
    productCode: 'Product Code',
    productBarcode: 'Barcode',
    productPartNumber: 'Part Number',
    productDescription: 'Description',
    productCategoryName: 'Category',
    quantitySold: 'Quantity Sold',
    taxAmount: 'Tax',
    whtAmount: 'WHT Tax',
    discountAmount: 'Discount',
    unitPrice: 'Price',
    lineTotal: 'Totals',
    transactionRefNumber: 'Ref Number',
    transactionType: 'Type',
    storeName: 'Store',
    customerName: 'Customer',
    salesAgentName: 'Sales Agent',
    brandName: 'Brand',
    manufacturerName: 'Manufacturer',
    modelName: 'Model',
    colorName: 'Color',
    status: 'Status',
    currencyName: 'Currency',
    notes: 'Notes'
  };

  // Required columns (always visible, cannot be hidden)
  const requiredColumns = ['productCode', 'productBarcode', 'productPartNumber', 'productDescription', 'productCategoryName', 'quantitySold', 'taxAmount', 'whtAmount', 'discountAmount', 'unitPrice', 'lineTotal'];
  
  // Optional columns (can be toggled)
  const optionalColumns = ['transactionRefNumber', 'transactionType', 'storeName', 'customerName', 'salesAgentName', 'brandName', 'manufacturerName', 'modelName', 'colorName', 'status', 'currencyName', 'notes'];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isColumnsDropdownOpen && !target.closest('.columns-dropdown-container')) {
        setIsColumnsDropdownOpen(false);
      }
    };

    if (isColumnsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isColumnsDropdownOpen]);
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    productCode: true,
    productBarcode: true,
    productPartNumber: true,
    productDescription: true,
    productCategoryName: true,
    quantitySold: true, // Cumulative quantity per product
    taxAmount: true,
    whtAmount: true, // WHT Tax column
    discountAmount: true,
    unitPrice: true,
    lineTotal: true,
    // Optional columns
    transactionRefNumber: false,
    transactionType: false,
    storeName: false,
    customerName: false,
    salesAgentName: false,
    brandName: false,
    manufacturerName: false,
    modelName: false,
    colorName: false,
    status: false,
    currencyName: false,
    notes: false
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

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers({ limit: 1000 }),
    enabled: !!user
  });

  const { data: salesAgents } = useQuery({
    queryKey: ['sales-agents'],
    queryFn: () => salesAgentService.getSalesAgents(1, 1000, { search: '', status: 'all' }, { key: 'created_at', direction: 'desc' }),
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

  const { data: priceCategories } = useQuery({
    queryKey: ['price-categories'],
    queryFn: () => priceCategoryService.getPriceCategories({ page: 1, limit: 1000 })
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productCatalogService.getProducts(1, 1000, { search: '', status: 'all' }, { column: 'created_at', direction: 'desc' }),
    enabled: !!user
  });

  // Fetch sales details report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['sales-details-report', queryFilters, manualFetchTrigger],
    queryFn: () => salesDetailsReportService.getSalesDetailsReport(queryFilters),
    enabled: manualFetchTrigger > 0 && !!user
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['sales-details-report-stats', queryFilters],
    queryFn: () => salesDetailsReportService.getSalesDetailsReportStats(queryFilters),
    enabled: manualFetchTrigger > 0 && !!user
  });

  const lineItems = reportData?.data || [];
  const stats = statsData?.stats;

  // Handle filter changes
  const handleFilterChange = (key: keyof SalesDetailsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle get data button click
  const handleGetData = () => {
    const filtersToSend: SalesDetailsReportFilters = {};
    
    if (filters.dateFrom) filtersToSend.dateFrom = filters.dateFrom;
    if (filters.dateTo) filtersToSend.dateTo = filters.dateTo;
    if (filters.storeId && filters.storeId !== 'all') filtersToSend.storeId = filters.storeId;
    if (filters.customerId && filters.customerId !== 'all') filtersToSend.customerId = filters.customerId;
    if (filters.salesAgentId && filters.salesAgentId !== 'all') filtersToSend.salesAgentId = filters.salesAgentId;
    if (filters.productId && filters.productId !== 'all') filtersToSend.productId = filters.productId;
    if (filters.productType && filters.productType !== 'all') filtersToSend.productType = filters.productType;
    if (filters.productCategoryId && filters.productCategoryId !== 'all') filtersToSend.productCategoryId = filters.productCategoryId;
    if (filters.brandNameId && filters.brandNameId !== 'all') filtersToSend.brandNameId = filters.brandNameId;
    if (filters.manufacturerId && filters.manufacturerId !== 'all') filtersToSend.manufacturerId = filters.manufacturerId;
    if (filters.modelId && filters.modelId !== 'all') filtersToSend.modelId = filters.modelId;
    if (filters.colorId && filters.colorId !== 'all') filtersToSend.colorId = filters.colorId;
    if (filters.priceCategoryId && filters.priceCategoryId !== 'all') filtersToSend.priceCategoryId = filters.priceCategoryId;

    setQueryFilters(filtersToSend);
    setManualFetchTrigger(prev => prev + 1);
  };

  // Items are already merged by product in the backend, so cumulativeQuantity is just the quantity
  const itemsWithCumulativeQuantity = React.useMemo(() => {
    return lineItems.map(item => ({
      ...item,
      cumulativeQuantity: item.quantity || 0
    }));
  }, [lineItems]);

  // Filter line items by search term
  const filteredLineItems = React.useMemo(() => {
    if (!searchTerm) return itemsWithCumulativeQuantity;
    
    const searchLower = searchTerm.toLowerCase();
    return itemsWithCumulativeQuantity.filter(item =>
      item.transactionRefNumber?.toLowerCase().includes(searchLower) ||
      item.productName?.toLowerCase().includes(searchLower) ||
      item.productCode?.toLowerCase().includes(searchLower) ||
      item.productBarcode?.toLowerCase().includes(searchLower) ||
      item.productPartNumber?.toLowerCase().includes(searchLower) ||
      item.productDescription?.toLowerCase().includes(searchLower) ||
      item.customerName?.toLowerCase().includes(searchLower) ||
      item.storeName?.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower)
    );
  }, [itemsWithCumulativeQuantity, searchTerm]);

  // Sort line items
  const sortedLineItems = React.useMemo(() => {
    if (!sortConfig.key) return filteredLineItems;
    
    return [...filteredLineItems].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof SalesDetailsReportItem];
      const bValue = b[sortConfig.key as keyof SalesDetailsReportItem];
      
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredLineItems, sortConfig]);

  // Handle column sort
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // Calculate totals
  const totals = React.useMemo(() => {
    return sortedLineItems.reduce((acc, item) => ({
      quantity: acc.quantity + (item.quantity || 0),
      discountAmount: acc.discountAmount + (item.discountAmount || 0),
      taxAmount: acc.taxAmount + (item.taxAmount || 0),
      whtAmount: acc.whtAmount + (item.whtAmount || 0),
      lineTotal: acc.lineTotal + (item.lineTotal || 0)
    }), {
      quantity: 0,
      discountAmount: 0,
      taxAmount: 0,
      whtAmount: 0,
      lineTotal: 0
    });
  }, [sortedLineItems]);

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

  const defaultCurrencySymbol = companyData?.defaultCurrency?.symbol || '$';

  // Format number with comma separators (no currency symbol) for column cells
  const formatNumberWithCommas = (amount: number | null | undefined, decimals: number = 2): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return decimals === 2 ? '0.00' : '0.000';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  };

  // Format currency with comma separators and currency symbol for totals
  const formatCurrencySafe = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return `${defaultCurrencySymbol}0.00`;
    }
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${defaultCurrencySymbol}${formattedNumber}`;
  };

  // Prepare chart data for product category distribution
  const chartData = React.useMemo(() => {
    if (!lineItems || lineItems.length === 0) {
      return null;
    }

    // Group by product category and sum line totals
    const categoryMap = new Map<string, number>();
    
    lineItems.forEach(item => {
      const categoryName = item.productCategoryName || 'Uncategorized';
      const currentTotal = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, currentTotal + (item.lineTotal || 0));
    });

    // Convert to array and sort by value (descending)
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    if (categoryData.length === 0) {
      return null;
    }

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
      '#14b8a6', '#f43f5e', '#a855f7', '#22c55e', '#eab308'
    ];

    return {
      labels: categoryData.map(item => item.name),
      datasets: [{
        label: 'Sales by Category',
        data: categoryData.map(item => item.total),
        backgroundColor: colors.slice(0, categoryData.length),
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    };
  }, [lineItems]);

  // Prepare chart summary data
  const chartSummary = React.useMemo(() => {
    if (!lineItems || lineItems.length === 0) {
      return [];
    }

    const categoryMap = new Map<string, number>();
    
    lineItems.forEach(item => {
      const categoryName = item.productCategoryName || 'Uncategorized';
      const currentTotal = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, currentTotal + (item.lineTotal || 0));
    });

    return Array.from(categoryMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [lineItems]);

  // Export to Excel
  const handleExportExcel = () => {
    if (sortedLineItems.length === 0) return;
    
    const tableData: ExcelExportData = {
      data: sortedLineItems,
      headers: Object.keys(sortedLineItems[0] || {}),
      title: 'Sales Details Report',
      reportType: 'current',
      filters,
      searchTerm
    };
    
    exportTableToExcel(tableData);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (sortedLineItems.length === 0) return;
    alert('PDF export for Sales Details Report is not yet implemented.');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => navigate('/reports/sales')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Sales Reports
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
              {/* Date From */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date From
                </label>
                <Input
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date To
                </label>
                <Input
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
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
                  <option value="all">All Stores</option>
                  {stores?.data?.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Customer */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4 mr-2" />
                  Customer
                </label>
                <Select
                  value={filters.customerId}
                  onChange={(e) => handleFilterChange('customerId', e.target.value)}
                >
                  <option value="all">All Customers</option>
                  {customers?.data?.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Sales Agent */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 mr-2" />
                  Sales Agent
                </label>
                <Select
                  value={filters.salesAgentId}
                  onChange={(e) => handleFilterChange('salesAgentId', e.target.value)}
                >
                  <option value="all">All Sales Agents</option>
                  {salesAgents?.data?.map((agent: any) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fullName}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Product */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Package className="h-4 w-4 mr-2" />
                  Product
                </label>
                <Select
                  value={filters.productId}
                  onChange={(e) => handleFilterChange('productId', e.target.value)}
                >
                  <option value="all">All Products</option>
                  {products?.products?.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.code} - {product.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Product Type */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4 mr-2" />
                  Product Type
                </label>
                <Select
                  value={filters.productType}
                  onChange={(e) => handleFilterChange('productType', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="resale">Resale</option>
                  <option value="raw_materials">Raw Materials</option>
                  <option value="manufactured">Manufactured</option>
                  <option value="services">Services</option>
                  <option value="pharmaceuticals">Pharmaceuticals</option>
                </Select>
              </div>

              {/* Product Category */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4 mr-2" />
                  Product Category
                </label>
                <Select
                  value={filters.productCategoryId}
                  onChange={(e) => handleFilterChange('productCategoryId', e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories?.productCategories?.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Brand Name */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4 mr-2" />
                  Brand Name
                </label>
                <Select
                  value={filters.brandNameId}
                  onChange={(e) => handleFilterChange('brandNameId', e.target.value)}
                >
                  <option value="all">All Brands</option>
                  {brandNames?.data?.map((brand: any) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Manufacturer */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4 mr-2" />
                  Manufacturer
                </label>
                <Select
                  value={filters.manufacturerId}
                  onChange={(e) => handleFilterChange('manufacturerId', e.target.value)}
                >
                  <option value="all">All Manufacturers</option>
                  {manufacturers?.data?.map((manufacturer: any) => (
                    <option key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Model */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4 mr-2" />
                  Model
                </label>
                <Select
                  value={filters.modelId}
                  onChange={(e) => handleFilterChange('modelId', e.target.value)}
                >
                  <option value="all">All Models</option>
                  {models?.productModels?.map((model: any) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4 mr-2" />
                  Color
                </label>
                <Select
                  value={filters.colorId}
                  onChange={(e) => handleFilterChange('colorId', e.target.value)}
                >
                  <option value="all">All Colors</option>
                  {colors?.productColors?.map((color: any) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Price Category */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4 mr-2" />
                  Price Category
                </label>
                <Select
                  value={filters.priceCategoryId}
                  onChange={(e) => handleFilterChange('priceCategoryId', e.target.value)}
                >
                  <option value="all">All Price Categories</option>
                  {priceCategories?.priceCategories?.map((priceCat: any) => (
                    <option key={priceCat.id} value={priceCat.id}>
                      {priceCat.name}
                    </option>
                  ))}
                </Select>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={handleGetData}
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
              {error instanceof Error ? error.message : 'An error occurred while fetching sales details data.'}
            </div>
            <Button
              onClick={handleGetData}
              className="flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {lineItems && lineItems.length > 0 && (
        <>
          {/* Chart Section */}
          {chartData && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Category Distribution</h3>
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

              {!isChartCollapsed && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center">
                    <div className="w-full max-w-md">
                      <Pie 
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              position: 'right' as const,
                            },
                            tooltip: {
                              callbacks: {
                                label: (context: any) => {
                                  const label = context.label || '';
                                  const value = context.parsed || 0;
                                  return `${label}: ${formatCurrencySafe(value)}`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Category Summary</h4>
                    <div className="space-y-2">
                      {chartSummary.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: chartData?.datasets[0].backgroundColor[index] || '#3b82f6' }}
                            />
                            <span className="text-sm text-gray-700">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{formatCurrencySafe(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Results Table */}
          <Card title="Sales Details Report Results" className="p-6">
            {/* Total Line Items Count */}
            <div className="mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold text-gray-900">
                    Total Product Transactions: {lineItems.length}
                  </span>
                </div>
                {stats && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Total Quantity: {formatNumberWithCommas(stats.totalQuantity, 0)}</span>
                    <span>Total Value: {formatCurrencySafe(stats.totalLineTotal)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search Line Items */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search by transaction number, product name/code, customer, store, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <div className="mt-2 text-sm text-gray-600">
                  Showing {filteredLineItems.length} of {lineItems.length} product transactions
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {/* More Columns Dropdown */}
                <div className="relative columns-dropdown-container">
                  <button
                    onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <MoreHorizontal size={16} className="mr-1" />
                    More Columns
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isColumnsDropdownOpen && (
                    <div className="absolute w-72 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] mt-2">
                      <div className="py-2">
                        {/* Header */}
                        <div className="px-4 py-2 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900">Column Visibility</h4>
                          <p className="text-xs text-gray-500 mt-1">Toggle columns to show or hide</p>
                        </div>

                        {/* Toggle All Optional Button */}
                        <button
                          onClick={() => {
                            const allOptionalVisible = optionalColumns.every(key => visibleColumns[key as keyof typeof visibleColumns]);
                            const newState = { ...visibleColumns };
                            optionalColumns.forEach(key => {
                              newState[key as keyof typeof visibleColumns] = !allOptionalVisible;
                            });
                            setVisibleColumns(newState);
                          }}
                          className="w-full px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 border-b border-gray-200"
                        >
                          {optionalColumns.every(key => visibleColumns[key as keyof typeof visibleColumns]) 
                            ? 'Hide All Optional' 
                            : 'Show All Optional'}
                        </button>
                        
                        {/* Required Columns Section */}
                        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Required Columns</p>
                          <div className="space-y-1">
                            {requiredColumns.map((key) => (
                              <div
                                key={key}
                                className="flex items-center justify-between py-1.5 px-2 rounded text-sm text-gray-600"
                              >
                                <span>{columnLabels[key] || key}</span>
                                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Optional Columns Section */}
                        <div className="px-4 py-2">
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Optional Columns</p>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {optionalColumns.map((key) => {
                              const visible = visibleColumns[key as keyof typeof visibleColumns];
                              return (
                                <button
                                  key={key}
                                  onClick={() => {
                                    setVisibleColumns(prev => ({
                                      ...prev,
                                      [key]: !prev[key as keyof typeof prev]
                                    }));
                                  }}
                                  className="w-full flex items-center justify-between py-1.5 px-2 rounded text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <span>{columnLabels[key] || key}</span>
                                  <div className="flex items-center space-x-2">
                                    {visible ? (
                                      <div className="w-4 h-4 bg-green-600 rounded border-2 border-green-600 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    ) : (
                                      <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportExcel}
                  disabled={!lineItems || lineItems.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <FileSpreadsheet size={16} className="mr-2" />
                  Export Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={!lineItems || lineItems.length === 0}
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
                    {visibleColumns.transactionRefNumber && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('transactionRefNumber')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Ref Number</span>
                          {getSortIcon('transactionRefNumber')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.transactionType && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('transactionType')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Type</span>
                          {getSortIcon('transactionType')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.storeName && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('storeName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Store</span>
                          {getSortIcon('storeName')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.customerName && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('customerName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Customer</span>
                          {getSortIcon('customerName')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.salesAgentName && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('salesAgentName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Sales Agent</span>
                          {getSortIcon('salesAgentName')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.productCode && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('productCode')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Product Code</span>
                          {getSortIcon('productCode')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.productBarcode && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('productBarcode')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Barcode</span>
                          {getSortIcon('productBarcode')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.productPartNumber && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('productPartNumber')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Part Number</span>
                          {getSortIcon('productPartNumber')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.productDescription && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('productDescription')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Description</span>
                          {getSortIcon('productDescription')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.productCategoryName && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('productCategoryName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Category</span>
                          {getSortIcon('productCategoryName')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.quantitySold && (
                      <th
                        className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('cumulativeQuantity')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Quantity Sold</span>
                          {getSortIcon('cumulativeQuantity')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.taxAmount && (
                      <th
                        className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('taxAmount')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Tax</span>
                          {getSortIcon('taxAmount')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.whtAmount && (
                      <th
                        className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('whtAmount')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>WHT Tax</span>
                          {getSortIcon('whtAmount')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.discountAmount && (
                      <th
                        className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('discountAmount')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Discount</span>
                          {getSortIcon('discountAmount')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.unitPrice && (
                      <th
                        className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('unitPrice')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Price</span>
                          {getSortIcon('unitPrice')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.lineTotal && (
                      <th
                        className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('lineTotal')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Totals</span>
                          {getSortIcon('lineTotal')}
                        </div>
                      </th>
                    )}
                    {/* Optional columns */}
                    {visibleColumns.brandName && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('brandName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Brand</span>
                          {getSortIcon('brandName')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.manufacturerName && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('manufacturerName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Manufacturer</span>
                          {getSortIcon('manufacturerName')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.modelName && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('modelName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Model</span>
                          {getSortIcon('modelName')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.colorName && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('colorName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Color</span>
                          {getSortIcon('colorName')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.status && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.currencyName && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Currency
                      </th>
                    )}
                    {visibleColumns.notes && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                        Notes
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedLineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.transactionRefNumber && (
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {item.transactionRefNumber || '--'}
                        </td>
                      )}
                      {visibleColumns.transactionType && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.transactionType === 'invoice' ? 'bg-blue-100 text-blue-800' :
                            item.transactionType === 'order' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.transactionType || '--'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.storeName && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.storeName || '--'}
                        </td>
                      )}
                      {visibleColumns.customerName && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.customerName || '--'}
                        </td>
                      )}
                      {visibleColumns.salesAgentName && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.salesAgentName || '--'}
                        </td>
                      )}
                      {visibleColumns.productCode && (
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {item.productCode || '--'}
                        </td>
                      )}
                      {visibleColumns.productBarcode && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.productBarcode || ''}
                        </td>
                      )}
                      {visibleColumns.productPartNumber && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.productPartNumber || ''}
                        </td>
                      )}
                      {visibleColumns.productDescription && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.productDescription || ''}
                        </td>
                      )}
                      {visibleColumns.productCategoryName && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.productCategoryName || '--'}
                        </td>
                      )}
                      {visibleColumns.brandName && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.brandName || '--'}
                        </td>
                      )}
                      {visibleColumns.manufacturerName && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.manufacturerName || '--'}
                        </td>
                      )}
                      {visibleColumns.modelName && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.modelName || '--'}
                        </td>
                      )}
                      {visibleColumns.colorName && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.colorName || '--'}
                        </td>
                      )}
                      {visibleColumns.quantitySold && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumberWithCommas((item as any).cumulativeQuantity || item.quantity || 0, 0)}
                        </td>
                      )}
                      {visibleColumns.taxAmount && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumberWithCommas(item.taxAmount, 2)}
                        </td>
                      )}
                      {visibleColumns.whtAmount && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumberWithCommas(item.whtAmount, 2)}
                        </td>
                      )}
                      {visibleColumns.discountAmount && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumberWithCommas(item.discountAmount, 2)}
                        </td>
                      )}
                      {visibleColumns.unitPrice && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatNumberWithCommas(item.unitPrice, 2)}
                        </td>
                      )}
                      {visibleColumns.lineTotal && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {formatNumberWithCommas(item.lineTotal, 2)}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="px-4 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.status === 'paid' ? 'bg-green-100 text-green-800' :
                            item.status === 'partial_paid' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            item.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            item.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status || '--'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.currencyName && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.currencyName || '--'}
                        </td>
                      )}
                      {visibleColumns.notes && (
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {item.notes || '--'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300 sticky bottom-0 z-10">
                  <tr>
                    {visibleColumns.productCode && (
                      <td className="px-6 py-3 text-base font-bold text-gray-900" colSpan={
                        Object.values(visibleColumns).filter(v => v).length - 6
                      }>
                        <strong>Total</strong>
                      </td>
                    )}
                    {visibleColumns.quantitySold && (
                      <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                        <strong>{formatNumberWithCommas(totals.quantity, 0)}</strong>
                      </td>
                    )}
                    {visibleColumns.taxAmount && (
                      <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                        <strong>{formatCurrencySafe(totals.taxAmount)}</strong>
                      </td>
                    )}
                    {visibleColumns.whtAmount && (
                      <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                        <strong>{formatCurrencySafe(totals.whtAmount)}</strong>
                      </td>
                    )}
                    {visibleColumns.discountAmount && (
                      <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                        <strong>{formatCurrencySafe(totals.discountAmount)}</strong>
                      </td>
                    )}
                    {visibleColumns.unitPrice && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                        {/* Empty cell for unit price */}
                      </td>
                    )}
                    {visibleColumns.lineTotal && (
                      <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                        <strong>{formatCurrencySafe(totals.lineTotal)}</strong>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for status */}
                      </td>
                    )}
                    {visibleColumns.currencyName && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for currency */}
                      </td>
                    )}
                    {visibleColumns.notes && (
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {/* Empty cell for notes */}
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading sales details data...</span>
            </div>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {manualFetchTrigger > 0 && !isLoading && (!lineItems || lineItems.length === 0) && (
        <Card className="p-6">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-500">
              No sales details found for the selected criteria. Try adjusting your filters.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SalesDetailsReport;

