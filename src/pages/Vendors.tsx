import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, Filter, FileText, FileSpreadsheet, Eye, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../components/Card';
import ContentContainer from '../components/ContentContainer';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import VendorForm from '../components/VendorForm';
import VendorView from '../components/VendorView';
import useVendorManagement from '../hooks/useVendorManagement';
import vendorGroupService from '../services/vendorGroupService';
import './Vendors.css';

const Vendors: React.FC = () => {
  const navigate = useNavigate();
  const {
    vendors,
    pagination,
    page,
    isLoading,
    isLoadingStats,
    stats,
    setPage,
    setLimit,
    handleSearch,
    handleStatusFilter,
    handleSort,
    createVendor,
    updateVendor,
    deleteVendor,
    exportExcel,
    exportPdf
  } = useVendorManagement();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [deletingVendor, setDeletingVendor] = useState<any>(null);

  const [vendorGroups, setVendorGroups] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    handleSearch(value);
  }, [handleSearch]);

  const handleStatusFilterChange = useCallback((status: 'all' | 'active' | 'inactive') => {
    handleStatusFilter(status);
  }, [handleStatusFilter]);

  const openDeleteModal = useCallback((vendor: any) => {
    setDeletingVendor(vendor);
  }, []);

  const closeDeleteModal = () => {
    setDeletingVendor(null);
  };

  const handleDeleteConfirm = async () => {
    if (deletingVendor) {
      await deleteVendor(deletingVendor.id);
      closeDeleteModal();
    }
  };

  React.useEffect(() => {
    (async () => {
      try {
        const groupsResp = await vendorGroupService.getVendorGroups(1, 1000, { search: '', status: 'all' } as any, { key: 'vendor_group_name', direction: 'asc' } as any);
        setVendorGroups(groupsResp.data || []);
      } catch {}
    })();
  }, []);

  const columns = useMemo(() => [
    {
      key: 'vendor_id',
      header: 'Vendor ID',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">
          {row.vendor_id}
        </span>
      )
    },
    {
      key: 'full_name',
      header: 'Full Name',
      sortable: true,
      render: (row: any) => (
        <div className="font-medium text-gray-900">{row.full_name}</div>
      )
    },
    {
      key: 'vendor_group_name',
      header: 'Vendor Group',
      sortable: true,
      render: (row: any) => (
        <div className="text-gray-700">{row.vendor_group_name || '-'}</div>
      )
    },
    {
      key: 'default_payable_account_name',
      header: 'Payable Account',
      sortable: true,
      render: (row: any) => (
        <div className="text-gray-700">{row.default_payable_account_name || '-'}</div>
      )
    },
    {
      key: 'phone_number',
      header: 'Phone',
      sortable: true,
      defaultVisible: false,
      render: (row: any) => (
        <div className="text-gray-700">{row.phone_number || '-'}</div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      defaultVisible: false,
      render: (row: any) => (
        <div className="text-gray-700">{row.email || '-'}</div>
      )
    },
    {
      key: 'website',
      header: 'Website',
      sortable: true,
      defaultVisible: false,
      render: (row: any) => (
        <div className="text-gray-700">{row.website || '-'}</div>
      )
    },
    {
      key: 'fax',
      header: 'Fax',
      sortable: true,
      defaultVisible: false,
      render: (row: any) => (
        <div className="text-gray-700">{row.fax || '-'}</div>
      )
    },
    {
      key: 'address',
      header: 'Address',
      sortable: true,
      defaultVisible: false,
      render: (row: any) => (
        <div className="text-gray-700 max-w-xs truncate" title={row.address || ''}>
          {row.address || '-'}
        </div>
      )
    },
    {
      key: 'account_balance',
      header: 'Account Balance',
      sortable: true,
      defaultVisible: true,
      render: (row: any) => (
        <div className="text-gray-900 font-medium">
          {row.account_balance !== undefined && row.account_balance !== null 
            ? new Intl.NumberFormat('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              }).format(parseFloat(row.account_balance))
            : '-'}
        </div>
      )
    },
    {
      key: 'debt_balance',
      header: 'Debt Balance',
      sortable: true,
      defaultVisible: true,
      render: (row: any) => (
        <div className="text-red-600 font-medium">
          {row.debt_balance !== undefined && row.debt_balance !== null 
            ? new Intl.NumberFormat('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              }).format(parseFloat(row.debt_balance))
            : '-'}
        </div>
      )
    },
    {
      key: 'deposit_balance',
      header: 'Deposit Balance',
      sortable: true,
      defaultVisible: true,
      render: (row: any) => (
        <div className="text-green-600 font-medium">
          {row.deposit_balance !== undefined && row.deposit_balance !== null 
            ? new Intl.NumberFormat('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              }).format(parseFloat(row.deposit_balance))
            : '-'}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (row: any) => (
        <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'created_by_name',
      header: 'Created By',
      sortable: true,
      render: (row: any) => (
        <div className="text-sm text-gray-600">
          <div className="font-medium">{row.created_by_name || 'System'}</div>
          <div className="text-xs text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'updated_by_name',
      header: 'Updated By',
      sortable: true,
      render: (row: any) => (
        <div className="text-sm text-gray-600">
          <div className="font-medium">{row.updated_by_name || 'Never'}</div>
          <div className="text-xs text-gray-500">{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); setViewing(row); }}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-150 table-button"
            title="View vendor details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(row); setShowForm(true); }}
            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors duration-150 table-button"
            title="Edit vendor"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openDeleteModal(row); }}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-150 table-button"
            title="Delete vendor"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ], [openDeleteModal]);

  const handleUpdate = async (data: any) => {
    if (editing) {
      await updateVendor(editing.id, data);
      setShowForm(false);
      setEditing(null);
    }
  };

  const handleCreate = async (data: any) => {
    await createVendor(data);
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.total || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.active || 0}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Inactive</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : stats?.inactive || 0}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                <Eye className="w-5 h-5 text-red-600" />
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
                <FileText className="w-5 h-5 text-purple-600" />
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
              placeholder="Search vendors by name or ID..."
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
              onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              defaultValue="all"
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
                onClick={() => navigate('/purchases')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Purchases
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={async () => {
                  try {
                    const blob = await exportExcel();
                    const url = URL.createObjectURL(new Blob([blob]));
                    const a = document.createElement('a');
                    a.href = url; 
                    a.download = 'vendors.xlsx'; 
                    a.click(); 
                    URL.revokeObjectURL(url);
                    toast.success('Vendors exported to Excel successfully');
                  } catch (error) {
                    toast.error('Failed to export vendors to Excel');
                  }
                }}
                disabled={isLoading || vendors.length === 0}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={async () => {
                  try {
                    const blob = await exportPdf();
                    const url = URL.createObjectURL(new Blob([blob]));
                    const a = document.createElement('a');
                    a.href = url; 
                    a.download = 'vendors.pdf'; 
                    a.click(); 
                    URL.revokeObjectURL(url);
                    toast.success('Vendors exported to PDF successfully');
                  } catch (error) {
                    toast.error('Failed to export vendors to PDF');
                  }
                }}
                disabled={isLoading || vendors.length === 0}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} className="mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Vendors Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading vendors...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={vendors}
                columns={columns as any}
                emptyMessage="No vendors found matching your criteria."
                onSort={handleSort}
                sortable={true}
                showColumnControls={true}
                maxHeight={600}
              />
            </>
          )}
        </div>

        {/* Pagination Controls - Only show when there are items */}
        {vendors && vendors.length > 0 && pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 animate-fadeIn">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="pageSizeSelect" className="text-sm text-gray-700">Show</label>
                <select
                  id="pageSizeSelect"
                  value={pagination?.itemsPerPage?.toString() || '10'}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
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
            {pagination?.totalPages ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((page || 1) - 1)}
                  disabled={(pagination?.currentPage || 1) === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination?.totalPages || 1) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min((pagination?.totalPages || 1) - 4, (pagination?.currentPage || 1) - 2)) + i;
                  if (pageNum > (pagination?.totalPages || 1)) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-100 transform hover:scale-105 ${
                        (pagination?.currentPage || 1) === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((page || 1) + 1)}
                  disabled={(pagination?.currentPage || 1) === (pagination?.totalPages || 1)}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Floating Action Button (FAB) */}
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="fab"
          title="Add Vendor"
        >
          <Plus className="w-6 h-6" />
        </button>

      </ContentContainer>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Vendor' : 'New Vendor'}
        size="lg"
      >
        <VendorForm
          initialValues={editing || undefined}
          vendorGroups={vendorGroups}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => setShowForm(false)}
          vendorId={editing?.id}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title="Vendor Details"
        size="lg"
      >
        {viewing && (
          <VendorView vendor={viewing} onClose={() => setViewing(null)} />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingVendor}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Vendor"
        message={`Are you sure you want to delete vendor "${deletingVendor?.full_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Vendors;
