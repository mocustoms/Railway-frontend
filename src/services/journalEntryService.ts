import { api } from './api';
import { Account, Currency, FinancialYear } from '../types';

// API base URL
const API_BASE = '/journal-entries';

// Journal Entry Line interface
export interface JournalEntryLine {
  id?: string;
  journalEntryId?: string;
  accountId: string;
  accountTypeId?: string;
  type: 'debit' | 'credit';
  amount: number;
  originalAmount?: number;
  equivalentAmount?: number;
  currencyId?: string;
  exchangeRateId?: string;
  exchangeRate?: number;
  description?: string;
  lineNumber?: number;
  account?: Account;
  accountType?: {
    id: string;
    name: string;
    code: string;
  };
  currency?: Currency;
  createdAt?: string;
  updatedAt?: string;
}

// Journal Entry interface
export interface JournalEntry {
  id: string;
  referenceNumber: string;
  entryDate: string;
  description?: string;
  financialYearId: string;
  currencyId?: string;
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  postedAt?: string;
  postedBy?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  financialYear?: FinancialYear;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  poster?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
  lines?: JournalEntryLine[];
}

// Response types
interface JournalEntryResponse {
  journalEntries: JournalEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Query parameters interface
interface JournalEntryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  financialYearId?: string;
  startDate?: string;
  endDate?: string;
  isPosted?: boolean;
}

// Form data interface
interface JournalEntryFormData {
  entryDate: string;
  description?: string;
  financialYearId: string;
  currencyId?: string;
  lines: JournalEntryLineFormData[];
}

interface JournalEntryLineFormData {
  accountId: string;
  type: 'debit' | 'credit';
  amount: number;
  originalAmount?: number;
  currencyId?: string;
  exchangeRateId?: string;
  exchangeRate?: number;
  description?: string;
}

// Journal Entry Service
export const journalEntryService = {
  // Get all journal entries with pagination, search, and filters
  async getJournalEntries(params: JournalEntryQueryParams = {}): Promise<JournalEntryResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`${API_BASE}?${queryParams}`);
    return response.data;
  },

  // Get journal entry by ID
  async getJournalEntry(id: string): Promise<JournalEntry> {
    const response = await api.get(`${API_BASE}/${id}`);
    return response.data;
  },

  // Create new journal entry
  async createJournalEntry(data: JournalEntryFormData): Promise<JournalEntry> {
    const response = await api.post(API_BASE, data);
    return response.data;
  },

  // Update journal entry
  async updateJournalEntry(id: string, data: Partial<JournalEntryFormData>): Promise<JournalEntry> {
    const response = await api.put(`${API_BASE}/${id}`, data);
    return response.data;
  },

  // Delete journal entry
  async deleteJournalEntry(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  // Post journal entry (create GL entries)
  async postJournalEntry(id: string): Promise<JournalEntry> {
    const response = await api.post(`${API_BASE}/${id}/post`);
    return response.data;
  },

  // Unpost journal entry (delete GL entries)
  async unpostJournalEntry(id: string): Promise<JournalEntry> {
    const response = await api.post(`${API_BASE}/${id}/unpost`);
    return response.data;
  },

  // Get available accounts
  async getAccounts(): Promise<Account[]> {
    const response = await api.get(`${API_BASE}/accounts/list`);
    return response.data;
  },

  // Get available currencies
  async getCurrencies(): Promise<Currency[]> {
    const response = await api.get(`${API_BASE}/currencies/list`);
    return response.data;
  },

  // Get available financial years
  async getFinancialYears(): Promise<FinancialYear[]> {
    const response = await api.get(`${API_BASE}/financial-years/list`);
    return response.data;
  }
};

export type { JournalEntryFormData, JournalEntryLineFormData, JournalEntryQueryParams };

