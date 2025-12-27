import React, { useState } from 'react';
import {
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Package,
  Store as StoreIcon,
  User,
  Truck,
  ArrowRight
} from 'lucide-react';
import { StoreReceipt } from '../types';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateTime } from '../utils/formatters';

interface StoreReceiptViewProps {
  storeReceipt?: StoreReceipt | null;
  onClose: () => void;
  onEdit: (storeReceipt: StoreReceipt) => void;
  onDelete: (storeReceipt: StoreReceipt) => void;
  onSubmit: (storeReceipt: StoreReceipt) => void;
  onApprove: (storeReceipt: StoreReceipt) => void;
  onReject: (storeReceipt: StoreReceipt) => void;
  onFulfill: (storeReceipt: StoreReceipt) => void;
  onCancel: (storeReceipt: StoreReceipt) => void;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  isLoading?: boolean;
}

const StoreReceiptView: React.FC<StoreReceiptViewProps> = ({
  storeReceipt,
  onClose,
  onEdit,
  onDelete,
  onSubmit,
  onApprove,
  onReject,
  onFulfill,
  onCancel,
  canEdit,
  canDelete,
  canApprove,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'history'>('details');

  if (!storeReceipt) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No store receipt selected</p>
        </div>
      </div>
    );
  }

  // Status badge configuration
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'default' as const },
      submitted: { variant: 'info' as const },
      approved: { variant: 'success' as const },
      rejected: { variant: 'error' as const },
      fulfilled: { variant: 'success' as const },
      cancelled: { variant: 'warning' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <StatusBadge status={status} variant={config.variant} />;
  };

  // Priority badge configuration
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: 'default' as const },
      medium: { variant: 'info' as const },
      high: { variant: 'warning' as const },
      urgent: { variant: 'error' as const }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <StatusBadge status={priority} variant={config.variant} />;
  };

  // Get action buttons based on status
  const getActionButtons = () => {
    const buttons = [];

    switch (storeReceipt.status) {
      case 'draft':
        if (canEdit) {
          buttons.push(
            <Button
              key="edit"
              variant="outline"
              onClick={() => onEdit(storeReceipt)}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Receipt
            </Button>
          );
        }
        if (canDelete) {
          buttons.push(
            <Button
              key="delete"
              variant="outline"
              onClick={() => onDelete(storeReceipt)}
              disabled={isLoading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          );
        }
        buttons.push(
          <Button
            key="submit"
            onClick={() => onSubmit(storeReceipt)}
            disabled={isLoading}
          >
            <Truck className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
        );
        break;

      case 'submitted':
        if (canApprove) {
          buttons.push(
            <Button
              key="approve"
              onClick={() => onApprove(storeReceipt)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          );
          buttons.push(
            <Button
              key="reject"
              variant="outline"
              onClick={() => onReject(storeReceipt)}
              disabled={isLoading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          );
        }
        buttons.push(
          <Button
            key="cancel"
            variant="outline"
            onClick={() => onCancel(storeReceipt)}
            disabled={isLoading}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        );
        break;

      case 'approved':
        buttons.push(
          <Button
            key="fulfill"
            onClick={() => onFulfill(storeReceipt)}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Package className="h-4 w-4 mr-2" />
            Fulfill Receipt
          </Button>
        );
        buttons.push(
          <Button
            key="cancel"
            variant="outline"
            onClick={() => onCancel(storeReceipt)}
            disabled={isLoading}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        );
        break;

      case 'rejected':
        buttons.push(
          <Button
            key="resubmit"
            onClick={() => onSubmit(storeReceipt)}
            disabled={isLoading}
          >
            <Truck className="h-4 w-4 mr-2" />
            Resubmit
          </Button>
        );
        break;

      case 'fulfilled':
        // No actions available for fulfilled receipts
        break;

      case 'cancelled':
        // No actions available for cancelled receipts
        break;
    }

    return buttons;
  };

  // Calculate totals
  const totalItems = storeReceipt.storeRequestItems?.length || 0;
  const totalValue = storeReceipt.storeRequestItems?.reduce((sum, item) => {
    return sum + ((item.requested_quantity || 0) * (item.unit_cost || 0));
  }, 0) || 0;

  const currencySymbol = storeReceipt.storeRequestCurrency?.symbol || 'TSh';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Store Receipt #{storeReceipt.reference_number}
            </h2>
            <p className="text-sm text-gray-600">
              Created on {formatDate(storeReceipt.request_date)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getActionButtons()}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Status and Priority */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          {getStatusBadge(storeReceipt.status)}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Priority:</span>
          {getPriorityBadge(storeReceipt.priority)}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Type:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Receipt
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Items ({totalItems})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Reference Number</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded">
                  {storeReceipt.reference_number}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Receipt Date</label>
                <p className="text-sm text-gray-900">{formatDate(storeReceipt.request_date)}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Receive To Store</label>
                <div className="flex items-center space-x-2">
                  <StoreIcon className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{storeReceipt.requestingStore?.name || 'Unknown Store'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Receive From Store</label>
                <div className="flex items-center space-x-2">
                  <StoreIcon className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{storeReceipt.issuingStore?.name || 'Unknown Store'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                {getPriorityBadge(storeReceipt.priority)}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Expected Delivery Date</label>
                <p className="text-sm text-gray-900">
                  {storeReceipt.expected_delivery_date ? formatDate(storeReceipt.expected_delivery_date) : 'Not set'}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Currency</label>
                <p className="text-sm text-gray-900">
                  {storeReceipt.storeRequestCurrency?.code || 'TZS'} ({storeReceipt.storeRequestCurrency?.symbol || 'TSh'})
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Exchange Rate</label>
                <p className="text-sm text-gray-900 font-mono">
                  {(Number(storeReceipt.exchange_rate) || 1).toFixed(4)}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Total Value</label>
                <p className="text-sm text-gray-900 font-medium">
                  {currencySymbol}{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            {storeReceipt.notes && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                  {storeReceipt.notes}
                </p>
              </div>
            )}
          </div>

          {/* Workflow Information */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Information</h3>
            
            <div className="space-y-4">
              {storeReceipt.createdByUser && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created By</p>
                    <p className="text-sm text-gray-600">
                      {storeReceipt.createdByUser.first_name} {storeReceipt.createdByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeReceipt.createdAt ? formatDateTime(storeReceipt.createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              
              {storeReceipt.submittedByUser && (
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submitted By</p>
                    <p className="text-sm text-gray-600">
                      {storeReceipt.submittedByUser.first_name} {storeReceipt.submittedByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeReceipt.submitted_at ? formatDateTime(storeReceipt.submitted_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              
              {storeReceipt.approvedByUser && (
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approved By</p>
                    <p className="text-sm text-gray-600">
                      {storeReceipt.approvedByUser.first_name} {storeReceipt.approvedByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeReceipt.approved_at ? formatDateTime(storeReceipt.approved_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              
              {storeReceipt.rejectedByUser && (
                <div className="flex items-center space-x-3">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Rejected By</p>
                    <p className="text-sm text-gray-600">
                      {storeReceipt.rejectedByUser.first_name} {storeReceipt.rejectedByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeReceipt.rejected_at ? formatDateTime(storeReceipt.rejected_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              
              {storeReceipt.fulfilledByUser && (
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fulfilled By</p>
                    <p className="text-sm text-gray-600">
                      {storeReceipt.fulfilledByUser.first_name} {storeReceipt.fulfilledByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeReceipt.fulfilled_at ? formatDateTime(storeReceipt.fulfilled_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Receipt Items</h3>
            <p className="text-sm text-gray-600 mt-1">
              {totalItems} items • Total Value: {currencySymbol}{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {storeReceipt.storeRequestItems?.map((item, index) => {
                  const totalCost = (item.requested_quantity || 0) * (item.unit_cost || 0);
                  
                  return (
                    <tr key={item.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.storeRequestProduct?.name || 'Unknown Product'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.storeRequestProduct?.part_number || ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {(item.requested_quantity || 0).toLocaleString('en-US')}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {currencySymbol}{(item.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          {currencySymbol}{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status || 'pending'} variant="default" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {totalItems.toLocaleString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">-</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {currencySymbol}{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Receipt History</h3>
          <div className="space-y-4">
            {/* Created */}
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Receipt Created</p>
                <p className="text-sm text-gray-600">
                  by {storeReceipt.createdByUser?.first_name} {storeReceipt.createdByUser?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(storeReceipt.createdAt || '')}
                </p>
              </div>
            </div>

            {/* Submitted */}
            {storeReceipt.submitted_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <ArrowRight className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Receipt Submitted</p>
                  <p className="text-sm text-gray-600">
                    by {storeReceipt.submittedByUser?.first_name} {storeReceipt.submittedByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeReceipt.submitted_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Approved */}
            {storeReceipt.approved_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Receipt Approved</p>
                  <p className="text-sm text-gray-600">
                    by {storeReceipt.approvedByUser?.first_name} {storeReceipt.approvedByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeReceipt.approved_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Rejected */}
            {storeReceipt.rejected_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Receipt Rejected</p>
                  <p className="text-sm text-gray-600">
                    by {storeReceipt.rejectedByUser?.first_name} {storeReceipt.rejectedByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeReceipt.rejected_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Fulfilled */}
            {storeReceipt.fulfilled_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Receipt Fulfilled</p>
                  <p className="text-sm text-gray-600">
                    by {storeReceipt.fulfilledByUser?.first_name} {storeReceipt.fulfilledByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeReceipt.fulfilled_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreReceiptView;
