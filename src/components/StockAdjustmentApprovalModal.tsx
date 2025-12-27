import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface StockAdjustmentApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockAdjustment: any;
  action: 'approve' | 'reject';
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
}

const StockAdjustmentApprovalModal: React.FC<StockAdjustmentApprovalModalProps> = ({
  isOpen,
  onClose,
  stockAdjustment,
  action,
  onConfirm,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (action === 'reject' && !reason.trim()) {
      return; // Don't allow rejection without reason
    }
    onConfirm(action === 'reject' ? reason : undefined);
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const isApprove = action === 'approve';
  const isReject = action === 'reject';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${isApprove ? 'Approve' : 'Reject'} Stock Adjustment`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className={`flex items-center space-x-3 p-4 rounded-lg ${
          isApprove ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {isApprove ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${
              isApprove ? 'text-green-800' : 'text-red-800'
            }`}>
              {isApprove ? 'Approve Stock Adjustment' : 'Reject Stock Adjustment'}
            </h3>
            <p className={`text-sm ${
              isApprove ? 'text-green-600' : 'text-red-600'
            }`}>
              {isApprove 
                ? 'This will approve the stock adjustment and mark it as approved.'
                : 'This will reject the stock adjustment. Please provide a reason.'
              }
            </p>
          </div>
        </div>

        {/* Adjustment Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Adjustment Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Reference:</span>
              <span className="ml-2 font-mono">{stockAdjustment?.reference_number}</span>
            </div>
            <div>
              <span className="text-gray-500">Store:</span>
              <span className="ml-2">{stockAdjustment?.store_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <span className={`ml-2 font-medium ${
                stockAdjustment?.adjustment_type === 'add' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stockAdjustment?.adjustment_type === 'add' ? 'Stock In' : 'Stock Out'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Items:</span>
              <span className="ml-2">{(stockAdjustment?.total_items || 0).toLocaleString('en-US')}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Value:</span>
              <span className="ml-2 font-medium">
                {stockAdjustment?.total_value 
                  ? `${stockAdjustment.currency_symbol || 'TSh'}${(Number(stockAdjustment.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : 'N/A'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-500">Submitted By:</span>
              <span className="ml-2">{stockAdjustment?.submitted_by_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Products List */}
        {stockAdjustment?.items && stockAdjustment.items.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">Products to be adjusted</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adjusted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockAdjustment.items.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{item.product?.name || 'N/A'}</div>
                          {item.product?.sku && (
                            <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{(item.current_stock || 0).toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${
                          stockAdjustment.adjustment_type === 'add' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stockAdjustment.adjustment_type === 'add' ? '+' : '-'}{(item.adjusted_stock || 0).toLocaleString('en-US')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{(item.new_stock || 0).toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.user_unit_cost ? `${stockAdjustment.currency_symbol || 'TSh'}${(Number(item.user_unit_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {isReject && (
          <div className="space-y-2">
            <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this adjustment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              required
            />
            {!reason.trim() && (
              <p className="text-sm text-red-600">Please provide a reason for rejection.</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isApprove ? "primary" : "danger"}
            onClick={handleConfirm}
            disabled={isLoading || (isReject && !reason.trim())}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{isApprove ? 'Approving...' : 'Rejecting...'}</span>
              </>
            ) : (
              <>
                {isApprove ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{isApprove ? 'Approve Adjustment' : 'Reject Adjustment'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StockAdjustmentApprovalModal;
