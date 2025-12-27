import { api } from './api';
import {
  ProformaInvoice,
  ProformaInvoiceStats,
  ProformaInvoiceFilters,
  ProformaInvoiceSortConfig,
  ProformaInvoiceFormData
} from '../types';

export interface ProformaInvoiceResponse {
  proformaInvoices: ProformaInvoice[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const transformProformaInvoice = (data: any): ProformaInvoice => {
  // Backend already transforms to camelCase, so we use those fields directly
  return {
    id: data.id,
    proformaRefNumber: data.proformaRefNumber || data.proforma_ref_number,
    proformaDate: data.proformaDate || data.proforma_date,
    storeId: data.storeId || data.store_id,
    storeName: data.storeName || data.store?.name,
    customerId: data.customerId || data.customer_id,
    customerName: data.customerName || data.customer?.full_name,
    customerCode: data.customerCode || data.customer?.customer_id,
    customerAddress: data.customerAddress || data.customer?.address,
    customerFax: data.customerFax || data.customer?.fax,
    customerPhone: data.customerPhone || data.customer?.phone_number,
    customerEmail: data.customerEmail || data.customer?.email,
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
    equivalentAmount: data.equivalentAmount !== undefined ? (typeof data.equivalentAmount === 'number' ? data.equivalentAmount : parseFloat(data.equivalentAmount)) : (data.equivalent_amount ? parseFloat(data.equivalent_amount) : null),
    status: data.status,
    isConverted: data.isConverted !== undefined ? data.isConverted : (data.is_converted !== undefined ? data.is_converted : false),
    validUntil: data.validUntil || data.valid_until,
    notes: data.notes,
    termsConditions: data.termsConditions || data.terms_conditions,
    createdBy: data.createdBy || data.created_by,
    createdByName: data.createdByName,
    updatedBy: data.updatedBy || data.updated_by,
    updatedByName: data.updatedByName,
    sentBy: data.sentBy || data.sent_by,
    sentByName: data.sentByName,
    sentAt: data.sentAt || data.sent_at,
    acceptedBy: data.acceptedBy || data.accepted_by,
    acceptedByName: data.acceptedByName,
    acceptedAt: data.acceptedAt || data.accepted_at,
    rejectedBy: data.rejectedBy || data.rejected_by,
    rejectedByName: data.rejectedByName,
    rejectedAt: data.rejectedAt || data.rejected_at,
    rejectionReason: data.rejectionReason || data.rejection_reason,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
    items: data.items?.map((item: any) => ({
      id: item.id,
      proformaInvoiceId: item.proformaInvoiceId || item.proforma_invoice_id,
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
      lineTotal: item.lineTotal !== undefined ? item.lineTotal : parseFloat(item.line_total),
      notes: item.notes,
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
    currency: data.currency,
    systemDefaultCurrency: data.systemDefaultCurrency,
    exchangeRateRecord: data.exchangeRate || data.exchangeRateRecord,
    createdByUser: data.createdByUser,
    updatedByUser: data.updatedByUser,
    sentByUser: data.sentByUser,
    acceptedByUser: data.acceptedByUser,
    rejectedByUser: data.rejectedByUser
  };
};

export const proformaInvoiceService = {
  getProformaInvoices: async (
    page: number = 1,
    limit: number = 10,
    filters: ProformaInvoiceFilters = {},
    sortConfig: ProformaInvoiceSortConfig = { field: 'createdAt', direction: 'desc' }
  ): Promise<ProformaInvoiceResponse> => {
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

    const response = await api.get(`/proforma-invoices?${params.toString()}`);
    return {
      proformaInvoices: response.data.proformaInvoices.map(transformProformaInvoice),
      pagination: response.data.pagination
    };
  },

  getProformaInvoice: async (id: string): Promise<ProformaInvoice> => {
    const response = await api.get(`/proforma-invoices/${id}`);
    return transformProformaInvoice(response.data);
  },

  getAllProformaInvoices: async (): Promise<ProformaInvoice[]> => {
    const response = await api.get('/proforma-invoices/all');
    return response.data.map(transformProformaInvoice);
  },

  createProformaInvoice: async (data: ProformaInvoiceFormData): Promise<ProformaInvoice> => {
    const transformedData = {
      proforma_date: data.proformaDate,
      store_id: data.storeId,
      customer_id: data.customerId,
      currency_id: data.currencyId,
      exchange_rate: data.exchangeRateValue || 1,
      system_default_currency_id: data.systemDefaultCurrencyId || null,
      exchange_rate_id: data.exchangeRateId || null,
      price_category_id: data.priceCategoryId || null,
      valid_until: data.validUntil,
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
        line_total: item.lineTotal,
        notes: item.notes || ''
      }))
    };

    const response = await api.post('/proforma-invoices', transformedData);
    return transformProformaInvoice(response.data);
  },

  updateProformaInvoice: async (id: string, data: ProformaInvoiceFormData): Promise<ProformaInvoice> => {
    const transformedData = {
      proforma_date: data.proformaDate,
      store_id: data.storeId,
      customer_id: data.customerId,
      currency_id: data.currencyId,
      exchange_rate: data.exchangeRateValue || 1,
      system_default_currency_id: data.systemDefaultCurrencyId || null,
      exchange_rate_id: data.exchangeRateId || null,
      price_category_id: data.priceCategoryId || null,
      valid_until: data.validUntil,
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
        line_total: item.lineTotal,
        notes: item.notes || ''
      }))
    };

    const response = await api.put(`/proforma-invoices/${id}`, transformedData);
    return transformProformaInvoice(response.data);
  },

  deleteProformaInvoice: async (id: string): Promise<void> => {
    await api.delete(`/proforma-invoices/${id}`);
  },

  sendProformaInvoice: async (id: string): Promise<void> => {
    await api.put(`/proforma-invoices/${id}/send`);
  },

  acceptProformaInvoice: async (id: string): Promise<void> => {
    await api.put(`/proforma-invoices/${id}/accept`);
  },

  rejectProformaInvoice: async (id: string, rejectionReason: string): Promise<void> => {
    await api.put(`/proforma-invoices/${id}/reject`, { rejectionReason });
  },

  reopenProformaInvoice: async (id: string, validUntil: string): Promise<ProformaInvoice> => {
    const response = await api.put(`/proforma-invoices/${id}/reopen`, { validUntil });
    return transformProformaInvoice(response.data.invoice);
  },

  getProformaInvoiceStats: async (): Promise<ProformaInvoiceStats> => {
    const response = await api.get('/proforma-invoices/stats/overview');
    return response.data;
  },

  exportToExcel: async (filters?: ProformaInvoiceFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/proforma-invoices/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  exportToPDF: async (filters?: ProformaInvoiceFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/proforma-invoices/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  convertToSalesInvoice: async (id: string, invoiceDate?: string, dueDate?: string): Promise<{ salesInvoice: { id: string; invoiceRefNumber: string } }> => {
    const response = await api.put(`/proforma-invoices/${id}/convert-to-sales-invoice`, {
      invoice_date: invoiceDate,
      due_date: dueDate
    });
    return response.data;
  }
};
