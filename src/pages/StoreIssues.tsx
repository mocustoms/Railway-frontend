import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FileText,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  Package,
  User,
  Store,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ArrowUpRight,
  Calendar,
  Filter
} from 'lucide-react';
import { useStoreIssueManagement } from '../hooks/useStoreIssueManagement';
import { useAuth } from '../contexts/AuthContext';
import { StoreIssue as StoreIssueType, StoreRequestFormData } from '../types';
import { storeIssueModuleConfig } from '../data/storeIssueModules';
import { storeIssueService } from '../services/storeIssueService';
import { toast } from 'react-hot-toast';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import StoreIssueForm from '../components/StoreIssueForm';
import StoreIssueView from '../components/StoreIssueView';
import StoreIssueApprovalModal from '../components/StoreIssueApprovalModal';
import StoreRequestIssuerForm from '../components/StoreRequestIssuerForm';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import './StoreIssues.css';

const StoreIssues: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Calculate responsive modal size based on sidebar state
  const getModalSize = (): "sm" | "md" | "lg" | "xl" | "2xl" | "full" => {
    return "2xl"; // Use consistent 2xl size for both collapsed and expanded sidebar
  };
  
  const {
    storeRequests: storeIssues,
    stats,
    stores,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    isLoadingStats,
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
    updateStoreRequest: updateStoreIssue,
    deleteStoreRequest: deleteStoreIssue,
    submitStoreRequest: submitStoreIssue,
    approveStoreRequest: approveStoreIssue,
    rejectStoreRequest: rejectStoreIssue,
    fulfillStoreRequest: fulfillStoreIssue,
    cancelStoreRequest: cancelStoreIssue,
    exportToExcel,
    exportToPDF,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canExport,
    filters,
    searchTerm,
    refetchStoreRequests
  } = useStoreIssueManagement();

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isIssuerModalOpen, setIsIssuerModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedStoreIssue, setSelectedStoreIssue] = useState<StoreIssueType | null>(null);
  const [selectedStoreIssueForIssuer, setSelectedStoreIssueForIssuer] = useState<StoreIssueType | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deletingStoreIssue, setDeletingStoreIssue] = useState<StoreIssueType | null>(null);
  const [cancellingStoreIssue, setCancellingStoreIssue] = useState<StoreIssueType | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);

  // Modal handlers

  const openEditModal = async (storeIssue: StoreIssueType) => {
    try {
      // Fetch the complete store issue with all associations
      const completeStoreIssue = await storeIssueService.getStoreIssue(storeIssue.id);
      setSelectedStoreIssue(completeStoreIssue);
      setModalMode('edit');
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load store issue data');
    }
  };

  const openViewModal = async (storeIssue: StoreIssueType) => {
    try {
      // Fetch the complete store issue with all associations
      const completeStoreIssue = await storeIssueService.getStoreIssue(storeIssue.id);
      setSelectedStoreIssue(completeStoreIssue);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load store issue data');
    }
  };

  const openDeleteModal = (storeIssue: StoreIssueType) => {
    setDeletingStoreIssue(storeIssue);
    setIsDeleteModalOpen(true);
  };

  const openCancelModal = (storeIssue: StoreIssueType) => {
    setCancellingStoreIssue(storeIssue);
    setIsCancelModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStoreIssue(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedStoreIssue(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingStoreIssue(null);
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setCancellingStoreIssue(null);
  };

  const handleApprove = async (storeIssue: StoreIssueType) => {
    try {
      // Fetch full issue data with items
      const fullIssue = await storeIssueService.getStoreIssue(storeIssue.id);
      setSelectedStoreIssue(fullIssue);
      setIsApprovalModalOpen(true);
      setApprovalAction('approve');
    } catch (error) {
      // Fallback to basic data if fetch fails
      setSelectedStoreIssue(storeIssue);
      setIsApprovalModalOpen(true);
      setApprovalAction('approve');
    }
  };

  const handleReject = async (storeIssue: StoreIssueType) => {
    try {
      // Fetch full issue data with items
      const fullIssue = await storeIssueService.getStoreIssue(storeIssue.id);
      setSelectedStoreIssue(fullIssue);
      setIsApprovalModalOpen(true);
      setApprovalAction('reject');
    } catch (error) {
      // Fallback to basic data if fetch fails
      setSelectedStoreIssue(storeIssue);
      setIsApprovalModalOpen(true);
      setApprovalAction('reject');
    }
  };

  const closeApprovalModal = () => {
    setIsApprovalModalOpen(false);
    setSelectedStoreIssue(null);
    setApprovalAction(null);
  };

  const closeIssuerModal = () => {
    setIsIssuerModalOpen(false);
    setSelectedStoreIssueForIssuer(null);
  };

  const handleIssuerSubmit = async (data: StoreRequestFormData) => {
    try {
      if (selectedStoreIssueForIssuer) {
        // Prepare the items data for the API
        // We need to map the form items to the actual StoreRequestItem IDs
        const itemsData = data.items.map(formItem => {
          // Find the corresponding StoreRequestItem by product_id
          const storeRequestItem = selectedStoreIssueForIssuer.storeRequestItems?.find(
            item => item.product_id === formItem.product_id
          );
          
          return {
            id: storeRequestItem?.id || formItem.product_id, // Use StoreRequestItem ID
            issuing_quantity: formItem.issuing_quantity || 0,
            notes: formItem.notes
          };
        });
        
        // Call the new issueStock service method
        await storeIssueService.issueStock(selectedStoreIssueForIssuer.id, {
          items: itemsData,
          notes: data.notes
        });
        
        toast.success('Stock issued successfully');
        
        // Refresh the data
        await refetchStoreRequests();
        
        // Close the modal - the form will be refreshed when reopened
        closeIssuerModal();
      }
    } catch (error) {
      toast.error('Failed to issue stock');
    }
  };

  const handleApprovalConfirm = async (approvalData?: any) => {
    if (!selectedStoreIssue) return;
    
    if (approvalAction === 'approve') {
      await approveStoreIssue(selectedStoreIssue.id, approvalData);
    } else if (approvalAction === 'reject') {
      await rejectStoreIssue(selectedStoreIssue.id, approvalData || '');
    }
    
    closeApprovalModal();
  };

  // Form submission
  const handleFormSubmit = async (data: any, status: 'draft' | 'submitted' = 'draft') => {
    try {
      if (selectedStoreIssue) {
        await updateStoreIssue(selectedStoreIssue.id, { ...data, status });
      }
      closeModal();
    } catch (error) {
      }
  };

  // Delete confirmation
  const handleDeleteConfirm = async () => {
    if (deletingStoreIssue) {
      try {
        await deleteStoreIssue(deletingStoreIssue.id);
        closeDeleteModal();
      } catch (error) {
        }
    }
  };

  // Status actions
  const handleSubmit = async (storeIssue: StoreIssueType) => {
    try {
      await submitStoreIssue(storeIssue.id);
    } catch (error) {
      }
  };

  const handleFulfill = async (storeIssue: StoreIssueType) => {
    try {
      await fulfillStoreIssue(storeIssue.id);
    } catch (error) {
      }
  };

  const handleIssue = async (storeIssue: StoreIssueType) => {
    try {
      setSelectedStoreIssueForIssuer(storeIssue);
      setIsIssuerModalOpen(true);
    } catch (error) {
      }
  };

  const handleCancel = async (storeIssue: StoreIssueType) => {
    openCancelModal(storeIssue);
  };

  const handleCancelConfirm = async () => {
    if (cancellingStoreIssue) {
      try {
        await cancelStoreIssue(cancellingStoreIssue.id);
        toast.success('Store issue cancelled successfully');
        closeCancelModal();
        refetchStoreRequests(); // Refresh the data
      } catch (error) {
        toast.error('Failed to cancel store issue');
      }
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(filters);
  };

  const handleExportPDF = () => {
    exportToPDF(filters);
  };

  // Handle column sorting for DataTable
  const handleDataTableSort = useCallback((columnKey: string, direction: 'asc' | 'desc') => {
    handleSort(columnKey as keyof StoreIssueType | 'created_at' | 'updated_at');
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
      cancelled: { variant: 'warning' as const },
      partial_issued_cancelled: { variant: 'warning' as const }
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
  const columns = storeIssueModuleConfig.tableColumns.map(column => ({
    key: column.key,
    header: column.label,
    sortable: column.sortable,
    defaultVisible: column.defaultVisible !== false, // Default to true if not specified
    render: (storeIssue: StoreIssueType) => {
      switch (column.key) {
        case 'reference_number':
          return (
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {storeIssue.reference_number}
            </span>
          );
        case 'request_date':
          return (
            <span className="text-gray-600 text-sm">
              {formatDate(storeIssue.request_date)}
            </span>
          );
        case 'requesting_store_name':
          return (
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{storeIssue.requestingStore?.name || 'Unknown Store'}</span>
            </div>
          );
        case 'issuing_store_name':
          return (
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{storeIssue.issuingStore?.name || 'Unknown Store'}</span>
            </div>
          );
        case 'priority':
          return getPriorityBadge(storeIssue.priority);
        case 'request_type':
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              storeIssue.request_type === 'request' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {storeIssue.request_type === 'request' ? 'Request' : 'Issue'}
            </span>
          );
        case 'total_items':
          return (
            <span className="text-gray-900 font-medium">
              {(storeIssue.total_items || 0).toLocaleString('en-US')}
            </span>
          );
        case 'total_value':
          return (
            <span className="text-gray-900 font-medium">
              {(() => {
                const currencySymbol = storeIssue.storeRequestCurrency?.symbol || 'TSh';
                return `${currencySymbol}${(Number(storeIssue.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              })()}
            </span>
          );
        case 'currency':
          return (
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-medium">
                {storeIssue.storeRequestCurrency?.code || 'TZS'} ({storeIssue.storeRequestCurrency?.symbol || 'TSh'})
              </span>
            </div>
          );
        case 'exchange_rate':
          return (
            <span className="text-gray-900 font-mono text-sm">
              {(Number(storeIssue.exchange_rate) || 1).toFixed(4)}
            </span>
          );
        case 'notes':
          return (
            <div className="max-w-xs">
              <span className="text-gray-900 text-sm truncate block" title={storeIssue.notes || ''}>
                {storeIssue.notes || 'No notes'}
              </span>
            </div>
          );
        case 'status':
          return getStatusBadge(storeIssue.status);
        case 'expected_delivery_date':
          return (
            <span className="text-gray-600 text-sm">
              {storeIssue.expected_delivery_date ? formatDate(storeIssue.expected_delivery_date) : 'Not set'}
            </span>
          );
        case 'created_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeIssue.createdByUser ? 
                  `${storeIssue.createdByUser.first_name} ${storeIssue.createdByUser.last_name}` : 
                  'Unknown User'
                }
              </span>
            </div>
          );
        case 'created_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeIssue.createdAt ? formatDateTime(storeIssue.createdAt) : 'N/A'}
            </span>
          );
        case 'updated_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeIssue.updatedByUser ? 
                  `${storeIssue.updatedByUser.first_name} ${storeIssue.updatedByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'updated_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeIssue.updatedAt ? formatDateTime(storeIssue.updatedAt) : 'N/A'}
            </span>
          );
        case 'submitted_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeIssue.submittedByUser ? 
                  `${storeIssue.submittedByUser.first_name} ${storeIssue.submittedByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'submitted_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeIssue.submitted_at ? formatDateTime(storeIssue.submitted_at) : 'N/A'}
            </span>
          );
        case 'approved_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeIssue.approvedByUser ? 
                  `${storeIssue.approvedByUser.first_name} ${storeIssue.approvedByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'approved_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeIssue.approved_at ? formatDateTime(storeIssue.approved_at) : 'N/A'}
            </span>
          );
        case 'rejected_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeIssue.rejectedByUser ? 
                  `${storeIssue.rejectedByUser.first_name} ${storeIssue.rejectedByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'rejected_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeIssue.rejected_at ? formatDateTime(storeIssue.rejected_at) : 'N/A'}
            </span>
          );
        case 'fulfilled_by_name':
          return (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {storeIssue.fulfilledByUser ? 
                  `${storeIssue.fulfilledByUser.first_name} ${storeIssue.fulfilledByUser.last_name}` : 
                  'N/A'
                }
              </span>
            </div>
          );
        case 'fulfilled_at':
          return (
            <span className="text-gray-600 text-sm">
              {storeIssue.fulfilled_at ? formatDateTime(storeIssue.fulfilled_at) : 'N/A'}
            </span>
          );
        case 'actions':
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openViewModal(storeIssue)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              
              {canEdit && storeIssue.status === 'draft' && (
                <button
                  onClick={() => openEditModal(storeIssue)}
                  className="text-amber-600 hover:text-amber-800 transition-colors"
                  title="Edit Issue"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              
              {canDelete && storeIssue.status === 'draft' && (
                <button
                  onClick={() => openDeleteModal(storeIssue)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Delete Issue"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              
              {canApprove && storeIssue.status === 'submitted' && (
                <>
                  <button
                    onClick={() => handleApprove(storeIssue)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                    title="Approve Issue"
                    disabled={isApproving}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReject(storeIssue)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Reject Issue"
                    disabled={isRejecting}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              )}
              
              {storeIssue.status === 'draft' && (
                <button
                  onClick={() => handleSubmit(storeIssue)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Submit Issue"
                  disabled={isSubmitting}
                >
                  <Truck className="h-4 w-4" />
                </button>
              )}
              
              {(storeIssue.status === 'approved' || storeIssue.status === 'partial_issued') && (
                <button
                  onClick={() => handleIssue(storeIssue)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="Issue Stock"
                  disabled={isFulfilling}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              )}
              
              {(storeIssue.status === 'submitted' || storeIssue.status === 'approved' || storeIssue.status === 'partial_issued') && (
                <button
                  onClick={() => handleCancel(storeIssue)}
                  className="text-orange-600 hover:text-orange-800 transition-colors"
                  title="Cancel Issue"
                  disabled={isCancelling}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        default:
          return <span className="text-gray-500">-</span>;
      }
    }
  }));

  // Filter store issues to only show issues (request_type = 'issue')
  // Note: This filtering is now handled in the useStoreIssueManagement hook
  const filteredStoreIssues = storeIssues;

  // Stats cards
  const statsCards = [
    {
      title: 'Total Issues',
      value: stats?.totalRequests || 0,
      icon: Package,
      color: 'bg-pink-500',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Pending Issues',
      value: stats?.draftRequests || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+5%',
      changeType: 'positive' as const
    },
    {
      title: 'Approved Issues',
      value: stats?.approvedRequests || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'Fulfilled Issues',
      value: stats?.fulfilledRequests || 0,
      icon: Package,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive' as const
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You need to be logged in to access this page.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Package className="h-6 w-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Issues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalRequests || 0}
                </p>
              </div>
            </div>
          </Card>
          
           <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
             <div className="flex items-center">
               <div className="p-2 bg-green-100 rounded-lg">
                 <CheckCircle className="h-6 w-6 text-green-600" />
               </div>
               <div className="ml-4">
                 <p className="text-sm font-medium text-gray-600">Approved Issues</p>
                 <p className="text-2xl font-bold text-gray-900">
                   {isLoadingStats ? '...' : stats?.approvedRequests || 0}
                 </p>
               </div>
             </div>
           </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fulfilled Issues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.fulfilledRequests || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Partial Issued</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.partialIssuedRequests || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={4}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ready to Fulfill</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : (stats?.approvedRequests || 0) - (stats?.fulfilledRequests || 0)}
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
                value={filters.status}
                onChange={(e) => handleFilter({ status: e.target.value as any })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="partial_issued">Partial Issued</option>
                <option value="partially_received">Partially Received</option>
                <option value="cancelled">Cancelled</option>
                <option value="partial_issued_cancelled">Partial Issued Cancelled</option>
              </select>
            </div>

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

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-slideInUp hover:shadow-md transition-all duration-150">
          {isLoadingStats ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading store issues...</span>
            </div>
          ) : (
            <DataTable
              data={filteredStoreIssues}
              columns={columns}
              emptyMessage="No store issues found"
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

        {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Create Store Issue' : 'Edit Store Issue'}
        size={getModalSize()}
      >
        <StoreIssueForm
          storeIssue={selectedStoreIssue}
          stores={stores}
          currentUser={user}
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        title="Store Issue Details"
        size={getModalSize()}
      >
        <StoreIssueView
          storeIssue={selectedStoreIssue}
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
        />
      </Modal>

      <Modal
        isOpen={isApprovalModalOpen}
        onClose={closeApprovalModal}
        title={approvalAction === 'approve' ? 'Approve Store Issue' : 'Reject Store Issue'}
        size="xl"
      >
        <StoreIssueApprovalModal
          isOpen={isApprovalModalOpen}
          storeIssue={selectedStoreIssue}
          action={approvalAction}
          onConfirm={handleApprovalConfirm}
          onClose={closeApprovalModal}
        />
      </Modal>

        <Modal
          isOpen={isIssuerModalOpen}
          onClose={closeIssuerModal}
          title="Issue Store Request"
          size="2xl"
        >
        {selectedStoreIssueForIssuer && (
          <StoreRequestIssuerForm
            key={`${selectedStoreIssueForIssuer.id}-${selectedStoreIssueForIssuer.updatedAt}`}
            storeRequest={selectedStoreIssueForIssuer}
            stores={stores}
            currentUser={user}
            onSubmit={handleIssuerSubmit}
            onCancel={closeIssuerModal}
            isLoading={isFulfilling}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Store Issue"
        message={`Are you sure you want to delete issue "${deletingStoreIssue?.reference_number}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={closeCancelModal}
        onConfirm={handleCancelConfirm}
        title="Cancel Store Issue"
        message={`Are you sure you want to cancel issue "${cancellingStoreIssue?.reference_number}"? This will stop any further processing of this request.`}
        confirmText="Cancel Issue"
        cancelText="Keep Active"
        variant="warning"
        isLoading={isCancelling}
      />
      </ContentContainer>

      {/* Floating Action Button (FAB) - Removed since Store Issues are created from Store Requests */}
    </div>
  );
};

export default StoreIssues;
