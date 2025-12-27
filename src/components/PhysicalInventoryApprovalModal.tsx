import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Package, DollarSign, Calendar, User, Store, FileText, List, TrendingUp, TrendingDown } from 'lucide-react';
import { PhysicalInventory as PhysicalInventoryType } from '../types';
import Modal from './Modal';
import Button from './Button';
import Textarea from './Textarea';
import DataTable from './DataTable';
import { formatCurrency, formatDate } from '../utils/formatters';

interface PhysicalInventoryApprovalModalProps {
  isOpen: boolean;
  physicalInventory: PhysicalInventoryType;
  action: 'approve' | 'reject' | 'return';
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  onAcceptVariance?: () => Promise<void>;
  isLoading: boolean;
  isAcceptingVariance?: boolean;
  varianceAccepted?: boolean;
}

const PhysicalInventoryApprovalModal: React.FC<PhysicalInventoryApprovalModalProps> = ({
  isOpen,
  physicalInventory,
  action,
  onClose,
  onConfirm,
  onAcceptVariance,
  isLoading,
  isAcceptingVariance = false,
  varianceAccepted = false
}) => {
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'items'>('details');

  const handleSubmit = async () => {
    try {
      await onConfirm(reason);
    } catch (error) {
      }
  };

  const handleAcceptVariance = async () => {
    try {
      if (onAcceptVariance) {
        await onAcceptVariance();
      }
    } catch (error) {
      }
  };

  const handleClose = () => {
    setReason('');
    setActiveTab('details');
    onClose();
  };

  // Table columns configuration for inventory items
  const itemsColumns = useMemo(() => [
    {
      key: 'product',
      header: 'Product',
      sortable: true,
      defaultVisible: true,
      render: (item: any) => (
        <div>
          <div className="font-medium text-gray-900">{item.product?.name || 'N/A'}</div>
          {item.product?.sku && (
            <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
          )}
        </div>
      )
    },
    {
      key: 'current_quantity',
      header: 'Current Qty',
      sortable: true,
      defaultVisible: true,
      render: (item: any) => (
        <span className="text-gray-900">{item.current_quantity || 0}</span>
      )
    },
    {
      key: 'counted_quantity',
      header: 'Counted Qty',
      sortable: true,
      defaultVisible: true,
      render: (item: any) => (
        <span className="text-gray-900 font-medium">{item.counted_quantity || 0}</span>
      )
    },
    {
      key: 'delta',
      header: 'Delta (Difference)',
      sortable: true,
      defaultVisible: true,
      render: (item: any) => {
        const delta = Number(item.delta_quantity || 0);
        
        if (delta > 0) {
          return (
            <div className="text-green-600 font-medium">
              +{delta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          );
        } else if (delta < 0) {
          return (
            <div className="text-red-600 font-medium">
              {delta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          );
        } else {
          return (
            <div className="text-gray-500 font-medium">
              0.00
            </div>
          );
        }
      }
    },
    {
      key: 'adjustment',
      header: 'Adjustment',
      sortable: false,
      defaultVisible: true,
      render: (item: any) => (
        <div className="space-y-1">
          {item.adjustment_in_quantity > 0 && (
            <div className="text-green-600 font-medium">
              +{item.adjustment_in_quantity} (In)
            </div>
          )}
          {item.adjustment_out_quantity > 0 && (
            <div className="text-red-600 font-medium">
              -{item.adjustment_out_quantity} (Out)
            </div>
          )}
          {item.adjustment_in_quantity === 0 && item.adjustment_out_quantity === 0 && (
            <div className="text-gray-500">No change</div>
          )}
        </div>
      )
    },
    {
      key: 'new_stock',
      header: 'New Stock',
      sortable: true,
      defaultVisible: true,
      render: (item: any) => (
        <span className="text-gray-900 font-medium">{item.new_stock || 0}</span>
      )
    },
    {
      key: 'unit_cost',
      header: 'Unit Cost',
      sortable: true,
      defaultVisible: true,
      render: (item: any) => (
        <span className="text-gray-900">
          {item.unit_cost ? formatCurrency(item.unit_cost, physicalInventory.currency?.code || 'USD') : 'N/A'}
        </span>
      )
    },
    {
      key: 'unit_average_cost',
      header: 'Unit Avg Cost',
      sortable: true,
      defaultVisible: true,
      render: (item: any) => (
        <span className="text-gray-900">
          {item.unit_average_cost ? formatCurrency(item.unit_average_cost, physicalInventory.currency?.code || 'USD') : 'N/A'}
        </span>
      )
    },
    {
      key: 'delta_value',
      header: 'Delta Value',
      sortable: true,
      defaultVisible: true,
      render: (item: any) => {
        const deltaValue = Number(item.delta_value || 0);
        
        if (deltaValue > 0) {
          return (
            <div className="text-green-600 font-medium">
              +{formatCurrency(deltaValue, physicalInventory.currency?.code || 'USD')}
            </div>
          );
        } else if (deltaValue < 0) {
          return (
            <div className="text-red-600 font-medium">
              {formatCurrency(deltaValue, physicalInventory.currency?.code || 'USD')}
            </div>
          );
        } else {
          return (
            <div className="text-gray-500 font-medium">
              {formatCurrency(0, physicalInventory.currency?.code || 'USD')}
            </div>
          );
        }
      }
    },
    {
      key: 'total_value',
      header: 'Total Value',
      sortable: true,
      defaultVisible: true,
      render: (item: any) => (
        <span className="text-gray-900 font-medium">
          {item.total_value ? formatCurrency(item.total_value, physicalInventory.currency?.code || 'USD') : 'N/A'}
        </span>
      )
    },
    {
      key: 'notes',
      header: 'Notes',
      sortable: false,
      defaultVisible: false,
      render: (item: any) => (
        <span className="text-gray-500">{item.notes || '-'}</span>
      )
    }
  ], [physicalInventory.currency?.code]);

  // Calculate delta value summaries
  const deltaValueSummary = useMemo(() => {
    if (!physicalInventory.items || physicalInventory.items.length === 0) {
      return {
        totalDeltaValue: 0,
        positiveDeltaValue: 0,
        negativeDeltaValue: 0,
        positiveItemsCount: 0,
        negativeItemsCount: 0,
        zeroItemsCount: 0
      };
    }

    let totalDeltaValue = 0;
    let positiveDeltaValue = 0;
    let negativeDeltaValue = 0;
    let positiveItemsCount = 0;
    let negativeItemsCount = 0;
    let zeroItemsCount = 0;

    physicalInventory.items.forEach((item: any) => {
      const currentQty = Number(item.current_quantity || 0);
      const countedQty = Number(item.counted_quantity || 0);
      const deltaQty = countedQty - currentQty;
      const unitAvgCost = Number(item.unit_average_cost || 0);
      const deltaValue = deltaQty * unitAvgCost;

      totalDeltaValue += deltaValue;

      if (deltaValue > 0) {
        positiveDeltaValue += deltaValue;
        positiveItemsCount++;
      } else if (deltaValue < 0) {
        negativeDeltaValue += deltaValue;
        negativeItemsCount++;
      } else {
        zeroItemsCount++;
      }
    });

    return {
      totalDeltaValue,
      positiveDeltaValue,
      negativeDeltaValue,
      positiveItemsCount,
      negativeItemsCount,
      zeroItemsCount
    };
  }, [physicalInventory.items]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Return for Correction'} Physical Inventory`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className={`flex items-center space-x-3 p-4 rounded-lg ${
          action === 'approve' ? 'bg-green-50 border border-green-200' : 
          action === 'reject' ? 'bg-red-50 border border-red-200' : 
          'bg-orange-50 border border-orange-200'
        }`}>
          {action === 'approve' ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : action === 'reject' ? (
            <XCircle className="h-6 w-6 text-red-600" />
          ) : (
            <Package className="h-6 w-6 text-orange-600" />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${
              action === 'approve' ? 'text-green-800' : 
              action === 'reject' ? 'text-red-800' : 
              'text-orange-800'
            }`}>
              {action === 'approve' ? 'Approve Physical Inventory' : 
               action === 'reject' ? 'Reject Physical Inventory' : 
               'Return for Correction'}
            </h3>
            <p className={`text-sm ${
              action === 'approve' ? 'text-green-600' : 
              action === 'reject' ? 'text-red-600' : 
              'text-orange-600'
            }`}>
              {action === 'approve' 
                ? 'This will approve the physical inventory and apply the adjustments to stock levels.'
                : action === 'reject'
                ? 'This will reject the physical inventory. Please provide a reason.'
                : 'This will return the physical inventory to the creator for corrections. Please provide a reason.'
              }
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Inventory Details</span>
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <List className="h-4 w-4" />
              <span>Inventory Items ({physicalInventory.items?.length || 0})</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Inventory Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Inventory Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Store className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-600">Store:</span>
                      <div className="text-gray-900">{physicalInventory.store_name || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-600">Date:</span>
                      <div className="text-gray-900">{formatDate(physicalInventory.inventory_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-600">Total Items:</span>
                      <div className="text-gray-900">{physicalInventory.total_items || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-600">Total Value:</span>
                      <div className="text-gray-900">
                        {formatCurrency(physicalInventory.total_value || 0, physicalInventory.currency?.code || 'USD')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-600">Created By:</span>
                      <div className="text-gray-900">{physicalInventory.created_by_name || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-600">Created:</span>
                      <div className="text-gray-900">{formatDate(physicalInventory.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-600">Currency:</span>
                      <div className="text-gray-900">{physicalInventory.currency?.name || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-600">Exchange Rate:</span>
                      <div className="text-gray-900">{physicalInventory.exchange_rate || 1}</div>
                    </div>
                  </div>
                </div>
                {physicalInventory.notes && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-600">Notes:</span>
                    <div className="text-gray-900 mt-1">{physicalInventory.notes}</div>
                  </div>
                )}
              </div>

              {/* Delta Value Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                  Delta Value Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Delta Value */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Delta Value</p>
                        <p className={`text-lg font-bold ${
                          deltaValueSummary.totalDeltaValue > 0 ? 'text-green-600' : 
                          deltaValueSummary.totalDeltaValue < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatCurrency(deltaValueSummary.totalDeltaValue, physicalInventory.currency?.code || 'USD')}
                        </p>
                      </div>
                      <div className={`p-2 rounded-full ${
                        deltaValueSummary.totalDeltaValue > 0 ? 'bg-green-100' : 
                        deltaValueSummary.totalDeltaValue < 0 ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <DollarSign className={`h-5 w-5 ${
                          deltaValueSummary.totalDeltaValue > 0 ? 'text-green-600' : 
                          deltaValueSummary.totalDeltaValue < 0 ? 'text-red-600' : 'text-gray-600'
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Positive Delta Value */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Positive Delta Value</p>
                        <p className="text-lg font-bold text-green-600">
                          +{formatCurrency(deltaValueSummary.positiveDeltaValue, physicalInventory.currency?.code || 'USD')}
                        </p>
                        <p className="text-xs text-gray-500">{deltaValueSummary.positiveItemsCount} items</p>
                      </div>
                      <div className="p-2 rounded-full bg-green-100">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>

                  {/* Negative Delta Value */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Negative Delta Value</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(deltaValueSummary.negativeDeltaValue, physicalInventory.currency?.code || 'USD')}
                        </p>
                        <p className="text-xs text-gray-500">{deltaValueSummary.negativeItemsCount} items</p>
                      </div>
                      <div className="p-2 rounded-full bg-red-100">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="mt-4 pt-3 border-t border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">
                        <span className="font-medium text-green-600">{deltaValueSummary.positiveItemsCount}</span> items with gains
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium text-red-600">{deltaValueSummary.negativeItemsCount}</span> items with losses
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium text-gray-600">{deltaValueSummary.zeroItemsCount}</span> items unchanged
                      </span>
                    </div>
                    <div className="text-gray-500">
                      Total: {physicalInventory.items?.length || 0} items
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              {/* Inventory Items */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Inventory Items ({physicalInventory.items?.length || 0})
                  </h4>
                </div>
                <DataTable
                  data={physicalInventory.items || []}
                  columns={itemsColumns}
                  sortable={true}
                  showColumnControls={true}
                  maxHeight={400}
                  emptyMessage="No inventory items found"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rejection/Return Reason */}
        {(action === 'reject' || action === 'return') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {action === 'reject' ? 'Rejection' : 'Return'} Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={action === 'reject' 
                ? "Please provide a reason for rejecting this physical inventory..."
                : "Please provide a reason for returning this physical inventory for correction..."
              }
              rows={4}
              required
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {/* Variance Status Indicator - Only for approval */}
          {action === 'approve' && (
            <div className="flex items-center space-x-2">
              {varianceAccepted ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Variance Accepted</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-orange-600">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Variance Pending Acceptance</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading || isAcceptingVariance}
            >
              Cancel
            </Button>

            {/* Accept Variance Button (only for approval, only if not yet accepted) */}
            {action === 'approve' && !varianceAccepted && onAcceptVariance && (
              <Button
                onClick={handleAcceptVariance}
                disabled={isLoading || isAcceptingVariance}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isAcceptingVariance ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Accepting Variance...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Accept the Variance/Delta Value</span>
                  </div>
                )}
              </Button>
            )}

            {/* Final Approve/Reject/Return Button */}
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading || 
                isAcceptingVariance ||
                ((action === 'reject' || action === 'return') && !reason.trim()) ||
                (action === 'approve' && !varianceAccepted)
              }
              className={action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : action === 'reject'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-orange-600 hover:bg-orange-700'
              }
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{action === 'approve' ? 'Approving...' : action === 'reject' ? 'Rejecting...' : 'Returning...'}</span>
                </div>
              ) : (
                action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Return for Correction'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PhysicalInventoryApprovalModal;