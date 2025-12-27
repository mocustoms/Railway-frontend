import React from 'react';
import { ProductBrandName } from '../types';
import { formatDate } from '../utils/formatters';
import { Image, Edit, Trash2 } from 'lucide-react';
import Button from './Button';
import { getLogoUrl } from '../services/productBrandNameService';

interface ProductBrandNameViewProps {
  productBrandName: ProductBrandName;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const ProductBrandNameView: React.FC<ProductBrandNameViewProps> = ({
  productBrandName,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true
}) => {
  return (
    <div className="space-y-6">
      {/* Header with Logo */}
      <div className="flex items-start space-x-4">
        {/* Logo Display */}
        <div className="flex-shrink-0">
          {productBrandName.logo ? (
            <img
              src={getLogoUrl(productBrandName.logo)}
              alt={`${productBrandName.name} logo`}
              className="h-24 w-24 object-cover rounded-lg border border-gray-300"
            />
          ) : (
            <div className="h-24 w-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
              <Image className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {productBrandName.name}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            Code: {productBrandName.code}
          </p>
          {productBrandName.description && (
            <p className="text-sm text-gray-700">
              {productBrandName.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                productBrandName.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {productBrandName.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Created By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Created By
          </label>
          <p className="text-sm text-gray-900">
            {productBrandName.created_by_name || 'Unknown'}
          </p>
        </div>

        {/* Created Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Created Date
          </label>
          <p className="text-sm text-gray-900">
            {formatDate(productBrandName.created_at || productBrandName.createdAt)}
          </p>
        </div>

        {/* Updated By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Updated By
          </label>
          <p className="text-sm text-gray-900">
            {productBrandName.updated_by_name || productBrandName.created_by_name || 'Unknown'}
          </p>
        </div>

        {/* Updated Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Updated Date
          </label>
          <p className="text-sm text-gray-900">
            {formatDate(productBrandName.updated_at || productBrandName.updatedAt)}
          </p>
        </div>

        {/* ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID
          </label>
          <p className="text-sm text-gray-900 font-mono">
            {productBrandName.id}
          </p>
        </div>
      </div>

      {/* Additional Information */}
      {productBrandName.description && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {productBrandName.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductBrandNameView;
