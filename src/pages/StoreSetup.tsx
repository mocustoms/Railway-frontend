import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  MapPin,
  Phone,
  Mail,
  Building,
  Thermometer,
  Settings,
  Users,
  Package,
  Upload,
  ShoppingCart
} from 'lucide-react';
import { useStoreManagement } from '../hooks/useStoreManagement';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import StoreForm from '../components/StoreForm';
import StoreViewModal from '../components/StoreViewModal';
import ContentContainer from '../components/ContentContainer';
import { useConfirm } from '../hooks/useConfirm';

const StoreSetup: React.FC = () => {
  const navigate = useNavigate();
  const {
    // Data
    stores,
    storeStats,
    storeTypes,
    selectedStore,
    totalStores,
    totalPages,
    
    // State
    page,
    pageSize,
    searchTerm,
    sortConfig,
    filters,
    showFilters,
    showForm,
    showViewModal,
    
    // Loading states
    isLoading,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingStatus,
    
    // Permissions
    canView,
    canCreate,
    canEdit,
    canDelete,
    canToggleStatus,
    canImport,
    
    // Handlers
    handleSearch,
    handleSort,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleAddNew,
    handleEdit,
    handleView,
    handleDelete,
    handleToggleStatus,
    handleSubmit,
    handleCloseForm,
    handleCloseViewModal,
    handleExportExcel,
    handleExportPdf,
    handleImport,
    setShowFilters
  } = useStoreManagement();

  const handleBack = () => {
    navigate('/advance-setup');
  };
  
  // Custom confirmation hook
  const { confirm } = useConfirm();

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      header: 'Store Name',
      visible: true, // Required column
      render: (store: any) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{store.name}</div>
            <div className="text-sm text-gray-500">{store.store_type?.replace('_', ' ')}</div>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      visible: true, // Required column
      render: (store: any) => (
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900">{store.location}</span>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Contact',
      defaultVisible: true,
      render: (store: any) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900">{store.phone}</span>
          </div>
          {store.email && (
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{store.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'defaultCurrency',
      header: 'Currency',
      defaultVisible: true,
      render: (store: any) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            {store.defaultCurrency?.code || 'N/A'}
          </span>
          {store.defaultCurrency?.symbol && (
            <span className="text-xs text-gray-500">
              ({store.defaultCurrency.symbol})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'capabilities',
      header: 'Capabilities',
      defaultVisible: true,
      render: (store: any) => (
        <div className="flex flex-wrap gap-1">
          {store.is_manufacturing && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Building className="w-3 h-3 mr-1" />
              Manufacturing
            </span>
          )}
          {store.can_sale_products && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <ShoppingCart className="w-3 h-3 mr-1" />
              Can Sale
            </span>
          )}
          {store.is_storage_facility && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Package className="w-3 h-3 mr-1" />
              Storage
            </span>
          )}
          {store.has_temperature_control && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Thermometer className="w-3 h-3 mr-1" />
              Temp Control
            </span>
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      visible: true, // Required column
      render: (store: any) => (
        <StatusBadge
          status={store.is_active ? 'Active' : 'Inactive'}
          variant={store.is_active ? 'success' : 'error'}
        />
      )
    },
    {
      key: 'createdBy',
      header: 'Created By',
      defaultVisible: false, // Hidden by default
      render: (store: any) => (
        <div className="text-sm text-gray-900">
          {store.creator ? `${store.creator.first_name} ${store.creator.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      defaultVisible: false, // Hidden by default
      render: (store: any) => (
        <div className="text-sm text-gray-900">
          {store.createdAt ? new Date(store.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedBy',
      header: 'Updated By',
      defaultVisible: false, // Hidden by default
      render: (store: any) => (
        <div className="text-sm text-gray-900">
          {store.updater ? `${store.updater.first_name} ${store.updater.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      defaultVisible: false, // Hidden by default
      render: (store: any) => (
        <div className="text-sm text-gray-900">
          {store.updatedAt ? new Date(store.updatedAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true, // Required column
      render: (store: any) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleView(store)}
            className="text-gray-600 hover:text-gray-900 p-1"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {canEdit && (
            <button
              onClick={() => handleEdit(store)}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="Edit Store"
            >
              <Edit size={16} />
            </button>
          )}
          {canToggleStatus && (
            <button
              onClick={() => handleToggleStatus(store)}
              disabled={isTogglingStatus}
              className="text-yellow-600 hover:text-yellow-900 p-1 disabled:opacity-50"
              title={store.is_active ? 'Deactivate' : 'Activate'}
            >
              {store.is_active ? <PowerOff size={16} /> : <Power size={16} />}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(store)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
              title="Delete Store"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            You don't have permission to view store management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

             <ContentContainer>
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search stores by name, location, or phone..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all duration-150"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        {!isLoadingStats && storeStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Stores</p>
                  <p className="text-2xl font-bold text-gray-900">{storeStats.totalStores}</p>
                </div>
                <Store className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Stores</p>
                  <p className="text-2xl font-bold text-green-600">{storeStats.activeStores}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Manufacturing</p>
                  <p className="text-2xl font-bold text-purple-600">{storeStats.manufacturingStores}</p>
                </div>
                <Building className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage Facilities</p>
                  <p className="text-2xl font-bold text-orange-600">{storeStats.storageFacilities}</p>
                </div>
                <Package className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

                 {/* Table Controls */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <button
                 onClick={handleBack}
                 className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
               >
                 <ArrowLeft size={16} className="mr-2" />
                 Back to Advance Setup
               </button>
               
               <button
                 onClick={() => setShowFilters(!showFilters)}
                 className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
               >
                 {showFilters ? 'Hide' : 'Show'} Filters
               </button>
             </div>
             <div className="flex items-center space-x-3">
               <button
                 onClick={handleExportExcel}
                 className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
                 disabled={isLoading}
               >
                 <Download size={16} className="mr-2" />
                 Export Excel
               </button>
               
               <button
                 onClick={handleExportPdf}
                 className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105"
                 disabled={isLoading}
               >
                 <FileText size={16} className="mr-2" />
                 Export PDF
               </button>
             </div>
           </div>

          {/* Filters */}
          {showFilters && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Type
                  </label>
                  <select
                    value={filters.storeType || ''}
                    onChange={(e) => handleFilterChange({ storeType: e.target.value || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    {storeTypes?.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange({ status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capabilities
                  </label>
                  <select
                    value={filters.hasManufacturing ? 'manufacturing' : filters.hasStorage ? 'storage' : filters.hasTemperatureControl ? 'temp' : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFilterChange({
                        hasManufacturing: value === 'manufacturing' ? true : undefined,
                        hasStorage: value === 'storage' ? true : undefined,
                        hasTemperatureControl: value === 'temp' ? true : undefined
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Capabilities</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="storage">Storage Facility</option>
                    <option value="temp">Temperature Control</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

                 {/* Data Table */}
         <div className="bg-white rounded-lg border border-gray-200">
           <DataTable
             data={stores}
             columns={columns}
             emptyMessage="No stores found matching your criteria."
             showColumnControls={true}
             maxHeight={600}
           />
          
          {/* Inline Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalStores)} of {totalStores} stores
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded ${
                            page === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ContentContainer>

        {/* Floating Action Buttons */}
       {!showForm && (
         <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3">
           {/* Add Store FAB */}
           {canCreate && (
             <button
               onClick={handleAddNew}
               disabled={isCreating}
               className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
               title="Add New Store"
             >
               <Plus size={24} />
             </button>
           )}
         </div>
       )}

      {/* Store Form Modal */}
      {showForm && (
        <StoreForm
          store={selectedStore}
          storeTypes={storeTypes || []}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          isLoading={isCreating || isUpdating}
        />
      )}

      {/* Store View Modal */}
      {showViewModal && selectedStore && (
        <StoreViewModal
          store={selectedStore}
          onClose={handleCloseViewModal}
        />
      )}
    </div>
  );
};

export default StoreSetup; 