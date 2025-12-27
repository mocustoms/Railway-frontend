import React, { useState } from 'react';
import { 
  X, 
  Edit, 
  Download, 
  Share2, 
  Copy,
  Package,
  Building2,
  Calculator,
  FileText,
  Tag,
  MapPin,
  DollarSign,
  BarChart3,
  Calendar,
  Hash,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { Product } from '../../types';
import { productTypeConfig } from '../../data/productCatalogModules';
import { useCompanySetupManagement } from '../../hooks/useCompanySetupManagement';
import { formatCurrency as formatCurrencyUtil } from '../../utils/formatters';
import { getImageUrl } from '../../utils/imageUtils';

interface ProductDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  open,
  onOpenChange,
  product,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  
  // Get company settings for default currency
  const { company } = useCompanySetupManagement();

  if (!open || !product) return null;

  // Get product type configuration
  const getProductTypeConfig = (type: string) => {
    return productTypeConfig[type as keyof typeof productTypeConfig];
  };

  // Format currency using system's default currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    
    const currencyCode = company?.defaultCurrency?.code || 'USD';
    const currencySymbol = company?.defaultCurrency?.symbol || '$';
    
    // Use the centralized formatCurrency utility that handles auto-generated codes
    return formatCurrencyUtil(amount, currencyCode, currencySymbol);
  };

  // Format number
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Format date
  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </>
        )}
      </span>
    );
  };

  // Get stock status based on store assignments
  const getStockStatus = () => {
    // Calculate total stock across all stores
    const totalStock = product.productStores?.reduce((total, store) => total + (store.quantity || 0), 0) || 0;
    const minQuantity = product.min_quantity || 0;
    const reorderPoint = product.reorder_point || 0;

    if (totalStock <= minQuantity) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Critical Stock
        </span>
      );
    } else if (totalStock <= reorderPoint) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          In Stock
        </span>
      );
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            {product.image ? (
              <img
                src={getImageUrl(product.image, 'products')}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {product.code}
                </code>
                {getStatusBadge(product.is_active)}
                {getStockStatus()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(product.code)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              title="Copy Product Code"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2 inline" />
              Edit
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['overview', 'details', 'inventory', 'pricing', 'relationships'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Product Type & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Product Type
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const config = getProductTypeConfig(product.product_type);
                        return (
                          <>
                            <config.icon className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">{config.label}</span>
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-gray-600">
                      {getProductTypeConfig(product.product_type)?.description}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Hash className="w-5 h-5 mr-2" />
                    Product Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Code:</span>
                      <span className="font-medium">{product.code}</span>
                    </div>
                    {product.barcode && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Barcode:</span>
                        <span className="font-medium">{product.barcode}</span>
                      </div>
                    )}
                    {product.part_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Part Number:</span>
                        <span className="font-medium">{product.part_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-gray-700">{product.description}</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(product.productStores?.reduce((total, store) => total + (store.quantity || 0), 0) || 0)}
                  </div>
                  <div className="text-sm text-blue-600">Total Stock</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(product.average_cost)}
                  </div>
                  <div className="text-sm text-green-600">Average Cost</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(product.selling_price)}
                  </div>
                  <div className="text-sm text-purple-600">Selling Price</div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatNumber(product.reorder_point)}
                  </div>
                  <div className="text-sm text-orange-600">Reorder Point</div>
                </div>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Product Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Product Name</label>
                    <p className="text-gray-900 font-medium">{product.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Product Code</label>
                    <p className="text-gray-900">{product.code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Part Number</label>
                    <p className="text-gray-900">{product.part_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Barcode</label>
                    <p className="text-gray-900">{product.barcode || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900">{product.description || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">{getStatusBadge(product.is_active)}</div>
                  </div>
                </div>
              </div>

              {/* Classification Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Classification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Product Type</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {(() => {
                        const config = getProductTypeConfig(product.product_type);
                        return (
                          <>
                            <config.icon className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-900">{config.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-gray-900">{product.category?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Brand</label>
                    <p className="text-gray-900">{product.brand?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Manufacturer</label>
                    <p className="text-gray-900">{product.manufacturer?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Model</label>
                    <p className="text-gray-900">{product.model?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Color</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {product.color?.hex_code && (
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: product.color.hex_code }}
                        />
                      )}
                      <span className="text-gray-900">{product.color?.name || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Unit</label>
                    <p className="text-gray-900">{product.unit?.name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Average Cost</label>
                    <p className="text-gray-900 font-medium">{formatCurrency(product.average_cost)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Selling Price</label>
                    <p className="text-gray-900 font-medium">{formatCurrency(product.selling_price)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Profit Margin</label>
                    <p className="text-gray-900">
                      {product.average_cost && product.selling_price 
                        ? `${(((product.selling_price - product.average_cost) / product.average_cost) * 100).toFixed(2)}%`
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tax Inclusive</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="checkbox"
                        checked={product.price_tax_inclusive || false}
                        readOnly
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Price includes tax</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Inventory Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Minimum Quantity</label>
                    <p className="text-gray-900">{formatNumber(product.min_quantity)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Maximum Quantity</label>
                    <p className="text-gray-900">{formatNumber(product.max_quantity)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reorder Point</label>
                    <p className="text-gray-900">{formatNumber(product.reorder_point)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Track Serial Number</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="checkbox"
                        checked={product.track_serial_number || false}
                        readOnly
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Track individual items</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Locations */}
              {product.assignedStores && product.assignedStores.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Store Locations
                  </h3>
                  <div className="space-y-3">
                    {product.assignedStores.map((store: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <div className="font-medium">{store.name}</div>
                          <div className="text-sm text-gray-600">{store.location}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatNumber(store.quantity)}</div>
                          <div className="text-sm text-gray-500">Stock</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Timestamps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                    <p className="text-gray-900">{formatDate(product.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-gray-900">{formatDate(product.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Stock Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Stock Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(product.assignedStores?.reduce((total, store: any) => total + (store.quantity || 0), 0) || 0)}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Total Stock</div>
                  </div>
                  <div className="text-center bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatNumber(product.min_quantity || 0)}
                    </div>
                    <div className="text-sm text-orange-600 font-medium">Min Quantity</div>
                  </div>
                  <div className="text-center bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatNumber(product.max_quantity || 0)}
                    </div>
                    <div className="text-sm text-red-600 font-medium">Max Quantity</div>
                  </div>
                  <div className="text-center bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatNumber(product.reorder_point || 0)}
                    </div>
                    <div className="text-sm text-yellow-600 font-medium">Reorder Point</div>
                  </div>
                </div>
                
                {/* Stock Status */}
                <div className="mt-4 p-3 bg-white rounded-lg border">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-2">Current Stock Status</div>
                    {(() => {
                      const totalStock = product.assignedStores?.reduce((total, store: any) => total + (store.quantity || 0), 0) || 0;
                      const minQuantity = product.min_quantity || 0;
                      const reorderPoint = product.reorder_point || 0;
                      
                      if (totalStock <= minQuantity) {
                        return (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Critical Stock Level
                          </div>
                        );
                      } else if (totalStock <= reorderPoint) {
                        return (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Low Stock - Reorder Soon
                          </div>
                        );
                      } else {
                        return (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Stock Level Normal
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Store Assignments */}
              {product.assignedStores && product.assignedStores.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Store Assignments & Stock Levels
                  </h3>
                  <div className="space-y-3">
                    {product.assignedStores.map((store: any, index: number) => {
                      const stock = store.quantity || 0;
                      const minQty = product.min_quantity || 0;
                      const maxQty = product.max_quantity || 0;
                      const reorderPoint = product.reorder_point || 0;
                      
                      let stockStatus = 'normal';
                      let statusColor = 'bg-green-100 text-green-800';
                      
                      if (stock <= minQty) {
                        stockStatus = 'critical';
                        statusColor = 'bg-red-100 text-red-800';
                      } else if (stock <= reorderPoint) {
                        stockStatus = 'low';
                        statusColor = 'bg-orange-100 text-orange-800';
                      } else if (stock >= maxQty) {
                        stockStatus = 'overstocked';
                        statusColor = 'bg-yellow-100 text-yellow-800';
                      }
                      
                      return (
                        <div key={index} className="bg-white rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-medium text-lg">{store.name}</div>
                              <div className="text-sm text-gray-600">{store.location || 'No location specified'}</div>
                            </div>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {stockStatus === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {stockStatus === 'low' && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {stockStatus === 'normal' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {stockStatus === 'overstocked' && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {stockStatus.charAt(0).toUpperCase() + stockStatus.slice(1)} Stock
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{formatNumber(stock)}</div>
                              <div className="text-xs text-gray-500">Current Stock</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-medium text-orange-600">{formatNumber(minQty)}</div>
                              <div className="text-xs text-gray-500">Min Quantity</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-medium text-red-600">{formatNumber(maxQty)}</div>
                              <div className="text-xs text-gray-500">Max Quantity</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-medium text-yellow-600">{formatNumber(reorderPoint)}</div>
                              <div className="text-xs text-gray-500">Reorder Point</div>
                            </div>
                          </div>
                          
                          {/* Stock Progress Bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Min: {formatNumber(minQty)}</span>
                              <span>Reorder: {formatNumber(reorderPoint)}</span>
                              <span>Max: {formatNumber(maxQty)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  stock <= minQty ? 'bg-red-500' :
                                  stock <= reorderPoint ? 'bg-orange-500' :
                                  stock >= maxQty ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${Math.min(100, Math.max(0, ((stock - minQty) / (maxQty - minQty)) * 100))}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Store Assignments
                  </h3>
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No stores assigned to this product</p>
                    <p className="text-sm text-gray-400">Assign stores to track inventory levels</p>
                  </div>
                </div>
              )}

              {/* Inventory Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Inventory Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={product.track_serial_number || false}
                      readOnly
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Track Serial Numbers</span>
                      <p className="text-xs text-gray-500">Track individual product items</p>
                    </div>
                  </div>
                  
                  {product.expiry_notification_days && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Expiry Notification</label>
                      <p className="text-gray-900">{product.expiry_notification_days} days before expiry</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              {/* Price Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Price Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(product.average_cost)}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Average Cost</div>
                  </div>
                  <div className="text-center bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(product.selling_price)}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Selling Price</div>
                  </div>
                  <div className="text-center bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {product.average_cost && product.selling_price 
                        ? formatCurrency(product.selling_price - product.average_cost)
                        : '-'
                      }
                    </div>
                    <div className="text-sm text-purple-600 font-medium">Profit Per Unit</div>
                  </div>
                </div>
                
                {/* Profit Analysis */}
                {product.average_cost && product.selling_price && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <h4 className="text-md font-semibold mb-3 text-center">Profit Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(product.selling_price - product.average_cost)}
                        </div>
                        <div className="text-sm text-gray-500">Absolute Profit</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {(((product.selling_price - product.average_cost) / product.average_cost) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Markup %</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-purple-600">
                          {(((product.selling_price - product.average_cost) / product.selling_price) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Profit Margin %</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tax Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Tax & Pricing Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={product.price_tax_inclusive || false}
                      readOnly
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Price is Tax Inclusive</span>
                      <p className="text-xs text-gray-500">Tax is included in the selling price</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Financial Accounts */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Financial Accounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">COGS Account</label>
                    <p className="text-gray-900">{product.cogs_account_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Income Account</label>
                    <p className="text-gray-900">{product.income_account_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Asset Account</label>
                    <p className="text-gray-900">{product.asset_account_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Purchases Tax</label>
                    <p className="text-gray-900">{product.purchases_tax_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Sales Tax</label>
                    <p className="text-gray-900">{product.sales_tax_name || '-'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={product.price_tax_inclusive}
                      readOnly
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Price is Tax Inclusive</span>
                  </div>
                </div>
              </div>

              {/* Price Categories */}
              {product.priceCategories && product.priceCategories.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    Price Categories
                  </h3>
                  <div className="space-y-3">
                    {product.priceCategories.map((priceCategory) => (
                      <div key={priceCategory.id} className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium text-lg">{priceCategory.name}</div>
                            <div className="text-sm text-gray-600">{priceCategory.description || 'No description'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(priceCategory.price)}
                            </div>
                            <div className="text-sm text-gray-500">{priceCategory.currency || 'USD'}</div>
                          </div>
                        </div>
                        
                        {priceCategory.calculated_price && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Calculated Price</div>
                            <div className="text-lg font-medium text-gray-900">
                              {formatCurrency(priceCategory.calculated_price)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    Price Categories
                  </h3>
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No price categories assigned</p>
                    <p className="text-sm text-gray-400">Assign price categories for different customer segments</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Relationships Tab */}
          {activeTab === 'relationships' && (
            <div className="space-y-6">
              {/* Raw Materials */}
              {product.rawMaterials && product.rawMaterials.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Raw Materials</h3>
                  <div className="space-y-2">
                    {product.rawMaterials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <div className="font-medium">{material.product_name}</div>
                          <div className="text-sm text-gray-600">{material.product_code}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatNumber(material.quantity)} {material.unit_name}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(material.cost)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Products */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Related Products</h3>
                <p className="text-gray-600">No related products found.</p>
              </div>

              {/* Usage History */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Usage History</h3>
                <p className="text-gray-600">No usage history available.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
