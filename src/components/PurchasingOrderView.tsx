import React, { useMemo } from 'react';
import { PurchasingOrder, PurchasingOrderItem } from '../types';
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

interface PurchasingOrderViewProps {
  purchasingOrder: PurchasingOrder;
  onEdit?: () => void;
  onConvertToPurchaseInvoice?: () => void;
}

const PurchasingOrderView: React.FC<PurchasingOrderViewProps> = ({
  purchasingOrder,
  onEdit,
  onConvertToPurchaseInvoice
}) => {
  // Check if any items have discounts (either percentage or amount)
  const hasDiscounts = useMemo(() => {
    if (!purchasingOrder.items || purchasingOrder.items.length === 0) {
      return false;
    }
    return purchasingOrder.items.some(item => 
      (item.discountPercentage !== undefined && item.discountPercentage > 0) ||
      (item.discountAmount !== undefined && item.discountAmount > 0)
    );
  }, [purchasingOrder.items]);

  // Helper function to render discount value
  const renderDiscount = (item: PurchasingOrderItem) => {
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
          <h3 className="text-lg font-semibold text-gray-900">Purchasing Order Details</h3>
          <p className="text-sm text-gray-500">Reference: {purchasingOrder.purchasingOrderRefNumber}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && purchasingOrder.status === 'draft' && (
          <button 
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit
          </button>
        )}
          {onConvertToPurchaseInvoice && (purchasingOrder.status === 'sent' || purchasingOrder.status === 'accepted' || purchasingOrder.status === 'received') && (
            <button 
              onClick={onConvertToPurchaseInvoice}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <span>Convert to Purchase Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Purchasing Order Date:</span>
            <span className="text-sm text-gray-900">{formatDate(purchasingOrder.purchasingOrderDate)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Store:</span>
            <span className="text-sm text-gray-900">{purchasingOrder.storeName || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              purchasingOrder.status === 'accepted' ? 'bg-green-100 text-green-800' :
              purchasingOrder.status === 'received' ? 'bg-purple-100 text-purple-800' :
              purchasingOrder.status === 'rejected' ? 'bg-red-100 text-red-800' :
              purchasingOrder.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {purchasingOrder.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Currency:</span>
            <span className="text-sm text-gray-900">
              {purchasingOrder.currencyName ? `${purchasingOrder.currencyName} (${purchasingOrder.currencySymbol})` : 'Default'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Exchange Rate:</span>
            <span className="text-sm text-gray-900">
              {purchasingOrder.exchangeRateValue ? purchasingOrder.exchangeRateValue.toFixed(6) : '1.000000'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Valid Until:</span>
            <span className="text-sm text-gray-900">
              {purchasingOrder.validUntil ? formatDate(purchasingOrder.validUntil) : 'No limit'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Expected Delivery Date:</span>
            <span className="text-sm text-gray-900">
              {purchasingOrder.expectedDeliveryDate ? formatDate(purchasingOrder.expectedDeliveryDate) : 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      {purchasingOrder.shippingAddress && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h4>
          <div className="text-sm text-gray-700">
            <p className="whitespace-pre-wrap">{purchasingOrder.shippingAddress}</p>
          </div>
        </div>
      )}

      {/* Vendor Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Vendor Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Vendor ID:</span>
            <span className="text-sm text-gray-900">{purchasingOrder.vendorCode || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Vendor Name:</span>
            <span className="text-sm text-gray-900">{purchasingOrder.vendorName || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between md:col-span-2">
            <span className="text-sm font-medium text-gray-600">Address:</span>
            <span className="text-sm text-gray-900">{purchasingOrder.vendorAddress || 'Not provided'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Phone:</span>
            <span className="text-sm text-gray-900">{purchasingOrder.vendorPhone || 'Not provided'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Email:</span>
            <span className="text-sm text-gray-900">{purchasingOrder.vendorEmail || 'Not provided'}</span>
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
              {purchasingOrder.items && purchasingOrder.items.length > 0 ? (
                purchasingOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.productName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{item.productCode || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatQuantity(item.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(item.unitPrice)}
                    </td>
                    {hasDiscounts && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderDiscount(item)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.taxPercentage ? `${item.taxPercentage.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatNumber(item.lineTotal)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hasDiscounts ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Totals Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(purchasingOrder.subtotal, purchasingOrder.currencyId || 'USD', purchasingOrder.currencySymbol)}
            </span>
          </div>
          {purchasingOrder.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Discount:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(purchasingOrder.discountAmount, purchasingOrder.currencyId || 'USD', purchasingOrder.currencySymbol)}
              </span>
            </div>
          )}
          {purchasingOrder.amountAfterDiscount && purchasingOrder.amountAfterDiscount !== purchasingOrder.subtotal && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount After Discount:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(purchasingOrder.amountAfterDiscount, purchasingOrder.currencyId || 'USD', purchasingOrder.currencySymbol)}
              </span>
            </div>
          )}
          {purchasingOrder.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tax:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(purchasingOrder.taxAmount, purchasingOrder.currencyId || 'USD', purchasingOrder.currencySymbol)}
              </span>
            </div>
          )}
          {purchasingOrder.totalWhtAmount && purchasingOrder.totalWhtAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">WHT:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(purchasingOrder.totalWhtAmount, purchasingOrder.currencyId || 'USD', purchasingOrder.currencySymbol)}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-900">Total Amount:</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(purchasingOrder.totalAmount, purchasingOrder.currencyId || 'USD', purchasingOrder.currencySymbol)}
            </span>
          </div>
          {purchasingOrder.equivalentAmount && purchasingOrder.equivalentAmount !== purchasingOrder.totalAmount && (
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Equivalent Amount (System Currency):</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(purchasingOrder.equivalentAmount, purchasingOrder.systemDefaultCurrency?.code || 'USD', purchasingOrder.systemDefaultCurrency?.symbol)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {purchasingOrder.notes && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Notes</h4>
          <div className="text-sm text-gray-700">
            <p className="whitespace-pre-wrap">{purchasingOrder.notes}</p>
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      {purchasingOrder.termsConditions && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Terms & Conditions</h4>
          <div className="text-sm text-gray-700">
            <p className="whitespace-pre-wrap">{purchasingOrder.termsConditions}</p>
          </div>
        </div>
      )}

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
                by {purchasingOrder.createdByName || 'System'} on {formatDate(purchasingOrder.createdAt)}
              </div>
            </div>
          </div>

          {purchasingOrder.sentAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">→</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Sent</div>
                <div className="text-xs text-gray-500">
                  by {purchasingOrder.sentByName || 'System'} on {formatDate(purchasingOrder.sentAt)}
                </div>
              </div>
            </div>
          )}

          {purchasingOrder.acceptedAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Accepted</div>
                <div className="text-xs text-gray-500">
                  by {purchasingOrder.acceptedByName || 'System'} on {formatDate(purchasingOrder.acceptedAt)}
                </div>
              </div>
            </div>
          )}

          {purchasingOrder.receivedAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xs">✓✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Received</div>
                <div className="text-xs text-gray-500">
                  by {purchasingOrder.receivedByName || 'System'} on {formatDate(purchasingOrder.receivedAt)}
                  {purchasingOrder.expectedDeliveryDate && (
                    <div className="mt-1">Expected Delivery Date: {formatDate(purchasingOrder.expectedDeliveryDate)}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {purchasingOrder.rejectedAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs">✗</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Rejected</div>
                <div className="text-xs text-gray-500">
                  by {purchasingOrder.rejectedByName || 'System'} on {formatDate(purchasingOrder.rejectedAt)}
                  {purchasingOrder.rejectionReason && (
                    <div className="mt-1">Reason: {purchasingOrder.rejectionReason}</div>
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

export default PurchasingOrderView;
