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
import { StoreIssue } from '../types';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateTime } from '../utils/formatters';

interface StoreIssueViewProps {
  storeIssue?: StoreIssue | null;
  onClose: () => void;
  onEdit: (storeIssue: StoreIssue) => void;
  onDelete: (storeIssue: StoreIssue) => void;
  onSubmit: (storeIssue: StoreIssue) => void;
  onApprove: (storeIssue: StoreIssue) => void;
  onReject: (storeIssue: StoreIssue) => void;
  onFulfill: (storeIssue: StoreIssue) => void;
  onCancel: (storeIssue: StoreIssue) => void;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  isLoading?: boolean;
}

const StoreIssueView: React.FC<StoreIssueViewProps> = ({
  storeIssue,
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

  if (!storeIssue) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No store issue selected</p>
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

    switch (storeIssue.status) {
      case 'draft':
        if (canEdit) {
          buttons.push(
            <Button
              key="edit"
              variant="outline"
              onClick={() => onEdit(storeIssue)}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Issue
            </Button>
          );
        }
        if (canDelete) {
          buttons.push(
            <Button
              key="delete"
              variant="outline"
              onClick={() => onDelete(storeIssue)}
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
            onClick={() => onSubmit(storeIssue)}
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
              onClick={() => onApprove(storeIssue)}
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
              onClick={() => onReject(storeIssue)}
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
            onClick={() => onCancel(storeIssue)}
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
            onClick={() => onFulfill(storeIssue)}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Package className="h-4 w-4 mr-2" />
            Fulfill Issue
          </Button>
        );
        buttons.push(
          <Button
            key="cancel"
            variant="outline"
            onClick={() => onCancel(storeIssue)}
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
            onClick={() => onSubmit(storeIssue)}
            disabled={isLoading}
          >
            <Truck className="h-4 w-4 mr-2" />
            Resubmit
          </Button>
        );
        break;

      case 'fulfilled':
        // No actions available for fulfilled issues
        break;

      case 'cancelled':
        // No actions available for cancelled issues
        break;
    }

    return buttons;
  };

  // Calculate totals
  const totalItems = storeIssue.storeRequestItems?.length || 0;
  const totalValue = storeIssue.storeRequestItems?.reduce((sum, item) => {
    return sum + ((item.requested_quantity || 0) * (item.unit_cost || 0));
  }, 0) || 0;

  const currencySymbol = storeIssue.storeRequestCurrency?.symbol || 'TSh';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Package className="h-6 w-6 text-pink-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Store Issue #{storeIssue.reference_number}
            </h2>
            <p className="text-sm text-gray-600">
              Created on {formatDate(storeIssue.request_date)}
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
          {getStatusBadge(storeIssue.status)}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Priority:</span>
          {getPriorityBadge(storeIssue.priority)}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Type:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Issue
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
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Items ({totalItems})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-pink-500 text-pink-600'
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
                  {storeIssue.reference_number}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Issue Date</label>
                <p className="text-sm text-gray-900">{formatDate(storeIssue.request_date)}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Issue To Store</label>
                <div className="flex items-center space-x-2">
                  <StoreIcon className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{storeIssue.requestingStore?.name || 'Unknown Store'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Issue From Store</label>
                <div className="flex items-center space-x-2">
                  <StoreIcon className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{storeIssue.issuingStore?.name || 'Unknown Store'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                {getPriorityBadge(storeIssue.priority)}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Expected Delivery Date</label>
                <p className="text-sm text-gray-900">
                  {storeIssue.expected_delivery_date ? formatDate(storeIssue.expected_delivery_date) : 'Not set'}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Currency</label>
                <p className="text-sm text-gray-900">
                  {storeIssue.storeRequestCurrency?.code || 'TZS'} ({storeIssue.storeRequestCurrency?.symbol || 'TSh'})
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Exchange Rate</label>
                <p className="text-sm text-gray-900 font-mono">
                  {(Number(storeIssue.exchange_rate) || 1).toFixed(4)}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Total Value</label>
                <p className="text-sm text-gray-900 font-medium">
                  {currencySymbol}{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            {storeIssue.notes && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                  {storeIssue.notes}
                </p>
              </div>
            )}
          </div>

          {/* Workflow Information */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Information</h3>
            
            <div className="space-y-4">
              {storeIssue.createdByUser && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created By</p>
                    <p className="text-sm text-gray-600">
                      {storeIssue.createdByUser.first_name} {storeIssue.createdByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeIssue.createdAt ? formatDateTime(storeIssue.createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              
              {storeIssue.submittedByUser && (
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Submitted By</p>
                    <p className="text-sm text-gray-600">
                      {storeIssue.submittedByUser.first_name} {storeIssue.submittedByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeIssue.submitted_at ? formatDateTime(storeIssue.submitted_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              
              {storeIssue.approvedByUser && (
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approved By</p>
                    <p className="text-sm text-gray-600">
                      {storeIssue.approvedByUser.first_name} {storeIssue.approvedByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeIssue.approved_at ? formatDateTime(storeIssue.approved_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              
              {storeIssue.rejectedByUser && (
                <div className="flex items-center space-x-3">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Rejected By</p>
                    <p className="text-sm text-gray-600">
                      {storeIssue.rejectedByUser.first_name} {storeIssue.rejectedByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeIssue.rejected_at ? formatDateTime(storeIssue.rejected_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
              
              {storeIssue.fulfilledByUser && (
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fulfilled By</p>
                    <p className="text-sm text-gray-600">
                      {storeIssue.fulfilledByUser.first_name} {storeIssue.fulfilledByUser.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {storeIssue.fulfilled_at ? formatDateTime(storeIssue.fulfilled_at) : 'N/A'}
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
            <h3 className="text-lg font-medium text-gray-900">Issue Items</h3>
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
                {storeIssue.storeRequestItems?.map((item, index) => {
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issue History</h3>
          <div className="space-y-4">
            {/* Created */}
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Issue Created</p>
                <p className="text-sm text-gray-600">
                  by {storeIssue.createdByUser?.first_name} {storeIssue.createdByUser?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(storeIssue.createdAt || '')}
                </p>
              </div>
            </div>

            {/* Submitted */}
            {storeIssue.submitted_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <ArrowRight className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Issue Submitted</p>
                  <p className="text-sm text-gray-600">
                    by {storeIssue.submittedByUser?.first_name} {storeIssue.submittedByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeIssue.submitted_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Approved */}
            {storeIssue.approved_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Issue Approved</p>
                  <p className="text-sm text-gray-600">
                    by {storeIssue.approvedByUser?.first_name} {storeIssue.approvedByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeIssue.approved_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Rejected */}
            {storeIssue.rejected_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Issue Rejected</p>
                  <p className="text-sm text-gray-600">
                    by {storeIssue.rejectedByUser?.first_name} {storeIssue.rejectedByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeIssue.rejected_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Fulfilled */}
            {storeIssue.fulfilled_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Issue Fulfilled</p>
                  <p className="text-sm text-gray-600">
                    by {storeIssue.fulfilledByUser?.first_name} {storeIssue.fulfilledByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeIssue.fulfilled_at)}
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

export default StoreIssueView;
