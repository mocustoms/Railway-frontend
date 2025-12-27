import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  X, 
  FileSpreadsheet,
  FileText,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Package
} from 'lucide-react';
import { useProductModelManagement } from '../hooks/useProductModelManagement';
import { productModelModuleConfig } from '../data/productModelModules';
import { ProductModel } from '../types/productModel';
import productModelService from '../services/productModelService';
import ContentContainer from '../components/ContentContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/formatters';
import './ProductModels.css';

// Utility function to get the correct upload URL
const getUploadUrl = (path: string): string => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  // Remove '/api' from the base URL to get the server base URL
  const serverBaseUrl = baseUrl.replace('/api', '');
  return `${serverBaseUrl}${path}`;
};

const ProductModels: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProductModel, setSelectedProductModel] = useState<ProductModel | null>(null);
  const [editingProductModel, setEditingProductModel] = useState<ProductModel | null>(null);
  const [usageData, setUsageData] = useState<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  } | null>(null);

  const {
    // Data
    productModels,
    stats,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    
    // Loading states
    isLoadingProductModels,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isDeactivating,
    isCheckingUsage,
    
    // Errors
    statsError,
    
    // Filters and search
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortConfig,
    setSortConfig,
    
    // Pagination
    setCurrentPage,
    setPageSize,
    
    // Actions
    handleCreate,
    handleUpdate,
    handleDelete,
    handleCheckUsage,
    handleDeactivate,
    handleExportExcel,
    handleExportPdf,
    
    // Permissions
    canCreate,
    canEdit,
    canDelete,
    canView
  } = useProductModelManagement();

  // Computed values
  const showingStart = useMemo(() => {
    if (totalItems === 0) return 0;
    return (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);
  const showingEnd = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  // Table sort handler
  const handleTableSort = (column: string, direction: 'asc' | 'desc') => {
    setSortConfig({ field: column, direction });
  };

  // Modal handlers
  const openAddModal = () => {
    setEditingProductModel(null);
    setIsModalOpen(true);
  };

  const openEditModal = (productModel: ProductModel) => {
    setEditingProductModel(productModel);
    setIsModalOpen(true);
  };

  const openViewModal = (productModel: ProductModel) => {
    setSelectedProductModel(productModel);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = async (productModel: ProductModel) => {
    try {
      const usage = await handleCheckUsage(productModel.id);
      setUsageData(usage);
      setSelectedProductModel(productModel);
      setIsDeleteModalOpen(true);
    } catch (error) {
      }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProductModel(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedProductModel(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedProductModel(null);
    setUsageData(null);
  };

  // Form submission handler
  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingProductModel) {
        await handleUpdate(editingProductModel.id, formData);
      } else {
        await handleCreate(formData);
      }
      closeModal();
    } catch (error) {
      }
  };

  // Delete confirmation handler
  const handleDeleteConfirm = async () => {
    if (!selectedProductModel) return;

    try {
      if (usageData?.isUsed) {
        await handleDeactivate(selectedProductModel.id);
      } else {
        await handleDelete(selectedProductModel.id);
      }
      closeDeleteModal();
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  };

  // Table columns configuration
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Model Name',
      render: (row: ProductModel) => (
        <div className="flex items-center space-x-3">
          {row.logo && (
            <img 
              src={getUploadUrl(row.logo)} 
              alt={row.name} 
              className="w-8 h-8 rounded object-cover"
            />
          )}
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'code',
      header: 'Model Code',
      render: (row: ProductModel) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {row.code}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'description',
      header: 'Description',
      render: (row: ProductModel) => (
        <span className="text-gray-600">
          {row.description || '-'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row: ProductModel) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
      defaultVisible: true
    },
    {
      key: 'created_by_name',
      header: 'Created By',
      render: (row: ProductModel) => (
        <span className="text-gray-600">{row.created_by_name || '-'}</span>
      ),
      defaultVisible: false
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (row: ProductModel) => (
        <span className="text-gray-600">
          {formatDate(row.created_at || row.createdAt)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'updated_by_name',
      header: 'Updated By',
      render: (row: ProductModel) => (
        <span className="text-gray-600">{row.updated_by_name || '-'}</span>
      ),
      defaultVisible: true
    },
    {
      key: 'updated_at',
      header: 'Updated Date',
      render: (row: ProductModel) => (
        <span className="text-gray-600">
          {formatDate(row.updated_at || row.updatedAt)}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: ProductModel) => (
        <div className="flex items-center gap-2">
          {canView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openViewModal(row)}
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(row)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteModal(row)}
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
  ], [canView, canEdit, canDelete]);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Models</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalProductModels || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Models</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.activeProductModels || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <Package className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Inactive Models</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : stats?.inactiveProductModels || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                <Package className="w-5 h-5 text-red-600" />
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
              placeholder="Search models by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
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
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105"
              >
                <FileText size={16} className="mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Product Models Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoadingProductModels ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading product models...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={productModels}
                columns={columns}
                emptyMessage="No product models found matching your criteria."
                showColumnControls={true}
                onSort={handleTableSort}
                sortable={true}
                maxHeight={600}
              />

              {/* Pagination Controls */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 animate-fadeIn">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="pageSizeSelect" className="text-sm text-gray-700">Show</label>
                    <select
                      id="pageSizeSelect"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
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
                    onClick={() => setCurrentPage(currentPage - 1)}
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
                        onClick={() => setCurrentPage(page)}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingProductModel ? 'Edit Product Model' : 'Add Product Model'}
          size="lg"
        >
          <ProductModelForm
            productModel={editingProductModel}
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
            isLoading={isCreating || isUpdating}
          />
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
          title="View Product Model"
          size="lg"
        >
          <ProductModelView
            productModel={selectedProductModel}
            onClose={closeViewModal}
            onEdit={() => {
              closeViewModal();
              if (selectedProductModel) {
                openEditModal(selectedProductModel);
              }
            }}
            canEdit={canEdit}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          title="Delete Product Model"
          message={
            usageData?.isUsed
              ? `This product model is used by ${usageData.usageCount} product(s). Would you like to deactivate it instead?`
              : `Are you sure you want to delete "${selectedProductModel?.name}"? This action cannot be undone.`
          }
          confirmText={usageData?.isUsed ? "Deactivate" : "Delete"}
          cancelText="Cancel"
          variant={usageData?.isUsed ? "warning" : "danger"}
          isLoading={isDeleting || isDeactivating}
        />

        {/* Floating Action Button (FAB) */}
        {canCreate && (
          <button
            onClick={openAddModal}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Add Product Model"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </ContentContainer>
    </div>
  );
};

// Product Model Form Component
const ProductModelForm: React.FC<{
  productModel?: ProductModel | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ productModel, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: productModel?.name || '',
    description: productModel?.description || '',
    is_active: productModel?.is_active ?? true,
    logo: productModel?.logo || ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(
    productModel?.logo ? getUploadUrl(productModel.logo) : ''
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Update logo preview when productModel changes
  useEffect(() => {
    if (productModel?.logo) {
      setLogoPreview(getUploadUrl(productModel.logo));
    } else {
      setLogoPreview('');
    }
  }, [productModel?.logo]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData({ ...formData, logo: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalFormData = { ...formData };
    
    // Upload logo if a new file is selected
    if (logoFile) {
      try {
        setIsUploadingLogo(true);
        const uploadResponse = await productModelService.uploadLogo(logoFile);
        finalFormData.logo = uploadResponse.logo;
        } catch (error) {
        // Continue with form submission even if logo upload fails
      } finally {
        setIsUploadingLogo(false);
      }
    }
    
    onSubmit(finalFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Model Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter model name"
          />
        </div>

        {/* Model Code - Display only when editing */}
        {productModel && (
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Model Code
            </label>
            <input
              type="text"
              id="code"
              value={productModel.code}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              disabled
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter model description"
        />
      </div>

      {/* Logo Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model Logo
        </label>
        <div className="space-y-4">
          {/* Logo Preview */}
          {logoPreview && (
            <div className="flex items-center space-x-4">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-16 h-16 rounded-lg object-cover border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove Logo
              </button>
            </div>
          )}
          
          {/* Logo Upload Input */}
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="logo"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <label
              htmlFor="logo"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
            >
              <Package className="w-4 h-4 mr-2" />
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </label>
            {logoPreview && (
              <span className="text-sm text-gray-500">
                Logo will be uploaded when you save the model
              </span>
            )}
          </div>
          
          {/* Upload Instructions */}
          <p className="text-xs text-gray-500">
            Supported formats: JPG, PNG, GIF. Maximum size: 5MB. Logo will be automatically resized to 256x256 pixels.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          id="is_active"
          value={formData.is_active.toString()}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || isUploadingLogo}
          className="flex items-center space-x-2"
        >
          {(isLoading || isUploadingLogo) && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          <span>
            {isUploadingLogo ? 'Uploading Logo...' : (productModel ? 'Update' : 'Create')}
          </span>
        </Button>
      </div>
    </form>
  );
};

// Product Model View Component
const ProductModelView: React.FC<{
  productModel: ProductModel | null;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
}> = ({ productModel, onClose, onEdit, canEdit }) => {
  if (!productModel) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Model Name</label>
          <p className="text-lg font-semibold text-gray-900">{productModel.name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Model Code</label>
          <p className="text-lg font-mono text-gray-900">{productModel.code}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
          <StatusBadge status={productModel.is_active ? 'active' : 'inactive'} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
          <p className="text-gray-900">{productModel.created_by_name || '-'}</p>
        </div>
      </div>

             <div>
         <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
         <p className="text-gray-900">{productModel.description || 'No description provided'}</p>
       </div>

       {productModel.logo && (
         <div>
           <label className="block text-sm font-medium text-gray-500 mb-1">Model Logo</label>
           <div className="flex items-center space-x-4">
             <img
               src={getUploadUrl(productModel.logo)}
               alt={productModel.name}
               className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
             />
             <div className="text-sm text-gray-500">
               <p>Logo uploaded successfully</p>
               <p>Size: 256x256 pixels</p>
             </div>
           </div>
         </div>
       )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Created Date</label>
          <p className="text-gray-900">
            {formatDate(productModel.created_at || productModel.createdAt)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
          <p className="text-gray-900">
            {formatDate(productModel.updated_at || productModel.updatedAt)}
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {canEdit && (
          <Button onClick={onEdit}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductModels;
