import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentTypeService } from '../../services/paymentTypeService';
import { CreditCard, DollarSign, Wallet, Loader2 } from 'lucide-react';

interface POSPaymentProps {
  totalAmount: number;
  currencySymbol?: string;
  onProcessPayment: (paymentData: {
    paymentAmount: number;
    paymentTypeId?: string;
    currencyId?: string;
    exchangeRate?: number;
  }) => Promise<void>;
  isLoading?: boolean;
  paymentButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

const POSPayment: React.FC<POSPaymentProps> = ({
  totalAmount,
  currencySymbol = '',
  onProcessPayment,
  isLoading = false,
  paymentButtonRef
}) => {
  const [selectedPaymentTypeId, setSelectedPaymentTypeId] = useState<string>('');

  // Fetch active payment types that are allowed for debtor payments (invoice payments)
  const { data: paymentTypesData } = useQuery({
    queryKey: ['pos-payment-types-debtor'],
    queryFn: () => paymentTypeService.getPaymentTypes(1, 100, { status: 'active' }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Filter payment types: active and used_in_debtor_payments = true
  // Note: Invoice payments require used_in_debtor_payments, not used_in_sales
  // Sort by order_of_display (ascending) to show payment types in the configured order
  const paymentTypes = (paymentTypesData?.paymentTypes || [])
    .filter((pt) => pt.is_active && pt.used_in_debtor_payments)
    .sort((a, b) => (a.order_of_display || 999) - (b.order_of_display || 999));
  
  // Auto-select first payment type (usually cash) if available
  React.useEffect(() => {
    if (paymentTypes.length > 0 && !selectedPaymentTypeId) {
      // Try to find cash payment type first
      const cashType = paymentTypes.find(pt => 
        pt.name?.toLowerCase().includes('cash') || 
        pt.code?.toLowerCase().includes('cash')
      );
      setSelectedPaymentTypeId(cashType?.id || paymentTypes[0].id);
    }
  }, [paymentTypes, selectedPaymentTypeId]);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentTypeId && paymentTypes.length > 0) {
      // Use first payment type if none selected
      setSelectedPaymentTypeId(paymentTypes[0].id);
    }
    
    await onProcessPayment({
      paymentAmount: totalAmount,
      paymentTypeId: selectedPaymentTypeId || paymentTypes[0]?.id
    });
  };

  return (
    <div className="space-y-4">
      {/* Total Amount Display */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        {paymentTypes.length === 0 ? (
          <div className="text-sm text-gray-500 p-2">Loading payment methods...</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {paymentTypes.slice(0, 4).map((paymentType) => (
              <button
                key={paymentType.id}
                onClick={() => setSelectedPaymentTypeId(paymentType.id)}
                className={`p-3 border-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                  selectedPaymentTypeId === paymentType.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {paymentType.name?.toLowerCase().includes('cash') ? (
                  <DollarSign className="h-5 w-5" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
                <span className="font-medium text-sm">{paymentType.name || paymentType.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Process Payment Button */}
      <button
        ref={paymentButtonRef}
        onClick={handleProcessPayment}
        disabled={isLoading || totalAmount <= 0}
        className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
          isLoading || totalAmount <= 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Process Payment</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default POSPayment;

