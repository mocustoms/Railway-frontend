import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, ArrowLeft, Eye, Calendar, Receipt as ReceiptIcon, DollarSign, RefreshCw, CheckCircle, XCircle, Clock, FileText, Ban
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useReceiptManagement } from '../hooks/useReceiptManagement';
import { Receipt, ReceiptItem, ReceiptSortConfig, Company } from '../types';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ContentContainer from '../components/ContentContainer';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { receiptService } from '../services/receiptService';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SalesReceipts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    receipts, stats, totalItems, totalPages, currentPage, pageSize,
    isLoading, error,
    handleSearch, handlePageChange, handlePageSizeChange,
    handleSort, handleFilter, handleManualFetch, handleDateFilterChange,
    refetchReceipts, sortConfig, filters, searchTerm, canView
  } = useReceiptManagement();

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

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'reversed' | 'cancelled'>('all');
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [receiptToVoid, setReceiptToVoid] = useState<Receipt | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const showingStart = useMemo(() => {
    return totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);

  const showingEnd = useMemo(() => {
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  // Handle status tab change
  const handleTabChange = useCallback((tab: 'all' | 'active' | 'reversed' | 'cancelled') => {
    setActiveTab(tab);
    if (tab === 'all') {
      handleFilter({ status: undefined });
    } else {
      handleFilter({ status: tab });
    }
    handlePageChange(1);
  }, [handleFilter, handlePageChange]);

  const handleView = useCallback(async (receipt: Receipt) => {
    try {
      const completeReceipt = await receiptService.getReceipt(receipt.id);
      setSelectedReceipt(completeReceipt);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load receipt data');
      setSelectedReceipt(receipt);
      setIsViewModalOpen(true);
    }
  }, []);

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedReceipt(null);
  };

  const handleVoidClick = useCallback((receipt: Receipt) => {
    setReceiptToVoid(receipt);
    setReversalReason('');
    setIsVoidModalOpen(true);
  }, []);

  const handleVoidConfirm = useCallback(async () => {
    if (!receiptToVoid) return;

    setIsVoiding(true);
    try {
      await receiptService.voidReceipt(receiptToVoid.id, reversalReason || undefined);
      toast.success('Receipt voided successfully');
      setIsVoidModalOpen(false);
      setReceiptToVoid(null);
      setReversalReason('');
      refetchReceipts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to void receipt');
    } finally {
      setIsVoiding(false);
    }
  }, [receiptToVoid, reversalReason, refetchReceipts]);

  const handleVoidCancel = useCallback(() => {
    setIsVoidModalOpen(false);
    setReceiptToVoid(null);
    setReversalReason('');
  }, []);

  const getStatusActions = useCallback((receipt: Receipt) => {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleView(receipt)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
        {receipt.status === 'active' && (
          <button
            onClick={() => handleVoidClick(receipt)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Void Receipt"
          >
            <Ban className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }, [handleView, handleVoidClick]);

  const columns = useMemo(() => [
    {
      key: 'receiptReferenceNumber',
      header: 'Receipt Number',
      sortable: true,
      render: (receipt: Receipt) => (
        <span className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => handleView(receipt)}>
          {receipt.receiptReferenceNumber}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'salesInvoiceRefNumber',
      header: 'Invoice Number',
      sortable: false,
      render: (receipt: Receipt) => (
        receipt.salesInvoiceRefNumber ? (
          <button
            onClick={() => {
              navigate(`/sales/sales-invoices?search=${receipt.salesInvoiceRefNumber}`);
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            {receipt.salesInvoiceRefNumber}
          </button>
        ) : (
          <span className="text-gray-700">-</span>
        )
      ),
      defaultVisible: true
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: false,
      render: (receipt: Receipt) => (
        <span className="text-gray-700">{receipt.customerName || '-'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'transactionDate',
      header: 'Transaction Date',
      sortable: true,
      render: (receipt: Receipt) => (
        <span className="text-gray-700">{formatDate(receipt.transactionDate)}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'paymentAmount',
      header: 'Payment Amount',
      sortable: true,
      render: (receipt: Receipt) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(receipt.paymentAmount, receipt.currencySymbol || receipt.currencyName || 'USD')}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'equivalentAmount',
      header: 'Equivalent Amount',
      sortable: true,
      render: (receipt: Receipt) => (
        <span className="text-gray-700">
          {formatCurrency(receipt.equivalentAmount, receipt.systemDefaultCurrencySymbol || receipt.systemDefaultCurrencyName || 'USD')}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'paymentTypeName',
      header: 'Payment Type',
      sortable: false,
      render: (receipt: Receipt) => (
        <span className="text-gray-700">{receipt.paymentTypeName || '-'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (receipt: Receipt) => {
        return (
          <StatusBadge
            status={receipt.status}
            variant={receipt.status === 'active' ? 'success' : 
                    receipt.status === 'reversed' ? 'warning' : 
                    'default'}
          />
        );
      },
      defaultVisible: true
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      render: (receipt: Receipt) => (
        <span className="text-gray-700">{receipt.createdAt ? formatDateTime(receipt.createdAt) : '-'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (receipt: Receipt) => getStatusActions(receipt),
      defaultVisible: true
    }
  ], [getStatusActions, handleView]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading receipts</div>
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
                <ReceiptIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reversed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reversed}</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
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
                {formatCurrency(stats.totalAmount, defaultCurrencySymbol)}
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
              placeholder="Search by receipt number, invoice number, customer name..."
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
              <button
                onClick={() => navigate('/sales/sales-invoices')}
                className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <FileText size={16} className="mr-2" />
                View Invoices
              </button>
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
                  <ReceiptIcon className="w-4 h-4" />
                  <span>All</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('reversed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'reversed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Reversed</span>
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
            </nav>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading receipts...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={receipts}
                columns={columns}
                emptyMessage="No receipts found"
                showColumnControls={true}
                maxHeight={600}
                onSort={(key, direction) => {
                  // Map column keys to sortConfig field names
                  const sortFieldMap: Record<string, ReceiptSortConfig['field']> = {
                    'receiptReferenceNumber': 'receiptRefNumber',
                    'transactionDate': 'transactionDate',
                    'paymentAmount': 'paymentAmount',
                    'equivalentAmount': 'equivalentAmount',
                    'customerName': 'customerName',
                    'salesInvoiceRefNumber': 'salesInvoiceRefNumber',
                    'status': 'status',
                    'createdAt': 'createdAt',
                    'updatedAt': 'updatedAt'
                  };
                  const sortField = sortFieldMap[key] || key as ReceiptSortConfig['field'];
                  handleSort(sortField, direction);
                }}
                sortable={true}
                initialSortState={{
                  // Map sortConfig field back to column key for display
                  key: (() => {
                    const reverseMap: Record<ReceiptSortConfig['field'], string> = {
                      'receiptRefNumber': 'receiptReferenceNumber',
                      'transactionDate': 'transactionDate',
                      'paymentAmount': 'paymentAmount',
                      'equivalentAmount': 'equivalentAmount',
                      'customerName': 'customerName',
                      'salesInvoiceRefNumber': 'salesInvoiceRefNumber',
                      'status': 'status',
                      'createdAt': 'createdAt',
                      'updatedAt': 'updatedAt'
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
                    disabled={currentPage >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* View Modal */}
        {selectedReceipt && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={handleViewModalClose}
            title={`Receipt: ${selectedReceipt.receiptReferenceNumber}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Receipt Number</label>
                  <p className="text-gray-900 font-semibold">{selectedReceipt.receiptReferenceNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Invoice Number</label>
                  {selectedReceipt.salesInvoiceRefNumber ? (
                    <button
                      onClick={() => {
                        handleViewModalClose();
                        navigate(`/sales/sales-invoices?search=${selectedReceipt.salesInvoiceRefNumber}`);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {selectedReceipt.salesInvoiceRefNumber}
                    </button>
                  ) : (
                    <p className="text-gray-900">-</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Customer</label>
                  <p className="text-gray-900">{selectedReceipt.customerName || '-'}</p>
                  {selectedReceipt.customerCode && (
                    <p className="text-xs text-gray-500">Code: {selectedReceipt.customerCode}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Transaction Date</label>
                  <p className="text-gray-900">{formatDate(selectedReceipt.transactionDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment Amount</label>
                  <p className="text-gray-900 font-semibold text-lg">
                    {formatCurrency(selectedReceipt.paymentAmount, selectedReceipt.currencySymbol || selectedReceipt.currencyName || 'USD')}
                  </p>
                  {selectedReceipt.exchangeRate && selectedReceipt.exchangeRate !== 1 && (
                    <p className="text-xs text-gray-500">Exchange Rate: {selectedReceipt.exchangeRate}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Equivalent Amount</label>
                  <p className="text-gray-900 font-semibold text-lg">
                    {formatCurrency(selectedReceipt.equivalentAmount, selectedReceipt.systemDefaultCurrencySymbol || selectedReceipt.systemDefaultCurrencyName || 'USD')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Payment Type</label>
                  <p className="text-gray-900">{selectedReceipt.paymentTypeName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <StatusBadge
                    status={selectedReceipt.status}
                    variant={selectedReceipt.status === 'active' ? 'success' : 
                            selectedReceipt.status === 'reversed' ? 'warning' : 
                            'default'}
                  />
                </div>
                {selectedReceipt.salesAgentName && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sales Agent</label>
                    <p className="text-gray-900">{selectedReceipt.salesAgentName}</p>
                  </div>
                )}
                {selectedReceipt.useCustomerDeposit && selectedReceipt.depositAmount > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Deposit Used</label>
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency(selectedReceipt.depositAmount, selectedReceipt.currencySymbol || selectedReceipt.currencyName || 'USD')}
                    </p>
                  </div>
                )}
                {selectedReceipt.useLoyaltyPoints && selectedReceipt.loyaltyPointsAmount > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Loyalty Points Used</label>
                    <p className="text-gray-900">
                      {selectedReceipt.loyaltyPointsAmount} points ({formatCurrency(selectedReceipt.loyaltyPointsValue, selectedReceipt.currencySymbol || selectedReceipt.currencyName || 'USD')})
                    </p>
                  </div>
                )}
                {selectedReceipt.chequeNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cheque Number</label>
                    <p className="text-gray-900">{selectedReceipt.chequeNumber}</p>
                  </div>
                )}
                {selectedReceipt.bankDetailName && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bank</label>
                    <p className="text-gray-900">{selectedReceipt.bankDetailName}</p>
                    {selectedReceipt.branch && (
                      <p className="text-xs text-gray-500">Branch: {selectedReceipt.branch}</p>
                    )}
                  </div>
                )}
                {selectedReceipt.createdByName && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created By</label>
                    <p className="text-gray-900">{selectedReceipt.createdByName}</p>
                    {selectedReceipt.createdAt && (
                      <p className="text-xs text-gray-500">{formatDateTime(selectedReceipt.createdAt)}</p>
                    )}
                  </div>
                )}
                {selectedReceipt.reversedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Reversed</label>
                    <p className="text-gray-900">{formatDateTime(selectedReceipt.reversedAt)}</p>
                    {selectedReceipt.reversedByName && (
                      <p className="text-xs text-gray-500">By: {selectedReceipt.reversedByName}</p>
                    )}
                    {selectedReceipt.reversalReason && (
                      <p className="text-xs text-gray-500">Reason: {selectedReceipt.reversalReason}</p>
                    )}
                  </div>
                )}
              </div>

              {selectedReceipt.items && selectedReceipt.items.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Receipt Items ({selectedReceipt.items.length})</label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Code</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Payment Amount</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Equivalent Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedReceipt.items.map((item: ReceiptItem) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.product?.name || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {item.product?.code || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900 font-medium">
                              {formatCurrency(item.paymentAmount, selectedReceipt.currencySymbol || selectedReceipt.currencyName || 'USD')}
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900 font-medium">
                              {formatCurrency(item.equivalentAmount, selectedReceipt.systemDefaultCurrencySymbol || selectedReceipt.systemDefaultCurrencyName || 'USD')}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td colSpan={2} className="px-4 py-2 text-sm text-gray-900">Total</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">
                            {formatCurrency(
                              selectedReceipt.items.reduce((sum, item) => sum + (item.paymentAmount || 0), 0),
                              selectedReceipt.currencySymbol || selectedReceipt.currencyName || 'USD'
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">
                            {formatCurrency(
                              selectedReceipt.items.reduce((sum, item) => sum + (item.equivalentAmount || 0), 0),
                              selectedReceipt.systemDefaultCurrencySymbol || selectedReceipt.systemDefaultCurrencyName || 'USD'
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedReceipt.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{selectedReceipt.description}</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Void Receipt Confirmation Modal */}
        {isVoidModalOpen && receiptToVoid && (
          <Modal
            isOpen={isVoidModalOpen}
            onClose={handleVoidCancel}
            title="Void Receipt"
            size="md"
          >
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Ban className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Warning: This action cannot be undone</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Voiding this receipt will:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Reverse all General Ledger entries</li>
                        <li>Restore customer balances (debt, deposit, loyalty points)</li>
                        <li>Update invoice paid amounts</li>
                        <li>Mark the receipt as reversed</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Details
                </label>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Receipt Number:</span> {receiptToVoid.receiptReferenceNumber}
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Invoice:</span> {receiptToVoid.salesInvoiceRefNumber || '-'}
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Customer:</span> {receiptToVoid.customerName || '-'}
                  </p>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Amount:</span>{' '}
                    {formatCurrency(
                      receiptToVoid.paymentAmount,
                      receiptToVoid.currencySymbol || receiptToVoid.currencyName || 'USD'
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="reversalReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reversal Reason <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  id="reversalReason"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter reason for voiding this receipt..."
                  disabled={isVoiding}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleVoidCancel}
                  disabled={isVoiding}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVoidConfirm}
                  disabled={isVoiding}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVoiding ? 'Voiding...' : 'Void Receipt'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </ContentContainer>
    </div>
  );
};

export default SalesReceipts;

