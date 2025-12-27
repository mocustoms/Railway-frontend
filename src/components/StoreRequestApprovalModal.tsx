import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Package, Edit3, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import { StoreRequest, StoreRequestItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface StoreRequestApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeRequest: StoreRequest;
  action: 'approve' | 'reject';
  onConfirm: (approvalData?: any) => void;
  isLoading?: boolean;
}

const StoreRequestApprovalModal: React.FC<StoreRequestApprovalModalProps> = ({
  isOpen,
  onClose,
  storeRequest,
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
    if (isOpen && storeRequest?.storeRequestItems) {
      const initialItems = storeRequest.storeRequestItems.map(item => ({
        item_id: item.id,
        approved_quantity: parseFloat(String(item.requested_quantity || '0')),
        original_quantity: parseFloat(String(item.requested_quantity || '0'))
      }));
      setApprovedItems(initialItems);
    }
  }, [isOpen, storeRequest]);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${isApprove ? 'Approve' : 'Reject'} Store Request`}
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
              {isApprove ? 'Approve Store Request' : 'Reject Store Request'}
            </h3>
            <p className={`text-sm ${
              isApprove ? 'text-green-600' : 'text-red-600'
            }`}>
              {isApprove 
                ? 'Review and adjust quantities before approving this store request.'
                : 'This will reject the store request. Please provide a reason.'
              }
            </p>
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Request Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Reference:</span>
              <span className="ml-2 font-medium">{storeRequest.reference_number}</span>
            </div>
            <div>
              <span className="text-gray-600">Request Date:</span>
              <span className="ml-2 font-medium">{storeRequest.request_date}</span>
            </div>
            <div>
              <span className="text-gray-600">From Store:</span>
              <span className="ml-2 font-medium">{storeRequest.requestingStore?.name}</span>
            </div>
            <div>
              <span className="text-gray-600">To Store:</span>
              <span className="ml-2 font-medium">{storeRequest.issuingStore?.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Items:</span>
              <span className="ml-2 font-medium">{(storeRequest.storeRequestItems?.length || 0).toLocaleString('en-US')}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Value:</span>
              <span className="ml-2 font-medium">
                {(() => {
                  const currencySymbol = storeRequest.storeRequestCurrency?.symbol || 'TSh';
                  const totalValue = approvedItems.reduce((sum, item) => {
                    const unitCost = parseFloat(String(storeRequest.storeRequestItems?.find(i => i.id === item.item_id)?.unit_cost || '0'));
                    return sum + (item.approved_quantity * unitCost);
                  }, 0);
                  return `${currencySymbol}${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Items Section */}
        {isApprove && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Adjust Quantities</h4>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600">You can modify the approved quantities</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {storeRequest.storeRequestItems?.map((item) => {
                    const approvedItem = approvedItems.find(ai => ai.item_id === item.id);
                    const approvedQuantity = approvedItem?.approved_quantity || 0;
                    const originalQuantity = approvedItem?.original_quantity || 0;
                    const unitCost = parseFloat(String(item.unit_cost || '0'));
                    const totalCost = approvedQuantity * unitCost;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.storeRequestProduct?.name || 'Unknown Product'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.storeRequestProduct?.part_number || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {originalQuantity.toLocaleString('en-US')}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={approvedQuantity}
                              onChange={(e) => updateApprovedQuantity(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20 text-sm"
                              placeholder="0"
                            />
                            {approvedQuantity !== originalQuantity && (
                              <Edit3 className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {(() => {
                            const currencySymbol = storeRequest.storeRequestCurrency?.symbol || 'TSh';
                            return `${currencySymbol}${unitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          })()}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {(() => {
                            const currencySymbol = storeRequest.storeRequestCurrency?.symbol || 'TSh';
                            return `${currencySymbol}${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {isApprove ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
          </label>
          {isApprove ? (
            <Textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any notes about this approval..."
              rows={3}
            />
          ) : (
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={3}
              required
            />
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
            variant={isApprove ? "primary" : "danger"}
            onClick={handleConfirm}
            disabled={isLoading || (isReject && !reason.trim())}
            loading={isLoading}
          >
            {isApprove ? 'Approve Request' : 'Reject Request'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StoreRequestApprovalModal;
