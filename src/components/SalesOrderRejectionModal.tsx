import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Textarea from './Textarea';
import { SalesOrder } from '../types';

interface SalesOrderRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrder: SalesOrder | null;
  onConfirm: (rejectionReason: string) => void;
  isLoading?: boolean;
}

const SalesOrderRejectionModal: React.FC<SalesOrderRejectionModalProps> = ({
  isOpen,
  onClose,
  salesOrder,
  onConfirm,
  isLoading = false
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleConfirm = () => {
    if (!rejectionReason.trim()) {
      return; // Don't allow rejection without reason
    }
    onConfirm(rejectionReason.trim());
    setRejectionReason(''); // Reset on confirm
  };

  const handleClose = () => {
    setRejectionReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reject Proforma Invoice"
      size="md"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <XCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">
              Reject Proforma Invoice
            </h3>
            <p className="text-sm text-red-600">
              This will reject the proforma invoice. Please provide a reason.
            </p>
          </div>
        </div>

        {/* Invoice Details */}
        {salesOrder && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Invoice Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Reference:</span>
                <span className="ml-2 font-medium">{salesOrder.salesOrderRefNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-medium">{salesOrder.customerName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">{salesOrder.salesOrderDate}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Amount:</span>
                <span className="ml-2 font-medium">
                  {salesOrder.currencySymbol || ''}{salesOrder.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            rows={4}
            required
            className={!rejectionReason.trim() ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          />
          {!rejectionReason.trim() && (
            <p className="text-sm text-red-600">Rejection reason is required</p>
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
            disabled={isLoading || !rejectionReason.trim()}
            loading={isLoading}
          >
            Reject Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SalesOrderRejectionModal;

