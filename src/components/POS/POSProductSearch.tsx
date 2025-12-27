import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productCatalogService } from '../../services/productCatalogService';
import { Product } from '../../types';
import { Search, Package, Loader2 } from 'lucide-react';
import ImageWithFallback from '../ImageWithFallback';

interface POSProductSearchProps {
  storeId: string;
  onProductSelect: (product: Product) => void;
}

const POSProductSearch: React.FC<POSProductSearchProps> = ({ storeId, onProductSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products for the store with stock quantities
  const { data: products, isLoading } = useQuery({
    queryKey: ['pos-products', storeId, debouncedSearch],
    queryFn: () => productCatalogService.getProductsByStore(
      storeId,
      debouncedSearch,
      100 // Limit to 100 products for POS
    ),
    enabled: !!storeId,
    staleTime: 10 * 1000, // 10 seconds - shorter cache for real-time stock
  });

  const productsList = products || [];

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleProductClick = (product: Product) => {
    onProductSelect(product);
    setSearchTerm(''); // Clear search after selection
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products by name, code, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            autoFocus
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : productsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="h-12 w-12 mb-2" />
            <p className="text-sm">
              {debouncedSearch ? 'No products found' : 'Start typing to search products'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {productsList.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-2">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    module="products"
                    size="md"
                    className="w-12 h-12"
                    fallbackIcon="package"
                  />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{product.code}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-600">
                    {product.selling_price?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) || '0.00'}
                  </span>
                  {product.currentQuantity !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      product.currentQuantity <= (product.reorder_point || 0)
                        ? 'bg-red-100 text-red-800'
                        : product.currentQuantity <= (product.min_quantity || 0)
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      Stock: {product.currentQuantity}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default POSProductSearch;

