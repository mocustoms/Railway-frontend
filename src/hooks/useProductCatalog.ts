import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Product, 
  ProductFormData, 
  ProductStats, 
  ProductFilters, 
  ProductSortConfig, 
  PaginatedProductResponse,
  ProductRawMaterial,
  ProductRawMaterialFormData,
  ProductPriceCategory,
  ProductStore
} from '../types';
import { productCatalogService } from '../services/productCatalogService';
import { storeLocationService } from '../services/storeLocationService';

interface UseProductCatalogReturn {
  // State
  products: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
  stats: ProductStats | null;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  };
  filters: ProductFilters;
  sortConfig: ProductSortConfig;
  
  // Actions
  fetchProducts: () => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  createProduct: (data: ProductFormData) => Promise<boolean>;
  updateProduct: (id: string, data: ProductFormData, existingImagePath?: string | null) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  setFilters: (filters: Partial<ProductFilters>) => void;
  setSortConfig: (sortConfig: ProductSortConfig) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetFilters: () => void;
  
  // Raw Materials
  rawMaterials: ProductRawMaterial[];
  addRawMaterial: (data: ProductRawMaterialFormData) => Promise<boolean>;
  updateRawMaterial: (id: string, data: ProductRawMaterialFormData) => Promise<boolean>;
  deleteRawMaterial: (id: string) => Promise<boolean>;
  
  // Price Categories
  priceCategories: ProductPriceCategory[];
  updatePriceCategories: (priceCategoryIds: string[]) => Promise<boolean>;
  
  // Store Assignment
  productStores: ProductStore[];
  assignToStores: (storeIds: string[]) => Promise<boolean>;
  updateProductStore: (storeId: string, data: any) => Promise<boolean>;
  removeFromStore: (storeId: string) => Promise<boolean>;
  removeFromAllStores: () => Promise<boolean>;
  
  // Import/Export
  importProducts: (file: File) => Promise<boolean>;
  exportToExcel: () => Promise<void>;
  exportToPDF: () => Promise<void>;
  getImportTemplate: () => Promise<void>;
  
  // Utilities
  getNextCode: () => Promise<string>;
  getNextBarcode: () => Promise<string>;
  
  // Reference Data
  referenceData: {
    categories: { id: string; name: string; cogs_account_id?: string; income_account_id?: string; asset_account_id?: string; tax_code_id?: string; purchases_tax_id?: string }[];
    brands: { id: string; name: string; logo?: string; is_active?: boolean }[];
    manufacturers: { id: string; name: string; logo?: string; is_active?: boolean }[];
    models: { id: string; name: string; logo?: string; is_active?: boolean }[];
    colors: { id: string; name: string; hex_code: string; is_active?: boolean }[];
    packagings: { id: string; name: string; pieces?: number }[];
    accounts: { id: string; name: string; type: string }[];
          taxCodes: { id: string; name: string; rate: number }[];
      priceCategories: { id: string; name: string; code: string; price_change_type: string; percentage_change: number }[];
      stores: { id: string; name: string; store_type: string; location: string; address?: string; is_active: boolean }[];
    storeLocations: { id: string; location_name: string; store_name: string; store_id: string; is_active: boolean }[];
  };
  fetchReferenceData: () => Promise<void>;
}

export const useProductCatalog = (): UseProductCatalogReturn => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [rawMaterials, setRawMaterials] = useState<ProductRawMaterial[]>([]);
  const [priceCategories, setPriceCategories] = useState<ProductPriceCategory[]>([]);
  const [productStores, setProductStores] = useState<ProductStore[]>([]);
  
  // Reference data state
  const [referenceData, setReferenceData] = useState({
    categories: [] as { id: string; name: string; cogs_account_id?: string; income_account_id?: string; asset_account_id?: string; tax_code_id?: string; purchases_tax_id?: string }[],
    brands: [] as { id: string; name: string; logo?: string; is_active?: boolean }[],
    manufacturers: [] as { id: string; name: string; logo?: string; is_active?: boolean }[],
    models: [] as { id: string; name: string; logo?: string; is_active?: boolean }[],
    colors: [] as { id: string; name: string; hex_code: string; is_active?: boolean }[],
    packagings: [] as { id: string; name: string; pieces?: number }[],
    accounts: [] as { id: string; name: string; type: string }[],
    taxCodes: [] as { id: string; name: string; rate: number }[],
          priceCategories: [] as { id: string; name: string; code: string; price_change_type: string; percentage_change: number }[],
      stores: [] as { id: string; name: string; store_type: string; location: string; address?: string; is_active: boolean }[],
    storeLocations: [] as { id: string; location_name: string; store_name: string; store_id: string; is_active: boolean }[]
  });
  
  // Pagination and filters
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    startIndex: 0,
    endIndex: 0
  });
  
  const [filters, setFiltersState] = useState<ProductFilters>({
    search: '',
    status: 'all'
  });
  
  const [sortConfig, setSortConfigState] = useState<ProductSortConfig>({
    column: 'created_at',
    direction: 'desc'
  });

  // Fetch products with current filters and pagination
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productCatalogService.getProducts(
        pagination.page,
        pagination.limit,
        filters,
        sortConfig
      );
      
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, sortConfig]);

  // Fetch products on mount and when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch single product
  const fetchProduct = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const product = await productCatalogService.getProduct(id);
      setCurrentProduct(product);
      
      // No need to fetch related data separately - the main endpoint already includes it
      // The product object contains: stores (as 'assignedStores'), priceCategories, etc.
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create product
  const createProduct = useCallback(async (data: ProductFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await productCatalogService.createProduct(data);
      toast.success('Product created successfully');
      
      // Refresh the list
      await fetchProducts();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  // Update product
  const updateProduct = useCallback(async (id: string, data: ProductFormData, existingImagePath?: string | null): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await productCatalogService.updateProduct(id, data, existingImagePath);
      toast.success('Product updated successfully');
      
      // Refresh current product and list
      await fetchProduct(id);
      await fetchProducts();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProduct, fetchProducts]);

  // Delete product
  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await productCatalogService.deleteProduct(id);
      toast.success('Product deleted successfully');
      
      // Refresh the list
      await fetchProducts();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await productCatalogService.getProductStats();
      setStats(statsData);
    } catch (err) {
      }
  }, []);

  // Raw Materials Management
  const fetchRawMaterials = useCallback(async (productId: string) => {
    try {
      const materials = await productCatalogService.getProductRawMaterials(productId);
      setRawMaterials(materials);
    } catch (err) {
      }
  }, []);

  const addRawMaterial = useCallback(async (data: ProductRawMaterialFormData): Promise<boolean> => {
    if (!currentProduct) return false;
    
    try {
      const material = await productCatalogService.addRawMaterial(currentProduct.id, data);
      setRawMaterials(prev => [...prev, material]);
      toast.success('Raw material added successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add raw material';
      toast.error(errorMessage);
      return false;
    }
  }, [currentProduct]);

  const updateRawMaterial = useCallback(async (id: string, data: ProductRawMaterialFormData): Promise<boolean> => {
    if (!currentProduct) return false;
    
    try {
      const material = await productCatalogService.updateRawMaterial(currentProduct.id, id, data);
      setRawMaterials(prev => prev.map(m => m.id === id ? material : m));
      toast.success('Raw material updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update raw material';
      toast.error(errorMessage);
      return false;
    }
  }, [currentProduct]);

  const deleteRawMaterial = useCallback(async (id: string): Promise<boolean> => {
    if (!currentProduct) return false;
    
    try {
      await productCatalogService.deleteRawMaterial(currentProduct.id, id);
      setRawMaterials(prev => prev.filter(m => m.id !== id));
      toast.success('Raw material removed successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove raw material';
      toast.error(errorMessage);
      return false;
    }
  }, [currentProduct]);

  // Price Categories Management
  const fetchPriceCategories = useCallback(async (productId: string) => {
    try {
      const categories = await productCatalogService.getProductPriceCategories(productId);
      setPriceCategories(categories);
    } catch (err) {
      }
  }, []);

  const updatePriceCategories = useCallback(async (priceCategoryIds: string[]): Promise<boolean> => {
    if (!currentProduct) return false;
    
    try {
      const categories = await productCatalogService.updateProductPriceCategories(currentProduct.id, priceCategoryIds);
      setPriceCategories(categories);
      toast.success('Price categories updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update price categories';
      toast.error(errorMessage);
      return false;
    }
  }, [currentProduct]);

  // Store Assignment Management
  const fetchProductStores = useCallback(async (productId: string) => {
    try {
      const stores = await productCatalogService.getProductStores(productId);
      setProductStores(stores);
    } catch (err) {
      }
  }, []);

  const assignToStores = useCallback(async (storeIds: string[]): Promise<boolean> => {
    if (!currentProduct) return false;
    
    try {
      const stores = await productCatalogService.assignProductToStores(currentProduct.id, storeIds);
      setProductStores(stores);
      toast.success('Product assigned to stores successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign product to stores';
      toast.error(errorMessage);
      return false;
    }
  }, [currentProduct]);

  const updateProductStore = useCallback(async (storeId: string, data: any): Promise<boolean> => {
    if (!currentProduct) return false;
    
    try {
      const store = await productCatalogService.updateProductStore(currentProduct.id, storeId, data);
      setProductStores(prev => prev.map(s => s.id === store.id ? store : s));
      toast.success('Store assignment updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update store assignment';
      toast.error(errorMessage);
      return false;
    }
  }, [currentProduct]);

  const removeFromStore = useCallback(async (storeId: string): Promise<boolean> => {
    if (!currentProduct) return false;
    
    try {
      await productCatalogService.removeProductFromStore(currentProduct.id, storeId);
      setProductStores(prev => prev.filter(s => s.id !== storeId));
      toast.success('Product removed from store successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove product from store';
      toast.error(errorMessage);
      return false;
    }
  }, [currentProduct]);

  const removeFromAllStores = useCallback(async (): Promise<boolean> => {
    if (!currentProduct) return false;
    
    try {
      await productCatalogService.removeProductFromAllStores(currentProduct.id);
      setProductStores([]);
      toast.success('Product removed from all stores successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove product from all stores';
      toast.error(errorMessage);
      return false;
    }
  }, [currentProduct]);

  // Import/Export
  const importProducts = useCallback(async (file: File): Promise<boolean> => {
    try {
      const result = await productCatalogService.importProducts(file);
      toast.success(`Import completed: ${result.imported} products imported`);
      
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred during import`);
        }
      
      // Refresh the list
      await fetchProducts();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import products';
      toast.error(errorMessage);
      return false;
    }
  }, [fetchProducts]);

  const exportToExcel = useCallback(async () => {
    try {
      const blob = await productCatalogService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export to Excel completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export to Excel';
      toast.error(errorMessage);
    }
  }, [filters]);

  const exportToPDF = useCallback(async () => {
    try {
      const blob = await productCatalogService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export to PDF completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export to PDF';
      toast.error(errorMessage);
    }
  }, [filters]);

  const getImportTemplate = useCallback(async () => {
    try {
      const blob = await productCatalogService.getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-import-template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Import template downloaded');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download import template';
      toast.error(errorMessage);
    }
  }, []);

  // Utilities
  const getNextCode = useCallback(async (): Promise<string> => {
    try {
      const response = await productCatalogService.getNextProductCode();
      return response.nextCode;
    } catch (err) {
      return '';
    }
  }, []);

  const getNextBarcode = useCallback(async (): Promise<string> => {
    try {
      const response = await productCatalogService.getNextBarcode();
      return response.nextBarcode;
    } catch (err) {
      return '';
    }
  }, []);

  // Fetch reference data for forms
  const fetchReferenceData = useCallback(async () => {
    try {
      const [
        categories,
        brands,
        manufacturers,
        models,
        colors,
        packagings,
        accounts,
        taxCodes,
        priceCategories,
        stores,
        storeLocations
      ] = await Promise.all([
        productCatalogService.getReferenceCategories(),
        productCatalogService.getReferenceBrands(),
        productCatalogService.getReferenceManufacturers(),
        productCatalogService.getReferenceModels(),
        productCatalogService.getReferenceColors(),
        productCatalogService.getReferencePackagings(),
        productCatalogService.getReferenceAccounts(),
        productCatalogService.getReferenceTaxCodes(),
        productCatalogService.getReferencePriceCategories(),
        productCatalogService.getReferenceStores(),
        storeLocationService.getActiveStoreLocations()
      ]);

      setReferenceData({
        categories,
        brands,
        manufacturers,
        models,
        colors,
        packagings,
        accounts,
        taxCodes,
        priceCategories,
        stores,
        storeLocations
      });
    } catch (error) {
      toast.error('Failed to load form options');
    }
  }, []);

  // Filter and sort management
  const setFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const setSortConfig = useCallback((newSortConfig: ProductSortConfig) => {
    setSortConfigState(newSortConfig);
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 })); // Reset to first page
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ search: '', status: 'all' });
    setSortConfigState({ column: 'created_at', direction: 'desc' });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Effects
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  return {
    // State
    products,
    currentProduct,
    loading,
    error,
    stats,
    pagination,
    filters,
    sortConfig,
    
    // Actions
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
    
    // Raw Materials
    rawMaterials,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    
    // Price Categories
    priceCategories,
    updatePriceCategories,
    
    // Store Assignment
    productStores,
    assignToStores,
    updateProductStore,
    removeFromStore,
    removeFromAllStores,
    
    // Import/Export
    importProducts,
    exportToExcel,
    exportToPDF,
    getImportTemplate,
    
    // Utilities
    getNextCode,
    getNextBarcode,
    
    // Reference Data
    referenceData,
    fetchReferenceData
  };
};
