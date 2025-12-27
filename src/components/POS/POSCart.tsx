import React from 'react';
import { SalesInvoiceItemFormData, Product } from '../../types';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

interface POSCartProps {
  items: (SalesInvoiceItemFormData & { productName?: string; productCode?: string })[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencySymbol?: string;
}

const POSCart: React.FC<POSCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
  currencySymbol = ''
}) => {
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Cart Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {items.length}
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <ShoppingCart className="h-12 w-12 mb-2" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs mt-1">Add products to get started</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    {item.productName || 'Product'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onUpdateQuantity(index, Math.max(0.01, item.quantity - 1))}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = parseFloat(e.target.value) || 0;
                      onUpdateQuantity(index, Math.max(0.01, newQuantity));
                    }}
                    className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                    min="0.01"
                    step="0.01"
                  />
                  <button
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="font-semibold text-sm text-gray-900">
                  {formatCurrency(item.lineTotal || 0)}
                </span>
              </div>

              {/* Discount and Tax Info */}
              {((item.discountAmount && item.discountAmount > 0) || (item.taxAmount && item.taxAmount > 0)) && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  {item.discountAmount && item.discountAmount > 0 && (
                    <div>Discount: {formatCurrency(item.discountAmount)}</div>
                  )}
                  {item.taxAmount && item.taxAmount > 0 && (
                    <div>Tax: {formatCurrency(item.taxAmount)}</div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cart Summary */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
            <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSCart;

