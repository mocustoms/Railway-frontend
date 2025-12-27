import { api } from './api';
import {
  Receipt,
  ReceiptStats,
  ReceiptFilters,
  ReceiptSortConfig,
  PaginatedReceiptResponse
} from '../types';

export interface ReceiptResponse {
  receipts: Receipt[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const transformReceipt = (data: any): Receipt => {
  return {
    id: data.id,
    receiptReferenceNumber: data.receiptReferenceNumber || data.receipt_reference_number,
    salesInvoiceId: data.salesInvoiceId || data.sales_invoice_id,
    salesInvoiceRefNumber: data.salesInvoiceRefNumber || data.sales_invoice_ref_number,
    customerId: data.customerId || data.customer_id,
    customerName: data.customerName || data.customer?.full_name,
    customerCode: data.customerCode || data.customer?.customer_id,
    salesAgentId: data.salesAgentId || data.sales_agent_id,
    salesAgentName: data.salesAgentName || data.salesAgent?.full_name,
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
    useCustomerDeposit: data.useCustomerDeposit !== undefined ? data.useCustomerDeposit : (data.use_customer_deposit || false),
    depositAmount: data.depositAmount !== undefined ? (typeof data.depositAmount === 'number' ? data.depositAmount : parseFloat(data.depositAmount)) : (data.deposit_amount ? parseFloat(data.deposit_amount) : 0),
    useLoyaltyPoints: data.useLoyaltyPoints !== undefined ? data.useLoyaltyPoints : (data.use_loyalty_points || false),
    loyaltyPointsAmount: data.loyaltyPointsAmount !== undefined ? (typeof data.loyaltyPointsAmount === 'number' ? data.loyaltyPointsAmount : parseFloat(data.loyaltyPointsAmount)) : (data.loyalty_points_amount ? parseFloat(data.loyalty_points_amount) : 0),
    loyaltyPointsValue: data.loyaltyPointsValue !== undefined ? (typeof data.loyaltyPointsValue === 'number' ? data.loyaltyPointsValue : parseFloat(data.loyaltyPointsValue)) : (data.loyalty_points_value ? parseFloat(data.loyalty_points_value) : 0),
    chequeNumber: data.chequeNumber || data.cheque_number,
    bankDetailId: data.bankDetailId || data.bank_detail_id,
    bankDetailName: data.bankDetailName || data.bankDetail?.bank_name,
    branch: data.branch,
    receivableAccountId: data.receivableAccountId || data.receivable_account_id,
    receivableAccountName: data.receivableAccountName || data.receivableAccount?.name,
    receivableAccountCode: data.receivableAccountCode || data.receivableAccount?.code,
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
      receiptId: item.receiptId || item.receipt_id,
      salesInvoiceId: item.salesInvoiceId || item.sales_invoice_id,
      salesInvoiceItemId: item.salesInvoiceItemId || item.sales_invoice_item_id,
      salesAgentId: item.salesAgentId || item.sales_agent_id,
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

export const receiptService = {
  getReceipts: async (
    page: number = 1,
    limit: number = 10,
    filters: ReceiptFilters = {},
    sortConfig: ReceiptSortConfig = { field: 'transactionDate', direction: 'desc' }
  ): Promise<ReceiptResponse> => {
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

    const response = await api.get(`/receipts?${params.toString()}`);
    return {
      receipts: response.data.receipts.map(transformReceipt),
      pagination: response.data.pagination
    };
  },

  getReceipt: async (id: string): Promise<Receipt> => {
    const response = await api.get(`/receipts/${id}`);
    return transformReceipt(response.data);
  },

  getReceiptStats: async (): Promise<ReceiptStats> => {
    const response = await api.get('/receipts/stats');
    return response.data;
  },

  voidReceipt: async (id: string, reversalReason?: string): Promise<Receipt> => {
    const response = await api.put(`/receipts/${id}/void`, { reversalReason });
    return transformReceipt(response.data.receipt);
  }
};

