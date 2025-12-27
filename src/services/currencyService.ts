import api from './api';
import { Currency } from '../types';
import { CurrencyStats, CurrencyFilters, CurrencySortConfig } from '../data/currencyModules';

export interface CurrencyListResponse {
  currencies: Currency[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CurrencyStatsResponse {
  stats: CurrencyStats;
}

class CurrencyService {
  // Get all currencies with pagination, search, and sorting
  async getCurrencies(
    page: number = 1,
    limit: number = 10,
    filters?: CurrencyFilters,
    sort?: CurrencySortConfig
  ): Promise<CurrencyListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.isDefault && filters.isDefault !== 'all') {
      params.append('is_default', filters.isDefault === 'default' ? 'true' : 'false');
    }

    if (sort?.column && sort?.direction) {
      params.append('sort', sort.column);
      params.append('order', sort.direction);
    }

    const response = await api.get(`/currency?${params}`);
    return response.data;
  }

  // Get currency by ID
  async getCurrency(id: string): Promise<Currency> {
    const response = await api.get(`/currency/${id}`);
    return response.data;
  }

  // Create new currency
  async createCurrency(currencyData: Partial<Currency>): Promise<Currency> {
    const response = await api.post('/currency', currencyData);
    return response.data;
  }

  // Update currency
  async updateCurrency(id: string, currencyData: Partial<Currency>): Promise<Currency> {
    const response = await api.put(`/currency/${id}`, currencyData);
    return response.data;
  }

  // Delete currency
  async deleteCurrency(id: string): Promise<void> {
    await api.delete(`/currency/${id}`);
  }

  // Set currency as default
  async setDefaultCurrency(id: string): Promise<Currency> {
    const response = await api.put(`/currency/${id}/set-default`);
    return response.data;
  }

  // Activate/deactivate currency
  async toggleCurrencyStatus(id: string, isActive: boolean): Promise<Currency> {
    const response = await api.put(`/currency/${id}/toggle-status`, { is_active: isActive });
    return response.data;
  }

  // Get currency statistics
  async getCurrencyStats(): Promise<CurrencyStats> {
    const response = await api.get('/currency/stats/overview');
    return response.data.stats;
  }

  // Check if currency code is available
  async checkCodeAvailability(code: string, excludeId?: string): Promise<boolean> {
    const params = new URLSearchParams({ code });
    if (excludeId) {
      params.append('exclude_id', excludeId);
    }
    
    const response = await api.get(`/currency/check-code/availability?${params}`);
    return response.data.available;
  }

  // Export currencies to Excel
  async exportToExcel(filters?: CurrencyFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.isDefault && filters.isDefault !== 'all') {
      params.append('is_default', filters.isDefault === 'default' ? 'true' : 'false');
    }

    const response = await api.get(`/currency/export/excel?${params}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Export currencies to PDF
  async exportToPDF(filters?: CurrencyFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }

    if (filters?.isDefault && filters.isDefault !== 'all') {
      params.append('is_default', filters.isDefault === 'default' ? 'true' : 'false');
    }

    const response = await api.get(`/currency/export/pdf?${params}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Get countries list for currency selection
  async getCountriesList(): Promise<any[]> {
    const response = await api.get('/currency/countries/list');
    return response.data;
  }
}

export const currencyService = new CurrencyService(); 