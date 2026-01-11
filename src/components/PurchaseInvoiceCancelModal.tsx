import React, { useState } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Textarea from './Textarea';
import { PurchaseInvoice } from '../types';

interface PurchaseInvoiceCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseInvoice: PurchaseInvoice | null;
  onConfirm: (cancellationReason: string) => void;
  isLoading?: boolean;
}

const PurchaseInvoiceCancelModal: React.FC<PurchaseInvoiceCancelModalProps> = ({
  isOpen,
  onClose,
  purchaseInvoice,
  onConfirm,
  isLoading = false
}) => {
  const [cancellationReason, setCancellationReason] = useState('');

  const handleConfirm = () => {
    if (!cancellationReason.trim()) {
      return; // Don't allow cancellation without reason
    }
    onConfirm(cancellationReason.trim());
    setCancellationReason(''); // Reset on confirm
  };

  const handleClose = () => {
    setCancellationReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cancel Purchase Invoice"
      size="md"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
          <X className="h-6 w-6 text-orange-600" />
          <div>
            <h3 className="text-lg font-semibold text-orange-800">
              Cancel Purchase Invoice
            </h3>
            <p className="text-sm text-orange-600">
              This will cancel the purchase invoice. Please provide a reason for cancellation.
            </p>
          </div>
        </div>

        {/* Invoice Details */}
        {purchaseInvoice && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Invoice Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Reference:</span>
                <span className="ml-2 font-medium">{purchaseInvoice.invoiceRefNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Vendor:</span>
                <span className="ml-2 font-medium">{purchaseInvoice.vendorName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">{purchaseInvoice.invoiceDate}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Amount:</span>
                <span className="ml-2 font-medium">
                  {purchaseInvoice.currencySymbol || ''}{purchaseInvoice.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{purchaseInvoice.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Balance:</span>
                <span className="ml-2 font-medium">
                  {purchaseInvoice.currencySymbol || ''}{purchaseInvoice.balanceAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Reason Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Please provide a reason for cancellation..."
            rows={4}
            required
            className={!cancellationReason.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          />
          {!cancellationReason.trim() && (
            <p className="text-sm text-red-600">Cancellation reason is required</p>
          )}
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
            variant="danger"
            onClick={handleConfirm}
            disabled={isLoading || !cancellationReason.trim()}
            loading={isLoading}
          >
            Cancel Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseInvoiceCancelModal;
