import React from 'react';
import { Edit } from 'lucide-react';
import { ProductColor } from '../types';
import { productColorStatusConfig } from '../data/productColorModules';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatters';

interface ProductColorViewProps {
  productColor: ProductColor;
  onClose: () => void;
  onEdit: () => void;
  canEdit?: boolean;
}

const ProductColorView: React.FC<ProductColorViewProps> = ({
  productColor,
  onClose,
  onEdit,
  canEdit = false
}) => {
  return (
    <div className="space-y-6">
      {/* Color Preview */}
      <div className="text-center">
        <div className="inline-flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg">
          <div 
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
            style={{ backgroundColor: productColor.hex_code }}
            title={productColor.hex_code}
          />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">{productColor.name}</h3>
            <p className="text-sm text-gray-600 font-mono">{productColor.hex_code}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Color Name</label>
            <p className="mt-1 text-sm text-gray-900">{productColor.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Color Code</label>
            <p className="mt-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {productColor.code}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Hex Code</label>
            <div className="mt-1 flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: productColor.hex_code }}
                title={productColor.hex_code}
              />
              <span className="text-sm font-mono text-gray-900">
                {productColor.hex_code}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1">
              <StatusBadge 
                status={productColor.is_active ? 'active' : 'inactive'}
                config={productColorStatusConfig}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Created By</label>
            <p className="mt-1 text-sm text-gray-900">
              {productColor.created_by_name || '-'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Created Date</label>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(productColor.created_at || productColor.createdAt)}
            </p>
          </div>

          {productColor.updated_by_name && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Updated By</label>
              <p className="mt-1 text-sm text-gray-900">
                {productColor.updated_by_name}
              </p>
            </div>
          )}

          {productColor.updated_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Updated Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(productColor.updated_at || productColor.updatedAt)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {productColor.description && (
        <div>
          <label className="block text-sm font-medium text-gray-500">Description</label>
          <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
            {productColor.description}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        {canEdit && (
          <Button
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductColorView;
