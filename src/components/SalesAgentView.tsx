import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { SalesAgent } from '../types';
import Button from './Button';
import StatusBadge from './StatusBadge';
import SalesAgentPhoto from './SalesAgentPhoto';
import { formatDate } from '../utils/formatters';

interface SalesAgentViewProps {
  salesAgent: SalesAgent;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const SalesAgentView: React.FC<SalesAgentViewProps> = ({
  salesAgent,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true
}) => {
  return (
    <div className="space-y-6">
      {/* Header with Photo */}
      <div className="flex items-start space-x-4">
        {/* Photo Display */}
        <div className="flex-shrink-0">
          <SalesAgentPhoto
            photo={salesAgent.photo}
            fullName={salesAgent.fullName}
            size="lg"
          />
        </div>

        {/* Basic Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {salesAgent.fullName}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            Agent Number: {salesAgent.agentNumber}
          </p>
          <StatusBadge 
            status={salesAgent.status} 
            variant={salesAgent.status === 'active' ? 'success' : 'error'}
          />
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Agent Information</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Agent Number:</span>
              <span className="ml-2 text-sm font-medium text-gray-900">{salesAgent.agentNumber}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Full Name:</span>
              <span className="ml-2 text-sm font-medium text-gray-900">{salesAgent.fullName}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <span className="ml-2">
                <StatusBadge 
                  status={salesAgent.status} 
                  variant={salesAgent.status === 'active' ? 'success' : 'error'}
                />
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">System Information</h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Created:</span>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {formatDate(salesAgent.created_at)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Last Updated:</span>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {formatDate(salesAgent.updated_at)}
              </span>
            </div>
            {salesAgent.created_by_name && (
              <div>
                <span className="text-sm text-gray-500">Created By:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {salesAgent.created_by_name}
                </span>
              </div>
            )}
            {salesAgent.updated_by_name && (
              <div>
                <span className="text-sm text-gray-500">Updated By:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {salesAgent.updated_by_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAgentView;
