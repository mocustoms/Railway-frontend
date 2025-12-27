import { apiService } from './api';
import { 
  Account, 
  FinancialYear, 
  OpeningBalance, 
  TrialBalance,
  AccountType,
  PaginatedResponse 
} from '../types';

export const financialService = {
  // Chart of Accounts CRUD operations
  getAccounts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    accountType?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Account>> => {
    const response = await apiService.get<PaginatedResponse<Account>>('/accounts', { params });
    return response.data!;
  },

  getAccount: async (id: number): Promise<Account> => {
    const response = await apiService.get<Account>(`/accounts/${id}`);
    return response.data!;
  },

  createAccount: async (accountData: Partial<Account>): Promise<Account> => {
    const response = await apiService.post<Account>('/accounts', accountData);
    return response.data!;
  },

  updateAccount: async (id: number, accountData: Partial<Account>): Promise<Account> => {
    const response = await apiService.put<Account>(`/accounts/${id}`, accountData);
    return response.data!;
  },

  deleteAccount: async (id: number): Promise<void> => {
    await apiService.delete(`/accounts/${id}`);
  },

  // Account Types
  getAccountTypes: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<AccountType>> => {
    const response = await apiService.get<PaginatedResponse<AccountType>>('/administration/account-types', { params });
    return response.data!;
  },

  getAccountType: async (id: string): Promise<AccountType> => {
    const response = await apiService.get<AccountType>(`/administration/account-types/${id}`);
    return response.data!;
  },

  createAccountType: async (typeData: Partial<AccountType>): Promise<AccountType> => {
    const response = await apiService.post<AccountType>('/administration/account-types', typeData);
    return response.data!;
  },

  updateAccountType: async (id: string, typeData: Partial<AccountType>): Promise<AccountType> => {
    const response = await apiService.put<AccountType>(`/administration/account-types/${id}`, typeData);
    return response.data!;
  },

  deleteAccountType: async (id: string): Promise<void> => {
    await apiService.delete(`/administration/account-types/${id}`);
  },

  // Financial Year CRUD operations
  getFinancialYears: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<FinancialYear>> => {
    const response = await apiService.get<PaginatedResponse<FinancialYear>>('/financial-years', { params });
    return response.data!;
  },

  getFinancialYear: async (id: number): Promise<FinancialYear> => {
    const response = await apiService.get<FinancialYear>(`/financial-years/${id}`);
    return response.data!;
  },

  createFinancialYear: async (yearData: Partial<FinancialYear>): Promise<FinancialYear> => {
    const response = await apiService.post<FinancialYear>('/financial-years', yearData);
    return response.data!;
  },

  updateFinancialYear: async (id: number, yearData: Partial<FinancialYear>): Promise<FinancialYear> => {
    const response = await apiService.put<FinancialYear>(`/financial-years/${id}`, yearData);
    return response.data!;
  },

  deleteFinancialYear: async (id: number): Promise<void> => {
    await apiService.delete(`/financial-years/${id}`);
  },

  // Set active financial year
  setActiveFinancialYear: async (id: number): Promise<FinancialYear> => {
    const response = await apiService.patch<FinancialYear>(`/financial-years/${id}/set-active`);
    return response.data!;
  },

  // Opening Balances
  getOpeningBalances: async (params?: {
    financialYearId?: number;
    accountId?: number;
  }): Promise<OpeningBalance[]> => {
    const response = await apiService.get<OpeningBalance[]>('/opening-balances', { params });
    return response.data!;
  },

  createOpeningBalance: async (balanceData: Partial<OpeningBalance>): Promise<OpeningBalance> => {
    const response = await apiService.post<OpeningBalance>('/opening-balances', balanceData);
    return response.data!;
  },

  updateOpeningBalance: async (id: number, balanceData: Partial<OpeningBalance>): Promise<OpeningBalance> => {
    const response = await apiService.put<OpeningBalance>(`/opening-balances/${id}`, balanceData);
    return response.data!;
  },

  deleteOpeningBalance: async (id: number): Promise<void> => {
    await apiService.delete(`/opening-balances/${id}`);
  },

  // Bulk opening balances
  bulkCreateOpeningBalances: async (balances: Partial<OpeningBalance>[]): Promise<OpeningBalance[]> => {
    const response = await apiService.post<OpeningBalance[]>('/opening-balances/bulk', { balances });
    return response.data!;
  },

  // Trial Balance
  getTrialBalance: async (params?: {
    financialYearId?: number;
    asOfDate?: string;
    includeOpeningBalances?: boolean;
  }): Promise<TrialBalance[]> => {
    const response = await apiService.get<TrialBalance[]>('/trial-balance', { params });
    return response.data!;
  },

  // General Ledger
  getGeneralLedger: async (params?: {
    accountId?: number;
    financialYearId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const response = await apiService.get<PaginatedResponse<any>>('/general-ledger', { params });
    return response.data!;
  },

  // Journal Entries
  getJournalEntries: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    financialYearId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any>> => {
    const response = await apiService.get<PaginatedResponse<any>>('/journal-entries', { params });
    return response.data!;
  },

  createJournalEntry: async (entryData: any): Promise<any> => {
    const response = await apiService.post<any>('/journal-entries', entryData);
    return response.data!;
  },

  updateJournalEntry: async (id: number, entryData: any): Promise<any> => {
    const response = await apiService.put<any>(`/journal-entries/${id}`, entryData);
    return response.data!;
  },

  deleteJournalEntry: async (id: number): Promise<void> => {
    await apiService.delete(`/journal-entries/${id}`);
  },

  // Financial Reports
  getBalanceSheet: async (params?: {
    financialYearId?: number;
    asOfDate?: string;
  }): Promise<any> => {
    const response = await apiService.get<any>('/reports/balance-sheet', { params });
    return response.data!;
  },

  getIncomeStatement: async (params?: {
    financialYearId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await apiService.get<any>('/reports/income-statement', { params });
    return response.data!;
  },

  getCashFlowStatement: async (params?: {
    financialYearId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await apiService.get<any>('/reports/cash-flow', { params });
    return response.data!;
  },

  // Export functions
  exportTrialBalance: async (filters?: any): Promise<Blob> => {
    const response = await apiService.get('/trial-balance/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  exportGeneralLedger: async (filters?: any): Promise<Blob> => {
    const response = await apiService.get('/general-ledger/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  exportBalanceSheet: async (filters?: any): Promise<Blob> => {
    const response = await apiService.get('/reports/balance-sheet/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  exportIncomeStatement: async (filters?: any): Promise<Blob> => {
    const response = await apiService.get('/reports/income-statement/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};

export default financialService; 