import { api } from './api';
import { OpeningBalance, Account, Currency, FinancialYear, ExchangeRate } from '../types';

// API base URL
const API_BASE = '/opening-balances';

// Response types
interface OpeningBalanceResponse {
  openingBalances: OpeningBalance[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface ImportResponse {
  success: boolean;
  created: number;
  errors: string[];
  results: any[];
}

interface ExportResponse {
  success: boolean;
  data: string;
  filename: string;
}

// Query parameters interface
interface OpeningBalanceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  financialYearId?: string;
  accountId?: string;
  currencyId?: string;
  type?: 'debit' | 'credit';
  accountType?: string;
}

// Form data interface
interface OpeningBalanceFormData {
  accountId: string;
  amount: number;
  originalAmount?: number;
  type: 'debit' | 'credit';
  nature?: 'DEBIT' | 'CREDIT';
  date: string;
  description?: string;
  currencyId?: string;
  exchangeRateId?: string;
  exchangeRate?: number;
  financialYearId?: string;
}

// Import data interface
interface ImportRecord {
  accountCode: string;
  accountName?: string;
  amount: number;
  type: 'debit' | 'credit';
  date: string;
  description?: string;
  currencyCode?: string;
  exchangeRate?: number;
  financialYear?: string;
}

// Opening Balance Service
export const openingBalanceService = {
  // Get all opening balances with pagination, search, and filters
  async getOpeningBalances(params: OpeningBalanceQueryParams = {}): Promise<OpeningBalanceResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`${API_BASE}?${queryParams}`);
    return response.data;
  },

  // Check if opening balance exists for account and financial year
  async checkOpeningBalanceExists(accountId: string, financialYearId?: string): Promise<{ exists: boolean; openingBalance: OpeningBalance | null }> {
    const params = new URLSearchParams();
    params.append('accountId', accountId);
    if (financialYearId) {
      params.append('financialYearId', financialYearId);
    }
    const response = await api.get(`${API_BASE}/check-exists?${params}`);
    return response.data;
  },

  // Get opening balance by ID
  async getOpeningBalance(id: string): Promise<OpeningBalance> {
    const response = await api.get(`${API_BASE}/${id}`);
    return response.data;
  },

  // Create new opening balance
  async createOpeningBalance(data: OpeningBalanceFormData): Promise<OpeningBalance> {
    const response = await api.post(API_BASE, data);
    return response.data;
  },

  // Update opening balance
  async updateOpeningBalance(id: string, data: Partial<OpeningBalanceFormData>): Promise<OpeningBalance> {
    const response = await api.put(`${API_BASE}/${id}`, data);
    return response.data;
  },

  // Delete opening balance
  async deleteOpeningBalance(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  // Get available currencies
  async getCurrencies(): Promise<Currency[]> {
    const response = await api.get(`${API_BASE}/currencies`);
    return response.data;
  },

  // Get available financial years
  async getFinancialYears(): Promise<FinancialYear[]> {
    const response = await api.get(`${API_BASE}/financial-years`);
    return response.data;
  },

  // Get all accounts (for editing)
  // Get leaf accounts for opening balance selection (accounts without children)
  async getLeafAccounts(): Promise<Account[]> {
    const response = await api.get('/accounts/leaf');
    return response.data;
  },

  // Get all accounts (for opening balance selection - only leaf accounts)
  async getAllAccounts(): Promise<Account[]> {
    // For opening balances, we only want leaf accounts (accounts without children)
    const response = await api.get('/accounts/leaf');
    return response.data;
  },

  // Get company settings (for default currency)
  async getCompanySettings(): Promise<{ defaultCurrencyId?: string; defaultCurrency?: Currency }> {
    try {
      const response = await api.get('/company');
      if (response.data.success && response.data.data) {
        return {
          defaultCurrencyId: response.data.data.defaultCurrencyId,
          defaultCurrency: response.data.data.defaultCurrency
        };
      }
      return {};
    } catch (error) {
      return {};
    }
  },

  // Get current financial year
  async getCurrentFinancialYear(): Promise<FinancialYear | null> {
    try {
      const response = await api.get('/financial-years/current');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      return null;
    }
  },

  // Get accounts without opening balances
  async getAccountsWithoutBalances(financialYearId?: string): Promise<Account[]> {
    const params = financialYearId ? `?financialYearId=${financialYearId}` : '';
    const response = await api.get(`${API_BASE}/accounts/without-balances${params}`);
    return response.data;
  },

  // Get exchange rates for a specific currency
  async getExchangeRates(currencyId: string): Promise<ExchangeRate[]> {
    const response = await api.get(`${API_BASE}/exchange-rates/${currencyId}`);
    return response.data;
  },

  // Get latest exchange rate for a currency code to default currency
  async getLatestExchangeRate(currencyId: string): Promise<{ rate: number; id: string | null }> {
    const response = await api.get(`/currency/exchange-rates/latest?currencyId=${currencyId}`);
    return response.data;
  },

  // Import opening balances from CSV
  async importOpeningBalances(
    records: ImportRecord[],
    options: {
      currencyId?: string;
      exchangeRateId?: string;
      financialYearId?: string;
    } = {}
  ): Promise<ImportResponse> {
    const response = await api.post(`${API_BASE}/import`, {
      records,
      ...options
    });
    return response.data;
  },

  // Save import as draft
  async saveDraft(balances: any[]): Promise<{
    draftId: string;
    validRecords: number;
    errors: any[];
    totalAmount: number;
  }> {
    const response = await api.post(`${API_BASE}/draft`, { balances });
    return response.data;
  },

  // Download CSV template
  async downloadTemplate(financialYearId?: string): Promise<Blob> {
    const params = financialYearId ? `?financialYearId=${financialYearId}` : '';
    const response = await api.get(`${API_BASE}/template/csv${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export opening balances
  async exportOpeningBalances(
    format: 'excel' | 'pdf' | 'csv',
    params: OpeningBalanceQueryParams = {}
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`${API_BASE}/export/${format}?${queryParams}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate reference number
  async generateReferenceNumber(): Promise<string> {
    // Since the backend generates reference numbers automatically,
    // we just return a fallback reference number for the frontend
    // The actual reference number will be generated by the backend
    return `OB-${Date.now()}`;
  },

  // Get opening balance statistics
  async getStatistics(): Promise<{
    totalOpeningBalances: number;
    totalDebitAmount: number;
    totalCreditAmount: number;
    activeFinancialYears: number;
    delta: number;
  }> {
    const response = await api.get(`${API_BASE}/statistics`);
    return response.data;
  },

  // Validate CSV data
  validateCSVData(data: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    data.forEach((record, index) => {
      const rowNumber = index + 1;
      
      // Check required fields
      if (!record.accountCode) {
        errors.push(`Row ${rowNumber}: Account code is required`);
      }
      
      if (!record.amount || record.amount <= 0) {
        errors.push(`Row ${rowNumber}: Amount must be a positive number`);
      }
      
      if (!record.type || !['debit', 'credit'].includes(record.type.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Type must be 'debit' or 'credit'`);
      }
      
      if (!record.date || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
        errors.push(`Row ${rowNumber}: Date must be in YYYY-MM-DD format`);
      }
      
      // Account code format validation removed - codes are auto-generated and may contain hyphens
      // The backend will validate that the account exists by code
      
      // Validate amount format
      if (record.amount && !/^\d+(\.\d{1,2})?$/.test(record.amount.toString())) {
        errors.push(`Row ${rowNumber}: Amount must be a valid number with up to 2 decimal places`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Parse CSV file
  async parseCSV(file: File): Promise<ImportRecord[]> {
    return new Promise((resolve, reject) => {
      // Validate file
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      // Check file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        reject(new Error('File must be a CSV file'));
        return;
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        reject(new Error('File size must be less than 10MB'));
        return;
      }

      // Check if file is empty
      if (file.size === 0) {
        reject(new Error('File is empty'));
        return;
      }

      // Ensure we have a proper File object
      let fileToRead = file;
      if (file instanceof Blob && !(file instanceof File)) {
        // Convert Blob to File if needed
        const fileName = (file as any).name || 'import.csv';
        fileToRead = new File([file], fileName, { type: 'text/csv' });
        }

      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string;
          
          if (!csv || csv.trim().length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          const lines = csv.split('\n').filter(line => line.trim().length > 0);
          if (lines.length < 2) {
            reject(new Error('CSV file must have at least a header row and one data row'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          // Validate required headers
          const requiredHeaders = ['Account Code', 'Amount'];
          const missingHeaders = requiredHeaders.filter(requiredHeader => {
            // Check for exact match first
            if (headers.includes(requiredHeader)) return false;
            
            // Check for case-insensitive match
            if (headers.some(h => h.toLowerCase() === requiredHeader.toLowerCase())) return false;
            
            // Check for variations (e.g., "Account Code" vs "AccountCode")
            const normalizedRequired = requiredHeader.toLowerCase().replace(/\s+/g, '');
            if (headers.some(h => h.toLowerCase().replace(/\s+/g, '') === normalizedRequired)) return false;
            
            // Check for partial matches (e.g., "Account Code" vs "Account")
            if (headers.some(h => h.toLowerCase().includes(requiredHeader.toLowerCase().split(' ')[0]))) return false;
            
            return true;
          });
          
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}. Available headers: ${headers.join(', ')}`));
            return;
          }

          const records: ImportRecord[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            try {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const record: any = {};
              
              headers.forEach((header, index) => {
                record[header] = values[index] || '';
              });
              
              // Map CSV headers to our expected format
              const rawAmount = record['Amount'] || record.amount || '0';
              const cleanAmount = typeof rawAmount === 'string' ? rawAmount.trim() : rawAmount;
              
              const rawExchangeRate = record['Exchange Rate'] || record['ExchangeRate'] || record['exchange rate'] || record['exchangerate'] || record.exchangeRate || '1';
              const cleanExchangeRate = typeof rawExchangeRate === 'string' ? rawExchangeRate.trim() : rawExchangeRate;
              const parsedExchangeRate = cleanExchangeRate === '' ? 1 : parseFloat(cleanExchangeRate);
              
              const mappedRecord: ImportRecord = {
                accountCode: record['Account Code'] || record['AccountCode'] || record['account code'] || record['accountcode'] || record.accountCode || '',
                accountName: record['Account Name'] || record['AccountName'] || record['account name'] || record['accountname'] || record.accountName || '',
                amount: cleanAmount === '' ? 0 : parseFloat(cleanAmount),
                type: (record['Type'] || record.type || 'debit').toLowerCase() as 'debit' | 'credit',
                date: record['Date'] || record.date || '',
                description: record['Description'] || record.description || '',
                currencyCode: record['Currency Code'] || record['CurrencyCode'] || record['currency code'] || record['currencycode'] || record.currencyCode || '',
                exchangeRate: parsedExchangeRate,
                financialYear: record['Financial Year'] || record['FinancialYear'] || record['financial year'] || record['financialyear'] || record.financialYear || ''
              };
              
              // Validate required fields
              if (!mappedRecord.accountCode) {
                throw new Error(`Row ${i + 1}: Account Code is required`);
              }
              
              // Improved amount validation
              if (isNaN(mappedRecord.amount)) {
                throw new Error(`Row ${i + 1}: Amount must be a valid number. Received: "${record['Amount'] || record.amount}"`);
              }
              
              if (mappedRecord.amount < 0) {
                throw new Error(`Row ${i + 1}: Amount cannot be negative. Received: ${mappedRecord.amount}`);
              }
              
              if (mappedRecord.amount === 0) {
                }
              
              // Exchange rate validation
              if (isNaN(parsedExchangeRate)) {
                throw new Error(`Row ${i + 1}: Exchange Rate must be a valid number. Received: "${rawExchangeRate}"`);
              }
              
              if (parsedExchangeRate <= 0) {
                throw new Error(`Row ${i + 1}: Exchange Rate must be a positive number. Received: ${parsedExchangeRate}`);
              }
              
              if (parsedExchangeRate === 1) {
                }
              
              records.push(mappedRecord);
            } catch (rowError: any) {
              reject(new Error(`Error in row ${i + 1}: ${rowError.message}`));
              return;
            }
          }
          
          if (records.length === 0) {
            reject(new Error('No valid records found in CSV file'));
            return;
          }
          
          resolve(records);
        } catch (error: any) {
          reject(new Error(`Failed to parse CSV file: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        // Try to provide more specific error messages
        let errorMessage = 'Failed to read CSV file. ';
        if (fileToRead.size === 0) {
          errorMessage += 'The file appears to be empty.';
        } else if (fileToRead.size > 10 * 1024 * 1024) {
          errorMessage += 'The file is too large (max 10MB).';
        } else if (!fileToRead.name.toLowerCase().endsWith('.csv')) {
          errorMessage += 'Please ensure the file is a valid CSV file.';
        } else {
          errorMessage += 'Please check if the file is corrupted or try a different file.';
        }
        
        reject(new Error(errorMessage));
      };
      
      reader.onabort = () => {
        reject(new Error('File reading was aborted'));
      };
      
      // Add a small delay to ensure file is fully loaded
      setTimeout(() => {
        try {
          // First try UTF-8
          reader.readAsText(fileToRead, 'UTF-8');
        } catch (encodingError) {
          try {
            reader.readAsText(fileToRead);
          } catch (fallbackError) {
            reject(new Error('Unable to read file with any encoding method'));
          }
        }
      }, 100); // Small delay to ensure file is ready
    });
  },

  // Download file helper
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Format amount with currency symbol (handles auto-generated currency codes)
  formatAmount(amount: number, currencyCodeOrSymbol: string = 'TZS', currencySymbol?: string): string {
    // If currencySymbol is provided, use it directly
    if (currencySymbol) {
      const formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
      return `${currencySymbol}${formattedNumber}`;
    }
    
    // Try to use currencyCode if it's a valid ISO code (3 letters)
    // Otherwise, format without currency style
    const isISOCode = /^[A-Z]{3}$/.test(currencyCodeOrSymbol);
    
    if (isISOCode) {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currencyCodeOrSymbol,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
      } catch (error) {
        // Fallback if currency code is invalid
        const formattedNumber = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
        return `${currencyCodeOrSymbol} ${formattedNumber}`;
      }
    } else {
      // For auto-generated codes, format without currency style
      const formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
      return formattedNumber; // Return formatted number without symbol if code is invalid
    }
  },

  // Calculate equivalent amount
  calculateEquivalentAmount(amount: number, exchangeRate: number): number {
    return amount * exchangeRate;
  },

  // Get account nature based on account type
  getAccountNature(accountType: string): 'DEBIT' | 'CREDIT' {
    const natureMap: Record<string, 'DEBIT' | 'CREDIT'> = {
      'ASSET': 'DEBIT',
      'LIABILITY': 'CREDIT',
      'EQUITY': 'CREDIT',
      'REVENUE': 'CREDIT',
      'EXPENSE': 'DEBIT'
    };
    return natureMap[accountType] || 'DEBIT';
  }
};

export default openingBalanceService; 