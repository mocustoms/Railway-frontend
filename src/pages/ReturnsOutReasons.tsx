import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  RotateCcw
} from 'lucide-react';
import { useReturnsOutReasonManagement } from '../hooks/useReturnsOutReasonManagement';
import { ReturnReason, ReturnReasonSortConfig } from '../types';
import { returnTypeConfig, returnReasonStatusConfig, approvalConfig } from '../data/returnsOutReasonModules';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ReturnsOutReasonForm from '../components/ReturnsOutReasonForm';
import ReturnsOutReasonView from '../components/ReturnsOutReasonView';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatDate } from '../utils/formatters';
import './ReturnsOutReasons.css';

const ReturnsOutReasons: React.FC = () => {
  const navigate = useNavigate();
  const {
    returnsOutReasons,
    stats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    statsError,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    createReturnsOutReason,
    updateReturnsOutReason,
    deleteReturnsOutReason,
    exportToExcel,
    exportToPDF,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    filters,
    sortConfig
  } = useReturnsOutReasonManagement();

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReturnReason, setSelectedReturnReason] = useState<ReturnReason | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Computed values
  const showingStart = useMemo(() => {
    if (totalItems === 0) return 0;
    return (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);

  const showingEnd = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  // Handlers
  const handleCreate = () => {
    setModalMode('create');
    setSelectedReturnReason(null);
    setIsModalOpen(true);
  };

  const handleEdit = (returnReason: ReturnReason) => {
    setModalMode('edit');
    setSelectedReturnReason(returnReason);
    setIsModalOpen(true);
  };

  const handleView = (returnReason: ReturnReason) => {
    setSelectedReturnReason(returnReason);
    setIsViewModalOpen(true);
  };

  const handleDelete = (returnReason: ReturnReason) => {
    setSelectedReturnReason(returnReason);
    setIsDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReturnReason(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedReturnReason(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedReturnReason) {
      await deleteReturnsOutReason(selectedReturnReason.id);
      setIsDeleteModalOpen(false);
      setSelectedReturnReason(null);
    }
  };

  const handleFormSubmit = async (data: Partial<ReturnReason>) => {
    if (modalMode === 'create') {
      await createReturnsOutReason(data);
    } else if (selectedReturnReason) {
      await updateReturnsOutReason(selectedReturnReason.id, data);
    }
    handleModalClose();
  };

  // Table columns configuration
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Reason Name',
      sortable: true,
      render: (returnReason: ReturnReason) => (
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{returnReason.name}</div>
            <div className="text-sm text-gray-500 font-mono">{returnReason.code}</div>
          </div>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (returnReason: ReturnReason) => (
        <span className="text-gray-600">
          {returnReason.description || '-'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'returnType',
      header: 'Return Type',
      sortable: true,
      render: (returnReason: ReturnReason) => {
        const config = {
          [returnReason.returnType]: returnTypeConfig[returnReason.returnType]
        };
        return (
          <StatusBadge
            status={returnReason.returnType}
            config={config}
          />
        );
      },
      defaultVisible: true
    },
    {
      key: 'requiresApproval',
      header: 'Approval Required',
      sortable: true,
      render: (returnReason: ReturnReason) => {
        const approvalStatus = returnReason.requiresApproval ? 'true' : 'false';
        const config = {
          [approvalStatus]: approvalConfig[approvalStatus]
        };
        return (
          <StatusBadge
            status={approvalStatus}
            config={config}
          />
        );
      },
      defaultVisible: true
    },
    {
      key: 'maxReturnDays',
      header: 'Max Return Days',
      sortable: true,
      render: (returnReason: ReturnReason) => (
        <span className="text-gray-600">
          {returnReason.maxReturnDays ? `${returnReason.maxReturnDays} days` : 'No limit'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'refundAccount',
      header: 'Refund Account',
      sortable: true,
      defaultVisible: false,
      render: (returnReason: ReturnReason) => (
        <span className="text-gray-600">
          {returnReason.refundAccount ? (
            <div>
              <div className="font-medium text-gray-900">{returnReason.refundAccount.name}</div>
              <div className="text-sm text-gray-500 font-mono">{returnReason.refundAccount.code}</div>
            </div>
          ) : (
            <span className="text-gray-400 italic">Not assigned</span>
          )}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (returnReason: ReturnReason) => {
        const status = returnReason.isActive ? 'active' : 'inactive';
        const config = {
          [status]: returnReasonStatusConfig[status]
        };
        return (
          <StatusBadge
            status={status}
            config={config}
          />
        );
      },
      defaultVisible: true
    },
    {
      key: 'createdBy',
      header: 'Created By',
      sortable: true,
      render: (returnReason: ReturnReason) => (
        <span className="text-gray-600">
          {returnReason.createdByUserReturnReason ? (
            `${returnReason.createdByUserReturnReason.first_name} ${returnReason.createdByUserReturnReason.last_name}`
          ) : (
            'System'
          )}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      render: (returnReason: ReturnReason) => (
        <span className="text-gray-600">
          {formatDate(returnReason.createdAt)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (returnReason: ReturnReason) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(returnReason)}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(returnReason)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(returnReason)}
              title="Delete"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      defaultVisible: true
    }
  ], [canEdit, canDelete]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ContentContainer>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium">Error loading returns out reasons</h3>
              <p className="text-red-600 mt-1">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </ContentContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Reasons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.total || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <RotateCcw className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Reasons</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.active || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Requires Approval</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : stats?.requiresApproval || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                <RotateCcw className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Full Refunds</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.fullRefund || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <RotateCcw className="w-5 h-5 text-green-600" />
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
              placeholder="Search returns out reasons by name, code, or description..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {filters.search && (
              <button
                onClick={() => handleSearch('')}
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
                onClick={() => navigate('/purchases')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Purchases
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={exportToExcel}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={exportToPDF}
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

        {/* Enhanced Returns Out Reasons Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading returns out reasons...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={returnsOutReasons}
                columns={columns}
                emptyMessage="No returns out reasons found matching your criteria."
                showColumnControls={true}
                maxHeight={600}
                onSort={(key, direction) => handleSort(key as ReturnReasonSortConfig['field'], direction)}
                sortable={true}
                initialSortState={{ key: sortConfig.field, direction: sortConfig.direction }}
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
            </>
          )}
        </div>
      </ContentContainer>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={`${modalMode === 'create' ? 'Add' : 'Edit'} Returns Out Reason`}
        size="lg"
      >
        <ReturnsOutReasonForm
          returnReason={selectedReturnReason}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        title="Returns Out Reason Details"
        size="lg"
      >
        {selectedReturnReason && (
          <ReturnsOutReasonView
            returnReason={selectedReturnReason}
            onEdit={() => {
              setIsViewModalOpen(false);
              handleEdit(selectedReturnReason);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Returns Out Reason"
        message={`Are you sure you want to delete "${selectedReturnReason?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Floating Action Button (FAB) */}
      {canCreate && (
        <button
          onClick={handleCreate}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
          title="Add Returns Out Reason"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ReturnsOutReasons;
