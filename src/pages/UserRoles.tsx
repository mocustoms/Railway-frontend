import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
  Users,
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
import { useUserRoleManagement } from '../hooks/useUserRoleManagement';
import { UserRole } from '../types';
import { formatRolePermissions, getRoleTypeLabel, getRoleTypeColor } from '../data/userRoleModules';
import UserRoleForm from '../components/UserRoleForm';
import UserRoleView from '../components/UserRoleView';
import './UserRoles.css';

const UserRoles: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    roles,
    stats,
    availablePermissions,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    isLoadingStats,
    isLoadingPermissions,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleFilter,
    clearFilters,
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    checkRoleUsage,
    filters,
    sortConfig,
    searchTerm,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    exportToExcel,
    exportToPDF
  } = useUserRoleManagement();

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

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
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: UserRole) => {
    setModalMode('edit');
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleView = (role: UserRole) => {
    setSelectedRole(role);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (role: UserRole) => {
    if (role.is_system_role) {
      alert('System roles cannot be deleted.');
      return;
    }

    try {
      const usage = await checkRoleUsage(role.id);
      if (usage.isUsed) {
        alert(`Cannot delete this role as it is being used by ${usage.usageCount} user(s).`);
        return;
      }
      setSelectedRole(role);
      setIsDeleteModalOpen(true);
    } catch (error) {
      // Error handling
    }
  };

  const handleToggleStatus = async (role: UserRole) => {
    try {
      await toggleRoleStatus(role.id);
    } catch (error) {
      // Error handling
    }
  };

  const handleFormSubmit = async (roleData: any) => {
    try {
      if (modalMode === 'create') {
        await createRole(roleData);
      } else if (selectedRole) {
        await updateRole(selectedRole.id, roleData);
      }
      setIsModalOpen(false);
      setSelectedRole(null);
    } catch (error) {
      // Error handling
    }
  };

  const handleFormCancel = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRole) return;
    
    try {
      await deleteRole(selectedRole.id);
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
    } catch (error) {
      // Error handling
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      label: 'Role Name',
      header: 'Role Name',
      sortable: true,
      render: (role: UserRole) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{role.name}</div>
            {role.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {role.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'permissions',
      label: 'Permissions',
      header: 'Permissions',
      sortable: false,
      render: (role: UserRole) => (
        <div className="text-sm text-gray-900">
          {formatRolePermissions(role)}
        </div>
      )
    },
    {
      key: 'user_count',
      label: 'Users',
      header: 'Users',
      sortable: true,
      render: (role: UserRole) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{role.user_count || 0}</span>
        </div>
      )
    },
    {
      key: 'is_system_role',
      label: 'Type',
      header: 'Type',
      sortable: true,
      render: (role: UserRole) => (
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
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      header: 'Status',
      sortable: true,
      render: (role: UserRole) => (
        <StatusBadge
          status={role.is_active ? 'active' : 'inactive'}
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      header: 'Actions',
      sortable: false,
      render: (role: UserRole) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(role)}
            title="View role details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {canEdit && !role.is_system_role && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(role)}
              title="Edit role"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(role)}
              title={role.is_active ? "Deactivate" : "Activate"}
              disabled={isTogglingStatus}
            >
              {role.is_active ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {canDelete && !role.is_system_role && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(role)}
              title="Delete role"
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
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalRoles || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.activeRoles || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.systemRoles || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Custom Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.customRoles || 0}
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
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <Select
                value={filters.is_active}
                onChange={(e) => handleFilter('is_active', e.target.value)}
                className="min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </Select>

              <Select
                value={filters.is_system_role}
                onChange={(e) => handleFilter('is_system_role', e.target.value)}
                className="min-w-[140px]"
              >
                <option value="">All Types</option>
                <option value="true">System Roles</option>
                <option value="false">Custom Roles</option>
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/users');
                }}
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
            data={roles}
            columns={columns}
            emptyMessage="No roles found"
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
            title={modalMode === 'create' ? 'Create Role' : 'Edit Role'}
            size="2xl"
          >
            <UserRoleForm
              role={selectedRole}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isCreating || isUpdating}
              availablePermissions={availablePermissions || []}
            />
          </Modal>
        )}

        {isViewModalOpen && selectedRole && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title="Role Details"
            size="2xl"
          >
            <UserRoleView
              role={selectedRole}
              onClose={() => setIsViewModalOpen(false)}
              onEdit={canEdit && !selectedRole.is_system_role ? () => handleEdit(selectedRole) : undefined}
              onDelete={canDelete && !selectedRole.is_system_role ? () => handleDelete(selectedRole) : undefined}
              onToggleStatus={canEdit ? () => handleToggleStatus(selectedRole) : undefined}
            />
          </Modal>
        )}

        {isDeleteModalOpen && selectedRole && (
          <ConfirmDialog
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete Role"
            message={`Are you sure you want to delete the role "${selectedRole.name}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
            isLoading={isDeleting}
          />
        )}
      </div>

      {/* Floating Action Button */}
      {canCreate && (
        <button
          onClick={handleCreate}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
          title="Add New Role"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </ContentContainer>
  );
};

export default UserRoles;
