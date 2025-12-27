import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Package,
  AlertTriangle,
  Clock,
  X,
  ArrowLeft,
  Tags,
  Tag,
  Building2,
  Pill
} from 'lucide-react';
import { useProductCatalog } from '../hooks/useProductCatalog';
import { Product, ProductFilters, ProductSortConfig } from '../types';
import { productCatalogModuleConfig, productTypeConfig, productStatusConfig } from '../data/productCatalogModules';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import ContentContainer from '../components/ContentContainer';
import { ProductForm } from '../components/ProductCatalog/ProductForm';
import { ProductDetails } from '../components/ProductCatalog/ProductDetails';
import RawMaterialsModal from '../components/ProductCatalog/RawMaterialsModal';
import DosageAssignmentModal from '../components/ProductCatalog/DosageAssignmentModal';

import { DeleteConfirmationModal } from '../components/ProductCatalog/DeleteConfirmationModal';
import { LoadingSpinner } from '../components/ProductCatalog/LoadingSpinner';
import { ErrorMessage } from '../components/ProductCatalog/ErrorMessage';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { useCompanySetupManagement } from '../hooks/useCompanySetupManagement';
import toast from 'react-hot-toast';

// Import the unified image utility
import { getImageUrl } from '../utils/imageUtils';
import ImageWithFallback from '../components/ImageWithFallback';

const ProductCatalog: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    currentProduct,
    loading,
    error,
    stats,
    pagination,
    filters,
    sortConfig,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchStats,
    setFilters,
    setSortConfig,
    setPage,
    setLimit,
    resetFilters,
    exportToExcel,
    exportToPDF,
    getImportTemplate,
    referenceData
  } = useProductCatalog();

  // Get company settings for default currency
  const { company } = useCompanySetupManagement();

  // Fetch products when sort config changes
  useEffect(() => {
    if (sortConfig) {
      fetchProducts();
    }
  }, [sortConfig]);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false); // Track if we're adding (not editing)
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showRawMaterialsModal, setShowRawMaterialsModal] = useState(false);
  const [showDosagesModal, setShowDosagesModal] = useState(false);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ search: value });
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters({ [key]: value });
  };

  // Handle product actions
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleEditProduct = async (product: Product) => {
    try {
      // Fetch complete product data with relations
      await fetchProduct(product.id);
      setSelectedProduct(null); // Clear selectedProduct to ensure currentProduct is used
      setIsAddingProduct(false); // We're editing, not adding
      setShowProductForm(true);
    } catch (error) {
      // Fallback to basic product data
      setSelectedProduct(product);
      setIsAddingProduct(false); // We're editing, not adding
      setShowProductForm(true);
    }
  };

  // Handle adding new product - explicitly clear all product state
  const handleAddProduct = () => {
    setSelectedProduct(null); // Clear selected product
    setIsAddingProduct(true); // Mark that we're adding a new product
    setShowProductForm(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setShowDeleteModal(false);
      setProductToDelete(null);
      // Force refresh the products list and stats to show updated data immediately
      fetchProducts();
      fetchStats();
    }
  };

  // Handle raw materials management
  const handleRawMaterials = (product: Product) => {
    setSelectedProduct(product);
    setShowRawMaterialsModal(true);
  };

  // Handle dosages management
  const handleDosages = (product: Product) => {
    setSelectedProduct(product);
    setShowDosagesModal(true);
  };

  // Handle import/export
  const handleExportExcel = useCallback(async () => {
    try {
      await exportToExcel();
      toast.success('Products exported to Excel successfully');
    } catch (error) {
      toast.error('Failed to export products to Excel');
    }
  }, [exportToExcel]);

  const handleExportPdf = useCallback(async () => {
    try {
      await exportToPDF();
      toast.success('Products exported to PDF successfully');
    } catch (error) {
      toast.error('Failed to export products to PDF');
    }
  }, [exportToPDF]);

  // Handle column sorting
  const handleSort = (columnKey: string, direction: 'asc' | 'desc') => {
    setSortConfig({ column: columnKey as keyof Product | 'created_at' | 'updated_at' | 'created_by' | 'updated_by', direction });
  };

  // Get product type badge
  const getProductTypeBadge = (type: string) => {
    if (!type || !productTypeConfig) return null;
    const config = productTypeConfig[type as keyof typeof productTypeConfig];
    if (!config) return null;

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {config.label}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return (
      <StatusBadge 
        status={isActive ? 'active' : 'inactive'}
      />
    );
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <ContentContainer>

             {/* Statistics Cards */}
       {stats && (
         <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
                <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Tags className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Products</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.activeProducts || 0}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Tag className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Low Stock</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.lowStockProducts || 0}</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card-animation hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.expiringProducts || 0}</p>
                    </div>
                  </div>
                </Card>
         </div>
       )}

      {/* Enhanced Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
                         <input
               type="text"
               placeholder="Search products by name, code, barcode, description, category, brand, manufacturer, model, color, or unit..."
               value={searchTerm || ''}
               onChange={(e) => handleSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
             />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Quick Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filters?.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters?.product_type || ''}
              onChange={(e) => handleFilterChange('product_type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="resale">Resale</option>
              <option value="raw_materials">Raw Materials</option>
              <option value="manufactured">Manufactured</option>
              <option value="services">Services</option>
              <option value="pharmaceuticals">Pharmaceuticals</option>
            </select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
              disabled={loading}
            >
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </Button>

            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters?.category_id || ''}
                    onChange={(e) => handleFilterChange('category_id', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {referenceData?.categories?.filter(category => category && category.id)?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    value={filters?.brand_id || ''}
                    onChange={(e) => handleFilterChange('brand_id', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Brands</option>
                    {referenceData?.brands?.filter(brand => brand && brand.id)?.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer
                  </label>
                  <select
                    value={filters?.manufacturer_id || ''}
                    onChange={(e) => handleFilterChange('manufacturer_id', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Manufacturers</option>
                    {referenceData?.manufacturers?.filter(manufacturer => manufacturer && manufacturer.id)?.map((manufacturer) => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store
                  </label>
                  <select
                    value={filters?.store_id || ''}
                    onChange={(e) => handleFilterChange('store_id', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Stores</option>
                    {referenceData?.stores?.filter(store => store && store.id)?.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={filters?.model_id || ''}
                    onChange={(e) => handleFilterChange('model_id', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Models</option>
                    {referenceData?.models?.filter(model => model && model.id)?.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    value={filters?.color_id || ''}
                    onChange={(e) => handleFilterChange('color_id', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Colors</option>
                    {referenceData?.colors?.filter(color => color && color.id)?.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={filters?.unit_id || ''}
                    onChange={(e) => handleFilterChange('unit_id', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Units</option>
                    {referenceData?.packagings?.filter(unit => unit && unit.id)?.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>

                 {/* Boolean Filters */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Special Features
                   </label>
                   <div className="space-y-2">
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={filters?.lowStock || false}
                         onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="ml-2 text-sm text-gray-600">Low Stock</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={filters?.expiring || false}
                         onChange={(e) => handleFilterChange('expiring', e.target.checked)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="ml-2 text-sm text-gray-600">Expiring Soon</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={filters?.has_image || false}
                         onChange={(e) => handleFilterChange('has_image', e.target.checked)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="ml-2 text-sm text-gray-600">Has Image</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={filters?.track_serial_number || false}
                         onChange={(e) => handleFilterChange('track_serial_number', e.target.checked)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="ml-2 text-sm text-gray-600">Track Serial</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={filters?.price_tax_inclusive || false}
                         onChange={(e) => handleFilterChange('price_tax_inclusive', e.target.checked)}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="ml-2 text-sm text-gray-600">Tax Inclusive</span>
                     </label>
                   </div>
                 </div>

                 {/* Price Range Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Price Range
                   </label>
                   <div className="space-y-2">
                     <input
                       type="number"
                       placeholder="Min Price"
                       value={filters?.price_range?.min || ''}
                       onChange={(e) => handleFilterChange('price_range', { 
                         ...filters?.price_range, 
                         min: e.target.value ? parseFloat(e.target.value) : undefined 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                     <input
                       type="number"
                       placeholder="Max Price"
                       value={filters?.price_range?.max || ''}
                       onChange={(e) => handleFilterChange('price_range', { 
                         ...filters?.price_range, 
                         max: e.target.value ? parseFloat(e.target.value) : undefined 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                 </div>

                 {/* Cost Range Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Cost Range
                   </label>
                   <div className="space-y-2">
                     <input
                       type="number"
                       placeholder="Min Cost"
                       value={filters?.cost_range?.min || ''}
                       onChange={(e) => handleFilterChange('cost_range', { 
                         ...filters?.cost_range, 
                         min: e.target.value ? parseFloat(e.target.value) : undefined 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                     <input
                       type="number"
                       placeholder="Max Cost"
                       value={filters?.cost_range?.max || ''}
                       onChange={(e) => handleFilterChange('cost_range', { 
                         ...filters?.cost_range, 
                         max: e.target.value ? parseFloat(e.target.value) : undefined 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                 </div>

                 {/* Stock Range Filter */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Stock Range
                   </label>
                   <div className="space-y-2">
                     <input
                       type="number"
                       placeholder="Min Stock"
                       value={filters?.stock_range?.min || ''}
                       onChange={(e) => handleFilterChange('stock_range', { 
                         ...filters?.stock_range, 
                         min: e.target.value ? parseFloat(e.target.value) : undefined 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                     <input
                       type="number"
                       placeholder="Max Stock"
                       value={filters?.stock_range?.max || ''}
                       onChange={(e) => handleFilterChange('stock_range', { 
                         ...filters?.stock_range, 
                         max: e.target.value ? parseFloat(e.target.value) : undefined 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                 </div>

                 {/* Date Range Filters */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Created Date Range
                   </label>
                   <div className="space-y-2">
                     <input
                       type="date"
                       value={filters?.created_date_range?.from || ''}
                       onChange={(e) => handleFilterChange('created_date_range', { 
                         ...filters?.created_date_range, 
                         from: e.target.value 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                     <input
                       type="date"
                       value={filters?.created_date_range?.to || ''}
                       onChange={(e) => handleFilterChange('created_date_range', { 
                         ...filters?.created_date_range, 
                         to: e.target.value 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Updated Date Range
                   </label>
                   <div className="space-y-2">
                     <input
                       type="date"
                       value={filters?.updated_date_range?.from || ''}
                       onChange={(e) => handleFilterChange('updated_date_range', { 
                         ...filters?.updated_date_range, 
                         from: e.target.value 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                     <input
                       type="date"
                       value={filters?.updated_date_range?.to || ''}
                       onChange={(e) => handleFilterChange('updated_date_range', { 
                         ...filters?.updated_date_range, 
                         to: e.target.value 
                       })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                 </div>
              </div>
            </div>
          )}
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
               
                <Button
                  variant="outline"
                  onClick={() => navigate('/import-products')}
                  className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 table-button"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Import Products</span>
                </Button>
               
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={loading}
                  className="flex items-center space-x-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 table-button"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleExportPdf}
                  disabled={loading}
                  className="flex items-center space-x-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-green-400 table-button"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </Button>
             </div>
           </div>
         </div>

        {/* Products Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {loading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          ) : products && products.length > 0 ? (
            <>
              <DataTable
                data={products}
                columns={[
                  {
                    key: 'image',
                    header: 'Image',
                    sortable: false, // Images are not sortable
                    defaultVisible: true, // Always visible
                    render: (product: Product) => {
                      return (
                        <div className="flex items-center justify-center w-16 h-16 min-w-[4rem]">
                          <ImageWithFallback
                            src={product?.image}
                            alt={product?.name || 'Product'}
                            module="products"
                            size="lg"
                            className="w-full h-full"
                            fallbackIcon="package"
                          />
                        </div>
                      );
                    }
                  },
                  {
                    key: 'name',
                    header: 'Product Name',
                    sortable: true,
                    defaultVisible: true, // Always visible
                    render: (product: Product) => (
                      <div className="font-medium text-gray-900">
                        {product?.name || 'Unnamed Product'}
                      </div>
                    )
                  },
                  {
                    key: 'part_number',
                    header: 'Part Number',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.part_number || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'code',
                    header: 'Code',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.code || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'barcode',
                    header: 'Barcode',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.barcode || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'product_type',
                    header: 'Type',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => getProductTypeBadge(product?.product_type || '')
                  },
                  {
                    key: 'category',
                    header: 'Category',
                    sortable: true,
                    defaultVisible: true, // Keep visible - important for organization
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.category?.name || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'brand',
                    header: 'Brand',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.brand?.name || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'manufacturer',
                    header: 'Manufacturer',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.manufacturer?.name || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'model',
                    header: 'Model',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.model?.name || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'color',
                    header: 'Color',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.color?.name || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'unit',
                    header: 'Unit',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.unit?.name || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'description',
                    header: 'Description',
                    sortable: true,
                    defaultVisible: false, // Hide by default - can be long text
                    render: (product: Product) => (
                      <div className="max-w-xs">
                        {product?.description ? (
                          <div className="text-sm text-gray-600 truncate" title={product.description}>
                            {product.description}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'average_cost',
                    header: 'Cost',
                    sortable: true,
                    defaultVisible: true, // Keep visible - important financial info
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.average_cost ? formatCurrency(product.average_cost, company?.defaultCurrency?.code, company?.defaultCurrency?.symbol) : '-'}
                      </div>
                    )
                  },
                  {
                    key: 'selling_price',
                    header: 'Price',
                    sortable: true,
                    defaultVisible: true, // Keep visible - important financial info
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.selling_price ? formatCurrency(product.selling_price, company?.defaultCurrency?.code, company?.defaultCurrency?.symbol) : '-'}
                      </div>
                    )
                  },
                  {
                    key: 'stock',
                    header: 'Quantity',
                    sortable: false, // Stock is calculated, not directly sortable
                    defaultVisible: true, // Keep visible - critical inventory info
                    render: (product: Product) => {
                      // First check if currentQuantity is available (for store-specific queries)
                      let totalStock = product?.currentQuantity;
                      
                      // If not available, calculate from assignedStores (ProductStore quantities)
                      if (totalStock === undefined || totalStock === null) {
                        totalStock = product?.assignedStores?.reduce((total, store: any) => {
                          // Access quantity from through table (ProductStore)
                          // Sequelize may flatten it to store.quantity or keep it in store.ProductStore.quantity
                          const quantity = store.quantity || 
                                         store.ProductStore?.quantity || 
                                         (store.ProductStore && typeof store.ProductStore === 'object' ? store.ProductStore.quantity : null) ||
                                         0;
                          return total + (parseFloat(quantity) || 0);
                        }, 0) || 0;
                      }
                      
                      const isLowStock = totalStock < (product?.min_quantity || 0);
                      
                      return (
                        <div className="text-sm text-gray-600">
                          <span className={isLowStock ? 'text-red-600 font-medium' : ''}>
                            {formatNumber(totalStock)}
                          </span>
                          {isLowStock && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                              Low
                            </span>
                          )}
                        </div>
                      );
                    }
                  },
                  {
                    key: 'min_quantity',
                    header: 'Min Qty',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {formatNumber(product?.min_quantity || 0)}
                      </div>
                    )
                  },
                  {
                    key: 'max_quantity',
                    header: 'Max Qty',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {formatNumber(product?.max_quantity || 0)}
                      </div>
                    )
                  },
                  {
                    key: 'is_active',
                    header: 'Status',
                    sortable: true,
                    defaultVisible: true, // Keep visible - important status info
                    render: (product: Product) => getStatusBadge(product?.is_active || false)
                  },
                  {
                    key: 'created_by',
                    header: 'Created By',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.created_by_name || product?.createdByUser?.full_name || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'created_at',
                    header: 'Created Date',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.created_at ? formatDate(product.created_at) : '-'}
                      </div>
                    )
                  },
                  {
                    key: 'updated_by',
                    header: 'Updated By',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.updated_by_name || product?.updatedByUser?.full_name || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'updated_at',
                    header: 'Updated Date',
                    sortable: true,
                    defaultVisible: false, // Hide by default - lower priority
                    render: (product: Product) => (
                      <div className="text-sm text-gray-600">
                        {product?.updated_at ? formatDate(product.updated_at) : '-'}
                      </div>
                    )
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    sortable: false, // Actions are not sortable
                    defaultVisible: true, // Always visible
                    render: (product: Product) => (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => product && handleViewProduct(product)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-150 table-button"
                          title="View product details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => product && handleEditProduct(product)}
                          className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors duration-150 table-button"
                          title="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        {/* Raw Materials Button - Only show for manufactured products */}
                        {product?.product_type === 'manufactured' && (
                          <button
                            onClick={() => product && handleRawMaterials(product)}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors duration-150 table-button"
                            title="Manage raw materials"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* Dosages Button - Only show for pharmaceutical products */}
                        {product?.product_type === 'pharmaceuticals' && (
                          <button
                            onClick={() => product && handleDosages(product)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-150 table-button"
                            title="Manage dosages"
                          >
                                                         <Pill className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => product && handleDeleteProduct(product)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-150 table-button"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  }
                ]}
                sortable={true}
                onSort={handleSort}
                initialSortState={{ key: sortConfig.column, direction: sortConfig.direction }}
                showColumnControls={true}
                maxHeight={600}
              />

                                            {/* Pagination Controls - Always show when there are items */}
               {products && products.length > 0 && (
                 <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 animate-fadeIn">
                   <div className="flex items-center space-x-4">
                     <div className="flex items-center space-x-2">
                       <label htmlFor="pageSizeSelect" className="text-sm text-gray-700">Show</label>
                       <select
                         id="pageSizeSelect"
                         value={pagination?.limit?.toString() || '10'}
                         onChange={(e) => setLimit(parseInt(e.target.value))}
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
                        Showing {pagination?.startIndex !== undefined ? pagination.startIndex + 1 : 1}-{pagination?.endIndex || products.length} of {pagination?.totalItems || 0}
                      </span>
                   </div>
                                                           {/* Only show page navigation when there are multiple pages */}
                     {pagination?.totalPages && pagination.totalPages > 1 ? (
                       <div className="flex items-center space-x-2">
                         <button
                           onClick={() => setPage((pagination?.page || 1) - 1)}
                           disabled={(pagination?.page || 1) === 1}
                           className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                         >
                           Previous
                         </button>
                         {Array.from({ length: Math.min(5, pagination?.totalPages || 1) }, (_, i) => {
                           const page = Math.max(1, Math.min((pagination?.totalPages || 1) - 4, (pagination?.page || 1) - 2)) + i;
                           if (page > (pagination?.totalPages || 1)) return null;
                           return (
                             <button
                               key={page}
                               onClick={() => setPage(page)}
                               className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-100 transform hover:scale-105 ${
                                 (pagination?.page || 1) === page
                                   ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                   : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                               }`}
                             >
                               {page}
                             </button>
                           );
                         })}
                         <button
                           onClick={() => setPage((pagination?.page || 1) + 1)}
                           disabled={(pagination?.page || 1) === (pagination?.totalPages || 1)}
                           className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                         >
                           Next
                         </button>
                       </div>
                     ) : null}
                 </div>
               )}
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error ? 'Error loading products' : 'Get started by creating a new product.'}
              </p>
              {!error && (
                <div className="mt-6">
                  <Button
                    onClick={handleAddProduct}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Modals */}
      <ProductForm
        open={showProductForm}
        onOpenChange={(open) => {
          setShowProductForm(open);
          // Clear product state when closing form
          if (!open) {
            setSelectedProduct(null);
            setIsAddingProduct(false);
          }
        }}
        product={isAddingProduct ? null : (selectedProduct || currentProduct || null)}
        onSuccess={() => {
          setShowProductForm(false);
          setSelectedProduct(null);
          setIsAddingProduct(false);
          // Force refresh the products list and stats to show updated data immediately
          fetchProducts();
          fetchStats();
        }}
      />

      <ProductDetails
        open={showProductDetails}
        onOpenChange={setShowProductDetails}
        product={selectedProduct}
        onEdit={async () => {
          setShowProductDetails(false);
          if (selectedProduct) {
            await handleEditProduct(selectedProduct);
          }
        }}
      />

             {/* Raw Materials Modal */}
       <RawMaterialsModal
         open={showRawMaterialsModal}
         onOpenChange={setShowRawMaterialsModal}
         product={selectedProduct}
       />

       {/* Dosages Modal */}
       <DosageAssignmentModal
         open={showDosagesModal}
         onOpenChange={setShowDosagesModal}
         product={selectedProduct}
       />

             <DeleteConfirmationModal
         open={showDeleteModal}
         onOpenChange={setShowDeleteModal}
         productName={productToDelete?.name || ''}
         productCode={productToDelete?.code || ''}
         onConfirm={confirmDelete}
       />

       {/* Floating Action Button (FAB) */}
       <button
         onClick={handleAddProduct}
         className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-all duration-200 hover:scale-110"
         title="Add Product"
         disabled={loading}
       >
         <Plus className="w-6 h-6" />
       </button>
     </ContentContainer>
  );
};

export default ProductCatalog;
