import React from 'react';
import { Edit, Trash2, Package, Building } from 'lucide-react';
import StatusBadge from './StatusBadge';
import DataTable from './DataTable';
import { formatNumber } from '../utils/formatters';

interface ProductStoreLocation {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  storeId: number;
  storeName: string;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
}

interface ProductStoreLocationTableProps {
  locations: ProductStoreLocation[];
  onEdit: (location: ProductStoreLocation) => void;
  onDelete: (locationId: number) => void;
  isLoading?: boolean;
}

const ProductStoreLocationTable: React.FC<ProductStoreLocationTableProps> = ({
  locations,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const getStockStatus = (stockQuantity: number, reorderLevel: number) => {
    if (stockQuantity <= 0) return { variant: 'error' as const, text: 'Out of Stock' };
    if (stockQuantity <= reorderLevel) return { variant: 'warning' as const, text: 'Low Stock' };
    return { variant: 'success' as const, text: 'In Stock' };
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (location: ProductStoreLocation) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{location.productName}</div>
            <div className="text-sm text-gray-500">{location.productCode}</div>
          </div>
        </div>
      )
    },
    {
      key: 'store',
      header: 'Store',
      render: (location: ProductStoreLocation) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Building className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{location.storeName}</div>
          </div>
        </div>
      )
    },
    {
      key: 'stock',
      header: 'Stock Quantity',
      render: (location: ProductStoreLocation) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {formatNumber(location.stockQuantity)}
          </div>
          <div className="text-gray-500">
            Reorder: {formatNumber(location.reorderLevel)}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Stock Status',
      render: (location: ProductStoreLocation) => {
        const status = getStockStatus(location.stockQuantity, location.reorderLevel);
        return (
          <StatusBadge
            status={status.text}
            variant={status.variant}
          />
        );
      }
    },
    {
      key: 'active',
      header: 'Status',
      render: (location: ProductStoreLocation) => (
        <StatusBadge
          status={location.isActive ? 'Active' : 'Inactive'}
          variant={location.isActive ? 'success' : 'error'}
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (location: ProductStoreLocation) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(location)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Edit location"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(location.id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete location"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      data={locations}
      columns={columns}
      emptyMessage={isLoading ? "Loading locations..." : "No product store locations found"}
      className="mt-6"
    />
  );
};

export default ProductStoreLocationTable;