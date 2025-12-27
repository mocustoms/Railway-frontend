import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  X,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Star
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ContentContainer from '../components/ContentContainer';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomerGroupForm from '../components/CustomerGroupForm';
import { useCustomerGroupManagement } from '../hooks/useCustomerGroupManagement';
import { CustomerGroup } from '../services/customerGroupService';
import './CustomerGroups.css';

const CustomerGroups: React.FC = () => {
  const navigate = useNavigate();
  const {
    stats,
    customerGroups,
    accounts,
    liabilityAccounts,
    pagination,
    filters,
    sortConfig,
    isLoadingStats,
    isLoadingCustomerGroups,
    isLoadingAccounts,
    isLoadingLiabilityAccounts,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
    isCheckingUsage,
    isExportingExcel,
    isExportingPdf,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    handleFilter,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    createCustomerGroup,
    updateCustomerGroup,
    deleteCustomerGroup,
    toggleCustomerGroupStatus,
    checkCustomerGroupUsage,
    exportToExcel,
    exportToPdf
  } = useCustomerGroupManagement();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomerGroup, setEditingCustomerGroup] = useState<CustomerGroup | null>(null);
  const [deletingCustomerGroup, setDeletingCustomerGroup] = useState<CustomerGroup | null>(null);
  const [viewingCustomerGroup, setViewingCustomerGroup] = useState<CustomerGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    handleFilter({ search: value });
  }, [handleFilter]);

  const handleStatusFilterChange = useCallback((status: 'all' | 'active' | 'inactive') => {
    handleFilter({ status });
  }, [handleFilter]);

  const handleFormSubmit = async (data: any) => {
    if (editingCustomerGroup) {
      await updateCustomerGroup(editingCustomerGroup.id, data);
    } else {
      await createCustomerGroup(data);
    }
    setIsFormOpen(false);
    setEditingCustomerGroup(null);
  };

  const handleEdit = (customerGroup: CustomerGroup) => {
    setEditingCustomerGroup(customerGroup);
    setIsFormOpen(true);
  };

  const handleView = (customerGroup: CustomerGroup) => {
    setViewingCustomerGroup(customerGroup);
  };

  const handleDelete = async (customerGroup: CustomerGroup) => {
    try {
      const usage = await checkCustomerGroupUsage(customerGroup.id);
      if (usage.isUsed) {
        alert(`Cannot delete this customer group as it is being used by ${usage.usageCount} customer(s).`);
        return;
      }
      setDeletingCustomerGroup(customerGroup);
      } catch (error) {
        
      }
  };

  const confirmDelete = async () => {
    if (deletingCustomerGroup) {
      await deleteCustomerGroup(deletingCustomerGroup.id);
      setDeletingCustomerGroup(null);
    }
  };

  const handleStatusToggle = async (customerGroup: CustomerGroup) => {
    await toggleCustomerGroupStatus(customerGroup.id);
  };

  const columns = useMemo(() => [
    {
      key: 'group_name' as keyof CustomerGroup,
      header: 'Group Name',
      sortable: true,
      render: (customerGroup: CustomerGroup) => (
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-blue-100 rounded">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-medium text-gray-900">{customerGroup.group_name}</div>
          {customerGroup.is_default && (
            <span title="Default Group">
              <Star className="w-4 h-4 text-yellow-500" />
            </span>
          )}
        </div>
      )
    },
    {
      key: 'group_code' as keyof CustomerGroup,
      header: 'Group Code',
      sortable: true,
      render: (customerGroup: CustomerGroup) => (
        <div className="font-mono text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
          {customerGroup.group_code}
        </div>
      )
    },
    {
      key: 'description' as keyof CustomerGroup,
      header: 'Description',
      render: (customerGroup: CustomerGroup) => (
        <div className="max-w-xs truncate text-gray-600">
          {customerGroup.description || '-'}
        </div>
      )
    },
    {
      key: 'is_active' as keyof CustomerGroup,
      header: 'Status',
      sortable: true,
      render: (customerGroup: CustomerGroup) => (
        <StatusBadge 
          status={customerGroup.is_active ? 'active' : 'inactive'}
        />
      )
    },
    {
      key: 'account_receivable_name' as keyof CustomerGroup,
      header: 'Account Receivable',
      sortable: true,
      defaultVisible: false,
      render: (customerGroup: CustomerGroup) => (
        <div className="text-sm text-gray-600">
          {customerGroup.account_receivable_name || '-'}
        </div>
      )
    },
    {
      key: 'default_liability_account_name' as keyof CustomerGroup,
      header: 'Liability Account',
      sortable: true,
      defaultVisible: false,
      render: (customerGroup: CustomerGroup) => (
        <div className="text-sm text-gray-600">
          {customerGroup.default_liability_account_name || '-'}
        </div>
      )
    },
    {
      key: 'created_at' as keyof CustomerGroup,
      header: 'Created',
      sortable: true,
      render: (customerGroup: CustomerGroup) => (
        <div className="text-sm text-gray-600">
          {new Date(customerGroup.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'updated_at' as keyof CustomerGroup,
      header: 'Updated',
      sortable: true,
      hidden: true,
      render: (customerGroup: CustomerGroup) => (
        <div className="text-sm text-gray-600">
          {new Date(customerGroup.updated_at).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'created_by' as keyof CustomerGroup,
      header: 'Created By',
      sortable: true,
      hidden: true,
      render: (customerGroup: CustomerGroup) => (
        <div className="text-sm text-gray-600">
          {customerGroup.creator ? (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">
                  {customerGroup.creator.first_name?.charAt(0)}{customerGroup.creator.last_name?.charAt(0)}
                </span>
              </div>
              <div className="font-medium">{customerGroup.creator.first_name} {customerGroup.creator.last_name}</div>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'updated_by' as keyof CustomerGroup,
      header: 'Updated By',
      sortable: true,
      defaultVisible: false,
      render: (customerGroup: CustomerGroup) => (
        <div className="text-sm text-gray-600">
          {customerGroup.updater ? (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-green-600">
                  {customerGroup.updater.first_name?.charAt(0)}{customerGroup.updater.last_name?.charAt(0)}
                </span>
              </div>
              <div className="font-medium">{customerGroup.updater.first_name} {customerGroup.updater.last_name}</div>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (customerGroup: CustomerGroup) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleView(customerGroup)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-150 table-button"
            title="View product details"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          {canUpdate && (
            <button
              onClick={() => handleEdit(customerGroup)}
              className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors duration-150 table-button"
              title="Edit product"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          
          {canUpdate && (
            <button
              onClick={() => handleStatusToggle(customerGroup)}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors duration-150 table-button"
              title={customerGroup.is_active ? "Deactivate" : "Activate"}
              disabled={isTogglingStatus}
            >
              {customerGroup.is_active ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={() => handleDelete(customerGroup)}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-150 table-button"
              title="Delete product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ], [canUpdate, canDelete, isTogglingStatus]);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Groups</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalGroups || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Groups</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.activeGroups || 0}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Default Groups</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {isLoadingStats ? '...' : stats?.defaultGroups || 0}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0 ml-3">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
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
              placeholder="Search customer groups by name or code..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
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
                onClick={() => navigate('/sales')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Sales
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={exportToExcel}
                    disabled={isLoadingCustomerGroups || customerGroups.length === 0}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={exportToPdf}
                    disabled={isLoadingCustomerGroups || customerGroups.length === 0}
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

        {/* Enhanced Customer Groups Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoadingCustomerGroups ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading customer groups...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={customerGroups}
                columns={columns}
                emptyMessage="No customer groups found matching your criteria."
                onSort={handleSort}
                sortable={true}
                showColumnControls={true}
                maxHeight={600}
              />

              {/* Pagination Controls - Always show when there are items */}
              {customerGroups && customerGroups.length > 0 && pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 animate-fadeIn">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="pageSizeSelect" className="text-sm text-gray-700">Show</label>
                      <select
                        id="pageSizeSelect"
                        value={pagination?.itemsPerPage?.toString() || '10'}
                        onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
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
                      Showing {pagination?.totalItems ? ((pagination?.currentPage || 1) - 1) * (pagination?.itemsPerPage || 10) + 1 : 0}-{pagination?.totalItems ? Math.min((pagination?.currentPage || 1) * (pagination?.itemsPerPage || 10), pagination?.totalItems) : 0} of {pagination?.totalItems || 0}
                    </span>
                  </div>
                  {/* Page navigation - always show */}
                  {pagination?.totalPages ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange((pagination?.currentPage || 1) - 1)}
                        disabled={(pagination?.currentPage || 1) === 1}
                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-md"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, pagination?.totalPages || 1) }, (_, i) => {
                        const page = Math.max(1, Math.min((pagination?.totalPages || 1) - 4, (pagination?.currentPage || 1) - 2)) + i;
                        if (page > (pagination?.totalPages || 1)) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 rounded-md ${
                              (pagination?.currentPage || 1) === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange((pagination?.currentPage || 1) + 1)}
                        disabled={(pagination?.currentPage || 1) === (pagination?.totalPages || 1)}
                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-md"
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Action Button (FAB) */}
        {canCreate && (
          <button
            onClick={() => {
              setEditingCustomerGroup(null);
              setIsFormOpen(true);
            }}
            className="fab"
            title="Add Customer Group"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </ContentContainer>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomerGroup(null);
        }}
        title={editingCustomerGroup ? 'Edit Customer Group' : 'Add Customer Group'}
        size="lg"
      >
        <CustomerGroupForm
          customerGroup={editingCustomerGroup || undefined}
          accounts={accounts || []}
          liabilityAccounts={liabilityAccounts || []}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCustomerGroup(null);
          }}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingCustomerGroup}
        onClose={() => setDeletingCustomerGroup(null)}
        onConfirm={confirmDelete}
        title="Delete Customer Group"
        message={`Are you sure you want to delete "${deletingCustomerGroup?.group_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* View Modal */}
      {viewingCustomerGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Customer Group Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingCustomerGroup(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Name</label>
                <p className="mt-1 text-sm text-gray-900">{viewingCustomerGroup.group_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Code</label>
                <p className="mt-1 text-sm text-gray-900">{viewingCustomerGroup.group_code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Group</label>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingCustomerGroup.is_default ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingCustomerGroup.description || 'No description'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <StatusBadge 
                  status={viewingCustomerGroup.is_active ? 'active' : 'inactive'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Receivable</label>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingCustomerGroup.account_receivable_name || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Liability Account</label>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingCustomerGroup.default_liability_account_name || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(viewingCustomerGroup.created_at).toLocaleDateString()} by{' '}
                  {viewingCustomerGroup.creator?.first_name} {viewingCustomerGroup.creator?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setViewingCustomerGroup(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerGroups;
