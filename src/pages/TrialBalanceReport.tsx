import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  ArrowLeft,
  Search,
  Calendar,
  DollarSign,
  ChevronRight,
  Building2
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import TrialBalanceTreeView from '../components/TrialBalanceTreeView';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { financialYearService } from '../services/financialYearService';
import { accountTypeService } from '../services/accountTypeService';
import { trialBalanceReportService, TrialBalanceReportFilters, TrialBalanceAccount, TrialBalanceReportResponse } from '../services/trialBalanceReportService';
import { exportTableToExcel, ExcelExportData } from '../utils/excelExporter';
import { generateTrialBalancePDF } from '../utils/pdfGenerator';
import './TrialBalanceReport.css';

interface TrialBalanceFilters {
  financialYearId: string;
  includeZeroBalances: boolean;
  includeInactive: boolean;
  startDate: string;
  endDate: string;
  accountTypeId: string;
}

const TrialBalanceReport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TrialBalanceFilters>({
    financialYearId: '',
    includeZeroBalances: true,
    includeInactive: false,
    startDate: '',
    endDate: '',
    accountTypeId: 'all'
  });

  const [queryFilters, setQueryFilters] = useState<TrialBalanceReportFilters>({});
  const [manualFetchTrigger, setManualFetchTrigger] = useState(0);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch reference data
  const { data: financialYears, isLoading: isLoadingFinancialYears, error: financialYearsError } = useQuery({
    queryKey: ['financial-years'],
    queryFn: () => financialYearService.getFinancialYears({ page: 1, limit: 1000 }),
    enabled: !!user
  });

  const { data: accountTypes } = useQuery({
    queryKey: ['account-types'],
    queryFn: () => accountTypeService.getAccountTypes(1, 1000)
  });

  // Fetch trial balance report data
  const { data: reportData, isLoading, error } = useQuery<TrialBalanceReportResponse>({
    queryKey: ['trial-balance-report', queryFilters, manualFetchTrigger],
    queryFn: () => trialBalanceReportService.getTrialBalanceReport(queryFilters),
    enabled: manualFetchTrigger > 0 && !!user
  });

  const accountData = reportData?.data || [];
  const summary = reportData?.summary;
  const metadata = reportData?.metadata;

  // Expand all account types by default when data loads
  useEffect(() => {
    if (reportData?.data && reportData.data.length > 0) {
      const allTypeIds = reportData.data.map((at: TrialBalanceAccount) => at.id);
      setExpandedAccounts(new Set(allTypeIds));
    }
  }, [reportData]);

  // Handle filter changes
  const handleFilterChange = (key: keyof TrialBalanceFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle get data button click
  const handleGetData = () => {
    if (!filters.financialYearId) {
      alert('Please select a Financial Year');
      return;
    }

    const filtersToSend: TrialBalanceReportFilters = {
      financialYearId: filters.financialYearId,
      includeZeroBalances: filters.includeZeroBalances,
      includeInactive: filters.includeInactive
    };
    
    if (filters.startDate) filtersToSend.startDate = filters.startDate;
    if (filters.endDate) filtersToSend.endDate = filters.endDate;
    if (filters.accountTypeId && filters.accountTypeId !== 'all') {
      filtersToSend.accountTypeId = filters.accountTypeId;
    }

    setQueryFilters(filtersToSend);
    setManualFetchTrigger(prev => prev + 1);
  };

  // Toggle account expansion
  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  // Expand/Collapse All
  const expandAllAccounts = () => {
    const allIds = new Set<string>();
    const collectIds = (accounts: TrialBalanceAccount[]) => {
      accounts.forEach(account => {
        allIds.add(account.id);
        if (account.children && account.children.length > 0) {
          collectIds(account.children);
        }
      });
    };
    collectIds(accountData);
    setExpandedAccounts(allIds);
  };

  const collapseAllAccounts = () => {
    setExpandedAccounts(new Set());
  };

  // Highlight search terms
  const highlightSearchTerm = (text: string, term: string) => {
    if (!term || !text) return text;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  };

  // Filter accounts by search term (maintains tree structure)
  const filteredAccounts = React.useMemo(() => {
    if (!searchTerm) return accountData;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Recursively filter tree while maintaining structure
    const filterTree = (accounts: TrialBalanceAccount[]): TrialBalanceAccount[] => {
      return accounts
        .map(account => {
          const matchesSearch = 
            account.code?.toLowerCase().includes(searchLower) ||
            account.name?.toLowerCase().includes(searchLower);
          
          const filteredChildren = account.children && account.children.length > 0
            ? filterTree(account.children)
            : [];
          
          // Include account if it matches or has matching children
          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...account,
              children: filteredChildren
            };
          }
          return null;
        })
        .filter((account): account is TrialBalanceAccount => account !== null);
    };
    
    return filterTree(accountData);
  }, [accountData, searchTerm]);

  // Calculate display totals
  const displayTotals = React.useMemo(() => {
    if (!summary) return { debit: 0, credit: 0, difference: 0 };
    return {
      debit: summary.totalDebit,
      credit: summary.totalCredit,
      difference: summary.difference
    };
  }, [summary]);

  // Format amount with comma separators (no currency symbol)
  const formatAmount = (amount: number): string => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format currency for totals (with currency symbol)
  const formatCurrency = (amount: number): string => {
    const symbol = metadata?.currency?.symbol || '';
    return `${symbol}${formatAmount(amount)}`;
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (accountData.length === 0) return;
    
    // Flatten all accounts for export
    const allFlattened: any[] = [];
    
    const flattenForExport = (accounts: TrialBalanceAccount[], level = 0) => {
      accounts.forEach(account => {
        allFlattened.push({
          level: level,
          code: account.code,
          name: account.name,
          type: account.isAccountType ? 'Account Type' : account.type,
          debit: account.totalDebit,
          credit: account.totalCredit,
          balance: account.totalDebit - account.totalCredit
        });
        if (account.children && account.children.length > 0) {
          flattenForExport(account.children, level + 1);
        }
      });
    };
    
    flattenForExport(accountData);
    
    const tableData: ExcelExportData = {
      data: allFlattened,
      headers: ['level', 'code', 'name', 'type', 'debit', 'credit', 'balance'],
      title: 'Trial Balance Report',
      reportType: 'current',
      filters,
      searchTerm
    };
    
    exportTableToExcel(tableData);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (accountData.length === 0) return;
    
    generateTrialBalancePDF(
      accountData,
      'Trial Balance Report',
      filters,
      summary,
      metadata
    );
  };


  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => navigate('/app-accounts/reports')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Reports
        </button>
      </div>

      {/* Report Parameters */}
      <Card className="p-6">
        {/* Collapsible Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Report Parameters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-sm">
              {isFiltersCollapsed ? 'Show Filters' : 'Hide Filters'}
            </span>
            {isFiltersCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Collapsible Content */}
        {!isFiltersCollapsed && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Financial Year */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Financial Year *
                </label>
                <Select
                  value={filters.financialYearId}
                  onChange={(e) => handleFilterChange('financialYearId', e.target.value)}
                  required
                  disabled={isLoadingFinancialYears}
                >
                  <option value="">Select Financial Year</option>
                  {isLoadingFinancialYears ? (
                    <option value="" disabled>Loading...</option>
                  ) : financialYearsError ? (
                    <option value="" disabled>Error loading financial years</option>
                  ) : financialYears?.data && financialYears.data.length > 0 ? (
                    financialYears.data.map((fy: any) => (
                      <option key={fy.id} value={fy.id}>
                        {fy.name} ({fy.code})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No financial years available</option>
                  )}
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Start Date (Optional)
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  End Date (Optional)
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              {/* Account Type */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Building2 className="h-4 w-4 mr-2" />
                  Account Type
                </label>
                <Select
                  value={filters.accountTypeId}
                  onChange={(e) => handleFilterChange('accountTypeId', e.target.value)}
                >
                  <option value="all">All Account Types</option>
                  {accountTypes?.data?.map((at) => (
                    <option key={at.id} value={at.id}>
                      {at.name} ({at.code})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Include Zero Balances */}
              <div className="flex items-center gap-2 space-y-1">
                <input
                  type="checkbox"
                  id="includeZeroBalances"
                  checked={filters.includeZeroBalances}
                  onChange={(e) => handleFilterChange('includeZeroBalances', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="includeZeroBalances" className="text-sm font-medium text-gray-700">
                  Include Zero Balances
                </label>
              </div>

              {/* Include Inactive */}
              <div className="flex items-center gap-2 space-y-1">
                <input
                  type="checkbox"
                  id="includeInactive"
                  checked={filters.includeInactive}
                  onChange={(e) => handleFilterChange('includeInactive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="includeInactive" className="text-sm font-medium text-gray-700">
                  Include Inactive Accounts
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={handleGetData}
                className="flex items-center space-x-2"
                disabled={isLoading || !filters.financialYearId}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Get Data</span>
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg font-medium mb-2">
              Error Loading Data
            </div>
            <div className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'An error occurred while fetching trial balance data.'}
            </div>
            <Button
              onClick={handleGetData}
              className="flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {manualFetchTrigger > 0 && accountData && accountData.length > 0 && (
        <Card title="Trial Balance Results" className="p-6">
          {/* Total Accounts Count */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                Total Accounts: {accountData.length}
                {metadata?.financialYear && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    - {metadata.financialYear.name}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Search Accounts */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search accounts by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                {(() => {
                  const countNodes = (accounts: TrialBalanceAccount[]): number => {
                    return accounts.reduce((count, account) => {
                      return count + 1 + (account.children ? countNodes(account.children) : 0);
                    }, 0);
                  };
                  const filteredCount = countNodes(filteredAccounts);
                  const totalCount = countNodes(accountData);
                  return `Showing ${filteredCount} of ${totalCount} accounts`;
                })()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={expandedAccounts.size > 0 ? collapseAllAccounts : expandAllAccounts}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg transition-all duration-100 transform hover:scale-105 ${
                  expandedAccounts.size > 0
                    ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                }`}
              >
                {expandedAccounts.size > 0 ? (
                  <>
                    <ChevronDown size={16} className="mr-2" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronRight size={16} className="mr-2" />
                    Expand All
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportExcel}
                disabled={!accountData || accountData.length === 0}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={handleExportPDF}
                disabled={!accountData || accountData.length === 0}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <FileText size={16} className="mr-2" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Tree View Container */}
          <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg custom-scrollbar">
            <div className="trial-balance-tree-container">
              {/* Table Header */}
              <div className="trial-balance-header">
                <div className="trial-balance-header-toggle"></div>
                <div className="trial-balance-header-code">Account Code</div>
                <div className="trial-balance-header-name">Account Name</div>
                <div className="trial-balance-header-debit">Debit (Dr)</div>
                <div className="trial-balance-header-credit">Credit (Cr)</div>
              </div>

              {/* Tree View */}
              <div className="trial-balance-tree-content">
              <TrialBalanceTreeView
                accounts={filteredAccounts}
                expandedNodes={expandedAccounts}
                searchTerm={searchTerm}
                onToggleNode={toggleAccount}
                formatCurrency={formatAmount}
                highlightSearchTerm={highlightSearchTerm}
              />
              </div>

              {/* Totals Footer */}
              <div className="trial-balance-footer">
                <div className="trial-balance-footer-toggle"></div>
                <div className="trial-balance-footer-code"></div>
                <div className="trial-balance-footer-name">
                  <strong>TOTALS:</strong>
                </div>
                <div className="trial-balance-footer-debit">
                  <strong>{formatCurrency(displayTotals.debit)}</strong>
                </div>
                <div className="trial-balance-footer-credit">
                  <strong>{formatCurrency(displayTotals.credit)}</strong>
                </div>
              </div>
              {summary && !summary.isBalanced && (
                <div className="trial-balance-footer-difference">
                  <div className="trial-balance-footer-toggle"></div>
                  <div className="trial-balance-footer-code"></div>
                  <div className="trial-balance-footer-name">
                    <strong className="text-red-600">DIFFERENCE:</strong>
                  </div>
                  <div className="trial-balance-footer-debit-credit text-red-600">
                    <strong>
                      {formatCurrency(Math.abs(displayTotals.difference))}
                      {displayTotals.difference > 0 ? ' (Dr)' : ' (Cr)'}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading trial balance data...</span>
            </div>
          </div>
        </Card>
      )}

      {/* No Data State */}
      {manualFetchTrigger > 0 && !isLoading && (!accountData || accountData.length === 0) && (
        <Card className="p-6">
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-500">
              No trial balance data found for the selected criteria. Try adjusting your filters.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrialBalanceReport;

