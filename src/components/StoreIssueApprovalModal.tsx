import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Package, Edit3, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import { StoreIssue, StoreRequestItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface StoreIssueApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeIssue: StoreIssue | null;
  action: 'approve' | 'reject' | null;
  onConfirm: (approvalData?: any) => void;
  isLoading?: boolean;
}

const StoreIssueApprovalModal: React.FC<StoreIssueApprovalModalProps> = ({
  isOpen,
  onClose,
  storeIssue,
  action,
  onConfirm,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvedItems, setApprovedItems] = useState<Array<{
    item_id: string;
    approved_quantity: number;
    original_quantity: number;
  }>>([]);

  // Initialize approved items when modal opens
  useEffect(() => {
    if (isOpen && storeIssue?.storeRequestItems) {
      const initialItems = storeIssue.storeRequestItems.map(item => ({
        item_id: item.id,
        approved_quantity: parseFloat(String(item.requested_quantity || '0')),
        original_quantity: parseFloat(String(item.requested_quantity || '0'))
      }));
      setApprovedItems(initialItems);
    }
  }, [isOpen, storeIssue]);

  const handleConfirm = () => {
    if (action === 'reject' && !reason.trim()) {
      return; // Don't allow rejection without reason
    }
    
    if (action === 'approve') {
      const approvalData = {
        approval_notes: approvalNotes,
        approved_items: approvedItems.map(item => ({
          item_id: item.item_id,
          approved_quantity: item.approved_quantity
        }))
      };
      onConfirm(approvalData);
    } else {
      onConfirm(reason);
    }
  };

  const handleClose = () => {
    setReason('');
    setApprovalNotes('');
    setApprovedItems([]);
    onClose();
  };

  const updateApprovedQuantity = (itemId: string, quantity: number) => {
    setApprovedItems(prev => prev.map(item => 
      item.item_id === itemId 
        ? { ...item, approved_quantity: Math.max(0, quantity) }
        : item
    ));
  };

  const isApprove = action === 'approve';
  const isReject = action === 'reject';

  if (!storeIssue || !action) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${isApprove ? 'Approve' : 'Reject'} Store Issue`}
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
            <h3 className={`text-lg font-medium ${
              isApprove ? 'text-green-900' : 'text-red-900'
            }`}>
              {isApprove ? 'Approve Store Issue' : 'Reject Store Issue'}
            </h3>
            <p className={`text-sm ${
              isApprove ? 'text-green-700' : 'text-red-700'
            }`}>
              {isApprove 
                ? 'Review and approve the store issue with any quantity adjustments'
                : 'Provide a reason for rejecting this store issue'
              }
            </p>
          </div>
        </div>

        {/* Issue Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Issue Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Reference:</span>
              <span className="ml-2 font-mono">{storeIssue.reference_number}</span>
            </div>
            <div>
              <span className="text-gray-600">Issue Date:</span>
              <span className="ml-2">{new Date(storeIssue.request_date).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Issue To:</span>
              <span className="ml-2">{storeIssue.requestingStore?.name || 'Unknown Store'}</span>
            </div>
            <div>
              <span className="text-gray-600">Issue From:</span>
              <span className="ml-2">{storeIssue.issuingStore?.name || 'Unknown Store'}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Items:</span>
              <span className="ml-2">{storeIssue.total_items || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Value:</span>
              <span className="ml-2">
                {(() => {
                  const currencySymbol = storeIssue.storeRequestCurrency?.symbol || 'TSh';
                  return `${currencySymbol}${(Number(storeIssue.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        {isApprove && storeIssue.storeRequestItems && storeIssue.storeRequestItems.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Items to Approve</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requested Qty</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Approved Qty</th>
                    <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {storeIssue.storeRequestItems.map((item, index) => {
                    const approvedItem = approvedItems.find(ai => ai.item_id === item.id);
                    const approvedQuantity = approvedItem?.approved_quantity || 0;
                    const totalCost = approvedQuantity * (item.unit_cost || 0);
                    const currencySymbol = storeIssue.storeRequestCurrency?.symbol || 'TSh';
                    
                    return (
                      <tr key={item.id || index}>
                        <td className="border border-gray-200 px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.storeRequestProduct?.name || 'Unknown Product'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {item.storeRequestProduct?.part_number || ''}
                            </p>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          <span className="text-sm text-gray-900">
                            {(item.requested_quantity || 0).toLocaleString('en-US')}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          <span className="text-sm text-gray-900">
                            {currencySymbol}{(item.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            value={approvedQuantity}
                            onChange={(e) => updateApprovedQuantity(item.id, parseFloat(e.target.value) || 0)}
                            className="w-20 text-sm"
                            placeholder="0"
                          />
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          <span className="text-sm font-medium text-gray-900">
                            {currencySymbol}{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">Total</td>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">
                      {(storeIssue.storeRequestItems?.reduce((sum, item) => sum + (item.requested_quantity || 0), 0) || 0).toLocaleString('en-US')}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">-</td>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">
                      {approvedItems.reduce((sum, item) => sum + item.approved_quantity, 0).toLocaleString('en-US')}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">
                      {(() => {
                        const currencySymbol = storeIssue.storeRequestCurrency?.symbol || 'TSh';
                        const totalApprovedCost = approvedItems.reduce((sum, approvedItem) => {
                          const item = storeIssue.storeRequestItems?.find(i => i.id === approvedItem.item_id);
                          return sum + (approvedItem.approved_quantity * (item?.unit_cost || 0));
                        }, 0);
                        return `${currencySymbol}${totalApprovedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Notes/Reason Input */}
        <div>
          {isApprove ? (
            <Textarea
              label="Approval Notes (Optional)"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any notes about this approval..."
              rows={3}
            />
          ) : (
            <Textarea
              label="Rejection Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this store issue..."
              rows={3}
              required
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (isReject && !reason.trim())}
            className={isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isApprove ? 'Approving...' : 'Rejecting...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {isApprove ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{isApprove ? 'Approve Issue' : 'Reject Issue'}</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StoreIssueApprovalModal;
