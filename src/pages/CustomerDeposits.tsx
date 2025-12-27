import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  X, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  FileSpreadsheet,
  Filter,
  DollarSign,
  TrendingUp,
  Eye,
  Calendar
} from 'lucide-react';
import { useCustomerDepositManagement } from '../hooks/useCustomerDepositManagement';
import CustomerDepositForm from '../components/CustomerDepositForm';
import CustomerDepositView from '../components/CustomerDepositView';
import DataTable from '../components/DataTable';
import { useQuery } from '@tanstack/react-query';
import { currencyService } from '../services/currencyService';
import StatusBadge from '../components/StatusBadge';
import ContentContainer from '../components/ContentContainer';
import Card from '../components/Card';
import { CustomerDeposit, CustomerDepositFormData } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import ConfirmDialog from '../components/ConfirmDialog';

const CustomerDeposits: React.FC = () => {
  const navigate = useNavigate();
  
  // Get system default currency
  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currencyService.getCurrencies(1, 1000) // Get all currencies with high limit
  });
  
  const defaultCurrency = currenciesData?.currencies?.find(currency => currency.is_default);
  
  // Number formatting utility
  const formatCurrency = (amount: number, symbol?: string) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${symbol || '$'}${formattedAmount}`;
  };
  
  const {
    deposits,
    pagination,
    stats,
    filters,
    isLoading,
    isCreating,
    isUpdating,
    isExportingExcel,
    isExportingPdf,
    updateFilters,
    handleDateFilterChange,
    handleManualFetch,
    updateSortConfig,
    goToPage,
    nextPage,
    prevPage,
    createDeposit,
    updateDeposit,
    deleteDeposit,
    exportToExcel,
    exportToPDF,
    currencies,
    paymentTypes,
    bankDetails,
    setLimit
  } = useCustomerDepositManagement();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<CustomerDeposit | undefined>(undefined);
  const [viewingDeposit, setViewingDeposit] = useState<CustomerDeposit | undefined>(undefined);
  const [deletingDeposit, setDeletingDeposit] = useState<CustomerDeposit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Handle debounced search
  React.useEffect(() => {
    updateFilters({ search: debouncedSearch });
  }, [debouncedSearch, updateFilters]);

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Handle table sort
  const handleTableSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    updateSortConfig({ column: key as any, direction });
  }, [updateSortConfig]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: CustomerDepositFormData) => {
    try {
      if (editingDeposit) {
        await updateDeposit(editingDeposit.id, data);
      } else {
        await createDeposit(data);
      }
      setShowForm(false);
      setEditingDeposit(undefined);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [editingDeposit, createDeposit, updateDeposit]);

  // Handle edit
  const handleEdit = useCallback((deposit: CustomerDeposit) => {
    setEditingDeposit(deposit);
    setShowForm(true);
  }, []);

  // Handle view
  const handleView = useCallback((deposit: CustomerDeposit) => {
    setViewingDeposit(deposit);
    setShowView(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback((deposit: CustomerDeposit) => {
    setDeletingDeposit(deposit);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (deletingDeposit) {
      await deleteDeposit(deletingDeposit.id);
      setDeletingDeposit(null);
    }
  }, [deletingDeposit, deleteDeposit]);

  // Handle export Excel
  const handleExportExcel = useCallback(async () => {
    try {
      const blob = await exportToExcel();
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customer-deposits.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      // Export failed silently
    }
  }, [exportToExcel]);

  // Handle export PDF
  const handleExportPDF = useCallback(async () => {
    try {
      const blob = await exportToPDF();
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customer-deposits.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      // Export failed silently
    }
  }, [exportToPDF]);

  // Handle form close
  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingDeposit(undefined);
  }, []);

  // Table columns configuration
  const columns = [
    {
      key: 'depositReferenceNumber',
      header: 'Reference Number',
      defaultVisible: true,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900 font-medium">
          {deposit.depositReferenceNumber}
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      defaultVisible: true,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {deposit.customer ? (
            <div>
              <div className="font-medium">{deposit.customer.full_name}</div>
              <div className="text-gray-500 text-xs">{deposit.customer.customer_id}</div>
            </div>
          ) : '--'}
        </div>
      )
    },
    {
      key: 'paymentType',
      header: 'Payment Type',
      defaultVisible: true,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {deposit.paymentType ? (
            <div>
              <div className="font-medium">{deposit.paymentType.name}</div>
              <div className="text-gray-500 text-xs">{deposit.paymentType.code}</div>
            </div>
          ) : '--'}
        </div>
      )
    },
    {
      key: 'bankDetail',
      header: 'Bank Details',
      defaultVisible: true,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {deposit.bankDetail ? (
            <div>
              <div className="font-medium">{deposit.bankDetail.bankName}</div>
              <div className="text-gray-500 text-xs">{deposit.bankDetail.branch}</div>
            </div>
          ) : '--'}
        </div>
      )
    },
    {
      key: 'chequeNumber',
      header: 'Cheque Number',
      defaultVisible: false,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">{deposit.chequeNumber || '--'}</div>
      )
    },
    {
      key: 'currency',
      header: 'Currency',
      defaultVisible: true,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {deposit.currency ? (
            <div>
              <div className="font-medium">{deposit.currency.code}</div>
              <div className="text-gray-500 text-xs">{deposit.currency.name}</div>
            </div>
          ) : '--'}
        </div>
      )
    },
    {
      key: 'depositAmount',
      header: 'Amount',
      defaultVisible: true,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900 font-medium">
          {deposit.currency?.symbol || '$'}{new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(Number(deposit.depositAmount))}
        </div>
      )
    },
    {
      key: 'equivalentAmount',
      header: 'Equivalent Amount',
      defaultVisible: true,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900 font-medium">
          {formatCurrency(Number(deposit.equivalentAmount || 0), defaultCurrency?.symbol)}
        </div>
      )
    },
    {
      key: 'liabilityAccount',
      header: 'Liability Account',
      defaultVisible: false,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {deposit.liabilityAccount ? (
            <div>
              <div className="font-medium">{deposit.liabilityAccount.code}</div>
              <div className="text-gray-500 text-xs">{deposit.liabilityAccount.name}</div>
            </div>
          ) : '--'}
        </div>
      )
    },
    {
      key: 'assetAccount',
      header: 'Asset Account',
      defaultVisible: false,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {deposit.assetAccount ? (
            <div>
              <div className="font-medium">{deposit.assetAccount.code}</div>
              <div className="text-gray-500 text-xs">{deposit.assetAccount.name}</div>
            </div>
          ) : '--'}
        </div>
      )
    },
    {
      key: 'transactionDate',
      header: 'Transaction Date',
      defaultVisible: true,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {new Date(deposit.transactionDate).toLocaleString()}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      defaultVisible: false,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <StatusBadge 
          status={deposit.is_active ? 'Active' : 'Inactive'}
          variant={deposit.is_active ? 'success' : 'error'}
        />
      )
    },
    {
      key: 'createdBy',
      header: 'Created By',
      defaultVisible: false,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {deposit.creator ? `${deposit.creator.first_name} ${deposit.creator.last_name}` : '--'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      defaultVisible: false,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {new Date(deposit.createdAt).toLocaleString()}
        </div>
      )
    },
    {
      key: 'updatedBy',
      header: 'Updated By',
      defaultVisible: false,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {deposit.updater ? `${deposit.updater.first_name} ${deposit.updater.last_name}` : '--'}
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      defaultVisible: false,
      sortable: true,
      render: (deposit: CustomerDeposit) => (
        <div className="text-sm text-gray-900">
          {deposit.updatedAt ? new Date(deposit.updatedAt).toLocaleString() : '--'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true,
      render: (deposit: CustomerDeposit) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleView(deposit)}
            className="text-green-600 hover:text-green-900 p-1"
            title="View"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEdit(deposit)}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(deposit)}
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Deposits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : stats?.totalDeposits || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Equivalent Amount</p>
                <p className="text-lg font-semibold text-purple-600">
                  {isLoading ? '...' : formatCurrency(Number(stats?.totalEquivalentAmount || 0), defaultCurrency?.symbol)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full flex-shrink-0 ml-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
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
              placeholder="Search deposits by reference number, customer, or amount..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Filters Row */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Filters:</span>
            </div>
            
            {/* Currency Filter */}
            <select
              value={filters.currencyId || 'all'}
              onChange={(e) => updateFilters({ currencyId: e.target.value === 'all' ? undefined : e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            >
              <option value="all">All Currencies</option>
              {Array.isArray(currencies) && currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>

            {/* Payment Type Filter */}
            <select
              value={filters.paymentTypeId || 'all'}
              onChange={(e) => updateFilters({ paymentTypeId: e.target.value === 'all' ? undefined : e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            >
              <option value="all">All Payment Types</option>
              {Array.isArray(paymentTypes) && paymentTypes.map((paymentType) => (
                <option key={paymentType.id} value={paymentType.id}>
                  {paymentType.name}
                </option>
              ))}
            </select>

            {/* Bank Filter */}
            <select
              value={filters.bankDetailId || 'all'}
              onChange={(e) => updateFilters({ bankDetailId: e.target.value === 'all' ? undefined : e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            >
              <option value="all">All Banks</option>
              {Array.isArray(bankDetails) && bankDetails.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bankName} - {bank.accountNumber}
                </option>
              ))}
            </select>

            {/* Date Filters */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Date Range:</span>
            </div>
            
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateFilterChange({ startDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]} // Cannot select future dates
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              placeholder="Start Date"
            />
            
            <span className="text-gray-400">to</span>
            
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateFilterChange({ endDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]} // Cannot select future dates
              min={filters.startDate || undefined} // Cannot be before start date
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              placeholder="End Date"
            />
            
            {/* Get Data Button */}
            <button
              onClick={handleManualFetch}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-150 text-sm font-medium"
            >
              <Search className="h-4 w-4" />
              <span>Get Data</span>
            </button>
          </div>
        </div>

        {/* Enhanced Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/sales')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Sales
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportExcel}
                disabled={isExportingExcel || isLoading || deposits.length === 0}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExportingPdf || isLoading || deposits.length === 0}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} className="mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Customer Deposits Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading customer deposits...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={deposits}
                columns={columns}
                emptyMessage="No customer deposits found matching your criteria."
                onSort={handleTableSort}
                sortable={true}
                showColumnControls={true}
                maxHeight={600}
              />
            </>
          )}
        </div>

        {/* Pagination Controls - Only show when there are items */}
        {deposits && deposits.length > 0 && pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 animate-fadeIn">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="pageSizeSelect" className="text-sm text-gray-700">Show</label>
                <select
                  id="pageSizeSelect"
                  value={pagination?.limit?.toString() || '10'}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value));
                  }}
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
                Showing {pagination?.total ? ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + 1 : 0}-{pagination?.total ? Math.min((pagination?.page || 1) * (pagination?.limit || 10), pagination?.total) : 0} of {pagination?.total || 0}
              </span>
            </div>
            {pagination?.totalPages ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevPage}
                  disabled={(pagination?.page || 1) === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination?.totalPages || 1) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min((pagination?.totalPages || 1) - 4, (pagination?.page || 1) - 2)) + i;
                  if (pageNum > (pagination?.totalPages || 1)) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-100 transform hover:scale-105 ${
                        (pagination?.page || 1) === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={nextPage}
                  disabled={(pagination?.page || 1) === (pagination?.totalPages || 1)}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        )}
      </ContentContainer>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingDeposit(undefined);
          setShowForm(true);
        }}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="Add New Deposit"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Modal */}
      <CustomerDepositForm
        isOpen={showForm}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        customerDeposit={editingDeposit || undefined}
        isSubmitting={isCreating || isUpdating}
      />

      {/* View Modal */}
      {showView && viewingDeposit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 animate-fadeIn" style={{ top: '64px' }}>
          <div className="min-h-[calc(100vh-64px)] flex items-start justify-center py-8 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[calc(100vh-100px)] overflow-y-auto">
              <div className="p-6">
                <CustomerDepositView
                  customerDeposit={viewingDeposit}
                  onClose={() => {
                    setShowView(false);
                    setViewingDeposit(undefined);
                  }}
                  onEdit={() => {
                    setShowView(false);
                    setViewingDeposit(undefined);
                    handleEdit(viewingDeposit);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDeposit}
        onClose={() => setDeletingDeposit(null)}
        onConfirm={confirmDelete}
        title="Delete Customer Deposit"
        message={`Are you sure you want to delete deposit ${deletingDeposit?.depositReferenceNumber}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={false}
        variant="danger"
      />
    </div>
  );
};

export default CustomerDeposits;