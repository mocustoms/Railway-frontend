import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Plus, FileText, FileSpreadsheet, ArrowLeft, Eye, Edit, Trash2,
  Send, CheckCircle, XCircle, Clock, Calendar, Store, RefreshCw, Receipt, DollarSign, CreditCard
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePurchaseInvoiceManagement } from '../hooks/usePurchaseInvoiceManagement';
import { PurchaseInvoice, PurchaseInvoiceSortConfig, Company } from '../types';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PurchaseInvoiceForm from '../components/PurchaseInvoiceForm';
import PurchaseInvoiceView from '../components/PurchaseInvoiceView';
import PurchaseInvoicePaymentForm, { InvoicePaymentData } from '../components/PurchaseInvoicePaymentForm';
import ConfirmDialog from '../components/ConfirmDialog';
import PurchaseInvoiceRejectModal from '../components/PurchaseInvoiceCancelModal';
import PurchaseInvoiceCancelModal from '../components/PurchaseInvoiceCancelModal';
import ContentContainer from '../components/ContentContainer';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { purchaseInvoiceService } from '../services/purchaseInvoiceService';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PurchaseInvoices: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    purchaseInvoices, stats, stores, totalItems, totalPages, currentPage, pageSize,
    isLoading, isCreating, isUpdating, isDeleting,
    isSending, isApproving, isRejecting, isCancelling,
    error,     handleSearch, handlePageChange, handlePageSizeChange,
    handleSort, handleFilter, handleManualFetch, handleDateFilterChange, createPurchaseInvoice, updatePurchaseInvoice,
    deletePurchaseInvoice, sendPurchaseInvoice, approveInvoice, rejectPurchaseInvoice, cancelPurchaseInvoice,
    exportToExcel, exportToPDF, refetchPurchaseInvoices,
    canCreate, canEdit, canDelete, canExport, canSend, canApprove, canReject, canCancel,
    sortConfig, filters, searchTerm
  } = usePurchaseInvoiceManagement();

  // Fetch company data to get default currency
  const { data: companyData } = useQuery<Company | null>({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await apiService.get<Company>('/company');
      return response.success && response.data ? response.data : null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const defaultCurrencySymbol = companyData?.defaultCurrency?.symbol || '$';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<PurchaseInvoice | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [actionType, setActionType] = useState<'send' | 'approve' | 'reject'>('send');
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'approved' | 'paid' | 'partial_paid' | 'overdue' | 'cancelled' | 'rejected'>('all');

  const showingStart = useMemo(() => {
    return totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);

  const showingEnd = useMemo(() => {
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  // Handle status tab change
  const handleTabChange = useCallback((tab: 'all' | 'draft' | 'sent' | 'approved' | 'paid' | 'partial_paid' | 'overdue' | 'cancelled' | 'rejected') => {
    setActiveTab(tab);
    if (tab === 'all') {
      // Show all invoices, no status filter (keep payment status filter if set)
      handleFilter({ 
        status: undefined,
        paymentStatus: filters.paymentStatus
      });
    } else {
      // Filter by status (keep payment status filter if set)
      handleFilter({ 
        status: tab,
        paymentStatus: filters.paymentStatus
      });
    }
    handlePageChange(1); // Reset to first page when switching tabs
  }, [handleFilter, handlePageChange, filters.paymentStatus]);

  const handleCreate = () => {
    setSelectedPurchaseInvoice(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = useCallback(async (invoice: PurchaseInvoice) => {
    // Prevent editing approved, paid, or cancelled invoices
    if (invoice.status === 'approved' || invoice.status === 'paid' || invoice.status === 'cancelled') {
      toast.error('Cannot edit an invoice that has been approved, paid, or cancelled');
      return;
    }
    
    try {
      // Fetch the complete invoice with all associations
      const completeInvoice = await purchaseInvoiceService.getPurchaseInvoice(invoice.id);
      setSelectedPurchaseInvoice(completeInvoice);
      setModalMode('edit');
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load purchase invoice data');
      // Fallback to basic data if fetch fails
      setSelectedPurchaseInvoice(invoice);
      setModalMode('edit');
      setIsModalOpen(true);
    }
  }, []);

  const handleView = useCallback(async (invoice: PurchaseInvoice) => {
    try {
      // Fetch the complete invoice with all associations and items
      const completeInvoice = await purchaseInvoiceService.getPurchaseInvoice(invoice.id);
      setSelectedPurchaseInvoice(completeInvoice);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load purchase invoice data');
      // Fallback to basic data if fetch fails
    setSelectedPurchaseInvoice(invoice);
    setIsViewModalOpen(true);
    }
  }, []);

  const handleDelete = useCallback((invoice: PurchaseInvoice) => {
    setSelectedPurchaseInvoice(invoice);
    setIsDeleteModalOpen(true);
  }, []);

  const handleSend = useCallback((invoice: PurchaseInvoice) => {
    setSelectedPurchaseInvoice(invoice);
    setActionType('send');
    setIsActionModalOpen(true);
  }, []);

  const handleApprove = useCallback((invoice: PurchaseInvoice) => {
    setSelectedPurchaseInvoice(invoice);
    setActionType('approve');
    setIsActionModalOpen(true);
  }, []);

  const handleReject = useCallback((invoice: PurchaseInvoice) => {
    // Prevent rejecting approved, paid, or cancelled invoices
    if (invoice.status === 'approved' || invoice.status === 'paid' || invoice.status === 'cancelled') {
      toast.error('Cannot reject an invoice that has been approved, paid, or cancelled');
      return;
    }
    
    setSelectedPurchaseInvoice(invoice);
    setIsRejectModalOpen(true);
  }, []);

  const handlePayInvoice = useCallback(async (invoice: PurchaseInvoice) => {
    try {
      // Fetch the complete invoice with all associations
      const completeInvoice = await purchaseInvoiceService.getPurchaseInvoice(invoice.id);
      setSelectedPurchaseInvoice(completeInvoice);
      setIsPaymentModalOpen(true);
    } catch (error) {
      toast.error('Failed to load invoice data');
      // Fallback to basic data if fetch fails
      setSelectedPurchaseInvoice(invoice);
      setIsPaymentModalOpen(true);
    }
  }, []);

  const handleRecordPayment = useCallback(async (paymentData: InvoicePaymentData) => {
    if (!selectedPurchaseInvoice) return;

    try {
      setIsRecordingPayment(true);
      toast.loading('Recording payment...');
      
      const updatedInvoice = await purchaseInvoiceService.recordPayment(selectedPurchaseInvoice.id, paymentData);
      
      toast.dismiss();
      toast.success('Payment recorded successfully');
      
      setIsPaymentModalOpen(false);
      setSelectedPurchaseInvoice(null);
      
      // Refresh the invoice list
      await refetchPurchaseInvoices();
    } catch (error: any) {
      toast.dismiss();
      const errorMessage = error.response?.data?.message || error.message || 'Failed to record payment';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsRecordingPayment(false);
    }
  }, [selectedPurchaseInvoice, refetchPurchaseInvoices]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPurchaseInvoice(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedPurchaseInvoice(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedPurchaseInvoice) {
      await deletePurchaseInvoice(selectedPurchaseInvoice.id);
      setIsDeleteModalOpen(false);
      setSelectedPurchaseInvoice(null);
    }
  };

  const handleConfirmAction = async () => {
    if (selectedPurchaseInvoice) {
      switch (actionType) {
        case 'send':
          await sendPurchaseInvoice(selectedPurchaseInvoice.id);
          break;
        case 'approve':
          await approveInvoice(selectedPurchaseInvoice.id);
          break;
      }
      setIsActionModalOpen(false);
      setSelectedPurchaseInvoice(null);
    }
  };

  const handleConfirmReject = async (rejectionReason: string) => {
    if (selectedPurchaseInvoice) {
      await rejectPurchaseInvoice(selectedPurchaseInvoice.id, rejectionReason);
      setIsRejectModalOpen(false);
      setSelectedPurchaseInvoice(null);
    }
  };

  const handleCancel = useCallback((invoice: PurchaseInvoice) => {
    // Allow canceling overdue, sent, partial_paid, and draft invoices
    // Do not allow canceling paid, already cancelled, or rejected invoices
    if (invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'rejected') {
      toast.error('Cannot cancel an invoice that has been paid, cancelled, or rejected');
      return;
    }
    
    setSelectedPurchaseInvoice(invoice);
    setIsCancelModalOpen(true);
  }, []);

  const handleConfirmCancel = async (cancellationReason: string) => {
    if (selectedPurchaseInvoice) {
      await cancelPurchaseInvoice(selectedPurchaseInvoice.id, cancellationReason);
      setIsCancelModalOpen(false);
      setSelectedPurchaseInvoice(null);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (modalMode === 'create') {
      await createPurchaseInvoice(data);
    } else if (selectedPurchaseInvoice) {
      await updatePurchaseInvoice(selectedPurchaseInvoice.id, data);
    }
    setIsModalOpen(false);
    setSelectedPurchaseInvoice(null);
  };


  const getStatusActions = useCallback((invoice: PurchaseInvoice) => {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleView(invoice)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
        {canEdit && invoice.status === 'draft' && (
          <button
            onClick={() => handleEdit(invoice)}
            className="text-amber-600 hover:text-amber-800 transition-colors"
            title="Edit Invoice"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        {canSend && invoice.status === 'draft' && (
          <button
            onClick={() => handleSend(invoice)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Send Invoice"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
        {canApprove && invoice.status === 'sent' && (
          <button
            onClick={() => handleApprove(invoice)}
            className="text-green-600 hover:text-green-800 transition-colors"
            title="Approve Invoice"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
        {canReject && invoice.status === 'sent' && (
          <button
            onClick={() => handleReject(invoice)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Reject Invoice"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
        {canCancel && 
         invoice.status !== 'paid' && 
         invoice.status !== 'cancelled' && 
         invoice.status !== 'rejected' &&
         invoice.paymentStatus !== 'paid' &&
         (invoice.status === 'overdue' || invoice.status === 'sent' || invoice.status === 'partial_paid' || invoice.status === 'draft') && (
          <button
            onClick={() => handleCancel(invoice)}
            className="text-orange-600 hover:text-orange-800 transition-colors"
            title="Cancel Invoice"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {((invoice.status === 'approved' || invoice.status === 'partial_paid' || invoice.status === 'overdue') && 
          invoice.paymentStatus !== 'paid' && 
          (invoice.balanceAmount || 0) > 0) && (
          <button
            onClick={() => handlePayInvoice(invoice)}
            className="text-green-600 hover:text-green-800 transition-colors"
            title="Record Payment"
          >
            <CreditCard className="h-4 w-4" />
          </button>
        )}
        {canDelete && invoice.status === 'draft' && (
          <button
            onClick={() => handleDelete(invoice)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Delete Invoice"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }, [canEdit, canSend, canApprove, canReject, canDelete, canCancel, handleEdit, handleSend, handleApprove, handleReject, handleView, handleDelete, handlePayInvoice, handleCancel]);

  const columns = useMemo(() => [
    {
      key: 'invoiceRefNumber',
      header: 'Reference Number',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="reference-number">{invoice.invoiceRefNumber}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'invoiceDate',
      header: 'Invoice Date',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="reference-date">{formatDate(invoice.invoiceDate)}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'vendorName',
      header: 'Vendor Name',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="vendor-name">{invoice.vendorName || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'vendorCode',
      header: 'Vendor Code',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="vendor-code">{invoice.vendorCode || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'storeName',
      header: 'Store',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="store-name">{invoice.storeName}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (invoice: PurchaseInvoice) => {
        return (
          <StatusBadge
            status={invoice.status}
            variant={invoice.status === 'paid' ? 'success' : 
                    invoice.status === 'cancelled' || invoice.status === 'rejected' ? 'error' : 
                    invoice.status === 'overdue' ? 'error' :
                    invoice.status === 'partial_paid' ? 'warning' :
                    invoice.status === 'sent' ? 'info' : 'default'}
          />
        );
      },
      defaultVisible: true
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      sortable: true,
      render: (invoice: PurchaseInvoice) => {
        const paymentStatus = invoice.paymentStatus || 'unpaid';
        return (
          <StatusBadge
            status={paymentStatus}
            variant={paymentStatus === 'paid' ? 'success' : 
                    paymentStatus === 'overpaid' ? 'warning' :
                    paymentStatus === 'partial' ? 'warning' : 
                    'default'}
          />
        );
      },
      defaultVisible: true
    },
    {
      key: 'currencySymbol',
      header: 'Currency Symbol',
      sortable: false,
      render: (invoice: PurchaseInvoice) => (
        <span className="currency-symbol">{invoice.currencySymbol || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'currencyName',
      header: 'Currency Name',
      sortable: false,
      render: (invoice: PurchaseInvoice) => (
        <span className="currency-name">{invoice.currencyName || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'exchangeRate',
      header: 'Exchange Rate',
      sortable: false,
      render: (invoice: PurchaseInvoice) => (
        <span className="exchange-rate font-mono text-sm">
          {invoice.exchangeRateValue ? invoice.exchangeRateValue.toFixed(4) : '1.0000'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      sortable: true,
      render: (invoice: PurchaseInvoice) => {
        // Use the invoice's currency symbol, or fallback to currency code, or default to USD
        const currencyCode = invoice.currency?.code || invoice.currencyId || 'USD';
        const currencySymbol = invoice.currencySymbol || invoice.currency?.symbol;
        return (
          <span className="amount-value">
            {formatCurrency(invoice.totalAmount, currencyCode, currencySymbol)}
          </span>
        );
      },
      defaultVisible: true
    },
    {
      key: 'equivalentAmount',
      header: 'Equivalent Amount',
      sortable: false,
      render: (invoice: PurchaseInvoice) => {
        // Use the system default currency for equivalent amount (converted amount)
        const systemCurrencyCode = invoice.systemDefaultCurrency?.code || 'USD';
        const systemCurrencySymbol = invoice.systemDefaultCurrency?.symbol;
        const amount = invoice.equivalentAmount || invoice.totalAmount;
        return (
          <span className="equivalent-amount-value">
            {formatCurrency(amount, systemCurrencyCode, systemCurrencySymbol)}
          </span>
        );
      },
      defaultVisible: false
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="due-date">
          {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'createdByName',
      header: 'Created By',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="created-by">
          {invoice.createdByName || 'System'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'createdAt',
      header: 'Created Date & Time',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="created-date">
          {invoice.createdAt ? formatDateTime(invoice.createdAt) : '-'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'updatedByName',
      header: 'Updated By',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="updated-by">
          {invoice.updatedByName || 'System'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'updatedAt',
      header: 'Updated Date & Time',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="updated-date">
          {invoice.updatedAt ? formatDateTime(invoice.updatedAt) : '-'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'sentByName',
      header: 'Sent By',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="sent-by">
          {invoice.sentByName || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'sentAt',
      header: 'Sent Date & Time',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="sent-date">
          {invoice.sentAt ? formatDateTime(invoice.sentAt) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'paidAt',
      header: 'Paid Date',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="paid-date">
          {invoice.paidAt ? formatDateTime(invoice.paidAt) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'paidAmount',
      header: 'Paid Amount',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="paid-amount">
          {invoice.paidAmount !== undefined && invoice.paidAmount !== null ? formatCurrency(invoice.paidAmount, invoice.currencySymbol) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'balanceAmount',
      header: 'Balance',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="balance-amount">
          {invoice.balanceAmount !== undefined && invoice.balanceAmount !== null ? formatCurrency(invoice.balanceAmount, invoice.currencySymbol) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'cancelledByName',
      header: 'Cancelled By',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="cancelled-by">
          {invoice.cancelledByName || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'cancelledAt',
      header: 'Cancelled Date & Time',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="cancelled-date">
          {invoice.cancelledAt ? formatDateTime(invoice.cancelledAt) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'cancellationReason',
      header: 'Cancellation Reason',
      sortable: false,
      render: (invoice: PurchaseInvoice) => (
        <span className="cancellation-reason" title={invoice.cancellationReason || ''}>
          {invoice.cancellationReason ? (
            <span className="text-sm text-gray-700 max-w-xs truncate block">
              {invoice.cancellationReason}
            </span>
          ) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'rejectedByName',
      header: 'Rejected By',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="rejected-by">
          {invoice.rejectedByName || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'rejectedAt',
      header: 'Rejected Date & Time',
      sortable: true,
      render: (invoice: PurchaseInvoice) => (
        <span className="rejected-date">
          {invoice.rejectedAt ? formatDateTime(invoice.rejectedAt) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'rejectionReason',
      header: 'Rejection Reason',
      sortable: false,
      render: (invoice: PurchaseInvoice) => (
        <span className="rejection-reason" title={invoice.rejectionReason || ''}>
          {invoice.rejectionReason ? (
            <span className="text-sm text-gray-700 max-w-xs truncate block">
              {invoice.rejectionReason}
            </span>
          ) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (invoice: PurchaseInvoice) => getStatusActions(invoice),
      defaultVisible: true
    }
  ], [getStatusActions]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading purchase invoices</div>
          <div className="text-gray-600">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <ContentContainer>
        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Total Amount Card */}
        <Card className="mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalValue || 0, defaultCurrencySymbol)}
              </p>
            </div>
          </div>
        </Card>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by reference number, vendor name, store name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
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
          
          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <select
                value={filters.paymentStatus || ''}
                onChange={(e) => handleFilter({ paymentStatus: e.target.value as 'unpaid' | 'partial' | 'paid' | 'overpaid' || undefined })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              >
                <option value="">All Payment Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overpaid">Overpaid</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-gray-400" />
              <select
                value={filters.storeId || ''}
                onChange={(e) => handleFilter({ storeId: e.target.value || undefined })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
              >
                <option value="">All Stores</option>
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
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateFilterChange({ dateFrom: e.target.value || undefined })}
                max={new Date().toISOString().split('T')[0]}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
                placeholder="Start Date"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateFilterChange({ dateTo: e.target.value || undefined })}
                max={new Date().toISOString().split('T')[0]}
                min={filters.dateFrom || undefined}
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
                onClick={() => navigate('/purchases')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Purchases
              </button>
              <button
                onClick={() => navigate('/purchases/payments')}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
              >
                <Receipt size={16} className="mr-2" />
                View Payments
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {/* Status Tabs */}
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
                onClick={() => handleTabChange('sent')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'sent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Sent</span>
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
                onClick={() => handleTabChange('paid')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'paid'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Paid</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('partial_paid')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'partial_paid'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Partial Paid</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('overdue')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'overdue'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4" />
                  <span>Overdue</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('cancelled')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'cancelled'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4" />
                  <span>Cancelled</span>
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
            </nav>
          </div>
        </div>

        {/* Purchase Invoices Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading purchase invoices...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={purchaseInvoices}
                columns={columns}
                emptyMessage="No purchase invoices found matching your criteria."
                showColumnControls={true}
                maxHeight={600}
                onSort={(key, direction) => {
                  // Map column keys to sortConfig field names
                  const sortFieldMap: Record<string, PurchaseInvoiceSortConfig['field']> = {
                    'invoiceRefNumber': 'invoiceRefNumber',
                    'invoiceDate': 'invoiceDate',
                    'vendorName': 'vendorName',
                    'vendorCode': 'vendorName', // Map to vendorName since vendorCode is not sortable
                    'storeName': 'storeName',
                    'status': 'status',
                    'totalAmount': 'totalAmount',
                    'dueDate': 'dueDate',
                    'paidAmount': 'paidAmount',
                    'balanceAmount': 'balanceAmount',
                    'createdByName': 'createdBy',
                    'createdAt': 'createdAt',
                    'updatedByName': 'updatedBy',
                    'updatedAt': 'updatedAt',
                    'sentByName': 'sentByName',
                    'sentAt': 'sentAt',
                    'paidAt': 'paidAt',
                    'cancelledByName': 'cancelledByName',
                    'cancelledAt': 'cancelledAt',
                    'rejectedByName': 'rejectedByName',
                    'rejectedAt': 'rejectedAt'
                  };
                  const sortField = sortFieldMap[key] || key as PurchaseInvoiceSortConfig['field'];
                  handleSort(sortField, direction);
                }}
                sortable={true}
                initialSortState={{
                  // Map sortConfig field back to column key for display
                  key: (() => {
                    const reverseMap: Record<PurchaseInvoiceSortConfig['field'], string> = {
                      'invoiceRefNumber': 'invoiceRefNumber',
                      'invoiceDate': 'invoiceDate',
                      'vendorName': 'vendorName',
                      'storeName': 'storeName',
                      'status': 'status',
                      'totalAmount': 'totalAmount',
                      'dueDate': 'dueDate',
                      'paidAmount': 'paidAmount',
                      'balanceAmount': 'balanceAmount',
                      'createdAt': 'createdAt',
                      'updatedAt': 'updatedAt',
                      'createdBy': 'createdByName',
                      'updatedBy': 'updatedByName',
                      'sentAt': 'sentAt',
                      'sentByName': 'sentByName',
                      'paidAt': 'paidAt',
                      'cancelledAt': 'cancelledAt',
                      'cancelledByName': 'cancelledByName',
                      'rejectedAt': 'rejectedAt',
                      'rejectedByName': 'rejectedByName'
                    };
                    return reverseMap[sortConfig.field] || sortConfig.field;
                  })(),
                  direction: sortConfig.direction
                }}
                getRowClassName={(invoice: PurchaseInvoice) => {
                  // Add visual indicator (shading) only for auto-generated invoices
                  if (invoice.parentInvoiceId) {
                    return 'bg-blue-50 border-l-4 border-blue-400'; // Auto-generated from scheduled invoice
                  }
                  return '';
                }}
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
            </>
          )}
        </div>
      </ContentContainer>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={`${modalMode === 'create' ? 'Create' : 'Edit'} Purchase Invoice`}
        size="almost-full"
      >
        <PurchaseInvoiceForm
          purchaseInvoice={selectedPurchaseInvoice}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        title="Purchase Invoice Details"
        size="xl"
      >
        {selectedPurchaseInvoice && (
          <PurchaseInvoiceView
            purchaseInvoice={selectedPurchaseInvoice}
            onEdit={
              canEdit && selectedPurchaseInvoice.status !== 'approved' && 
              selectedPurchaseInvoice.status !== 'paid' && 
              selectedPurchaseInvoice.status !== 'cancelled'
                ? () => {
              setIsViewModalOpen(false);
              handleEdit(selectedPurchaseInvoice);
                  }
                : undefined
            }
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase Invoice"
        message={`Are you sure you want to delete "${selectedPurchaseInvoice?.invoiceRefNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Action Confirmation Modal (for send/accept) */}
      <ConfirmDialog
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={`${actionType === 'send' ? 'Send' : 'Approve'} Purchase Invoice`}
        message={`Are you sure you want to ${actionType === 'send' ? 'send' : 'approve'} "${selectedPurchaseInvoice?.invoiceRefNumber}"?`}
        confirmText={actionType === 'send' ? 'Send' : 'Approve'}
        cancelText="Cancel"
        variant="info"
        isLoading={isSending || isApproving}
      />

      {/* Reject Modal */}
      <PurchaseInvoiceRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedPurchaseInvoice(null);
        }}
        onConfirm={handleConfirmReject}
        isLoading={isRejecting}
        purchaseInvoice={selectedPurchaseInvoice}
      />

      {/* Cancel Modal */}
      <PurchaseInvoiceCancelModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedPurchaseInvoice(null);
        }}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
        purchaseInvoice={selectedPurchaseInvoice}
      />

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPurchaseInvoice(null);
        }}
        title="Pay Invoice"
        size="xl"
      >
        {selectedPurchaseInvoice && (
          <PurchaseInvoicePaymentForm
            purchaseInvoice={selectedPurchaseInvoice}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedPurchaseInvoice(null);
            }}
            onSubmit={handleRecordPayment}
            isLoading={isRecordingPayment}
            isOpen={isPaymentModalOpen}
          />
        )}
      </Modal>

      {/* Floating Action Button (FAB) */}
      {canCreate && (
        <button
          onClick={handleCreate}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
          title="Create Purchase Invoice"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default PurchaseInvoices;
