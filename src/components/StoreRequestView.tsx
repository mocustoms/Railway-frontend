import React, { useState } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Store as StoreIcon,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  Truck,
  ArrowRight,
  Download
} from 'lucide-react';
import { StoreRequest } from '../types';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';

interface StoreRequestViewProps {
  storeRequest?: StoreRequest | null;
  onClose: () => void;
  onEdit: (storeRequest: StoreRequest) => void;
  onDelete: (storeRequest: StoreRequest) => void;
  onSubmit: (storeRequest: StoreRequest) => void;
  onApprove: (storeRequest: StoreRequest) => void;
  onReject: (storeRequest: StoreRequest) => void;
  onFulfill: (storeRequest: StoreRequest) => void;
  onCancel: (storeRequest: StoreRequest) => void;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  isLoading: boolean;
}

const StoreRequestView: React.FC<StoreRequestViewProps> = ({
  storeRequest,
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
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'history'>('details');

  if (!storeRequest) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No store request selected</p>
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

    switch (storeRequest.status) {
      case 'draft':
        if (canEdit) {
          buttons.push(
            <Button
              key="edit"
              variant="secondary"
              onClick={() => onEdit(storeRequest)}
              disabled={isLoading}
            >
              <Edit size={16} className="mr-2" />
              Edit
            </Button>
          );
        }
        buttons.push(
          <Button
            key="submit"
            onClick={() => onSubmit(storeRequest)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRight size={16} className="mr-2" />
            Submit for Approval
          </Button>
        );
        break;

      case 'submitted':
        if (canApprove) {
          buttons.push(
            <Button
              key="approve"
              onClick={() => onApprove(storeRequest)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={16} className="mr-2" />
              Approve
            </Button>
          );
          buttons.push(
            <Button
              key="reject"
              variant="secondary"
              onClick={() => onReject(storeRequest)}
              disabled={isLoading}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <XCircle size={16} className="mr-2" />
              Reject
            </Button>
          );
        }
        buttons.push(
          <Button
            key="cancel"
            variant="secondary"
            onClick={() => onCancel(storeRequest)}
            disabled={isLoading}
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <AlertTriangle size={16} className="mr-2" />
            Cancel
          </Button>
        );
        break;

      case 'approved':
        buttons.push(
          <Button
            key="fulfill"
            onClick={() => onFulfill(storeRequest)}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Package size={16} className="mr-2" />
            Mark as Fulfilled
          </Button>
        );
        buttons.push(
          <Button
            key="cancel"
            variant="secondary"
            onClick={() => onCancel(storeRequest)}
            disabled={isLoading}
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <AlertTriangle size={16} className="mr-2" />
            Cancel
          </Button>
        );
        break;

      case 'fulfilled':
        buttons.push(
          <Button
            key="download"
            variant="secondary"
            onClick={() => {/* TODO: Implement download */}}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Download size={16} className="mr-2" />
            Download Report
          </Button>
        );
        break;
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {storeRequest.reference_number}
            </h3>
            <p className="text-sm text-gray-600">
              Store Request Details
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(storeRequest.status)}
          {getPriorityBadge(storeRequest.priority)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getActionButtons()}
        </div>
        <div className="flex items-center space-x-2">
          {canDelete && storeRequest.status === 'draft' && (
            <Button
              variant="secondary"
              onClick={() => onDelete(storeRequest)}
              disabled={isLoading}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'details', label: 'Details', icon: Eye },
            { id: 'items', label: 'Items', icon: Package },
            { id: 'history', label: 'History', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Request Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Request Date</p>
                    <p className="text-sm text-gray-600">{formatDate(storeRequest.request_date)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <StoreIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Requested By</p>
                    <p className="text-sm text-gray-600">{storeRequest.requestingStore?.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <StoreIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Requested From</p>
                    <p className="text-sm text-gray-600">{storeRequest.issuingStore?.name}</p>
                  </div>
                </div>
                {storeRequest.expected_delivery_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Expected Delivery</p>
                      <p className="text-sm text-gray-600">{formatDate(storeRequest.expected_delivery_date)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Summary</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Items</p>
                    <p className="text-sm text-gray-600">{storeRequest.total_items}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Value</p>
                    <p className="text-sm text-gray-600">
                      {(() => {
                        const currencySymbol = storeRequest.storeRequestCurrency?.symbol || 'TSh';
                        return `${currencySymbol}${(Number(storeRequest.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created By</p>
                    <p className="text-sm text-gray-600">
                      {storeRequest.createdByUser?.first_name} {storeRequest.createdByUser?.last_name}
                    </p>
                  </div>
                </div>
                {storeRequest.submittedByUser && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Submitted By</p>
                      <p className="text-sm text-gray-600">
                        {storeRequest.submittedByUser.first_name} {storeRequest.submittedByUser.last_name}
                      </p>
                    </div>
                  </div>
                )}
                {storeRequest.approvedByUser && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Approved By</p>
                      <p className="text-sm text-gray-600">
                        {storeRequest.approvedByUser.first_name} {storeRequest.approvedByUser.last_name}
                      </p>
                    </div>
                  </div>
                )}
                {storeRequest.fulfilledByUser && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fulfilled By</p>
                      <p className="text-sm text-gray-600">
                        {storeRequest.fulfilledByUser.first_name} {storeRequest.fulfilledByUser.last_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {storeRequest.notes && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Notes</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{storeRequest.notes}</p>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {storeRequest.rejection_reason && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Rejection Reason</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{storeRequest.rejection_reason}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Request Items</h4>
          {storeRequest.storeRequestItems && storeRequest.storeRequestItems.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Requested Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Unit Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Total Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {storeRequest.storeRequestItems.map((item, index) => {
                      const totalCost = (parseFloat(item.requested_quantity?.toString() || '0') * parseFloat(item.unit_cost?.toString() || '0'));
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Package className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.storeRequestProduct?.name || 'Unknown Product'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.storeRequestProduct?.part_number || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-32">
                            <span className="text-sm text-gray-900">
                              {(item.requested_quantity || 0).toLocaleString('en-US')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-32">
                            <span className="text-sm text-gray-900">
                              {(() => {
                                const currencySymbol = storeRequest.storeRequestCurrency?.symbol || 'TSh';
                                return `${currencySymbol}${(Number(item.unit_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-32">
                            <span className="text-sm font-medium text-gray-900">
                              {(() => {
                                const currencySymbol = storeRequest.storeRequestCurrency?.symbol || 'TSh';
                                return `${currencySymbol}${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-24">
                            <StatusBadge status={item.status} variant="default" />
                          </td>
                          <td className="px-6 py-4 w-48">
                            <div className="text-sm text-gray-900 break-words">
                              {item.notes || 'N/A'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-lg font-bold">Total Request Value</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-32">
                        <span className="text-sm font-medium text-gray-900">
                          {storeRequest.storeRequestItems.reduce((sum, item) => sum + (Number(item.requested_quantity) || 0), 0).toLocaleString('en-US')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-32">
                        <span className="text-sm text-gray-500">-</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-32">
                        <span className="text-lg font-bold text-gray-900">
                          {(() => {
                            const currencySymbol = storeRequest.storeRequestCurrency?.symbol || 'TSh';
                            return `${currencySymbol}${(Number(storeRequest.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-24">
                        <span className="text-sm text-gray-500">-</span>
                      </td>
                      <td className="px-6 py-4 w-48">
                        <span className="text-sm text-gray-500">-</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No items found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Request History</h4>
          <div className="space-y-4">
            {/* Created */}
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Request Created</p>
                <p className="text-sm text-gray-600">
                  by {storeRequest.createdByUser?.first_name} {storeRequest.createdByUser?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(storeRequest.createdAt || '')}
                </p>
              </div>
            </div>

            {/* Submitted */}
            {storeRequest.submitted_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <ArrowRight className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Request Submitted</p>
                  <p className="text-sm text-gray-600">
                    by {storeRequest.submittedByUser?.first_name} {storeRequest.submittedByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeRequest.submitted_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Approved */}
            {storeRequest.approved_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Request Approved</p>
                  <p className="text-sm text-gray-600">
                    by {storeRequest.approvedByUser?.first_name} {storeRequest.approvedByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeRequest.approved_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Rejected */}
            {storeRequest.rejected_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Request Rejected</p>
                  <p className="text-sm text-gray-600">
                    by {storeRequest.rejectedByUser?.first_name} {storeRequest.rejectedByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeRequest.rejected_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Fulfilled */}
            {storeRequest.fulfilled_at && (
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Request Fulfilled</p>
                  <p className="text-sm text-gray-600">
                    by {storeRequest.fulfilledByUser?.first_name} {storeRequest.fulfilledByUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(storeRequest.fulfilled_at)}
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

export default StoreRequestView;