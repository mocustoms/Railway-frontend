import React, { useMemo } from 'react';
import { ProformaInvoice, ProformaInvoiceItem } from '../types';
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

interface ProformaInvoiceViewProps {
  proformaInvoice: ProformaInvoice;
  onEdit?: () => void;
  onConvertToSalesInvoice?: () => void;
}

const ProformaInvoiceView: React.FC<ProformaInvoiceViewProps> = ({
  proformaInvoice,
  onEdit,
  onConvertToSalesInvoice
}) => {
  // Check if any items have discounts (either percentage or amount)
  const hasDiscounts = useMemo(() => {
    if (!proformaInvoice.items || proformaInvoice.items.length === 0) {
      return false;
    }
    return proformaInvoice.items.some(item => 
      (item.discountPercentage !== undefined && item.discountPercentage > 0) ||
      (item.discountAmount !== undefined && item.discountAmount > 0)
    );
  }, [proformaInvoice.items]);

  // Helper function to render discount value
  const renderDiscount = (item: ProformaInvoiceItem) => {
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
          <h3 className="text-lg font-semibold text-gray-900">Proforma Invoice Details</h3>
          <p className="text-sm text-gray-500">Reference: {proformaInvoice.proformaRefNumber}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && proformaInvoice.status === 'draft' && (
            <button 
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit
            </button>
          )}
          {onConvertToSalesInvoice && (proformaInvoice.status === 'sent' || proformaInvoice.status === 'accepted') && (
            <button 
              onClick={onConvertToSalesInvoice}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <span>Convert to Sales Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Proforma Date:</span>
            <span className="text-sm text-gray-900">{formatDate(proformaInvoice.proformaDate)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Store:</span>
            <span className="text-sm text-gray-900">{proformaInvoice.storeName || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              proformaInvoice.status === 'accepted' ? 'bg-green-100 text-green-800' :
              proformaInvoice.status === 'rejected' ? 'bg-red-100 text-red-800' :
              proformaInvoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {proformaInvoice.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Currency:</span>
            <span className="text-sm text-gray-900">
              {proformaInvoice.currencyName ? `${proformaInvoice.currencyName} (${proformaInvoice.currencySymbol})` : 'Default'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Exchange Rate:</span>
            <span className="text-sm text-gray-900">
              {proformaInvoice.exchangeRateValue ? proformaInvoice.exchangeRateValue.toFixed(6) : '1.000000'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Valid Until:</span>
            <span className="text-sm text-gray-900">
              {proformaInvoice.validUntil ? formatDate(proformaInvoice.validUntil) : 'No limit'}
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
            <span className="text-sm text-gray-900">{proformaInvoice.customerCode || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Customer Name:</span>
            <span className="text-sm text-gray-900">{proformaInvoice.customerName || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between md:col-span-2">
            <span className="text-sm font-medium text-gray-600">Address:</span>
            <span className="text-sm text-gray-900">{proformaInvoice.customerAddress || 'Not provided'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Phone:</span>
            <span className="text-sm text-gray-900">{proformaInvoice.customerPhone || 'Not provided'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Email:</span>
            <span className="text-sm text-gray-900">{proformaInvoice.customerEmail || 'Not provided'}</span>
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
              {proformaInvoice.items && proformaInvoice.items.length > 0 ? (
                proformaInvoice.items.map((item, index) => (
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
      {(proformaInvoice.notes || proformaInvoice.termsConditions) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Invoice Description</h4>
          <div className="space-y-4">
            {proformaInvoice.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes:</label>
                <p className="text-sm text-gray-900 mt-1">{proformaInvoice.notes}</p>
              </div>
            )}
            {proformaInvoice.termsConditions && (
              <div>
                <label className="text-sm font-medium text-gray-600">Terms & Conditions:</label>
                <p className="text-sm text-gray-900 mt-1">{proformaInvoice.termsConditions}</p>
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
              <span className="text-sm font-medium">{formatCurrency(proformaInvoice.subtotal, undefined, proformaInvoice.currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Discount:</span>
              <span className="text-sm font-medium">-{formatCurrency(proformaInvoice.discountAmount, undefined, proformaInvoice.currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Tax:</span>
              <span className="text-sm font-medium">{formatCurrency(proformaInvoice.taxAmount, undefined, proformaInvoice.currencySymbol)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-base font-semibold">Total Amount:</span>
              <span className="text-base font-semibold">{formatCurrency(proformaInvoice.totalAmount, undefined, proformaInvoice.currencySymbol)}</span>
            </div>
            {proformaInvoice.equivalentAmount && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Equivalent Amount:</span>
                <span className="text-sm font-medium">{formatCurrency(proformaInvoice.equivalentAmount, undefined, proformaInvoice.systemDefaultCurrency?.symbol)}</span>
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
                by {proformaInvoice.createdByName || 'System'} on {formatDate(proformaInvoice.createdAt)}
              </div>
            </div>
          </div>

          {proformaInvoice.sentAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">→</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Sent</div>
                <div className="text-xs text-gray-500">
                  by {proformaInvoice.sentByName || 'System'} on {formatDate(proformaInvoice.sentAt)}
                </div>
              </div>
            </div>
          )}

          {proformaInvoice.acceptedAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Accepted</div>
                <div className="text-xs text-gray-500">
                  by {proformaInvoice.acceptedByName || 'System'} on {formatDate(proformaInvoice.acceptedAt)}
                </div>
              </div>
            </div>
          )}

          {proformaInvoice.rejectedAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs">✗</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Rejected</div>
                <div className="text-xs text-gray-500">
                  by {proformaInvoice.rejectedByName || 'System'} on {formatDate(proformaInvoice.rejectedAt)}
                  {proformaInvoice.rejectionReason && (
                    <div className="mt-1">Reason: {proformaInvoice.rejectionReason}</div>
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

export default ProformaInvoiceView;
