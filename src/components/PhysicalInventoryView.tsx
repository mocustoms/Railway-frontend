import React from 'react';
import {
  ClipboardList,
  Calendar,
  Store,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  User,
  Hash,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { PhysicalInventory as PhysicalInventoryType } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';

interface PhysicalInventoryViewProps {
  physicalInventory: PhysicalInventoryType;
  onClose: () => void;
  onSubmit: (physicalInventory: PhysicalInventoryType) => Promise<void>;
  onApprove: (physicalInventory: PhysicalInventoryType) => Promise<void>;
  onReject: (physicalInventory: PhysicalInventoryType) => Promise<void>;
  onReturn: (physicalInventory: PhysicalInventoryType) => Promise<void>;
  isLoading: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  isReturning?: boolean;
}

const PhysicalInventoryView: React.FC<PhysicalInventoryViewProps> = ({ 
  physicalInventory,
  onClose,
  onSubmit,
  onApprove,
  onReject,
  onReturn,
  isLoading,
  isApproving,
  isRejecting,
  isReturning = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return Clock;
      case 'submitted':
        return AlertCircle;
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'returned_for_correction':
        return RotateCcw;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600';
      case 'submitted':
        return 'text-blue-600';
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'returned_for_correction':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const StatusIcon = getStatusIcon(physicalInventory.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {physicalInventory.reference_number}
              </h1>
              <p className="text-gray-600">Physical Inventory Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon className={`h-6 w-6 ${getStatusColor(physicalInventory.status)}`} />
            <span className={`text-lg font-semibold ${getStatusColor(physicalInventory.status)}`}>
              {physicalInventory.status === 'returned_for_correction' 
                ? 'Returned for Correction'
                : physicalInventory.status.charAt(0).toUpperCase() + physicalInventory.status.slice(1)
              }
            </span>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Inventory Date</p>
                <p className="font-medium text-gray-900">
                  {formatDate(physicalInventory.inventory_date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Store className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Store</p>
                <p className="font-medium text-gray-900">
                  {physicalInventory.store_name || 'Unknown Store'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="font-medium text-gray-900">
                  {(physicalInventory.total_items || 0).toLocaleString('en-US')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="font-medium text-gray-900">
                  {physicalInventory.currency_symbol || 'TSh'}{(Number(physicalInventory.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Hash className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Currency</p>
                <p className="font-medium text-gray-900">
                  {physicalInventory.currency?.code || 'TZS'} ({physicalInventory.currency_symbol || 'TSh'})
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjustment Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Items Count</p>
                <p className="font-medium text-green-600">
                  {(physicalInventory.total_items || 0).toLocaleString('en-US')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-red-600">
                  {physicalInventory.status?.toUpperCase() || 'DRAFT'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="font-medium text-gray-900">
                  {physicalInventory.currency?.symbol || 'TSh'}{(Number(physicalInventory.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Hash className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Exchange Rate</p>
                <p className="font-medium text-gray-900">
                  {(Number(physicalInventory.exchange_rate) || 1).toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Created By</span>
            </div>
            <p className="text-sm text-gray-900">{physicalInventory.created_by_name || 'System'}</p>
            <p className="text-xs text-gray-500">{formatDate(physicalInventory.created_at)}</p>
          </div>
          
          {physicalInventory.updated_by_name && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Updated By</span>
              </div>
              <p className="text-sm text-gray-900">{physicalInventory.updated_by_name}</p>
              <p className="text-xs text-gray-500">{physicalInventory.updated_at ? formatDate(physicalInventory.updated_at) : '-'}</p>
            </div>
          )}
          
          {physicalInventory.submitted_by_name && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Submitted By</span>
              </div>
              <p className="text-sm text-gray-900">{physicalInventory.submitted_by_name}</p>
              <p className="text-xs text-gray-500">{physicalInventory.submitted_at ? formatDate(physicalInventory.submitted_at) : '-'}</p>
            </div>
          )}
          
          {physicalInventory.approved_by_name && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Approved By</span>
              </div>
              <p className="text-sm text-gray-900">{physicalInventory.approved_by_name}</p>
              <p className="text-xs text-gray-500">{physicalInventory.approved_at ? formatDate(physicalInventory.approved_at) : '-'}</p>
            </div>
          )}
        </div>
        
        {physicalInventory.rejection_reason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Rejection Reason</span>
            </div>
            <p className="text-sm text-red-600">{physicalInventory.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {physicalInventory.notes && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{physicalInventory.notes}</p>
        </div>
      )}

      {/* Items */}
      {physicalInventory.items && physicalInventory.items.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Counted Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adjustment In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adjustment Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {physicalInventory.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.product_name || `Product ${item.product_id}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.product_code || item.product_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.current_quantity.toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.counted_quantity.toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          {item.adjustment_in_quantity.toLocaleString('en-US')}
                        </span>
                      </div>
                      {item.adjustment_in_reason_name && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.adjustment_in_reason_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">
                          {item.adjustment_out_quantity.toLocaleString('en-US')}
                        </span>
                      </div>
                      {item.adjustment_out_reason_name && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.adjustment_out_reason_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {physicalInventory.currency_symbol || 'TSh'}{(item.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {physicalInventory.currency_symbol || 'TSh'}{(item.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {physicalInventory.status === 'submitted' && (
        <div className="mt-6 flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={() => onApprove(physicalInventory)}
            disabled={isApproving || isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
          
          <button
            onClick={() => onReject(physicalInventory)}
            disabled={isRejecting || isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </button>
          
          <button
            onClick={() => onReturn(physicalInventory)}
            disabled={isReturning || isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Package className="h-4 w-4 mr-2" />
            {isReturning ? 'Returning...' : 'Return for Correction'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhysicalInventoryView;
