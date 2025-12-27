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
  Palette
} from 'lucide-react';
import { useProductColorManagement } from '../hooks/useProductColorManagement';
import { ProductColor } from '../types';
import { productColorModuleConfig, productColorStatusConfig } from '../data/productColorModules';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ProductColorForm from '../components/ProductColorForm';
import ProductColorView from '../components/ProductColorView';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatDate } from '../utils/formatters';
import './ProductColors.css';

const ProductColors: React.FC = () => {
  const navigate = useNavigate();
  const {
    productColors,
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
    error,
    statsError,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    createProductColor,
    updateProductColor,
    deleteProductColor,
    exportToExcel,
    exportToPDF,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    filters
  } = useProductColorManagement();

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProductColor, setSelectedProductColor] = useState<ProductColor | null>(null);
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
    setSelectedProductColor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (productColor: ProductColor) => {
    setModalMode('edit');
    setSelectedProductColor(productColor);
    setIsModalOpen(true);
  };

  const handleView = (productColor: ProductColor) => {
    setSelectedProductColor(productColor);
    setIsViewModalOpen(true);
  };

  const handleDelete = (productColor: ProductColor) => {
    setSelectedProductColor(productColor);
    setIsDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProductColor(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedProductColor(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProductColor) {
      try {
        await deleteProductColor(selectedProductColor.id);
        setIsDeleteModalOpen(false);
        setSelectedProductColor(null);
      } catch (error) {
        }
    }
  };

  const handleFormSubmit = async (data: Partial<ProductColor>) => {
    try {
      if (modalMode === 'create') {
        await createProductColor(data);
      } else if (selectedProductColor) {
        await updateProductColor(selectedProductColor.id, data);
      }
      handleModalClose();
    } catch (error) {
      }
  };

  // Table columns configuration for DataTable
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Color Name',
      render: (productColor: ProductColor) => (
        <div className="flex items-center gap-3">
          <div 
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: productColor.hex_code }}
            title={productColor.hex_code}
          />
          <span className="font-medium text-gray-900">{productColor.name}</span>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'code',
      header: 'Color Code',
      render: (productColor: ProductColor) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {productColor.code}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'hex_code',
      header: 'Color Preview',
      render: (productColor: ProductColor) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded border border-gray-300"
            style={{ backgroundColor: productColor.hex_code }}
            title={productColor.hex_code}
          />
          <span className="text-sm text-gray-600 font-mono">
            {productColor.hex_code}
          </span>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'description',
      header: 'Description',
      render: (productColor: ProductColor) => (
        <span className="text-gray-600">
          {productColor.description || '-'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (productColor: ProductColor) => {
        const status = productColor.is_active ? 'active' : 'inactive';
        return (
          <StatusBadge 
            status={status}
            config={productColorStatusConfig}
          />
        );
      },
      defaultVisible: true
    },
    {
      key: 'created_by_name',
      header: 'Created By',
      render: (productColor: ProductColor) => (
        <span className="text-gray-600">
          {productColor.created_by_name || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (productColor: ProductColor) => (
        <span className="text-gray-600">
          {formatDate(productColor.created_at || productColor.createdAt)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'updated_by_name',
      header: 'Updated By',
      render: (productColor: ProductColor) => (
        <span className="text-gray-600">
          {productColor.updated_by_name || '-'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'updated_at',
      header: 'Updated Date',
      render: (productColor: ProductColor) => (
        <span className="text-gray-600">
          {formatDate(productColor.updated_at || productColor.updatedAt)}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (productColor: ProductColor) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(productColor)}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(productColor)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(productColor)}
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ContentContainer>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium">Error loading product colors</h3>
              <p className="text-red-600 mt-1">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </ContentContainer>
      </div>
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
                <p className="text-sm font-medium text-gray-600 truncate">Total Colors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalProductColors || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <Palette className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Colors</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? '...' : stats?.activeProductColors || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <Palette className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Inactive Colors</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : stats?.inactiveProductColors || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                <Palette className="w-5 h-5 text-red-600" />
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
              placeholder="Search colors by name, code, or description..."
              value={filters.search || ''}
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

        {/* Enhanced Product Colors Table Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading product colors...</span>
            </div>
          ) : (
            <>
              <DataTable
                data={productColors}
                columns={columns}
                emptyMessage="No product colors found matching your criteria."
                showColumnControls={true}
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
            </>
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          title={modalMode === 'create' ? 'Add Product Color' : 'Edit Product Color'}
          size="lg"
        >
          <ProductColorForm
            productColor={selectedProductColor}
            onSubmit={handleFormSubmit}
            onCancel={handleModalClose}
            isLoading={isCreating || isUpdating}
          />
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={handleViewModalClose}
          title="View Product Color"
          size="lg"
        >
          {selectedProductColor && (
            <ProductColorView
              productColor={selectedProductColor}
              onClose={handleViewModalClose}
              onEdit={() => {
                handleViewModalClose();
                handleEdit(selectedProductColor);
              }}
              canEdit={canEdit}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Product Color"
          message={`Are you sure you want to delete the product color "${selectedProductColor?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />

        {/* Floating Action Button (FAB) */}
        {canCreate && (
          <button
            onClick={handleCreate}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
            title="Add Product Color"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </ContentContainer>
    </div>
  );
};

export default ProductColors;
