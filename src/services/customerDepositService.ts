import api from './api';
import { 
  CustomerDeposit, 
  CustomerDepositStats, 
  CustomerDepositFilters, 
  CustomerDepositSortConfig,
  Customer,
  PaymentType,
  BankDetail,
  Currency,
  Account
} from '../types';

export const customerDepositService = {
  // Get customer deposit statistics
  async getStats(filters: CustomerDepositFilters = {}): Promise<CustomerDepositStats> {
    const params = new URLSearchParams();
    
    // Add filter parameters
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.currencyId) {
      params.append('currencyId', filters.currencyId);
    }
    if (filters.paymentTypeId) {
      params.append('paymentTypeId', filters.paymentTypeId);
    }
    if (filters.bankDetailId) {
      params.append('bankDetailId', filters.bankDetailId);
    }
    if (filters.startDate) {
      params.append('start_date', filters.startDate);
    }
    if (filters.endDate) {
      params.append('end_date', filters.endDate);
    }

    const response = await api.get(`/customer-deposits/stats?${params}`);
    return response.data.stats;
  },

  // Get all customer deposits with pagination, search, and sorting
  async getAll(
    page: number = 1,
    limit: number = 25,
    filters: CustomerDepositFilters = {},
    sortConfig: CustomerDepositSortConfig = { column: 'transactionDate', direction: 'desc' }
  ): Promise<{ deposits: CustomerDeposit[]; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortConfig.column,
      sortOrder: sortConfig.direction,
      ...(filters.search && { search: filters.search }),
      ...(filters.currencyId && { currencyId: filters.currencyId }),
      ...(filters.paymentTypeId && { paymentTypeId: filters.paymentTypeId }),
      ...(filters.bankDetailId && { bankDetailId: filters.bankDetailId }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.startDate && { start_date: filters.startDate }),
      ...(filters.endDate && { end_date: filters.endDate })
    });

    const response = await api.get(`/customer-deposits?${params}`);
    return response.data;
  },

  // Get a single customer deposit by ID
  async getById(id: string): Promise<CustomerDeposit> {
    const response = await api.get(`/customer-deposits/${id}`);
    return response.data;
  },

  // Create a new customer deposit
  async create(depositData: any): Promise<CustomerDeposit> {
    const formData = new FormData();
    
    // Append all form fields
    Object.keys(depositData).forEach(key => {
      if (key === 'document' && depositData[key] instanceof File) {
        formData.append('document', depositData[key]);
      } else if (depositData[key] !== null && depositData[key] !== undefined) {
        formData.append(key, depositData[key]);
      }
    });

    const response = await api.post('/customer-deposits', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update a customer deposit
  async update(id: string, depositData: any): Promise<CustomerDeposit> {
    const formData = new FormData();
    
    // Append all form fields
    Object.keys(depositData).forEach(key => {
      if (key === 'document' && depositData[key] instanceof File) {
        formData.append('document', depositData[key]);
      } else if (depositData[key] !== null && depositData[key] !== undefined) {
        formData.append(key, depositData[key]);
      }
    });

    const response = await api.put(`/customer-deposits/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a customer deposit
  async delete(id: string): Promise<void> {
    await api.delete(`/customer-deposits/${id}`);
  },

  // Toggle customer deposit status
  async toggleStatus(id: string): Promise<CustomerDeposit> {
    const response = await api.put(`/customer-deposits/${id}/toggle-status`);
    return response.data;
  },

  // Export to Excel
  async exportToExcel(filters: CustomerDepositFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });

    const response = await api.get(`/customer-deposits/export/excel?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export to PDF
  async exportToPDF(filters: CustomerDepositFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });

    const response = await api.get(`/customer-deposits/export/pdf?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Search customers
  async searchCustomers(search: string = ''): Promise<Customer[]> {
    const response = await api.get(`/customer-deposits/customers/search?search=${encodeURIComponent(search)}`);
    return response.data;
  },

  // Get payment types (filtered to only show those used in customer deposits)
  async getPaymentTypes(): Promise<PaymentType[]> {
    const response = await api.get('/payment-types?status=active&used_in_customer_deposits=true&limit=1000');
    const data = response.data.paymentTypes || response.data;
    return Array.isArray(data) ? data : [];
  },

  // Get payment types for debtor payments (used in invoice payments)
  async getPaymentTypesForDebtorPayments(): Promise<PaymentType[]> {
    const response = await api.get('/payment-types?status=active&used_in_debtor_payments=true&limit=1000');
    const data = response.data.paymentTypes || response.data;
    return Array.isArray(data) ? data : [];
  },

  // Get bank details
  async getBankDetails(): Promise<BankDetail[]> {
    const response = await api.get('/bank-details?status=active&limit=1000');
    const data = response.data.bankDetails || response.data;
    return Array.isArray(data) ? data : [];
  },

  // Get currencies
  async getCurrencies(): Promise<Currency[]> {
    try {
      const response = await api.get('/currency?status=active&limit=1000');
      // Backend returns { currencies: [...], total, page, ... }
      const data = response.data?.currencies || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  },

  // Get leaf accounts
  async getLeafAccounts(): Promise<Account[]> {
    const response = await api.get('/accounts/leaf');
    const data = response.data;
    return Array.isArray(data) ? data : [];
  }
};

export default customerDepositService;
