import { api } from './api';
import {
  SalesOrder,
  SalesOrderStats,
  SalesOrderFilters,
  SalesOrderSortConfig,
  SalesOrderFormData
} from '../types';

export interface SalesOrderResponse {
  salesOrders: SalesOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const transformSalesOrder = (data: any): SalesOrder => {
  // Backend already transforms to camelCase, so we use those fields directly
  return {
    id: data.id,
    salesOrderRefNumber: data.salesOrderRefNumber || data.sales_order_ref_number,
    salesOrderDate: data.salesOrderDate || data.sales_order_date,
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
    amountAfterDiscount: data.amountAfterDiscount !== undefined ? (typeof data.amountAfterDiscount === 'number' ? data.amountAfterDiscount : parseFloat(data.amountAfterDiscount)) : (data.amount_after_discount ? parseFloat(data.amount_after_discount) : null),
    totalWhtAmount: data.totalWhtAmount !== undefined ? (typeof data.totalWhtAmount === 'number' ? data.totalWhtAmount : parseFloat(data.totalWhtAmount)) : (data.total_wht_amount ? parseFloat(data.total_wht_amount) : null),
    amountAfterWht: data.amountAfterWht !== undefined ? (typeof data.amountAfterWht === 'number' ? data.amountAfterWht : parseFloat(data.amountAfterWht)) : (data.amount_after_wht ? parseFloat(data.amount_after_wht) : null),
    equivalentAmount: data.equivalentAmount !== undefined ? (typeof data.equivalentAmount === 'number' ? data.equivalentAmount : parseFloat(data.equivalentAmount)) : (data.equivalent_amount ? parseFloat(data.equivalent_amount) : null),
    status: data.status,
    isConverted: data.isConverted !== undefined ? data.isConverted : (data.is_converted !== undefined ? data.is_converted : false),
    validUntil: data.validUntil || data.valid_until,
    deliveryDate: data.deliveryDate || data.delivery_date,
    shippingAddress: data.shippingAddress || data.shipping_address,
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
    fulfilledBy: data.fulfilledBy || data.fulfilled_by,
    fulfilledByName: data.fulfilledByName,
    fulfilledAt: data.fulfilledAt || data.fulfilled_at,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
    items: data.items?.map((item: any) => ({
      id: item.id,
      salesOrderId: item.salesOrderId || item.sales_order_id,
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
    currency: data.currency,
    systemDefaultCurrency: data.systemDefaultCurrency,
    exchangeRateRecord: data.exchangeRate || data.exchangeRateRecord,
    createdByUser: data.createdByUser,
    updatedByUser: data.updatedByUser,
    sentByUser: data.sentByUser,
    acceptedByUser: data.acceptedByUser,
    rejectedByUser: data.rejectedByUser,
    fulfilledByUser: data.fulfilledByUser
  };
};

export const salesOrderService = {
  getSalesOrders: async (
    page: number = 1,
    limit: number = 10,
    filters: SalesOrderFilters = {},
    sortConfig: SalesOrderSortConfig = { field: 'createdAt', direction: 'desc' }
  ): Promise<SalesOrderResponse> => {
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

    const response = await api.get(`/sales-orders?${params.toString()}`);
    return {
      salesOrders: response.data.salesOrders.map(transformSalesOrder),
      pagination: response.data.pagination
    };
  },

  getSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await api.get(`/sales-orders/${id}`);
    return transformSalesOrder(response.data);
  },

  getAllSalesOrders: async (): Promise<SalesOrder[]> => {
    const response = await api.get('/sales-orders/all');
    return response.data.map(transformSalesOrder);
  },

  createSalesOrder: async (data: SalesOrderFormData): Promise<SalesOrder> => {
    const transformedData = {
      sales_order_date: data.salesOrderDate,
      store_id: data.storeId,
      customer_id: data.customerId,
      currency_id: data.currencyId,
      exchange_rate: data.exchangeRateValue || 1,
      system_default_currency_id: data.systemDefaultCurrencyId || null,
      exchange_rate_id: data.exchangeRateId || null,
      price_category_id: data.priceCategoryId || null,
      valid_until: data.validUntil,
      delivery_date: data.deliveryDate,
      shipping_address: data.shippingAddress,
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

    const response = await api.post('/sales-orders', transformedData);
    return transformSalesOrder(response.data);
  },

  updateSalesOrder: async (id: string, data: SalesOrderFormData): Promise<SalesOrder> => {
    const transformedData = {
      sales_order_date: data.salesOrderDate,
      store_id: data.storeId,
      customer_id: data.customerId,
      currency_id: data.currencyId,
      exchange_rate: data.exchangeRateValue || 1,
      system_default_currency_id: data.systemDefaultCurrencyId || null,
      exchange_rate_id: data.exchangeRateId || null,
      price_category_id: data.priceCategoryId || null,
      valid_until: data.validUntil,
      delivery_date: data.deliveryDate,
      shipping_address: data.shippingAddress,
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

    const response = await api.put(`/sales-orders/${id}`, transformedData);
    return transformSalesOrder(response.data);
  },

  deleteSalesOrder: async (id: string): Promise<void> => {
    await api.delete(`/sales-orders/${id}`);
  },

  sendSalesOrder: async (id: string): Promise<void> => {
    await api.put(`/sales-orders/${id}/send`);
  },

  acceptSalesOrder: async (id: string): Promise<void> => {
    await api.put(`/sales-orders/${id}/accept`);
  },

  rejectSalesOrder: async (id: string, rejectionReason: string): Promise<void> => {
    await api.put(`/sales-orders/${id}/reject`, { rejectionReason });
  },

  fulfillSalesOrder: async (id: string, deliveryDate?: string): Promise<void> => {
    await api.put(`/sales-orders/${id}/fulfill`, { deliveryDate });
  },

  reopenSalesOrder: async (id: string, validUntil: string): Promise<SalesOrder> => {
    const response = await api.put(`/sales-orders/${id}/reopen`, { validUntil });
    return transformSalesOrder(response.data.order);
  },

  getSalesOrderStats: async (): Promise<SalesOrderStats> => {
    const response = await api.get('/sales-orders/stats/overview');
    return response.data;
  },

  exportToExcel: async (filters?: SalesOrderFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/sales-orders/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  exportToPDF: async (filters?: SalesOrderFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/sales-orders/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  convertToSalesInvoice: async (id: string, invoiceDate?: string, dueDate?: string): Promise<{ salesInvoice: { id: string; invoiceRefNumber: string } }> => {
    const response = await api.put(`/sales-orders/${id}/convert-to-sales-invoice`, {
      invoice_date: invoiceDate,
      due_date: dueDate
    });
    return response.data;
  }
};

