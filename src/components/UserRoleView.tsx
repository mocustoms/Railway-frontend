import React from 'react';
import {
  Shield,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import { UserRole } from '../types';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { formatRolePermissions, getRoleTypeLabel, getRoleTypeColor, permissionCategories, getCategoryIcon } from '../data/userRoleModules';

interface UserRoleViewProps {
  role: UserRole;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
}

const UserRoleView: React.FC<UserRoleViewProps> = ({
  role,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  // Group permissions by category
  const groupedPermissions = permissionCategories.map(category => ({
    ...category,
    permissions: category.permissions.filter(perm =>
      role.permissions?.includes(perm.key)
    )
  })).filter(cat => cat.permissions.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{role.name}</h2>
            {role.description && (
              <p className="text-gray-600 mt-1">{role.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onEdit && !role.is_system_role && (
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
          
          {onToggleStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleStatus}
              className={`flex items-center space-x-2 ${
                role.is_active 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-green-600 hover:text-green-700'
              }`}
            >
              {role.is_active ? (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Activate</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Status and Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Status</h3>
          </div>
          <StatusBadge
            status={role.is_active ? 'active' : 'inactive'}
          />
          <p className="text-sm text-gray-600 mt-1">
            {role.is_active ? 'Role is active and can be assigned to users' : 'Role is inactive'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Type</h3>
          </div>
          <StatusBadge
            status={role.is_system_role ? 'system_role' : 'custom_role'}
            config={{
              system_role: {
                label: 'System Role',
                color: 'purple',
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-800'
              },
              custom_role: {
                label: 'Custom Role',
                color: 'blue',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-800'
              }
            }}
          />
          <p className="text-sm text-gray-600 mt-1">
            {role.is_system_role 
              ? 'System role - cannot be deleted' 
              : 'Custom role - can be modified or deleted'}
          </p>
        </div>
      </div>

      {/* Permissions Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Permissions ({role.permissions?.length || 0})</span>
          </h3>
          <p className="text-sm text-gray-600">
            {formatRolePermissions(role)}
          </p>
        </div>

        {groupedPermissions.length > 0 ? (
          <div className="space-y-3">
            {groupedPermissions.map((category) => {
              const CategoryIcon = getCategoryIcon(category.name);
              return (
                <div key={category.name} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <CategoryIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">{category.label}</h4>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      {category.permissions.length} permission{category.permissions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.permissions.map((permission) => (
                      <div
                        key={permission.key}
                        className="flex items-start space-x-2 p-2 bg-white rounded border border-gray-200"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {permission.label}
                          </p>
                          {permission.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-medium text-gray-700 mb-2">No permissions assigned</p>
            <p className="text-sm">This role has no permissions configured</p>
          </div>
        )}
      </div>

      {/* Usage Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span>Usage Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Assigned Users</p>
              <p className="font-medium text-gray-900">
                {role.user_count || 0} user{(role.user_count || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium text-gray-900">
                {new Date(role.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        
        {onDelete && !role.is_system_role && (
          <Button
            variant="outline"
            onClick={onDelete}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Role
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserRoleView;
