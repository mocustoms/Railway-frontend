import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Truck,
  User,
  Store,
  CheckCircle,
  Clock,
  Package,
  XCircle,
  Calendar,
  Filter,
  AlertCircle,
  Send
} from 'lucide-react';
import { useStoreRequestManagement } from '../hooks/useStoreRequestManagement';
import { useAuth } from '../contexts/AuthContext';
import { StoreRequest as StoreRequestType } from '../types';
import { storeRequestModuleConfig } from '../data/storeRequestModules';
import { storeRequestService } from '../services/storeRequestService';
import { toast } from 'react-hot-toast';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import StoreRequestForm from '../components/StoreRequestForm';
import StoreRequestView from '../components/StoreRequestView';
import StoreRequestApprovalModal from '../components/StoreRequestApprovalModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import './StoreRequests.css';

const StoreRequests: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Calculate responsive modal size based on sidebar state
  const getModalSize = (): "sm" | "md" | "lg" | "xl" | "2xl" | "full" => {
    return "2xl"; // Use consistent 2xl size for both collapsed and expanded sidebar
  };
  
  const {
    storeRequests,
    stats,
    stores,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isSubmitting,
    isApproving,
    isRejecting,
    isFulfilling,
    isCancelling,
    isExportingExcel,
    isExportingPdf,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    handleManualFetch,
    handleDateFilterChange,
    createStoreRequest,
    updateStoreRequest,
    deleteStoreRequest,
    submitStoreRequest,
    approveStoreRequest,
    rejectStoreRequest,
    fulfillStoreRequest,
    cancelStoreRequest,
    exportToExcel,
    exportToPDF,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canExport,
    filters,
    searchTerm
  } = useStoreRequestManagement();

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedStoreRequest, setSelectedStoreRequest] = useState<StoreRequestType | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deletingStoreRequest, setDeletingStoreRequest] = useState<StoreRequestType | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled'>('all');

  // Modal handlers
  const openCreateModal = () => {
    setSelectedStoreRequest(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = async (storeRequest: StoreRequestType) => {
    try {
      // Fetch the complete store request with all associations
      const completeStoreRequest = await storeRequestService.getStoreRequest(storeRequest.id);
      setSelectedStoreRequest(completeStoreRequest);
      setModalMode('edit');
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load store request data');
    }
  };

  const openViewModal = async (storeRequest: StoreRequestType) => {
    try {
      // Fetch the complete store request with all associations
      const completeStoreRequest = await storeRequestService.getStoreRequest(storeRequest.id);
      setSelectedStoreRequest(completeStoreRequest);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load store request data');
    }
  };

  const openDeleteModal = (storeRequest: StoreRequestType) => {
    setDeletingStoreRequest(storeRequest);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStoreRequest(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedStoreRequest(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingStoreRequest(null);
  };

  const handleApprove = async (storeRequest: StoreRequestType) => {
    try {
      // Fetch full request data with items
      const fullRequest = await storeRequestService.getStoreRequest(storeRequest.id);
      setSelectedStoreRequest(fullRequest);
      setIsApprovalModalOpen(true);
      setApprovalAction('approve');
    } catch (error) {
      // Fallback to basic data if fetch fails
      setSelectedStoreRequest(storeRequest);
      setIsApprovalModalOpen(true);
      setApprovalAction('approve');
    }
  };

  const handleReject = async (storeRequest: StoreRequestType) => {
    try {
      // Fetch full request data with items
      const fullRequest = await storeRequestService.getStoreRequest(storeRequest.id);
      setSelectedStoreRequest(fullRequest);
      setIsApprovalModalOpen(true);
      setApprovalAction('reject');
    } catch (error) {
      // Fallback to basic data if fetch fails
      setSelectedStoreRequest(storeRequest);
      setIsApprovalModalOpen(true);
      setApprovalAction('reject');
    }
  };

  const closeApprovalModal = () => {
    setIsApprovalModalOpen(false);
    setSelectedStoreRequest(null);
    setApprovalAction(null);
  };

  const handleApprovalConfirm = async (approvalData?: any) => {
    if (!selectedStoreRequest) return;
    
    if (approvalAction === 'approve') {
      await approveStoreRequest(selectedStoreRequest.id, approvalData);
    } else if (approvalAction === 'reject') {
      await rejectStoreRequest(selectedStoreRequest.id, approvalData || '');
    }
    
    closeApprovalModal();
  };

  // Form submission
  const handleFormSubmit = async (data: any, status: 'draft' | 'submitted' = 'draft') => {
    try {
      if (modalMode === 'create') {
        await createStoreRequest({ ...data, status });
      } else if (selectedStoreRequest) {
        await updateStoreRequest(selectedStoreRequest.id, { ...data, status });
      }
      closeModal();
    } catch (error) {
    }
  };

  // Delete confirmation
  const handleDeleteConfirm = async () => {
    if (deletingStoreRequest) {
      try {
        await deleteStoreRequest(deletingStoreRequest.id);
        closeDeleteModal();
      } catch (error) {
      }
    }
  };

  // Status actions
  const handleSubmit = async (storeRequest: StoreRequestType) => {
    try {
      await submitStoreRequest(storeRequest.id);
    } catch (error) {
    }
  };

  const handleFulfill = async (storeRequest: StoreRequestType) => {
    try {
      await fulfillStoreRequest(storeRequest.id);
    } catch (error) {
    }
  };

  const handleCancel = async (storeRequest: StoreRequestType) => {
    try {
      await cancelStoreRequest(storeRequest.id);
    } catch (error) {
    }
  };

  // Sync activeTab with current filter status
  useEffect(() => {
    if (filters.status && filters.status !== 'all') {
      const status = filters.status as 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled';
      if (['draft', 'submitted', 'approved', 'rejected', 'fulfilled'].includes(status)) {
        setActiveTab(status);
      } else {
        setActiveTab('all');
      }
    } else {
      setActiveTab('all');
    }
  }, [filters.status]);

  // Handle status tab change
  const handleTabChange = useCallback((tab: 'all' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled') => {
    setActiveTab(tab);
    if (tab === 'all') {
      // Show all requests, no status filter
      handleFilter({ 
        status: 'all'
      });
    } else {
      // Filter by status
      handleFilter({ 
        status: tab
      });
    }
    handlePageChange(1); // Reset to first page when switching tabs
  }, [handleFilter, handlePageChange]);

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(filters);
  };

  const handleExportPDF = () => {
    exportToPDF(filters);
  };

  // Handle column sorting for DataTable
  const handleDataTableSort = useCallback((columnKey: string, direction: 'asc' | 'desc') => {
    handleSort(columnKey as keyof StoreRequestType | 'created_at' | 'updated_at');
  }, [handleSort]);

  // Computed values
  const showingStart = useMemo(() => {
    if (totalItems === 0) return 0;
    return (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);

  const showingEnd = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  // Status badge configuration
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'default' as const },
      submitted: { variant: 'info' as const },
      approved: { variant: 'success' as const },
      rejected: { variant: 'error' as const },
      fulfilled: { variant: 'success' as const },
      partial_issued: { variant: 'warning' as const },
      partially_received: { variant: 'warning' as const },
      fully_received: { variant: 'success' as const },
      closed_partially_received: { variant: 'warning' as const },
      cancelled: { variant: 'warning' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <StatusBadge status={status} variant={config.variant} />
    );
  };

  // Priority badge configuration
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: 'default' as const },
      medium: { variant: 'info' as const },
      high: { variant: 'warning' as const },
      urgent: { variant: 'error' as const }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <StatusBadge status={priority} variant={config.variant} />
    );
  };

  // Table columns with render functions
  const columns = storeRequestModuleConfig.tableColumns.map(column => ({
    key: column.key,
    header: column.label,
    sortable: column.sortable,
    defaultVisible: column.defaultVisible !== false, // Default to true if not specified
    render: (storeRequest: StoreRequestType) => {
      switch (column.key) {
        case 'reference_number':
          return (
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {storeRequest.reference_number}
            </span>
          );
        case 'request_date':
          return (
            <span className="text-gray-600 text-sm">
              {formatDate(storeRequest.request_date)}
            </span>
          );
        case 'requesting_store_name':
          return (
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{storeRequest.requestingStore?.name || 'Unknown Store'}</span>
            </div>
          );
        case 'issuing_store_name':
          return (
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{storeRequest.issuingStore?.name || 'Unknown Store'}</span>
            </div>
          );
        case 'priority':
          return getPriorityBadge(storeRequest.priority);
        case 'request_type':
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              storeRequest.request_type === 'request' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {storeRequest.request_type === 'request' ? 'Request' : 'Issue'}
            </span>
          );
        case 'total_items':
          return (
            <span className="text-gray-900 font-medium">
              {(storeRequest.total_items || 0).toLocaleString('en-US')}
            </span>
          );
        case 'total_value':
          return (
            <span className="text-gray-900 font-medium">
              {(() => {
                const currencySymbol = storeRequest.storeRequestCurrency?.symbol || 'TSh';
                return `${currencySymbol}${(Number(storeRequest.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              })()}
            </span>
          );
        case 'currency':
          return (
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-medium">
                {storeRequest.storeRequestCurrency?.code || 'TZS'} ({storeRequest.storeRequestCurrency?.symbol || 'TSh'})
              </span>
            </div>
          );
        case 'exchange_rate':
          return (
            <span className="text-gray-900 font-mono text-sm">
              {(Number(storeRequest.exchange_rate) || 1).toFixed(4)}
            </span>
          );
        case 'notes':
          return (
            <div className="max-w-xs">
              <span className="text-gray-900 text-sm truncate block" title={storeRequest.notes || ''}>
                {storeRequest.notes || 'No notes'}
              </span>
            </div>
          );
        case 'status':
          return getStatusBadge(storeRequest.status);
        case 'expected_delivery_date':
          return (
            <span className="text-gray-600 text-sm">
              {storeRequest.expected_delivery_date ? formatDate(storeRequest.expected_delivery_date) : 'Not set'}
            </span>
          );
        case 'created_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeRequest.createdByUser ? 
                  `${storeRequest.createdByUser.first_name} ${storeRequest.createdByUser.last_name}` : 
                  'Unknown User'
                }
              </span>
            </div>
          );
        case 'created_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeRequest.createdAt ? formatDateTime(storeRequest.createdAt) : 'N/A'}
            </span>
          );
        case 'updated_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeRequest.updatedByUser ? 
                  `${storeRequest.updatedByUser.first_name} ${storeRequest.updatedByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'updated_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeRequest.updatedAt ? formatDateTime(storeRequest.updatedAt) : 'N/A'}
            </span>
          );
        case 'submitted_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeRequest.submittedByUser ? 
                  `${storeRequest.submittedByUser.first_name} ${storeRequest.submittedByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'submitted_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeRequest.submitted_at ? formatDateTime(storeRequest.submitted_at) : 'N/A'}
            </span>
          );
        case 'approved_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeRequest.approvedByUser ? 
                  `${storeRequest.approvedByUser.first_name} ${storeRequest.approvedByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'approved_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeRequest.approved_at ? formatDateTime(storeRequest.approved_at) : 'N/A'}
            </span>
          );
        case 'rejected_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeRequest.rejectedByUser ? 
                  `${storeRequest.rejectedByUser.first_name} ${storeRequest.rejectedByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'rejected_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeRequest.rejected_at ? formatDateTime(storeRequest.rejected_at) : 'N/A'}
            </span>
          );
        case 'fulfilled_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeRequest.fulfilledByUser ? 
                  `${storeRequest.fulfilledByUser.first_name} ${storeRequest.fulfilledByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'fulfilled_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeRequest.fulfilled_at ? formatDateTime(storeRequest.fulfilled_at) : 'N/A'}
            </span>
          );
        case 'actions':
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openViewModal(storeRequest)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              {canEdit && storeRequest.status === 'draft' && (
                <button
                  onClick={() => openEditModal(storeRequest)}
                  className="text-amber-600 hover:text-amber-800 transition-colors"
                  title="Edit Request"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {canDelete && storeRequest.status === 'draft' && (
                <button
                  onClick={() => openDeleteModal(storeRequest)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete Request"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {canApprove && storeRequest.status === 'submitted' && (
                <>
                  <button
                    onClick={() => handleApprove(storeRequest)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    title="Approve Request"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReject(storeRequest)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Reject Request"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          );
        default:
          const value = storeRequest[column.key as keyof StoreRequestType];
          return (
            <span className="text-gray-900">
              {typeof value === 'string' || typeof value === 'number' ? value : 'N/A'}
            </span>
          );
      }
    }
  }));

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalRequests || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.draftRequests || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.approvedRequests || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fulfilled Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.fulfilledRequests || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by reference number or notes..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.priority}
                onChange={(e) => handleFilter({ priority: e.target.value as any })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.requesting_store_id || 'all'}
                onChange={(e) => handleFilter({ requesting_store_id: e.target.value === 'all' ? '' : e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              >
                <option value="all">All Requesting Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.issuing_store_id || 'all'}
                onChange={(e) => handleFilter({ issuing_store_id: e.target.value === 'all' ? '' : e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              >
                <option value="all">All Issuing Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleDateFilterChange({ date_from: e.target.value })}
                max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
                placeholder="Start Date"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleDateFilterChange({ date_to: e.target.value })}
                max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                min={filters.date_from || undefined} // Cannot be before start date
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
                placeholder="End Date"
              />
            </div>

            <button
              onClick={handleManualFetch}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-150 text-sm font-medium"
            >
              <Search className="h-4 w-4" />
              <span>Get Data</span>
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/inventory-management')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Inventory Management
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={handleExportExcel}
                    disabled={isExportingExcel}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingPdf}
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

        {/* Status Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              <button
                onClick={() => handleTabChange('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>All</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('draft')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'draft'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Draft</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('submitted')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'submitted'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Submitted</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('approved')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'approved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approved</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('rejected')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'rejected'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4" />
                  <span>Rejected</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('fulfilled')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'fulfilled'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Fulfilled</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-slideInUp hover:shadow-md transition-all duration-150">
          {isLoadingStats ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading store requests...</span>
            </div>
          ) : (
            <DataTable
              data={storeRequests}
              columns={columns}
              emptyMessage="No store requests found"
              showColumnControls={true}
              onSort={handleDataTableSort}
              sortable={true}
              initialSortState={{ key: 'createdAt', direction: 'desc' }}
              maxHeight={600}
            />
          )}
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
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
                  <option value={25}>25</option>
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
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={modalMode === 'create' ? 'Create Store Request' : 'Edit Store Request'}
          size={getModalSize()}
        >
          <StoreRequestForm
            storeRequest={selectedStoreRequest}
            stores={stores}
            currentUser={user}
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
            isLoading={isCreating || isUpdating}
            mode={modalMode}
            onSubmitForApproval={(id) => submitStoreRequest(id, closeModal)}
          />
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
          title="Store Request Details"
          size="2xl"
        >
          <StoreRequestView
            storeRequest={selectedStoreRequest}
            onClose={closeViewModal}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onSubmit={handleSubmit}
            onApprove={handleApprove}
            onReject={handleReject}
            onFulfill={handleFulfill}
            onCancel={handleCancel}
            canEdit={canEdit}
            canDelete={canDelete}
            canApprove={canApprove}
            isLoading={isSubmitting || isApproving || isRejecting || isFulfilling || isCancelling}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          title="Delete Store Request"
          message={`Are you sure you want to delete store request "${deletingStoreRequest?.reference_number}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={isDeleting}
          variant="danger"
        />

        {/* Approval Modal */}
        {isApprovalModalOpen && selectedStoreRequest && approvalAction && (
          <StoreRequestApprovalModal
            isOpen={isApprovalModalOpen}
            onClose={closeApprovalModal}
            storeRequest={selectedStoreRequest}
            action={approvalAction}
            onConfirm={handleApprovalConfirm}
            isLoading={isApproving || isRejecting}
          />
        )}
      </ContentContainer>

      {/* Floating Action Button (FAB) */}
      {canCreate && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
          title="Add New Store Request"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default StoreRequests;
