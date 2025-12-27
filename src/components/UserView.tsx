import React from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Store,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import { User as UserType } from '../types';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { getUserStatusInfo, getUserRoleInfo, formatUserFullName, formatUserStores, getUserInitials } from '../data/userManagementConfig';

interface UserViewProps {
  user: UserType;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onToggleStatus?: () => void;
}

const UserView: React.FC<UserViewProps> = ({
  user,
  onClose,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onToggleStatus
}) => {
  const statusInfo = getUserStatusInfo(user.approval_status);
  const roleInfo = getUserRoleInfo(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">
              {getUserInitials(user)}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {formatUserFullName(user)}
            </h2>
            <p className="text-gray-600">@{user.username}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onEdit && (
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
                user.is_active 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-green-600 hover:text-green-700'
              }`}
            >
              {user.is_active ? (
                <>
                  <UserX className="h-4 w-4" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Activate</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Status and Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Role</h3>
          </div>
          <StatusBadge
            status={user.role}
          />
          <p className="text-sm text-gray-600 mt-1">{roleInfo.description}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Status</h3>
          </div>
          <StatusBadge
            status={user.approval_status}
          />
          <p className="text-sm text-gray-600 mt-1">
            {user.approval_status === 'approved' ? 'User is approved and active' :
             user.approval_status === 'pending' ? 'Awaiting approval' :
             'User has been rejected'}
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <User className="h-5 w-5 text-blue-600" />
          <span>Basic Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{user.phone}</p>
              </div>
            </div>
          )}
        </div>

        {user.address && (
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-gray-900">{user.address}</p>
            </div>
          </div>
        )}
      </div>

      {/* Store Assignments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Store className="h-5 w-5 text-blue-600" />
          <span>Store Assignments</span>
        </h3>

        {user.assignedStores && user.assignedStores.length > 0 ? (
          <div className="space-y-3">
            {user.assignedStores.map((assignment, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {assignment.Store?.name || 'Unknown Store'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {assignment.Store?.location || 'No location specified'}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge
                      status={assignment.role}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {assignment.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-medium text-gray-700 mb-2">No stores assigned</p>
            <p className="text-sm">This user is not assigned to any stores</p>
          </div>
        )}
      </div>

      {/* Activity Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span>Activity Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {user.last_login && (
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.last_login).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Actions */}
      {user.approval_status === 'pending' && (onApprove || onReject) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">Pending Approval</h3>
          </div>
          <p className="text-sm text-yellow-700 mb-4">
            This user is waiting for approval. Review their information and decide whether to approve or reject their account.
          </p>
          <div className="flex items-center space-x-3">
            {onApprove && (
              <Button
                onClick={onApprove}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve</span>
              </Button>
            )}
            {onReject && (
              <Button
                onClick={onReject}
                variant="outline"
                className="flex items-center space-x-2 text-red-600 border-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason */}
      {user.approval_status === 'rejected' && user.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-800">Rejection Reason</h3>
          </div>
          <p className="text-sm text-red-700">{user.rejection_reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        
        {onDelete && (
          <Button
            variant="outline"
            onClick={onDelete}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserView;
