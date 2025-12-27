import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productCatalogService } from '../../services/productCatalogService';
import { getProductCategories } from '../../services/productCategoryService';
import { getProductBrandNames } from '../../services/productBrandNameService';
import productManufacturerService from '../../services/productManufacturerService';
import { productColorService } from '../../services/productColorService';
import productModelService from '../../services/productModelService';
import { Product } from '../../types';
import { Search, Package, Loader2, Filter, ChevronDown, ChevronUp, Plus, Grid3x3, Table as TableIcon } from 'lucide-react';
import ImageWithFallback from '../ImageWithFallback';
import Select from '../Select';
import toast from 'react-hot-toast';

interface MenuPanelProps {
  storeId: string;
  onProductSelect: (product: Product, quantity: number) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  selectedPriceCategory?: string;
  priceCategories?: Array<{ id: string; price_change_type: 'increase' | 'decrease'; percentage_change: number }>;
}

const MenuPanel: React.FC<MenuPanelProps> = ({
  storeId,
  onProductSelect,
  selectedCategory,
  onCategoryChange,
  selectedPriceCategory,
  priceCategories = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAllProductsFilter, setShowAllProductsFilter] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [productFilters, setProductFilters] = useState({
    category: '',
    brand: '',
    manufacturer: '',
    color: '',
    model: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as any[],
    brands: [] as any[],
    manufacturers: [] as any[],
    colors: [] as any[],
    models: [] as any[]
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch product categories
  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories', 'active'],
    queryFn: () => getProductCategories({ page: 1, limit: 1000, status: 'active' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch filter options using useQuery for better caching and error handling
  const { data: brandsData } = useQuery({
    queryKey: ['product-brands', 'active'],
    queryFn: () => getProductBrandNames(1, 1000, { status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: manufacturersData } = useQuery({
    queryKey: ['product-manufacturers', 'active'],
    queryFn: () => productManufacturerService.getProductManufacturers({ page: 1, limit: 1000, status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: colorsData } = useQuery({
    queryKey: ['product-colors', 'active'],
    queryFn: () => productColorService.getProductColors(1, 1000, { status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: modelsData } = useQuery({
    queryKey: ['product-models', 'active'],
    queryFn: () => productModelService.getProductModels({ status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });


  // Set filter options from query data
  useEffect(() => {
    setFilterOptions({
      categories: categoriesData?.productCategories || [],
      brands: brandsData?.data || [],
      manufacturers: manufacturersData?.data || [],
      colors: colorsData?.productColors || [],
      models: modelsData?.productModels || []
    });
  }, [categoriesData, brandsData, manufacturersData, colorsData, modelsData]);

  // Handle filter change
  const handleFilterChange = useCallback((filterName: string, value: string) => {
    setProductFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    
    // If category filter changes, sync with category tabs
    if (filterName === 'category') {
      onCategoryChange?.(value || 'all');
    }
  }, [onCategoryChange]);

  // Build categories list with "All Items" first
  const categories = useMemo(() => {
    const allCategories = [
      { id: 'all', name: 'All Items', color: '#6b7280' } // Default gray color for "All Items"
    ];
    
    if (categoriesData?.productCategories) {
      const activeCategories = categoriesData.productCategories
        .filter((cat: any) => cat.is_active)
        .map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          color: cat.color || '#2196f3' // Default blue if no color set
        }));
      allCategories.push(...activeCategories);
    }
    
    return allCategories;
  }, [categoriesData]);

  const activeCategory = selectedCategory || 'all';

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Determine which category to use: filter dropdown takes precedence, then active category tab
  const categoryToFilter = useMemo(() => {
    if (showAllProducts) return undefined; // Don't filter by category if "Show All Products" is enabled
    return productFilters.category || (activeCategory !== 'all' ? activeCategory : undefined);
  }, [productFilters.category, activeCategory, showAllProducts]);

  // Build server-side filters object
  const serverFilters = useMemo(() => {
    const filters: {
      category_id?: string;
      brand_id?: string;
      manufacturer_id?: string;
      color_id?: string;
      model_id?: string;
    } = {};

    if (categoryToFilter) {
      filters.category_id = categoryToFilter;
    }
    if (productFilters.brand) {
      filters.brand_id = productFilters.brand;
    }
    if (productFilters.manufacturer) {
      filters.manufacturer_id = productFilters.manufacturer;
    }
    if (productFilters.color) {
      filters.color_id = productFilters.color;
    }
    if (productFilters.model) {
      filters.model_id = productFilters.model;
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [categoryToFilter, productFilters.brand, productFilters.manufacturer, productFilters.color, productFilters.model]);

  // Fetch products for the store with server-side filtering
  const { data: products, isLoading } = useQuery({
    queryKey: ['pos-products', storeId, debouncedSearch, serverFilters],
    queryFn: () => productCatalogService.getProductsByStore(
      storeId,
      debouncedSearch,
      1000, // Increased limit to get all products for the store
      serverFilters
    ),
    enabled: !!storeId,
    staleTime: 10 * 1000,
  });

  const filteredProducts = products || [];

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleAddToOrder = (product: Product, e?: React.MouseEvent) => {
    // Prevent event propagation if called from button click
    if (e) {
      e.stopPropagation();
    }
    // Add directly to cart with quantity 1
    onProductSelect(product, 1);
  };

  const formatCurrency = (amount: number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calculate adjusted price based on selected price category
  const getAdjustedPrice = useCallback((product: Product): number => {
    const basePrice = product.selling_price || 0;
    
    // If no price category selected, return base price
    if (!selectedPriceCategory) {
      return basePrice;
    }

    // Try to find calculated price from product's price categories
    // Backend returns priceCategories in format: { price_category_id, calculated_price, priceCategory: { id, code, name } }
    if (product.priceCategories && Array.isArray(product.priceCategories)) {
      // Check if product has priceCategories array with calculated_price
      const priceCategoryMatch = product.priceCategories.find((pc: any) => {
        // Handle different possible structures from backend
        const pcId = pc.price_category_id || 
                    pc.priceCategory?.id || 
                    pc.id ||
                    (pc.priceCategory && typeof pc.priceCategory === 'object' ? pc.priceCategory.id : null);
        return pcId === selectedPriceCategory;
      });

      if (priceCategoryMatch) {
        // Get calculated_price from the price category match
        // Backend returns: { price_category_id, calculated_price, priceCategory: { id, code, name } }
        const calculatedPrice = (priceCategoryMatch as any).calculated_price;
        
        if (calculatedPrice !== undefined && calculatedPrice !== null) {
          const parsedPrice = parseFloat(calculatedPrice);
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            return parsedPrice;
          }
        }
      }
    }

    // If no pre-calculated price found, calculate it based on price category settings
    const priceCategory = priceCategories.find(pc => pc.id === selectedPriceCategory);
    if (priceCategory) {
      const percentage = priceCategory.percentage_change || 0;
      if (priceCategory.price_change_type === 'increase') {
        return basePrice * (1 + percentage / 100);
      } else {
        return basePrice * (1 - percentage / 100);
      }
    }

    // Fallback to base price
    return basePrice;
  }, [selectedPriceCategory, priceCategories]);

  // Convert hex to rgba for opacity
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Search Bar with Filters and View Toggle */}
      <div className="bg-gradient-to-r from-white via-gray-50/30 to-white border-b border-gray-200/50 px-6 py-4 shadow-sm backdrop-blur-sm relative z-10">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 transition-all shadow-sm hover:shadow-md backdrop-blur-sm"
            />
          </div>
          
          {/* Filter Button */}
          <div className="relative flex-shrink-0 z-50">
            <button
              onClick={() => setShowAllProductsFilter(!showAllProductsFilter)}
              className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md ${
                showAllProductsFilter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/80 text-gray-700 hover:bg-gray-100 border border-gray-200/50'
              }`}
              title="Filter Products"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter</span>
              {showAllProductsFilter ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {/* Filter Dropdown Panel */}
            {showAllProductsFilter && (
              <div className="absolute top-full right-0 mt-2 w-80 p-3 bg-white rounded-lg shadow-2xl border border-gray-300 z-[100] max-h-[70vh] overflow-y-auto">
                {/* Show All Products Checkbox */}
                <div className="mb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllProducts}
                      onChange={(e) => setShowAllProducts(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700">Show all products</span>
                  </label>
                </div>
                
                {/* Filter Dropdowns */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Category</label>
                    <Select
                      value={productFilters.category || (activeCategory !== 'all' ? activeCategory : '')}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      disabled={isLoading}
                      className="bg-white/80 border-gray-200/50 text-xs py-1"
                    >
                      <option value="">All Categories</option>
                      {filterOptions.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Brand</label>
                    <Select
                      value={productFilters.brand}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                      disabled={isLoading}
                      className="bg-white/80 border-gray-200/50 text-xs py-1"
                    >
                      <option value="">All Brands</option>
                      {filterOptions.brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Manufacturer Filter */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Manufacturer</label>
                    <Select
                      value={productFilters.manufacturer}
                      onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                      disabled={isLoading}
                      className="bg-white/80 border-gray-200/50 text-xs py-1"
                    >
                      <option value="">All Manufacturers</option>
                      {filterOptions.manufacturers.map((manufacturer) => (
                        <option key={manufacturer.id} value={manufacturer.id}>
                          {manufacturer.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Color Filter */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Color</label>
                    <Select
                      value={productFilters.color}
                      onChange={(e) => handleFilterChange('color', e.target.value)}
                      disabled={isLoading}
                      className="bg-white/80 border-gray-200/50 text-xs py-1"
                    >
                      <option value="">All Colors</option>
                      {filterOptions.colors.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Model Filter */}
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Model</label>
                    <Select
                      value={productFilters.model}
                      onChange={(e) => handleFilterChange('model', e.target.value)}
                      disabled={isLoading}
                      className="bg-white/80 border-gray-200/50 text-xs py-1"
                    >
                      <option value="">All Models</option>
                      {filterOptions.models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                
                {/* Clear Filters Button */}
                {(productFilters.category || productFilters.brand || productFilters.manufacturer || 
                  productFilters.color || productFilters.model) && (
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        setProductFilters({
                          category: '',
                          brand: '',
                          manufacturer: '',
                          color: '',
                          model: ''
                        });
                        // Reset category to 'all' when clearing filters
                        onCategoryChange?.('all');
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/80 text-gray-600 hover:bg-gray-100 border border-gray-200/50'
              }`}
              title="Card View"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/80 text-gray-600 hover:bg-gray-100 border border-gray-200/50'
              }`}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Display - Cards or Table */}
      <div className="flex-1 overflow-y-auto relative z-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="h-12 w-12 mb-2" />
            <p className="text-sm">
              {debouncedSearch ? 'No products found' : 'No products in this category'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-8 gap-1.5 p-2 auto-rows-fr">
            {filteredProducts.map((product: Product) => {
              const isOutOfStock = (product.currentQuantity || 0) <= 0;
              
              return (
                <div
                  key={product.id}
                  className={`bg-gradient-to-br from-white via-gray-50/30 to-white rounded-lg border border-gray-200/50 overflow-hidden transition-all shadow-md hover:shadow-xl ${
                    isOutOfStock
                      ? 'opacity-60'
                      : 'hover:border-blue-300/50 hover:scale-[1.02]'
                  }`}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-white relative overflow-hidden shadow-inner">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      module="products"
                      size="xl"
                      className="w-full h-full"
                      fallbackIcon="package"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-white font-semibold text-[10px]">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-1.5">
                    <h3 className="font-semibold text-[10px] text-gray-900 mb-0.5 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[9px] text-gray-500 mb-0.5 line-clamp-1">
                      {product.description || product.code}
                    </p>
                    
                    {/* Availability */}
                    <div className="text-[9px] text-gray-600 mb-0.5">
                      <span className={isOutOfStock ? 'text-red-600 font-medium' : ''}>
                        {product.currentQuantity || 0} Avail
                      </span>
                    </div>

                    {/* Price and Add Button */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-gray-900">
                        {formatCurrency(getAdjustedPrice(product))}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) {
                            // Create a product copy with adjusted price for cart
                            const adjustedProduct = {
                              ...product,
                              selling_price: getAdjustedPrice(product)
                            };
                            handleAddToOrder(adjustedProduct, e);
                          }
                        }}
                        disabled={isOutOfStock}
                        className={`p-1 rounded-full transition-all shadow-sm ${
                          isOutOfStock
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'cursor-pointer hover:opacity-90'
                        }`}
                        style={!isOutOfStock ? { backgroundColor: '#F87B1B' } : {}}
                        title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      >
                        <Plus className={`h-3 w-3 ${
                          isOutOfStock ? 'text-gray-500' : 'text-white'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product: Product) => {
                      const isOutOfStock = (product.currentQuantity || 0) <= 0;
                      
                      return (
                        <tr
                          key={product.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            isOutOfStock ? 'opacity-60' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 mr-3">
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.name}
                                  module="products"
                                  size="sm"
                                  className="h-10 w-10 rounded object-cover"
                                  fallbackIcon="package"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                {product.code && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {product.code}
                                  </div>
                                )}
                                {product.description && (
                                  <div className="text-xs text-gray-500 truncate max-w-md">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`text-sm font-medium ${
                              isOutOfStock ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {product.currentQuantity || 0}
                            </span>
                            {isOutOfStock && (
                              <div className="text-xs text-red-600 mt-1">Out of Stock</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-bold text-gray-900">
                              {formatCurrency(getAdjustedPrice(product))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOutOfStock) {
                                  const adjustedProduct = {
                                    ...product,
                                    selling_price: getAdjustedPrice(product)
                                  };
                                  handleAddToOrder(adjustedProduct, e);
                                }
                              }}
                              disabled={isOutOfStock}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg transition-all shadow-sm ${
                                isOutOfStock
                                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                  : 'bg-[#F87B1B] text-white hover:opacity-90 cursor-pointer'
                              }`}
                              title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Add</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPanel;

