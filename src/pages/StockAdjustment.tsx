import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Plus,
  FileText,
  FileSpreadsheet,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  User,
  Store,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useStockAdjustmentManagement } from '../hooks/useStockAdjustmentManagement';
import { useSidebar } from '../contexts/SidebarContext';
import { StockAdjustment as StockAdjustmentType } from '../types';
import { stockAdjustmentModuleConfig, stockAdjustmentStatusConfig } from '../data/stockAdjustmentModules';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import StockAdjustmentForm from '../components/StockAdjustmentForm';
import StockAdjustmentView from '../components/StockAdjustmentView';
import StockAdjustmentApprovalModal from '../components/StockAdjustmentApprovalModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatCurrency, formatDate } from '../utils/formatters';
import { stockAdjustmentService } from '../services/stockAdjustmentService';
import { currencyService } from '../services/currencyService';
import { getAllActiveExchangeRates } from '../services/exchangeRateService';
import './StockAdjustment.css';

const StockAdjustment: React.FC = () => {
  const navigate = useNavigate();
  const { } = useSidebar();
  
  // Calculate responsive modal size based on sidebar state
  const getModalSize = (): "sm" | "md" | "lg" | "xl" | "2xl" | "full" => {
    return "2xl"; // Use consistent 2xl size for both collapsed and expanded sidebar
  };
  
  const {
    stockAdjustments,
    stats,
    stores,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    isLoadingStats,
    isLoadingStores,
    isCreating,
    isUpdating,
    isDeleting,
    isSubmitting,
    isApproving,
    isRejecting,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    handleManualFetch,
    handleDateFilterChange,
    sortConfig,
    createStockAdjustment,
    updateStockAdjustment,
    deleteStockAdjustment,
    submitStockAdjustment,
    approveStockAdjustment,
    rejectStockAdjustment,
    exportToExcel,
    exportToPDF,
    preloadStoreData,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    filters,
    searchTerm
  } = useStockAdjustmentManagement();

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedStockAdjustment, setSelectedStockAdjustment] = useState<StockAdjustmentType | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('all');
  
  // Currency state for stat cards only
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [calculatedStats, setCalculatedStats] = useState<{
    stockIn: number;
    stockOut: number;
    totalValue: number;
  }>({ stockIn: 0, stockOut: 0, totalValue: 0 });

  // Fetch default currency and exchange rates for stat cards - reactive to changes
  useEffect(() => {
    const fetchCurrencyData = async () => {
      try {
        // Fetch default currency
        const currencyData = await currencyService.getCurrencies(1, 1000);
        const defaultCurrency = currencyData.currencies?.find((currency: any) => currency.is_default);
        if (defaultCurrency) {
          setDefaultCurrency(defaultCurrency);
        }

        // Fetch active exchange rates
        const activeExchangeRates = await getAllActiveExchangeRates();
        setExchangeRates(activeExchangeRates);
      } catch (error) {
        }
    };

    fetchCurrencyData();
    
    // Set up interval to check for currency/exchange rate changes every 30 seconds
    const interval = setInterval(fetchCurrencyData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Function to get exchange rate for currency conversion
  const getExchangeRate = useCallback((fromCurrencyId: string, toCurrencyId: string): number => {
    if (fromCurrencyId === toCurrencyId) return 1;
    
    const exchangeRate = exchangeRates.find(rate => 
      rate.from_currency_id === fromCurrencyId && rate.to_currency_id === toCurrencyId
    );
    
    return exchangeRate?.rate || 1;
  }, [exchangeRates]);

  // Function to calculate equivalent value using current exchange rates
  const calculateEquivalentValue = useCallback((amount: number, fromCurrencyId: string, toCurrencyId: string): number => {
    const rate = getExchangeRate(fromCurrencyId, toCurrencyId);
    return amount * rate;
  }, [getExchangeRate]);

  // Calculate dynamic stats using current exchange rates
  useEffect(() => {
    if (!defaultCurrency || !exchangeRates.length || !stockAdjustments.length) {
      setCalculatedStats({ stockIn: 0, stockOut: 0, totalValue: 0 });
      return;
    }

    let stockInTotal = 0;
    let stockOutTotal = 0;

    stockAdjustments.forEach(adjustment => {
      if (adjustment.status === 'approved') {
        // Calculate equivalent value using current exchange rates
        const equivalentValue = calculateEquivalentValue(
          adjustment.total_value || 0,
          adjustment.currency_id || '',
          defaultCurrency.id
        );

        if (adjustment.adjustment_type === 'add') {
          stockInTotal += equivalentValue;
        } else if (adjustment.adjustment_type === 'deduct') {
          stockOutTotal += equivalentValue;
        }
      }
    });

    setCalculatedStats({
      stockIn: stockInTotal,
      stockOut: stockOutTotal,
      totalValue: stockInTotal + stockOutTotal
    });
  }, [stockAdjustments, defaultCurrency, exchangeRates, calculateEquivalentValue]);

  // Custom currency formatter that uses the system default currency symbol
  const formatCurrencyWithSymbol = useCallback((amount: number) => {
    if (defaultCurrency?.symbol) {
      return `${defaultCurrency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // Fallback to USD if no default currency is loaded
    return formatCurrency(amount, 'USD');
  }, [defaultCurrency]);

  // Handle column sorting for DataTable
  const handleDataTableSort = (columnKey: string, direction: 'asc' | 'desc') => {
    handleSort(columnKey as keyof StockAdjustmentType | 'created_at' | 'updated_at', direction);
  };

  // Computed values
  const showingStart = useMemo(() => {
    if (totalItems === 0) return 0;
    return (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);

  const showingEnd = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  // Preload store data for better performance
  useEffect(() => {
    preloadStoreData();
  }, [preloadStoreData]);

  // Sync activeTab with current filter status
  useEffect(() => {
    if (filters.status) {
      setActiveTab(filters.status as 'draft' | 'submitted' | 'approved' | 'rejected');
    } else {
      setActiveTab('all');
    }
  }, [filters.status]);

  // Handle status tab change
  const handleTabChange = useCallback((tab: 'all' | 'draft' | 'submitted' | 'approved' | 'rejected') => {
    setActiveTab(tab);
    if (tab === 'all') {
      // Show all adjustments, no status filter
      handleFilter({ 
        status: undefined
      });
    } else {
      // Filter by status
      handleFilter({ 
        status: tab
      });
    }
    handlePageChange(1); // Reset to first page when switching tabs
  }, [handleFilter, handlePageChange]);

  // Handlers
  const handleCreate = () => {
    setModalMode('create');
    setSelectedStockAdjustment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (stockAdjustment: StockAdjustmentType) => {
    setModalMode('edit');
    setSelectedStockAdjustment(stockAdjustment);
    setIsModalOpen(true);
  };

  const handleView = (stockAdjustment: StockAdjustmentType) => {
    setSelectedStockAdjustment(stockAdjustment);
    setIsViewModalOpen(true);
  };

  const handleDelete = (stockAdjustment: StockAdjustmentType) => {
    setSelectedStockAdjustment(stockAdjustment);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStockAdjustment(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedStockAdjustment(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedStockAdjustment(null);
  };

  const handleFormSubmit = async (data: any, status: 'draft' | 'submitted' = 'draft') => {
    if (selectedStockAdjustment) {
      if (status === 'submitted') {
        // Update with submitted status directly - this will save changes and submit in one operation
        await updateStockAdjustment(selectedStockAdjustment.id, { ...data, status: 'submitted' });
      } else {
        // Update as draft
        await updateStockAdjustment(selectedStockAdjustment.id, { ...data, status });
      }
    } else {
      // Create new adjustment
      await createStockAdjustment({ ...data, status });
    }
    closeModal();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStockAdjustment) return;
    await deleteStockAdjustment(selectedStockAdjustment.id);
    closeDeleteModal();
  };

  const handleApprove = async (stockAdjustment: StockAdjustmentType) => {
    try {
      // Fetch full adjustment data with items
      const fullAdjustment = await stockAdjustmentService.getStockAdjustment(stockAdjustment.id);
      setSelectedStockAdjustment(fullAdjustment);
      setIsApprovalModalOpen(true);
      setApprovalAction('approve');
    } catch (error) {
      // Fallback to basic data if fetch fails
      setSelectedStockAdjustment(stockAdjustment);
      setIsApprovalModalOpen(true);
      setApprovalAction('approve');
    }
  };

  const handleReject = async (stockAdjustment: StockAdjustmentType) => {
    try {
      // Fetch full adjustment data with items
      const fullAdjustment = await stockAdjustmentService.getStockAdjustment(stockAdjustment.id);
      setSelectedStockAdjustment(fullAdjustment);
      setIsApprovalModalOpen(true);
      setApprovalAction('reject');
    } catch (error) {
      // Fallback to basic data if fetch fails
      setSelectedStockAdjustment(stockAdjustment);
      setIsApprovalModalOpen(true);
      setApprovalAction('reject');
    }
  };

  const closeApprovalModal = () => {
    setIsApprovalModalOpen(false);
    setSelectedStockAdjustment(null);
    setApprovalAction(null);
  };

  const handleApprovalConfirm = async (reason?: string) => {
    if (!selectedStockAdjustment) return;
    
    try {
      if (approvalAction === 'approve') {
        await approveStockAdjustment(selectedStockAdjustment.id);
      } else if (approvalAction === 'reject') {
        await rejectStockAdjustment(selectedStockAdjustment.id, reason || '');
      }
      closeApprovalModal();
    } catch (error: any) {
      // Error is already handled by the mutation's onError callback
      // Don't close modal on error so user can see the error message
    }
  };

  // Table columns with render functions
  const columns = stockAdjustmentModuleConfig.tableColumns.map(column => ({
    key: column.key,
    header: column.label,
    sortable: column.sortable,
    defaultVisible: column.defaultVisible !== false, // Default to true if not specified
    render: (stockAdjustment: StockAdjustmentType) => {
      switch (column.key) {
        case 'reference_number':
          return (
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {stockAdjustment.reference_number}
            </span>
          );
        case 'adjustment_date':
          return (
            <span className="text-gray-600 text-sm">
              {formatDate(stockAdjustment.adjustment_date)}
            </span>
          );
        case 'store_name':
          return (
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{stockAdjustment.store_name}</span>
            </div>
          );
        case 'adjustment_type':
          return (
            <div className="flex items-center space-x-2">
              {stockAdjustment.adjustment_type === 'add' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`font-medium ${
                stockAdjustment.adjustment_type === 'add' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stockAdjustment.adjustment_type === 'add' ? 'Stock In' : 'Stock Out'}
              </span>
            </div>
          );
        case 'total_items':
          return (
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{stockAdjustment.total_items}</span>
            </div>
          );
        case 'total_value':
          return (
            <span className="font-medium text-gray-900">
              {stockAdjustment.currency_symbol || 'TSh'}{(Number(stockAdjustment.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          );
        case 'currency_symbol':
          return (
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-medium">
                {stockAdjustment.currency_name || 'TZS'} ({stockAdjustment.currency_symbol || 'TSh'})
              </span>
            </div>
          );
        case 'exchange_rate':
          return (
            <span className="text-gray-900 font-mono text-sm">
              {(Number(stockAdjustment.exchange_rate) || 1).toFixed(4)}
            </span>
          );
        case 'notes':
          return (
            <div className="max-w-xs">
              <span className="text-gray-900 text-sm truncate block" title={stockAdjustment.notes || ''}>
                {stockAdjustment.notes || 'No notes'}
              </span>
            </div>
          );
        case 'status':
          return <StatusBadge status={stockAdjustment.status} config={stockAdjustmentStatusConfig} />;
        case 'created_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {stockAdjustment.created_by_name || 'System'}
              </span>
            </div>
          );
        case 'created_at':
          return (
            <span className="text-gray-600 text-sm">
              {formatDate(stockAdjustment.created_at)}
            </span>
          );
        case 'updated_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 text-sm">
                {stockAdjustment.updated_by_name || '-'}
              </span>
            </div>
          );
        case 'updated_at':
          return (
            <span className="text-gray-600 text-sm">
              {stockAdjustment.updated_at ? formatDate(stockAdjustment.updated_at) : '-'}
            </span>
          );
        case 'submitted_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 text-sm">
                {stockAdjustment.submitted_by_name || '-'}
              </span>
            </div>
          );
        case 'submitted_at':
          return (
            <span className="text-gray-600 text-sm">
              {stockAdjustment.submitted_at ? formatDate(stockAdjustment.submitted_at) : '-'}
            </span>
          );
        case 'approved_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 text-sm">
                {stockAdjustment.approved_by_name || '-'}
              </span>
            </div>
          );
        case 'approved_at':
          return (
            <span className="text-gray-600 text-sm">
              {stockAdjustment.approved_at ? formatDate(stockAdjustment.approved_at) : '-'}
            </span>
          );
        case 'rejection_reason':
          return (
            <div className="max-w-xs">
              {stockAdjustment.rejection_reason ? (
                <span className="text-red-600 text-sm truncate" title={stockAdjustment.rejection_reason}>
                  {stockAdjustment.rejection_reason}
                </span>
              ) : (
                <span className="text-gray-400 text-sm">-</span>
              )}
            </div>
          );
        case 'actions':
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleView(stockAdjustment)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              {canEdit && stockAdjustment.status === 'draft' && (
                <button
                  onClick={() => handleEdit(stockAdjustment)}
                  className="text-amber-600 hover:text-amber-800 transition-colors"
                  title="Edit Adjustment"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {canDelete && stockAdjustment.status === 'draft' && (
                <button
                  onClick={() => handleDelete(stockAdjustment)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete Adjustment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {stockAdjustment.status === 'submitted' && (
                <>
                  <button
                    onClick={() => handleApprove(stockAdjustment)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    title="Approve Adjustment"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReject(stockAdjustment)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Reject Adjustment"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          );
        default:
          return String(stockAdjustment[column.key as keyof StockAdjustmentType] || 'N/A');
      }
    },
  }));

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Adjustments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.total || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock In Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : formatCurrencyWithSymbol(calculatedStats.stockIn)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Out Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : formatCurrencyWithSymbol(calculatedStats.stockOut)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Equivalent Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : formatCurrencyWithSymbol(calculatedStats.totalValue)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search adjustments by reference number, store, or reason..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.storeId || 'all'}
                onChange={(e) => handleFilter({ storeId: e.target.value === 'all' ? '' : e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              >
                <option value="all">All Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleDateFilterChange({ startDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
                placeholder="Start Date"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleDateFilterChange({ endDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                min={filters.startDate || undefined} // Cannot be before start date
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
                placeholder="End Date"
              />
            </div>

            <button
              onClick={handleManualFetch}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-150 text-sm font-medium"
            >
              <Search className="h-4 w-4" />
              <span>Get Data</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-gray-400" />
              <select
                value={filters.storeId || ''}
                onChange={(e) => handleFilter({ storeId: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
                disabled={isLoadingStores}
              >
                <option value="">All Stores</option>
                {stores.map((store: any) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/inventory-management')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Inventory Management
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={exportToExcel}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <FileText size={16} className="mr-2" />
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              <button
                onClick={() => handleTabChange('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>All</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('draft')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'draft'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Draft</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('submitted')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'submitted'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Submitted</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('approved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'approved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approved</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('rejected')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'rejected'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4" />
                  <span>Rejected</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Stock Adjustments Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading adjustments...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={stockAdjustments}
                columns={columns}
                sortable={true}
                onSort={handleDataTableSort}
                initialSortState={{ key: sortConfig.field, direction: sortConfig.direction }}
                showColumnControls={true}
                maxHeight={600}
              />
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 animate-fadeIn">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="pageSizeSelect" className="text-sm text-gray-700">Show</label>
                <select
                  id="pageSizeSelect"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-100"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">items</span>
              </div>
              <span className="text-sm text-gray-700">
                Showing {showingStart}-{showingEnd} of {totalItems}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-100 transform hover:scale-105 ${
                      currentPage === page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </ContentContainer>

      {/* Floating Action Button */}
      {canCreate && (
        <button
          onClick={handleCreate}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
          title="Add New Stock Adjustment"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Modals */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={modalMode === 'create' ? 'Create Stock Adjustment' : 'Edit Stock Adjustment'}
          size={getModalSize()}
        >
          <StockAdjustmentForm
            stockAdjustment={selectedStockAdjustment}
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
            isLoading={isCreating || isUpdating}
          />
        </Modal>
      )}

      {isViewModalOpen && selectedStockAdjustment && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
          title="Stock Adjustment Details"
          size="xl"
        >
          <StockAdjustmentView
            stockAdjustment={selectedStockAdjustment}
            onClose={closeViewModal}
            onEdit={() => {
              closeViewModal();
              handleEdit(selectedStockAdjustment);
            }}
            canEdit={canEdit && selectedStockAdjustment.status === 'draft'}
          />
        </Modal>
      )}

      {isDeleteModalOpen && selectedStockAdjustment && (
        <ConfirmDialog
          isOpen={isDeleteModalOpen}
          title="Delete Stock Adjustment"
          message={`Are you sure you want to delete "${selectedStockAdjustment.reference_number}"? This action cannot be undone.`}
          confirmText="Delete Adjustment"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onClose={closeDeleteModal}
        />
      )}

      {isApprovalModalOpen && selectedStockAdjustment && approvalAction && (
        <StockAdjustmentApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={closeApprovalModal}
          stockAdjustment={selectedStockAdjustment}
          action={approvalAction}
          onConfirm={handleApprovalConfirm}
          isLoading={isApproving || isRejecting}
        />
      )}
    </div>
  );
};

export default StockAdjustment;
