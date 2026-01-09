import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download, ArrowLeft, Eye, Edit, Trash2, X, FileText, FileSpreadsheet, Building, CreditCard, DollarSign, TrendingUp, Users } from 'lucide-react';
import useAccountTypeManagement from '../hooks/useAccountTypeManagement';
import AccountTypeForm from '../components/AccountTypeForm';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ContentContainer from '../components/ContentContainer';
import { AccountType } from '../types';
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import './AccountTypes.css';

const AccountTypes: React.FC = () => {
  const navigate = useNavigate();
  const {
    accountTypes,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchTerm,
    sort,
    loadAccountTypes,
    createAccountType,
    updateAccountType,
    deleteAccountType,
    setSearchTerm,
    setSort,
    setPage,
    setPageSize,
    exportToExcel,
    exportToPDF,
    hasData,
    canCreate,
    canUpdate,
    canDelete,
    canExport
  } = useAccountTypeManagement();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingAccountType, setEditingAccountType] = useState<AccountType | null>(null);
  const [viewingAccountType, setViewingAccountType] = useState<AccountType | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  // Custom confirmation hook
  const { confirm } = useConfirm();

  // Load data on mount
  useEffect(() => {
    loadAccountTypes();
  }, [loadAccountTypes]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(debouncedSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearchTerm, setSearchTerm]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: any) => {
    try {
      if (editingAccountType) {
        await updateAccountType(editingAccountType.id, data);
      } else {
        await createAccountType(data);
      }
      setShowForm(false);
      setEditingAccountType(null);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [editingAccountType, createAccountType, updateAccountType]);

  // Handle edit
  const handleEdit = useCallback((accountType: AccountType) => {
    setEditingAccountType(accountType);
    setShowForm(true);
  }, []);

  // Handle view
  const handleView = useCallback((accountType: AccountType) => {
    setViewingAccountType(accountType);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (accountType: AccountType) => {
    const confirmed = await confirm({
      title: 'Delete Account Type',
      message: `Are you sure you want to delete "${accountType.name}"? This action cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await deleteAccountType(accountType.id);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [deleteAccountType, confirm]);

  // Handle sort
  const handleSort = useCallback((column: string) => {
    const newDirection = sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc';
    setSort({ column, direction: newDirection });
  }, [sort, setSort]);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, [setPageSize, setPage]);

  // Export functions
  const handleExportExcel = useCallback(() => {
    exportToExcel();
  }, [exportToExcel]);

  const handleExportPdf = useCallback(() => {
    exportToPDF();
  }, [exportToPDF]);

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'ASSET': <Building className="w-5 h-5 text-blue-600" />,
      'LIABILITY': <CreditCard className="w-5 h-5 text-red-600" />,
      'EQUITY': <DollarSign className="w-5 h-5 text-green-600" />,
      'REVENUE': <TrendingUp className="w-5 h-5 text-yellow-600" />,
      'EXPENSE': <Users className="w-5 h-5 text-purple-600" />
    };
    return icons[category] || <Building className="w-5 h-5 text-gray-600" />;
  };

  // Get sort arrow
  const getSortArrow = (column: string) => {
    if (sort.column !== column) return null;
    return sort.direction === 'asc' ? '↑' : '↓';
  };

  // Table columns configuration
  const columns = [
    {
      key: 'icon',
      header: 'Icon',
      visible: true, // Required column
      render: (accountType: any) => (
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
          {getCategoryIcon(accountType.category)}
        </div>
      )
    },
    {
      key: 'name',
      header: 'Name',
      visible: true, // Required column
      render: (accountType: any) => (
        <div className="text-sm font-medium text-gray-900">
          {accountType.name}
        </div>
      )
    },
    {
      key: 'code',
      header: 'Code',
      defaultVisible: true,
      render: (accountType: any) => (
        <div className="text-sm text-gray-900">
          {accountType.code}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      defaultVisible: true,
      render: (accountType: any) => (
        <div className="text-sm text-gray-900">
          {accountType.category}
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      defaultVisible: true,
      render: (accountType: any) => (
        <div className="text-sm text-gray-900">
          {accountType.description || 'N/A'}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      visible: true, // Required column
      render: (accountType: any) => (
        <StatusBadge status={accountType.is_active ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'createdBy',
      header: 'Created By',
      defaultVisible: false, // Hidden by default
      render: (accountType: any) => (
        <div className="text-sm text-gray-900">
          {accountType.creator ? `${accountType.creator.firstName} ${accountType.creator.lastName}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      defaultVisible: false, // Hidden by default
      render: (accountType: any) => (
        <div className="text-sm text-gray-900">
          {accountType.createdAt ? new Date(accountType.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedBy',
      header: 'Updated By',
      defaultVisible: false, // Hidden by default
      render: (accountType: any) => (
        <div className="text-sm text-gray-900">
          {accountType.updater ? `${accountType.updater.firstName} ${accountType.updater.lastName}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      defaultVisible: false, // Hidden by default
      render: (accountType: any) => (
        <div className="text-sm text-gray-900">
          {accountType.updatedAt ? new Date(accountType.updatedAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true, // Required column
      render: (accountType: any) => (
        <div className="flex items-center justify-end space-x-2">
          {canUpdate && (
            <button
              onClick={() => handleEdit(accountType)}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(accountType)}
              className="text-red-600 hover:text-red-900 p-1"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => handleView(accountType)}
            className="text-gray-600 hover:text-gray-900 p-1"
            title="View"
          >
            <Eye size={16} />
          </button>
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
              placeholder="Search by name, code, or description..."
              value={debouncedSearchTerm}
              onChange={(e) => setDebouncedSearchTerm(e.target.value)}
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

        {/* Enhanced Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/app-accounts/accounts')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Accounts
              </button>
            </div>
            <div className="flex items-center space-x-3">
            <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
            >
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
            </button>
            <button
                onClick={handleExportPdf}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105"
            >
              <FileText size={16} className="mr-2" />
                Export PDF
            </button>
            </div>
          </div>
        </div>

        {/* Enhanced Account Types Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
        {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading account types...</span>
          </div>
                ) : hasData ? (
            <>
              <DataTable
                data={accountTypes}
                columns={columns}
                emptyMessage="No account types found matching your criteria."
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
                    onClick={() => setPage(currentPage - 1)}
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
                        onClick={() => setPage(page)}
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
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 animate-fadeIn">
              <div className="text-gray-300 mb-6 animate-bounce">
                <i className="fas fa-layer-group text-8xl"></i>
            </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Account Types Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Get started by creating your first account type to build your chart of accounts structure.</p>
            {canCreate && (
              <button
                onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                  <Plus size={18} className="mr-2" />
                Add Account Type
              </button>
            )}
          </div>
        )}
        </div>
      </ContentContainer>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingAccountType ? 'Edit Account Type' : 'Add Account Type'}
              </h2>
              <AccountTypeForm
                accountType={editingAccountType || undefined}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingAccountType(null);
                }}
                isLoading={isCreating || isUpdating}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingAccountType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Account Type Details</h2>
                <button
                  onClick={() => setViewingAccountType(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-100"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingAccountType.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingAccountType.code}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <span className="mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {viewingAccountType.category}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nature</label>
                    <span className="mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {viewingAccountType.nature}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    viewingAccountType.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingAccountType.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {viewingAccountType.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingAccountType.description}</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewingAccountType(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-100 transform hover:scale-105"
                >
                  Close
                </button>
                {canUpdate && (
                  <button
                    onClick={() => {
                      setViewingAccountType(null);
                      handleEdit(viewingAccountType);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-all duration-100 transform hover:scale-105"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setShowForm(true)}
        className={`fab-button ${showForm || viewingAccountType ? 'hidden' : ''}`}
        title="Add Account Type"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default AccountTypes;