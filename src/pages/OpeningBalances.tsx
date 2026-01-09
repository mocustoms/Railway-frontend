import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Download, 
  ArrowLeft, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  FileText, 
  FileSpreadsheet, 
  Import, 
  Share, 
  DollarSign, 
  Calendar, 
  Building,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react';
import { useOpeningBalanceManagement, OpeningBalanceFilters } from '../hooks/useOpeningBalanceManagement';
import OpeningBalanceForm from '../components/OpeningBalanceForm';
import DataTable from '../components/DataTable';
import { OpeningBalance } from '../types';
import { accountTypeIcons, accountTypeNature, statisticsConfig, columnVisibilityConfig } from '../data/openingBalanceModules';
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import { useDebounce } from '../hooks/useDebounce';
import ContentContainer from '../components/ContentContainer';

// Use the base OpeningBalanceFilters interface which now includes accountType

// Extend the OpeningBalanceStats interface to include totalAmount
interface ExtendedOpeningBalanceStats {
  totalOpeningBalances: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  activeFinancialYears: number;
  totalAmount: number;
  delta: number; // Added for delta calculation
}

const OpeningBalances: React.FC = () => {
  const navigate = useNavigate();
  const {
    openingBalances,
    accounts,
    allOpeningBalances,
    currencies,
    financialYears,
    stats,
    // Defaults for form
    defaultCurrencyId,
    defaultCurrency,
    currentFinancialYear,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isImporting,
    isExporting,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchTerm,
    filters,
    sort,
    loadOpeningBalances,
    loadAccounts,
    loadCurrencies,
    loadFinancialYears,
    loadStats,
    createOpeningBalance,
    updateOpeningBalance,
    deleteOpeningBalance,
    importOpeningBalances,
    exportOpeningBalances,
    downloadTemplate,
    setSearchTerm,
    setFilters,
    setSort,
    setPage,
    setPageSize,
    hasData,
    canCreate,
    canUpdate,
    canDelete,
    canImport,
    canExport,
    generateReferenceNumber,
    getAccountNature,
    formatAmount,
    calculateEquivalentAmount
  } = useOpeningBalanceManagement();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingOpeningBalance, setEditingOpeningBalance] = useState<OpeningBalance | null>(null);
  const [viewingOpeningBalance, setViewingOpeningBalance] = useState<OpeningBalance | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Custom confirmation hook
  const { confirm } = useConfirm();

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Load data on mount
  useEffect(() => {
    loadOpeningBalances();
    loadAccounts();
    loadCurrencies();
    loadFinancialYears();
    loadStats();
  }, [loadOpeningBalances, loadAccounts, loadCurrencies, loadFinancialYears, loadStats]);

  // Filter accounts based on whether we're editing or adding
  const availableAccounts = useMemo(() => {
    // When editing, show all accounts (including the one being edited)
    if (editingOpeningBalance) {
      return accounts;
    }
    
    // When adding, filter out accounts that already have opening balances for the current financial year
    // Use allOpeningBalances which contains all opening balances (not paginated)
    if (currentFinancialYear) {
      const accountsWithBalances = new Set<string>();
      
      // Check all opening balances for the current financial year
      allOpeningBalances
        .filter(ob => ob.financialYearId === currentFinancialYear.id)
        .forEach(ob => {
          if (ob.accountId) {
            accountsWithBalances.add(ob.accountId);
          }
        });
      
      return accounts.filter(account => !accountsWithBalances.has(account.id));
    }
    
    // If no financial year, show all accounts
    return accounts;
  }, [accounts, allOpeningBalances, currentFinancialYear, editingOpeningBalance]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: any) => {
    try {
      if (editingOpeningBalance) {
        await updateOpeningBalance(editingOpeningBalance.id, data);
      } else {
        await createOpeningBalance(data);
      }
      setShowForm(false);
      setEditingOpeningBalance(null);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [editingOpeningBalance, createOpeningBalance, updateOpeningBalance]);

  // Handle add button click
  const handleAdd = useCallback(() => {
    setEditingOpeningBalance(null); // Ensure editing state is cleared
    setShowForm(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((openingBalance: OpeningBalance) => {
    setEditingOpeningBalance(openingBalance);
    setShowForm(true);
  }, []);

  // Handle view
  const handleView = useCallback((openingBalance: OpeningBalance) => {
    setViewingOpeningBalance(openingBalance);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (openingBalance: OpeningBalance) => {
    const confirmed = await confirm({
      title: 'Delete Opening Balance',
      message: `Are you sure you want to delete the opening balance for account "${openingBalance.account?.name}"? This action cannot be undone.`,
      type: 'danger'
    });

    if (confirmed) {
      try {
        await deleteOpeningBalance(openingBalance.id);
      } catch (error) {
        // Error is already handled by the hook with toast notifications
      }
    }
  }, [deleteOpeningBalance, confirm]);

  // Handle import
  const handleImport = useCallback(async (file: File) => {
    try {
      await importOpeningBalances(file);
      setShowImportModal(false);
      setImportFile(null);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [importOpeningBalances]);

  // Handle Excel export
  const handleExportExcel = useCallback(async () => {
    try {
      await exportOpeningBalances('excel');
      toast.success('Opening balances exported to Excel successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export opening balances to Excel');
    }
  }, [exportOpeningBalances]);

  // Handle PDF export
  const handleExportPDF = useCallback(async () => {
    try {
      await exportOpeningBalances('pdf');
      toast.success('Opening balances exported to PDF successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export opening balances to PDF');
    }
  }, [exportOpeningBalances]);

  // Handle search change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, [setSearchTerm]);

  // Handle filter change
  const handleFilterChange = useCallback((key: keyof OpeningBalanceFilters, value: string) => {
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
    return new Date(date).toLocaleDateString();
  }, []);

  // Get account type icon
  const getAccountTypeIcon = useCallback((type: string) => {
    return accountTypeIcons[type] || 'fa-circle';
  }, []);

  // Define columns for DataTable
  const columns = useMemo(() => [
    {
      key: 'account',
      header: 'Account',
      defaultVisible: true,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900">{openingBalance.account?.name}</div>
      )
    },
    {
      key: 'accountCode',
      header: 'Account Code',
      defaultVisible: false,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900">{openingBalance.account?.code}</div>
      )
    },
    {
      key: 'accountType',
      header: 'Account Type',
      defaultVisible: false,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="flex items-center gap-2">
          <i className={`fas ${getAccountTypeIcon(openingBalance.account?.type || '')} text-gray-400`}></i>
          <span className="text-sm text-gray-900">{openingBalance.account?.type}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      defaultVisible: true,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          openingBalance.type === 'debit' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {openingBalance.type.toUpperCase()}
        </span>
      )
    },
    {
      key: 'date',
      header: 'Date',
      defaultVisible: true,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900">{formatDate(openingBalance.date)}</div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      defaultVisible: true,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="max-w-xs truncate text-sm text-gray-900">
          {openingBalance.description || '-'}
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      defaultVisible: true,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <span className="font-semibold text-gray-900 font-mono">
          {openingBalance.originalAmount 
            ? formatAmount(openingBalance.originalAmount, openingBalance.currency?.code || 'TZS', openingBalance.currency?.symbol)
            : formatAmount(openingBalance.amount, openingBalance.currency?.code || 'TZS', openingBalance.currency?.symbol)
          }
        </span>
      )
    },
    {
      key: 'equivalentAmount',
      header: 'Equivalent (TZS)',
      defaultVisible: true,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <span className="font-medium text-gray-600 font-mono">
          {formatAmount(openingBalance.equivalentAmount || 0, defaultCurrency?.code || 'TZS', defaultCurrency?.symbol)}
        </span>
      )
    },
    {
      key: 'currency',
      header: 'Currency',
      defaultVisible: false,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900">{openingBalance.currency?.code || 'TZS'}</div>
      )
    },
    {
      key: 'exchangeRate',
      header: 'Exchange Rate',
      defaultVisible: false,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900 font-mono">
          {openingBalance.exchangeRate 
            ? (typeof openingBalance.exchangeRate === 'string' 
                ? parseFloat(openingBalance.exchangeRate).toFixed(6)
                : openingBalance.exchangeRate.toFixed(6))
            : '1.000000'}
        </div>
      )
    },
    {
      key: 'financialYear',
      header: 'Financial Year',
      defaultVisible: false,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900">{openingBalance.financialYear?.name || '-'}</div>
      )
    },
    {
      key: 'referenceNumber',
      header: 'Reference Number',
      defaultVisible: true,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
          {openingBalance.referenceNumber}
        </span>
      )
    },
    {
      key: 'createdBy',
      header: 'Created By',
      defaultVisible: false,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900">
          {openingBalance.creator ? 
            `${openingBalance.creator.first_name} ${openingBalance.creator.last_name}` : 
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
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900">{formatDate(openingBalance.createdAt)}</div>
      )
    },
    {
      key: 'updatedBy',
      header: 'Updated By',
      defaultVisible: false,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900">
          {openingBalance.updater ? 
            `${openingBalance.updater.first_name} ${openingBalance.updater.last_name}` : 
            '-'
          }
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      defaultVisible: false,
      sortable: true,
      render: (openingBalance: OpeningBalance) => (
        <div className="text-sm text-gray-900">{formatDate(openingBalance.updatedAt)}</div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true, // Required column
      sortable: false, // Actions column should not be sortable
      render: (openingBalance: OpeningBalance) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-100"
            onClick={() => handleView(openingBalance)}
            title="View details"
          >
            <Eye size={16} />
          </button>
          
          {canUpdate && (
            <button
              className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors duration-100"
              onClick={() => handleEdit(openingBalance)}
              title="Edit opening balance"
            >
              <Edit size={16} />
            </button>
          )}
          
          {canDelete && (
            <button
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-100"
              onClick={() => handleDelete(openingBalance)}
              title="Delete opening balance"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ], [getAccountTypeIcon, formatDate, formatAmount, canUpdate, canDelete, handleView, handleEdit, handleDelete]);

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
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Opening Balances</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOpeningBalances}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Credit Amount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatAmount((stats as ExtendedOpeningBalanceStats).totalCreditAmount || 0, defaultCurrency?.code || 'TZS', defaultCurrency?.symbol)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Debit Amount</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatAmount((stats as ExtendedOpeningBalanceStats).totalDebitAmount || 0, defaultCurrency?.code || 'TZS', defaultCurrency?.symbol)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${
                Math.abs((stats as ExtendedOpeningBalanceStats).delta || 0) < 0.01 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                <DollarSign className={`w-6 h-6 ${
                  Math.abs((stats as ExtendedOpeningBalanceStats).delta || 0) < 0.01 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delta (Credit - Debit)</p>
                <p className={`text-2xl font-semibold ${
                  Math.abs((stats as ExtendedOpeningBalanceStats).delta || 0) < 0.01 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatAmount((stats as ExtendedOpeningBalanceStats).delta || 0, defaultCurrency?.code || 'TZS', defaultCurrency?.symbol)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/app-accounts/transactions')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Transactions
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
                    disabled={isExporting}
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105"
                    disabled={isExporting}
                  >
                    <FileText size={16} className="mr-2" />
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search opening balances by account, description, or reference number..."
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
            {filters && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select
                    value={filters.accountType || ''}
                    onChange={(e) => handleFilterChange('accountType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
                  >
                    <option value="">All Types</option>
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                    <option value="EQUITY">Equity</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Balance Type</label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
                  >
                    <option value="">All Types</option>
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Opening Balances Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading opening balances...</span>
            </div>
          ) : (
            <>
                             <DataTable
                 data={openingBalances}
                 columns={columns}
                 emptyMessage="No opening balances found matching your criteria."
                 showColumnControls={true}
                 sortable={true}
                 onSort={handleTableSort}
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
            title="Add Opening Balance"
          >
            <Plus size={24} />
          </button>
          
          {canImport && (
            <div className="absolute bottom-16 right-0">
              <button
                className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center"
                onClick={() => setShowImportModal(true)}
                title="Import from Excel"
              >
                <Import size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Form Modal */}
        <OpeningBalanceForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingOpeningBalance(null);
          }}
          onSubmit={handleFormSubmit}
          openingBalance={editingOpeningBalance || undefined}
          accounts={availableAccounts}
          currencies={currencies}
          financialYears={financialYears}
          isLoading={isCreating || isUpdating}
          getAccountNature={getAccountNature}
          // Defaults for form
          defaultCurrencyId={defaultCurrencyId}
          defaultCurrency={defaultCurrency}
          currentFinancialYear={currentFinancialYear}
        />

        {/* View Modal */}
        {viewingOpeningBalance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Opening Balance Details</h2>
                  <button
                    onClick={() => setViewingOpeningBalance(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-100"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {viewingOpeningBalance.account?.code} - {viewingOpeningBalance.account?.name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(viewingOpeningBalance.date)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {viewingOpeningBalance.originalAmount 
                          ? formatAmount(viewingOpeningBalance.originalAmount, viewingOpeningBalance.currency?.code || 'TZS', viewingOpeningBalance.currency?.symbol)
                          : formatAmount(viewingOpeningBalance.amount, viewingOpeningBalance.currency?.code || 'TZS', viewingOpeningBalance.currency?.symbol)
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        viewingOpeningBalance.type === 'debit' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {viewingOpeningBalance.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Equivalent Amount (TZS)</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatAmount(viewingOpeningBalance.equivalentAmount || 0, defaultCurrency?.code || 'TZS', defaultCurrency?.symbol)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Exchange Rate</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {viewingOpeningBalance.exchangeRate 
                          ? (typeof viewingOpeningBalance.exchangeRate === 'string' 
                              ? parseFloat(viewingOpeningBalance.exchangeRate).toFixed(6)
                              : viewingOpeningBalance.exchangeRate.toFixed(6))
                          : '1.000000'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingOpeningBalance.currency?.code || 'TZS'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Financial Year</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingOpeningBalance.financialYear?.name || '-'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingOpeningBalance.referenceNumber}</p>
                  </div>
                  
                  {viewingOpeningBalance.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingOpeningBalance.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setViewingOpeningBalance(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-100 transform hover:scale-105"
                  >
                    Close
                  </button>
                  {canUpdate && (
                    <button
                      onClick={() => {
                        setViewingOpeningBalance(null);
                        handleEdit(viewingOpeningBalance);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-all duration-100 transform hover:scale-105"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Import Opening Balances</h2>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-100"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-all duration-100 transform hover:scale-105 flex items-center space-x-2"
                      onClick={() => downloadTemplate()}
                    >
                      <Download size={16} />
                      Download Template
                    </button>
                    <button
                      onClick={() => importFile && handleImport(importFile)}
                      disabled={!importFile || isImporting}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 transition-all duration-100 transform hover:scale-105 flex items-center space-x-2"
                    >
                      {isImporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Importing...
                        </>
                      ) : (
                        <>
                          <Import size={16} />
                          Import
                        </>
                      )}
                    </button>
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

export default OpeningBalances; 