import React from 'react';
import { X, Tag, Palette, Calendar, User, FileText, DollarSign } from 'lucide-react';
import { ProductCategory } from '../types';
import StatusBadge from './StatusBadge';

interface ProductCategoryViewProps {
  productCategory: ProductCategory;
  onClose: () => void;
}

const ProductCategoryView: React.FC<ProductCategoryViewProps> = ({
  productCategory,
  onClose,
}) => {
  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Tag className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Product Category Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Category Code
                </label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                  {productCategory.code}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Category Name
                </label>
                <p className="text-sm text-gray-900">{productCategory.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Status
                </label>
                <StatusBadge status={productCategory.is_active ? 'active' : 'inactive'} />
              </div>

              {productCategory.color && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    <Palette className="h-4 w-4 inline mr-1" />
                    Category Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: productCategory.color }}
                    />
                    <span className="text-sm text-gray-900 font-mono">
                      {productCategory.color}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                <DollarSign className="h-5 w-5 inline mr-1" />
                Financial Configuration
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Tax Code
                </label>
                <p className="text-sm text-gray-900">
                  {productCategory.tax_code_name || 'Not assigned'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Purchases Tax
                </label>
                <p className="text-sm text-gray-900">
                  {productCategory.purchases_tax_name || 'Not assigned'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  COGS Account
                </label>
                <p className="text-sm text-gray-900">
                  {productCategory.cogs_account_name || 'Not assigned'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Income Account
                </label>
                <p className="text-sm text-gray-900">
                  {productCategory.income_account_name || 'Not assigned'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Asset Account
                </label>
                <p className="text-sm text-gray-900">
                  {productCategory.asset_account_name || 'Not assigned'}
                </p>
              </div>
            </div>

            {/* Description */}
            {productCategory.description && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Description
                </label>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {productCategory.description}
                  </p>
                </div>
              </div>
            )}

            {/* Audit Information */}
            <div className="md:col-span-2 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <Calendar className="h-5 w-5 inline mr-1" />
                Audit Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    <User className="h-4 w-4 inline mr-1" />
                    Created By
                  </label>
                  <p className="text-sm text-gray-900">
                    {productCategory.created_by_name || 'System'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(productCategory.created_at)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    <User className="h-4 w-4 inline mr-1" />
                    Last Updated By
                  </label>
                  <p className="text-sm text-gray-900">
                    {productCategory.updated_by_name || 'System'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(productCategory.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryView;
