import React from 'react';
import {
  X,
  Edit,
  Package,
  Calendar,
  Store,
  TrendingUp,
  TrendingDown,
  FileText,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Minus,
  Plus
} from 'lucide-react';
import { StockAdjustment as StockAdjustmentType } from '../types';
import Button from './Button';
import { formatCurrency, formatDate } from '../utils/formatters';

interface StockAdjustmentViewProps {
  stockAdjustment: StockAdjustmentType;
  onClose: () => void;
  onEdit: () => void;
  canEdit?: boolean;
}

const StockAdjustmentView: React.FC<StockAdjustmentViewProps> = ({
  stockAdjustment,
  onClose,
  onEdit,
  canEdit = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'submitted':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-yellow-600 bg-yellow-100';
      case 'submitted':
        return 'text-blue-600 bg-blue-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAdjustmentTypeIcon = (type: string) => {
    return type === 'add' ? (
      <TrendingUp className="h-5 w-5 text-green-600" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-600" />
    );
  };

  const getAdjustmentTypeColor = (type: string) => {
    return type === 'add' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Stock Adjustment Details</h3>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Reference Number
              </label>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                  {stockAdjustment.reference_number}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Adjustment Date
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {formatDate(stockAdjustment.adjustment_date)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Store
              </label>
              <div className="flex items-center space-x-2">
                <Store className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{stockAdjustment.store_name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Adjustment Type
              </label>
              <div className="flex items-center space-x-2">
                {getAdjustmentTypeIcon(stockAdjustment.adjustment_type)}
                <span className={`font-medium ${getAdjustmentTypeColor(stockAdjustment.adjustment_type)}`}>
                  {stockAdjustment.adjustment_type === 'add' ? 'Stock In' : 'Stock Out'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Adjustment Reason
              </label>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{stockAdjustment.adjustment_reason_name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Status
              </label>
              <div className="flex items-center space-x-2">
                {getStatusIcon(stockAdjustment.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stockAdjustment.status)}`}>
                  {stockAdjustment.status.charAt(0).toUpperCase() + stockAdjustment.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {stockAdjustment.notes && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Notes
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-gray-900 whitespace-pre-wrap">{stockAdjustment.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{stockAdjustment.total_items}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {getAdjustmentTypeIcon(stockAdjustment.adjustment_type)}
            </div>
            <p className="text-sm text-gray-600">Adjustment Type</p>
            <p className={`text-lg font-semibold ${getAdjustmentTypeColor(stockAdjustment.adjustment_type)}`}>
              {stockAdjustment.adjustment_type === 'add' ? 'Stock In' : 'Stock Out'}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Minus className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-xl font-bold text-gray-900">
              {stockAdjustment.currency_symbol || 'TSh'}{(Number(stockAdjustment.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {getStatusIcon(stockAdjustment.status)}
            </div>
            <p className="text-sm text-gray-600">Status</p>
            <p className={`text-lg font-semibold ${getStatusColor(stockAdjustment.status).split(' ')[0]}`}>
              {stockAdjustment.status.charAt(0).toUpperCase() + stockAdjustment.status.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      {stockAdjustment.items && stockAdjustment.items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Adjustment Items</h4>
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
                    New Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockAdjustment.items.map((item, index) => {
                  const difference = item.new_quantity - item.current_quantity;
                  const isValidAdjustment = stockAdjustment.adjustment_type === 'add' ? difference >= 0 : difference <= 0;

                  return (
                    <tr key={index} className={!isValidAdjustment ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-sm text-gray-500">Code: {item.product_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.current_quantity.toLocaleString('en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.new_quantity.toLocaleString('en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {stockAdjustment.adjustment_type === 'add' ? (
                            <Plus className="h-4 w-4 text-green-600" />
                          ) : (
                            <Minus className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            stockAdjustment.adjustment_type === 'add' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {difference > 0 ? '+' : ''}{difference.toLocaleString('en-US')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stockAdjustment.currency_symbol || 'TSh'}{(Number(item.unit_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stockAdjustment.currency_symbol || 'TSh'}{(Number(item.total_value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Audit Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Created By
              </label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {stockAdjustment.created_by_name || 'System'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Created Date
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {formatDate(stockAdjustment.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {stockAdjustment.approved_by_name && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Approved By
                </label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{stockAdjustment.approved_by_name}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Last Updated
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">
                  {formatDate(stockAdjustment.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        {canEdit && (
          <Button
            onClick={onEdit}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Adjustment</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default StockAdjustmentView;
