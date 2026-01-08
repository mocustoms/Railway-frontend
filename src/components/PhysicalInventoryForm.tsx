import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  X,
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  Hash,
  Plus,
  Minus,
  Upload,
  MoreHorizontal
} from 'lucide-react';
import { PhysicalInventory as PhysicalInventoryType, PhysicalInventoryFormData } from '../types';
import { physicalInventoryService } from '../services/physicalInventoryService';
import { storeService } from '../services/storeService';
import { productCatalogService } from '../services/productCatalogService';
import { currencyService } from '../services/currencyService';
import { getAllActiveExchangeRates } from '../services/exchangeRateService';
import { getProductCategories } from '../services/productCategoryService';
import { getProductBrandNames } from '../services/productBrandNameService';
import productManufacturerService from '../services/productManufacturerService';
import { productColorService } from '../services/productColorService';
import productModelService from '../services/productModelService';
import { packagingService } from '../services/packagingService';
import { storeLocationService } from '../services/storeLocationService';
import { useAccounts } from '../hooks/useAccounts';
import { useAdjustmentReasons } from '../hooks/useAdjustmentReasons';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';
import { PhysicalInventoryImportModal } from './PhysicalInventoryImportModal';
import toast from 'react-hot-toast';

// Tooltip component for hover information
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, delay = 2000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {isVisible && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          {content}
        </div>
      )}
    </div>
  );
};

interface PhysicalInventoryFormProps {
  physicalInventory?: PhysicalInventoryType | null;
  onSubmit: (data: PhysicalInventoryFormData, status: 'draft' | 'submitted') => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const validationSchema = yup.object({
  inventory_date: yup.string().required('Inventory date is required'),
  store_id: yup.string().required('Store is required'),
  currency_id: yup.string().required('Currency is required'),
  exchange_rate: yup.number().min(0.0001, 'Exchange rate must be greater than 0').required('Exchange rate is required'),
  inventory_in_reason_id: yup.string().required('Inventory IN reason is required'),
  inventory_out_reason_id: yup.string().required('Inventory OUT reason is required'),
  inventory_in_account_id: yup.string().required('Inventory IN account is required'),
  inventory_in_corresponding_account_id: yup.string().required('Inventory IN corresponding account is required'),
  inventory_out_account_id: yup.string().required('Inventory OUT account is required'),
  inventory_out_corresponding_account_id: yup.string().required('Inventory OUT corresponding account is required'),
  notes: yup.string().optional(),
  items: yup.array().of(
    yup.object().shape({
      product_id: yup.string().required('Product is required'),
      current_quantity: yup.number().min(0, 'Current quantity must be non-negative').required('Current quantity is required'),
      counted_quantity: yup.number().min(0, 'Counted quantity must be non-negative').required('Counted quantity is required'),
      adjustment_in_reason_id: yup.string().optional(),
      adjustment_out_reason_id: yup.string().optional(),
      unit_cost: yup.number().min(0, 'Unit cost must be non-negative').required('Unit cost is required'),
      unit_average_cost: yup.number().min(0, 'Unit average cost must be non-negative').optional(),
      expiry_date: yup.string().optional(),
      batch_number: yup.string().optional(),
      serial_numbers: yup.array().of(yup.string()).optional(),
      notes: yup.string().optional()
    })
  ).min(1, 'At least one item is required')
});

const PhysicalInventoryForm: React.FC<PhysicalInventoryFormProps> = ({
  physicalInventory,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { isSidebarCollapsed } = useSidebar();
  const { stores: userStores } = useAuth();
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [stores, setStores] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [allProductsCache, setAllProductsCache] = useState<any[]>([]); // Cache for all loaded products
  const [adjustmentReasons, setAdjustmentReasons] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  
  // Loading states
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [isLoadingAdjustmentReasons, setIsLoadingAdjustmentReasons] = useState(false);
  
  // Form state
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // const [selectedFilters, setSelectedFilters] = useState<any>({}); // Unused - removed to fix linting
  const [productFilters, setProductFilters] = useState({
    category: '',
    brand: '',
    manufacturer: '',
    color: '',
    model: '',
    packaging: '',
    location: '',
    status: 'active'
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as any[],
    brands: [] as any[],
    manufacturers: [] as any[],
    colors: [] as any[],
    models: [] as any[],
    packagings: [] as any[],
    locations: [] as any[]
  });
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null);
  const [fullPhysicalInventory, setFullPhysicalInventory] = useState<PhysicalInventoryType | null>(null);
  
  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { accounts } = useAccounts();
  const { adjustmentReasons: reasons } = useAdjustmentReasons();

  // Constants for localStorage key
  const PHYSICAL_INVENTORY_COLUMNS_VISIBILITY_KEY = 'easymauzo-physical-inventory-columns-visibility';

  // Default column visibility (Batch Numbers, Serial Numbers, Notes, Exchange Rate, Equivalent Amount, Unit Average Cost, Expiry Dates hidden by default)
  const defaultVisibleColumns = {
    product: true,
    currentStock: true,
    countedQuantity: true,
    unitCost: true,
    unitAverageCost: false, // Hidden by default
    adjustmentIn: true,
    adjustmentOut: true,
    newStock: true,
    totalValue: true,
    exchangeRate: false, // Hidden by default
    equivalentAmount: false, // Hidden by default
    expiryDates: false, // Hidden by default
    batchNumbers: false, // Hidden by default
    serialNumbers: false, // Hidden by default
    notes: false, // Hidden by default
    actions: true
  };

  // Column visibility state for items table - Initialize from localStorage or use defaults
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const savedState = localStorage.getItem(PHYSICAL_INVENTORY_COLUMNS_VISIBILITY_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Merge with defaults to ensure any new columns are included
        const merged = { ...defaultVisibleColumns, ...parsed };
        return merged;
      }
      return defaultVisibleColumns;
    } catch (error) {
      return defaultVisibleColumns;
    }
  });

  // Sort state for items table
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(PHYSICAL_INVENTORY_COLUMNS_VISIBILITY_KEY, JSON.stringify(visibleColumns));
    } catch (error) {
      // Handle localStorage errors silently
    }
  }, [visibleColumns, PHYSICAL_INVENTORY_COLUMNS_VISIBILITY_KEY]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('physical-inventory-items-columns-dropdown');
      const target = event.target as HTMLElement;
      if (dropdown && !dropdown.contains(target)) {
        // Check if click is on the More Columns button
        const button = target.closest('button');
        if (!button || !button.querySelector('svg') || !button.textContent?.includes('More Columns')) {
          dropdown.classList.add('hidden');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle column sorting
  const handleSort = (columnKey: string) => {
    const newDirection: 'asc' | 'desc' = sortConfig.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: columnKey, direction: newDirection });
  };

  // Get sort indicator for a column
  const getSortIndicator = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp size={14} className="text-gray-300" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} className="text-blue-600" /> : 
      <ChevronDown size={14} className="text-blue-600" />;
  };

  // Helper function to clean numeric strings (remove multiple decimal points)
  const cleanNumericValue = useCallback((value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    // Convert to string and remove all non-numeric characters except first decimal point and minus sign
    let cleaned = String(value).replace(/[^0-9.-]/g, '');
    
    // Handle negative sign - ensure it's only at the start
    const isNegative = cleaned.startsWith('-');
    cleaned = cleaned.replace(/-/g, '');
    if (isNegative) {
      cleaned = '-' + cleaned;
    }
    
    // Handle multiple decimal points by keeping only the first one
    if (cleaned.includes('.')) {
      const firstDotIndex = cleaned.indexOf('.');
      const beforeDot = cleaned.substring(0, firstDotIndex + 1);
      const afterDot = cleaned.substring(firstDotIndex + 1).replace(/\./g, '');
      cleaned = beforeDot + afterDot;
    }
    
    // If empty after cleaning, return 0
    if (cleaned === '' || cleaned === '-') {
      return 0;
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<PhysicalInventoryFormData>({
    resolver: yupResolver(validationSchema) as any,
    mode: 'onChange',
    defaultValues: {
      inventory_date: new Date().toISOString().split('T')[0],
      store_id: '',
      currency_id: '', // Will be auto-populated with default currency
      exchange_rate: 1.0,
      inventory_in_reason_id: '',
      inventory_out_reason_id: '',
      inventory_in_account_id: '',
      inventory_in_corresponding_account_id: '',
      inventory_out_account_id: '',
      inventory_out_corresponding_account_id: '',
      notes: '',
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedStoreId = watch('store_id');
  const watchedCurrencyId = watch('currency_id');
  const watchedInventoryInReasonId = watch('inventory_in_reason_id');
  const watchedInventoryOutReasonId = watch('inventory_out_reason_id');

  // Fetch full physical inventory data when editing
  useEffect(() => {
    const fetchFullPhysicalInventory = async () => {
      if (physicalInventory && physicalInventory.id) {
        try {
          const fullData = await physicalInventoryService.getPhysicalInventory(physicalInventory.id);
          setFullPhysicalInventory(fullData);
          // Load product information for all items in the inventory
          if (fullData.items && fullData.items.length > 0) {
            const productIds = fullData.items.map(item => item.product_id).filter(Boolean);
            
            if (productIds.length > 0) {
              try {
                // Fetch product details for all items
                const productPromises = productIds.map(async (productId: string) => {
                  try {
                    const productData = await productCatalogService.getProduct(productId);
                    return productData;
                  } catch (error) {
                    return null;
                  }
                });
                
                const loadedProducts = await Promise.all(productPromises);
                const validProducts = loadedProducts.filter(Boolean);
                
                // Add products to cache for edit mode
                setAllProductsCache(prevCache => {
                  const existingIds = new Set(prevCache.map(p => p.id));
                  const uniqueNewProducts = validProducts.filter((p): p is NonNullable<typeof p> => p !== null && !existingIds.has(p.id));
                  return [...prevCache, ...uniqueNewProducts];
                });
                
              } catch (error) {
                }
            }
          }
        } catch (error) {
          toast.error('Failed to load physical inventory details');
          setFullPhysicalInventory(physicalInventory);
        }
      } else {
        setFullPhysicalInventory(null);
      }
    };

    fetchFullPhysicalInventory();
  }, [physicalInventory]);

  const loadProducts = useCallback(async (searchTerm?: string, filters?: any) => {
    try {
      const selectedStoreId = watch('store_id');
      
      if (!selectedStoreId) {
        toast.error('Please select a store first');
        return;
      }
      
      const data = await productCatalogService.getProductsByStore(selectedStoreId, searchTerm || '', 100);
      
      // Filter out services products
      const nonServiceProducts = (data || []).filter((product: any) => product.product_type !== 'services');
      
      // Update the cache with all products from this store
      const newProducts = nonServiceProducts;
      setAllProductsCache(prevCache => {
        // Merge new products with existing cache, avoiding duplicates
        const existingIds = new Set(prevCache.map(p => p.id));
        const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
        return [...prevCache, ...uniqueNewProducts];
      });
      
      // Apply client-side filtering if filters are provided
      let filteredProducts = newProducts;
      
      if (filters) {
        filteredProducts = filteredProducts.filter((product: any) => {
          // Category filter
          if (filters.category && product.category?.id !== filters.category) {
            return false;
          }
          // Brand filter
          if (filters.brand && product.brand?.id !== filters.brand) {
            return false;
          }
          // Manufacturer filter
          if (filters.manufacturer && product.manufacturer?.id !== filters.manufacturer) {
            return false;
          }
          // Color filter
          if (filters.color && product.color?.id !== filters.color) {
            return false;
          }
          // Model filter
          if (filters.model && product.model?.id !== filters.model) {
            return false;
          }
          // Packaging filter
          if (filters.packaging && product.packaging?.id !== filters.packaging) {
            return false;
          }
          // Store Location filter
          if (filters.storeLocation && product.storeLocation?.id !== filters.storeLocation) {
            return false;
          }
          return true;
        });
      }
      
      // Map the Product data to our expected format
      const mappedProducts = filteredProducts.map((product: any) => {
        // Check for various possible store quantity field names
        const storeQuantity = product.storeQuantity || 
                             product.store_quantity || 
                             product.quantity || 
                             product.stock_quantity ||
                             product.available_quantity ||
                             product.stores?.find((s: any) => s.store_id === selectedStoreId)?.quantity ||
                             product.product_stores?.find((ps: any) => ps.store_id === selectedStoreId)?.quantity ||
                             product.currentQuantity || 
                             0;
        
        return {
          id: product.id,
          name: product.name,
          code: product.code,
          currentQuantity: product.currentQuantity || 0,
          storeQuantity: storeQuantity, // Store-specific quantity
          average_cost: product.average_cost || 0,
          track_serial_number: product.track_serial_number || false,
          expiry_notification_days: product.expiry_notification_days,
          category: product.category,
          unit: product.unit,
          brand: product.brand,
          manufacturer: product.manufacturer
        };
      });
      setProducts(mappedProducts);
    } catch (error) {
      toast.error('Failed to load products');
    }
  }, [watch]);

  // Load currencies
  const loadCurrencies = useCallback(async () => {
    try {
      setIsLoadingCurrencies(true);
      const data = await currencyService.getCurrencies(1, 1000);
      setCurrencies(data.currencies || []);
      
      // Find and set default currency
      const defaultCurrency = data.currencies?.find((currency: any) => currency.is_default);
      if (defaultCurrency) {
        setDefaultCurrency(defaultCurrency);
        // Auto-select the default currency
        setValue('currency_id', defaultCurrency.id);
      }
    } catch (error) {
      toast.error('Failed to load currencies');
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [setValue]);

  // Load stores
  const loadStores = useCallback(async () => {
    try {
      setIsLoadingStores(true);
      const data = await storeService.getStores({ limit: 1000, status: 'active' });
      setStores(data.data || []);
    } catch (error) {
      toast.error('Failed to load stores');
    } finally {
      setIsLoadingStores(false);
    }
  }, []);

  // Filter stores based on user access
  const getUserAssignedStores = () => {
    if (!userStores || userStores.length === 0) {
      return [];
    }
    return stores.filter(store => {
      return userStores.some(userStore => {
        return userStore.id === store.id && store.is_active;
      });
    });
  };

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      setIsLoadingFilters(true);
      
      const [
        categoriesResponse,
        brandsResponse,
        manufacturersResponse,
        colorsResponse,
        modelsResponse,
        packagingResponse,
        storeLocationsResponse
      ] = await Promise.all([
        getProductCategories({ page: 1, limit: 1000, status: 'active' }),
        getProductBrandNames(1, 1000, { status: 'active' }),
        productManufacturerService.getProductManufacturers({ page: 1, limit: 1000, status: 'active' }),
        productColorService.getProductColors(1, 1000, { status: 'active' }),
        productModelService.getProductModels({ status: 'active' }),
        packagingService.getPackaging(1, 1000, { status: 'active' }),
        storeLocationService.getStoreLocations(1, 1000, { status: 'active' })
      ]);

      setFilterOptions({
        categories: categoriesResponse.productCategories || [],
        brands: brandsResponse.data || [],
        manufacturers: manufacturersResponse.data || [],
        colors: colorsResponse.productColors || [],
        models: modelsResponse.productModels || [],
        packagings: packagingResponse.data || [],
        locations: storeLocationsResponse.data || []
      });
    } catch (error) {
      toast.error('Failed to load filter options');
    } finally {
      setIsLoadingFilters(false);
    }
  }, []);

  // Load adjustment reasons
  const loadAdjustmentReasons = useCallback(async () => {
    try {
      setIsLoadingAdjustmentReasons(true);
      setAdjustmentReasons(reasons || []);
    } catch (error) {
      toast.error('Failed to load adjustment reasons');
    } finally {
      setIsLoadingAdjustmentReasons(false);
    }
  }, [reasons]);

  // Load exchange rates
  const loadExchangeRates = useCallback(async () => {
    try {
      const data = await getAllActiveExchangeRates();
      setExchangeRates(data || []);
    } catch (error) {
      }
  }, []);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      await Promise.all([
        loadStores(),
        loadCurrencies(),
        loadAdjustmentReasons(),
        loadExchangeRates(),
        loadFilterOptions()
      ]);
    };

    loadReferenceData();
  }, [loadStores, loadCurrencies, loadAdjustmentReasons, loadExchangeRates, loadFilterOptions]);

  // Load products when store changes
  useEffect(() => {
    if (watchedStoreId) {
      // Only load products if there's a search term or filters are applied
      const hasSearchTerm = productSearchTerm.trim() !== '';
      const hasActiveFilters = Object.values(productFilters).some(value => 
        value !== '' && value !== 'active'
      );
      
      if (hasSearchTerm || hasActiveFilters) {
        loadProducts(productSearchTerm, productFilters);
      } else {
        // Clear search results but keep cache for added products
        setProducts([]);
      }
    } else {
      // Clear everything when no store is selected
      setProducts([]);
      setAllProductsCache([]);
    }
  }, [watchedStoreId, productSearchTerm, productFilters, loadProducts]);

  // Auto-select accounts when Inventory IN reason changes
  useEffect(() => {
    if (watchedInventoryInReasonId && adjustmentReasons.length > 0) {
      const selectedReason = adjustmentReasons.find(reason => reason.id === watchedInventoryInReasonId);
      if (selectedReason) {
        // Set inventory IN account
        if (selectedReason.trackingAccountId) {
          setValue('inventory_in_account_id', selectedReason.trackingAccountId);
        }
        // Set corresponding IN account
        if (selectedReason.correspondingAccountId) {
          setValue('inventory_in_corresponding_account_id', selectedReason.correspondingAccountId);
        }
      }
    }
  }, [watchedInventoryInReasonId, adjustmentReasons, setValue]);

  // Auto-select accounts when Inventory OUT reason changes
  useEffect(() => {
    if (watchedInventoryOutReasonId && adjustmentReasons.length > 0) {
      const selectedReason = adjustmentReasons.find(reason => reason.id === watchedInventoryOutReasonId);
      if (selectedReason) {
        // Set inventory OUT account
        if (selectedReason.trackingAccountId) {
          setValue('inventory_out_account_id', selectedReason.trackingAccountId);
        }
        // Set corresponding OUT account
        if (selectedReason.correspondingAccountId) {
          setValue('inventory_out_corresponding_account_id', selectedReason.correspondingAccountId);
        }
      }
    }
  }, [watchedInventoryOutReasonId, adjustmentReasons, setValue]);

  // Load existing data if editing
  useEffect(() => {
    if (fullPhysicalInventory) {
      reset({
        inventory_date: fullPhysicalInventory.inventory_date,
        store_id: fullPhysicalInventory.store_id,
        currency_id: fullPhysicalInventory.currency_id,
        exchange_rate: cleanNumericValue(fullPhysicalInventory.exchange_rate),
        inventory_in_reason_id: fullPhysicalInventory.inventory_in_reason_id || '',
        inventory_out_reason_id: fullPhysicalInventory.inventory_out_reason_id || '',
        inventory_in_account_id: fullPhysicalInventory.inventory_in_account_id || '',
        inventory_in_corresponding_account_id: fullPhysicalInventory.inventory_in_corresponding_account_id || '',
        inventory_out_account_id: fullPhysicalInventory.inventory_out_account_id || '',
        inventory_out_corresponding_account_id: fullPhysicalInventory.inventory_out_corresponding_account_id || '',
        notes: fullPhysicalInventory.notes || '',
        items: fullPhysicalInventory.items?.map(item => {
          // Get product info to use average cost as fallback
          const product = fullPhysicalInventory.items?.find(i => i.product_id === item.product_id)?.product;
          return {
            product_id: item.product_id,
            current_quantity: cleanNumericValue(item.current_quantity),
            counted_quantity: cleanNumericValue(item.counted_quantity),
            adjustment_in_reason_id: item.adjustment_in_reason_id || '',
            adjustment_out_reason_id: item.adjustment_out_reason_id || '',
            unit_cost: cleanNumericValue(item.unit_cost),
            unit_average_cost: cleanNumericValue(product?.average_cost || item.unit_average_cost || 0), // Always use product's average cost (readonly field)
            expiry_date: item.expiry_date || '',
            batch_number: item.batch_number || '',
            serial_numbers: item.serial_numbers || [],
            notes: item.notes || ''
          };
        }) || []
      });
    } else if (defaultCurrency && !watch('currency_id')) {
      // Only auto-select default currency for new inventories
      setValue('currency_id', defaultCurrency.id);
    }
  }, [fullPhysicalInventory, reset, defaultCurrency, setValue, watch]);

  // Calculate exchange rate
  const calculateExchangeRate = useCallback(() => {
    if (!watchedCurrencyId || !defaultCurrency) return null;
    
    // If editing existing inventory, use the saved exchange rate first
    const savedExchangeRate = watch('exchange_rate');
    if (savedExchangeRate && savedExchangeRate !== 1) {
      return savedExchangeRate;
    }
    
    // If same currency as default, return 1
    if (watchedCurrencyId === defaultCurrency.id) return 1;
    
    // Otherwise, look up from exchange rates table
    const exchangeRate = exchangeRates.find(rate => 
      rate.from_currency_id === watchedCurrencyId && 
      rate.to_currency_id === defaultCurrency.id
    );
    
    return exchangeRate ? exchangeRate.rate : null;
  }, [watchedCurrencyId, defaultCurrency, exchangeRates, watch]);

  // Update exchange rate when currency changes (only for new inventories)
  useEffect(() => {
    // Only update exchange rate if we're creating a new inventory (not editing)
    if (!fullPhysicalInventory) {
      const rate = calculateExchangeRate();
      if (rate !== null) {
        const cleanedRate = cleanNumericValue(rate);
        setValue('exchange_rate', cleanedRate);
      }
    }
  }, [calculateExchangeRate, setValue, fullPhysicalInventory, cleanNumericValue]);

  // Ensure exchange rate is set in form data when editing existing inventory
  useEffect(() => {
    if (fullPhysicalInventory && fullPhysicalInventory.exchange_rate) {
      const cleanedRate = cleanNumericValue(fullPhysicalInventory.exchange_rate);
      setValue('exchange_rate', cleanedRate);
    }
  }, [fullPhysicalInventory, setValue, cleanNumericValue]);

  // Watch inventory reason IDs
  const inventoryInReasonId = watch('inventory_in_reason_id');
  const inventoryOutReasonId = watch('inventory_out_reason_id');

  // Update adjustment reason IDs for all items when global reasons change
  useEffect(() => {
    const currentItems = watch('items') || [];

    if (currentItems.length > 0 && (inventoryInReasonId || inventoryOutReasonId)) {
      const updatedItems = currentItems.map(item => ({
        ...item,
        adjustment_in_reason_id: inventoryInReasonId || item.adjustment_in_reason_id,
        adjustment_out_reason_id: inventoryOutReasonId || item.adjustment_out_reason_id
      }));
      
      setValue('items', updatedItems);
    }
  }, [inventoryInReasonId, inventoryOutReasonId, setValue]);

  // Load products by IDs for import
  const loadProductsByIds = useCallback(async (productIds: string[]) => {
    try {
      const response = await productCatalogService.getProducts(
        1, // page
        1000, // limit - get all products
        { search: '', status: 'all' }, // filters
        { column: 'created_at', direction: 'desc' } // sort
      );
      
      // Filter products by the requested IDs
      const filteredProducts = response.products.filter((product: any) => 
        productIds.includes(product.id)
      );
      
      // Add to cache for future use
      const newCache = [...allProductsCache];
      filteredProducts.forEach((product: any) => {
        if (!newCache.find((p: any) => p.id === product.id)) {
          newCache.push(product);
        }
      });
      setAllProductsCache(newCache);
      
      return filteredProducts;
    } catch (error) {
      return [];
    }
  }, [allProductsCache]);

  // Get product info by ID
  const getProductInfo = useCallback((productId: string) => {
    // First try to find in current products (search results)
    let product = products.find(p => p.id === productId);
    
    // If not found, try to find in the cache
    if (!product) {
      product = allProductsCache.find(p => p.id === productId);
    }
    
    return product;
  }, [products, allProductsCache]);

  // Calculate item total
  const calculateItemTotal = useCallback((item: any, currentQuantity: number) => {
    const countedQuantity = Number(item?.counted_quantity || 0);
    const unitCost = Number(item?.unit_cost || 0);
    return countedQuantity * unitCost;
  }, []);

  // Format currency with symbol
  const formatCurrencyWithSymbol = useCallback((amount: number, currencyId: string) => {
    const numericAmount = Number(amount) || 0;
    const currency = currencies.find(c => c.id === currencyId);
    if (!currency) return `${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${currency.symbol}${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currencies]);

  // Handle product search
  const handleProductSearch = useCallback((searchTerm: string) => {
    setProductSearchTerm(searchTerm);
    
    // Update isSearching state based on search term and filters
    const hasSearchTerm = searchTerm.trim() !== '';
    const hasActiveFilters = Object.values(productFilters).some(value => 
      value !== '' && value !== 'active'
    );
    setIsSearching(hasSearchTerm || hasActiveFilters);
    
    // If search term is empty and no filters are active, clear products
    if (searchTerm.trim() === '') {
      if (!hasActiveFilters) {
        setProducts([]);
        return;
      }
    }
    
    loadProducts(searchTerm, productFilters);
  }, [loadProducts, productFilters]);

  // Handle comprehensive filter change
  const handleProductFilterChange = useCallback((filterType: string, value: string) => {
    const newFilters = { ...productFilters, [filterType]: value };
    setProductFilters(newFilters);
    
    // Update isSearching state based on search term and filters
    const hasSearchTerm = productSearchTerm.trim() !== '';
    const hasActiveFilters = Object.values(newFilters).some(filterValue => 
      filterValue !== '' && filterValue !== 'active'
    );
    setIsSearching(hasSearchTerm || hasActiveFilters);
    
    loadProducts(productSearchTerm, newFilters);
  }, [productFilters, productSearchTerm, loadProducts]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      category: '',
      brand: '',
      manufacturer: '',
      color: '',
      model: '',
      packaging: '',
      location: '',
      status: 'active'
    };
    setProductFilters(clearedFilters);
    setProductSearchTerm('');
    setIsSearching(false); // Clear searching state when clearing all filters
    setProducts([]);
    // Note: We keep allProductsCache intact to preserve added products
  }, []);

  // Validate serial number uniqueness
  const validateSerialNumber = useCallback((itemIndex: number, serialIndex: number, serialNumber: string) => {
    if (!serialNumber.trim()) return true; // Empty serial numbers are valid
    
    const allItems = watch('items') || [];
    const currentItemSerials = Array.isArray((allItems[itemIndex] as any)?.serial_numbers) ? (allItems[itemIndex] as any)?.serial_numbers : [];
    
    // Check for duplicates within the same item
    const duplicatesInSameItem = currentItemSerials.filter((serial: any, index: any) => 
      index !== serialIndex && serial === serialNumber
    );
    
    if (duplicatesInSameItem.length > 0) return false;
    
    // Check for duplicates across all items
    for (let i = 0; i < allItems.length; i++) {
      if (i === itemIndex) continue; // Skip current item
      
      const otherItemSerials = Array.isArray((allItems[i] as any)?.serial_numbers) ? (allItems[i] as any)?.serial_numbers : [];
      const hasDuplicate = otherItemSerials.some((serial: any) => serial === serialNumber);
      
      if (hasDuplicate) return false;
    }
    
    return true;
  }, [watch]);

  // Add product to items
  const addProductToItems = useCallback((product: any) => {
    const existingItem = watchedItems.find(item => item.product_id === product.id);
    if (existingItem) {
      toast.error('Product already added to inventory');
      return;
    }

    append({
      product_id: product.id,
      current_quantity: cleanNumericValue(product.currentQuantity), // Use store-specific quantity from backend
      counted_quantity: 0, // Default to 0 for user to enter actual counted quantity
      adjustment_in_reason_id: watch('inventory_in_reason_id') || '', // Use global inventory IN reason
      adjustment_out_reason_id: watch('inventory_out_reason_id') || '', // Use global inventory OUT reason
      unit_cost: cleanNumericValue(product.average_cost),
      unit_average_cost: cleanNumericValue(product.average_cost),
      expiry_date: '',
      batch_number: '',
      serial_numbers: [],
      notes: ''
    });

    toast.success(`${product.name} added to inventory`);
  }, [watchedItems, append]);

  // Handle import items
  const handleImportItems = useCallback(async (importedItems: any[]) => {
    if (!importedItems || importedItems.length === 0) {
      toast.error('No items to import');
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    // Fetch all imported products to get their current data
    const productIds = importedItems.map(item => item.product_id);
    const importedProducts = await loadProductsByIds(productIds);

    importedItems.forEach((item) => {
      // Check if product already exists in inventory
      const existingItem = watchedItems.find(existing => existing.product_id === item.product_id);
      
      if (existingItem) {
        skippedCount++;
        return;
      }

      // Find the product data for this item
      const productData = importedProducts.find((p: any) => p.id === item.product_id);
      
      if (!productData) {
        skippedCount++;
        return;
      }

      // Add the imported item with correct product data (clean numeric values)
      append({
        product_id: item.product_id,
        current_quantity: cleanNumericValue(item.current_quantity),
        counted_quantity: cleanNumericValue(item.counted_quantity),
        adjustment_in_reason_id: watch('inventory_in_reason_id') || '',
        adjustment_out_reason_id: watch('inventory_out_reason_id') || '',
        unit_cost: cleanNumericValue(item.unit_average_cost), // Use Excel cost as Unit Cost
        unit_average_cost: cleanNumericValue(productData.average_cost), // Use database average cost as Unit Average Cost
        expiry_date: item.expiry_date || '',
        batch_number: item.batch_number || '',
        serial_numbers: typeof item.serial_numbers === 'string' 
          ? item.serial_numbers.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
          : (item.serial_numbers || []),
        notes: item.notes || ''
      });

      addedCount++;
    });

    if (addedCount > 0) {
      toast.success(`Successfully imported ${addedCount} items`);
    }
    
    if (skippedCount > 0) {
      toast.error(`${skippedCount} items were skipped (already exist or product not found)`);
    }

    setIsImportModalOpen(false);
  }, [watchedItems, append, watch]);

  // Calculate adjustment quantities
  const calculateAdjustmentQuantities = useCallback((currentQuantity: number, countedQuantity: number) => {
    const difference = countedQuantity - currentQuantity;
    return {
      adjustment_in_quantity: difference > 0 ? difference : 0,
      adjustment_out_quantity: difference < 0 ? Math.abs(difference) : 0
    };
  }, []);

  // Handle form submission
  const handleFormSubmit = (data: PhysicalInventoryFormData, status: 'draft' | 'submitted' = 'draft') => {
    // Clean all numeric values before submission to prevent malformed values
    const processedData = {
      ...data,
      exchange_rate: cleanNumericValue(data.exchange_rate),
      items: data.items?.map(item => ({
        ...item,
        current_quantity: cleanNumericValue(item.current_quantity),
        counted_quantity: cleanNumericValue(item.counted_quantity),
        unit_cost: cleanNumericValue(item.unit_cost),
        unit_average_cost: cleanNumericValue(item.unit_average_cost),
        exchange_rate: cleanNumericValue(data.exchange_rate || item.exchange_rate || 1.0)
      })) || []
    };
    
    // Validate that adjustment reasons are provided when quantities are positive
    const hasValidationErrors = processedData.items.some((item: any, index: number) => {
      const { adjustment_in_quantity, adjustment_out_quantity } = calculateAdjustmentQuantities(
        item.current_quantity,
        item.counted_quantity
      );
      
      if (adjustment_in_quantity > 0 && !processedData.inventory_in_reason_id) {
        toast.error(`Inventory IN reason is required for item ${index + 1}`);
        return true;
      }
      
      if (adjustment_out_quantity > 0 && !processedData.inventory_out_reason_id) {
        toast.error(`Inventory OUT reason is required for item ${index + 1}`);
        return true;
      }
      
      return false;
    });

    if (hasValidationErrors) {
      return;
    }

    onSubmit(processedData, status);
  };

  const totalSteps = 2;

  // Validation functions
  const validateStep1 = (formData: any) => {
    return formData.inventory_date && formData.store_id && formData.currency_id && 
           formData.inventory_in_reason_id && formData.inventory_out_reason_id &&
           formData.inventory_in_account_id && formData.inventory_in_corresponding_account_id &&
           formData.inventory_out_account_id && formData.inventory_out_corresponding_account_id;
  };

  const validateStep2 = (formData: any) => {
    return formData.items && formData.items.length > 0;
  };

  // Step navigation handlers
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepSubmit = (data: PhysicalInventoryFormData) => {
    if (currentStep === 1) {
      handleNextStep();
    } else {
      handleFormSubmit(data, 'draft');
    }
  };

  return (
    <div className={`space-y-6 w-full mx-auto ${isSidebarCollapsed ? 'max-w-none' : 'max-w-[70vw]'}`}>
      {/* Step Indicator */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 1 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Inventory Details
              </span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 2 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Inventory Items
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {currentStep === 1 ? 'Create Physical Inventory' : 'Add Inventory Items'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleStepSubmit)} className="space-y-8">
          {/* Step 1: Inventory Details */}
          {currentStep === 1 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Inventory Details</h3>
              </div>
            </div>

            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory Date <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('inventory_date')}
                  type="date"
                  required
                />
                {errors.inventory_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store <span className="text-red-500">*</span>
                </label>
                <Select
                  {...register('store_id')}
                  required
                  disabled={isLoadingStores}
                >
                  <option value="">Select Store</option>
                  {getUserAssignedStores().map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </Select>
                {errors.store_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.store_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <Select
                  {...register('currency_id')}
                  disabled={isLoadingCurrencies}
                >
                  <option value="">
                    {isLoadingCurrencies ? 'Loading currencies...' : 'Select Currency'}
                  </option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name} {currency.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </Select>
                {errors.currency_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency_id.message}</p>
                )}
                <Tooltip content="Currency for unit costs and total values. Default currency is auto-selected.">
                  <div className="mt-1 h-1"></div>
                </Tooltip>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exchange Rate
                </label>
                <Tooltip content="Rate to convert from selected currency to system default currency">
                  <Input
                    value={(() => {
                      const rate = calculateExchangeRate();
                      if (rate === null) return 'Loading...';
                      if (rate === 1) return '1.0000 (Same as default)';
                      const numericRate = cleanNumericValue(rate);
                      if (isNaN(numericRate)) return 'Rate not available';
                      return `${numericRate.toFixed(4)} ${currencies.find(c => c.id === watchedCurrencyId)?.code || ''} = 1 ${defaultCurrency?.code || ''}`;
                    })()}
                    readOnly
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </Tooltip>
              </div>

              {/* Hidden fields for additional data */}
              <input 
                type="hidden" 
                {...register('exchange_rate', {
                  onChange: (e) => {
                    const cleaned = cleanNumericValue(e.target.value);
                    setValue('exchange_rate', cleaned);
                  }
                })} 
              />
            </div>

            {/* Inventory Reasons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Inventory IN Reason *</span>
                  </span>
                </label>
                <Select
                  {...register('inventory_in_reason_id')}
                  required
                  disabled={isLoadingAdjustmentReasons}
                >
                  <option value="">Select Inventory IN Reason</option>
                  {adjustmentReasons
                    .filter(reason => reason.adjustmentType === 'add')
                    .map(reason => (
                      <option key={reason.id} value={reason.id}>
                        {reason.name}
                      </option>
                    ))}
                </Select>
                {errors.inventory_in_reason_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory_in_reason_id.message}</p>
                )}
                <Tooltip content="Reason for inventory increases (when counted > current). Only shows reasons with 'Add' function.">
                  <div className="mt-1 h-1"></div>
                </Tooltip>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center space-x-1">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Inventory OUT Reason *</span>
                  </span>
                </label>
                <Select
                  {...register('inventory_out_reason_id')}
                  required
                  disabled={isLoadingAdjustmentReasons}
                >
                  <option value="">Select Inventory OUT Reason</option>
                  {adjustmentReasons
                    .filter(reason => reason.adjustmentType === 'deduct')
                    .map(reason => (
                      <option key={reason.id} value={reason.id}>
                        {reason.name}
                      </option>
                    ))}
                </Select>
                {errors.inventory_out_reason_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory_out_reason_id.message}</p>
                )}
                <Tooltip content="Reason for inventory decreases (when counted < current). Only shows reasons with 'Deduct' function.">
                  <div className="mt-1 h-1"></div>
                </Tooltip>
              </div>
            </div>

            {/* Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Inventory IN Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Inventory IN Account *</span>
                  </span>
                </label>
                <Select
                  {...register('inventory_in_account_id')}
                  required
                >
                  <option value="">Select Inventory IN Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </Select>
                {errors.inventory_in_account_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory_in_account_id.message}</p>
                )}
                <Tooltip content="Auto-populated from Inventory IN reason, but can be manually changed">
                  <div className="mt-1 h-1"></div>
                </Tooltip>
              </div>

              {/* Inventory IN Corresponding Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>IN Corresponding Account *</span>
                  </span>
                </label>
                <Select
                  {...register('inventory_in_corresponding_account_id')}
                  required
                >
                  <option value="">Select IN Corresponding Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </Select>
                {errors.inventory_in_corresponding_account_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory_in_corresponding_account_id.message}</p>
                )}
                <Tooltip content="Auto-populated from Inventory IN reason, but can be manually changed">
                  <div className="mt-1 h-1"></div>
                </Tooltip>
              </div>

              {/* Inventory OUT Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center space-x-1">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Inventory OUT Account *</span>
                  </span>
                </label>
                <Select
                  {...register('inventory_out_account_id')}
                  required
                >
                  <option value="">Select Inventory OUT Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </Select>
                {errors.inventory_out_account_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory_out_account_id.message}</p>
                )}
                <Tooltip content="Auto-populated from Inventory OUT reason, but can be manually changed">
                  <div className="mt-1 h-1"></div>
                </Tooltip>
              </div>

              {/* Inventory OUT Corresponding Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center space-x-1">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>OUT Corresponding Account *</span>
                  </span>
                </label>
                <Select
                  {...register('inventory_out_corresponding_account_id')}
                  required
                >
                  <option value="">Select OUT Corresponding Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </Select>
                {errors.inventory_out_corresponding_account_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory_out_corresponding_account_id.message}</p>
                )}
                <Tooltip content="Auto-populated from Inventory OUT reason, but can be manually changed">
                  <div className="mt-1 h-1"></div>
                </Tooltip>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory Notes
              </label>
              <Textarea
                {...register('notes')}
                placeholder="Enter additional notes (optional)"
                rows={3}
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

          </div>
        )}

          {/* Step 2: Inventory Items */}
          {currentStep === 2 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
                {watchedStoreId && (
                  <span className="text-sm text-gray-500">
                    for {stores.find(s => s.id === watchedStoreId)?.name || 'Selected Store'}
                  </span>
                )}
              </div>
            </div>

            {/* Product Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name, code, or category..."
                  value={productSearchTerm}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  className="pl-10"
                  disabled={!watchedStoreId}
                />
              </div>
              {!watchedStoreId && (
                <p className="mt-2 text-sm text-red-600">Please select a store in Step 1 to search products</p>
              )}
            </div>

            {/* Product Filters */}
            {watchedStoreId && isSearching && (
              <div className="mb-6">
                <div 
                  className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                >
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700">Filter Products</h3>
                    <span className="text-xs text-gray-500">
                      ({Object.values(productFilters).filter(value => value !== '' && value !== 'active').length} active)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {Object.values(productFilters).some(value => value !== '' && value !== 'active') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllFilters();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear All
                      </button>
                    )}
                    {isFiltersExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
                
                {isFiltersExpanded && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <Select
                        value={productFilters.category}
                        onChange={(e) => handleProductFilterChange('category', e.target.value)}
                        disabled={isLoadingFilters}
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                      <Select
                        value={productFilters.brand}
                        onChange={(e) => handleProductFilterChange('brand', e.target.value)}
                        disabled={isLoadingFilters}
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Manufacturer</label>
                      <Select
                        value={productFilters.manufacturer}
                        onChange={(e) => handleProductFilterChange('manufacturer', e.target.value)}
                        disabled={isLoadingFilters}
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                      <Select
                        value={productFilters.color}
                        onChange={(e) => handleProductFilterChange('color', e.target.value)}
                        disabled={isLoadingFilters}
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                      <Select
                        value={productFilters.model}
                        onChange={(e) => handleProductFilterChange('model', e.target.value)}
                        disabled={isLoadingFilters}
                      >
                        <option value="">All Models</option>
                        {filterOptions.models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Packaging Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Packaging</label>
                      <Select
                        value={productFilters.packaging}
                        onChange={(e) => handleProductFilterChange('packaging', e.target.value)}
                        disabled={isLoadingFilters}
                      >
                        <option value="">All Packaging</option>
                        {filterOptions.packagings.map((packaging) => (
                          <option key={packaging.id} value={packaging.id}>
                            {packaging.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                      <Select
                        value={productFilters.location}
                        onChange={(e) => handleProductFilterChange('location', e.target.value)}
                        disabled={isLoadingFilters}
                      >
                        <option value="">All Locations</option>
                        {filterOptions.locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <Select
                        value={productFilters.status}
                        onChange={(e) => handleProductFilterChange('status', e.target.value)}
                        disabled={isLoadingFilters}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="all">All</option>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product List */}
            {watchedStoreId && isSearching && (
              <div className="mb-6">
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    {productSearchTerm.trim() === '' && Object.values(productFilters).every(value => value === '' || value === 'active') ? (
                      <>
                        <p className="text-sm font-medium text-gray-700 mb-2">Search for products</p>
                        <p className="text-sm">Enter a search term or apply filters to find products</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-700 mb-2">No products found</p>
                        <p className="text-sm">Try adjusting your search terms or filters</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Search Results ({products.length} found)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {products.map((product) => {
                        const isAlreadyAdded = watchedItems.some(item => item.product_id === product.id);
                        
                        return (
                          <div
                            key={product.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              isAlreadyAdded 
                                ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => !isAlreadyAdded && addProductToItems(product)}
                          >
                            <div className="flex items-center space-x-3">
                              <Package className={`h-5 w-5 ${isAlreadyAdded ? 'text-green-600' : 'text-gray-400'}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">{product.code}</div>
                                <div className="text-xs text-gray-400">
                                  Stock: {product.currentQuantity} | Cost: {(Number(product.average_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                {product.category && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    {product.category.name}
                                  </div>
                                )}
                              </div>
                              {isAlreadyAdded ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Plus className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Products Section */}
            {watchedStoreId && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    Inventory Items ({fields.length})
                  </h4>
                  {fields.length > 0 && (
                    <span className="text-xs text-gray-500">
                      Total Value: {formatCurrencyWithSymbol(
                        fields.reduce((total, field, index) => {
                          const item = watchedItems[index];
                          const countedQty = Number(item?.counted_quantity || 0);
                          const product = getProductInfo(item?.product_id || '');
                          const unitCost = Number(product?.average_cost || item?.unit_average_cost || 0);
                          return total + (countedQty * unitCost);
                        }, 0),
                        watchedCurrencyId || ''
                      )}
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Products
                </Button>
              </div>
            )}

            {/* Inventory Items Table */}
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No products added yet</p>
                <p className="text-sm">
                  {watchedStoreId 
                    ? 'Search for products above and click to add them to the inventory'
                    : 'Please select a store in Step 1 to search and add products'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* More Columns Dropdown */}
                <div className="mb-4 flex justify-end">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const dropdown = document.getElementById('physical-inventory-items-columns-dropdown');
                        if (dropdown) {
                          dropdown.classList.toggle('hidden');
                        }
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <MoreHorizontal size={16} className="mr-1" />
                      More Columns
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div
                      id="physical-inventory-items-columns-dropdown"
                      className="hidden absolute w-64 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] transition-all duration-200"
                      style={{
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        maxHeight: '300px'
                      }}
                    >
                      <div className="py-2">
                        {/* Toggle All Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const allVisible = Object.values(visibleColumns).every(v => v);
                            const newState = Object.keys(visibleColumns).reduce((acc, key) => {
                              // Keep required columns always visible
                              if (key === 'product' || key === 'currentStock' || key === 'countedQuantity' || key === 'unitCost' || key === 'actions') {
                                acc[key as keyof typeof visibleColumns] = true;
                              } else {
                                acc[key as keyof typeof visibleColumns] = !allVisible;
                              }
                              return acc;
                            }, {} as typeof visibleColumns);
                            setVisibleColumns(newState);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                        >
                          {Object.entries(visibleColumns).filter(([key]) => 
                            key !== 'product' && key !== 'currentStock' && key !== 'countedQuantity' && key !== 'unitCost' && key !== 'actions'
                          ).every(([, v]) => v) ? 'Hide All Optional' : 'Show All'}
                        </button>
                        
                        {/* Scrollable Column List */}
                        <div className="max-h-64 overflow-y-auto">
                          {Object.entries(visibleColumns).map(([key, visible]) => {
                            const isRequired = key === 'product' || key === 'currentStock' || key === 'countedQuantity' || key === 'unitCost' || key === 'actions';
                            const columnLabel = key === 'currentStock' ? 'Current Stock' :
                              key === 'countedQuantity' ? 'Counted Quantity' :
                              key === 'unitCost' ? 'Unit Cost' :
                              key === 'unitAverageCost' ? 'Unit Average Cost' :
                              key === 'adjustmentIn' ? 'Adjustment In' :
                              key === 'adjustmentOut' ? 'Adjustment Out' :
                              key === 'newStock' ? 'New Stock' :
                              key === 'totalValue' ? 'Total Value' :
                              key === 'exchangeRate' ? 'Exchange Rate' :
                              key === 'equivalentAmount' ? 'Equivalent Amount' :
                              key === 'expiryDates' ? 'Expiry Dates' :
                              key === 'batchNumbers' ? 'Batch Numbers' :
                              key === 'serialNumbers' ? 'Serial Numbers' :
                              key.replace(/([A-Z])/g, ' $1').trim();
                            
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!isRequired) {
                                    setVisibleColumns((prev: typeof defaultVisibleColumns) => ({
                                      ...prev,
                                      [key]: !prev[key as keyof typeof prev]
                                    }));
                                  }
                                }}
                                disabled={isRequired}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                                  isRequired ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                                }`}
                              >
                                <span className="truncate capitalize">
                                  {columnLabel}
                                </span>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {visible ? (
                                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                  ) : (
                                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                  )}
                                  {isRequired && (
                                    <span className="text-xs text-gray-400">Required</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        {visibleColumns.product && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('product')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Product</span>
                            {getSortIndicator('product')}
                          </div>
                      </th>
                        )}
                        {visibleColumns.currentStock && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('currentStock')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Current Stock</span>
                            {getSortIndicator('currentStock')}
                          </div>
                      </th>
                        )}
                        {visibleColumns.countedQuantity && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('countedQuantity')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Counted Quantity</span>
                            {getSortIndicator('countedQuantity')}
                          </div>
                      </th>
                        )}
                        {visibleColumns.unitCost && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('unitCost')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Unit Cost</span>
                            {getSortIndicator('unitCost')}
                          </div>
                      </th>
                        )}
                        {visibleColumns.unitAverageCost && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('unitAverageCost')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Unit Average Cost</span>
                            {getSortIndicator('unitAverageCost')}
                          </div>
                      </th>
                        )}
                        {visibleColumns.adjustmentIn && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('adjustmentIn')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Adjustment In</span>
                            {getSortIndicator('adjustmentIn')}
                          </div>
                      </th>
                        )}
                        {visibleColumns.adjustmentOut && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('adjustmentOut')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Adjustment Out</span>
                            {getSortIndicator('adjustmentOut')}
                          </div>
                      </th>
                        )}
                        {visibleColumns.newStock && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('newStock')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>New Stock</span>
                            {getSortIndicator('newStock')}
                          </div>
                      </th>
                        )}
                        {visibleColumns.totalValue && (
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('totalValue')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Total Value</span>
                            {getSortIndicator('totalValue')}
                          </div>
                      </th>
                        )}
                        {visibleColumns.exchangeRate && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Exchange Rate
                      </th>
                        )}
                        {visibleColumns.equivalentAmount && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                        Equivalent Amount
                      </th>
                        )}
                        {visibleColumns.expiryDates && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Expiry Dates
                      </th>
                        )}
                        {visibleColumns.batchNumbers && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Batch Numbers
                      </th>
                        )}
                        {visibleColumns.serialNumbers && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Serial Numbers
                      </th>
                        )}
                        {visibleColumns.notes && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Notes
                      </th>
                        )}
                        {visibleColumns.actions && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Actions
                      </th>
                        )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      // Create array with indices and computed values for sorting
                      const sortableItems = fields.map((field, index) => {
                      const item = watchedItems[index];
                      const product = getProductInfo(item?.product_id || '');
                        const currentQuantity = product?.currentQuantity || item?.current_quantity || 0;
                      const countedQuantity = Number(item?.counted_quantity || 0);
                      const { adjustment_in_quantity, adjustment_out_quantity } = calculateAdjustmentQuantities(
                        currentQuantity,
                        countedQuantity
                      );
                        const totalValue = calculateItemTotal(item, currentQuantity);
                        
                        return {
                          index,
                          field,
                          item,
                          product,
                          currentQuantity,
                          countedQuantity,
                          adjustment_in_quantity,
                          adjustment_out_quantity,
                          totalValue
                        };
                      });

                      // Apply sorting if a column is selected
                      if (sortConfig.key) {
                        sortableItems.sort((a, b) => {
                          let aValue: any;
                          let bValue: any;

                          switch (sortConfig.key) {
                            case 'product':
                              aValue = a.product?.name || '';
                              bValue = b.product?.name || '';
                              break;
                            case 'currentStock':
                              aValue = a.currentQuantity;
                              bValue = b.currentQuantity;
                              break;
                            case 'countedQuantity':
                              aValue = a.countedQuantity;
                              bValue = b.countedQuantity;
                              break;
                            case 'unitCost':
                              aValue = Number(a.item?.unit_cost || 0);
                              bValue = Number(b.item?.unit_cost || 0);
                              break;
                            case 'unitAverageCost':
                              aValue = a.product?.average_cost || 0;
                              bValue = b.product?.average_cost || 0;
                              break;
                            case 'adjustmentIn':
                              aValue = a.adjustment_in_quantity;
                              bValue = b.adjustment_in_quantity;
                              break;
                            case 'adjustmentOut':
                              aValue = a.adjustment_out_quantity;
                              bValue = b.adjustment_out_quantity;
                              break;
                            case 'newStock':
                              aValue = a.countedQuantity;
                              bValue = b.countedQuantity;
                              break;
                            case 'totalValue':
                              aValue = a.totalValue;
                              bValue = b.totalValue;
                              break;
                            default:
                              return 0;
                          }

                          if (typeof aValue === 'string') {
                            aValue = aValue.toLowerCase();
                            bValue = bValue.toLowerCase();
                          }

                          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                          return 0;
                        });
                      }

                      return sortableItems.map(({ index, field, item, product, currentQuantity, countedQuantity, adjustment_in_quantity, adjustment_out_quantity }) => {
                      return (
                        <tr key={field.id} className="hover:bg-gray-50">
                          {/* Product Info */}
                          {visibleColumns.product && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Package className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product?.name || 'Unknown Product'}
                                </div>
                                <div className="text-sm text-gray-500">{product?.code || 'N/A'}</div>
                                {product?.category && (
                                  <div className="text-xs text-gray-400">{product.category.name}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          )}

                          {/* Current Stock - Read Only */}
                          {visibleColumns.currentStock && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {currentQuantity.toLocaleString('en-US')}
                            </div>
                            {product?.unit && (
                              <div className="text-xs text-gray-500">{product.unit.name}</div>
                            )}
                          </td>
                          )}

                          {/* Counted Quantity */}
                          {visibleColumns.countedQuantity && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Input
                              {...register(`items.${index}.counted_quantity`, {
                                onChange: (e) => {
                                  const cleaned = cleanNumericValue(e.target.value);
                                  setValue(`items.${index}.counted_quantity` as any, cleaned);
                                }
                              })}
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-32"
                              onBlur={(e) => {
                                const cleaned = cleanNumericValue(e.target.value);
                                if (cleaned !== parseFloat(e.target.value)) {
                                  setValue(`items.${index}.counted_quantity` as any, cleaned);
                                }
                              }}
                            />
                          </td>
                          )}

                          {/* Unit Cost */}
                          {visibleColumns.unitCost && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <Input
                                {...register(`items.${index}.unit_cost`, {
                                  onChange: (e) => {
                                    const cleaned = cleanNumericValue(e.target.value);
                                    setValue(`items.${index}.unit_cost` as any, cleaned);
                                  }
                                })}
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-40"
                                placeholder="0.00"
                                onBlur={(e) => {
                                  const cleaned = cleanNumericValue(e.target.value);
                                  if (cleaned !== parseFloat(e.target.value)) {
                                    setValue(`items.${index}.unit_cost` as any, cleaned);
                                  }
                                }}
                              />
                            </div>
                          </td>
                          )}

                          {/* Unit Average Cost */}
                          {visibleColumns.unitAverageCost && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrencyWithSymbol(product?.average_cost || 0, defaultCurrency?.id || '')}
                              </div>
                            </div>
                          </td>
                          )}

                          {/* Adjustment In */}
                          {visibleColumns.adjustmentIn && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-1">
                                <span className={`text-sm font-medium ${
                                  adjustment_in_quantity > 0 ? 'text-green-600' : 'text-gray-400'
                                }`}>
                                  {adjustment_in_quantity > 0 ? `+${adjustment_in_quantity.toLocaleString('en-US')}` : '0'}
                                </span>
                                {adjustment_in_quantity > 0 && (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          </td>
                          )}

                          {/* Adjustment Out */}
                          {visibleColumns.adjustmentOut && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-1">
                                <span className={`text-sm font-medium ${
                                  adjustment_out_quantity > 0 ? 'text-red-600' : 'text-gray-400'
                                }`}>
                                  {adjustment_out_quantity > 0 ? `-${adjustment_out_quantity.toLocaleString('en-US')}` : '0'}
                                </span>
                                {adjustment_out_quantity > 0 && (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </div>
                          </td>
                          )}

                          {/* New Stock */}
                          {visibleColumns.newStock && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {countedQuantity.toLocaleString('en-US')}
                              </div>
                              {product?.unit && (
                                <div className="text-xs text-gray-500">{product.unit.name}</div>
                              )}
                            </div>
                          </td>
                          )}

                          {/* Total Value */}
                          {visibleColumns.totalValue && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrencyWithSymbol(calculateItemTotal(item, currentQuantity), watchedCurrencyId || '')}
                              </span>
                              {(adjustment_in_quantity > 0 || adjustment_out_quantity > 0) ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          )}

                          {/* Exchange Rate */}
                          {visibleColumns.exchangeRate && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {(() => {
                                  const rate = calculateExchangeRate();
                                  if (rate === null) return 'Loading...';
                                  if (rate === 1) return '1.0000';
                                  const numericRate = Number(rate);
                                  if (isNaN(numericRate)) return 'N/A';
                                  return numericRate.toFixed(4);
                                })()}
                              </div>
                            </div>
                          </td>
                          )}

                          {/* Equivalent Amount */}
                          {visibleColumns.equivalentAmount && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {(() => {
                                  const rate = calculateExchangeRate();
                                  const totalValue = calculateItemTotal(item, currentQuantity);
                                  if (rate === null) return 'Loading...';
                                  const numericRate = Number(rate);
                                  if (isNaN(numericRate)) return 'N/A';
                                  const equivalentAmount = totalValue * numericRate;
                                  return formatCurrencyWithSymbol(equivalentAmount, defaultCurrency?.id || '');
                                })()}
                              </div>
                            </div>
                          </td>
                          )}

                          {/* Expiry Dates */}
                          {visibleColumns.expiryDates && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-2">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Input
                                    {...register(`items.${index}.expiry_date` as any)}
                                    type="date"
                                    className="w-32 text-xs"
                                    placeholder="mm/dd/yyyy"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setValue(`items.${index}.expiry_date` as any, '');
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                    title="Clear expiry date"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                </div>
                                {/* Show existing expiry date if available */}
                                {(item as any)?.expiry_date && (
                                  <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {(item as any).expiry_date}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          )}

                          {/* Batch Numbers */}
                          {visibleColumns.batchNumbers && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-2">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Input
                                    {...register(`items.${index}.batch_number` as any)}
                                    placeholder="Batch #"
                                    className="w-32 text-xs"
                                    maxLength={50}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setValue(`items.${index}.batch_number` as any, '');
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                    title="Clear batch number"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                </div>
                                {/* Show existing batch number if available */}
                                {(item as any)?.batch_number && (
                                  <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {(item as any).batch_number}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          )}

                          {/* Serial Numbers */}
                          {visibleColumns.serialNumbers && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-2">
                              <div className="space-y-1">
                                {(Array.isArray((item as any)?.serial_numbers) ? (item as any)?.serial_numbers : []).map((serial: any, serialIndex: any) => {
                                  const isDuplicate = !validateSerialNumber(index, serialIndex, serial || '');
                                  return (
                                    <div key={serialIndex} className="flex flex-col space-y-1">
                                      <div className="flex items-center space-x-1">
                                        <Input
                                          {...register(`items.${index}.serial_numbers.${serialIndex}` as any)}
                                          placeholder="Serial #"
                                          className={`w-32 text-xs ${isDuplicate ? 'border-red-500 bg-red-50' : ''}`}
                                          maxLength={50}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentSerials = Array.isArray((item as any)?.serial_numbers) ? (item as any)?.serial_numbers : [];
                                            const newSerials = currentSerials.filter((_: any, i: any) => i !== serialIndex);
                                            setValue(`items.${index}.serial_numbers` as any, newSerials);
                                          }}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
                                      </div>
                                      {isDuplicate && (
                                        <div className="text-xs text-red-600">
                                          Duplicate serial number
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentSerials = (item as any)?.serial_numbers || [];
                                    setValue(`items.${index}.serial_numbers` as any, [...currentSerials, '']);
                                  }}
                                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add Serial</span>
                                </button>
                              </div>
                            </div>
                          </td>
                          )}

                          {/* Notes */}
                          {visibleColumns.notes && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="relative">
                              <Textarea
                                {...register(`items.${index}.notes`)}
                                placeholder="Notes"
                                className="w-56 min-h-[32px] max-h-[120px] resize-none text-sm"
                                rows={1}
                                maxLength={200}
                                onFocus={(e) => {
                                  e.target.rows = 3;
                                  e.target.style.minHeight = '72px';
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value.trim()) {
                                    e.target.rows = 1;
                                    e.target.style.minHeight = '32px';
                                  }
                                }}
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                                }}
                              />
                              <div className="absolute bottom-1 right-1 text-xs text-gray-400 pointer-events-none">
                                {watch(`items.${index}.notes`)?.length || 0}/200
                              </div>
                            </div>
                          </td>
                          )}

                          {/* Actions */}
                          {visibleColumns.actions && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                          )}
                        </tr>
                      );
                    });
                    })()}
                  </tbody>
                </table>
              </div>
              </>
            )}

            {errors.items && (
              <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
            )}

            {/* Adjustment Summary */}
            {fields.length > 0 && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Adjustment Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Adjustment IN */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Total Adjustment IN</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-900">
                          {watchedItems.reduce((total, item) => {
                            const { adjustment_in_quantity } = calculateAdjustmentQuantities(
                              item?.current_quantity || 0,
                              item?.counted_quantity || 0
                            );
                            return total + adjustment_in_quantity;
                          }, 0)}
                        </div>
                        <div className="text-xs text-green-600">Items</div>
                      </div>
                    </div>
                  </div>

                  {/* Total Adjustment OUT */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Total Adjustment OUT</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-900">
                          {watchedItems.reduce((total, item) => {
                            const { adjustment_out_quantity } = calculateAdjustmentQuantities(
                              item?.current_quantity || 0,
                              item?.counted_quantity || 0
                            );
                            return total + adjustment_out_quantity;
                          }, 0)}
                        </div>
                        <div className="text-xs text-red-600">Items</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t w-full">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center space-x-2"
              >
                <span>Previous</span>
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            {currentStep === 2 && physicalInventory && (physicalInventory.status === 'draft' || physicalInventory.status === 'returned_for_correction') && (
              <Button
                type="button"
                variant="outline"
                disabled={isLoading || !validateStep1(watch())}
                onClick={() => {
                  const formData = watch();
                  if (validateStep1(formData)) {
                    handleFormSubmit(formData, 'draft');
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    <span>Save as Draft</span>
                  </>
                )}
              </Button>
            )}
            
            <Button
              type="button"
              disabled={isLoading || (currentStep === 1 ? !validateStep1(watch()) : !validateStep2(watch()))}
              className={`flex items-center space-x-2 ${
                isLoading || (currentStep === 1 ? !validateStep1(watch()) : !validateStep2(watch())) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-600'
              }`}
              title={currentStep === 1 && !validateStep1(watch()) ? "Please complete all required fields" : currentStep === 2 && !validateStep2(watch()) ? "Please add at least one product item" : ""}
              onClick={() => {
                const formData = watch();
                
                // Handle step navigation directly
                if (currentStep === 1) {
                  if (validateStep1(formData)) {
                    handleNextStep();
                  }
                } else {
                  // For step 2, determine submission type based on whether we're editing existing inventory
                  if (physicalInventory && (physicalInventory.status === 'draft' || physicalInventory.status === 'returned_for_correction')) {
                    // Editing existing draft or returned_for_correction inventory - show submit option
                    handleFormSubmit(formData, 'submitted');
                  } else {
                    // Creating new inventory - save as draft
                    handleFormSubmit(formData, 'draft');
                  }
                }
              }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>{currentStep === 1 ? 'Next' : (physicalInventory && (physicalInventory.status === 'draft' || physicalInventory.status === 'returned_for_correction') ? 'Submit Inventory' : 'Save as Draft')}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Import Modal */}
      <PhysicalInventoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportItems}
        existingItems={watchedItems}
        storeId={watch('store_id')}
      />
    </div>
  );
};

export default PhysicalInventoryForm;