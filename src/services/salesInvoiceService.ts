import { api } from './api';
import {
  SalesInvoice,
  SalesInvoiceStats,
  SalesInvoiceFilters,
  SalesInvoiceSortConfig,
  SalesInvoiceFormData
} from '../types';

export interface SalesInvoiceResponse {
  salesInvoices: SalesInvoice[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const transformSalesInvoice = (data: any): SalesInvoice => {
  // Backend already transforms to camelCase, so we use those fields directly
  return {
    id: data.id,
    invoiceRefNumber: data.invoiceRefNumber || data.invoice_ref_number,
    invoiceDate: data.invoiceDate || data.invoice_date,
    dueDate: data.dueDate || data.due_date,
    storeId: data.storeId || data.store_id,
    storeName: data.storeName || data.store?.name,
    customerId: data.customerId || data.customer_id,
    customerName: data.customerName || data.customer?.full_name,
    customerCode: data.customerCode || data.customer?.customer_id,
    customerAddress: data.customerAddress || data.customer?.address,
    customerFax: data.customerFax || data.customer?.fax,
    customerPhone: data.customerPhone || data.customer?.phone_number,
    customerEmail: data.customerEmail || data.customer?.email,
    salesOrderId: data.salesOrderId || data.sales_order_id,
    salesOrderRefNumber: data.salesOrderRefNumber || data.salesOrder?.sales_order_ref_number,
    proformaInvoiceId: data.proformaInvoiceId || data.proforma_invoice_id,
    proformaRefNumber: data.proformaRefNumber || data.proformaInvoice?.proforma_ref_number,
    salesAgentId: data.salesAgentId || data.sales_agent_id,
    salesAgentName: data.salesAgentName || data.salesAgent?.full_name,
    salesAgentNumber: data.salesAgentNumber || data.salesAgent?.agent_number,
    discountAllowedAccountId: data.discountAllowedAccountId || data.discount_allowed_account_id,
    accountReceivableId: data.accountReceivableId || data.account_receivable_id,
    currencyId: data.currencyId || data.currency_id,
    currencyName: data.currencyName || data.currency?.name,
    currencySymbol: data.currencySymbol || data.currency?.symbol,
    exchangeRateValue: data.exchangeRateValue !== undefined ? data.exchangeRateValue : (data.exchange_rate ? parseFloat(data.exchange_rate) : null),
    systemDefaultCurrencyId: data.systemDefaultCurrencyId || data.system_default_currency_id,
    exchangeRateId: data.exchangeRateId || data.exchange_rate_id,
    priceCategoryId: data.priceCategoryId || data.price_category_id || null,
    priceCategory: data.priceCategory || null,
    subtotal: data.subtotal !== undefined ? (typeof data.subtotal === 'number' ? data.subtotal : parseFloat(data.subtotal)) : 0,
    taxAmount: data.taxAmount !== undefined ? (typeof data.taxAmount === 'number' ? data.taxAmount : parseFloat(data.taxAmount)) : (data.tax_amount ? parseFloat(data.tax_amount) : 0),
    discountAmount: data.discountAmount !== undefined ? (typeof data.discountAmount === 'number' ? data.discountAmount : parseFloat(data.discountAmount)) : (data.discount_amount ? parseFloat(data.discount_amount) : 0),
    totalAmount: data.totalAmount !== undefined ? (typeof data.totalAmount === 'number' ? data.totalAmount : parseFloat(data.totalAmount)) : (data.total_amount ? parseFloat(data.total_amount) : 0),
    amountAfterDiscount: data.amountAfterDiscount !== undefined ? (typeof data.amountAfterDiscount === 'number' ? data.amountAfterDiscount : parseFloat(data.amountAfterDiscount)) : (data.amount_after_discount ? parseFloat(data.amount_after_discount) : null),
    totalWhtAmount: data.totalWhtAmount !== undefined ? (typeof data.totalWhtAmount === 'number' ? data.totalWhtAmount : parseFloat(data.totalWhtAmount)) : (data.total_wht_amount ? parseFloat(data.total_wht_amount) : null),
    amountAfterWht: data.amountAfterWht !== undefined ? (typeof data.amountAfterWht === 'number' ? data.amountAfterWht : parseFloat(data.amountAfterWht)) : (data.amount_after_wht ? parseFloat(data.amount_after_wht) : null),
    equivalentAmount: data.equivalentAmount !== undefined ? (typeof data.equivalentAmount === 'number' ? data.equivalentAmount : parseFloat(data.equivalentAmount)) : (data.equivalent_amount ? parseFloat(data.equivalent_amount) : null),
    paidAmount: data.paidAmount !== undefined ? (typeof data.paidAmount === 'number' ? data.paidAmount : parseFloat(data.paidAmount)) : (data.paid_amount ? parseFloat(data.paid_amount) : null),
    balanceAmount: data.balanceAmount !== undefined ? (typeof data.balanceAmount === 'number' ? data.balanceAmount : parseFloat(data.balanceAmount)) : (data.balance_amount ? parseFloat(data.balance_amount) : null),
    paymentStatus: data.paymentStatus || data.payment_status || 'unpaid',
    status: data.status,
    scheduledType: data.scheduledType || data.scheduled_type || 'not_scheduled',
    recurringPeriod: data.recurringPeriod || data.recurring_period,
    scheduledDate: data.scheduledDate || data.scheduled_date,
    recurringDayOfWeek: data.recurringDayOfWeek || data.recurring_day_of_week,
    recurringDate: data.recurringDate || data.recurring_date,
    recurringMonth: data.recurringMonth || data.recurring_month,
    startTime: data.startTime || data.start_time,
    endTime: data.endTime || data.end_time,
    parentInvoiceId: data.parentInvoiceId || data.parent_invoice_id,
    notes: data.notes,
    termsConditions: data.termsConditions || data.terms_conditions,
    createdBy: data.createdBy || data.created_by,
    createdByName: data.createdByName,
    updatedBy: data.updatedBy || data.updated_by,
    updatedByName: data.updatedByName,
    sentBy: data.sentBy || data.sent_by,
    sentByName: data.sentByName,
    sentAt: data.sentAt || data.sent_at,
    paidAt: data.paidAt || data.paid_at,
    cancelledBy: data.cancelledBy || data.cancelled_by,
    cancelledByName: data.cancelledByName,
    cancelledAt: data.cancelledAt || data.cancelled_at,
    cancellationReason: data.cancellationReason || data.cancellation_reason,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
    items: data.items?.map((item: any) => ({
      id: item.id,
      salesInvoiceId: item.salesInvoiceId || item.sales_invoice_id,
      productId: item.productId || item.product_id,
      productName: item.productName || item.product?.name,
      productCode: item.productCode || item.product?.code,
      quantity: item.quantity !== undefined ? (typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity)) : 0,
      unitPrice: item.unitPrice !== undefined ? (typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice)) : (item.unit_price ? parseFloat(item.unit_price) : 0),
      discountPercentage: item.discountPercentage !== undefined ? item.discountPercentage : (item.discount_percentage ? parseFloat(item.discount_percentage) : null),
      discountAmount: item.discountAmount !== undefined ? item.discountAmount : (item.discount_amount ? parseFloat(item.discount_amount) : null),
      taxPercentage: item.taxPercentage !== undefined ? item.taxPercentage : (item.tax_percentage ? parseFloat(item.tax_percentage) : null),
      taxAmount: item.taxAmount !== undefined ? item.taxAmount : (item.tax_amount ? parseFloat(item.tax_amount) : null),
      salesTaxId: item.salesTaxId || item.sales_tax_id || null,
      salesTaxCode: item.salesTaxCode || null,
      whtTaxId: item.whtTaxId || item.wht_tax_id || null,
      whtTaxCode: item.whtTaxCode || null,
      whtAmount: item.whtAmount !== undefined ? item.whtAmount : (item.wht_amount ? parseFloat(item.wht_amount) : null),
      priceTaxInclusive: item.priceTaxInclusive !== undefined ? item.priceTaxInclusive : (item.price_tax_inclusive || false),
      currencyId: item.currencyId || item.currency_id || null,
      currency: item.currency || null,
      exchangeRate: item.exchangeRate !== undefined ? item.exchangeRate : (item.exchange_rate ? parseFloat(item.exchange_rate) : null),
      equivalentAmount: item.equivalentAmount !== undefined ? item.equivalentAmount : (item.equivalent_amount ? parseFloat(item.equivalent_amount) : null),
      amountAfterDiscount: item.amountAfterDiscount !== undefined ? item.amountAfterDiscount : (item.amount_after_discount ? parseFloat(item.amount_after_discount) : null),
      amountAfterWht: item.amountAfterWht !== undefined ? item.amountAfterWht : (item.amount_after_wht ? parseFloat(item.amount_after_wht) : null),
      lineTotal: item.lineTotal !== undefined ? item.lineTotal : parseFloat(item.line_total),
      notes: item.notes,
      serialNumbers: item.serialNumbers || item.serial_numbers || [],
      batchNumber: item.batchNumber || item.batch_number || null,
      expiryDate: item.expiryDate || item.expiry_date || null,
      createdBy: item.createdBy || item.created_by,
      updatedBy: item.updatedBy || item.updated_by,
      createdAt: item.createdAt || item.created_at,
      updatedAt: item.updatedAt || item.updated_at,
      product: item.product,
      createdByUser: item.createdByUser,
      updatedByUser: item.updatedByUser
    })) || [],
    store: data.store,
    customer: data.customer,
    salesOrder: data.salesOrder,
    proformaInvoice: data.proformaInvoice,
    currency: data.currency,
    systemDefaultCurrency: data.systemDefaultCurrency,
    exchangeRate: data.exchangeRate || data.exchangeRateRecord,
    createdByUser: data.createdByUser,
    updatedByUser: data.updatedByUser,
    sentByUser: data.sentByUser,
    cancelledByUser: data.cancelledByUser,
    itemPaidAmounts: data.itemPaidAmounts || {} // Map of invoice item ID to total paid amount
  };
};

export const salesInvoiceService = {
  getSalesInvoices: async (
    page: number = 1,
    limit: number = 10,
    filters: SalesInvoiceFilters = {},
    sortConfig: SalesInvoiceSortConfig = { field: 'createdAt', direction: 'desc' }
  ): Promise<SalesInvoiceResponse> => {
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

    const response = await api.get(`/sales-invoices?${params.toString()}`);
    return {
      salesInvoices: response.data.salesInvoices.map(transformSalesInvoice),
      pagination: response.data.pagination
    };
  },

  getSalesInvoice: async (id: string): Promise<SalesInvoice> => {
    const response = await api.get(`/sales-invoices/${id}`);
    return transformSalesInvoice(response.data);
  },

  getAllSalesInvoices: async (): Promise<SalesInvoice[]> => {
    const response = await api.get('/sales-invoices/all');
    return response.data.map(transformSalesInvoice);
  },

  createSalesInvoice: async (data: SalesInvoiceFormData): Promise<SalesInvoice> => {
    const transformedData = {
      invoice_date: data.invoiceDate,
      due_date: data.dueDate,
      store_id: data.storeId,
      customer_id: data.customerId,
      sales_order_id: data.salesOrderId,
      proforma_invoice_id: data.proformaInvoiceId,
      sales_agent_id: data.salesAgentId,
      discount_allowed_account_id: data.discountAllowedAccountId,
      account_receivable_id: data.accountReceivableId,
      currency_id: data.currencyId,
      exchange_rate: data.exchangeRateValue || 1,
      system_default_currency_id: data.systemDefaultCurrencyId || null,
      exchange_rate_id: data.exchangeRateId || null,
      price_category_id: data.priceCategoryId || null,
      scheduled_type: data.scheduledType || 'not_scheduled',
      recurring_period: data.recurringPeriod || null,
      scheduled_date: data.scheduledDate || null,
      recurring_day_of_week: data.recurringDayOfWeek || null,
      recurring_date: data.recurringDate || null,
      recurring_month: data.recurringMonth || null,
      start_time: data.startTime || null,
      end_time: data.endTime || null,
      notes: data.notes || '',
      terms_conditions: data.termsConditions || '',
      items: data.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percentage: item.discountPercentage || 0,
        discount_amount: item.discountAmount || 0,
        tax_percentage: item.taxPercentage || 0,
        tax_amount: item.taxAmount || 0,
        sales_tax_id: item.salesTaxId || null,
        wht_tax_id: item.whtTaxId || null,
        wht_amount: item.whtAmount || 0,
        currency_id: item.currencyId || null,
        exchange_rate: item.exchangeRate || 1,
        equivalent_amount: item.equivalentAmount || 0,
        amount_after_discount: item.amountAfterDiscount || 0,
        amount_after_wht: item.amountAfterWht || 0,
        line_total: item.lineTotal,
        price_tax_inclusive: item.price_tax_inclusive || false,
        notes: item.notes || '',
        serial_numbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
        batch_number: item.batchNumber || null,
        expiry_date: item.expiryDate || null
      }))
    };

    const response = await api.post('/sales-invoices', transformedData);
    return transformSalesInvoice(response.data);
  },

  updateSalesInvoice: async (id: string, data: SalesInvoiceFormData): Promise<SalesInvoice> => {
    const transformedData = {
      invoice_date: data.invoiceDate,
      due_date: data.dueDate,
      store_id: data.storeId,
      customer_id: data.customerId,
      sales_order_id: data.salesOrderId,
      proforma_invoice_id: data.proformaInvoiceId,
      sales_agent_id: data.salesAgentId,
      discount_allowed_account_id: data.discountAllowedAccountId,
      account_receivable_id: data.accountReceivableId,
      currency_id: data.currencyId,
      exchange_rate: data.exchangeRateValue || 1,
      system_default_currency_id: data.systemDefaultCurrencyId || null,
      exchange_rate_id: data.exchangeRateId || null,
      price_category_id: data.priceCategoryId || null,
      scheduled_type: data.scheduledType || 'not_scheduled',
      recurring_period: data.recurringPeriod || null,
      scheduled_date: data.scheduledDate || null,
      recurring_day_of_week: data.recurringDayOfWeek || null,
      recurring_date: data.recurringDate || null,
      recurring_month: data.recurringMonth || null,
      start_time: data.startTime || null,
      end_time: data.endTime || null,
      notes: data.notes || '',
      terms_conditions: data.termsConditions || '',
      items: data.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percentage: item.discountPercentage || 0,
        discount_amount: item.discountAmount || 0,
        tax_percentage: item.taxPercentage || 0,
        tax_amount: item.taxAmount || 0,
        sales_tax_id: item.salesTaxId || null,
        wht_tax_id: item.whtTaxId || null,
        wht_amount: item.whtAmount || 0,
        currency_id: item.currencyId || null,
        exchange_rate: item.exchangeRate || 1,
        equivalent_amount: item.equivalentAmount || 0,
        amount_after_discount: item.amountAfterDiscount || 0,
        amount_after_wht: item.amountAfterWht || 0,
        line_total: item.lineTotal,
        price_tax_inclusive: item.price_tax_inclusive || false,
        notes: item.notes || '',
        serial_numbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
        batch_number: item.batchNumber || null,
        expiry_date: item.expiryDate || null
      }))
    };

    const response = await api.put(`/sales-invoices/${id}`, transformedData);
    return transformSalesInvoice(response.data);
  },

  deleteSalesInvoice: async (id: string): Promise<void> => {
    await api.delete(`/sales-invoices/${id}`);
  },

  sendSalesInvoice: async (id: string): Promise<void> => {
    await api.put(`/sales-invoices/${id}/send`);
  },

  approveInvoice: async (id: string): Promise<void> => {
    await api.put(`/sales-invoices/${id}/approve`);
  },

  rejectSalesInvoice: async (id: string, rejectionReason: string): Promise<void> => {
    await api.put(`/sales-invoices/${id}/reject`, { rejectionReason });
  },

  cancelSalesInvoice: async (id: string, cancellationReason: string): Promise<void> => {
    await api.put(`/sales-invoices/${id}/cancel`, { cancellationReason });
  },

  getSalesInvoiceStats: async (): Promise<SalesInvoiceStats> => {
    const response = await api.get('/sales-invoices/stats');
    return response.data;
  },

  exportToExcel: async (filters?: SalesInvoiceFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/sales-invoices/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  exportToPDF: async (filters?: SalesInvoiceFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/sales-invoices/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  recordPayment: async (id: string, paymentData: {
    paymentAmount: number;
    paymentTypeId?: string;
    useCustomerDeposit?: boolean;
    depositAmount?: number;
    useLoyaltyPoints?: boolean;
    loyaltyPointsAmount?: number;
    itemPayments?: Record<string, number>; // Item-level payment allocation
    chequeNumber?: string;
    bankDetailId?: string;
    branch?: string;
    currencyId: string;
    exchangeRate: number;
    exchangeRateId?: string;
    description?: string;
    transactionDate: string;
    receivableAccountId?: string;
  }): Promise<SalesInvoice> => {
    const response = await api.put(`/sales-invoices/${id}/record-payment`, paymentData);
    return transformSalesInvoice(response.data);
  }
};

