import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tag, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  FileText,
  Search,
  Filter,
  X,
  ArrowLeft
} from 'lucide-react';
import { ProductCategory } from '../types';
import { useProductCategoryManagement } from '../hooks/useProductCategoryManagement';
import { statusFilterOptions, tableColumns, productCategoryModuleConfig } from '../data/productCategoryModules';
import ContentContainer from '../components/ContentContainer';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';

import ProductCategoryForm from '../components/ProductCategoryForm';
import ProductCategoryView from '../components/ProductCategoryView';

const ProductCategories: React.FC = () => {
  const navigate = useNavigate();
  const {
    productCategories,
    pagination,
    stats,
    taxCodes,
    accounts,
    isStatsLoading,
    isTaxCodesLoading,
    isAccountsLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isCheckingUsage,
    isDeactivating,
    isExportingExcel,
    isExportingPdf,
    currentPage,
    pageSize,
    filters,
    canExport,
    handleCreateProductCategory,
    handleUpdateProductCategory,
    handleDeleteProductCategory,
    handleCheckUsage,
    handleDeactivate,
    handleExportExcel,
    handleExportPdf,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleSort,
  } = useProductCategoryManagement();

  // Local state for UI
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProductCategory, setSelectedProductCategory] = useState<ProductCategory | null>(null);
  const [usageData, setUsageData] = useState<{
    isUsed: boolean;
    usageCount: number;
    productCount: number;
    modelCount: number;
    manufacturerCount: number;
    message: string;
  } | null>(null);

  // Modal handlers
  const openCreateModal = () => {
    setSelectedProductCategory(null);
    setShowForm(true);
  };

  const openEditModal = (productCategory: ProductCategory) => {
    setSelectedProductCategory(productCategory);
    setShowForm(true);
  };

  const openViewModal = (productCategory: ProductCategory) => {
    setSelectedProductCategory(productCategory);
    setShowView(true);
  };

  const openDeleteModal = async (productCategory: ProductCategory) => {
    setSelectedProductCategory(productCategory);
    try {
      const usage = await handleCheckUsage(productCategory.id);
      setUsageData(usage);
      setShowDeleteModal(true);
    } catch (error) {
      }
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedProductCategory(null);
  };

  const closeView = () => {
    setShowView(false);
    setSelectedProductCategory(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedProductCategory(null);
    setUsageData(null);
  };

  // Action handlers
  const handleFormSubmit = async (data: any) => {
    if (selectedProductCategory) {
      await handleUpdateProductCategory(selectedProductCategory.id, data);
    } else {
      await handleCreateProductCategory(data);
    }
    closeForm();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProductCategory) return;

    try {
      if (usageData?.isUsed) {
        await handleDeactivate(selectedProductCategory.id);
      } else {
        await handleDeleteProductCategory(selectedProductCategory.id);
      }
      closeDeleteModal();
    } catch (error) {
      }
  };

  // Table sort handler
  const handleTableSort = (key: string, direction: 'asc' | 'desc') => {
    handleSort(key as any);
  };

  // Table columns with render functions
  const columns = tableColumns.map(column => ({
    ...column,
    render: (productCategory: ProductCategory) => {
      switch (column.key) {
        case 'code':
          return (
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {productCategory.code}
            </span>
          );
        case 'name':
          return (
            <div className="flex items-center space-x-2">
              {productCategory.color && (
                <div
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: productCategory.color }}
                />
              )}
              <span className="font-medium text-gray-900">{productCategory.name}</span>
            </div>
          );
        case 'description':
          return (
            <span className="text-gray-600 truncate max-w-xs">
              {productCategory.description || 'No description'}
            </span>
          );
        case 'color':
          return productCategory.color ? (
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: productCategory.color }}
              />
              <span className="font-mono text-xs">{productCategory.color}</span>
            </div>
          ) : (
            <span className="text-gray-400">No color</span>
          );
        case 'tax_code_name':
        case 'purchases_tax_name':
        case 'cogs_account_name':
        case 'income_account_name':
        case 'asset_account_name':
          return (
            <span className="text-gray-600">
              {productCategory[column.key] || 'Not assigned'}
            </span>
          );
        case 'is_active':
          return <StatusBadge status={productCategory.is_active ? 'active' : 'inactive'} />;
        case 'created_by_name':
        case 'updated_by_name':
          return (
            <span className="text-gray-600">
              {productCategory[column.key] || 'System'}
            </span>
          );
        case 'created_at':
        case 'updated_at':
          return (
            <span className="text-gray-600 text-sm">
              {productCategory[column.key] 
                ? new Date(productCategory[column.key]!).toLocaleDateString() 
                : 'N/A'}
            </span>
          );
        case 'actions':
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openViewModal(productCategory)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEditModal(productCategory)}
                className="text-amber-600 hover:text-amber-800 transition-colors"
                title="Edit Category"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => openDeleteModal(productCategory)}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Delete Category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        default:
          return String(productCategory[column.key as keyof ProductCategory] || 'N/A');
      }
    },
  }));

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isStatsLoading ? '...' : stats?.total || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Active Categories</p>
                <p className="text-2xl font-bold text-green-600">
                  {isStatsLoading ? '...' : stats?.active || 0}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full flex-shrink-0 ml-3">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>
          
                     <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
             <div className="flex items-center justify-between">
               <div className="min-w-0 flex-1">
                 <p className="text-sm font-medium text-gray-600 truncate">Inactive Categories</p>
                 <p className="text-2xl font-bold text-red-600">
                   {isStatsLoading ? '...' : stats?.inactive || 0}
                 </p>
               </div>
               <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                 <Tag className="w-5 h-5 text-red-600" />
               </div>
             </div>
           </Card>
           
           <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
             <div className="flex items-center justify-between">
               <div className="min-w-0 flex-1">
                 <p className="text-sm font-medium text-gray-600 truncate">Last Updated</p>
                 <p className="text-lg font-semibold text-purple-600">
                   {isStatsLoading ? '...' : stats?.lastUpdate || 'Never'}
                 </p>
               </div>
               <div className="p-2 bg-purple-100 rounded-full flex-shrink-0 ml-3">
                 <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 0 11-18 0 9 9 0 0118 0z" />
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
              placeholder="Search categories by name, code, or description..."
              value={filters.search}
              onChange={(e) => handleFiltersChange({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {filters.search && (
              <button
                onClick={() => handleFiltersChange({ search: '' })}
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
              onChange={(e) => handleFiltersChange({ status: e.target.value as any })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            >
              {statusFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleExportPdf}
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

          {/* Enhanced Product Categories Table Container */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
            {isStatsLoading ? (
              <div className="flex items-center justify-center py-12 animate-pulse">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading categories...</span>
              </div>
            ) : (
              <>
                <DataTable
                  data={productCategories}
                  columns={columns}
                  onSort={handleTableSort}
                  sortable={true}
                  showColumnControls={true}
                  emptyMessage="No categories found matching your criteria."
                  maxHeight={600}
                />
              </>
            )}
          </div>

        {/* Pagination Controls - Only show when there are items */}
        {pagination.totalItems > 0 && (
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
                Showing {pagination.startIndex + 1}-{pagination.endIndex} of {pagination.totalItems}
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
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                if (page > pagination.totalPages) return null;
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
                disabled={currentPage === pagination.totalPages}
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
        title="Add New Category"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modals */}
      {showForm && (
        <ProductCategoryForm
          productCategory={selectedProductCategory}
          taxCodes={taxCodes}
          accounts={accounts}
          isLoading={isCreating || isUpdating || isTaxCodesLoading || isAccountsLoading}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
        />
      )}

      {showView && selectedProductCategory && (
        <ProductCategoryView
          productCategory={selectedProductCategory}
          onClose={closeView}
        />
      )}

      {showDeleteModal && selectedProductCategory && (
        <ConfirmDialog
          isOpen={showDeleteModal}
          title={usageData?.isUsed ? 'Category In Use' : 'Delete Category'}
          message={
            usageData?.isUsed
              ? `This category is being used by ${usageData.usageCount} item(s) (${usageData.productCount} products, ${usageData.modelCount} models, ${usageData.manufacturerCount} manufacturers) and cannot be deleted. You can deactivate it instead to prevent future use while keeping existing data intact.`
              : `Are you sure you want to delete "${selectedProductCategory.name}"? This action cannot be undone.`
          }
          confirmText={usageData?.isUsed ? 'Deactivate Category' : 'Delete Category'}
          cancelText="Cancel"
          variant={usageData?.isUsed ? 'warning' : 'danger'}
          isLoading={isDeleting || isDeactivating || isCheckingUsage}
          onConfirm={handleDeleteConfirm}
          onClose={closeDeleteModal}
        />
      )}
    </div>
  );
};

export default ProductCategories;
