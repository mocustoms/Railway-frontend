import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  X, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Coins, 
  CheckCircle, 
  Star, 
  FileText, 
  FileSpreadsheet
} from 'lucide-react';
import { useCurrencyManagement } from '../hooks/useCurrencyManagement';
import CurrencyForm from '../components/CurrencyForm';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ContentContainer from '../components/ContentContainer';
import { Currency } from '../types';
import { useConfirm } from '../hooks/useConfirm';

const CurrencyPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currencies,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    handleSearch,
    handlePageChange,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    setDefaultCurrency,
    toggleCurrencyStatus,
    canCreate,
    canDelete,
    canSetDefault,
    canToggleStatus,
    exportToExcel,
    exportToPDF
  } = useCurrencyManagement();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | undefined>(undefined);
  const [deletingCurrency, setDeletingCurrency] = useState<Currency | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Custom confirmation hook
  const { confirm } = useConfirm();

  // Compute hasData locally
  const hasData = currencies.length > 0;

  // Load data on mount
  useEffect(() => {
    handlePageChange(1); // Assuming loadCurrencies is handled by handlePageChange
  }, [handlePageChange]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(debouncedSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearchTerm, handleSearch]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: any) => {
    try {
      if (editingCurrency) {
        await updateCurrency(editingCurrency.id, data);
      } else {
        await createCurrency(data);
      }
      setShowForm(false);
      setEditingCurrency(undefined);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [editingCurrency, createCurrency, updateCurrency]);

  // Handle edit
  const handleEdit = useCallback((currency: Currency) => {
    setEditingCurrency(currency);
    setShowForm(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (currency: Currency) => {
    const confirmed = await confirm({
      title: 'Delete Currency',
      message: `Are you sure you want to delete "${currency.name}"? This action cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await deleteCurrency(currency.id);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [deleteCurrency]);

  // Handle set default
  const handleSetDefault = useCallback(async (currency: Currency) => {
    const confirmed = await confirm({
      title: 'Set Default Currency',
      message: `Are you sure you want to set "${currency.name}" as the default currency?`,
      confirmText: 'Yes, set as default',
      cancelText: 'Cancel',
      type: 'warning'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await setDefaultCurrency(currency.id);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [setDefaultCurrency, confirm]);

  // Handle toggle status
  const handleToggleStatus = useCallback(async (currency: Currency) => {
    const action = currency.is_active ? 'deactivate' : 'activate';
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Currency`,
      message: `Are you sure you want to ${action} "${currency.name}"?`,
      confirmText: `Yes, ${action}`,
      cancelText: 'Cancel',
      type: 'warning'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await toggleCurrencyStatus(currency.id, !currency.is_active);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [toggleCurrencyStatus, confirm]);

  // Handle add new
  const handleAddNew = useCallback(() => {
    setEditingCurrency(undefined);
    setShowForm(true);
  }, []);

  // Utility functions
  const getStatusBadge = (currency: Currency) => {
    if (currency.is_default) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Default</span>;
    }
    return currency.is_active ? 
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span> : 
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
  };

  const canDeleteCurrency = (currency: Currency) => {
    return canDelete && !currency.is_default;
  };

  const canSetDefaultCurrency = (currency: Currency) => {
    return canSetDefault && !currency.is_default;
  };

  const canToggleCurrencyStatus = (currency: Currency) => {
    return canToggleStatus && !currency.is_default;
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      header: 'Currency Name',
      visible: true, // Required column
      render: (currency: any) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{currency.name}</div>
            <div className="text-sm text-gray-500">{currency.country}</div>
          </div>
        </div>
      )
    },
    {
      key: 'code',
      header: 'Code',
      defaultVisible: true,
      render: (currency: any) => (
        <div className="text-sm font-medium text-gray-900">
          {currency.code}
        </div>
      )
    },
    {
      key: 'symbol',
      header: 'Symbol',
      defaultVisible: true,
      render: (currency: any) => (
        <div className="text-sm text-gray-900">
          {currency.symbol}
        </div>
      )
    },
    {
      key: 'is_default',
      header: 'Default',
      defaultVisible: true,
      render: (currency: any) => (
        <div className="flex items-center space-x-2">
          {currency.is_default ? (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          ) : null}
          <span className="text-sm text-gray-900">
            {currency.is_default ? 'Yes' : 'No'}
          </span>
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      visible: true, // Required column
      render: (currency: any) => (
        <StatusBadge
          status={currency.is_default ? 'Default' : currency.is_active ? 'Active' : 'Inactive'}
          variant={currency.is_default ? 'info' : currency.is_active ? 'success' : 'error'}
        />
      )
    },
    {
      key: 'createdBy',
      header: 'Created By',
      defaultVisible: false, // Hidden by default
      render: (currency: any) => (
        <div className="text-sm text-gray-900">
          {currency.creator ? `${currency.creator.first_name} ${currency.creator.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      defaultVisible: false, // Hidden by default
      render: (currency: any) => (
        <div className="text-sm text-gray-900">
          {currency.createdAt ? new Date(currency.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedBy',
      header: 'Updated By',
      defaultVisible: false, // Hidden by default
      render: (currency: any) => (
        <div className="text-sm text-gray-900">
          {currency.updater ? `${currency.updater.first_name} ${currency.updater.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      defaultVisible: false, // Hidden by default
      render: (currency: any) => (
        <div className="text-sm text-gray-900">
          {currency.updatedAt ? new Date(currency.updatedAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true, // Required column
      render: (currency: any) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleEdit(currency)}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Edit Currency"
          >
            <Edit size={16} />
          </button>
          {canSetDefaultCurrency(currency) && (
            <button
              onClick={() => handleSetDefault(currency)}
              className="text-yellow-600 hover:text-yellow-900 p-1"
              title="Set as Default"
            >
              <Star size={16} />
            </button>
          )}
          {canToggleCurrencyStatus(currency) && (
            <button
              onClick={() => handleToggleStatus(currency)}
              className="text-green-600 hover:text-green-900 p-1"
              title={currency.is_active ? 'Deactivate' : 'Activate'}
            >
              {currency.is_active ? <CheckCircle size={16} /> : <X size={16} />}
            </button>
          )}
          {canDeleteCurrency(currency) && (
            <button
              onClick={() => handleDelete(currency)}
              className="text-red-600 hover:text-red-900 p-1"
              title="Delete Currency"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search currencies by name, code, or country..."
              value={debouncedSearchTerm}
              onChange={e => setDebouncedSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {debouncedSearchTerm && (
              <button
                onClick={() => setDebouncedSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

                 {/* Stats Cards */}
         <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Currencies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCurrencies}</p>
              </div>
              <Coins className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Currencies</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeCurrencies}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Default Currency</p>
                <p className="text-2xl font-bold text-blue-600">{stats.defaultCurrency}</p>
              </div>
              <Star className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lastUpdate}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/advance-setup')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Advance Setup
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
                disabled={isLoading}
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={exportToPDF}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105"
                disabled={isLoading}
              >
                <FileText size={16} className="mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Currency Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading currencies...</span>
            </div>
          ) : hasData ? (
            <>
              <DataTable
                data={currencies}
                columns={columns}
                emptyMessage="No currencies found matching your criteria."
                showColumnControls={true}
                maxHeight={600}
              />

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
                      <span className="font-medium">{totalItems}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Coins className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No currencies</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new currency.</p>
            </div>
          )}
        </div>
      </ContentContainer>

      {/* Currency Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ top: '64px' }}>
          <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
            <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <CurrencyForm
                currency={editingCurrency}
                onSubmit={handleFormSubmit}
                onClose={() => setShowForm(false)}
                isLoading={isCreating || isUpdating}
                isOpen={showForm}
              />
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCurrency && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ top: '64px' }}>
          <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
            <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete "{deletingCurrency.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingCurrency(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(deletingCurrency);
                    setDeletingCurrency(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      {canCreate && (
        <button
          onClick={handleAddNew}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-40"
          title="Add Currency"
          style={{ display: showForm ? 'none' : 'flex' }}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default CurrencyPage; 