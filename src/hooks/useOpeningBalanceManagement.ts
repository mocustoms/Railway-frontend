import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { OpeningBalance, Account, Currency, FinancialYear } from '../types';
import openingBalanceService from '../services/openingBalanceService';
import { accountTypeNature, errorMessages, successMessages } from '../data/openingBalanceModules';
import toast from 'react-hot-toast';

export interface OpeningBalanceFilters {
  financialYearId?: string;
  accountId?: string;
  currencyId?: string;
  type?: 'debit' | 'credit';
  accountType?: string;
}

interface OpeningBalanceSort {
  column: string;
  direction: 'asc' | 'desc';
}

interface OpeningBalanceStats {
  totalOpeningBalances: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  activeFinancialYears: number;
  delta: number;
}

interface UseOpeningBalanceManagementReturn {
  // State
  openingBalances: OpeningBalance[];
  accounts: Account[];
  allOpeningBalances: OpeningBalance[]; // All opening balances for filtering
  currencies: Currency[];
  financialYears: FinancialYear[];
  stats: OpeningBalanceStats;
  // Defaults for form
  defaultCurrencyId?: string;
  defaultCurrency?: Currency;
  currentFinancialYear?: FinancialYear;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isImporting: boolean;
  isExporting: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  searchTerm: string;
  filters: OpeningBalanceFilters;
  sort: OpeningBalanceSort;
  
  // Actions
  loadOpeningBalances: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  loadCurrencies: () => Promise<void>;
  loadFinancialYears: () => Promise<void>;
  loadCompanySettings: () => Promise<void>;
  loadCurrentFinancialYear: () => Promise<void>;
  loadStats: () => Promise<void>;
  createOpeningBalance: (data: any) => Promise<OpeningBalance | null>;
  updateOpeningBalance: (id: string, data: any) => Promise<OpeningBalance | null>;
  deleteOpeningBalance: (id: string) => Promise<boolean>;
  importOpeningBalances: (file: File, options?: any) => Promise<boolean>;
  exportOpeningBalances: (format: 'excel' | 'pdf' | 'csv') => Promise<void>;
  downloadTemplate: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<OpeningBalanceFilters>>;
  setSort: (sort: OpeningBalanceSort) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Computed
  filteredOpeningBalances: OpeningBalance[];
  hasData: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canImport: boolean;
  canExport: boolean;
  
  // Utilities
  generateReferenceNumber: () => Promise<string>;
  getAccountNature: (accountType: string) => 'DEBIT' | 'CREDIT';
  formatAmount: (amount: number, currencyCode?: string, currencySymbol?: string) => string;
  calculateEquivalentAmount: (amount: number, exchangeRate: number) => number;
  validateCSVData: (data: any[]) => { valid: boolean; errors: string[] };
  parseCSV: (file: File) => Promise<any[]>;
}

export const useOpeningBalanceManagement = (): UseOpeningBalanceManagementReturn => {
  const { user } = useAuth();
  
  // State
  const [openingBalances, setOpeningBalances] = useState<OpeningBalance[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allOpeningBalances, setAllOpeningBalances] = useState<OpeningBalance[]>([]); // Store all opening balances for filtering
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [stats, setStats] = useState<OpeningBalanceStats>({
    totalOpeningBalances: 0,
    totalDebitAmount: 0,
    totalCreditAmount: 0,
    activeFinancialYears: 0,
    delta: 0
  });
  // Defaults for form
  const [defaultCurrencyId, setDefaultCurrencyId] = useState<string>();
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>();
  const [currentFinancialYear, setCurrentFinancialYear] = useState<FinancialYear>();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<OpeningBalanceFilters>({});
  const [sort, setSort] = useState<OpeningBalanceSort>({ column: 'createdAt', direction: 'desc' });

  // Computed values
  const hasData = useMemo(() => openingBalances.length > 0, [openingBalances]);
  const canCreate = useMemo(() => true, []); // Temporarily allow all roles for testing
  const canUpdate = useMemo(() => true, []);
  const canDelete = useMemo(() => true, []);
  const canImport = useMemo(() => true, []);
  const canExport = useMemo(() => true, []);

  // Load all opening balances (not paginated) for filtering accounts
  const loadAllOpeningBalances = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all opening balances without filters (except financial year if needed)
      // This is used to determine which accounts already have opening balances
      const response = await openingBalanceService.getOpeningBalances({
        page: 1,
        limit: 10000 // Large limit to get all
        // Don't apply filters here - we want all opening balances for filtering
      });
      
      setAllOpeningBalances(response.openingBalances);
    } catch (error) {
      // Don't show error toast for this as it's not critical
    }
  }, [user]);

  // Load opening balances with pagination, search, and filters
  const loadOpeningBalances = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        sortBy: sort.column,
        sortOrder: sort.direction,
        ...filters
      };

      const response = await openingBalanceService.getOpeningBalances(params);
      
      setOpeningBalances(response.openingBalances);
      setTotalItems(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);
      
      // Also load all opening balances for filtering accounts
      await loadAllOpeningBalances();
    } catch (error: any) {
      toast.error(error.response?.data?.message || errorMessages.importFailed);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentPage, pageSize, sort, searchTerm, filters, loadAllOpeningBalances]);

  // Load leaf accounts for dropdown (only accounts without children)
  const loadAccounts = useCallback(async () => {
    try {
      const accountsData = await openingBalanceService.getLeafAccounts();
      setAccounts(accountsData);
    } catch (error: any) {
      toast.error('Failed to load accounts');
    }
  }, []);

  // Load currencies for dropdown
  const loadCurrencies = useCallback(async () => {
    try {
      const currenciesData = await openingBalanceService.getCurrencies();
      setCurrencies(currenciesData);
    } catch (error: any) {
      toast.error('Failed to load currencies');
    }
  }, []);

  // Load financial years for dropdown
  const loadFinancialYears = useCallback(async () => {
    try {
      const financialYearsData = await openingBalanceService.getFinancialYears();
      setFinancialYears(financialYearsData);
    } catch (error: any) {
      toast.error('Failed to load financial years');
    }
  }, []);

  // Load company settings for defaults
  const loadCompanySettings = useCallback(async () => {
    try {
      const companySettings = await openingBalanceService.getCompanySettings();
      setDefaultCurrencyId(companySettings.defaultCurrencyId);
      setDefaultCurrency(companySettings.defaultCurrency);
    } catch (error) {
      }
  }, []);

  // Load current financial year
  const loadCurrentFinancialYear = useCallback(async () => {
    try {
      const currentYear = await openingBalanceService.getCurrentFinancialYear();
      setCurrentFinancialYear(currentYear || undefined);
    } catch (error) {
      }
  }, []);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const statsData = await openingBalanceService.getStatistics();
      setStats(statsData);
    } catch (error: any) {
      // Don't show error toast for stats as it's not critical
    }
  }, []);

  // Create opening balance
  const createOpeningBalance = useCallback(async (data: any): Promise<OpeningBalance | null> => {
    if (!user) return null;

    try {
      setIsCreating(true);
      
      // Generate reference number if not provided
      if (!data.referenceNumber) {
        data.referenceNumber = await openingBalanceService.generateReferenceNumber();
      }

      // Set account nature based on account type
      const selectedAccount = accounts.find(acc => acc.id === data.accountId);
      if (selectedAccount) {
        data.nature = accountTypeNature[selectedAccount.type] || 'DEBIT';
      }

      const createdBalance = await openingBalanceService.createOpeningBalance(data);
      
      toast.success(successMessages.created);
      await loadOpeningBalances();
      await loadStats();
      
      return createdBalance;
    } catch (error: any) {
      toast.error(error.response?.data?.message || errorMessages.importFailed);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user, accounts, loadOpeningBalances, loadStats]);

  // Update opening balance
  const updateOpeningBalance = useCallback(async (id: string, data: any): Promise<OpeningBalance | null> => {
    if (!user) return null;

    try {
      setIsUpdating(true);
      
      // Set account nature based on account type
      const selectedAccount = accounts.find(acc => acc.id === data.accountId);
      if (selectedAccount) {
        data.nature = accountTypeNature[selectedAccount.type] || 'DEBIT';
      }

      const updatedBalance = await openingBalanceService.updateOpeningBalance(id, data);
      
      toast.success(successMessages.updated);
      await loadOpeningBalances();
      await loadStats();
      
      return updatedBalance;
    } catch (error: any) {
      toast.error(error.response?.data?.message || errorMessages.importFailed);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [user, accounts, loadOpeningBalances, loadStats]);

  // Delete opening balance
  const deleteOpeningBalance = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsDeleting(true);
      
      await openingBalanceService.deleteOpeningBalance(id);
      
      toast.success(successMessages.deleted);
      await loadOpeningBalances();
      await loadStats();
      
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || errorMessages.importFailed);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [user, loadOpeningBalances, loadStats]);

  // Import opening balances
  const importOpeningBalances = useCallback(async (file: File, options: any = {}): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsImporting(true);
      
      // Parse CSV file
      let records;
      try {
        records = await openingBalanceService.parseCSV(file);
      } catch (parseError: any) {
        toast.error(`CSV Error: ${parseError.message}`);
        return false;
      }
      
      // Validate CSV data
      const validation = openingBalanceService.validateCSVData(records);
      if (!validation.valid) {
        const errorMessage = validation.errors.length > 3 
          ? `${validation.errors.slice(0, 3).join(', ')} and ${validation.errors.length - 3} more errors`
          : validation.errors.join(', ');
        toast.error(`Import validation failed: ${errorMessage}`);
        return false;
      }

      // Import opening balances
      const result = await openingBalanceService.importOpeningBalances(records, options);
      
      if (result.success) {
        toast.success(`${successMessages.imported} - ${result.created} records created`);
        if (result.errors.length > 0) {
          const errorMessage = result.errors.length > 3 
            ? `${result.errors.slice(0, 3).join(', ')} and ${result.errors.length - 3} more errors`
            : result.errors.join(', ');
          toast.error(`Import completed with ${result.errors.length} errors: ${errorMessage}`);
        }
        await loadOpeningBalances();
        await loadStats();
        return true;
      } else {
        toast.error('Import failed');
        return false;
      }
    } catch (error: any) {
      // Provide more specific error messages
      if (error.message.includes('CSV')) {
        toast.error(error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(errorMessages.importFailed);
      }
      return false;
    } finally {
      setIsImporting(false);
    }
  }, [user, loadOpeningBalances, loadStats]);

  // Export opening balances
  const exportOpeningBalances = useCallback(async (format: 'excel' | 'pdf' | 'csv'): Promise<void> => {
    if (!user) return;

    try {
      setIsExporting(true);
      
      const params = {
        search: searchTerm,
        sortBy: sort.column,
        sortOrder: sort.direction,
        ...filters
      };

      const blob = await openingBalanceService.exportOpeningBalances(format, params);
      
      // Map format to correct file extension
      const fileExtension = format === 'excel' ? 'xlsx' : format;
      const filename = `opening_balances_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      
      openingBalanceService.downloadFile(blob, filename);
      toast.success(successMessages.exported);
    } catch (error: any) {
      toast.error(error.response?.data?.message || errorMessages.exportFailed);
    } finally {
      setIsExporting(false);
    }
  }, [user, searchTerm, sort, filters]);

  // Download template
  const downloadTemplate = useCallback(async (): Promise<void> => {
    try {
      const blob = await openingBalanceService.downloadTemplate(filters.financialYearId);
      openingBalanceService.downloadFile(blob, 'opening_balances_template.csv');
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || errorMessages.templateDownloadFailed);
    }
  }, [filters.financialYearId]);

  // Generate reference number
  const generateReferenceNumber = useCallback(async (): Promise<string> => {
    return await openingBalanceService.generateReferenceNumber();
  }, []);

  // Get account nature based on account type
  const getAccountNature = useCallback((accountType: string): 'DEBIT' | 'CREDIT' => {
    return openingBalanceService.getAccountNature(accountType);
  }, []);

  // Format amount with currency
  const formatAmount = useCallback((amount: number, currencyCode: string = 'TZS', currencySymbol?: string): string => {
    return openingBalanceService.formatAmount(amount, currencyCode, currencySymbol);
  }, []);

  // Calculate equivalent amount
  const calculateEquivalentAmount = useCallback((amount: number, exchangeRate: number): number => {
    return openingBalanceService.calculateEquivalentAmount(amount, exchangeRate);
  }, []);

  // Validate CSV data
  const validateCSVData = useCallback((data: any[]): { valid: boolean; errors: string[] } => {
    return openingBalanceService.validateCSVData(data);
  }, []);

  // Parse CSV file
  const parseCSV = useCallback(async (file: File): Promise<any[]> => {
    return await openingBalanceService.parseCSV(file);
  }, []);

  // Filtered opening balances
  const filteredOpeningBalances = useMemo(() => {
    return openingBalances;
  }, [openingBalances]);

  // Set page for pagination
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadOpeningBalances(); // This will also load allOpeningBalances
      loadAccounts();
      loadCurrencies();
      loadFinancialYears();
      loadCompanySettings();
      loadCurrentFinancialYear();
      loadStats();
    }
  }, [user, loadOpeningBalances, loadAccounts, loadCurrencies, loadFinancialYears, loadCompanySettings, loadCurrentFinancialYear, loadStats]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return {
    // State
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
    
    // Actions
    loadOpeningBalances,
    loadAccounts,
    loadCurrencies,
    loadFinancialYears,
    loadCompanySettings,
    loadCurrentFinancialYear,
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
    
    // Computed
    filteredOpeningBalances,
    hasData,
    canCreate,
    canUpdate,
    canDelete,
    canImport,
    canExport,
    
    // Utilities
    generateReferenceNumber,
    getAccountNature,
    formatAmount,
    calculateEquivalentAmount,
    validateCSVData,
    parseCSV
  };
}; 