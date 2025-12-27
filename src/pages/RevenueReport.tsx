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
  DollarSign
} from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import SearchableMultiSelect from '../components/SearchableMultiSelect';
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
import { financialYearService } from '../services/financialYearService';
import { currencyService } from '../services/currencyService';
import { revenueReportService, RevenueReportFilters, RevenueReportItem } from '../services/revenueReportService';
import { exportCompleteReportToExcel, ExcelExportData, ChartExcelData } from '../utils/excelExporter';
import { generateRevenuePDF } from '../utils/pdfGenerator';
import { apiService } from '../services/api';
import { Company } from '../types';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueFilters {
  dateFrom: string;
  dateTo: string;
  storeId: string;
  customerId: string;
  salesAgentId: string;
  transactionType: string;
  status: string;
  productCategoryId: string;
  brandNameId: string;
  manufacturerId: string;
  modelId: string;
  colorId: string;
  priceCategoryId: string;
  financialYearId: string;
  currencyId: string;
}

const RevenueReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<RevenueFilters>({
    dateFrom: '',
    dateTo: '',
    storeId: '',
    customerId: '',
    salesAgentId: '',
    transactionType: '',
    status: '',
    productCategoryId: '',
    brandNameId: '',
    manufacturerId: '',
    modelId: '',
    colorId: '',
    priceCategoryId: '',
    financialYearId: '',
    currencyId: ''
  });

  const [queryFilters, setQueryFilters] = useState<RevenueReportFilters>({});
  const [manualFetchTrigger, setManualFetchTrigger] = useState(0);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [isChartCollapsed, setIsChartCollapsed] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    transactionRefNumber: true,
    transactionDate: true,
    transactionType: false, // Hidden
    storeName: true,
    customerName: true,
    salesAgentName: false,
    paymentStatus: true, // New payment status column (Paid, Partially paid, Unpaid)
    status: false, // Hidden
    subtotal: true,
    discountAmount: false,
    taxAmount: false,
    totalAmount: true,
    paidAmount: true,
    balanceAmount: true,
    exchangeRate: true, // New column
    equivalentAmount: true, // New column
    currencyName: false,
    productCategoryName: false,
    brandName: false,
    manufacturerName: false,
    modelName: false,
    colorName: false,
    priceCategoryName: false,
    financialYearName: false,
    receiptNumber: false,
    notes: false,
    createdBy: false,
    createdAt: false
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

  const { data: priceCategories } = useQuery({
    queryKey: ['price-categories'],
    queryFn: () => priceCategoryService.getPriceCategories({ page: 1, limit: 1000 })
  });

  const { data: financialYears, isLoading: isLoadingFinancialYears, error: financialYearsError } = useQuery({
    queryKey: ['financial-years'],
    queryFn: () => financialYearService.getFinancialYears({ page: 1, limit: 1000 })
  });

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currencyService.getCurrencies(1, 1000)
  });

  // Fetch revenue report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['revenue-report', queryFilters, manualFetchTrigger],
    queryFn: () => revenueReportService.getRevenueReport(queryFilters),
    enabled: manualFetchTrigger > 0 && !!user
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['revenue-report-stats', queryFilters],
    queryFn: () => revenueReportService.getRevenueReportStats(queryFilters),
    enabled: manualFetchTrigger > 0 && !!user
  });

  const transactions = reportData?.data || [];
  const stats = statsData?.stats;

  // Handle filter changes
  const handleFilterChange = (key: keyof RevenueFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle get data button click
  const handleGetData = () => {
    const filtersToSend: RevenueReportFilters = {};
    
    if (filters.dateFrom) filtersToSend.dateFrom = filters.dateFrom;
    if (filters.dateTo) filtersToSend.dateTo = filters.dateTo;
    if (filters.storeId && filters.storeId !== 'all') filtersToSend.storeId = filters.storeId;
    if (filters.customerId && filters.customerId !== 'all') filtersToSend.customerId = filters.customerId;
    if (filters.salesAgentId && filters.salesAgentId !== 'all') filtersToSend.salesAgentId = filters.salesAgentId;
    if (filters.transactionType && filters.transactionType !== 'all') filtersToSend.transactionType = filters.transactionType;
    if (filters.status && filters.status !== 'all') filtersToSend.status = filters.status;
    if (filters.productCategoryId && filters.productCategoryId !== 'all') filtersToSend.productCategoryId = filters.productCategoryId;
    if (filters.brandNameId && filters.brandNameId !== 'all') filtersToSend.brandNameId = filters.brandNameId;
    if (filters.manufacturerId && filters.manufacturerId !== 'all') filtersToSend.manufacturerId = filters.manufacturerId;
    if (filters.modelId && filters.modelId !== 'all') filtersToSend.modelId = filters.modelId;
    if (filters.colorId && filters.colorId !== 'all') filtersToSend.colorId = filters.colorId;
    if (filters.priceCategoryId && filters.priceCategoryId !== 'all') filtersToSend.priceCategoryId = filters.priceCategoryId;
    if (filters.financialYearId && filters.financialYearId !== 'all') filtersToSend.financialYearId = filters.financialYearId;
    if (filters.currencyId && filters.currencyId !== 'all') filtersToSend.currencyId = filters.currencyId;

    setQueryFilters(filtersToSend);
    setManualFetchTrigger(prev => prev + 1);
  };

  // Filter transactions by search term
  const filteredTransactions = React.useMemo(() => {
    if (!searchTerm) return transactions;
    
    const searchLower = searchTerm.toLowerCase();
    return transactions.filter(transaction =>
      transaction.transactionRefNumber?.toLowerCase().includes(searchLower) ||
      transaction.customerName?.toLowerCase().includes(searchLower) ||
      transaction.storeName?.toLowerCase().includes(searchLower) ||
      transaction.receiptNumber?.toLowerCase().includes(searchLower) ||
      transaction.notes?.toLowerCase().includes(searchLower)
    );
  }, [transactions, searchTerm]);

  // Sort transactions
  const sortedTransactions = React.useMemo(() => {
    if (!sortConfig.key) return filteredTransactions;
    
    return [...filteredTransactions].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof RevenueReportItem];
      const bValue = b[sortConfig.key as keyof RevenueReportItem];
      
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
  }, [filteredTransactions, sortConfig]);

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
    return sortedTransactions.reduce((acc, transaction) => ({
      subtotal: acc.subtotal + (transaction.subtotal || 0),
      discountAmount: acc.discountAmount + (transaction.discountAmount || 0),
      taxAmount: acc.taxAmount + (transaction.taxAmount || 0),
      totalAmount: acc.totalAmount + (transaction.totalAmount || 0),
      paidAmount: acc.paidAmount + (transaction.paidAmount || 0),
      balanceAmount: acc.balanceAmount + (transaction.balanceAmount || 0),
      equivalentAmount: acc.equivalentAmount + (transaction.equivalentAmount || 0)
    }), {
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      equivalentAmount: 0
    });
  }, [sortedTransactions]);

  // Format number with comma separators (no currency symbol) for column cells
  const formatNumberWithCommas = (amount: number | null | undefined, decimals: number = 2): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  };

  // Format currency with comma separators (no currency symbol) for column cells
  const formatCurrencySafe = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format equivalent amount with system default currency symbol
  const formatEquivalentAmount = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return `${defaultCurrencySymbol}0.00`;
    }
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${defaultCurrencySymbol}${formattedNumber}`;
  };

  // Prepare chart data for transaction type distribution
  const chartData = React.useMemo(() => {
    if (!stats?.transactionTypeDistribution || stats.transactionTypeDistribution.length === 0) {
      return null;
    }

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
    ];

    return {
      labels: stats.transactionTypeDistribution.map(item => item.type),
      datasets: [{
        data: stats.transactionTypeDistribution.map(item => item.count),
        backgroundColor: colors.slice(0, stats.transactionTypeDistribution.length),
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    };
  }, [stats]);

  // Export to Excel
  const handleExportExcel = () => {
    if (sortedTransactions.length === 0) return;
    
    // Prepare table data
    const tableData: ExcelExportData = {
      data: sortedTransactions,
      headers: Object.keys(sortedTransactions[0] || {}),
      title: 'Revenue Report',
      reportType: 'current',
      filters,
      searchTerm
    };
    
    // Prepare chart data from memoized chartData
    const chartDataForExport: ChartExcelData = {
      chartData: chartData || {
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }]
      },
      title: 'Revenue Report',
      reportType: 'current'
    };
    
    exportCompleteReportToExcel(tableData, chartDataForExport);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (sortedTransactions.length === 0) return;
    
    // TODO: Implement PDF export for revenue report
    alert('PDF export for Revenue Report is not yet implemented.');
    // generateRevenuePDF(
    //   sortedTransactions,
    //   'Revenue Report',
    //   filters,
    //   searchTerm,
    //   totals
    // );
  };

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
              {/* Date From */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date From
                </label>
                <Input
                  type="date"
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
                  type="date"
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

              {/* Transaction Type */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4 mr-2" />
                  Transaction Type
                </label>
                <Select
                  value={filters.transactionType}
                  onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="invoice">Invoice</option>
                  <option value="order">Order</option>
                  <option value="return">Return</option>
                  <option value="refund">Refund</option>
                  <option value="credit_note">Credit Note</option>
                  <option value="debit_note">Debit Note</option>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Receipt className="h-4 w-4 mr-2" />
                  Payment Status
                </label>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="partial_paid">Partially paid</option>
                  <option value="unpaid">Unpaid</option>
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

              {/* Financial Year */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Financial Year
                </label>
                <Select
                  value={filters.financialYearId}
                  onChange={(e) => handleFilterChange('financialYearId', e.target.value)}
                  disabled={isLoadingFinancialYears}
                >
                  <option value="all">All Financial Years</option>
                  {isLoadingFinancialYears ? (
                    <option value="" disabled>Loading...</option>
                  ) : financialYearsError ? (
                    <option value="" disabled>Error loading financial years</option>
                  ) : financialYears?.data && financialYears.data.length > 0 ? (
                    financialYears.data.map((fy: any) => (
                      <option key={fy.id} value={fy.id}>
                        {fy.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No financial years available</option>
                  )}
                </Select>
              </div>

              {/* Currency */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Currency
                </label>
                <Select
                  value={filters.currencyId}
                  onChange={(e) => handleFilterChange('currencyId', e.target.value)}
                >
                  <option value="all">All Currencies</option>
                  {currencies?.currencies?.map((currency: any) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name} ({currency.code})
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
              {error instanceof Error ? error.message : 'An error occurred while fetching revenue data.'}
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
      {transactions && transactions.length > 0 && (
        <>
          {/* Chart Section */}
          {chartData && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Type Distribution</h3>
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
                          maintainAspectRatio: true
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Transaction Summary</h4>
                    <div className="space-y-1">
                      {stats?.transactionTypeDistribution.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{item.type}</span>
                          <span className="text-sm font-medium text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Results Table */}
          <Card title="Revenue Report Results" className="p-6">
            {/* Total Transactions Count */}
            <div className="mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">
                  Total Transactions: {transactions.length}
                </span>
              </div>
            </div>

            {/* Search Transactions */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search transactions by reference number, customer, store, receipt number, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <div className="mt-2 text-sm text-gray-600">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
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
                  onClick={handleExportExcel}
                  disabled={!transactions || transactions.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <FileSpreadsheet size={16} className="mr-2" />
                  Export Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={!transactions || transactions.length === 0}
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
                            <span>Invoice Number</span>
                            {getSortIcon('transactionRefNumber')}
                          </div>
                        </th>
                      )}
                      {visibleColumns.transactionDate && (
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                          onClick={() => handleSort('transactionDate')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Invoice Date</span>
                            {getSortIcon('transactionDate')}
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
                      {visibleColumns.paymentStatus && (
                        <th
                          className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Payment Status</span>
                          </div>
                        </th>
                      )}
                      {visibleColumns.subtotal && (
                        <th
                          className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                          onClick={() => handleSort('subtotal')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>Subtotal</span>
                            {getSortIcon('subtotal')}
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
                      {visibleColumns.totalAmount && (
                        <th
                          className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                          onClick={() => handleSort('totalAmount')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>Total Amount</span>
                            {getSortIcon('totalAmount')}
                          </div>
                        </th>
                      )}
                      {visibleColumns.paidAmount && (
                        <th
                          className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                          onClick={() => handleSort('paidAmount')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>Paid</span>
                            {getSortIcon('paidAmount')}
                          </div>
                        </th>
                      )}
                      {visibleColumns.balanceAmount && (
                        <th
                          className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                          onClick={() => handleSort('balanceAmount')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>Balance</span>
                            {getSortIcon('balanceAmount')}
                          </div>
                        </th>
                      )}
                      {visibleColumns.exchangeRate && (
                        <th
                          className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                          onClick={() => handleSort('exchangeRate')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>Exchange Rate</span>
                            {getSortIcon('exchangeRate')}
                          </div>
                        </th>
                      )}
                      {visibleColumns.equivalentAmount && (
                        <th
                          className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200"
                          onClick={() => handleSort('equivalentAmount')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>Equivalent Amount</span>
                            {getSortIcon('equivalentAmount')}
                          </div>
                        </th>
                      )}
                      {visibleColumns.currencyName && (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                          Currency
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        {visibleColumns.transactionRefNumber && (
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {transaction.transactionRefNumber || '--'}
                          </td>
                        )}
                        {visibleColumns.transactionDate && (
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString() : '--'}
                          </td>
                        )}
                        {visibleColumns.transactionType && (
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {transaction.transactionType || '--'}
                            </span>
                          </td>
                        )}
                        {visibleColumns.storeName && (
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {transaction.storeName || '--'}
                          </td>
                        )}
                        {visibleColumns.customerName && (
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {transaction.customerName || '--'}
                          </td>
                        )}
                        {visibleColumns.salesAgentName && (
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {transaction.salesAgentName || '--'}
                          </td>
                        )}
                        {visibleColumns.paymentStatus && (() => {
                          const totalAmount = transaction.totalAmount || 0;
                          const paidAmount = transaction.paidAmount || 0;
                          const balanceAmount = transaction.balanceAmount || 0;
                          
                          let paymentStatus = 'Unpaid';
                          let statusClass = 'bg-red-100 text-red-800';
                          
                          if (Math.abs(balanceAmount) < 0.01) {
                            paymentStatus = 'Paid';
                            statusClass = 'bg-green-100 text-green-800';
                          } else if (paidAmount > 0 && balanceAmount > 0) {
                            paymentStatus = 'Partially paid';
                            statusClass = 'bg-yellow-100 text-yellow-800';
                          }
                          
                          return (
                            <td className="px-4 py-4 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${statusClass}`}>
                                {paymentStatus}
                              </span>
                            </td>
                          );
                        })()}
                        {visibleColumns.subtotal && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {transaction.currencySymbol || ''}{formatNumberWithCommas(transaction.subtotal, 2)}
                          </td>
                        )}
                        {visibleColumns.discountAmount && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {transaction.currencySymbol || ''}{formatNumberWithCommas(transaction.discountAmount, 2)}
                          </td>
                        )}
                        {visibleColumns.taxAmount && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {transaction.currencySymbol || ''}{formatNumberWithCommas(transaction.taxAmount, 2)}
                          </td>
                        )}
                        {visibleColumns.totalAmount && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {transaction.currencySymbol || ''}{formatNumberWithCommas(transaction.totalAmount, 2)}
                          </td>
                        )}
                        {visibleColumns.paidAmount && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {transaction.currencySymbol || ''}{formatNumberWithCommas(transaction.paidAmount, 2)}
                          </td>
                        )}
                        {visibleColumns.balanceAmount && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {transaction.currencySymbol || ''}{formatNumberWithCommas(transaction.balanceAmount, 2)}
                          </td>
                        )}
                        {visibleColumns.exchangeRate && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatNumberWithCommas(transaction.exchangeRate, 2)}
                          </td>
                        )}
                        {visibleColumns.equivalentAmount && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {defaultCurrencySymbol}{formatNumberWithCommas(transaction.equivalentAmount, 2)}
                          </td>
                        )}
                        {visibleColumns.currencyName && (
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {transaction.currencyName || '--'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300 sticky bottom-0 z-10">
                    <tr>
                      {visibleColumns.transactionRefNumber && (
                        <td className="px-4 py-3 text-base font-bold text-gray-900">
                          <strong>Total</strong>
                        </td>
                      )}
                      {visibleColumns.transactionDate && (
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {/* Empty cell for transaction date */}
                        </td>
                      )}
                      {visibleColumns.transactionType && (
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {/* Empty cell for transaction type */}
                        </td>
                      )}
                      {visibleColumns.storeName && (
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {/* Empty cell for store name */}
                        </td>
                      )}
                      {visibleColumns.customerName && (
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {/* Empty cell for customer name */}
                        </td>
                      )}
                      {visibleColumns.salesAgentName && (
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {/* Empty cell for sales agent name */}
                        </td>
                      )}
                      {visibleColumns.paymentStatus && (
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {/* Empty cell for payment status */}
                        </td>
                      )}
                      {visibleColumns.subtotal && (
                        <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                          <strong>{formatCurrencySafe(totals.subtotal)}</strong>
                        </td>
                      )}
                      {visibleColumns.discountAmount && (
                        <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                          <strong>{formatCurrencySafe(totals.discountAmount)}</strong>
                        </td>
                      )}
                      {visibleColumns.taxAmount && (
                        <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                          <strong>{formatCurrencySafe(totals.taxAmount)}</strong>
                        </td>
                      )}
                      {visibleColumns.totalAmount && (
                        <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                          <strong>{formatCurrencySafe(totals.totalAmount)}</strong>
                        </td>
                      )}
                      {visibleColumns.paidAmount && (
                        <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                          <strong>{formatCurrencySafe(totals.paidAmount)}</strong>
                        </td>
                      )}
                      {visibleColumns.balanceAmount && (
                        <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                          <strong>{formatCurrencySafe(totals.balanceAmount)}</strong>
                        </td>
                      )}
                      {visibleColumns.exchangeRate && (
                        <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                          {/* Empty cell for exchange rate */}
                        </td>
                      )}
                      {visibleColumns.equivalentAmount && (
                        <td className="px-6 py-3 text-base font-bold text-gray-900 text-right">
                          <strong>{formatEquivalentAmount(totals.equivalentAmount || 0)}</strong>
                        </td>
                      )}
                      {visibleColumns.currencyName && (
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {/* Empty cell for currency name */}
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
              <span className="text-gray-600">Loading revenue data...</span>
            </div>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {manualFetchTrigger > 0 && !isLoading && (!transactions || transactions.length === 0) && (
        <Card className="p-6">
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-500">
              No revenue data found for the selected criteria. Try adjusting your filters.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RevenueReport;

