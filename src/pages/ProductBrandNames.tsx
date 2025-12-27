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
  Tag,
  ArrowLeft,
  Filter,
  Tags,
  Building2
} from 'lucide-react';
import { useProductBrandNameManagement } from '../hooks/useProductBrandNameManagement';
import { ProductBrandName } from '../types';
import { getLogoUrl } from '../services/productBrandNameService';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ProductBrandNameForm from '../components/ProductBrandNameForm';
import ProductBrandNameView from '../components/ProductBrandNameView';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatDate } from '../utils/formatters';

import './ProductBrandNames.css';

const ProductBrandNamesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    // Data
    productBrandNames,
    stats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoading,
    isLoadingStats,
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
    handleStatusFilter,
    createProductBrandName,
    updateProductBrandName,
    deleteProductBrandName,
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
  } = useProductBrandNameManagement();

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
  const [selectedProductBrandName, setSelectedProductBrandName] = useState<ProductBrandName | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [usageData, setUsageData] = useState<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  } | null>(null);

  // Handlers
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedProductBrandName(null);
    setIsModalOpen(true);
  };

  const openEditModal = (productBrandName: ProductBrandName) => {
    setModalMode('edit');
    setSelectedProductBrandName(productBrandName);
    setIsModalOpen(true);
  };

  const openViewModal = (productBrandName: ProductBrandName) => {
    setSelectedProductBrandName(productBrandName);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = async (productBrandName: ProductBrandName) => {
    try {
      const usage = await handleCheckUsage(productBrandName.id);
      setUsageData(usage);
      setSelectedProductBrandName(productBrandName);
      setIsDeleteModalOpen(true);
    } catch (error) {
      }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProductBrandName(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedProductBrandName(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedProductBrandName(null);
    setUsageData(null);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (modalMode === 'create') {
        await createProductBrandName(data);
      } else if (modalMode === 'edit' && selectedProductBrandName) {
        await updateProductBrandName(selectedProductBrandName.id, data);
      }
      closeModal();
    } catch (error) {
      }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProductBrandName) return;

    try {
      if (usageData?.isUsed) {
        await handleDeactivate(selectedProductBrandName.id);
      } else {
        await deleteProductBrandName(selectedProductBrandName.id);
      }
      setIsDeleteModalOpen(false);
      setSelectedProductBrandName(null);
      setUsageData(null);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  };

  // Table columns configuration for DataTable
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Brand Name',
      render: (productBrandName: ProductBrandName) => (
        <div className="flex items-center gap-3">
          {productBrandName.logo && (
            <img 
              src={getLogoUrl(productBrandName.logo)} 
              alt={`${productBrandName.name} logo`}
              className="w-8 h-8 rounded object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{productBrandName.name}</div>
            <div className="text-sm text-gray-500">{productBrandName.code}</div>
          </div>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'description',
      header: 'Description',
      render: (productBrandName: ProductBrandName) => (
        <span className="text-gray-600">
          {productBrandName.description || '-'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (productBrandName: ProductBrandName) => (
        <StatusBadge 
          status={productBrandName.is_active ? 'active' : 'inactive'} 
        />
      ),
      defaultVisible: true
    },
    {
      key: 'created_by_name',
      header: 'Created By',
      render: (productBrandName: ProductBrandName) => (
        <span className="text-gray-600">
          {productBrandName.created_by_name || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (productBrandName: ProductBrandName) => (
        <span className="text-gray-600">
          {formatDate(productBrandName.created_at || productBrandName.createdAt)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'updated_by_name',
      header: 'Updated By',
      render: (productBrandName: ProductBrandName) => (
        <span className="text-gray-600">
          {productBrandName.updated_by_name || productBrandName.created_by_name || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'updated_at',
      header: 'Updated Date',
      render: (productBrandName: ProductBrandName) => (
        <span className="text-sm text-gray-600">
          {formatDate(productBrandName.updated_at || productBrandName.updatedAt)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (productBrandName: ProductBrandName) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openViewModal(productBrandName)}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(productBrandName)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteModal(productBrandName)}
              title="Delete"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      defaultVisible: true
    }
  ], [canEdit, canDelete]);

  // Handle search with debouncing
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    handleSearch(value);
  }, [handleSearch]);

  // Handle status filter
  const handleStatusFilterChange = useCallback((status: 'all' | 'active' | 'inactive') => {
    handleStatusFilter(status);
  }, [handleStatusFilter]);

  // Handle sort for DataTable component
  const handleTableSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    handleSort(key as keyof ProductBrandName | 'created_at' | 'updated_at');
  }, [handleSort]);

  if (error) {
    return (
      <ContentContainer>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-2">
            Error loading product brand names
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
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Brand Names</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalBrandNames || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Tags className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeBrandNames || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Tag className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.inactiveBrandNames || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Update</p>
                <p className="text-lg font-semibold text-gray-900">{stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search brand names by name, code, or description..."
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
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filters.status}
                onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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

        {/* Enhanced Product Brand Names Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading brand names...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={productBrandNames}
                columns={columns}
                emptyMessage="No brand names found matching your criteria."
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
        title={modalMode === 'create' ? 'Add Product Brand Name' : 'Edit Product Brand Name'}
        size="lg"
      >
        <ProductBrandNameForm
          productBrandName={selectedProductBrandName || undefined}
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        title="Product Brand Name Details"
        size="lg"
      >
        {selectedProductBrandName && (
          <ProductBrandNameView
            productBrandName={selectedProductBrandName}
            onEdit={() => {
              closeViewModal();
              openEditModal(selectedProductBrandName);
            }}
            onDelete={() => {
              closeViewModal();
              openDeleteModal(selectedProductBrandName);
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
        title="Delete Product Brand Name"
        message={
          usageData?.isUsed
            ? `This brand name is used by ${usageData.usageCount} product(s). Would you like to deactivate it instead?`
            : `Are you sure you want to delete the product brand name "${selectedProductBrandName?.name}"? This action cannot be undone.`
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
            title="Add Product Brand Name"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </ContentContainer>
    </div>
  );
};

export default ProductBrandNamesPage;
