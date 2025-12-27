import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
  ClipboardList,
  Filter,
  Calendar,
  User,
  Store,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  Clock,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { usePhysicalInventoryManagement } from '../hooks/usePhysicalInventoryManagement';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';
import { PhysicalInventory as PhysicalInventoryType } from '../types';
import { physicalInventoryModuleConfig, physicalInventoryStatusConfig } from '../data/physicalInventoryModules';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PhysicalInventoryForm from '../components/PhysicalInventoryForm';
import PhysicalInventoryView from '../components/PhysicalInventoryView';
import PhysicalInventoryApprovalModal from '../components/PhysicalInventoryApprovalModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { physicalInventoryService } from '../services/physicalInventoryService';
import { currencyService } from '../services/currencyService';
import { getAllActiveExchangeRates } from '../services/exchangeRateService';
import './PhysicalInventory.css';

const PhysicalInventory: React.FC = () => {
  const navigate = useNavigate();
  const { } = useSidebar();
  const { user, isAuthenticated } = useAuth();
  
  // Calculate responsive modal size based on sidebar state
  const getModalSize = (): "sm" | "md" | "lg" | "xl" | "2xl" | "full" => {
    return "2xl"; // Use consistent 2xl size for both collapsed and expanded sidebar
  };
  
  const {
    physicalInventories,
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
    isReturning,
    isAcceptingVariance,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    handleManualFetch,
    handleDateFilterChange,
    sortConfig,
    createPhysicalInventory,
    updatePhysicalInventory,
    deletePhysicalInventory,
    submitPhysicalInventory,
    approvePhysicalInventory,
    rejectPhysicalInventory,
    returnPhysicalInventoryForCorrection,
    acceptVariance,
    exportToExcel,
    exportToPDF,
    preloadStoreData,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    filters,
    searchTerm
  } = usePhysicalInventoryManagement();

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedPhysicalInventory, setSelectedPhysicalInventory] = useState<PhysicalInventoryType | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [varianceAccepted, setVarianceAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'returned_for_correction'>('all');
  
  // Currency state for stat cards only
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [calculatedStats, setCalculatedStats] = useState<{
    totalValue: number;
  }>({ totalValue: 0 });

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
    if (!defaultCurrency || !exchangeRates.length || !physicalInventories.length) {
      setCalculatedStats({ totalValue: 0 });
      return;
    }

    let totalValue = 0;

    physicalInventories.forEach(inventory => {
      if (inventory.status === 'approved') {
        // Calculate equivalent value using current exchange rates
        const equivalentValue = calculateEquivalentValue(
          inventory.total_value || 0,
          inventory.currency_id || '',
          defaultCurrency.id
        );
        totalValue += equivalentValue;
      }
    });

    setCalculatedStats({
      totalValue: totalValue
    });
  }, [physicalInventories, defaultCurrency, exchangeRates, calculateEquivalentValue]);

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
    handleSort(columnKey as keyof PhysicalInventoryType | 'created_at' | 'updated_at', direction);
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
      setActiveTab(filters.status as 'draft' | 'submitted' | 'approved' | 'rejected' | 'returned_for_correction');
    } else {
      setActiveTab('all');
    }
  }, [filters.status]);

  // Handle status tab change
  const handleTabChange = useCallback((tab: 'all' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'returned_for_correction') => {
    setActiveTab(tab);
    if (tab === 'all') {
      // Show all inventories, no status filter
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
    setSelectedPhysicalInventory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (physicalInventory: PhysicalInventoryType) => {
    setModalMode('edit');
    setSelectedPhysicalInventory(physicalInventory);
    setIsModalOpen(true);
  };

  const handleView = (physicalInventory: PhysicalInventoryType) => {
    setSelectedPhysicalInventory(physicalInventory);
    setIsViewModalOpen(true);
  };

  const handleDelete = (physicalInventory: PhysicalInventoryType) => {
    setSelectedPhysicalInventory(physicalInventory);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (physicalInventory: PhysicalInventoryType) => {
    try {
      await submitPhysicalInventory(physicalInventory.id.toString());
    } catch (error) {
      }
  };

  const handleApprove = async (physicalInventory: PhysicalInventoryType) => {
    try {
      // Fetch full inventory data with items
      const fullInventory = await physicalInventoryService.getPhysicalInventory(physicalInventory.id.toString());
      setSelectedPhysicalInventory(fullInventory);
      setIsApprovalModalOpen(true);
      setApprovalAction('approve');
    } catch (error) {
      // Fallback to basic data if fetch fails
      setSelectedPhysicalInventory(physicalInventory);
      setIsApprovalModalOpen(true);
      setApprovalAction('approve');
    }
  };

  const handleReject = async (physicalInventory: PhysicalInventoryType) => {
    try {
      // Fetch full inventory data with items
      const fullInventory = await physicalInventoryService.getPhysicalInventory(physicalInventory.id.toString());
      setSelectedPhysicalInventory(fullInventory);
      setIsApprovalModalOpen(true);
      setApprovalAction('reject');
    } catch (error) {
      // Fallback to basic data if fetch fails
      setSelectedPhysicalInventory(physicalInventory);
      setIsApprovalModalOpen(true);
      setApprovalAction('reject');
    }
  };

  const handleReturn = async (physicalInventory: PhysicalInventoryType) => {
    try {
      // Fetch full inventory data with items
      const fullInventory = await physicalInventoryService.getPhysicalInventory(physicalInventory.id.toString());
      setSelectedPhysicalInventory(fullInventory);
      setIsApprovalModalOpen(true);
      setApprovalAction('return');
    } catch (error) {
      // Fallback to basic data if fetch fails
      setSelectedPhysicalInventory(physicalInventory);
      setIsApprovalModalOpen(true);
      setApprovalAction('return');
    }
  };

  const closeApprovalModal = () => {
    setIsApprovalModalOpen(false);
    setSelectedPhysicalInventory(null);
    setApprovalAction(null);
    setVarianceAccepted(false);
  };

  const handleAcceptVariance = async () => {
    if (!selectedPhysicalInventory) return;
    
    try {
      // Calculate variance values from the inventory items
      const items = selectedPhysicalInventory.items || [];
      let totalDeltaValue = 0;
      let positiveDeltaValue = 0;
      let negativeDeltaValue = 0;

      items.forEach(item => {
        const deltaValue = Number(item.delta_value || 0);
        totalDeltaValue += deltaValue;
        
        if (deltaValue > 0) {
          positiveDeltaValue += deltaValue;
        } else if (deltaValue < 0) {
          negativeDeltaValue += deltaValue;
        }
      });

      // Call the accept variance API
      await acceptVariance(selectedPhysicalInventory.id.toString(), {
        totalDeltaValue,
        positiveDeltaValue,
        negativeDeltaValue,
        notes: `Variance accepted by ${user?.first_name || 'User'} on ${new Date().toLocaleDateString()}`
      });
      
      setVarianceAccepted(true);
    } catch (error) {
      toast.error('Failed to accept variance. Please try again.');
    }
  };

  const handleApprovalConfirm = async (reason?: string) => {
    if (!selectedPhysicalInventory) return;
    
    if (approvalAction === 'approve') {
      await approvePhysicalInventory(selectedPhysicalInventory.id.toString(), reason);
    } else if (approvalAction === 'reject') {
      await rejectPhysicalInventory(selectedPhysicalInventory.id.toString(), reason || '');
    } else if (approvalAction === 'return') {
      await returnPhysicalInventoryForCorrection(selectedPhysicalInventory.id.toString(), reason || '');
    }
    
    closeApprovalModal();
  };

  // Table columns with render functions
  const columns = physicalInventoryModuleConfig.tableColumns.map(column => ({
    key: column.key,
    header: column.label,
    sortable: column.sortable,
    defaultVisible: column.defaultVisible !== false, // Default to true if not specified
    render: (physicalInventory: PhysicalInventoryType) => {
      switch (column.key) {
        case 'reference_number':
          return (
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {physicalInventory.reference_number}
            </span>
          );
        case 'inventory_date':
          return (
            <span className="text-gray-600 text-sm">
              {formatDate(physicalInventory.inventory_date)}
            </span>
          );
        case 'store_name':
          return (
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{physicalInventory.store_name}</span>
            </div>
          );
        case 'total_items':
          return (
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{physicalInventory.total_items.toLocaleString('en-US')}</span>
            </div>
          );
        case 'total_value':
          return (
            <span className="font-medium text-gray-900">
              {physicalInventory.currency_symbol || 'TSh'}{(Number(physicalInventory.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          );
        case 'currency_symbol':
          return (
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-medium">
                {physicalInventory.currency?.code || 'TZS'} ({physicalInventory.currency_symbol || 'TSh'})
              </span>
            </div>
          );
        case 'exchange_rate':
          return (
            <span className="text-gray-900 font-mono text-sm">
              {(Number(physicalInventory.exchange_rate) || 1).toFixed(4)}
            </span>
          );
        case 'notes':
          return (
            <div className="max-w-xs">
              <span className="text-gray-900 text-sm truncate block" title={physicalInventory.notes || ''}>
                {physicalInventory.notes || 'No notes'}
              </span>
            </div>
          );
        case 'status':
          return <StatusBadge status={physicalInventory.status} config={physicalInventoryStatusConfig} />;
        case 'created_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {physicalInventory.created_by_name || 'System'}
              </span>
            </div>
          );
        case 'created_at':
          return (
            <span className="text-gray-600 text-sm">
              {formatDateTime(physicalInventory.created_at)}
            </span>
          );
        case 'updated_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 text-sm">
                {physicalInventory.updated_by_name || '-'}
              </span>
            </div>
          );
        case 'updated_at':
          return (
            <span className="text-gray-600 text-sm">
              {physicalInventory.updated_at ? formatDateTime(physicalInventory.updated_at) : '-'}
            </span>
          );
        case 'submitted_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 text-sm">
                {physicalInventory.submitted_by_name || '-'}
              </span>
            </div>
          );
        case 'submitted_at':
          return (
            <span className="text-gray-600 text-sm">
              {physicalInventory.submitted_at ? formatDateTime(physicalInventory.submitted_at) : '-'}
            </span>
          );
        case 'approved_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 text-sm">
                {physicalInventory.approved_by_name || '-'}
              </span>
            </div>
          );
        case 'approved_at':
          return (
            <span className="text-gray-600 text-sm">
              {physicalInventory.approved_at ? formatDateTime(physicalInventory.approved_at) : '-'}
            </span>
          );
        case 'rejection_reason':
          return (
            <div className="max-w-xs">
              {physicalInventory.rejection_reason ? (
                <span className="text-red-600 text-sm truncate" title={physicalInventory.rejection_reason}>
                  {physicalInventory.rejection_reason}
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
                onClick={() => handleView(physicalInventory)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              {canEdit && (physicalInventory.status === 'draft' || physicalInventory.status === 'returned_for_correction') && (
                <button
                  onClick={() => handleEdit(physicalInventory)}
                  className="text-amber-600 hover:text-amber-800 transition-colors"
                  title="Edit Inventory"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {canDelete && physicalInventory.status === 'draft' && (
                <button
                  onClick={() => handleDelete(physicalInventory)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete Inventory"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {physicalInventory.status === 'submitted' && (
                <>
                  <button
                    onClick={() => handleApprove(physicalInventory)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    title="Approve Inventory"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReject(physicalInventory)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Reject Inventory"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReturn(physicalInventory)}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                    title="Return for Correction"
                  >
                    <Package className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          );
        default:
          return String(physicalInventory[column.key as keyof PhysicalInventoryType] || 'N/A');
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
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inventories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalInventories || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
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
              placeholder="Search inventories by reference number, store, or notes..."
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
                    onClick={() => exportToExcel(filters)}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={() => exportToPDF(filters)}
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
              <button
                onClick={() => handleTabChange('returned_for_correction')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'returned_for_correction'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Returned for Correction</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Physical Inventories Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading inventories...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={physicalInventories}
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
          title="Add New Physical Inventory"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Physical Inventory' : 'Edit Physical Inventory'}
        size={getModalSize()}
      >
        <PhysicalInventoryForm
          physicalInventory={selectedPhysicalInventory}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={async (data, status) => {
            try {
              if (modalMode === 'create') {
                await createPhysicalInventory(data);
                setIsModalOpen(false); // Close modal after successful creation
              } else if (selectedPhysicalInventory) {
                if (status === 'submitted') {
                  // Update with submitted status directly - this will save changes and submit in one operation
                  await updatePhysicalInventory(selectedPhysicalInventory.id.toString(), { ...data, status: 'submitted' });
                  } else {
                  await updatePhysicalInventory(selectedPhysicalInventory.id.toString(), data);
                  }
                
                setIsModalOpen(false); // Close modal after successful operation
              }
            } catch (error) {
              // Error handling is done in the mutation's onError callback
              }
          }}
          isLoading={modalMode === 'create' ? isCreating : isUpdating}
        />
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Physical Inventory Details"
        size="lg"
      >
        {selectedPhysicalInventory && (
          <PhysicalInventoryView
            physicalInventory={selectedPhysicalInventory}
            onClose={() => setIsViewModalOpen(false)}
            onSubmit={handleSubmit}
            onApprove={handleApprove}
            onReject={handleReject}
            onReturn={handleReturn}
            isLoading={isSubmitting}
            isApproving={isApproving}
            isRejecting={isRejecting}
            isReturning={isReturning}
          />
        )}
      </Modal>

      {selectedPhysicalInventory && approvalAction && (
        <PhysicalInventoryApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={closeApprovalModal}
          physicalInventory={selectedPhysicalInventory}
          action={approvalAction}
          onConfirm={handleApprovalConfirm}
          onAcceptVariance={handleAcceptVariance}
          isLoading={isApproving || isRejecting}
          isAcceptingVariance={isAcceptingVariance}
          varianceAccepted={varianceAccepted}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (selectedPhysicalInventory) {
            await deletePhysicalInventory(selectedPhysicalInventory.id.toString());
            setIsDeleteModalOpen(false);
          }
        }}
        title="Delete Physical Inventory"
        message={`Are you sure you want to delete physical inventory "${selectedPhysicalInventory?.reference_number}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default PhysicalInventory;