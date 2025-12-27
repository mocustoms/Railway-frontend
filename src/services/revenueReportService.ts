import api from './api';

export interface RevenueReportItem {
  id: string;
  transactionRefNumber: string;
  transactionType: string;
  transactionDate: string;
  dueDate: string;
  validUntil: string;
  deliveryDate: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  salesAgentId: string;
  salesAgentName: string;
  salesAgentNumber: string;
  financialYearId: string;
  financialYearName: string;
  financialYearCode: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalWhtAmount: number;
  amountAfterDiscount: number;
  amountAfterWht: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  equivalentAmount: number;
  currencyId: string;
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
  exchangeRate: number;
  systemDefaultCurrencyName: string;
  status: string;
  isActive: boolean;
  isCancelled: boolean;
  productType: string;
  productCategoryName: string;
  productCategoryCode: string;
  brandName: string;
  manufacturerName: string;
  modelName: string;
  colorName: string;
  packagingName: string;
  priceCategoryName: string;
  priceCategoryCode: string;
  storeLocationName: string;
  sourceInvoiceNumber: string;
  sourceOrderNumber: string;
  receiptNumber: string;
  receiptInvoiceNumber: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueReportFilters {
  dateFrom?: string;
  dateTo?: string;
  storeId?: string;
  customerId?: string;
  salesAgentId?: string;
  transactionType?: string;
  status?: string;
  productCategoryId?: string;
  brandNameId?: string;
  manufacturerId?: string;
  modelId?: string;
  colorId?: string;
  priceCategoryId?: string;
  financialYearId?: string;
  currencyId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RevenueReportStats {
  totalTransactions: number;
  totalAmount: number;
  totalPaidAmount: number;
  totalBalanceAmount: number;
  totalSubtotal: number;
  totalDiscountAmount: number;
  totalTaxAmount: number;
  transactionTypeDistribution: Array<{
    type: string;
    count: number;
    total: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
  lastUpdate: string;
}

export interface RevenueReportResponse {
  success: boolean;
  data: RevenueReportItem[];
  total: number;
}

export interface RevenueReportStatsResponse {
  success: boolean;
  stats: RevenueReportStats;
}

export interface TopProduct {
  id: string;
  name: string;
  code?: string;
  revenue: number;
  quantity?: number;
  productCategoryName?: string;
  brandName?: string;
  manufacturerName?: string;
  transactionRefNumbers?: string[]; // Array of transaction reference numbers for this product
}

export const revenueReportService = {
  // Get Revenue Report Data
  getRevenueReport: async (filters?: RevenueReportFilters): Promise<RevenueReportResponse> => {
    const params: any = {};
    
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.storeId) params.storeId = filters.storeId;
    if (filters?.customerId) params.customerId = filters.customerId;
    if (filters?.salesAgentId) params.salesAgentId = filters.salesAgentId;
    if (filters?.transactionType) params.transactionType = filters.transactionType;
    if (filters?.status) params.status = filters.status;
    if (filters?.productCategoryId) params.productCategoryId = filters.productCategoryId;
    if (filters?.brandNameId) params.brandNameId = filters.brandNameId;
    if (filters?.manufacturerId) params.manufacturerId = filters.manufacturerId;
    if (filters?.modelId) params.modelId = filters.modelId;
    if (filters?.colorId) params.colorId = filters.colorId;
    if (filters?.priceCategoryId) params.priceCategoryId = filters.priceCategoryId;
    if (filters?.financialYearId) params.financialYearId = filters.financialYearId;
    if (filters?.currencyId) params.currencyId = filters.currencyId;
    if (filters?.search) params.search = filters.search;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    const response = await api.get('/revenue-report', { params });
    return response.data;
  },

  // Get Revenue Report Statistics
  getRevenueReportStats: async (filters?: RevenueReportFilters): Promise<RevenueReportStatsResponse> => {
    const params: any = {};
    
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.storeId) params.storeId = filters.storeId;
    if (filters?.customerId) params.customerId = filters.customerId;
    if (filters?.salesAgentId) params.salesAgentId = filters.salesAgentId;
    if (filters?.transactionType) params.transactionType = filters.transactionType;
    if (filters?.status) params.status = filters.status;
    if (filters?.productCategoryId) params.productCategoryId = filters.productCategoryId;
    if (filters?.financialYearId) params.financialYearId = filters.financialYearId;
    if (filters?.currencyId) params.currencyId = filters.currencyId;

    const response = await api.get('/revenue-report/stats', { params });
    return response.data;
  },

  // Get Top/Bottom Products by Revenue - Directly from SalesTransaction table
  getTopProducts: async (
    filters: RevenueReportFilters,
    type: 'top' | 'bottom' = 'top',
    limit: number = 5
  ): Promise<TopProduct[]> => {
    try {
      // Build query parameters
      const params: any = {
        type,
        limit
      };

      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.storeId) params.storeId = filters.storeId;
      if (filters.customerId) params.customerId = filters.customerId;

      // Call the new backend endpoint that queries SalesTransaction directly
      const response = await api.get('/revenue-report/top-products', { params });
      
      // api.get() returns AxiosResponse, so we need to access response.data
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      return [];
    }
  },
};

export default revenueReportService;

