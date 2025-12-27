import api from './api';

export interface SalesDetailsReportItem {
  id: string;
  transactionType: 'invoice' | 'order';
  transactionRefNumber: string;
  transactionDate: string;
  dueDate: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  salesAgentId: string;
  salesAgentName: string;
  salesAgentNumber: string;
  productId: string;
  productCode: string;
  productBarcode: string;
  productPartNumber: string;
  productName: string;
  productDescription: string;
  productCategoryId: string;
  productCategoryName: string;
  productCategoryCode: string;
  brandId: string;
  brandName: string;
  manufacturerId: string;
  manufacturerName: string;
  modelId: string;
  modelName: string;
  colorId: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  whtAmount: number;
  lineTotal: number;
  salesTaxId: string;
  salesTaxName: string;
  salesTaxRate: number;
  whtTaxId: string;
  whtTaxName: string;
  whtTaxRate: number;
  currencyId: string;
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
  status: string;
  transactionSubtotal: number;
  transactionDiscountAmount: number;
  transactionTaxAmount: number;
  transactionTotalAmount: number;
  transactionPaidAmount: number;
  transactionBalanceAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesDetailsReportFilters {
  dateFrom?: string;
  dateTo?: string;
  storeId?: string;
  customerId?: string;
  salesAgentId?: string;
  productId?: string;
  productType?: string;
  productCategoryId?: string;
  brandNameId?: string;
  manufacturerId?: string;
  modelId?: string;
  colorId?: string;
  priceCategoryId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SalesDetailsReportStats {
  totalItems: number;
  totalQuantity: number;
  totalLineTotal: number;
  totalDiscount: number;
  totalTax: number;
  invoiceItems: number;
  orderItems: number;
  lastUpdate: string;
}

export interface SalesDetailsReportResponse {
  success: boolean;
  data: SalesDetailsReportItem[];
  total: number;
}

export interface SalesDetailsReportStatsResponse {
  success: boolean;
  stats: SalesDetailsReportStats;
}

export const salesDetailsReportService = {
  // Get Sales Details Report Data
  getSalesDetailsReport: async (filters?: SalesDetailsReportFilters): Promise<SalesDetailsReportResponse> => {
    const params: any = {};
    
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.storeId) params.storeId = filters.storeId;
    if (filters?.customerId) params.customerId = filters.customerId;
    if (filters?.salesAgentId) params.salesAgentId = filters.salesAgentId;
    if (filters?.productId) params.productId = filters.productId;
    if (filters?.productType) params.productType = filters.productType;
    if (filters?.productCategoryId) params.productCategoryId = filters.productCategoryId;
    if (filters?.brandNameId) params.brandNameId = filters.brandNameId;
    if (filters?.manufacturerId) params.manufacturerId = filters.manufacturerId;
    if (filters?.modelId) params.modelId = filters.modelId;
    if (filters?.colorId) params.colorId = filters.colorId;
    if (filters?.priceCategoryId) params.priceCategoryId = filters.priceCategoryId;
    if (filters?.search) params.search = filters.search;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    const response = await api.get('/sales-details-report', { params });
    return response.data;
  },

  // Get Sales Details Report Statistics
  getSalesDetailsReportStats: async (filters?: SalesDetailsReportFilters): Promise<SalesDetailsReportStatsResponse> => {
    const params: any = {};
    
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.storeId) params.storeId = filters.storeId;
    if (filters?.customerId) params.customerId = filters.customerId;
    if (filters?.salesAgentId) params.salesAgentId = filters.salesAgentId;
    if (filters?.productCategoryId) params.productCategoryId = filters.productCategoryId;

    const response = await api.get('/sales-details-report/stats', { params });
    return response.data;
  },
};

export default salesDetailsReportService;


