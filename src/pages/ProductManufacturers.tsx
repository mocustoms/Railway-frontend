import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Plus,
  FileText,
  FileSpreadsheet,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Factory,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react';
import { useProductManufacturerManagement } from '../hooks/useProductManufacturerManagement';
import { ProductManufacturer } from '../types';
import { productManufacturerModuleConfig } from '../data/productManufacturerModules';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ProductManufacturerForm from '../components/ProductManufacturerForm';
import ProductManufacturerView from '../components/ProductManufacturerView';
import ConfirmDialog from '../components/ConfirmDialog';

import ContentContainer from '../components/ContentContainer';

import { formatDate } from '../utils/formatters';
import './ProductManufacturers.css';

const ProductManufacturers: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const {
    manufacturers,
    stats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    isLoadingManufacturers,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isDeactivating,
    isCheckingUsage,
    isExportingExcel,
    isExportingPdf,
    handlePageChange,
    handlePageSizeChange,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDeactivate,
    handleCheckUsage,
    handleExportExcel,
    handleExportPdf,
    handleSearch,
    canCreate,
    canEdit,
    canDelete,
    canView,
    canExport,
    getLogoUrl,
    filters,
    searchTerm,
    manufacturersError,
    statsError
  } = useProductManufacturerManagement();

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
  const [selectedManufacturer, setSelectedManufacturer] = useState<ProductManufacturer | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [usageData, setUsageData] = useState<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  } | null>(null);

  // Handlers
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedManufacturer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (manufacturer: ProductManufacturer) => {
    setModalMode('edit');
    setSelectedManufacturer(manufacturer);
    setIsModalOpen(true);
  };

  const handleView = (manufacturer: ProductManufacturer) => {
    setSelectedManufacturer(manufacturer);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = async (manufacturer: ProductManufacturer) => {
    try {
      const usage = await handleCheckUsage(manufacturer.id);
      setUsageData(usage);
      setSelectedManufacturer(manufacturer);
      setIsDeleteModalOpen(true);
    } catch (error) {
      }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedManufacturer(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedManufacturer(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedManufacturer) return;

    try {
      if (usageData?.isUsed) {
        await handleDeactivate(selectedManufacturer.id);
      } else {
        await handleDelete(selectedManufacturer.id);
      }
      setIsDeleteModalOpen(false);
      setSelectedManufacturer(null);
      setUsageData(null);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  };

  const handleFormSubmit = async (data: Partial<ProductManufacturer>) => {
    try {
      if (modalMode === 'edit' && selectedManufacturer) {
        await handleUpdate(selectedManufacturer.id, data as any);
      } else {
        await handleCreate(data as any);
      }
      handleModalClose();
    } catch (error) {
      }
  };

       // Table columns configuration for DataTable
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Manufacturer Name',
      render: (manufacturer: ProductManufacturer) => (
        <div className="flex items-center gap-3">
          {manufacturer.logo && (
            <img 
              src={getLogoUrl(manufacturer.logo, manufacturer.updated_at)} 
              alt={`${manufacturer.name} logo`}
              className="w-8 h-8 rounded object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{manufacturer.name}</div>
            <div className="text-sm text-gray-500">{manufacturer.code}</div>
          </div>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'description',
      header: 'Description',
      render: (manufacturer: ProductManufacturer) => (
        <span className="text-gray-600">
          {manufacturer.description || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'website',
      header: 'Website',
      render: (manufacturer: ProductManufacturer) => (
        manufacturer.website ? (
          <a 
            href={manufacturer.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Globe size={14} />
            <span className="truncate max-w-32">Visit</span>
          </a>
        ) : '-'
      ),
      defaultVisible: false
    },
    {
      key: 'contact_email',
      header: 'Contact Email',
      render: (manufacturer: ProductManufacturer) => (
        manufacturer.contact_email ? (
          <a 
            href={`mailto:${manufacturer.contact_email}`}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Mail size={14} />
            <span className="truncate max-w-32">{manufacturer.contact_email}</span>
          </a>
        ) : '-'
      ),
      defaultVisible: true
    },
    {
      key: 'contact_phone',
      header: 'Contact Phone',
      render: (manufacturer: ProductManufacturer) => (
        manufacturer.contact_phone ? (
          <a 
            href={`tel:${manufacturer.contact_phone}`}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Phone size={14} />
            <span>{manufacturer.contact_phone}</span>
          </a>
        ) : '-'
      ),
      defaultVisible: true
    },
    {
      key: 'country',
      header: 'Country',
      render: (manufacturer: ProductManufacturer) => (
        manufacturer.country ? (
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-gray-400" />
            <span>{manufacturer.country}</span>
          </div>
        ) : '-'
      ),
      defaultVisible: false
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (manufacturer: ProductManufacturer) => (
        <StatusBadge 
          status={manufacturer.is_active ? 'active' : 'inactive'} 
        />
      ),
      defaultVisible: false
    },
         {
       key: 'created_by_name',
       header: 'Created By',
       render: (manufacturer: ProductManufacturer) => (
         <span className="text-gray-600">
           {manufacturer.created_by_name || '-'}
         </span>
       ),
       defaultVisible: false
     },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (manufacturer: ProductManufacturer) => (
        <span className="text-gray-600">
          {formatDate(manufacturer.created_at)}
        </span>
      ),
      defaultVisible: false
    },
         {
       key: 'updated_by_name',
       header: 'Updated By',
       render: (manufacturer: ProductManufacturer) => (
         <span className="text-gray-600">
           {manufacturer.updated_by_name || '-'}
         </span>
       ),
       defaultVisible: false
     },
    {
      key: 'updated_at',
      header: 'Updated Date',
      render: (manufacturer: ProductManufacturer) => (
        <span className="text-gray-600">
          {formatDate(manufacturer.updated_at)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (manufacturer: ProductManufacturer) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(manufacturer)}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(manufacturer)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteModal(manufacturer)}
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
  ], [canEdit, canDelete, getLogoUrl]);

    return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Manufacturers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalManufacturers || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <Factory className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Manufacturers</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.activeManufacturers || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <Factory className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Inactive Manufacturers</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : stats?.inactiveManufacturers || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                <Factory className="w-5 h-5 text-red-600" />
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
              placeholder="Search manufacturers by name, code, or description..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
              >
                <X size={16} />
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
                    onClick={handleExportExcel}
                    disabled={isExportingExcel}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
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

        {/* Enhanced Product Manufacturers Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoadingManufacturers ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading manufacturers...</span>
            </div>
          ) : (
            <>

              <DataTable
                data={manufacturers}
                columns={columns}
                emptyMessage="No manufacturers found matching your criteria."
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
                        onChange={(e) => {
                          handlePageSizeChange(Number(e.target.value));
                        }}
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
                      onClick={() => {
                        handlePageChange(currentPage - 1);
                      }}
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
                          onClick={() => {
                            handlePageChange(page);
                          }}
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
                      onClick={() => {
                        handlePageChange(currentPage + 1);
                      }}
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
          onClose={handleModalClose}
          title={modalMode === 'create' ? 'Add Product Manufacturer' : 'Edit Product Manufacturer'}
          size="lg"
        >
          <ProductManufacturerForm
            manufacturer={selectedManufacturer}
            onSubmit={handleFormSubmit}
            onCancel={handleModalClose}
            isLoading={isCreating || isUpdating}
          />
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={handleViewModalClose}
          title="View Product Manufacturer"
          size="lg"
        >
          {selectedManufacturer && (
            <ProductManufacturerView
              manufacturer={selectedManufacturer}
              onClose={handleViewModalClose}
              onEdit={() => {
                handleViewModalClose();
                handleEdit(selectedManufacturer);
              }}
              canEdit={canEdit}
              getLogoUrl={getLogoUrl}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Product Manufacturer"
          message={
            usageData?.isUsed
              ? `This manufacturer is used by ${usageData.usageCount} product(s). Would you like to deactivate it instead?`
              : `Are you sure you want to delete the product manufacturer "${selectedManufacturer?.name}"? This action cannot be undone.`
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
            title="Add Product Manufacturer"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </ContentContainer>
    </div>
  );
};

export default ProductManufacturers;
