import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Account, Currency, FinancialYear } from '../types';
import { journalEntryService, JournalEntry, JournalEntryLine, JournalEntryFormData } from '../services/journalEntryService';
import toast from 'react-hot-toast';

export interface JournalEntryFilters {
  financialYearId?: string;
  startDate?: string;
  endDate?: string;
  isPosted?: boolean;
}

interface JournalEntrySort {
  column: string;
  direction: 'asc' | 'desc';
}

interface JournalEntryStats {
  totalEntries: number;
  postedEntries: number;
  unpostedEntries: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
}

interface UseJournalEntryManagementReturn {
  // State
  journalEntries: JournalEntry[];
  accounts: Account[];
  currencies: Currency[];
  financialYears: FinancialYear[];
  stats: JournalEntryStats;
  currentFinancialYear?: FinancialYear;
  defaultCurrencyId?: string;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isPosting: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  searchTerm: string;
  filters: JournalEntryFilters;
  sort: JournalEntrySort;
  
  // Actions
  loadJournalEntries: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  loadCurrencies: () => Promise<void>;
  loadFinancialYears: () => Promise<void>;
  createJournalEntry: (data: JournalEntryFormData) => Promise<JournalEntry | null>;
  updateJournalEntry: (id: string, data: Partial<JournalEntryFormData>) => Promise<JournalEntry | null>;
  deleteJournalEntry: (id: string) => Promise<boolean>;
  postJournalEntry: (id: string) => Promise<boolean>;
  unpostJournalEntry: (id: string) => Promise<boolean>;
  setSearchTerm: (term: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<JournalEntryFilters>>;
  setSort: (sort: JournalEntrySort) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Computed
  hasData: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPost: boolean;
  
  // Utilities
  calculateTotals: (lines: JournalEntryLine[]) => { totalDebit: number; totalCredit: number; isBalanced: boolean };
  formatAmount: (amount: number, currencyCode?: string) => string;
}

export const useJournalEntryManagement = (): UseJournalEntryManagementReturn => {
  const { user } = useAuth();
  
  // State
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [stats, setStats] = useState<JournalEntryStats>({
    totalEntries: 0,
    postedEntries: 0,
    unpostedEntries: 0,
    totalDebitAmount: 0,
    totalCreditAmount: 0
  });
  const [currentFinancialYear, setCurrentFinancialYear] = useState<FinancialYear>();
  const [defaultCurrencyId, setDefaultCurrencyId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<JournalEntryFilters>({});
  const [sort, setSort] = useState<JournalEntrySort>({ column: 'createdAt', direction: 'desc' });

  // Computed values
  const hasData = useMemo(() => journalEntries.length > 0, [journalEntries]);
  const canCreate = useMemo(() => true, []);
  const canUpdate = useMemo(() => true, []);
  const canDelete = useMemo(() => true, []);
  const canPost = useMemo(() => true, []);

  // Load journal entries
  const loadJournalEntries = useCallback(async () => {
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

      const response = await journalEntryService.getJournalEntries(params);
      
      setJournalEntries(response.journalEntries);
      setTotalItems(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);

      // Calculate stats
      const totalDebit = response.journalEntries.reduce((sum, entry) => sum + entry.totalDebit, 0);
      const totalCredit = response.journalEntries.reduce((sum, entry) => sum + entry.totalCredit, 0);
      const posted = response.journalEntries.filter(e => e.isPosted).length;
      
      setStats({
        totalEntries: response.pagination.totalItems,
        postedEntries: posted,
        unpostedEntries: response.pagination.totalItems - posted,
        totalDebitAmount: totalDebit,
        totalCreditAmount: totalCredit
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentPage, pageSize, sort, searchTerm, filters]);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    try {
      const accountsData = await journalEntryService.getAccounts();
      setAccounts(accountsData);
    } catch (error: any) {
      toast.error('Failed to load accounts');
    }
  }, []);

  // Load currencies
  const loadCurrencies = useCallback(async () => {
    try {
      const currenciesData = await journalEntryService.getCurrencies();
      setCurrencies(currenciesData);
      
      // Find default currency
      const defaultCurrency = currenciesData.find(c => c.is_default);
      if (defaultCurrency) {
        setDefaultCurrencyId(defaultCurrency.id);
      }
    } catch (error: any) {
      toast.error('Failed to load currencies');
    }
  }, []);

  // Load financial years
  const loadFinancialYears = useCallback(async () => {
    try {
      const financialYearsData = await journalEntryService.getFinancialYears();
      setFinancialYears(financialYearsData);
      
      // Find current financial year (use isActive instead of isCurrent)
      const current = financialYearsData.find(fy => fy.isActive);
      if (current) {
        setCurrentFinancialYear(current);
      }
    } catch (error: any) {
      toast.error('Failed to load financial years');
    }
  }, []);

  // Create journal entry
  const createJournalEntry = useCallback(async (data: JournalEntryFormData): Promise<JournalEntry | null> => {
    try {
      setIsCreating(true);
      const entry = await journalEntryService.createJournalEntry(data);
      toast.success('Journal entry created successfully');
      await loadJournalEntries();
      return entry;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create journal entry');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [loadJournalEntries]);

  // Update journal entry
  const updateJournalEntry = useCallback(async (id: string, data: Partial<JournalEntryFormData>): Promise<JournalEntry | null> => {
    try {
      setIsUpdating(true);
      const entry = await journalEntryService.updateJournalEntry(id, data);
      toast.success('Journal entry updated successfully');
      await loadJournalEntries();
      return entry;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update journal entry');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [loadJournalEntries]);

  // Delete journal entry
  const deleteJournalEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await journalEntryService.deleteJournalEntry(id);
      toast.success('Journal entry deleted successfully');
      await loadJournalEntries();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete journal entry');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [loadJournalEntries]);

  // Post journal entry
  const postJournalEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsPosting(true);
      await journalEntryService.postJournalEntry(id);
      toast.success('Journal entry posted successfully');
      await loadJournalEntries();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to post journal entry');
      return false;
    } finally {
      setIsPosting(false);
    }
  }, [loadJournalEntries]);

  // Unpost journal entry
  const unpostJournalEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsPosting(true);
      await journalEntryService.unpostJournalEntry(id);
      toast.success('Journal entry unposted successfully');
      await loadJournalEntries();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to unpost journal entry');
      return false;
    } finally {
      setIsPosting(false);
    }
  }, [loadJournalEntries]);

  // Calculate totals
  const calculateTotals = useCallback((lines: JournalEntryLine[]) => {
    const totalDebit = lines
      .filter(line => line.type === 'debit')
      .reduce((sum, line) => sum + (parseFloat(line.amount.toString()) || 0), 0);
    
    const totalCredit = lines
      .filter(line => line.type === 'credit')
      .reduce((sum, line) => sum + (parseFloat(line.amount.toString()) || 0), 0);
    
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01; // Allow for small rounding differences
    
    return { totalDebit, totalCredit, isBalanced };
  }, []);

  // Format amount
  const formatAmount = useCallback((amount: number, currencyCode?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  return {
    // State
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
    
    // Actions
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
    setPage: setCurrentPage,
    setPageSize,
    
    // Computed
    hasData,
    canCreate,
    canUpdate,
    canDelete,
    canPost,
    
    // Utilities
    calculateTotals,
    formatAmount
  };
};

