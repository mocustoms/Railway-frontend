import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Plus, FileText, FileSpreadsheet, ArrowLeft, Eye, Edit, Trash2,
  Send, CheckCircle, XCircle, Clock, Calendar, Store, RefreshCw, Receipt, DollarSign
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useProformaInvoiceManagement } from '../hooks/useProformaInvoiceManagement';
import { ProformaInvoice, ProformaInvoiceSortConfig, Company } from '../types';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ProformaInvoiceForm from '../components/ProformaInvoiceForm';
import ProformaInvoiceView from '../components/ProformaInvoiceView';
import ConfirmDialog from '../components/ConfirmDialog';
import ProformaInvoiceRejectionModal from '../components/ProformaInvoiceRejectionModal';
import ProformaInvoiceReopenModal from '../components/ProformaInvoiceReopenModal';
import ContentContainer from '../components/ContentContainer';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { proformaInvoiceService } from '../services/proformaInvoiceService';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProformaInvoices: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    proformaInvoices, stats, stores, totalItems, totalPages, currentPage, pageSize,
    isLoading, isCreating, isUpdating, isDeleting,
    isSending, isAccepting, isRejecting, isReopening,
    error,     handleSearch, handlePageChange, handlePageSizeChange,
    handleSort, handleFilter, handleManualFetch, handleDateFilterChange, createProformaInvoice, updateProformaInvoice,
    deleteProformaInvoice, sendProformaInvoice, acceptProformaInvoice, rejectProformaInvoice, reopenProformaInvoice,
    exportToExcel, exportToPDF, refetchProformaInvoices,
    canCreate, canEdit, canDelete, canExport, canSend, canAccept, canReject,
    sortConfig, filters, searchTerm
  } = useProformaInvoiceManagement();

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
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [selectedProformaInvoice, setSelectedProformaInvoice] = useState<ProformaInvoice | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [actionType, setActionType] = useState<'send' | 'accept' | 'reject'>('send');
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'>('all');

  // Handle tab change
  const handleTabChange = useCallback((tab: 'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted') => {
    setActiveTab(tab);
    if (tab === 'converted') {
      // Show only converted invoices, no status filter
      handleFilter({ converted: 'true', status: undefined });
    } else if (tab === 'all') {
      // Show all invoices, no status filter
      handleFilter({ converted: undefined, status: undefined });
    } else {
      // Filter by status (draft, sent, accepted, rejected, expired)
      handleFilter({ converted: undefined, status: tab });
    }
    handlePageChange(1); // Reset to first page when switching tabs
  }, [handleFilter, handlePageChange]);

  const showingStart = useMemo(() => {
    return totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);

  const showingEnd = useMemo(() => {
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  const handleCreate = () => {
    setSelectedProformaInvoice(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = useCallback(async (invoice: ProformaInvoice) => {
    // Prevent editing non-draft invoices
    if (invoice.status !== 'draft') {
      toast.error('Only draft proforma invoices can be edited');
      return;
    }
    try {
      // Fetch the complete invoice with all associations
      const completeInvoice = await proformaInvoiceService.getProformaInvoice(invoice.id);
      setSelectedProformaInvoice(completeInvoice);
      setModalMode('edit');
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load proforma invoice data');
      // Fallback to basic data if fetch fails
      setSelectedProformaInvoice(invoice);
      setModalMode('edit');
      setIsModalOpen(true);
    }
  }, []);

  const handleView = useCallback(async (invoice: ProformaInvoice) => {
    try {
      // Fetch the complete invoice with all associations and items
      const completeInvoice = await proformaInvoiceService.getProformaInvoice(invoice.id);
      setSelectedProformaInvoice(completeInvoice);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load proforma invoice data');
      // Fallback to basic data if fetch fails
    setSelectedProformaInvoice(invoice);
    setIsViewModalOpen(true);
    }
  }, []);

  const handleDelete = useCallback((invoice: ProformaInvoice) => {
    setSelectedProformaInvoice(invoice);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConvertToSalesInvoice = useCallback(async (invoice: ProformaInvoice) => {
    // Validate that invoice is in a convertible state
    if (invoice.status !== 'sent' && invoice.status !== 'accepted') {
      toast.error('Only sent or accepted proforma invoices can be converted to sales invoices');
      return;
    }

    try {
      toast.loading('Converting proforma invoice to sales invoice...');
      
      // Convert to sales invoice (using today's date as default)
      const result = await proformaInvoiceService.convertToSalesInvoice(invoice.id);
      
      toast.dismiss();
      toast.success(`Proforma invoice converted successfully! Sales Invoice: ${result.salesInvoice.invoiceRefNumber}`);
      
      // Close the view modal
      setIsViewModalOpen(false);
      
      // Navigate to the sales invoices page
      // The user can search for the invoice by reference number
      navigate('/sales/sales-invoices');
    } catch (error: any) {
      toast.dismiss();
      const errorMessage = error.response?.data?.message || error.message || 'Failed to convert proforma invoice to sales invoice';
      toast.error(errorMessage);
    }
  }, [navigate]);

  const handleSend = useCallback((invoice: ProformaInvoice) => {
    setSelectedProformaInvoice(invoice);
    setActionType('send');
    setIsActionModalOpen(true);
  }, []);

  const handleAccept = useCallback((invoice: ProformaInvoice) => {
    setSelectedProformaInvoice(invoice);
    setActionType('accept');
    setIsActionModalOpen(true);
  }, []);

  const handleReject = useCallback((invoice: ProformaInvoice) => {
    setSelectedProformaInvoice(invoice);
    setIsRejectionModalOpen(true);
  }, []);

  const handleReopen = useCallback((invoice: ProformaInvoice) => {
    setSelectedProformaInvoice(invoice);
    setIsReopenModalOpen(true);
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProformaInvoice(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedProformaInvoice(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedProformaInvoice) {
      await deleteProformaInvoice(selectedProformaInvoice.id);
      setIsDeleteModalOpen(false);
      setSelectedProformaInvoice(null);
    }
  };

  const handleConfirmAction = async () => {
    if (selectedProformaInvoice) {
      switch (actionType) {
        case 'send':
          await sendProformaInvoice(selectedProformaInvoice.id);
          break;
        case 'accept':
          await acceptProformaInvoice(selectedProformaInvoice.id);
          break;
      }
      setIsActionModalOpen(false);
      setSelectedProformaInvoice(null);
    }
  };

  const handleConfirmRejection = async (rejectionReason: string) => {
    if (selectedProformaInvoice) {
      await rejectProformaInvoice(selectedProformaInvoice.id, rejectionReason);
      setIsRejectionModalOpen(false);
      setSelectedProformaInvoice(null);
    }
  };

  const handleConfirmReopen = async (validUntil: string) => {
    if (selectedProformaInvoice) {
      await reopenProformaInvoice(selectedProformaInvoice.id, validUntil);
      setIsReopenModalOpen(false);
      setSelectedProformaInvoice(null);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (modalMode === 'create') {
      await createProformaInvoice(data);
    } else if (selectedProformaInvoice) {
      await updateProformaInvoice(selectedProformaInvoice.id, data);
    }
    setIsModalOpen(false);
    setSelectedProformaInvoice(null);
  };


  const getStatusActions = useCallback((invoice: ProformaInvoice) => {
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
        {canAccept && invoice.status === 'sent' && (
          <button
            onClick={() => handleAccept(invoice)}
            className="text-green-600 hover:text-green-800 transition-colors"
            title="Accept Invoice"
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
        {canEdit && invoice.status === 'expired' && (
          <button
            onClick={() => handleReopen(invoice)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Open Invoice"
          >
            <RefreshCw className="h-4 w-4" />
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
  }, [canEdit, canSend, canAccept, canReject, canDelete, handleEdit, handleSend, handleAccept, handleReject, handleReopen, handleView, handleDelete]);

  const columns = useMemo(() => [
    {
      key: 'proformaRefNumber',
      header: 'Reference Number',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
        <span className="reference-number">{invoice.proformaRefNumber}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'proformaDate',
      header: 'Date',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
        <span className="reference-date">{formatDate(invoice.proformaDate)}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'customerName',
      header: 'Customer Name',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
        <span className="customer-name">{invoice.customerName || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'customerCode',
      header: 'Customer Code',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
        <span className="customer-code">{invoice.customerCode || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'storeName',
      header: 'Store',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
        <span className="store-name">{invoice.storeName}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (invoice: ProformaInvoice) => {
        return (
          <StatusBadge
            status={invoice.status}
            variant={invoice.status === 'accepted' ? 'success' : 
                    invoice.status === 'rejected' ? 'error' : 
                    invoice.status === 'sent' ? 'info' : 'default'}
          />
        );
      },
      defaultVisible: true
    },
    {
      key: 'currencySymbol',
      header: 'Currency Symbol',
      sortable: false,
      render: (invoice: ProformaInvoice) => (
        <span className="currency-symbol">{invoice.currencySymbol || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'currencyName',
      header: 'Currency Name',
      sortable: false,
      render: (invoice: ProformaInvoice) => (
        <span className="currency-name">{invoice.currencyName || 'N/A'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'exchangeRate',
      header: 'Exchange Rate',
      sortable: false,
      render: (invoice: ProformaInvoice) => (
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
      render: (invoice: ProformaInvoice) => {
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
      render: (invoice: ProformaInvoice) => {
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
      key: 'validUntil',
      header: 'Valid Until',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
        <span className="valid-until">
          {invoice.validUntil ? formatDate(invoice.validUntil) : 'No limit'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'createdByName',
      header: 'Created By',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
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
      render: (invoice: ProformaInvoice) => (
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
      render: (invoice: ProformaInvoice) => (
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
      render: (invoice: ProformaInvoice) => (
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
      render: (invoice: ProformaInvoice) => (
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
      render: (invoice: ProformaInvoice) => (
        <span className="sent-date">
          {invoice.sentAt ? formatDateTime(invoice.sentAt) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'acceptedByName',
      header: 'Accepted By',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
        <span className="accepted-by">
          {invoice.acceptedByName || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'acceptedAt',
      header: 'Accepted Date & Time',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
        <span className="accepted-date">
          {invoice.acceptedAt ? formatDateTime(invoice.acceptedAt) : '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'rejectedByName',
      header: 'Rejected By',
      sortable: true,
      render: (invoice: ProformaInvoice) => (
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
      render: (invoice: ProformaInvoice) => (
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
      render: (invoice: ProformaInvoice) => (
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
      render: (invoice: ProformaInvoice) => getStatusActions(invoice),
      defaultVisible: true
    }
  ], [getStatusActions]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading proforma invoices</div>
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
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
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
              placeholder="Search by reference number, customer name, store name..."
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
                onClick={() => handleTabChange('accepted')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'accepted'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Accepted</span>
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
                onClick={() => handleTabChange('expired')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'expired'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Expired</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('converted')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'converted'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4" />
                  <span>Converted to Sales Invoice</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Proforma Invoices Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading proforma invoices...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={proformaInvoices}
                columns={columns}
                emptyMessage="No proforma invoices found matching your criteria."
                showColumnControls={true}
                maxHeight={600}
                onSort={(key, direction) => {
                  // Map column keys to sortConfig field names
                  const sortFieldMap: Record<string, ProformaInvoiceSortConfig['field']> = {
                    'proformaRefNumber': 'proformaRefNumber',
                    'proformaDate': 'proformaDate',
                    'customerName': 'customerName',
                    'customerCode': 'customerName', // Map to customerName since customerCode is not sortable
                    'storeName': 'storeName',
                    'status': 'status',
                    'totalAmount': 'totalAmount',
                    'validUntil': 'validUntil',
                    'createdByName': 'createdBy',
                    'createdAt': 'createdAt',
                    'updatedByName': 'updatedBy',
                    'updatedAt': 'updatedAt',
                    'sentByName': 'sentByName',
                    'sentAt': 'sentAt',
                    'acceptedByName': 'acceptedByName',
                    'acceptedAt': 'acceptedAt',
                    'rejectedByName': 'rejectedByName',
                    'rejectedAt': 'rejectedAt'
                  };
                  const sortField = sortFieldMap[key] || key as ProformaInvoiceSortConfig['field'];
                  handleSort(sortField, direction);
                }}
                sortable={true}
                initialSortState={{
                  // Map sortConfig field back to column key for display
                  key: (() => {
                    const reverseMap: Record<ProformaInvoiceSortConfig['field'], string> = {
                      'proformaRefNumber': 'proformaRefNumber',
                      'proformaDate': 'proformaDate',
                      'customerName': 'customerName',
                      'storeName': 'storeName',
                      'totalAmount': 'totalAmount',
                      'status': 'status',
                      'createdAt': 'createdAt',
                      'updatedAt': 'updatedAt',
                      'createdBy': 'createdByName',
                      'updatedBy': 'updatedByName',
                      'sentAt': 'sentAt',
                      'sentByName': 'sentByName',
                      'acceptedAt': 'acceptedAt',
                      'acceptedByName': 'acceptedByName',
                      'rejectedAt': 'rejectedAt',
                      'rejectedByName': 'rejectedByName',
                      'validUntil': 'validUntil'
                    };
                    return reverseMap[sortConfig.field] || sortConfig.field;
                  })(),
                  direction: sortConfig.direction
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
        title={`${modalMode === 'create' ? 'Create' : 'Edit'} Proforma Invoice`}
        size="almost-full"
      >
        <ProformaInvoiceForm
          proformaInvoice={selectedProformaInvoice}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        title="Proforma Invoice Details"
        size="xl"
      >
        {selectedProformaInvoice && (
          <ProformaInvoiceView
            proformaInvoice={selectedProformaInvoice}
            onEdit={
              canEdit && selectedProformaInvoice.status === 'draft'
                ? () => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedProformaInvoice);
                  }
                : undefined
            }
            onConvertToSalesInvoice={
              (selectedProformaInvoice.status === 'sent' || selectedProformaInvoice.status === 'accepted')
                ? () => handleConvertToSalesInvoice(selectedProformaInvoice)
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
        title="Delete Proforma Invoice"
        message={`Are you sure you want to delete "${selectedProformaInvoice?.proformaRefNumber}"? This action cannot be undone.`}
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
        title={`${actionType === 'send' ? 'Send' : 'Accept'} Proforma Invoice`}
        message={`Are you sure you want to ${actionType} "${selectedProformaInvoice?.proformaRefNumber}"?`}
        confirmText={actionType === 'send' ? 'Send' : 'Accept'}
        cancelText="Cancel"
        variant="info"
        isLoading={isSending || isAccepting}
      />

      {/* Rejection Modal */}
      <ProformaInvoiceRejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setSelectedProformaInvoice(null);
        }}
        proformaInvoice={selectedProformaInvoice}
        onConfirm={handleConfirmRejection}
        isLoading={isRejecting}
      />

      {/* Reopen Modal */}
      <ProformaInvoiceReopenModal
        isOpen={isReopenModalOpen}
        onClose={() => {
          setIsReopenModalOpen(false);
          setSelectedProformaInvoice(null);
        }}
        proformaInvoice={selectedProformaInvoice}
        onConfirm={handleConfirmReopen}
        isLoading={isReopening}
      />

      {/* Floating Action Button (FAB) */}
      {canCreate && (
        <button
          onClick={handleCreate}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
          title="Create Proforma Invoice"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ProformaInvoices;
