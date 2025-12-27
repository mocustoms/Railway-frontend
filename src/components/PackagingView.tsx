import React from 'react';
import { Packaging } from '../types';
import { formatDate } from '../utils/formatters';
import StatusBadge from './StatusBadge';

interface PackagingViewProps {
  packaging: Packaging | null;
  onClose: () => void;
  onEdit?: () => void;
}

const PackagingView: React.FC<PackagingViewProps> = ({
  packaging,
  onClose,
  onEdit
}) => {
  if (!packaging) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{packaging.name}</h2>
          <p className="text-sm text-gray-500">Code: {packaging.code}</p>
        </div>
        <StatusBadge 
          status={packaging.status === 'active' ? 'active' : 'inactive'} 
        />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Packaging Code
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
              {packaging.code}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Packaging Name
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
              {packaging.name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Pieces
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
              {packaging.pieces.toLocaleString()} pieces
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="bg-gray-50 p-3 rounded-lg">
                             <StatusBadge 
                 status={packaging.status === 'active' ? 'active' : 'inactive'} 
               />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created By
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
              {packaging.creator ? 
                `${packaging.creator.first_name} ${packaging.creator.last_name}`.trim() || 
                packaging.creator.username || 'Unknown User' : 
                packaging.created_by_name || 'Unknown User'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created Date
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
              {formatDate(packaging.created_at || packaging.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Last Updated Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Updated By
            </label>
            <p className="text-sm text-gray-900">
              {packaging.updater ? 
                `${packaging.updater.first_name} ${packaging.updater.last_name}`.trim() || 
                packaging.updater.username || 'Unknown User' : 
                packaging.updated_by_name || 'Unknown User'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Updated Date
            </label>
            <p className="text-sm text-gray-900">
              {formatDate(packaging.updated_at || packaging.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Close
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Edit Packaging
          </button>
        )}
      </div>
    </div>
  );
};

export default PackagingView;
