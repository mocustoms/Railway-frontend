import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Plus, FileText, FileSpreadsheet, ArrowLeft, Eye, Edit, Trash2, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import useReturnsOutManagement from '../hooks/useReturnsOutManagement';
import { ReturnsOut as ReturnsOutType } from '../services/returnsOutService';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ReturnsOutForm from '../components/ReturnsOutForm';
import ReturnsOutView from '../components/ReturnsOutView';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatDate } from '../utils/formatters';
import './ReturnsOut.css';

const ReturnsOut: React.FC = () => {
  const navigate = useNavigate();
  const {
    returnsOut,
    pagination,
    page,
    limit,
    isLoading,
    stats,
    isLoadingStats,
    handleSearch,
    handleStatusFilter,
    handleSort,
    setPage,
    setLimit,
    createReturnsOut,
    updateReturnsOut,
    deleteReturnsOut,
    approveReturnsOut,
    completeReturnsOut,
    cancelReturnsOut,
    exportExcel,
    exportPdf
  } = useReturnsOutManagement();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReturnsOut, setSelectedReturnsOut] = useState<ReturnsOutType | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const showingStart = useMemo(() => {
    if (!pagination || pagination.totalItems === 0) return 0;
    return (page - 1) * limit + 1;
  }, [page, limit, pagination]);

  const showingEnd = useMemo(() => {
    if (!pagination || pagination.totalItems === 0) return 0;
    return Math.min(page * limit, pagination.totalItems);
  }, [page, limit, pagination]);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedReturnsOut(null);
    setIsModalOpen(true);
  };

  const handleEdit = (returnsOut: ReturnsOutType) => {
    setModalMode('edit');
    setSelectedReturnsOut(returnsOut);
    setIsModalOpen(true);
  };

  const handleView = (returnsOut: ReturnsOutType) => {
    setSelectedReturnsOut(returnsOut);
    setIsViewModalOpen(true);
  };

  const handleDelete = (returnsOut: ReturnsOutType) => {
    setSelectedReturnsOut(returnsOut);
    setIsDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReturnsOut(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedReturnsOut(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedReturnsOut) {
      await deleteReturnsOut(selectedReturnsOut.id);
      setIsDeleteModalOpen(false);
      setSelectedReturnsOut(null);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (modalMode === 'create') {
      await createReturnsOut(data);
    } else if (selectedReturnsOut) {
      await updateReturnsOut(selectedReturnsOut.id, data);
    }
    handleModalClose();
  };

  const handleApprove = async (returnsOut: ReturnsOutType) => {
    await approveReturnsOut(returnsOut.id);
  };

  const handleComplete = async (returnsOut: ReturnsOutType) => {
    await completeReturnsOut(returnsOut.id);
  };

  const handleCancel = async (returnsOut: ReturnsOutType) => {
    await cancelReturnsOut(returnsOut.id);
  };

  const columns = useMemo(() => [
    {
      key: 'return_ref_number',
      header: 'Return Ref',
      sortable: true,
      render: (row: ReturnsOutType) => (
        <span className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">
          {row.return_ref_number}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'return_date',
      header: 'Return Date',
      sortable: true,
      render: (row: ReturnsOutType) => (
        <span className="text-gray-700">{formatDate(row.return_date)}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'vendor_name',
      header: 'Vendor',
      sortable: true,
      render: (row: ReturnsOutType) => (
        <div>
          <div className="font-medium text-gray-900">{row.vendor_name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.vendor_code || ''}</div>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'store_name',
      header: 'Store',
      sortable: true,
      render: (row: ReturnsOutType) => (
        <span className="text-gray-700">{row.store_name || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'return_reason_name',
      header: 'Reason',
      sortable: false,
      render: (row: ReturnsOutType) => (
        <span className="text-gray-700">{row.return_reason_name || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      render: (row: ReturnsOutType) => (
        <span className="text-gray-900 font-medium">
          {parseFloat(row.total_amount.toString()).toFixed(2)}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'refund_amount',
      header: 'Refund Amount',
      sortable: true,
      render: (row: ReturnsOutType) => (
        <span className="text-green-600 font-medium">
          {parseFloat(row.refund_amount.toString()).toFixed(2)}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: ReturnsOutType) => (
        <StatusBadge status={row.status} />
      ),
      defaultVisible: true
    },
    {
      key: 'refund_status',
      header: 'Refund Status',
      sortable: true,
      render: (row: ReturnsOutType) => (
        <StatusBadge status={row.refund_status} />
      ),
      defaultVisible: true
    },
    {
      key: 'created_by_name',
      header: 'Created By',
      sortable: true,
      render: (row: ReturnsOutType) => (
        <div className="text-sm text-gray-600">
          <div className="font-medium">{row.created_by_name || 'System'}</div>
          <div className="text-xs text-gray-500">{formatDate(row.created_at)}</div>
        </div>
      ),
      defaultVisible: false
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: ReturnsOutType) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(row)}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {row.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row)}
              title="Delete"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {(row.status === 'draft' || row.status === 'pending') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleApprove(row)}
              title="Approve"
              className="text-green-600 hover:text-green-700"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          {row.status === 'approved' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleComplete(row)}
              title="Complete"
              className="text-blue-600 hover:text-blue-700"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          {row.status !== 'completed' && row.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancel(row)}
              title="Cancel"
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      defaultVisible: true
    }
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <ContentContainer>
        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Returns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.total || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <RotateCcw className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.completed || 0}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {isLoadingStats ? '...' : stats?.pending || 0}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0 ml-3">
                <RotateCcw className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Refund</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : parseFloat((stats?.totalRefundAmount || 0).toString()).toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
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
              placeholder="Search returns by reference number or notes..."
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
          </div>
        </div>

        {/* Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/purchases')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
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
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'returns-out.xlsx';
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Export failed:', error);
                  }
                }}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 disabled:opacity-50"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={async () => {
                  try {
                    const blob = await exportPdf();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'returns-out.pdf';
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Export failed:', error);
                  }
                }}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
              >
                <FileText size={16} className="mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading returns...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={returnsOut}
                columns={columns as any}
                emptyMessage="No returns found matching your criteria."
                showColumnControls={true}
                maxHeight={600}
                onSort={(key, direction) => handleSort(key, direction)}
                sortable={true}
              />

              {/* Pagination */}
              {pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="pageSizeSelect" className="text-sm text-gray-700">Show</label>
                      <select
                        id="pageSizeSelect"
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-700">items</span>
                    </div>
                    <span className="text-sm text-gray-700">
                      Showing {showingStart}-{showingEnd} of {pagination.totalItems}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                      if (p > pagination.totalPages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-4 py-2 border text-sm font-medium ${
                            page === p
                              ? 'bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                      className="px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ContentContainer>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={`${modalMode === 'create' ? 'Create' : 'Edit'} Return Out`}
        size="lg"
      >
        <ReturnsOutForm
          returnsOut={selectedReturnsOut}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isLoading={isLoading}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        title="Return Out Details"
        size="lg"
      >
        {selectedReturnsOut && (
          <ReturnsOutView
            returnsOut={selectedReturnsOut}
            onClose={handleViewModalClose}
            onEdit={() => {
              setIsViewModalOpen(false);
              handleEdit(selectedReturnsOut);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Return"
        message={`Are you sure you want to delete return "${selectedReturnsOut?.return_ref_number}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* FAB */}
      <button
        onClick={handleCreate}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
        title="Create Return"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ReturnsOut;
