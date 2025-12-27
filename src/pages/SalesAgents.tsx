import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X,
  Plus,
  FileText,
  FileSpreadsheet,
  Eye,
  Edit, 
  Trash2, 
  User,
  ArrowLeft,
  Filter,
  Clock
} from 'lucide-react';
import { useSalesAgentManagement } from '../hooks/useSalesAgentManagement';
import { SalesAgent } from '../types';
import { salesAgentService } from '../services/salesAgentService';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import SalesAgentForm from '../components/SalesAgentForm';
import SalesAgentView from '../components/SalesAgentView';
import SalesAgentPhoto from '../components/SalesAgentPhoto';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatDate } from '../utils/formatters';

import './SalesAgents.css';

const SalesAgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    salesAgents,
    stats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    isLoading,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isDeactivating,
    isCheckingUsage,
    
    error,
    statsError,
    
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    handleStatusFilter,
    createSalesAgent,
    updateSalesAgent,
    deleteSalesAgent,
    handleCheckUsage,
    handleDeactivate,
    exportToExcel,
    exportToPDF,
    
    canCreate,
    canEdit,
    canDelete,
    canExport,
    
    filters
  } = useSalesAgentManagement();

  const showingStart = useMemo(() => {
    if (totalItems === 0) return 0;
    return (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);
  
  const showingEnd = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSalesAgent, setSelectedSalesAgent] = useState<SalesAgent | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [usageData, setUsageData] = useState<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  } | null>(null);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedSalesAgent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (salesAgent: SalesAgent) => {
    setModalMode('edit');
    setSelectedSalesAgent(salesAgent);
    setIsModalOpen(true);
  };

  const openViewModal = (salesAgent: SalesAgent) => {
    setSelectedSalesAgent(salesAgent);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = async (salesAgent: SalesAgent) => {
    try {
      const usage = await handleCheckUsage(salesAgent.id);
      setUsageData(usage);
      setSelectedSalesAgent(salesAgent);
      setIsDeleteModalOpen(true);
    } catch (error) {
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSalesAgent(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedSalesAgent(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedSalesAgent(null);
    setUsageData(null);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (modalMode === 'create') {
        await createSalesAgent(data);
      } else if (modalMode === 'edit' && selectedSalesAgent) {
        await updateSalesAgent(selectedSalesAgent.id, data);
      }
      closeModal();
    } catch (error) {
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSalesAgent) return;

    try {
      if (usageData?.isUsed) {
        await handleDeactivate(selectedSalesAgent.id);
      } else {
        await deleteSalesAgent(selectedSalesAgent.id);
      }
      setIsDeleteModalOpen(false);
      setSelectedSalesAgent(null);
      setUsageData(null);
    } catch (error) {
    }
  };

  const columns = useMemo(() => [
    {
      key: 'agentNumber',
      header: 'Agent Number',
      render: (salesAgent: SalesAgent) => (
        <div className="flex items-center gap-3">
          <SalesAgentPhoto
            photo={salesAgent.photo}
            fullName={salesAgent.fullName}
            size="sm"
          />
          <div>
            <div className="font-medium text-gray-900">{salesAgent.agentNumber}</div>
            <div className="text-sm text-gray-500">{salesAgent.fullName}</div>
          </div>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'fullName',
      header: 'Full Name',
      render: (salesAgent: SalesAgent) => (
        <span className="text-gray-600">
          {salesAgent.fullName}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (salesAgent: SalesAgent) => (
        <StatusBadge 
          status={salesAgent.status} 
        />
      ),
      defaultVisible: true
    },
    {
      key: 'created_by_name',
      header: 'Created By',
      render: (salesAgent: SalesAgent) => (
        <span className="text-gray-600">
          {salesAgent.created_by_name || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (salesAgent: SalesAgent) => (
        <span className="text-gray-600">
          {formatDate(salesAgent.created_at)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'updated_by_name',
      header: 'Updated By',
      render: (salesAgent: SalesAgent) => (
        <span className="text-gray-600">
          {salesAgent.updated_by_name || salesAgent.created_by_name || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'updated_at',
      header: 'Updated Date',
      render: (salesAgent: SalesAgent) => (
        <span className="text-sm text-gray-600">
          {formatDate(salesAgent.updated_at)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'actions',
      header: 'Actions',
                    render: (salesAgent: SalesAgent) => (
        <div className="flex items-center space-x-2">
          <button
                          onClick={() => openViewModal(salesAgent)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
                        {canEdit && (
          <button
                            onClick={() => openEditModal(salesAgent)}
                            className="text-amber-600 hover:text-amber-800 transition-colors"
            title="Edit Agent"
          >
            <Edit className="h-4 w-4" />
          </button>
                        )}
                        {canDelete && (
          <button
                            onClick={() => openDeleteModal(salesAgent)}
                            className="text-red-600 hover:text-red-800 transition-colors"
            title="Delete Agent"
          >
            <Trash2 className="h-4 w-4" />
          </button>
                        )}
        </div>
      ),
      defaultVisible: true
    }
  ], [canEdit, canDelete]);

  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    handleSearch(value);
  }, [handleSearch]);

  const handleStatusFilterChange = useCallback((status: 'all' | 'active' | 'inactive') => {
    handleStatusFilter(status);
  }, [handleStatusFilter]);

  const handleTableSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    handleSort(key as keyof SalesAgent | 'created_at' | 'updated_at', direction);
  }, [handleSort]);

  if (error) {
    return (
      <ContentContainer>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-2">
            Error loading sales agents
          </div>
          <div className="text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred'}
          </div>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </ContentContainer>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      
      {/* Main Content */}
    <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalAgents || 0}
                </p>
        </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <User className="w-5 h-5 text-blue-600" />
        </div>
      </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
              <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Agents</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.activeAgents || 0}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <User className="w-5 h-5 text-green-600" />
              </div>
                </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Inactive Agents</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : stats?.inactiveAgents || 0}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                <User className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Last Updated</p>
                <p className="text-lg font-semibold text-purple-600">
                  {isLoadingStats ? '...' : stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full flex-shrink-0 ml-3">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
            <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
              <input
                type="text"
                placeholder="Search agents by name or number..."
                value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Status Filter */}
          <div className="mt-4 flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Enhanced Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/sales')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Sales
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={exportToExcel}
                    disabled={isLoading || totalItems === 0}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    disabled={isLoading || totalItems === 0}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText size={16} className="mr-2" />
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Sales Agents Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading sales agents...</span>
            </div>
          ) : (
            <>
        <DataTable
                data={salesAgents}
          columns={columns}
                emptyMessage="No sales agents found matching your criteria."
                onSort={handleTableSort}
          sortable={true}
                showColumnControls={true}
          maxHeight={600}
        />

              {/* Pagination Controls - Only show when there are items */}
              {totalItems > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 animate-fadeIn">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="pageSizeSelect" className="text-sm text-gray-700">Show</label>
                      <select
                        id="pageSizeSelect"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-100"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-700">items</span>
                    </div>
                    <span className="text-sm text-gray-700">
                      Showing {showingStart}-{showingEnd} of {totalItems}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (page > totalPages) return null;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-100 transform hover:scale-105 ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Add Sales Agent' : 'Edit Sales Agent'}
        size="lg"
      >
      <SalesAgentForm
          salesAgent={selectedSalesAgent || undefined}
        onSubmit={handleFormSubmit}
          onCancel={closeModal}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        title="Sales Agent Details"
        size="lg"
      >
        {selectedSalesAgent && (
          <SalesAgentView
            salesAgent={selectedSalesAgent}
            onEdit={() => {
              closeViewModal();
              openEditModal(selectedSalesAgent);
            }}
            onDelete={() => {
              closeViewModal();
              openDeleteModal(selectedSalesAgent);
            }}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Sales Agent"
        message={
          usageData?.isUsed
            ? `This sales agent is used by ${usageData.usageCount} transaction(s). Would you like to deactivate it instead?`
            : `Are you sure you want to delete the sales agent "${selectedSalesAgent?.fullName}"? This action cannot be undone.`
        }
        confirmText={usageData?.isUsed ? "Deactivate" : "Delete"}
        cancelText="Cancel"
        variant={usageData?.isUsed ? "warning" : "danger"}
        isLoading={isDeleting || isDeactivating}
      />

        {/* Floating Action Button (FAB) */}
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Add Sales Agent"
          >
            <Plus className="w-6 h-6" />
          </button>
      )}
    </ContentContainer>
    </div>
  );
};

export default SalesAgentsPage;
