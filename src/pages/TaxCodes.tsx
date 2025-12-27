import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  X, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Receipt, 
  CheckCircle, 
  XCircle, 
  FileText, 
  FileSpreadsheet,
  DollarSign
} from 'lucide-react';
import { useTaxCodeManagement } from '../hooks/useTaxCodeManagement';
import TaxCodeForm from '../components/TaxCodeForm';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ContentContainer from '../components/ContentContainer';
import { TaxCode } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useConfirm } from '../hooks/useConfirm';
import './TaxCodes.css';

const TaxCodesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    taxCodes,
    stats,
    accounts,
    isLoading,
    isCreating,
    isUpdating,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    createTaxCode,
    updateTaxCode,
    deleteTaxCode,
    toggleTaxCodeStatus,
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canExport,
    exportToExcel,
    exportToPDF
  } = useTaxCodeManagement();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingTaxCode, setEditingTaxCode] = useState<TaxCode | undefined>(undefined);
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
      if (editingTaxCode) {
        await updateTaxCode(editingTaxCode.id, data);
      } else {
        await createTaxCode(data);
      }
      setShowForm(false);
      setEditingTaxCode(undefined);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [editingTaxCode, createTaxCode, updateTaxCode]);

  // Handle add button click
  const handleAdd = useCallback(() => {
    setEditingTaxCode(undefined); // Ensure editing state is cleared
    setShowForm(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((taxCode: TaxCode) => {
    setEditingTaxCode(taxCode);
    setShowForm(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (taxCode: TaxCode) => {
    const confirmed = await confirm({
      title: 'Delete Tax Code',
      message: `Are you sure you want to delete "${taxCode.name}"? This action cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await deleteTaxCode(taxCode.id);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [deleteTaxCode, confirm]);

  // Handle status toggle
  const handleStatusToggle = useCallback(async (taxCode: TaxCode) => {
    const action = taxCode.is_active ? 'deactivate' : 'activate';
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Tax Code`,
      message: `Are you sure you want to ${action} "${taxCode.name}"?`,
      confirmText: `Yes, ${action}`,
      cancelText: 'Cancel',
      type: 'warning'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await toggleTaxCodeStatus(taxCode.id, !taxCode.is_active);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [toggleTaxCodeStatus, confirm]);

  // Handle search change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

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
  const getStatusBadge = (taxCode: TaxCode) => {
    return (
      <StatusBadge
        status={taxCode.is_active ? 'Active' : 'Inactive'}
        variant={taxCode.is_active ? 'success' : 'error'}
      />
    );
  };

  const canDeleteTaxCode = (taxCode: TaxCode) => {
    return canDelete && taxCode.is_active;
  };

  const canEditTaxCode = (taxCode: TaxCode) => {
    return canEdit;
  };

  const canToggleTaxCodeStatus = (taxCode: TaxCode) => {
    return canToggleStatus;
  };

  // Table columns configuration
  const columns = [
    {
      key: 'code',
      header: 'Code',
      defaultVisible: true,
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-900 font-medium">{taxCode.code}</div>
      )
    },
    {
      key: 'name',
      header: 'Tax Name',
      defaultVisible: true,
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-900">{taxCode.name}</div>
      )
    },
    {
      key: 'rate',
      header: 'Rate (%)',
      defaultVisible: true,
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-900">
          {typeof taxCode.rate === 'number' ? taxCode.rate.toFixed(2) : parseFloat(taxCode.rate || '0').toFixed(2)}%
        </div>
      )
    },
    {
      key: 'indicator',
      header: 'Indicator',
      defaultVisible: true,
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-600">{taxCode.indicator || 'N/A'}</div>
      )
    },
    {
      key: 'efd_department_code',
      header: 'EFD Department Code',
      defaultVisible: false, // Hidden by default
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-600">{taxCode.efd_department_code || 'N/A'}</div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      defaultVisible: true,
      render: (taxCode: TaxCode) => getStatusBadge(taxCode)
    },
    {
      key: 'is_wht',
      header: 'WHT',
      defaultVisible: true,
      render: (taxCode: TaxCode) => (
        <div className="flex items-center">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            taxCode.is_wht 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {taxCode.is_wht ? 'Yes' : 'No'}
          </span>
        </div>
      )
    },
    {
      key: 'salesTaxAccount',
      header: 'Sales Tax Account',
      defaultVisible: true,
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-600">
          {taxCode.salesTaxAccount ? `${taxCode.salesTaxAccount.code} - ${taxCode.salesTaxAccount.name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'purchasesTaxAccount',
      header: 'Purchases Tax Account',
      defaultVisible: true,
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-600">
          {taxCode.purchasesTaxAccount ? `${taxCode.purchasesTaxAccount.code} - ${taxCode.purchasesTaxAccount.name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'createdBy',
      header: 'Created By',
      defaultVisible: false, // Hidden by default
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-900">
          {taxCode.creator ? `${taxCode.creator.first_name} ${taxCode.creator.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      defaultVisible: false, // Hidden by default
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-900">
          {taxCode.created_at ? new Date(taxCode.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedBy',
      header: 'Updated By',
      defaultVisible: false, // Hidden by default
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-900">
          {taxCode.updater ? `${taxCode.updater.first_name} ${taxCode.updater.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      defaultVisible: false, // Hidden by default
      render: (taxCode: TaxCode) => (
        <div className="text-sm text-gray-900">
          {taxCode.updated_at ? new Date(taxCode.updated_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true, // Required column
      render: (taxCode: TaxCode) => (
        <div className="flex items-center justify-end space-x-2">
          {canEditTaxCode(taxCode) && (
            <button
              onClick={() => handleEdit(taxCode)}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}
          {canToggleTaxCodeStatus(taxCode) && (
            <button
              onClick={() => handleStatusToggle(taxCode)}
              className={`p-1 ${
                taxCode.is_active
                  ? 'text-red-600 hover:text-red-900'
                  : 'text-green-600 hover:text-green-900'
              }`}
              title={taxCode.is_active ? 'Deactivate tax code' : 'Activate tax code'}
            >
              {taxCode.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
            </button>
          )}
          {canDeleteTaxCode(taxCode) && (
            <button
              onClick={() => handleDelete(taxCode)}
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

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tax codes by name, code, or rate..."
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
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-slideInUp">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tax Codes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTaxCodes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tax Codes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeTaxCodes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Tax Codes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inactiveTaxCodes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {typeof stats.averageRate === 'number' ? stats.averageRate.toFixed(2) : parseFloat(stats.averageRate || '0').toFixed(2)}%
                </p>
              </div>
            </div>
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
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105"
                  >
                    <FileText size={16} className="mr-2" />
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Tax Codes Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading tax codes...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={taxCodes}
                columns={columns}
                emptyMessage="No tax codes found matching your criteria."
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
        <TaxCodeForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingTaxCode(undefined);
          }}
          onSubmit={handleFormSubmit}
          taxCode={editingTaxCode}
          isSubmitting={isCreating || isUpdating}
          accounts={accounts}
        />

        {/* Floating Action Button */}
        {canCreate && (
          <button
            onClick={handleAdd}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Add Tax Code"
          >
            <Plus className="w-6 h-6" />
          </button>
                 )}
       </ContentContainer>
     </div>
   );
 };

export default TaxCodesPage; 