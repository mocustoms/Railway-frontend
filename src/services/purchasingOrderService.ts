import api from './api';
import {
  PurchasingOrder,
  PurchasingOrderStats,
  PurchasingOrderFilters,
  PurchasingOrderSortConfig,
  PurchasingOrderFormData
} from '../types';

export interface PurchasingOrderResponse {
  purchasingOrders: PurchasingOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const transformPurchasingOrder = (data: any): PurchasingOrder => {
  console.log('Transforming purchasing order data:', {data});
  return {
    id: data.id,
    purchasingOrderRefNumber: data.poNumber || data.po_number,
    purchasingOrderDate: data.orderDate || data.order_date,
    storeId: data.storeId || data.store_id,
    storeName: data.storeName || data.store?.name,
    vendorId: data.vendorId || data.vendor_id,
    vendorName: data.vendorName || data.vendor?.full_name,
    vendorCode: data.vendorCode || data.vendor?.vendor_id,
    vendorAddress: data.vendorAddress || data.vendor?.address,
    vendorFax: data.vendorFax || data.vendor?.fax,
    vendorPhone: data.vendorPhone || data.vendor?.phone_number,
    vendorEmail: data.vendorEmail || data.vendor?.email,
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
    expectedDeliveryDate: data.expectedDeliveryDate || data.expected_delivery_date,
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
    receivedBy: data.receivedBy || data.received_by,
    receivedByName: data.receivedByName,
    receivedAt: data.receivedAt || data.received_at,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
    items: data.items?.map((item: any) => ({
      id: item.id,
      purchasingOrderId: item.purchasingOrderId || item.purchasing_order_id,
      productId: item.productId || item.product_id,
      productName: item.productName || item.product?.name,
      productCode: item.productCode || item.product?.code,
      quantity: item.quantity !== undefined ? (typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity)) : 0,
      unitPrice: item.unitPrice !== undefined ? (typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice)) : (item.unit_price ? parseFloat(item.unit_price) : 0),
      discountPercentage: item.discountPercentage !== undefined ? item.discountPercentage : (item.discount_percentage ? parseFloat(item.discount_percentage) : null),
      discountAmount: item.discountAmount !== undefined ? item.discountAmount : (item.discount_amount ? parseFloat(item.discount_amount) : null),
      taxPercentage: item.taxPercentage !== undefined ? item.taxPercentage : (item.tax_percentage ? parseFloat(item.tax_percentage) : null),
      taxAmount: item.taxAmount !== undefined ? item.taxAmount : (item.tax_amount ? parseFloat(item.tax_amount) : null),
      purchasesTaxId: item.purchasesTaxId || item.purchases_tax_id || null,
      purchasesTaxCode: item.purchasesTaxCode || null,
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
    vendor: data.vendor,
    currency: data.currency,
    systemDefaultCurrency: data.systemDefaultCurrency,
    exchangeRateRecord: data.exchangeRate || data.exchangeRateRecord,
    createdByUser: data.createdByUser,
    updatedByUser: data.updatedByUser,
    sentByUser: data.sentByUser,
    acceptedByUser: data.acceptedByUser,
    rejectedByUser: data.rejectedByUser,
    receivedByUser: data.receivedByUser
  };
};

export const purchasingOrderService = {
  getPurchasingOrders: async (
    page: number = 1,
    limit: number = 10,
    filters: PurchasingOrderFilters = {},
    sortConfig: PurchasingOrderSortConfig = { field: 'createdAt', direction: 'desc' }
  ): Promise<PurchasingOrderResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortConfig.field,
      sortOrder: sortConfig.direction.toUpperCase()
    });
    console.log('Fetching Purchasing Orders with params:', params.toString());

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    // Use the API wrapper which returns a consistent `{ success, data, pagination }` shape
    const response = await api.get(`/purchasing-orders?${params.toString()}`);
    // response.data is expected to be an object like: { data: [...], pagination: {...} }
    const payload = response.data || {} as any;
    console.log('Received Purchasing Orders response payload:', payload);
    const items = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    return {
      purchasingOrders: items.map(transformPurchasingOrder),
      pagination: payload.pagination || (payload.pagination ? payload.pagination : { currentPage: page, totalPages: 0, totalItems: 0, itemsPerPage: limit })
    };
  },

  getPurchasingOrder: async (id: string): Promise<PurchasingOrder> => {
    const response = await api.get(`/purchasing-orders/${id}`);
    return transformPurchasingOrder(response.data);
  },

  getAllPurchasingOrders: async (): Promise<PurchasingOrder[]> => {
    const response = await api.get('/purchasing-orders/all');
    return response.data.map(transformPurchasingOrder);
  },

  createPurchasingOrder: async (data: PurchasingOrderFormData): Promise<PurchasingOrder> => {
    const transformedData = {
      purchasing_order_date: data.purchasingOrderDate,
      purchasing_order_ref_number: data.purchasingOrderRefNumber,
      store_id: data.storeId,
      vendor_id: data.vendorId,
      currency_id: data.currencyId,
      exchange_rate: data.exchangeRateValue || 1,
      system_default_currency_id: data.systemDefaultCurrencyId || null,
      exchange_rate_id: data.exchangeRateId || null,
      price_category_id: data.priceCategoryId || null,
      valid_until: data.validUntil,
      expected_delivery_date: data.expectedDeliveryDate,
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
        purchases_tax_id: item.purchasesTaxId || null,
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

    const response = await api.post('/purchasing-orders', transformedData);
    return transformPurchasingOrder(response.data);
  },

  updatePurchasingOrder: async (id: string, data: PurchasingOrderFormData): Promise<PurchasingOrder> => {
    const transformedData = {
      purchasing_order_date: data.purchasingOrderDate,
      store_id: data.storeId,
      vendor_id: data.vendorId,
      currency_id: data.currencyId,
      exchange_rate: data.exchangeRateValue || 1,
      system_default_currency_id: data.systemDefaultCurrencyId || null,
      exchange_rate_id: data.exchangeRateId || null,
      price_category_id: data.priceCategoryId || null,
      valid_until: data.validUntil,
      expected_delivery_date: data.expectedDeliveryDate,
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
        purchases_tax_id: item.purchasesTaxId || null,
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

    const response = await api.put(`/purchasing-orders/${id}`, transformedData);
    return transformPurchasingOrder(response.data);
  },

  deletePurchasingOrder: async (id: string): Promise<void> => {
    await api.delete(`/purchasing-orders/${id}`);
  },

  sendPurchasingOrder: async (id: string): Promise<void> => {
    await api.put(`/purchasing-orders/${id}/send`);
  },

  acceptPurchasingOrder: async (id: string): Promise<void> => {
    await api.put(`/purchasing-orders/${id}/accept`);
  },

  rejectPurchasingOrder: async (id: string, rejectionReason: string): Promise<void> => {
    await api.put(`/purchasing-orders/${id}/reject`, { rejectionReason });
  },

  receivePurchasingOrder: async (id: string, receivedDate?: string): Promise<void> => {
    await api.put(`/purchasing-orders/${id}/receive`, { receivedDate });
  },

  reopenPurchasingOrder: async (id: string, validUntil: string): Promise<PurchasingOrder> => {
    const response = await api.put(`/purchasing-orders/${id}/reopen`, { validUntil });
    return transformPurchasingOrder(response.data.order);
  },

  getPurchasingOrderStats: async (): Promise<PurchasingOrderStats> => {
    const response = await api.get('/purchasing-orders/stats');
    return response.data;
  },

  exportToExcel: async (filters?: PurchasingOrderFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/purchasing-orders/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  exportToPDF: async (filters?: PurchasingOrderFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/purchasing-orders/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  convertToPurchaseInvoice: async (id: string, invoiceDate?: string, dueDate?: string): Promise<{ purchaseInvoice: { id: string; invoiceRefNumber: string } }> => {
    const response = await api.put(`/purchasing-orders/${id}/convert-to-purchase-invoice`, {
      invoice_date: invoiceDate,
      due_date: dueDate
    });
    return response.data;
  }
};
