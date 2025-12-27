import React from 'react';
import { Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { User } from '../types';
import StatusBadge from './StatusBadge';
import DataTable from './DataTable';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onApprove: (userId: string) => void;
  onToggleStatus: (userId: string) => void;
  isLoading?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onDelete,
  onApprove,
  onToggleStatus,
  isLoading = false
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (isActive: boolean, isApproved: boolean) => {
    if (!isApproved) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusText = (isActive: boolean, isApproved: boolean) => {
    if (!isApproved) return 'Pending';
    return isActive ? 'Active' : 'Inactive';
  };

  const getStatusVariant = (isActive: boolean, isApproved: boolean) => {
    if (!isApproved) return 'warning';
    return isActive ? 'success' : 'error';
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (user: User) => (
        <div>
          <div className="font-medium text-gray-900">
            {user.first_name} {user.last_name}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )
    },
    {
      key: 'username',
      header: 'Username',
      render: (user: User) => (
        <span className="text-sm text-gray-900">{user.username}</span>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
          {user.role}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(user.is_active, user.approval_status === 'approved')}
          <StatusBadge
            status={getStatusText(user.is_active, user.approval_status === 'approved')}
            variant={getStatusVariant(user.is_active, user.approval_status === 'approved')}
          />
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(user)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Edit user"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          {user.approval_status !== 'approved' && (
            <button
              onClick={() => onApprove(user.id)}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
              title="Approve user"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => onToggleStatus(user.id)}
            className={`p-1 rounded transition-colors ${
              user.is_active
                ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
            }`}
            title={user.is_active ? 'Deactivate user' : 'Activate user'}
          >
            {user.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => onDelete(user.id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete user"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      emptyMessage={isLoading ? "Loading users..." : "No users found"}
      className="mt-6"
    />
  );
};

export default UserTable;