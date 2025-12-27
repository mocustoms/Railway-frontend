import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Download, 
  FileText, 
  Eye,
  Edit,
  Trash2,
  Star,
  CreditCard,
  Settings,
  ArrowLeft,
  Filter,
  CheckCircle,
  XCircle,
  DollarSign,
  X
} from 'lucide-react';
import DataTable from '../components/DataTable';
import ContentContainer from '../components/ContentContainer';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import LoyaltyCardForm from '../components/LoyaltyCardForm';
import LoyaltyCardView from '../components/LoyaltyCardView';
import { useLoyaltyCardManagement } from '../hooks/useLoyaltyCardManagement';
import { LoyaltyCardConfig } from '../services/loyaltyCardService';

const LoyaltyCards: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    loyaltyCards,
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
    isSettingDefault,
    isExportingExcel,
    isExportingPdf,
    error,
    statsError,
    handleSearch,
    handleStatusFilter,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    createLoyaltyCard,
    updateLoyaltyCard,
    deleteLoyaltyCard,
    setDefaultLoyaltyCard,
    exportToExcel,
    exportToPDF,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    filters
  } = useLoyaltyCardManagement();

  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<LoyaltyCardConfig | null>(null);

  const openCreateModal = () => {
    setSelectedConfig(null);
    setShowForm(true);
  };

  const openEditModal = (config: LoyaltyCardConfig) => {
    setSelectedConfig(config);
    setShowForm(true);
  };

  const openViewModal = (config: LoyaltyCardConfig) => {
    setSelectedConfig(config);
    setShowView(true);
  };

  const openDeleteModal = (config: LoyaltyCardConfig) => {
    setSelectedConfig(config);
    setShowDeleteModal(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedConfig(null);
  };

  const closeView = () => {
    setShowView(false);
    setSelectedConfig(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedConfig(null);
  };

  // Action handlers
  const handleFormSubmit = async (data: any) => {
    if (selectedConfig) {
      await updateLoyaltyCard(selectedConfig.id, data);
    } else {
      await createLoyaltyCard(data);
    }
    closeForm();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConfig) return;

    try {
      await deleteLoyaltyCard(selectedConfig.id);
      closeDeleteModal();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSetDefault = (configId: string) => {
    setDefaultLoyaltyCard(configId);
  };

  const handleTableSort = (key: string, direction: 'asc' | 'desc') => {
    handleSort(key as any, direction);
  };

  const columns = [
    {
      key: 'loyalty_card_name',
      header: 'Card Name',
      sortable: true,
      render: (config: LoyaltyCardConfig) => (
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: config.card_color || '#FFD700' }}
          />
          <span className="font-medium text-gray-900">{config.loyalty_card_name}</span>
        </div>
      )
    },
    {
      key: 'loyalty_card_code',
      header: 'Card Code',
      sortable: true,
      render: (config: LoyaltyCardConfig) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {config.loyalty_card_code}
          </span>
      )
    },
    {
      key: 'entrance_points',
      header: 'Entrance Points',
      sortable: true,
      render: (config: LoyaltyCardConfig) => (
        <span className="text-gray-600">
          {config.entrance_points}
            </span>
      )
    },
    {
      key: 'redemption_rate',
      header: 'Redemption Rate',
      sortable: true,
      render: (config: LoyaltyCardConfig) => (
        <span className="text-gray-600">
            {config.redemption_rate || 100}%
        </span>
      )
    },
    {
      key: 'sales_settings',
      header: 'Sales Settings',
      render: (config: LoyaltyCardConfig) => (
        <div className="flex items-center space-x-2">
          {config.allow_gaining_cash_sales && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <DollarSign className="h-3 w-3 mr-1" />
              Cash
            </span>
          )}
          {config.allow_gaining_credit_sales && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <CreditCard className="h-3 w-3 mr-1" />
              Credit
            </span>
          )}
        </div>
      )
    },
    {
      key: 'is_default',
      header: 'Default',
      render: (config: LoyaltyCardConfig) => (
        config.is_default ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Default
        </span>
        ) : (
          <span className="text-gray-400">No</span>
        )
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (config: LoyaltyCardConfig) => (
        <StatusBadge status={config.is_active ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'created_by_name',
      header: 'Created By',
      sortable: true,
      render: (config: LoyaltyCardConfig) => (
        <div className="text-sm text-gray-600">
          <div className="font-medium">{config.created_by_name || 'System'}</div>
          <div className="text-xs text-gray-500">
            {config.created_at ? new Date(config.created_at).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'updated_by_name',
      header: 'Updated By',
      sortable: true,
      render: (config: LoyaltyCardConfig) => (
        <div className="text-sm text-gray-600">
          <div className="font-medium">{config.updated_by_name || 'Never'}</div>
          <div className="text-xs text-gray-500">
            {config.updated_at ? new Date(config.updated_at).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (config: LoyaltyCardConfig) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openViewModal(config)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canEdit && (
          <button
            onClick={() => openEditModal(config)}
              className="text-amber-600 hover:text-amber-800 transition-colors"
            title="Edit Configuration"
          >
            <Edit className="h-4 w-4" />
          </button>
          )}
          {!config.is_default && canEdit && (
            <button
              onClick={() => handleSetDefault(config.id)}
              className="text-green-600 hover:text-green-800 transition-colors"
              title="Set as Default"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
          <button
            onClick={() => openDeleteModal(config)}
              className="text-red-600 hover:text-red-800 transition-colors"
            title="Delete Configuration"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Configurations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats.totalConfigs}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Configurations</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats.activeConfigs}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Inactive Configurations</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : stats.inactiveConfigs}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Default Configurations</p>
                <p className="text-lg font-semibold text-purple-600">
                  {isLoadingStats ? '...' : stats.defaultConfigs}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full flex-shrink-0 ml-3">
                <Star className="w-5 h-5 text-purple-600" />
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
              placeholder="Search configurations by name, code, or color..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
                />
            {filters.search && (
                  <button
                onClick={() => handleSearch('')}
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
              onChange={(e) => handleStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
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
                    disabled={isExportingExcel}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                </button>
                <button
                    onClick={exportToPDF}
                    disabled={isExportingPdf}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                </button>
                </>
              )}
              </div>
              </div>
        </div>

        {/* Enhanced Loyalty Card Configurations Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading loyalty card configurations...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={loyaltyCards}
                columns={columns}
                onSort={handleTableSort}
                sortable={true}
                showColumnControls={true}
                emptyMessage="No loyalty card configurations found matching your criteria."
                maxHeight={600}
              />
            </>
          )}
        </div>

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
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                  <option value={100}>100</option>
                    </select>
                <span className="text-sm text-gray-700">items</span>
                  </div>
              <span className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
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
                disabled={currentPage >= totalPages}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                    >
                      Next
                    </button>
                  </div>
                </div>
          )}
      </ContentContainer>

      {/* Floating Action Button */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="Add New Configuration"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modals */}
      {showForm && (
        <LoyaltyCardForm
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          initialData={selectedConfig || undefined}
          isLoading={isCreating || isUpdating}
          title={selectedConfig ? 'Edit Loyalty Card Configuration' : 'Create Loyalty Card Configuration'}
        />
      )}

      {showView && selectedConfig && (
        <LoyaltyCardView
          isOpen={showView}
          onClose={closeView}
          loyaltyCard={selectedConfig}
        />
      )}

      {showDeleteModal && selectedConfig && (
        <ConfirmDialog
          isOpen={showDeleteModal}
          title="Delete Configuration"
          message={`Are you sure you want to delete "${selectedConfig.loyalty_card_name}"? This action cannot be undone.`}
          confirmText="Delete Configuration"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onClose={closeDeleteModal}
        />
      )}
            </div>
  );
};

export default LoyaltyCards;