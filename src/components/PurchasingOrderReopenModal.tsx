import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { PurchasingOrder } from '../types';

interface PurchasingOrderReopenModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchasingOrder: PurchasingOrder | null;
  onConfirm: (validUntil: string) => void;
  isLoading?: boolean;
}

const PurchasingOrderReopenModal: React.FC<PurchasingOrderReopenModalProps> = ({
  isOpen,
  onClose,
  purchasingOrder,
  onConfirm,
  isLoading = false
}) => {
  const [validUntil, setValidUntil] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && purchasingOrder) {
      // Set minimum date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const minDate = tomorrow.toISOString().split('T')[0];
      setValidUntil(minDate);
      setError('');
    }
  }, [isOpen, purchasingOrder]);

  const handleConfirm = () => {
    if (!validUntil || !validUntil.trim()) {
      setError('Valid until date is required');
      return;
    }

    const selectedDate = new Date(validUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setError('Valid until date must be in the future');
      return;
    }

    onConfirm(validUntil);
    setValidUntil('');
    setError('');
  };

  const handleClose = () => {
    setValidUntil('');
    setError('');
    onClose();
  };

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reopen Purchasing Order"
      size="md"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <RefreshCw className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800">
              Reopen Expired Order
            </h3>
            <p className="text-sm text-blue-600">
              Update the valid until date to reopen this expired purchasing order as a draft.
            </p>
          </div>
        </div>

        {/* Order Details */}
        {purchasingOrder && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Order Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Reference:</span>
                <span className="ml-2 font-medium">{purchasingOrder.purchasingOrderRefNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Vendor:</span>
                <span className="ml-2 font-medium">{purchasingOrder.vendorName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">{purchasingOrder.purchasingOrderDate}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Valid Until:</span>
                <span className="ml-2 font-medium text-red-600">
                  {purchasingOrder.validUntil || 'Not set'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Valid Until Date Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            New Valid Until Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={validUntil}
            onChange={(e) => {
              setValidUntil(e.target.value);
              setError('');
            }}
            min={minDate}
            required
            className={error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <p className="text-xs text-gray-500">
            The valid until date must be in the future. The order will be reopened as a draft.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading || !validUntil}
            loading={isLoading}
          >
            Reopen Order
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PurchasingOrderReopenModal;
