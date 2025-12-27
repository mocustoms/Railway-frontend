import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  FileText, 
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Send,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useJournalEntryManagement, JournalEntryFilters } from '../hooks/useJournalEntryManagement';
import { JournalEntry, JournalEntryLine } from '../services/journalEntryService';
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import { useDebounce } from '../hooks/useDebounce';
import ContentContainer from '../components/ContentContainer';
import DataTable from '../components/DataTable';
import JournalEntryForm from '../components/JournalEntryForm';

const RecordLedgerEntries: React.FC = () => {
  const navigate = useNavigate();
  const {
    journalEntries,
    accounts,
    currencies,
    financialYears,
    stats,
    currentFinancialYear,
    defaultCurrencyId,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isPosting,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchTerm,
    filters,
    sort,
    loadJournalEntries,
    loadAccounts,
    loadCurrencies,
    loadFinancialYears,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    postJournalEntry,
    unpostJournalEntry,
    setSearchTerm,
    setFilters,
    setSort,
    setPage,
    setPageSize,
    hasData,
    canCreate,
    canUpdate,
    canDelete,
    canPost,
    calculateTotals,
    formatAmount
  } = useJournalEntryManagement();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Custom confirmation hook
  const { confirm } = useConfirm();

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Load data on mount
  useEffect(() => {
    loadJournalEntries();
    loadAccounts();
    loadCurrencies();
    loadFinancialYears();
  }, [loadJournalEntries, loadAccounts, loadCurrencies, loadFinancialYears]);

  // Reload when search or filters change
  useEffect(() => {
    loadJournalEntries();
  }, [debouncedSearch, filters, currentPage, pageSize, sort, loadJournalEntries]);

  // Handle form submission
  const handleSubmit = useCallback(async (data: any) => {
    if (editingEntry) {
      await updateJournalEntry(editingEntry.id, data);
    } else {
      await createJournalEntry(data);
    }
    setShowForm(false);
    setEditingEntry(null);
  }, [editingEntry, createJournalEntry, updateJournalEntry]);

  // Handle add
  const handleAdd = useCallback(() => {
    setEditingEntry(null);
    setShowForm(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((entry: JournalEntry) => {
    if (entry.isPosted) {
      toast.error('Cannot edit a posted journal entry');
      return;
    }
    setEditingEntry(entry);
    setShowForm(true);
  }, []);

  // Handle view
  const handleView = useCallback((entry: JournalEntry) => {
    setViewingEntry(entry);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (entry: JournalEntry) => {
    if (entry.isPosted) {
      toast.error('Cannot delete a posted journal entry. Unpost it first.');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete Journal Entry',
      message: `Are you sure you want to delete journal entry ${entry.referenceNumber}? This action cannot be undone.`,
      type: 'danger'
    });

    if (confirmed) {
      await deleteJournalEntry(entry.id);
    }
  }, [confirm, deleteJournalEntry]);

  // Handle post
  const handlePost = useCallback(async (entry: JournalEntry) => {
    if (entry.isPosted) {
      toast.error('Journal entry is already posted');
      return;
    }

    const confirmed = await confirm({
      title: 'Post Journal Entry',
      message: `Are you sure you want to post journal entry ${entry.referenceNumber}? This will create General Ledger entries.`,
      type: 'warning'
    });

    if (confirmed) {
      await postJournalEntry(entry.id);
    }
  }, [confirm, postJournalEntry]);

  // Handle unpost
  const handleUnpost = useCallback(async (entry: JournalEntry) => {
    if (!entry.isPosted) {
      toast.error('Journal entry is not posted');
      return;
    }

    const confirmed = await confirm({
      title: 'Unpost Journal Entry',
      message: `Are you sure you want to unpost journal entry ${entry.referenceNumber}? This will delete the General Ledger entries.`,
      type: 'warning'
    });

    if (confirmed) {
      await unpostJournalEntry(entry.id);
    }
  }, [confirm, unpostJournalEntry]);

  // Handle search change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, [setSearchTerm]);

  // Handle filter change
  const handleFilterChange = useCallback((key: keyof JournalEntryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, [setFilters]);

  // Handle sort
  const handleSort = useCallback((field: string) => {
    setSort({
      column: field,
      direction: sort.column === field && sort.direction === 'asc' ? 'desc' : 'asc'
    });
  }, [setSort, sort]);

  // Get sort arrow
  const getSortArrow = useCallback((field: string) => {
    if (sort.column !== field) return null;
    return sort.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  }, [sort]);

  // Format date
  const formatDate = useCallback((date: string | Date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  // Define columns for DataTable
  const columns = useMemo(() => [
    {
      key: 'referenceNumber',
      header: 'Reference',
      defaultVisible: true,
      sortable: true,
      render: (entry: JournalEntry) => (
        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
          {entry.referenceNumber}
        </span>
      )
    },
    {
      key: 'entryDate',
      header: 'Date',
      defaultVisible: true,
      sortable: true,
      render: (entry: JournalEntry) => (
        <div className="text-sm text-gray-900">{formatDate(entry.entryDate)}</div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      defaultVisible: true,
      sortable: true,
      render: (entry: JournalEntry) => (
        <div className="max-w-xs truncate text-sm text-gray-900" title={entry.description}>
          {entry.description || '-'}
        </div>
      )
    },
    {
      key: 'totalDebit',
      header: 'Total Debit',
      defaultVisible: true,
      sortable: true,
      render: (entry: JournalEntry) => (
        <span className="font-semibold text-red-600 font-mono">
          {formatAmount(entry.totalDebit)}
        </span>
      )
    },
    {
      key: 'totalCredit',
      header: 'Total Credit',
      defaultVisible: true,
      sortable: true,
      render: (entry: JournalEntry) => (
        <span className="font-semibold text-green-600 font-mono">
          {formatAmount(entry.totalCredit)}
        </span>
      )
    },
    {
      key: 'isPosted',
      header: 'Status',
      defaultVisible: true,
      sortable: true,
      render: (entry: JournalEntry) => (
        <div className="flex items-center">
          {entry.isPosted ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Posted
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <XCircle className="w-3 h-3 mr-1" />
              Draft
            </span>
          )}
        </div>
      )
    },
    {
      key: 'financialYear',
      header: 'Financial Year',
      defaultVisible: false,
      sortable: true,
      render: (entry: JournalEntry) => (
        <div className="text-sm text-gray-900">{entry.financialYear?.name || '-'}</div>
      )
    },
    {
      key: 'createdBy',
      header: 'Created By',
      defaultVisible: false,
      sortable: true,
      render: (entry: JournalEntry) => (
        <div className="text-sm text-gray-900">
          {entry.creator ? 
            `${entry.creator.first_name} ${entry.creator.last_name}` : 
            '-'
          }
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      defaultVisible: false,
      sortable: true,
      render: (entry: JournalEntry) => (
        <div className="text-sm text-gray-900">{formatDate(entry.createdAt)}</div>
      )
    },
    {
      key: 'postedAt',
      header: 'Posted Date',
      defaultVisible: false,
      sortable: true,
      render: (entry: JournalEntry) => (
        <div className="text-sm text-gray-900">
          {entry.postedAt ? formatDate(entry.postedAt) : '-'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true, // Required column
      sortable: false,
      render: (entry: JournalEntry) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-100"
            onClick={(e) => {
              e.stopPropagation();
              handleView(entry);
            }}
            title="View details"
          >
            <Eye size={16} />
          </button>
          
          {!entry.isPosted && canUpdate && (
            <button
              className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors duration-100"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(entry);
              }}
              title="Edit journal entry"
            >
              <Edit size={16} />
            </button>
          )}
          
          {!entry.isPosted && canPost && (
            <button
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors duration-100"
              onClick={(e) => {
                e.stopPropagation();
                handlePost(entry);
              }}
              title="Post journal entry"
            >
              <Send size={16} />
            </button>
          )}

          {entry.isPosted && canPost && (
            <button
              className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors duration-100"
              onClick={(e) => {
                e.stopPropagation();
                handleUnpost(entry);
              }}
              title="Unpost journal entry"
            >
              <XCircle size={16} />
            </button>
          )}
          
          {!entry.isPosted && canDelete && (
            <button
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-100"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(entry);
              }}
              title="Delete journal entry"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ], [formatDate, formatAmount, canUpdate, canDelete, canPost, handleView, handleEdit, handleDelete, handlePost, handleUnpost]);

  // Handle table sorting
  const handleTableSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    handleSort(key);
  }, [handleSort]);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      <ContentContainer>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-slideInUp">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Posted</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.postedEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <XCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unpostedEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Debit</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatAmount(stats.totalDebitAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/accounts')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Accounts
              </button>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by reference, description..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
                <select
                  value={filters.financialYearId || ''}
                  onChange={(e) => handleFilterChange('financialYearId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
                >
                  <option value="">All Years</option>
                  {financialYears.map(fy => (
                    <option key={fy.id} value={fy.id}>{fy.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.isPosted !== undefined ? filters.isPosted.toString() : ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    isPosted: e.target.value === '' ? undefined : e.target.value === 'true' 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
                >
                  <option value="">All</option>
                  <option value="true">Posted</option>
                  <option value="false">Draft</option>
                </select>
              </div>
            </div>

            {/* Date Range Filters */}
            {showFilters && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
                  />
                </div>
              </div>
            )}

            {/* Toggle Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100"
              >
                <Filter size={16} className="mr-2" />
                {showFilters ? 'Hide' : 'Show'} Date Filters
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Journal Entries Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading journal entries...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={journalEntries}
                columns={columns}
                emptyMessage="No journal entries found matching your criteria."
                showColumnControls={true}
                sortable={true}
                onSort={handleTableSort}
                initialSortState={{ key: sort.column, direction: sort.direction }}
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
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-100"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={25}>25</option>
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
          )}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
            onClick={handleAdd}
            title="Add Journal Entry"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Form Modal */}
        <JournalEntryForm
          isOpen={showForm}
          entry={editingEntry}
          accounts={accounts}
          currencies={currencies}
          financialYears={financialYears}
          defaultFinancialYearId={currentFinancialYear?.id}
          defaultCurrencyId={defaultCurrencyId}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
          isLoading={isCreating || isUpdating}
        />

        {/* View Modal */}
        {viewingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Journal Entry: {viewingEntry.referenceNumber}
                  </h2>
                  <button
                    onClick={() => setViewingEntry(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(viewingEntry.entryDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <p className="mt-1 text-sm">
                        {viewingEntry.isPosted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Posted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Draft
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingEntry.description || '-'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Financial Year</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingEntry.financialYear?.name || '-'}</p>
                    </div>
                    {viewingEntry.postedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Posted Date</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(viewingEntry.postedAt)}</p>
                      </div>
                    )}
                  </div>

                  {viewingEntry.creator && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created By</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {viewingEntry.creator.first_name} {viewingEntry.creator.last_name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Line Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewingEntry.lines?.map((line) => (
                          <tr key={line.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {line.account?.code} - {line.account?.name}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                line.type === 'debit' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {line.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium font-mono">
                              {formatAmount(line.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {line.description || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900">Total</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="space-y-1">
                              <div className="font-semibold text-red-600 font-mono">
                                Debit: {formatAmount(viewingEntry.totalDebit)}
                              </div>
                              <div className="font-semibold text-green-600 font-mono">
                                Credit: {formatAmount(viewingEntry.totalCredit)}
                              </div>
                            </div>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ContentContainer>
    </div>
  );
};

export default RecordLedgerEntries;
