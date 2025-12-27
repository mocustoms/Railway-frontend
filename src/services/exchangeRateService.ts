import api from './api';
import { 
  ExchangeRate, 
  ExchangeRateStats, 
  ExchangeRateFilters, 
  ExchangeRateSortConfig, 
  ExchangeRateFormData, 
  ExchangeRateHistory,
  PaginatedResponse 
} from '../types';

// Get all active exchange rates (for stock adjustments and other calculations)
export const getAllActiveExchangeRates = async (): Promise<ExchangeRate[]> => {
  const response = await api.get('/exchange-rates/all-active');
  return response.data;
};

// Get all exchange rates with pagination, search, and sorting
export const getExchangeRates = async (
  page: number = 1,
  limit: number = 25,
  search?: string,
  sortField?: keyof ExchangeRate,
  sortDirection?: 'asc' | 'desc',
  filters?: ExchangeRateFilters
): Promise<PaginatedResponse<ExchangeRate>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (search) params.append('search', search);
  if (sortField) params.append('sort', sortField);
  if (sortDirection) params.append('order', sortDirection);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);

  const response = await api.get(`/exchange-rates?${params}`);
  return response.data;
};

// Get a single exchange rate by ID
export const getExchangeRate = async (id: string): Promise<ExchangeRate> => {
  const response = await api.get(`/exchange-rates/${id}`);
  return response.data;
};

// Create a new exchange rate
export const createExchangeRate = async (data: ExchangeRateFormData): Promise<ExchangeRate> => {
  const response = await api.post('/exchange-rates', data);
  return response.data;
};

// Update an existing exchange rate
export const updateExchangeRate = async (id: string, data: ExchangeRateFormData): Promise<ExchangeRate> => {
  const response = await api.put(`/exchange-rates/${id}`, data);
  return response.data;
};

// Delete an exchange rate
export const deleteExchangeRate = async (id: string): Promise<void> => {
  await api.delete(`/exchange-rates/${id}`);
};

// Toggle exchange rate status
export const toggleExchangeRateStatus = async (id: string, isActive: boolean): Promise<ExchangeRate> => {
  const response = await api.patch(`/exchange-rates/${id}/toggle-status`, { is_active: isActive });
  return response.data;
};

// Get exchange rate statistics
export const getExchangeRateStats = async (): Promise<ExchangeRateStats> => {
  const response = await api.get('/exchange-rates/statistics');
  return response.data;
};

// Get exchange rate history for a currency pair
export const getExchangeRateHistory = async (
  fromCurrencyId: string, 
  toCurrencyId: string
): Promise<{
  history: ExchangeRateHistory[];
  fromCurrency: any;
  toCurrency: any;
}> => {
  const response = await api.get(`/exchange-rates/history/${fromCurrencyId}/${toCurrencyId}`);
  return response.data;
};

// Export exchange rates to Excel
export const exportToExcel = async (filters?: ExchangeRateFilters): Promise<Blob> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);

  const response = await api.get(`/exchange-rates/export/excel?${params}`, {
    responseType: 'blob'
  });
  return response.data;
};

// Export exchange rates to PDF
export const exportToPdf = async (filters?: ExchangeRateFilters): Promise<Blob> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);

  const response = await api.get(`/exchange-rates/export/pdf?${params}`, {
    responseType: 'blob'
  });
  return response.data;
};

// Get currencies for dropdowns (reusing from currency service)
export const getCurrencies = async (): Promise<any[]> => {
  const response = await api.get('/currency');
  return response.data.currencies;
}; 