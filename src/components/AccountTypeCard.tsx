import React from 'react';
import { AccountType } from '../types';

interface AccountTypeCardProps {
  accountType: AccountType;
  onView?: (accountType: AccountType) => void;
  onEdit?: (accountType: AccountType) => void;
  onDelete?: (accountType: AccountType) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const AccountTypeCard: React.FC<AccountTypeCardProps> = ({
  accountType,
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true
}) => {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'ASSET': 'fa-piggy-bank',
      'LIABILITY': 'fa-credit-card',
      'EQUITY': 'fa-chart-line',
      'REVENUE': 'fa-arrow-up',
      'EXPENSE': 'fa-arrow-down'
    };
    return icons[category] || 'fa-layer-group';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'ASSET': 'bg-blue-100 text-blue-800',
      'LIABILITY': 'bg-red-100 text-red-800',
      'EQUITY': 'bg-green-100 text-green-800',
      'REVENUE': 'bg-emerald-100 text-emerald-800',
      'EXPENSE': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getNatureColor = (nature: string) => {
    return nature === 'DEBIT' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-indigo-100 text-indigo-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <i className={`fas ${getCategoryIcon(accountType.category)} text-white text-lg`}></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{accountType.name}</h3>
              <p className="text-sm text-gray-500">Code: {accountType.code}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(accountType.category)}`}>
              {accountType.category}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getNatureColor(accountType.nature)}`}>
              {accountType.nature}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {accountType.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {accountType.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
               accountType.isActive 
                 ? 'bg-green-100 text-green-800' 
                 : 'bg-red-100 text-red-800'
             }`}>
               {accountType.isActive ? 'Active' : 'Inactive'}
            </span>
            {accountType.creator && (
              <span>
                                 Created by: {accountType.creator.firstName} {accountType.creator.lastName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Created: {new Date(accountType.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            {onView && (
              <button
                onClick={() => onView(accountType)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                title="View details"
              >
                <i className="fas fa-eye text-sm"></i>
              </button>
            )}
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(accountType)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200"
                title="Edit account type"
              >
                <i className="fas fa-edit text-sm"></i>
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(accountType)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                title="Delete account type"
              >
                <i className="fas fa-trash text-sm"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeCard; 