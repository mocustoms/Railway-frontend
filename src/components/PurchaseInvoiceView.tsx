import React, { useMemo } from 'react';
import { PurchaseInvoice, PurchaseInvoiceItem } from '../types';
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

interface PurchaseInvoiceViewProps {
  purchaseInvoice: PurchaseInvoice;
  onEdit?: () => void;
}

const PurchaseInvoiceView: React.FC<PurchaseInvoiceViewProps> = ({
  purchaseInvoice,
  onEdit
}) => {
  // Check if any items have discounts (either percentage or amount)
  const hasDiscounts = useMemo(() => {
    if (!purchaseInvoice.items || purchaseInvoice.items.length === 0) {
      return false;
    }
    return purchaseInvoice.items.some(item => 
      (item.discountPercentage !== undefined && item.discountPercentage > 0) ||
      (item.discountAmount !== undefined && item.discountAmount > 0)
    );
  }, [purchaseInvoice.items]);

  // Helper function to render discount value
  const renderDiscount = (item: PurchaseInvoiceItem) => {
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
          <h3 className="text-lg font-semibold text-gray-900">Purchase Invoice Details</h3>
          <p className="text-sm text-gray-500">Reference: {purchaseInvoice.invoiceRefNumber}</p>
        </div>
        {onEdit && purchaseInvoice.status !== 'cancelled' && purchaseInvoice.status !== 'paid' && purchaseInvoice.status !== 'approved' && (
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
            <span className="text-sm font-medium text-gray-600">Purchase Invoice Date:</span>
            <span className="text-sm text-gray-900">{formatDate(purchaseInvoice.invoiceDate)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Store:</span>
            <span className="text-sm text-gray-900">{purchaseInvoice.storeName || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              purchaseInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
              purchaseInvoice.status === 'partial_paid' ? 'bg-blue-100 text-blue-800' :
              purchaseInvoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
              purchaseInvoice.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
              purchaseInvoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {purchaseInvoice.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Currency:</span>
            <span className="text-sm text-gray-900">
              {purchaseInvoice.currencyName ? `${purchaseInvoice.currencyName} (${purchaseInvoice.currencySymbol})` : 'Default'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Exchange Rate:</span>
            <span className="text-sm text-gray-900">
              {purchaseInvoice.exchangeRateValue ? purchaseInvoice.exchangeRateValue.toFixed(6) : '1.000000'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Due Date:</span>
            <span className="text-sm text-gray-900">
              {purchaseInvoice.dueDate ? formatDate(purchaseInvoice.dueDate) : 'Not set'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Paid Amount:</span>
            <span className="text-sm text-gray-900">
              {purchaseInvoice.paidAmount !== undefined && purchaseInvoice.paidAmount !== null ? formatCurrency(purchaseInvoice.paidAmount, purchaseInvoice.currencySymbol) : '0.00'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Balance Amount:</span>
            <span className="text-sm text-gray-900">
              {purchaseInvoice.balanceAmount !== undefined && purchaseInvoice.balanceAmount !== null ? formatCurrency(purchaseInvoice.balanceAmount, purchaseInvoice.currencySymbol) : '0.00'}
            </span>
          </div>
        </div>
      </div>


      {/* Vendor Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Vendor Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Vendor ID:</span>
            <span className="text-sm text-gray-900">{purchaseInvoice.vendorCode || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Vendor Name:</span>
            <span className="text-sm text-gray-900">{purchaseInvoice.vendorName || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between md:col-span-2">
            <span className="text-sm font-medium text-gray-600">Address:</span>
            <span className="text-sm text-gray-900">{purchaseInvoice.vendorAddress || 'Not provided'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Phone:</span>
            <span className="text-sm text-gray-900">{purchaseInvoice.vendorPhone || 'Not provided'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Email:</span>
            <span className="text-sm text-gray-900">{purchaseInvoice.vendorEmail || 'Not provided'}</span>
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
              {purchaseInvoice.items && purchaseInvoice.items.length > 0 ? (
                purchaseInvoice.items.map((item, index) => (
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
                    No items found for this purchase invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes and Terms */}
      {(purchaseInvoice.notes || purchaseInvoice.termsConditions) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Invoice Description</h4>
          <div className="space-y-4">
            {purchaseInvoice.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes:</label>
                <p className="text-sm text-gray-900 mt-1">{purchaseInvoice.notes}</p>
              </div>
            )}
            {purchaseInvoice.termsConditions && (
              <div>
                <label className="text-sm font-medium text-gray-600">Terms & Conditions:</label>
                <p className="text-sm text-gray-900 mt-1">{purchaseInvoice.termsConditions}</p>
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
              <span className="text-sm font-medium">{formatCurrency(purchaseInvoice.subtotal, undefined, purchaseInvoice.currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Discount:</span>
              <span className="text-sm font-medium">-{formatCurrency(purchaseInvoice.discountAmount, undefined, purchaseInvoice.currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Tax:</span>
              <span className="text-sm font-medium">{formatCurrency(purchaseInvoice.taxAmount, undefined, purchaseInvoice.currencySymbol)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-base font-semibold">Total Amount:</span>
              <span className="text-base font-semibold">{formatCurrency(purchaseInvoice.totalAmount, undefined, purchaseInvoice.currencySymbol)}</span>
            </div>
            {purchaseInvoice.equivalentAmount && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Equivalent Amount:</span>
                <span className="text-sm font-medium">{formatCurrency(purchaseInvoice.equivalentAmount, undefined, purchaseInvoice.systemDefaultCurrency?.symbol)}</span>
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
                by {purchaseInvoice.createdByName || 'System'} on {formatDate(purchaseInvoice.createdAt)}
              </div>
            </div>
          </div>

          {purchaseInvoice.sentAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">→</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Sent</div>
                <div className="text-xs text-gray-500">
                  by {purchaseInvoice.sentByName || 'System'} on {formatDate(purchaseInvoice.sentAt)}
                </div>
              </div>
            </div>
          )}

          {purchaseInvoice.paidAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Paid</div>
                <div className="text-xs text-gray-500">
                  on {formatDate(purchaseInvoice.paidAt)}
                </div>
              </div>
            </div>
          )}

          {purchaseInvoice.cancelledAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs">✗</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Cancelled</div>
                <div className="text-xs text-gray-500">
                  by {purchaseInvoice.cancelledByName || 'System'} on {formatDate(purchaseInvoice.cancelledAt)}
                  {purchaseInvoice.cancellationReason && (
                    <div className="mt-1">Reason: {purchaseInvoice.cancellationReason}</div>
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

export default PurchaseInvoiceView;
