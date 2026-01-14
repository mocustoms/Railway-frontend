import { api } from './api';
import {
  PurchaseInvoicePayment,
  PurchaseInvoicePaymentStats,
  PurchaseInvoicePaymentFilters,
  PurchaseInvoicePaymentSortConfig,
  PaginatedPurchaseInvoicePaymentResponse
} from '../types';

export interface PurchaseInvoicePaymentResponse {
  payments: PurchaseInvoicePayment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const transformPayment = (data: any): PurchaseInvoicePayment => {
  return {
    id: data.id,
    paymentReferenceNumber: data.paymentReferenceNumber || data.payment_reference_number,
    purchaseInvoiceId: data.purchaseInvoiceId || data.purchase_invoice_id,
    purchaseInvoiceRefNumber: data.purchaseInvoiceRefNumber || data.purchase_invoice_ref_number,
    vendorId: data.vendorId || data.vendor_id,
    vendorName: data.vendorName || data.vendor?.full_name,
    vendorCode: data.vendorCode || data.vendor?.vendor_id,
    paymentAmount: data.paymentAmount !== undefined ? (typeof data.paymentAmount === 'number' ? data.paymentAmount : parseFloat(data.paymentAmount)) : (data.payment_amount ? parseFloat(data.payment_amount) : 0),
    currencyId: data.currencyId || data.currency_id,
    currencyName: data.currencyName || data.currency?.name,
    currencySymbol: data.currencySymbol || data.currency?.symbol,
    exchangeRate: data.exchangeRate !== undefined ? (typeof data.exchangeRate === 'number' ? data.exchangeRate : parseFloat(data.exchangeRate)) : (data.exchange_rate ? parseFloat(data.exchange_rate) : 1),
    exchangeRateId: data.exchangeRateId || data.exchange_rate_id,
    systemDefaultCurrencyId: data.systemDefaultCurrencyId || data.system_default_currency_id,
    systemDefaultCurrencyName: data.systemDefaultCurrencyName || data.systemDefaultCurrency?.name,
    systemDefaultCurrencySymbol: data.systemDefaultCurrencySymbol || data.systemDefaultCurrency?.symbol,
    equivalentAmount: data.equivalentAmount !== undefined ? (typeof data.equivalentAmount === 'number' ? data.equivalentAmount : parseFloat(data.equivalentAmount)) : (data.equivalent_amount ? parseFloat(data.equivalent_amount) : 0),
    paymentTypeId: data.paymentTypeId || data.payment_type_id,
    paymentTypeName: data.paymentTypeName || data.paymentType?.name,
    useVendorDeposit: data.useVendorDeposit !== undefined ? data.useVendorDeposit : (data.use_vendor_deposit || false),
    depositAmount: data.depositAmount !== undefined ? (typeof data.depositAmount === 'number' ? data.depositAmount : parseFloat(data.depositAmount)) : (data.deposit_amount ? parseFloat(data.deposit_amount) : 0),
    chequeNumber: data.chequeNumber || data.cheque_number,
    bankDetailId: data.bankDetailId || data.bank_detail_id,
    bankDetailName: data.bankDetailName || data.bankDetail?.bank_name,
    branch: data.branch,
    payableAccountId: data.payableAccountId || data.payable_account_id,
    payableAccountName: data.payableAccountName || data.payableAccount?.name,
    payableAccountCode: data.payableAccountCode || data.payableAccount?.code,
    assetAccountId: data.assetAccountId || data.asset_account_id,
    assetAccountName: data.assetAccountName || data.assetAccount?.name,
    assetAccountCode: data.assetAccountCode || data.assetAccount?.code,
    liabilityAccountId: data.liabilityAccountId || data.liability_account_id,
    liabilityAccountName: data.liabilityAccountName || data.liabilityAccount?.name,
    liabilityAccountCode: data.liabilityAccountCode || data.liabilityAccount?.code,
    transactionDate: data.transactionDate || data.transaction_date,
    financialYearId: data.financialYearId || data.financial_year_id,
    financialYearName: data.financialYearName || data.financialYear?.name,
    description: data.description,
    status: data.status || 'active',
    reversedAt: data.reversedAt || data.reversed_at,
    reversedBy: data.reversedBy || data.reversed_by,
    reversedByName: data.reversedByName || data.reversed_by_name,
    reversalReason: data.reversalReason || data.reversal_reason,
    createdBy: data.createdBy || data.created_by,
    createdByName: data.createdByName || data.created_by_name,
    updatedBy: data.updatedBy || data.updated_by,
    updatedByName: data.updatedByName || data.updated_by_name,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
    items: data.items?.map((item: any) => ({
      id: item.id,
      paymentId: item.paymentId || item.payment_id,
      purchaseInvoiceId: item.purchaseInvoiceId || item.purchase_invoice_id,
      purchaseInvoiceItemId: item.purchaseInvoiceItemId || item.purchase_invoice_item_id,
      paymentAmount: item.paymentAmount !== undefined ? (typeof item.paymentAmount === 'number' ? item.paymentAmount : parseFloat(item.paymentAmount)) : (item.payment_amount ? parseFloat(item.payment_amount) : 0),
      currencyId: item.currencyId || item.currency_id,
      exchangeRate: item.exchangeRate !== undefined ? (typeof item.exchangeRate === 'number' ? item.exchangeRate : parseFloat(item.exchangeRate)) : (item.exchange_rate ? parseFloat(item.exchange_rate) : 1),
      equivalentAmount: item.equivalentAmount !== undefined ? (typeof item.equivalentAmount === 'number' ? item.equivalentAmount : parseFloat(item.equivalentAmount)) : (item.equivalent_amount ? parseFloat(item.equivalent_amount) : 0),
      itemTotal: item.itemTotal !== undefined ? (typeof item.itemTotal === 'number' ? item.itemTotal : parseFloat(item.itemTotal)) : (item.item_total ? parseFloat(item.item_total) : 0),
      itemRemaining: item.itemRemaining !== undefined ? (typeof item.itemRemaining === 'number' ? item.itemRemaining : parseFloat(item.itemRemaining)) : (item.item_remaining ? parseFloat(item.item_remaining) : 0),
      createdAt: item.createdAt || item.created_at,
      updatedAt: item.updatedAt || item.updated_at,
      product: item.product || null
    })) || []
  };
};

export const purchaseInvoicePaymentService = {
  getPayments: async (
    page: number = 1,
    limit: number = 10,
    filters: PurchaseInvoicePaymentFilters = {},
    sortConfig: PurchaseInvoicePaymentSortConfig = { field: 'transactionDate', direction: 'desc' }
  ): Promise<PurchaseInvoicePaymentResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortConfig.field,
      sortOrder: sortConfig.direction.toUpperCase()
    });

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/purchase-invoice-payments?${params.toString()}`);
    return {
      payments: response.data?.payments?.length ? response.data?.payments?.map(transformPayment) : [],
      pagination: response.data?.pagination
    };
  },

  getPayment: async (id: string): Promise<PurchaseInvoicePayment> => {
    const response = await api.get(`/purchase-invoice-payments/${id}`);
    return transformPayment(response.data);
  },

  getPaymentStats: async (): Promise<PurchaseInvoicePaymentStats> => {
    const response = await api.get('/purchase-invoice-payments/stats');
    return response.data;
  },

  voidPayment: async (id: string, reversalReason?: string): Promise<PurchaseInvoicePayment> => {
    const response = await api.put(`/purchase-invoice-payments/${id}/void`, { reversalReason });
    return transformPayment(response.data.payment);
  }
};
