import React, { useState, useCallback } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  History, 
  Download, 
  FileText,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExchangeRateManagement } from '../hooks/useExchangeRateManagement';
import { ExchangeRateForm } from '../components/ExchangeRateForm';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import ContentContainer from '../components/ContentContainer';
import { ExchangeRate, ExchangeRateFilters } from '../types';
import { 
  exchangeRateStatusOptions, 
  pageSizeOptions,
  sortableColumns 
} from '../data/exchangeRateModules';

export const ExchangeRatePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    // Data
    exchangeRates,
    currencies,
    currentStats,
    historyData,
    totalItems,
    totalPages,
    page,
    pageSize,
    searchTerm,
    filters,
    sortConfig,
    editingRate,

    // Loading states
    isLoading,
    isStatsLoading,
    isCurrenciesLoading,
    isCreating,
    isUpdating,
    isDeleting,

    // UI states
    showForm,
    showHistory,

    // Permissions
    canView,
    canCreate,
    canUpdate,
    canDelete,
    canExport,

    // Event handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilterChange,
    handleAddNew,
    handleEdit,
    handleDelete,
    handleToggleStatus,
    handleSave,
    handleViewHistory,
    handleExportExcel,
    handleExportPdf,
    handleCloseForm,
    handleCloseHistory
  } = useExchangeRateManagement();

  const [showFilters, setShowFilters] = useState(false);

  // Table columns configuration
  const columns = [
    {
      key: 'fromCurrency',
      header: 'From Currency',
      visible: true, // Required column
      render: (rate: any) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            {rate.fromCurrency?.code || 'N/A'}
          </span>
          {rate.fromCurrency?.symbol && (
            <span className="text-xs text-gray-500">
              ({rate.fromCurrency.symbol})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'toCurrency',
      header: 'To Currency',
      visible: true, // Required column
      render: (rate: any) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            {rate.toCurrency?.code || 'N/A'}
          </span>
          {rate.toCurrency?.symbol && (
            <span className="text-xs text-gray-500">
              ({rate.toCurrency.symbol})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'rate',
      header: 'Exchange Rate',
      defaultVisible: true,
      render: (rate: any) => (
        <div className="text-sm text-gray-900">
          {parseFloat(rate.rate.toString()).toFixed(6)}
        </div>
      )
    },
    {
      key: 'effective_date',
      header: 'Effective Date',
      defaultVisible: true,
      render: (rate: any) => (
        <div className="text-sm text-gray-900">
          {formatDate(rate.effective_date)}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      visible: true, // Required column
      render: (rate: any) => (
        <StatusBadge status={rate.is_active ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'createdBy',
      header: 'Created By',
      defaultVisible: false, // Hidden by default
      render: (rate: any) => (
        <div className="text-sm text-gray-900">
          {rate.creator ? `${rate.creator.first_name} ${rate.creator.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      defaultVisible: false, // Hidden by default
      render: (rate: any) => (
        <div className="text-sm text-gray-900">
          {rate.created_at ? new Date(rate.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedBy',
      header: 'Updated By',
      defaultVisible: false, // Hidden by default
      render: (rate: any) => (
        <div className="text-sm text-gray-900">
          {rate.updater ? `${rate.updater.first_name} ${rate.updater.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      defaultVisible: false, // Hidden by default
      render: (rate: any) => (
        <div className="text-sm text-gray-900">
          {rate.updated_at ? new Date(rate.updated_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true, // Required column
      render: (rate: any) => (
        <div className="flex items-center justify-end space-x-2">
          {canUpdate && (
            <button
              onClick={() => handleEdit(rate)}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(rate.id)}
              className="text-red-600 hover:text-red-900 p-1"
              title="Delete"
              disabled={isDeleting}
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => handleViewHistory(rate.from_currency_id, rate.to_currency_id)}
            className="text-gray-600 hover:text-gray-900 p-1"
            title="View History"
          >
            <History size={16} />
          </button>
        </div>
      )
    }
  ];

  // Search handling with debouncing
  const [searchInput, setSearchInput] = useState(searchTerm);
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    handleSearch('');
  }, [handleSearch]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Format currency display
  const formatCurrency = (currency: any) => {
    if (!currency) return 'N/A';
    return (
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{currency.code}</span>
        <span className="text-sm text-gray-500">{currency.name}</span>
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get sort icon
  const getSortIcon = (field: keyof ExchangeRate) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown size={16} className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={16} className="text-blue-600" /> : 
      <ChevronDown size={16} className="text-blue-600" />;
  };

  // Loading state
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Access denied</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <ContentContainer>
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search exchange rates by currency code or name..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Total Exchange Rates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exchange Rates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isStatsLoading ? '...' : currentStats.totalRates}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Active Rates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rates</p>
                <p className="text-2xl font-bold text-green-600">
                  {isStatsLoading ? '...' : currentStats.activeRates}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Expired Rates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired Rates</p>
                <p className="text-2xl font-bold text-red-600">
                  {isStatsLoading ? '...' : currentStats.expiredRates}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Last Update */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isStatsLoading ? '...' : currentStats.lastUpdate}
                </p>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                             <button
                 onClick={handleBack}
                 className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
               >
                 <ArrowLeft size={16} className="mr-2" />
                 Back to Advance Setup
               </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
                    disabled={isLoading}
                  >
                    <Download size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105"
                    disabled={isLoading}
                  >
                    <FileText size={16} className="mr-2" />
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange({ status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {exchangeRateStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date To Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Exchange Rates</h3>
              <div className="flex items-center space-x-3">
                {/* Page Size Selector */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Show</label>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-700">items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading exchange rates...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && exchangeRates.length === 0 && (
            <div className="text-center py-12">
                              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Exchange Rates Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add your first exchange rate to enable currency conversions
              </p>
              {canCreate && (
                <div className="mt-6">
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exchange Rate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <DataTable
              data={exchangeRates}
              columns={columns}
              emptyMessage="No exchange rates found matching your criteria."
              showColumnControls={true}
              maxHeight={600}
            />
          </div>

          {/* Pagination */}
          {!isLoading && exchangeRates.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(page - 1) * pageSize + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(page * pageSize, totalItems)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{totalItems}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronUp className="h-5 w-5 transform rotate-90" />
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronDown className="h-5 w-5 transform rotate-90" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button (FAB) */}
        {canCreate && (
          <button
            onClick={handleAddNew}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-40"
            title="Add Exchange Rate"
            style={{ display: showForm ? 'none' : 'flex' }}
          >
            <Plus size={24} />
          </button>
        )}

        {/* Exchange Rate Form Modal */}
        <ExchangeRateForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          exchangeRate={editingRate}
          currencies={currencies}
          isLoading={isCreating || isUpdating}
        />

        {/* History Modal */}
        {showHistory && historyData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  History: {historyData.fromCurrency?.code} → {historyData.toCurrency?.code}
                </h2>
                <button
                  onClick={handleCloseHistory}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {historyData.history.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.effective_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {parseFloat(item.rate.toString()).toFixed(6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.creator?.first_name && item.creator?.last_name
                              ? `${item.creator.first_name} ${item.creator.last_name}`
                              : item.creator?.username || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </ContentContainer>
    </div>
  );
}; 