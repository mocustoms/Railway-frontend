import React, { useMemo } from 'react';
import { SalesInvoice, SalesInvoiceItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

// Helper function to format numbers without currency symbol (for items table)
const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Helper function to format quantity - show decimals only if they exist
const formatQuantity = (quantity: number): string => {
  if (typeof quantity !== 'number') {
    return '0';
  }
  // Check if it's a whole number
  if (quantity % 1 === 0) {
    return quantity.toString();
  }
  // Has decimals - show up to 3 decimal places, remove trailing zeros
  return quantity.toFixed(3).replace(/\.?0+$/, '');
};

interface SalesInvoiceViewProps {
  salesInvoice: SalesInvoice;
  onEdit?: () => void;
}

const SalesInvoiceView: React.FC<SalesInvoiceViewProps> = ({
  salesInvoice,
  onEdit
}) => {
  // Check if any items have discounts (either percentage or amount)
  const hasDiscounts = useMemo(() => {
    if (!salesInvoice.items || salesInvoice.items.length === 0) {
      return false;
    }
    return salesInvoice.items.some(item => 
      (item.discountPercentage !== undefined && item.discountPercentage > 0) ||
      (item.discountAmount !== undefined && item.discountAmount > 0)
    );
  }, [salesInvoice.items]);

  // Helper function to render discount value
  const renderDiscount = (item: SalesInvoiceItem) => {
    // Priority: discountPercentage if exists and > 0, otherwise discountAmount
    if (item.discountPercentage !== undefined && item.discountPercentage > 0) {
      return `${item.discountPercentage.toFixed(2)}%`;
    }
    if (item.discountAmount !== undefined && item.discountAmount > 0) {
      return formatNumber(item.discountAmount);
    }
    return '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sales Invoice Details</h3>
          <p className="text-sm text-gray-500">Reference: {salesInvoice.invoiceRefNumber}</p>
        </div>
        {onEdit && salesInvoice.status !== 'cancelled' && salesInvoice.status !== 'paid' && salesInvoice.status !== 'approved' && (
          <button 
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Sales Order Date:</span>
            <span className="text-sm text-gray-900">{formatDate(salesInvoice.invoiceDate)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Store:</span>
            <span className="text-sm text-gray-900">{salesInvoice.storeName || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              salesInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
              salesInvoice.status === 'partial_paid' ? 'bg-blue-100 text-blue-800' :
              salesInvoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
              salesInvoice.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
              salesInvoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {salesInvoice.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Currency:</span>
            <span className="text-sm text-gray-900">
              {salesInvoice.currencyName ? `${salesInvoice.currencyName} (${salesInvoice.currencySymbol})` : 'Default'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Exchange Rate:</span>
            <span className="text-sm text-gray-900">
              {salesInvoice.exchangeRateValue ? salesInvoice.exchangeRateValue.toFixed(6) : '1.000000'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Due Date:</span>
            <span className="text-sm text-gray-900">
              {salesInvoice.dueDate ? formatDate(salesInvoice.dueDate) : 'Not set'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Paid Amount:</span>
            <span className="text-sm text-gray-900">
              {salesInvoice.paidAmount !== undefined && salesInvoice.paidAmount !== null ? formatCurrency(salesInvoice.paidAmount, salesInvoice.currencySymbol) : '0.00'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Balance Amount:</span>
            <span className="text-sm text-gray-900">
              {salesInvoice.balanceAmount !== undefined && salesInvoice.balanceAmount !== null ? formatCurrency(salesInvoice.balanceAmount, salesInvoice.currencySymbol) : '0.00'}
            </span>
          </div>
        </div>
      </div>


      {/* Customer Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Customer ID:</span>
            <span className="text-sm text-gray-900">{salesInvoice.customerCode || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Customer Name:</span>
            <span className="text-sm text-gray-900">{salesInvoice.customerName || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between md:col-span-2">
            <span className="text-sm font-medium text-gray-600">Address:</span>
            <span className="text-sm text-gray-900">{salesInvoice.customerAddress || 'Not provided'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Phone:</span>
            <span className="text-sm text-gray-900">{salesInvoice.customerPhone || 'Not provided'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Email:</span>
            <span className="text-sm text-gray-900">{salesInvoice.customerEmail || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Items</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                {hasDiscounts && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesInvoice.items && salesInvoice.items.length > 0 ? (
                salesInvoice.items.map((item, index) => (
                  <tr key={item.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.productName || item.product?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatQuantity(item.quantity || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(item.unitPrice || 0)}
                    </td>
                    {hasDiscounts && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderDiscount(item)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.taxPercentage ? item.taxPercentage.toFixed(2) : '0.00'}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatNumber(item.lineTotal || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.notes || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hasDiscounts ? 7 : 6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No items found for this proforma invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes and Terms */}
      {(salesInvoice.notes || salesInvoice.termsConditions) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Invoice Description</h4>
          <div className="space-y-4">
            {salesInvoice.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes:</label>
                <p className="text-sm text-gray-900 mt-1">{salesInvoice.notes}</p>
              </div>
            )}
            {salesInvoice.termsConditions && (
              <div>
                <label className="text-sm font-medium text-gray-600">Terms & Conditions:</label>
                <p className="text-sm text-gray-900 mt-1">{salesInvoice.termsConditions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Totals</h4>
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-medium">{formatCurrency(salesInvoice.subtotal, undefined, salesInvoice.currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Discount:</span>
              <span className="text-sm font-medium">-{formatCurrency(salesInvoice.discountAmount, undefined, salesInvoice.currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Tax:</span>
              <span className="text-sm font-medium">{formatCurrency(salesInvoice.taxAmount, undefined, salesInvoice.currencySymbol)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-base font-semibold">Total Amount:</span>
              <span className="text-base font-semibold">{formatCurrency(salesInvoice.totalAmount, undefined, salesInvoice.currencySymbol)}</span>
            </div>
            {salesInvoice.equivalentAmount && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Equivalent Amount:</span>
                <span className="text-sm font-medium">{formatCurrency(salesInvoice.equivalentAmount, undefined, salesInvoice.systemDefaultCurrency?.symbol)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status History */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Status History</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">✓</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Created</div>
              <div className="text-xs text-gray-500">
                by {salesInvoice.createdByName || 'System'} on {formatDate(salesInvoice.createdAt)}
              </div>
            </div>
          </div>

          {salesInvoice.sentAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">→</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Sent</div>
                <div className="text-xs text-gray-500">
                  by {salesInvoice.sentByName || 'System'} on {formatDate(salesInvoice.sentAt)}
                </div>
              </div>
            </div>
          )}

          {salesInvoice.paidAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Paid</div>
                <div className="text-xs text-gray-500">
                  on {formatDate(salesInvoice.paidAt)}
                </div>
              </div>
            </div>
          )}

          {salesInvoice.cancelledAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs">✗</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Cancelled</div>
                <div className="text-xs text-gray-500">
                  by {salesInvoice.cancelledByName || 'System'} on {formatDate(salesInvoice.cancelledAt)}
                  {salesInvoice.cancellationReason && (
                    <div className="mt-1">Reason: {salesInvoice.cancellationReason}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceView;
