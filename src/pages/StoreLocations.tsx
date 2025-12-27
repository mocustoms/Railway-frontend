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
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { useStoreLocationManagement } from '../hooks/useStoreLocationManagement';
import { StoreLocation } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import StoreLocationForm from '../components/StoreLocationForm';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import './StoreLocations.css';

const StoreLocationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    // Data
    storeLocations,
    stats,
    stores,
    packagingTypes,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isLoadingStores,
    isLoadingPackagingTypes,
    isCreating,
    isUpdating,
    isDeleting,
    isDeactivating,
    isCheckingUsage,
    
    // Errors
    error,
    statsError,
    
    // Handlers
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    createStoreLocation,
    updateStoreLocation,
    deleteStoreLocation,
    handleCheckUsage,
    handleDeactivate,
    exportToExcel,
    exportToPDF,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canExport,
    
    // State
    filters
  } = useStoreLocationManagement();

  // Computed values for pagination display
  const showingStart = useMemo(() => {
    if (totalItems === 0) return 0;
    return (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);
  
  const showingEnd = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStoreLocation, setSelectedStoreLocation] = useState<StoreLocation | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [usageData, setUsageData] = useState<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  } | null>(null);

  // Handlers
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedStoreLocation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (storeLocation: StoreLocation) => {
    setModalMode('edit');
    setSelectedStoreLocation(storeLocation);
    setIsModalOpen(true);
  };

  const handleView = (storeLocation: StoreLocation) => {
    setSelectedStoreLocation(storeLocation);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = async (storeLocation: StoreLocation) => {
    try {
      const usage = await handleCheckUsage(storeLocation.id);
      setUsageData(usage);
      setSelectedStoreLocation(storeLocation);
      setIsDeleteModalOpen(true);
    } catch (error) {
      }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStoreLocation(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedStoreLocation(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStoreLocation) return;

    try {
      if (usageData?.isUsed) {
        await handleDeactivate(selectedStoreLocation.id);
      } else {
        await deleteStoreLocation(selectedStoreLocation.id);
      }
      setIsDeleteModalOpen(false);
      setSelectedStoreLocation(null);
      setUsageData(null);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (modalMode === 'edit' && selectedStoreLocation) {
        await updateStoreLocation(selectedStoreLocation.id, data);
        toast.success('Store location updated successfully');
      } else {
        await createStoreLocation(data);
        toast.success('Store location created successfully');
      }
      handleModalClose();
    } catch (error) {
      }
  };

  // Format packaging types for display
  const formatPackagingTypes = (packagingTypeIds: string[]) => {
    if (!packagingTypeIds || !Array.isArray(packagingTypeIds) || packagingTypeIds.length === 0) {
      return 'N/A';
    }
    
    const packagingNames = packagingTypeIds.map(id => {
      const packaging = packagingTypes.find(pkg => pkg.id === id);
      return packaging ? `${packaging.name} (${packaging.pieces} ${packaging.code})` : id;
    });
    
    return packagingNames.join(', ');
  };

  // Table columns configuration for DataTable
  const columns = useMemo(() => [
    {
      key: 'store_name',
      header: 'Store',
      render: (storeLocation: StoreLocation) => (
        <div>
          <div className="font-medium text-gray-900">{storeLocation.store_name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{storeLocation.location_code}</div>
        </div>
      ),
      defaultVisible: true,
      sortable: true
    },
    {
      key: 'location_name',
      header: 'Location Name',
      render: (storeLocation: StoreLocation) => (
        <span className="text-gray-900 font-medium">
          {storeLocation.location_name}
        </span>
      ),
      defaultVisible: true,
      sortable: true
    },
    {
      key: 'location_capacity',
      header: 'Capacity',
      render: (storeLocation: StoreLocation) => (
        <span className="text-gray-600">
          {storeLocation.location_capacity ? storeLocation.location_capacity.toLocaleString() : 'N/A'}
        </span>
      ),
      defaultVisible: true,
      sortable: true
    },
    {
      key: 'packaging_type',
      header: 'Packaging Type',
      render: (storeLocation: StoreLocation) => (
        <span className="text-gray-600 text-sm">
          {formatPackagingTypes(storeLocation.packaging_type)}
        </span>
      ),
      defaultVisible: true,
      sortable: false
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (storeLocation: StoreLocation) => (
        <StatusBadge 
          status={storeLocation.is_active ? 'active' : 'inactive'} 
        />
      ),
      defaultVisible: true,
      sortable: true
    },
    {
      key: 'created_by_name',
      header: 'Created By',
      render: (storeLocation: StoreLocation) => (
        <span className="text-gray-600">
          {storeLocation.created_by_name || '-'}
        </span>
      ),
      defaultVisible: false,
      sortable: false
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (storeLocation: StoreLocation) => (
        <span className="text-gray-600 text-sm">
          {formatDate(storeLocation.created_at)}
        </span>
      ),
      defaultVisible: false,
      sortable: true
    },
    {
      key: 'updated_by_name',
      header: 'Updated By',
      render: (storeLocation: StoreLocation) => (
        <span className="text-gray-600">
          {storeLocation.updated_by_name || '-'}
        </span>
      ),
      defaultVisible: false,
      sortable: false
    },
    {
      key: 'updated_at',
      header: 'Updated Date',
      render: (storeLocation: StoreLocation) => (
        <span className="text-gray-600 text-sm">
          {formatDate(storeLocation.updated_at)}
        </span>
      ),
      defaultVisible: false,
      sortable: true
    }
  ], [packagingTypes]);

  // Actions column
  const actionsColumn = {
    key: 'actions',
    header: 'Actions',
    render: (storeLocation: StoreLocation) => (
      <div className="flex items-center space-x-2">
        {canEdit && (
          <button
            onClick={() => handleView(storeLocation)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-150"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => handleEdit(storeLocation)}
            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors duration-150"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => openDeleteModal(storeLocation)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-150"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    ),
    defaultVisible: true,
    sortable: false
  };

  // Handle table sorting
  const handleTableSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    handleSort(key as keyof StoreLocation | 'created_at' | 'updated_at', direction);
  }, [handleSort]);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Locations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalLocations || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Locations</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.activeLocations || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Inactive Locations</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : stats?.inactiveLocations || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Last Updated</p>
                <p className="text-lg font-semibold text-purple-600">
                  {isLoadingStats ? '...' : stats?.lastUpdate || 'Never'}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-purple-100 rounded-full flex-shrink-0 ml-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
              placeholder="Search locations by name, code, or store..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {filters.search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-150"
                title="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Products
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
                  <button
                    onClick={exportToExcel}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105"
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
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading store locations...</span>
            </div>
          </div>
        ) : storeLocations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500">
              <MapPin className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No store locations found</p>
              <p className="text-sm">Try adjusting your search or create a new store location entry</p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
            <DataTable
              data={storeLocations}
              columns={[...columns, actionsColumn]}
              emptyMessage="No store locations found matching your criteria."
              showColumnControls={true}
              sortable={true}
              onSort={handleTableSort}
              maxHeight={600}
            />

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-100 transform hover:scale-105 ${
                          page === currentPage
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
          </div>
        )}

        {/* Floating Action Button */}
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors z-50 flex items-center justify-center"
            title="Add Store Location"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </ContentContainer>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={modalMode === 'create' ? 'Add Store Location' : 'Edit Store Location'}
        size="lg"
      >
        <StoreLocationForm
          storeLocation={selectedStoreLocation}
          stores={stores}
          packagingTypes={packagingTypes}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        title="Store Location Details"
        size="lg"
      >
        {selectedStoreLocation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Store</label>
                <p className="mt-1 text-sm text-gray-900">{selectedStoreLocation.store_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location Code</label>
                <p className="mt-1 text-sm text-gray-900">{selectedStoreLocation.location_code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedStoreLocation.location_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <p className="mt-1 text-sm text-gray-900">{selectedStoreLocation.location_capacity || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Packaging Type</label>
                <p className="mt-1 text-sm text-gray-900">{formatPackagingTypes(selectedStoreLocation.packaging_type)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">
                                     <StatusBadge 
                     status={selectedStoreLocation.is_active ? 'active' : 'inactive'}
                   />
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="mt-1 text-sm text-gray-900">{selectedStoreLocation.created_by_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedStoreLocation.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Updated By</label>
                <p className="mt-1 text-sm text-gray-900">{selectedStoreLocation.updated_by_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Updated Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedStoreLocation.updated_at)}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="secondary" onClick={handleViewModalClose}>
                Close
              </Button>
              {canEdit && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleViewModalClose();
                    handleEdit(selectedStoreLocation);
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Store Location"
        message={
          usageData?.isUsed
            ? `This store location is used by ${usageData.usageCount} product(s). Would you like to deactivate it instead?`
            : `Are you sure you want to delete the store location "${selectedStoreLocation?.location_name}"? This action cannot be undone.`
        }
        confirmText={usageData?.isUsed ? "Deactivate" : "Delete"}
        cancelText="Cancel"
        variant={usageData?.isUsed ? "warning" : "danger"}
        isLoading={isDeleting || isDeactivating}
      />
    </div>
  );
};

export default StoreLocationsPage;
