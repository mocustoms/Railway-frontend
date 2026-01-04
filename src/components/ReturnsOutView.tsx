import React from 'react';
import { ReturnsOut } from '../services/returnsOutService';
import StatusBadge from './StatusBadge';
import Button from './Button';
import { formatDate } from '../utils/formatters';

interface ReturnsOutViewProps {
  returnsOut: ReturnsOut;
  onClose: () => void;
  onEdit?: () => void;
}

const ReturnsOutView: React.FC<ReturnsOutViewProps> = ({ returnsOut, onClose, onEdit }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Return Reference</label>
          <p className="text-gray-900 font-mono">{returnsOut.return_ref_number}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Return Date</label>
          <p className="text-gray-900">{formatDate(returnsOut.return_date)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Vendor</label>
          <p className="text-gray-900">{returnsOut.vendor_name || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Store</label>
          <p className="text-gray-900">{returnsOut.store_name || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Return Reason</label>
          <p className="text-gray-900">{returnsOut.return_reason_name || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
          <StatusBadge status={returnsOut.status} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Refund Status</label>
          <StatusBadge status={returnsOut.refund_status} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Total Amount</label>
          <p className="text-gray-900 font-semibold">{parseFloat(returnsOut.total_amount.toString()).toFixed(2)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Refund Amount</label>
          <p className="text-gray-900 font-semibold text-green-600">{parseFloat(returnsOut.refund_amount.toString()).toFixed(2)}</p>
        </div>
      </div>

      {returnsOut.notes && (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
          <p className="text-gray-900 whitespace-pre-wrap">{returnsOut.notes}</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Refund Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returnsOut.items?.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.product?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{item.product?.code || ''}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{parseFloat(item.quantity.toString()).toFixed(3)}</td>
                  <td className="px-4 py-3 text-right">{parseFloat(item.unit_price.toString()).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{parseFloat((item.refund_amount || 0).toString()).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{parseFloat(item.line_total.toString()).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onEdit && (
          <Button variant="secondary" onClick={onEdit}>
            Edit
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default ReturnsOutView;

