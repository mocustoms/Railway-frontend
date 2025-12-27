import React, { useState, useEffect } from 'react';
import { SalesInvoiceItemFormData, Product } from '../../types';
import { Customer } from '../../services/customerService';
import { Plus, Minus, Trash2, User, CreditCard, Wallet, Gift, Percent, DollarSign, ChevronDown, ChevronUp, X, Edit2, XCircle, CheckCircle } from 'lucide-react';
import POSCustomerSelect from './POSCustomerSelect';
import ImageWithFallback from '../ImageWithFallback';
import PaymentModal from './PaymentModal';

interface OrderDetailsPanelProps {
  items: (SalesInvoiceItemFormData & { 
    productName?: string; 
    productCode?: string; 
    productImage?: string;
    originalTaxPercentage?: number;
    originalSalesTaxId?: string | null;
  })[];
  customer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateDiscount: (index: number, discountPercentage: number, discountAmount: number) => void;
  onUpdatePrice?: (index: number, unitPrice: number) => void;
  onRemoveVAT?: (index: number) => void;
  onAddVAT?: (index: number) => void;
  onRemoveItem: (index: number) => void;
  subtotal: number;
  taxAmount: number;
  taxPercentage?: number; // Added tax percentage prop
  discountAmount: number;
  totalAmount: number;
  currencySymbol?: string;
  onProcessTransaction: () => void;
  isProcessing?: boolean;
  onCreateCustomer?: () => void;
  salesAgents?: Array<{ id: string; agentNumber: string; fullName: string }>;
  selectedSalesAgent?: string;
  onSalesAgentChange?: (agentId: string) => void;
  storeName?: string; // Added store name prop
  salesProfile?: 'cash' | 'credit'; // Added sales profile prop
  onPaymentConfirm?: (paymentTypeId: string, amount: number) => void; // Added payment confirm callback
  paidAmount?: number; // Added paid amount prop
  paymentTypeName?: string; // Added payment type name prop
}

const OrderDetailsPanel: React.FC<OrderDetailsPanelProps> = ({
  items,
  customer,
  onCustomerSelect,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdatePrice,
  onRemoveVAT,
  onAddVAT,
  onRemoveItem,
  subtotal,
  taxAmount,
  taxPercentage: taxPercentageProp, // Use prop instead of calculating
  discountAmount,
  totalAmount,
  currencySymbol = '',
  onProcessTransaction,
  isProcessing = false,
  onCreateCustomer,
  salesAgents = [],
  selectedSalesAgent = '',
  onSalesAgentChange,
  storeName,
  salesProfile = 'cash',
  onPaymentConfirm,
  paidAmount = 0,
  paymentTypeName
}) => {
  const [discountMode, setDiscountMode] = useState<{ [key: number]: 'percentage' | 'amount' }>({});
  const [isCustomerDetailsExpanded, setIsCustomerDetailsExpanded] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);
  const [priceInputValue, setPriceInputValue] = useState<string>('');
  const [editingQuantityIndex, setEditingQuantityIndex] = useState<number | null>(null);
  const [quantityInputValue, setQuantityInputValue] = useState<string>('');
  const holdIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);
  const formatCurrency = (amount: number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Use the tax percentage from props (weighted average from items), or calculate fallback
  const taxPercentage = taxPercentageProp !== undefined 
    ? taxPercentageProp.toFixed(1) 
    : (subtotal > 0 ? ((taxAmount / subtotal) * 100).toFixed(1) : '0');

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 border-l border-gray-200/50 shadow-lg">
      {/* Transaction Details */}
      <div className="bg-gradient-to-r from-white via-gray-50/30 to-white border-b border-gray-200/50 px-6 py-4 shadow-sm backdrop-blur-sm">
        <div className="space-y-3">
          {!customer && (
            <div>
              <POSCustomerSelect
                selectedCustomer={customer}
                onSelectCustomer={onCustomerSelect}
                onCreateCustomer={onCreateCustomer}
              />
            </div>
          )}
          
          {/* Customer Details - Shows customer name when selected */}
          {customer && (
            <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-lg border border-blue-200/30 shadow-sm">
              <div className="flex items-center">
                <button
                  onClick={() => setIsCustomerDetailsExpanded(!isCustomerDetailsExpanded)}
                  className="flex-1 p-3 flex items-center justify-between hover:bg-blue-50/50 transition-colors rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">{customer.full_name || 'Customer'}</span>
                  </div>
                  {isCustomerDetailsExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={() => onCustomerSelect(null)}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-blue-50/50 transition-colors rounded-lg"
                  title="Remove Customer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {isCustomerDetailsExpanded && (
                <div className="px-4 pb-4 space-y-2">
                {/* Customer Code */}
                {customer.customer_id && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <span>Customer Code:</span>
                    </span>
                    <span className="font-medium text-gray-900">{customer.customer_id}</span>
                  </div>
                )}
                
                {/* Account Balance */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Account Balance:</span>
                  </span>
                  <span className={`font-medium ${(customer.account_balance || 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(customer.account_balance || 0)}
                  </span>
                </div>
                
                {/* Deposit Balance */}
                {(customer.deposit_balance || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Deposit Balance:</span>
                    </span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(customer.deposit_balance || 0)}
                    </span>
                  </div>
                )}
                
                {/* Loyalty Card */}
                {(customer.loyalty_card_name || customer.loyalty_card_number) && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <Gift className="h-3.5 w-3.5" />
                      <span>Loyalty Card:</span>
                    </span>
                    <span className="font-medium text-purple-600">
                      {customer.loyalty_card_name || customer.loyalty_card_number || 'N/A'}
                    </span>
                  </div>
                )}
                
                {/* Loyalty Points */}
                {(customer.loyalty_points || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <Gift className="h-3.5 w-3.5" />
                      <span>Loyalty Points:</span>
                    </span>
                    <span className="font-medium text-purple-600">
                      {customer.loyalty_points?.toLocaleString() || '0'}
                    </span>
                  </div>
                )}
                </div>
              )}
            </div>
          )}
          
          {onSalesAgentChange && (
            <div>
              <select
                value={selectedSalesAgent}
                onChange={(e) => onSalesAgentChange(e.target.value)}
                className="w-full px-4 py-2 bg-white/80 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 transition-all shadow-sm hover:shadow-md backdrop-blur-sm"
              >
                <option value="">Select sales agent (optional)</option>
                {salesAgents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.agentNumber} - {agent.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>
      </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-gray-50/20 to-white border-b border-gray-200/50 px-6 py-4 shadow-inner">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cart Items</h2>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <p className="text-sm">No items in cart</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-white via-gray-50/30 to-white border border-gray-200/50 rounded-lg p-3 hover:shadow-lg transition-all shadow-md hover:scale-[1.01]">
                <div className="flex items-start space-x-3">
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden">
                    <ImageWithFallback
                      src={item.productImage}
                      alt={item.productName || 'Product'}
                      module="products"
                      size="lg"
                      className="w-full h-full"
                      fallbackIcon="package"
                    />
                  </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 mb-1 truncate">
                    {item.productName || 'Product'}
                  </h4>
                  <div className="space-y-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onUpdateQuantity(index, Math.max(0.01, item.quantity - 1))}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            // Immediate decrease
                            onUpdateQuantity(index, Math.max(0.01, item.quantity - 1));
                            
                            let timeoutId: NodeJS.Timeout;
                            let intervalId: NodeJS.Timeout;
                            
                            // Start continuous decrease after a short delay
                            timeoutId = setTimeout(() => {
                              intervalId = setInterval(() => {
                                // Get current item from items array
                                const currentItem = items[index];
                                if (!currentItem) {
                                  clearInterval(intervalId);
                                  return;
                                }
                                const newQuantity = Math.max(0.01, currentItem.quantity - 1);
                                onUpdateQuantity(index, newQuantity);
                              }, 100); // Update every 100ms
                              holdIntervalRef.current = intervalId;
                            }, 300); // Start after 300ms hold
                            
                            // Cleanup function
                            const cleanup = () => {
                              clearTimeout(timeoutId);
                              if (intervalId) {
                                clearInterval(intervalId);
                              }
                              if (holdIntervalRef.current) {
                                clearInterval(holdIntervalRef.current);
                                holdIntervalRef.current = null;
                              }
                            };
                            
                            const handleMouseUp = () => {
                              cleanup();
                              document.removeEventListener('mouseup', handleMouseUp);
                              document.removeEventListener('mouseleave', handleMouseUp);
                            };
                            
                            document.addEventListener('mouseup', handleMouseUp);
                            document.addEventListener('mouseleave', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            // Immediate decrease
                            onUpdateQuantity(index, Math.max(0.01, item.quantity - 1));
                            
                            let timeoutId: NodeJS.Timeout;
                            let intervalId: NodeJS.Timeout;
                            
                            // Start continuous decrease after a short delay
                            timeoutId = setTimeout(() => {
                              intervalId = setInterval(() => {
                                // Get current item from items array
                                const currentItem = items[index];
                                if (!currentItem) {
                                  clearInterval(intervalId);
                                  return;
                                }
                                const newQuantity = Math.max(0.01, currentItem.quantity - 1);
                                onUpdateQuantity(index, newQuantity);
                              }, 100); // Update every 100ms
                              holdIntervalRef.current = intervalId;
                            }, 300); // Start after 300ms hold
                            
                            // Cleanup function
                            const cleanup = () => {
                              clearTimeout(timeoutId);
                              if (intervalId) {
                                clearInterval(intervalId);
                              }
                              if (holdIntervalRef.current) {
                                clearInterval(holdIntervalRef.current);
                                holdIntervalRef.current = null;
                              }
                            };
                            
                            const handleTouchEnd = () => {
                              cleanup();
                              document.removeEventListener('touchend', handleTouchEnd);
                              document.removeEventListener('touchcancel', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchend', handleTouchEnd);
                            document.addEventListener('touchcancel', handleTouchEnd);
                          }}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-100 active:bg-gray-200 select-none"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        {editingQuantityIndex === index ? (
                          <input
                            type="number"
                            value={quantityInputValue}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty string, numbers, and decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setQuantityInputValue(value);
                              }
                            }}
                            onBlur={() => {
                              const quantity = parseFloat(quantityInputValue) || 0.01;
                              if (quantity > 0) {
                                onUpdateQuantity(index, quantity);
                              }
                              setEditingQuantityIndex(null);
                              setQuantityInputValue('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const quantity = parseFloat(quantityInputValue) || 0.01;
                                if (quantity > 0) {
                                  onUpdateQuantity(index, quantity);
                                }
                                setEditingQuantityIndex(null);
                                setQuantityInputValue('');
                              } else if (e.key === 'Escape') {
                                setEditingQuantityIndex(null);
                                setQuantityInputValue('');
                              }
                            }}
                            autoFocus
                            className="w-16 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                            min="0.01"
                            step="0.01"
                            placeholder="0.01"
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingQuantityIndex(index);
                              setQuantityInputValue((item.quantity || 0).toString());
                            }}
                            className="text-sm font-medium w-16 text-center cursor-pointer hover:bg-gray-100 rounded px-2 py-1 border border-transparent hover:border-gray-300 transition-colors"
                            title="Click to edit quantity"
                          >
                            {item.quantity}
                          </span>
                        )}
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            // Immediate increase
                            onUpdateQuantity(index, item.quantity + 1);
                            
                            let timeoutId: NodeJS.Timeout;
                            let intervalId: NodeJS.Timeout;
                            
                            // Start continuous increase after a short delay
                            timeoutId = setTimeout(() => {
                              intervalId = setInterval(() => {
                                // Get current item from items array
                                const currentItem = items[index];
                                if (!currentItem) {
                                  clearInterval(intervalId);
                                  return;
                                }
                                const newQuantity = currentItem.quantity + 1;
                                onUpdateQuantity(index, newQuantity);
                              }, 100); // Update every 100ms
                              holdIntervalRef.current = intervalId;
                            }, 300); // Start after 300ms hold
                            
                            // Cleanup function
                            const cleanup = () => {
                              clearTimeout(timeoutId);
                              if (intervalId) {
                                clearInterval(intervalId);
                              }
                              if (holdIntervalRef.current) {
                                clearInterval(holdIntervalRef.current);
                                holdIntervalRef.current = null;
                              }
                            };
                            
                            const handleMouseUp = () => {
                              cleanup();
                              document.removeEventListener('mouseup', handleMouseUp);
                              document.removeEventListener('mouseleave', handleMouseUp);
                            };
                            
                            document.addEventListener('mouseup', handleMouseUp);
                            document.addEventListener('mouseleave', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            // Immediate increase
                            onUpdateQuantity(index, item.quantity + 1);
                            
                            let timeoutId: NodeJS.Timeout;
                            let intervalId: NodeJS.Timeout;
                            
                            // Start continuous increase after a short delay
                            timeoutId = setTimeout(() => {
                              intervalId = setInterval(() => {
                                // Get current item from items array
                                const currentItem = items[index];
                                if (!currentItem) {
                                  clearInterval(intervalId);
                                  return;
                                }
                                const newQuantity = currentItem.quantity + 1;
                                onUpdateQuantity(index, newQuantity);
                              }, 100); // Update every 100ms
                              holdIntervalRef.current = intervalId;
                            }, 300); // Start after 300ms hold
                            
                            // Cleanup function
                            const cleanup = () => {
                              clearTimeout(timeoutId);
                              if (intervalId) {
                                clearInterval(intervalId);
                              }
                              if (holdIntervalRef.current) {
                                clearInterval(holdIntervalRef.current);
                                holdIntervalRef.current = null;
                              }
                            };
                            
                            const handleTouchEnd = () => {
                              cleanup();
                              document.removeEventListener('touchend', handleTouchEnd);
                              document.removeEventListener('touchcancel', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchend', handleTouchEnd);
                            document.addEventListener('touchcancel', handleTouchEnd);
                          }}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-100 active:bg-gray-200 select-none"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      {/* Price */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.lineTotal || 0)}
                        </span>
                        <button
                          onClick={() => onRemoveItem(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Unit Price Editing */}
                    {onUpdatePrice && (
                      <div className="flex items-center space-x-2 pt-1 border-t border-gray-100">
                        <span className="text-xs text-gray-600">Unit Price:</span>
                        {editingPriceIndex === index ? (
                          <div className="flex items-center space-x-1 flex-1">
                            <input
                              type="number"
                              value={priceInputValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty string, numbers, and decimal point
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setPriceInputValue(value);
                                }
                              }}
                              onBlur={() => {
                                const price = parseFloat(priceInputValue) || 0;
                                if (price >= 0) {
                                  onUpdatePrice(index, price);
                                }
                                setEditingPriceIndex(null);
                                setPriceInputValue('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const price = parseFloat(priceInputValue) || 0;
                                  if (price >= 0) {
                                    onUpdatePrice(index, price);
                                  }
                                  setEditingPriceIndex(null);
                                  setPriceInputValue('');
                                } else if (e.key === 'Escape') {
                                  setEditingPriceIndex(null);
                                  setPriceInputValue('');
                                }
                              }}
                              autoFocus
                              className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                            <span className="text-xs text-gray-500">{currencySymbol}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 flex-1">
                            <span className="text-xs font-medium text-gray-700">
                              {formatCurrency(item.unitPrice || 0)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPriceIndex(index);
                                setPriceInputValue((item.unitPrice || 0).toString());
                              }}
                              className="p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Price"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Discount Input */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-gray-100">
                      <span className="text-xs text-gray-600">Discount:</span>
                      <div className="flex items-center space-x-1 flex-1">
                        <button
                          onClick={() => {
                            const currentMode = discountMode[index] || 'percentage';
                            setDiscountMode({ ...discountMode, [index]: currentMode === 'percentage' ? 'amount' : 'percentage' });
                          }}
                          className={`p-1 border rounded transition-all ${
                            discountMode[index] === 'amount'
                              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                              : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                          }`}
                          title={discountMode[index] === 'amount' ? 'Switch to percentage' : 'Switch to amount'}
                        >
                          {discountMode[index] === 'amount' ? (
                            <DollarSign className="h-3 w-3" />
                          ) : (
                            <Percent className="h-3 w-3" />
                          )}
                        </button>
                        {discountMode[index] === 'amount' ? (
                          <input
                            type="number"
                            value={item.discountAmount || 0}
                            onChange={(e) => {
                              const discountAmount = Math.max(0, parseFloat(e.target.value) || 0);
                              const lineSubtotal = (item.unitPrice || 0) * (item.quantity || 0);
                              const maxDiscount = lineSubtotal;
                              const finalDiscountAmount = Math.min(discountAmount, maxDiscount);
                              const discountPercentage = lineSubtotal > 0 ? (finalDiscountAmount / lineSubtotal) * 100 : 0;
                              onUpdateDiscount(index, discountPercentage, finalDiscountAmount);
                            }}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        ) : (
                          <input
                            type="number"
                            value={item.discountPercentage || 0}
                            onChange={(e) => {
                              const discountPercentage = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                              const lineSubtotal = (item.unitPrice || 0) * (item.quantity || 0);
                              const discountAmount = (lineSubtotal * discountPercentage) / 100;
                              onUpdateDiscount(index, discountPercentage, discountAmount);
                            }}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                          />
                        )}
                        <span className="text-xs text-gray-500">
                          {discountMode[index] === 'amount' ? currencySymbol : '%'}
                        </span>
                      </div>
                      {(item.discountAmount || 0) > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          -{formatCurrency(item.discountAmount || 0)}
                        </span>
                      )}
                    </div>
                    
                    {/* VAT Display and Remove/Add */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      {(item.taxAmount || 0) > 0 ? (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600">VAT:</span>
                            <span className="text-xs font-medium text-gray-700">
                              {item.taxPercentage || 0}% ({formatCurrency(item.taxAmount || 0)})
                            </span>
                          </div>
                          {onRemoveVAT && (
                            <button
                              onClick={() => onRemoveVAT(index)}
                              className="flex items-center space-x-1 px-2 py-0.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Remove VAT"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Remove VAT</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">VAT:</span>
                            <span className="text-xs font-medium text-gray-400">
                              No VAT
                            </span>
                          </div>
                          {onAddVAT && item.originalTaxPercentage && item.originalTaxPercentage > 0 && (
                            <button
                              onClick={() => onAddVAT(index)}
                              className="flex items-center space-x-1 px-2 py-0.5 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                              title="Add VAT back"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Add VAT</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

          {/* Transaction Summary */}
          <div className="bg-gradient-to-r from-white via-gray-50/30 to-white px-6 py-4 border-t border-gray-200/50 shadow-lg backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h2>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({taxPercentage}%)</span>
              <span className="font-medium text-gray-900">{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-base font-semibold text-gray-900">
                Total {currencySymbol && `(${currencySymbol})`}
              </span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          {paidAmount > 0 && (
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Paid Amount{paymentTypeName && ` (${paymentTypeName})`}
                </span>
                <span className="text-base font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
              </div>
              {paidAmount > totalAmount && (
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600">Change</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(paidAmount - totalAmount)}</span>
                </div>
              )}
              {paidAmount < totalAmount && (
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600">Balance</span>
                  <span className="text-sm font-medium text-orange-600">{formatCurrency(totalAmount - paidAmount)}</span>
                </div>
              )}
            </div>
          )}
        </div>
            <button
              onClick={() => {
                if (salesProfile === 'cash' && onPaymentConfirm && paidAmount === 0) {
                  // Show payment modal if no payment has been entered yet
                  setShowPaymentModal(true);
                } else {
                  // Process transaction (either credit sales or cash sales with payment entered)
                  onProcessTransaction();
                }
              }}
              disabled={isProcessing || totalAmount <= 0 || items.length === 0}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all shadow-sm ${
                isProcessing || totalAmount <= 0 || items.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'hover:opacity-90 hover:shadow-md'
              }`}
              style={!(isProcessing || totalAmount <= 0 || items.length === 0) ? { backgroundColor: '#F87B1B' } : {}}
            >
              {isProcessing 
                ? 'Processing...' 
                : (salesProfile === 'cash' && paidAmount > 0) 
                  ? 'Save and Print' 
                  : 'Pay'}
            </button>
      </div>

      {/* Payment Modal for Cash Sales */}
      {salesProfile === 'cash' && onPaymentConfirm && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          totalAmount={totalAmount}
          onConfirm={(paymentTypeId, amount) => {
            setShowPaymentModal(false);
            onPaymentConfirm(paymentTypeId, amount);
          }}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
};

export default OrderDetailsPanel;

