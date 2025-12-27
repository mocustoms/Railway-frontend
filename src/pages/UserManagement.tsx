import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Settings,
  Store,
  FileText,
  FileSpreadsheet,
  ArrowLeft
} from 'lucide-react';
import ContentContainer from '../components/ContentContainer';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { useUserManagement } from '../hooks/useUserManagement';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { User, UserFormData } from '../types';
import { userManagementConfig, getUserStatusInfo, getUserRoleInfo, formatUserFullName, formatUserStores, getUserInitials } from '../data/userManagementConfig';
import UserForm from '../components/UserForm';
import UserView from '../components/UserView';
import UserApprovalModal from '../components/UserApprovalModal';
import toast from 'react-hot-toast';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { isSidebarCollapsed } = useSidebar();
  
  // Calculate responsive modal size based on sidebar state
  const getModalSize = (): "sm" | "md" | "lg" | "xl" | "2xl" | "full" => {
    return "2xl"; // Use consistent 2xl size for both collapsed and expanded sidebar
  };
  
  const {
    users,
    stats,
    stores,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isApproving,
    isRejecting,
    isTogglingStatus,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    clearFilters,
    createUser,
    updateUser,
    deleteUser,
    approveUser,
    rejectUser,
    toggleUserStatus,
    filters,
    sortConfig,
    searchTerm,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canManageStores,
    canExport,
    exportToExcel,
    exportToPDF
  } = useUserManagement();


  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  // Computed values
  const showingStart = useMemo(() => {
    if (totalItems === 0) return 0;
    return (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);

  const showingEnd = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  // Handlers
  const handleCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleApprove = (user: User) => {
    setSelectedUser(user);
    setApprovalAction('approve');
    setIsApprovalModalOpen(true);
  };

  const handleReject = (user: User) => {
    setSelectedUser(user);
    setApprovalAction('reject');
    setIsApprovalModalOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id);
    } catch (error) {
      }
  };

  const handleFormSubmit = async (userData: UserFormData) => {
    try {
      if (modalMode === 'create') {
        await createUser(userData);
      } else if (selectedUser) {
        await updateUser(selectedUser.id, userData);
      }
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      }
  };

  const handleFormCancel = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      }
  };

  const handleApprovalConfirm = async (reason?: string) => {
    if (!selectedUser) return;
    
    try {
      if (approvalAction === 'approve') {
        await approveUser(selectedUser.id);
      } else {
        await rejectUser(selectedUser.id, reason || '');
      }
      setIsApprovalModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'full_name',
      label: 'Full Name',
      header: 'Full Name',
      sortable: true,
      render: (user: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {getUserInitials(user)}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {formatUserFullName(user)}
            </div>
            <div className="text-sm text-gray-500">
              {user.username}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      header: 'Email',
      sortable: true,
      render: (user: User) => (
        <div className="text-sm text-gray-900">{user.email}</div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      header: 'Role',
      sortable: true,
      render: (user: User) => {
        const roleInfo = getUserRoleInfo(user.role);
        return (
          <StatusBadge
            status={user.role}
          />
        );
      }
    },
    {
      key: 'approval_status',
      label: 'Status',
      header: 'Status',
      sortable: true,
      render: (user: User) => {
        const statusInfo = getUserStatusInfo(user.approval_status);
        return (
          <StatusBadge
            status={user.approval_status}
          />
        );
      }
    },
    {
      key: 'is_active',
      label: 'Active',
      header: 'Active',
      sortable: true,
      render: (user: User) => (
        <StatusBadge
          status={user.is_active ? 'active' : 'inactive'}
        />
      )
    },
    {
      key: 'assignedStores',
      label: 'Stores',
      header: 'Stores',
      sortable: false,
      render: (user: User) => (
        <div className="text-sm text-gray-900 max-w-xs truncate">
          {formatUserStores(user)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      header: 'Actions',
      sortable: false,
      render: (user: User) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(user)}
            title="View user details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(user)}
              title="Edit user"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {canApprove && user.approval_status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApprove(user)}
                title="Approve user"
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReject(user)}
                title="Reject user"
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(user)}
              title="Delete user"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <ContentContainer>
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalUsers || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.activeUsers || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.pendingUsers || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.adminUsers || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <Select
                value={filters.role}
                onChange={(e) => handleFilter('role', e.target.value)}
                className="min-w-[120px]"
              >
                <option value="">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </Select>

              <Select
                value={filters.approval_status}
                onChange={(e) => handleFilter('approval_status', e.target.value)}
                className="min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>

              <Select
                value={filters.is_active}
                onChange={(e) => handleFilter('is_active', e.target.value)}
                className="min-w-[120px]"
              >
                <option value="">All Users</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </Select>

              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Clear</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/users')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Users
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={exportToExcel}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <FileText size={16} className="mr-2" />
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable
            data={users}
            columns={columns}
            emptyMessage="No users found"
            showColumnControls={true}
            onSort={handleSort}
            sortable={true}
          />
        </div>

        {/* Modals */}
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleFormCancel}
            title={modalMode === 'create' ? 'Create User' : 'Edit User'}
            size="2xl"
          >
            <UserForm
              user={selectedUser}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isCreating || isUpdating}
              stores={Array.isArray(stores) ? stores : stores?.data || []}
            />
          </Modal>
        )}

        {isViewModalOpen && selectedUser && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title="User Details"
            size="2xl"
          >
            <UserView
              user={selectedUser}
              onClose={() => setIsViewModalOpen(false)}
              onEdit={canEdit ? () => handleEdit(selectedUser) : undefined}
              onDelete={canDelete ? () => handleDelete(selectedUser) : undefined}
              onApprove={canApprove && selectedUser.approval_status === 'pending' ? () => handleApprove(selectedUser) : undefined}
              onReject={canApprove && selectedUser.approval_status === 'pending' ? () => handleReject(selectedUser) : undefined}
              onToggleStatus={canEdit ? () => handleToggleStatus(selectedUser) : undefined}
            />
          </Modal>
        )}

        {isDeleteModalOpen && selectedUser && (
          <ConfirmDialog
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete User"
            message={`Are you sure you want to delete ${formatUserFullName(selectedUser)}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            isLoading={isDeleting}
          />
        )}

        {isApprovalModalOpen && selectedUser && (
          <UserApprovalModal
            isOpen={isApprovalModalOpen}
            onClose={() => setIsApprovalModalOpen(false)}
            onConfirm={handleApprovalConfirm}
            user={selectedUser}
            action={approvalAction}
            isLoading={isApproving || isRejecting}
          />
        )}
      </div>

      {/* Floating Action Button */}
      {canCreate && (
        <button
          onClick={handleCreate}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
          title="Add New User"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </ContentContainer>
  );
};

export default UserManagement;
