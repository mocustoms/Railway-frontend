import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  X, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  FileText, 
  FileSpreadsheet,
  Filter,
  Clock
} from 'lucide-react';
import { usePaymentTypeManagement } from '../hooks/usePaymentTypeManagement';
import PaymentTypeForm from '../components/PaymentTypeForm';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ContentContainer from '../components/ContentContainer';
import { PaymentType } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useConfirm } from '../hooks/useConfirm';
import './PaymentTypes.css';

const PaymentTypesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    paymentTypes,
    stats,
    paymentMethods,
    accounts,
    isLoading,
    isLoadingStats,
    isCreating,
    isUpdating,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleStatusFilter,
    createPaymentType,
    updatePaymentType,
    deletePaymentType,
    togglePaymentTypeStatus,
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canExport,
    exportToExcel,
    exportToPDF,
    filters
  } = usePaymentTypeManagement();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState<PaymentType | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom confirmation hook
  const { confirm } = useConfirm();

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Load data on mount
  useEffect(() => {
    handlePageChange(1);
  }, [handlePageChange]);

  // Handle debounced search
  useEffect(() => {
    handleSearch(debouncedSearch);
  }, [debouncedSearch, handleSearch]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: any) => {
    try {
      if (editingPaymentType) {
        await updatePaymentType(editingPaymentType.id, data);
      } else {
        await createPaymentType(data);
      }
      setShowForm(false);
      setEditingPaymentType(undefined);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [editingPaymentType, createPaymentType, updatePaymentType]);

  // Handle edit
  const handleEdit = useCallback((paymentType: PaymentType) => {
    setEditingPaymentType(paymentType);
    setShowForm(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (paymentType: PaymentType) => {
    const confirmed = await confirm({
      title: 'Delete Payment Type',
      message: `Are you sure you want to delete "${paymentType.name}"? This action cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await deletePaymentType(paymentType.id);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [deletePaymentType, confirm]);

  // Handle status toggle
  const handleStatusToggle = useCallback(async (paymentType: PaymentType) => {
    const action = paymentType.is_active ? 'deactivate' : 'activate';
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Payment Type`,
      message: `Are you sure you want to ${action} "${paymentType.name}"?`,
      confirmText: `Yes, ${action}`,
      cancelText: 'Cancel',
      type: 'warning'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await togglePaymentTypeStatus(paymentType.id);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [togglePaymentTypeStatus, confirm]);

  // Handle search change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((status: 'all' | 'active' | 'inactive') => {
    handleStatusFilter(status);
  }, [handleStatusFilter]);

  // Handle table sort
  const handleTableSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    // Map column keys to actual field names for sorting
    let sortKey: keyof PaymentType | 'created_at' | 'updated_at';
    
    switch (key) {
      case 'payment_method':
        sortKey = 'payment_method_id';
        break;
      case 'default_account':
        sortKey = 'default_account_id';
        break;
      case 'created_at':
        sortKey = 'created_at';
        break;
      case 'updated_at':
        sortKey = 'updated_at';
        break;
      case 'created_by':
        sortKey = 'created_by';
        break;
      case 'updated_by':
        sortKey = 'updated_by';
        break;
      default:
        sortKey = key as keyof PaymentType | 'created_at' | 'updated_at';
    }
    
    handleSort(sortKey, direction);
  }, [handleSort]);

  // Handle export to Excel
  const handleExportExcel = useCallback(async () => {
    try {
      await exportToExcel();
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [exportToExcel]);

  // Handle export to PDF
  const handleExportPDF = useCallback(async () => {
    try {
      await exportToPDF();
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [exportToPDF]);

  // Helper functions
  const getStatusBadge = (paymentType: PaymentType) => {
    return (
      <StatusBadge
        status={paymentType.is_active ? 'Active' : 'Inactive'}
        variant={paymentType.is_active ? 'success' : 'error'}
      />
    );
  };

  const canDeletePaymentType = (paymentType: PaymentType) => {
    return canDelete && paymentType.is_active;
  };

  const canEditPaymentType = (paymentType: PaymentType) => {
    return canEdit;
  };

  const canTogglePaymentTypeStatus = (paymentType: PaymentType) => {
    return canToggleStatus;
  };

  // Table columns configuration
  const columns = [
    {
      key: 'code',
      header: 'Code',
      defaultVisible: true,
      sortable: true,
      render: (paymentType: PaymentType) => (
        <div className="text-sm text-gray-900 font-medium">{paymentType.code}</div>
      )
    },
    {
      key: 'name',
      header: 'Payment Type Name',
      defaultVisible: true,
      sortable: true,
      render: (paymentType: PaymentType) => (
        <div className="text-sm text-gray-900">{paymentType.name}</div>
      )
    },
    {
      key: 'payment_method',
      header: 'Payment Method',
      defaultVisible: true,
      sortable: true,
      render: (paymentType: PaymentType) => (
        <div className="text-sm text-gray-600">
          {paymentType.payment_method ? paymentType.payment_method.name : 'N/A'}
        </div>
      )
    },
    {
      key: 'order_of_display',
      header: 'Display Order',
      defaultVisible: true,
      sortable: true,
      render: (paymentType: PaymentType) => (
        <div className="text-sm text-gray-900">{paymentType.order_of_display}</div>
      )
    },
    {
      key: 'default_account',
      header: 'Default Account',
      defaultVisible: true,
      sortable: true,
      render: (paymentType: PaymentType) => (
        <div className="text-sm text-gray-600">
          {paymentType.default_account ? `${paymentType.default_account.code} - ${paymentType.default_account.name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      defaultVisible: true,
      sortable: true,
      render: (paymentType: PaymentType) => getStatusBadge(paymentType)
    },
    {
      key: 'display_in_cashier_report',
      header: 'Cashier Report',
      defaultVisible: true,
      sortable: true,
      render: (paymentType: PaymentType) => (
        <StatusBadge 
          status={paymentType.display_in_cashier_report ? 'Yes' : 'No'} 
          variant={paymentType.display_in_cashier_report ? 'success' : 'error'} 
        />
      )
    },
    {
      key: 'used_in_banking',
      header: 'Banking',
      defaultVisible: true,
      sortable: true,
      render: (paymentType: PaymentType) => (
        <StatusBadge 
          status={paymentType.used_in_banking ? 'Yes' : 'No'} 
          variant={paymentType.used_in_banking ? 'success' : 'error'} 
        />
      )
    },
    {
      key: 'usage_flags',
      header: 'Usage',
      defaultVisible: false, // Hidden by default
      render: (paymentType: PaymentType) => (
        <div className="flex flex-wrap gap-1">
          {paymentType.used_in_sales && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Sales
            </span>
          )}
          {paymentType.used_in_debtor_payments && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Debtor
            </span>
          )}
          {paymentType.used_in_credit_payments && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Credit
            </span>
          )}
          {paymentType.used_in_customer_deposits && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Deposits
            </span>
          )}
          {paymentType.used_in_refunds && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Refunds
            </span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created Date',
      defaultVisible: false, // Hidden by default
      sortable: true,
      render: (paymentType: PaymentType) => (
        <div className="text-sm text-gray-900">
          {paymentType.created_at ? new Date(paymentType.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'created_by',
      header: 'Created By',
      defaultVisible: false, // Hidden by default
      sortable: true,
      render: (paymentType: PaymentType) => (
        <div className="text-sm text-gray-900">
          {paymentType.created_by_name || 'N/A'}
        </div>
      )
    },
    {
      key: 'updated_at',
      header: 'Updated Date',
      defaultVisible: false, // Hidden by default
      sortable: true,
      render: (paymentType: PaymentType) => (
        <div className="text-sm text-gray-900">
          {paymentType.updated_at ? new Date(paymentType.updated_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'updated_by',
      header: 'Updated By',
      defaultVisible: false, // Hidden by default
      sortable: true,
      render: (paymentType: PaymentType) => (
        <div className="text-sm text-gray-900">
          {paymentType.updated_by_name || 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true, // Required column
      render: (paymentType: PaymentType) => (
        <div className="flex items-center justify-end space-x-2">
          {canEditPaymentType(paymentType) && (
            <button
              onClick={() => handleEdit(paymentType)}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}
          {canTogglePaymentTypeStatus(paymentType) && (
            <button
              onClick={() => handleStatusToggle(paymentType)}
              className={`p-1 ${
                paymentType.is_active
                  ? 'text-red-600 hover:text-red-900'
                  : 'text-green-600 hover:text-green-900'
              }`}
              title={paymentType.is_active ? 'Deactivate payment type' : 'Activate payment type'}
            >
              {paymentType.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
            </button>
          )}
          {canDeletePaymentType(paymentType) && (
            <button
              onClick={() => handleDelete(paymentType)}
              className="text-red-600 hover:text-red-900 p-1"
              title="Delete"
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

      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <div className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" style={{animationDelay: '0ms'}}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">Total Payment Types</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : stats?.totalPaymentTypes || 0}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" style={{animationDelay: '100ms'}}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">Active Payment Types</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoadingStats ? '...' : stats?.activePaymentTypes || 0}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" style={{animationDelay: '200ms'}}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">Inactive Payment Types</p>
                  <p className="text-2xl font-bold text-red-600">
                    {isLoadingStats ? '...' : stats?.inactivePaymentTypes || 0}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" style={{animationDelay: '300ms'}}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">Last Updated</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {isLoadingStats ? '...' : stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full flex-shrink-0 ml-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search payment types by name, code, or payment method..."
              value={searchTerm}
              onChange={handleSearchChange}
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
          
          {/* Status Filter */}
          <div className="mt-4 flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Enhanced Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/administrative')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Administrative
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={handleExportExcel}
                    disabled={isLoading || totalItems === 0}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={isLoading || totalItems === 0}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText size={16} className="mr-2" />
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Payment Types Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading payment types...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={paymentTypes}
                columns={columns}
                emptyMessage="No payment types found matching your criteria."
                onSort={handleTableSort}
                sortable={true}
                showColumnControls={true}
                maxHeight={600}
              />

              {/* Pagination Controls */}
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
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-700">items</span>
                  </div>
                  <span className="text-sm text-gray-700">
                    Showing {totalItems === 0 ? 0 : Math.min((currentPage - 1) * pageSize + 1, totalItems)}-{totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems)} of {totalItems}
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
            </>
          )}
        </div>

        {/* Form Modal */}
        <PaymentTypeForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingPaymentType(undefined);
          }}
          onSubmit={handleFormSubmit}
          paymentType={editingPaymentType}
          isSubmitting={isCreating || isUpdating}
          paymentMethods={paymentMethods}
          accounts={accounts}
        />

        {/* Floating Action Button */}
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Add Payment Type"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </ContentContainer>
    </div>
  );
};

export default PaymentTypesPage;