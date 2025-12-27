import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentTypeService } from '../../services/paymentTypeService';
import { PaymentType } from '../../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: (paymentTypeId: string, amount: number) => void;
  currencySymbol?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onConfirm,
  currencySymbol = ''
}) => {
  const [selectedPaymentTypeId, setSelectedPaymentTypeId] = useState<string>('');
  const [amount, setAmount] = useState<string>(totalAmount.toFixed(2));
  const [errors, setErrors] = useState<{ paymentType?: string; amount?: string }>({});
  const prevIsOpenRef = useRef<boolean>(false);

  // Fetch payment types with status='active' and used_in_debtor_payments=true
  const { data: paymentTypesData, isLoading } = useQuery({
    queryKey: ['pos-payment-types-debtor'],
    queryFn: () => paymentTypeService.getPaymentTypes(1, 100, { status: 'active' }),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Filter payment types: active and used_in_debtor_payments = true
  // Note: Invoice payments require used_in_debtor_payments, not used_in_sales
  // Sort by order_of_display (ascending) to show payment types in the configured order
  const paymentTypes = (paymentTypesData?.paymentTypes || [])
    .filter((pt: PaymentType) => pt.is_active && pt.used_in_debtor_payments)
    .sort((a: PaymentType, b: PaymentType) => 
      (a.order_of_display || 999) - (b.order_of_display || 999)
  );

  // Auto-select first payment type when modal opens
  useEffect(() => {
    if (isOpen && paymentTypes.length > 0 && !selectedPaymentTypeId) {
      setSelectedPaymentTypeId(paymentTypes[0].id);
    }
  }, [isOpen, paymentTypes, selectedPaymentTypeId]);

  // Reset amount to total when modal opens (only when isOpen changes from false to true)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal just opened
      setAmount(totalAmount.toFixed(2));
      setErrors({});
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Note: Change calculation automatically updates when totalAmount changes
  // because calculateChange() uses the totalAmount prop directly.
  // The amount field is kept as-is when total changes, allowing user to see
  // the change calculation update in real-time when discounts are applied.

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal point (no commas in input)
    // Also allow partial decimal entries like "123." or ".50"
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: undefined }));
      }
    }
  };

  // Get formatted amount for display
  const getFormattedAmount = (): string => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amount === '' || amount === '.') {
      return '0.00';
    }
    return amountNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calculate change
  const calculateChange = (): number => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return 0;
    }
    return amountNum > totalAmount ? amountNum - totalAmount : 0;
  };

  const change = calculateChange();

  const handleConfirm = () => {
    const newErrors: { paymentType?: string; amount?: string } = {};

    if (!selectedPaymentTypeId) {
      newErrors.paymentType = 'Please select a payment type';
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amountNum > totalAmount * 1.1) {
      // Allow up to 10% overpayment
      newErrors.amount = 'Amount exceeds total by more than 10%';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm(selectedPaymentTypeId, amountNum);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Select Payment</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Total Amount Display */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className="text-2xl font-bold text-blue-600">
              {currencySymbol}{totalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </div>

          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type <span className="text-red-500">*</span>
            </label>
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading payment types...</div>
            ) : paymentTypes.length === 0 ? (
              <div className="text-sm text-red-600">No active payment types available for invoice payments. Please configure payment types with "Used in Debtor Payments" enabled.</div>
            ) : (
              <select
                value={selectedPaymentTypeId}
                onChange={(e) => {
                  setSelectedPaymentTypeId(e.target.value);
                  if (errors.paymentType) {
                    setErrors(prev => ({ ...prev, paymentType: undefined }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.paymentType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Payment Type</option>
                {paymentTypes.map((pt: PaymentType) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
              </select>
            )}
            {errors.paymentType && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentType}</p>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Pay <span className="text-red-500">*</span>
              {amount && amount !== '.' && !isNaN(parseFloat(amount)) && (
                <span className="ml-2 text-gray-500 font-normal">
                  ({getFormattedAmount()})
                </span>
              )}
            </label>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Change Display */}
          {change > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-green-200">
              <div className="text-sm text-gray-600 mb-1">Change</div>
              <div className="text-2xl font-bold text-green-600">
                {currencySymbol}{change.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || paymentTypes.length === 0}
            className="px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed hover:opacity-90"
            style={!(isLoading || paymentTypes.length === 0) ? { backgroundColor: '#F87B1B' } : {}}
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

