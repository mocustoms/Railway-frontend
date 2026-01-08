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
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';
import { StockAdjustment as StockAdjustmentType, StockAdjustmentFormData, StockAdjustmentItemFormData } from '../types';
import { stockAdjustmentService } from '../services/stockAdjustmentService';
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

interface StockAdjustmentFormProps {
  stockAdjustment?: StockAdjustmentType | null;
  onSubmit: (data: StockAdjustmentFormData, status: 'draft' | 'submitted') => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const validationSchema = yup.object({
  reference_number: yup.string().required('Reference number is required'),
  adjustment_date: yup.string().required('Adjustment date is required'),
  store_id: yup.string().required('Store is required'),
  adjustment_type: yup.string().oneOf(['add', 'deduct']).required('Adjustment type is required'),
  reason_id: yup.string().required('Adjustment reason is required'),
  inventory_account_id: yup.string().required('Inventory account is required'),
  inventory_corresponding_account_id: yup.string().optional(),
  document_type: yup.string().optional(),
  document_number: yup.string().max(100, 'Document number must not exceed 100 characters').optional(),
  notes: yup.string().max(500, 'Notes must not exceed 500 characters').optional(),
  currency_id: yup.string().required('Currency is required'),
  exchange_rate: yup.number().min(0, 'Exchange rate must be positive').optional(),
  system_default_currency_id: yup.string().optional(),
  exchange_rate_id: yup.string().optional(),
  items: yup.array().of(
    yup.object({
      product_id: yup.string().required('Product is required'),
      adjusted_stock: yup.number().min(0, 'Adjusted stock must be non-negative').required('Adjusted stock is required'),
      user_unit_cost: yup.number().min(0, 'Unit cost must be non-negative').required('Unit cost is required'),
      serial_numbers: yup.array().of(yup.string()).optional(),
      expiry_date: yup.string().optional(),
      batch_number: yup.string().optional(),
      notes: yup.string().max(200, 'Item notes must not exceed 200 characters').optional(),
      new_stock: yup.number().min(0, 'New stock must be non-negative').optional()
    })
  ).min(1, 'At least one item is required')
});

const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  stockAdjustment,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { isSidebarCollapsed } = useSidebar();
  const { stores: userStores } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [fullStockAdjustment, setFullStockAdjustment] = useState<StockAdjustmentType | null>(null);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ 
    id: string; 
    name: string; 
    code: string; 
    currentQuantity: number;
    average_cost: number;
    track_serial_number: boolean;
    expiry_notification_days?: number;
    category?: { name: string };
    unit?: { name: string };
    brand?: { name: string };
    manufacturer?: { name: string };
  }>>([]);
  const [formProducts, setFormProducts] = useState<Array<{ 
    id: string; 
    name: string; 
    code: string; 
    currentQuantity: number;
    average_cost: number;
    track_serial_number: boolean;
    expiry_notification_days?: number;
    category?: { name: string };
    unit?: { name: string };
    brand?: { name: string };
    manufacturer?: { name: string };
  }>>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('Pending');
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null);
  const [isLoadingExchangeRates, setIsLoadingExchangeRates] = useState(false);

  // Product filter states
  const [productFilters, setProductFilters] = useState({
    category: '',
    brand: '',
    manufacturer: '',
    color: '',
    model: '',
    packaging: '',
    storeLocation: '',
    productType: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as any[],
    brands: [] as any[],
    manufacturers: [] as any[],
    colors: [] as any[],
    models: [] as any[],
    packaging: [] as any[],
    storeLocations: [] as any[]
  });
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const { accounts } = useAccounts();
  const { adjustmentReasons, isLoading: isLoadingAdjustmentReasons } = useAdjustmentReasons();

  // Constants for localStorage key
  const STOCK_ADJUSTMENT_COLUMNS_VISIBILITY_KEY = 'easymauzo-stock-adjustment-columns-visibility';

  // Default column visibility (Batch Numbers, Serial Numbers, Notes, Exchange Rate, Equivalent Amount, Unit Average Cost, Expiry Dates hidden by default)
  const defaultVisibleColumns = {
    product: true,
    currentStock: true,
    newQuantity: true,
    unitCost: true,
    unitAverageCost: false, // Hidden by default
    adjustmentAmount: true,
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
      const savedState = localStorage.getItem(STOCK_ADJUSTMENT_COLUMNS_VISIBILITY_KEY);
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

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STOCK_ADJUSTMENT_COLUMNS_VISIBILITY_KEY, JSON.stringify(visibleColumns));
    } catch (error) {
      // Handle localStorage errors silently
    }
  }, [visibleColumns, STOCK_ADJUSTMENT_COLUMNS_VISIBILITY_KEY]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('stock-adjustment-items-columns-dropdown');
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<StockAdjustmentFormData>({
    resolver: yupResolver(validationSchema) as any,
    mode: 'onChange',
    defaultValues: {
      reference_number: '',
      adjustment_date: new Date().toISOString().split('T')[0],
      store_id: '',
      adjustment_type: 'add',
      reason_id: '',
      inventory_account_id: '',
      inventory_corresponding_account_id: '',
      document_type: '',
      document_number: '',
      notes: '',
      currency_id: '', // Will be auto-populated with default currency
      exchange_rate: 1.0,
      system_default_currency_id: '',
      exchange_rate_id: '',
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedAdjustmentType = watch('adjustment_type');
  const watchedAdjustmentReasonId = watch('reason_id');
  const watchedStoreId = watch('store_id');
  const watchedCurrencyId = watch('currency_id');

  // Set reference number for new adjustments
  useEffect(() => {
    if (!stockAdjustment) {
      setReferenceNumber('Pending');
      setValue('reference_number', 'Pending');
    } else {
      setReferenceNumber(stockAdjustment.reference_number);
    }
  }, [stockAdjustment, setValue]);

  // Fetch full stock adjustment data when editing
  useEffect(() => {
    const fetchFullStockAdjustment = async () => {
      if (stockAdjustment && stockAdjustment.id) {
        try {
          const fullData = await stockAdjustmentService.getStockAdjustment(stockAdjustment.id);
          setFullStockAdjustment(fullData);
          } catch (error) {
          toast.error('Failed to load stock adjustment details');
          // Fallback to the original data
          setFullStockAdjustment(stockAdjustment);
        }
      } else {
        setFullStockAdjustment(null);
      }
    };

    fetchFullStockAdjustment();
  }, [stockAdjustment]);

  // Auto-select adjustment type and accounts when adjustment reason changes
  useEffect(() => {
    if (watchedAdjustmentReasonId && adjustmentReasons.length > 0) {
      const selectedReason = adjustmentReasons.find(reason => reason.id === watchedAdjustmentReasonId);
      if (selectedReason) {
        setValue('adjustment_type', selectedReason.adjustmentType);
        setValue('inventory_account_id', selectedReason.trackingAccountId || '');
        if (selectedReason.correspondingAccountId) {
          setValue('inventory_corresponding_account_id', selectedReason.correspondingAccountId);
        }
      }
    }
  }, [watchedAdjustmentReasonId, adjustmentReasons, setValue]);

  const fetchCurrentStockForExistingProducts = async (existingProducts: any[], storeId: string) => {
    try {
      // Fetch current stock for these products using the product catalog API
      const products = await productCatalogService.getProductsByStore(storeId, '', 1000);
      
      if (products && products.length > 0) {
        // Update formProducts with current stock
        setFormProducts(prevProducts => {
          return prevProducts.map(existingProduct => {
            // Find the current stock data for this product
            const currentStockData = products.find((p: any) => p.id === existingProduct.id);
            
            if (currentStockData) {
              return {
                ...existingProduct,
                currentQuantity: currentStockData.currentQuantity || 0
              };
            }
            
            return existingProduct; // Keep existing data if not found
          });
        });
      }
    } catch (error) {
      // Don't show error to user, just keep the historical data
    }
  };

  const loadProducts = useCallback(async (searchTerm?: string, filters?: any) => {
    try {
      setIsLoadingProducts(true);
      const selectedStoreId = watch('store_id');
      
      if (!selectedStoreId) {
        toast.error('Please select a store first');
        return;
      }
      
      const data = await productCatalogService.getProductsByStore(selectedStoreId, searchTerm || '', 100);
      
      // Filter out services products
      const nonServiceProducts = data.filter((product: any) => product.product_type !== 'services');
      
      // Apply client-side filtering if filters are provided
      let filteredProducts = nonServiceProducts;
      if (filters) {
        filteredProducts = nonServiceProducts.filter((product: any) => {
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
      const mappedProducts = filteredProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        code: product.code,
        currentQuantity: product.currentQuantity || 0, // Use currentQuantity from backend
        average_cost: product.average_cost || 0,
        track_serial_number: product.track_serial_number || false,
        expiry_notification_days: product.expiry_notification_days,
        category: product.category,
        unit: product.unit,
        brand: product.brand,
        manufacturer: product.manufacturer
      }));
      setProducts(mappedProducts);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [watch]);

  // Load currencies
  const loadCurrencies = useCallback(async () => {
    try {
      setIsLoadingCurrencies(true);
      const data = await currencyService.getCurrencies(1, 1000); // Get all currencies
      setCurrencies(data.currencies || []);
      
      // Find and set default currency
      const defaultCurrency = data.currencies?.find((currency: any) => currency.is_default);
      if (defaultCurrency) {
        setDefaultCurrency(defaultCurrency);
      }
      
      // Auto-select default currency if not editing existing adjustment
      if (!stockAdjustment && defaultCurrency) {
        setValue('currency_id', defaultCurrency.id);
        setValue('system_default_currency_id', defaultCurrency.id);
      }
    } catch (error) {
      toast.error('Failed to load currencies');
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [stockAdjustment, setValue]);

  // Load exchange rates
  const loadExchangeRates = useCallback(async () => {
    try {
      setIsLoadingExchangeRates(true);
      const rates = await getAllActiveExchangeRates();
      setExchangeRates(rates || []);
    } catch (error) {
      toast.error('Failed to load exchange rates');
    } finally {
      setIsLoadingExchangeRates(false);
    }
  }, []);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      setIsLoadingFilters(true);
      
      // Load all filter options in parallel
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
        packaging: packagingResponse.data || [],
        storeLocations: storeLocationsResponse.data || []
      });
    } catch (error) {
      toast.error('Failed to load filter options');
    } finally {
      setIsLoadingFilters(false);
    }
  }, []);

  // Load currencies on component mount
  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  // Load exchange rates on component mount
  useEffect(() => {
    loadExchangeRates();
  }, [loadExchangeRates]);

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Calculate exchange rate between selected currency and default currency
  const calculateExchangeRate = useCallback(() => {
    if (!watchedCurrencyId || !defaultCurrency || !exchangeRates.length) {
      return null;
    }

    // If selected currency is the same as default currency, rate is 1
    if (watchedCurrencyId === defaultCurrency.id) {
      return 1;
    }

    // Find exchange rate from selected currency to default currency
    const rate = exchangeRates.find(rate => 
      rate.from_currency_id === watchedCurrencyId && 
      rate.to_currency_id === defaultCurrency.id
    );

    return rate ? rate.rate : null;
  }, [watchedCurrencyId, defaultCurrency, exchangeRates]);

  // Helper function to get currency symbol
  const getCurrencySymbol = useCallback((currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency?.symbol || '$';
  }, [currencies]);

  // Custom currency formatter that uses our currency symbols
  const formatCurrencyWithSymbol = useCallback((amount: number, currencyId: string) => {
    const symbol = getCurrencySymbol(currencyId);
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [getCurrencySymbol]);

  // Update exchange rate ID when currency changes
  useEffect(() => {
    if (watchedCurrencyId && defaultCurrency && exchangeRates.length > 0) {
      const rate = exchangeRates.find(rate => 
        rate.from_currency_id === watchedCurrencyId && 
        rate.to_currency_id === defaultCurrency.id
      );
      
      if (rate) {
        setValue('exchange_rate_id', rate.id);
        setValue('exchange_rate', rate.rate);
      } else {
        setValue('exchange_rate_id', '');
        setValue('exchange_rate', 1.0);
      }
    }
  }, [watchedCurrencyId, defaultCurrency, exchangeRates, setValue]);

  // Update new_stock when adjusted_stock or adjustment_type changes
  useEffect(() => {
    if (watchedItems && watchedItems.length > 0) {
      watchedItems.forEach((item, index) => {
        if (item && item.current_stock !== undefined && item.adjusted_stock !== undefined) {
          const newStock = calculateNewStock(
            item.current_stock,
            item.adjusted_stock,
            watchedAdjustmentType
          );
          
          // Only update if the calculated value is different from current value
          if (item.new_stock !== newStock) {
            setValue(`items.${index}.new_stock`, newStock);
          }
        }
      });
    }
  }, [watchedItems, watchedAdjustmentType, setValue]);

  // Load products when store changes
  useEffect(() => {
    if (watchedStoreId && currentStep === 2) {
      loadProducts();
    }
  }, [watchedStoreId, currentStep, loadProducts]);

  // Track previous store and adjustment reason to detect changes
  const [previousStoreId, setPreviousStoreId] = useState<string>('');
  const [previousAdjustmentReasonId, setPreviousAdjustmentReasonId] = useState<string>('');

  // Reset items when store changes to ensure data consistency
  useEffect(() => {
    if (watchedStoreId && previousStoreId && watchedStoreId !== previousStoreId && watchedItems && watchedItems.length > 0) {
      // Clear all items when store changes by resetting the items array
      setValue('items', []);
      // Clear products list as well
      setProducts([]);
      setFormProducts([]);
      toast('Items cleared due to store change. Please add products for the new store.', {
        icon: 'ℹ️',
        duration: 4000,
      });
    }
    // Update previous store ID
    if (watchedStoreId) {
      setPreviousStoreId(watchedStoreId);
    }
  }, [watchedStoreId, previousStoreId, watchedItems, setValue]);

  // Reset items when adjustment reason changes to ensure data consistency
  useEffect(() => {
    if (watchedAdjustmentReasonId && previousAdjustmentReasonId && 
        watchedAdjustmentReasonId !== previousAdjustmentReasonId && 
        watchedItems && watchedItems.length > 0) {
      // Clear all items when adjustment reason changes by resetting the items array
      setValue('items', []);
      // Clear products list as well
      setProducts([]);
      setFormProducts([]);
      toast('Items cleared due to adjustment reason change. Please add products for the new reason.', {
        icon: 'ℹ️',
        duration: 4000,
      });
    }
    // Update previous adjustment reason ID
    if (watchedAdjustmentReasonId) {
      setPreviousAdjustmentReasonId(watchedAdjustmentReasonId);
    }
  }, [watchedAdjustmentReasonId, previousAdjustmentReasonId, watchedItems, setValue]);

  // Reset form when stockAdjustment changes
  useEffect(() => {
    if (fullStockAdjustment) {
      reset({
        reference_number: fullStockAdjustment.reference_number,
        adjustment_date: fullStockAdjustment.adjustment_date,
        store_id: fullStockAdjustment.store_id,
        adjustment_type: fullStockAdjustment.adjustment_type,
        reason_id: fullStockAdjustment.reason_id,
        inventory_account_id: fullStockAdjustment.account_id || '',
        inventory_corresponding_account_id: fullStockAdjustment.corresponding_account_id || '',
        document_type: fullStockAdjustment.document_type || '',
        document_number: fullStockAdjustment.document_number || '',
        currency_id: fullStockAdjustment.currency_id || '',
        exchange_rate: fullStockAdjustment.exchange_rate || 1.0,
        system_default_currency_id: fullStockAdjustment.system_default_currency_id || '',
        exchange_rate_id: fullStockAdjustment.exchange_rate_id || '',
        notes: fullStockAdjustment.notes || '',
        items: fullStockAdjustment.items || []
      });

      // Populate formProducts with products from existing items
      if (fullStockAdjustment.items && fullStockAdjustment.items.length > 0) {
        const existingProducts = fullStockAdjustment.items.map(item => ({
          id: item.product_id,
          name: item.product?.name || item.product_name || 'Unknown Product',
          code: item.product?.code || item.product_code || 'N/A',
          currentQuantity: item.current_quantity || 0, // Use historical current stock initially
          average_cost: item.product?.average_cost || item.unit_cost || 0,
          track_serial_number: (item.product as any)?.track_serial_number || false,
          expiry_notification_days: (item.product as any)?.expiry_notification_days,
          category: (item.product as any)?.category,
          unit: (item.product as any)?.unit,
          brand: (item.product as any)?.brand,
          manufacturer: (item.product as any)?.manufacturer
        }));
        setFormProducts(existingProducts);
        
        // Fetch current stock for existing products using product catalog API
        fetchCurrentStockForExistingProducts(existingProducts, fullStockAdjustment.store_id);
      }
    }
  }, [fullStockAdjustment, reset]);

  const loadStores = async () => {
    try {
      setIsLoadingStores(true);
      const response = await storeService.getStores({ limit: 1000, status: 'active' });
      const stores = response.data.map((store: any) => ({
        id: store.id,
        name: store.name
      }));
      setStores(stores);
      return stores;
    } catch (error) {
      toast.error('Failed to load stores');
      return [];
    } finally {
      setIsLoadingStores(false);
    }
  };

  // Filter stores based on user access
  const getUserAssignedStores = () => {
    if (!userStores || userStores.length === 0) {
      return [];
    }
    return stores.filter(store => {
      return userStores.some(userStore => {
        return userStore.id === store.id;
      });
    });
  };

  const handleProductSearch = (term: string) => {
    setProductSearchTerm(term);
    loadProducts(term, productFilters);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...productFilters, [filterType]: value };
    setProductFilters(newFilters);
    loadProducts(productSearchTerm, newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      category: '',
      brand: '',
      manufacturer: '',
      color: '',
      model: '',
      packaging: '',
      storeLocation: '',
      productType: ''
    };
    setProductFilters(clearedFilters);
    loadProducts(productSearchTerm, clearedFilters);
  };

  // Validation functions for duplicate batch numbers and serial numbers
  const validateBatchNumber = (itemIndex: number, value: string) => {
    const item = watchedItems[itemIndex];
    if (!item?.batch_number || !value.trim()) return true;
    
    return value.trim().length > 0;
  };

  const validateSerialNumber = (itemIndex: number, serialIndex: number, value: string) => {
    const item = watchedItems[itemIndex];
    if (!item?.serial_numbers || !value.trim()) return true;
    
    const currentSerialNumbers = item.serial_numbers.filter((_, index) => index !== serialIndex);
    return !currentSerialNumbers.includes(value.trim());
  };

  // Helper functions to check if product requires tracking
  const requiresSerialTracking = (product: any) => {
    return product?.track_serial_number === true;
  };

  const requiresExpiryTracking = (product: any) => {
    return product?.expiry_notification_days !== null && product?.expiry_notification_days !== undefined;
  };

  // Helper function to get product information with fallback
  const getProductInfo = useCallback((productId: string) => {
    // First try to find in formProducts (existing items)
    let product = formProducts.find(p => p.id === productId);
    
    // If not found, try products array (search results)
    if (!product) {
      product = products.find(p => p.id === productId);
    }
    
    // Return product with fallback values
    return product || {
      id: productId,
      name: 'Unknown Product',
      code: 'N/A',
      currentQuantity: 0,
      average_cost: 0,
      track_serial_number: false,
      expiry_notification_days: undefined,
      category: undefined,
      unit: undefined,
      brand: undefined,
      manufacturer: undefined
    };
  }, [formProducts, products]);

  // Check if any products in the table require tracking
  const hasProductsRequiringExpiryTracking = watchedItems.some(item => {
    const product = getProductInfo(item.product_id);
    return requiresExpiryTracking(product);
  });

  const handleAddProduct = (product: any) => {
    const existingItem = watchedItems.find(item => item.product_id === product.id);
    if (existingItem) {
      toast.error('Product already added');
      return;
    }

    // Add product to form products if not already there
    const existingFormProduct = formProducts.find(p => p.id === product.id);
    if (!existingFormProduct) {
      setFormProducts(prev => [...prev, product]);
    }

    // Calculate new stock based on adjustment type
    const currentStock = product.currentQuantity || 0;
    const adjustedStock = 0; // Start with 0 for adjustment amount
    let newStock = 0;
    
    if (watchedAdjustmentType === 'add') {
      // For stock in: new_stock = current_stock + adjusted_stock
      newStock = currentStock + adjustedStock;
    } else if (watchedAdjustmentType === 'deduct') {
      // For stock out: new_stock = current_stock - adjusted_stock
      newStock = currentStock - adjustedStock;
    }

    append({
      product_id: product.id,
      current_stock: currentStock,
      adjusted_stock: adjustedStock,
      user_unit_cost: product.average_cost || 0,
      serial_numbers: [],
      expiry_date: '',
      batch_number: '',
      notes: '',
      new_stock: newStock
    });
  };

  const calculateItemTotal = (item: StockAdjustmentItemFormData, currentQuantity: number) => {
    // For both Add and Deduct: difference = adjusted_stock (amount to adjust)
    const difference = Number(item.adjusted_stock || 0);
    return difference * Number(item.user_unit_cost || 0);
  };

  const calculateNewStock = (currentStock: number, adjustedStock: number, adjustmentType: string) => {
    if (adjustmentType === 'add') {
      // For stock in: new_stock = current_stock + adjusted_stock
      return currentStock + adjustedStock;
    } else if (adjustmentType === 'deduct') {
      // For stock out: new_stock = current_stock - adjusted_stock
      return currentStock - adjustedStock;
    }
    return currentStock;
  };

  const calculateTotalValue = () => {
    return watchedItems.reduce((total, item) => {
      const product = getProductInfo(item.product_id);
      const currentQuantity = product?.currentQuantity || 0;
      return total + calculateItemTotal(item, currentQuantity);
    }, 0);
  };

  const calculateTotalItems = () => {
    return watchedItems.reduce((total, item) => {
      // For both Add and Deduct: difference = adjusted_stock (amount to adjust)
      const difference = Number(item.adjusted_stock || 0);
      return total + difference;
    }, 0);
  };

  const calculateTotalEquivalentAmount = () => {
    const rate = calculateExchangeRate();
    const totalValue = calculateTotalValue();
    
    if (rate === null) return 0;
    const numericRate = Number(rate);
    if (isNaN(numericRate)) return 0;
    
    return totalValue * numericRate;
  };

  const handleFormSubmit = async (data: StockAdjustmentFormData, status: 'draft' | 'submitted' = 'draft') => {
    // Update reference number if it's still "Pending"
    if (referenceNumber === 'Pending') {
      const generatedReference = `SA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
      setReferenceNumber(generatedReference);
      setValue('reference_number', generatedReference);
      data.reference_number = generatedReference;
    }
    return onSubmit(data, status);
  };

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

  const validateStep1 = (data: StockAdjustmentFormData) => {
    const requiredFields = [
      { key: 'adjustment_date', label: 'Adjustment Date' },
      { key: 'store_id', label: 'Store' }, 
      { key: 'reason_id', label: 'Adjustment Reason' },
      { key: 'inventory_account_id', label: 'Inventory Account' },
      { key: 'currency_id', label: 'Currency' }
    ];
    
    const missingFields = requiredFields.filter(field => !data[field.key as keyof StockAdjustmentFormData]);
    
    if (missingFields.length > 0) {
      return false;
    }
    
    return true;
  };

  const validateStep2 = (data: StockAdjustmentFormData) => {
    return data.items && data.items.length > 0;
  };

  const handleStepSubmit = async (data: StockAdjustmentFormData) => {
    if (currentStep === 1) {
      if (validateStep1(data)) {
        handleNextStep();
      }
    } else {
      if (validateStep2(data)) {
        await handleFormSubmit(data, 'submitted');
      }
    }
  };

  // Load initial data in parallel for better performance
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsInitialDataLoaded(false);
        
        // Load stores data
        await loadStores();
        
        setIsInitialDataLoaded(true);
      } catch (error) {
        toast.error('Failed to load form data');
      }
    };

    loadInitialData();
  }, []);

  return (
    <div className={`space-y-6 w-full mx-auto ${isSidebarCollapsed ? 'max-w-none' : 'max-w-[70vw]'}`}>
      {/* Step Indicator */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
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
                Adjustment Details
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
                Adjustment Items
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!isInitialDataLoaded && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading form data...</span>
        </div>
      )}

      {/* Form Content */}
      {isInitialDataLoaded && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentStep === 1 ? 'Create Stock Adjustment' : 'Add Adjustment Items'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleStepSubmit)} className="space-y-8">
            {/* Step 1: Adjustment Details */}
            {currentStep === 1 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Adjustment Details</h3>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number
                    </label>
                    <Tooltip content={referenceNumber === 'Pending' 
                      ? 'Reference number will be generated when you create the adjustment'
                      : 'Reference number assigned'
                    }>
                      <Input
                        value={referenceNumber}
                        placeholder="Pending"
                        readOnly
                        disabled
                        className="bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </Tooltip>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adjustment Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register('adjustment_date')}
                      type="date"
                      required
                    />
                    {errors.adjustment_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.adjustment_date.message}</p>
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
                      Adjustment Reason <span className="text-red-500">*</span>
                    </label>
                    <Select
                      {...register('reason_id')}
                      required
                      disabled={isLoadingAdjustmentReasons}
                    >
                      <option value="">Select Adjustment Reason</option>
                      {adjustmentReasons.map(reason => (
                        <option key={reason.id} value={reason.id}>
                          {reason.name}
                        </option>
                      ))}
                    </Select>
                    {errors.reason_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.reason_id.message}</p>
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
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </Select>
                    {errors.currency_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.currency_id.message}</p>
                    )}
                    <Tooltip content="Currency for unit costs and total values">
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
                          // Ensure rate is a number before calling toFixed
                          const numericRate = Number(rate);
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
                  <input type="hidden" {...register('system_default_currency_id')} />
                  <input type="hidden" {...register('exchange_rate_id')} />
                </div>

                {/* Account Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adjustment Type
                    </label>
                    <Select
                      {...register('adjustment_type')}
                      required
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    >
                      <option value="add">Stock In</option>
                      <option value="deduct">Stock Out</option>
                    </Select>
                    {errors.adjustment_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.adjustment_type.message}</p>
                    )}
                    <Tooltip content="Automatically selected based on adjustment reason">
                      <div className="mt-1 h-1"></div>
                    </Tooltip>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inventory Account *
                    </label>
                    <Select
                      {...register('inventory_account_id')}
                      required
                    >
                      <option value="">Select Inventory Account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </Select>
                    {errors.inventory_account_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.inventory_account_id.message}</p>
                    )}
                    <Tooltip content="Auto-populated from adjustment reason, but can be manually changed">
                      <div className="mt-1 h-1"></div>
                    </Tooltip>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Corresponding Account
                    </label>
                    <Select
                      {...register('inventory_corresponding_account_id')}
                    >
                      <option value="">Select Corresponding Account (Optional)</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </Select>
                    {errors.inventory_corresponding_account_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.inventory_corresponding_account_id.message}</p>
                    )}
                    <Tooltip content="Auto-populated from adjustment reason (if configured), but can be manually changed">
                      <div className="mt-1 h-1"></div>
                    </Tooltip>
                  </div>
                </div>

                {/* Document Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <Select
                      {...register('document_type')}
                    >
                      <option value="">Select Document Type (Optional)</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Purchase Order">Purchase Order</option>
                      <option value="Delivery Note">Delivery Note</option>
                      <option value="Credit Note">Credit Note</option>
                      <option value="Debit Note">Debit Note</option>
                      <option value="Return Note">Return Note</option>
                      <option value="Adjustment Note">Adjustment Note</option>
                      <option value="Physical Count">Physical Count</option>
                      <option value="Damaged Goods">Damaged Goods</option>
                      <option value="Expired Goods">Expired Goods</option>
                      <option value="Other">Other</option>
                    </Select>
                    {errors.document_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.document_type.message}</p>
                    )}
                    <Tooltip content="Type of supporting document (optional)">
                      <div className="mt-1 h-1"></div>
                    </Tooltip>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Number
                    </label>
                    <Input
                      {...register('document_number')}
                      placeholder="e.g., INV-001, REC-002"
                      maxLength={100}
                    />
                    {errors.document_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.document_number.message}</p>
                    )}
                    <Tooltip content="Reference number of supporting document (optional)">
                      <div className="mt-1 h-1"></div>
                    </Tooltip>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustment Notes
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

            {/* Step 2: Adjustment Items */}
            {currentStep === 2 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Adjustment Items</h3>
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
                {watchedStoreId && (
                  <div className="mb-6">
                    <div 
                      className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    >
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <h3 className="text-sm font-medium text-gray-700">Filter Products</h3>
                        <span className="text-xs text-gray-500">
                          ({Object.values(productFilters).filter(value => value !== '').length} active)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {Object.values(productFilters).some(value => value !== '') && (
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
                            onChange={(e) => handleFilterChange('category', e.target.value)}
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
                            onChange={(e) => handleFilterChange('brand', e.target.value)}
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
                            onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
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
                            onChange={(e) => handleFilterChange('color', e.target.value)}
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
                            onChange={(e) => handleFilterChange('model', e.target.value)}
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
                            onChange={(e) => handleFilterChange('packaging', e.target.value)}
                            disabled={isLoadingFilters}
                          >
                            <option value="">All Packaging</option>
                            {filterOptions.packaging.map((packaging) => (
                              <option key={packaging.id} value={packaging.id}>
                                {packaging.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Search Results */}
                {productSearchTerm && watchedStoreId && (
                  <div className="mb-6">
                    {isLoadingProducts ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Searching products...</span>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No products found</p>
                        <p className="text-sm">Try adjusting your search terms</p>
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
                                onClick={() => !isAlreadyAdded && handleAddProduct(product)}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  isAlreadyAdded 
                                    ? 'bg-green-50 border-green-200 cursor-not-allowed' 
                                    : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <Package className="h-4 w-4 text-gray-400" />
                                      <div>
                                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.code}</p>
                                        {product.category && (
                                          <p className="text-xs text-gray-400">{product.category.name}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-medium text-gray-600">
                                      Stock: {product.currentQuantity || 0}
                                    </p>
                                    {product.unit && (
                                      <p className="text-xs text-gray-400">{product.unit.name}</p>
                                    )}
                                    {isAlreadyAdded && (
                                      <div className="flex items-center space-x-1 mt-1">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <span className="text-xs text-green-600">Added</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Adjustment Items Table */}
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No products added yet</p>
                    <p className="text-sm">
                      {watchedStoreId 
                        ? 'Search for products above and click to add them to the adjustment'
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
                            const dropdown = document.getElementById('stock-adjustment-items-columns-dropdown');
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
                          id="stock-adjustment-items-columns-dropdown"
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
                                  if (key === 'product' || key === 'currentStock' || key === 'newQuantity' || key === 'unitCost' || key === 'actions') {
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
                                key !== 'product' && key !== 'currentStock' && key !== 'newQuantity' && key !== 'unitCost' && key !== 'actions'
                              ).every(([, v]) => v) ? 'Hide All Optional' : 'Show All'}
                            </button>
                            
                            {/* Scrollable Column List */}
                            <div className="max-h-64 overflow-y-auto">
                              {Object.entries(visibleColumns).map(([key, visible]) => {
                                const isRequired = key === 'product' || key === 'currentStock' || key === 'newQuantity' || key === 'unitCost' || key === 'actions';
                                const columnLabel = key === 'currentStock' ? 'Current Stock' :
                                  key === 'newQuantity' ? 'New Quantity' :
                                  key === 'unitCost' ? 'Unit Cost' :
                                  key === 'unitAverageCost' ? 'Unit Average Cost' :
                                  key === 'adjustmentAmount' ? 'Adjustment Amount' :
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                              Product
                            </th>
                            )}
                            {visibleColumns.currentStock && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Current Stock
                            </th>
                            )}
                            {visibleColumns.newQuantity && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                              New Quantity
                            </th>
                            )}
                            {visibleColumns.unitCost && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                              Unit Cost
                            </th>
                            )}
                            {visibleColumns.unitAverageCost && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                              Unit Average Cost
                            </th>
                            )}
                            {visibleColumns.adjustmentAmount && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                              Adjustment Amount ({watchedAdjustmentType === 'add' ? 'Add' : 'Deduct'})
                            </th>
                            )}
                            {visibleColumns.newStock && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              New Stock
                            </th>
                            )}
                            {visibleColumns.totalValue && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Total Value
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
                        {fields.map((field, index) => {
                          const item = watchedItems[index];
                          const product = getProductInfo(item?.product_id || '');
                          const currentQuantity = product?.currentQuantity || 0;
                          // Calculate difference based on adjustment type
                          // For Add: difference = adjusted_stock (amount to add)
                          // For Deduct: difference = adjusted_stock (amount to deduct)
                          const difference = Number(item?.adjusted_stock || 0);
                          const isValidAdjustment = difference > 0;

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
                                  {(product?.currentQuantity || 0).toLocaleString('en-US')}
                                </div>
                                {product?.unit && (
                                  <div className="text-xs text-gray-500">{product.unit.name}</div>
                                )}
                              </td>
                              )}

                              {/* New Quantity */}
                              {visibleColumns.newQuantity && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Input
                                  {...register(`items.${index}.adjusted_stock`)}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="w-32"
                                />
                              </td>
                              )}

                              {/* Unit Cost */}
                              {visibleColumns.unitCost && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  <Input
                                    {...register(`items.${index}.user_unit_cost`)}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-40"
                                    placeholder="0.00"
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

                              {/* Difference */}
                              {visibleColumns.adjustmentAmount && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  <div className="flex items-center space-x-1">
                                    <span className={`text-sm font-medium ${
                                      watchedAdjustmentType === 'add' 
                                        ? (difference >= 0 ? 'text-green-600' : 'text-red-600')
                                        : (difference >= 0 ? 'text-red-600' : 'text-green-600')
                                    }`}>
                                      {difference >= 0 ? '+' : ''}{difference}
                                    </span>
                                    {watchedAdjustmentType === 'add' ? (
                                      <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
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
                                    {(watchedAdjustmentType === 'add' 
                                      ? (currentQuantity + Number(item?.adjusted_stock || 0))
                                      : Math.max(0, currentQuantity - Number(item?.adjusted_stock || 0))
                                    ).toLocaleString('en-US')}
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
                                  {isValidAdjustment ? (
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
                                        {...register(`items.${index}.expiry_date`)}
                                        type="date"
                                        className="w-32 text-xs"
                                        placeholder="mm/dd/yyyy"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setValue(`items.${index}.expiry_date`, '');
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                        title="Clear expiry date"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                    </div>
                                    {/* Show existing expiry date if available */}
                                    {item?.expiry_date && (
                                      <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        {item.expiry_date}
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
                                        {...register(`items.${index}.batch_number`)}
                                        placeholder="Batch #"
                                        className="w-32 text-xs"
                                        maxLength={50}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setValue(`items.${index}.batch_number`, '');
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                        title="Clear batch number"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                    </div>
                                    {/* Show existing batch number if available */}
                                    {item?.batch_number && (
                                      <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                        {item.batch_number}
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
                                    {(item?.serial_numbers || []).map((serial, serialIndex) => {
                                      const isDuplicate = !validateSerialNumber(index, serialIndex, serial || '');
                                      return (
                                        <div key={serialIndex} className="flex flex-col space-y-1">
                                          <div className="flex items-center space-x-1">
                                            <Input
                                              {...register(`items.${index}.serial_numbers.${serialIndex}`)}
                                              placeholder="Serial #"
                                              className={`w-32 text-xs ${isDuplicate ? 'border-red-500 bg-red-50' : ''}`}
                                              maxLength={50}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const currentSerials = item?.serial_numbers || [];
                                                const newSerials = currentSerials.filter((_, i) => i !== serialIndex);
                                                setValue(`items.${index}.serial_numbers`, newSerials);
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
                                        const currentSerials = item?.serial_numbers || [];
                                        setValue(`items.${index}.serial_numbers`, [...currentSerials, '']);
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
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}

                {/* Summary */}
                {fields.length > 0 && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Items</p>
                        <p className="text-lg font-semibold text-gray-900">{calculateTotalItems()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Products Added</p>
                        <p className="text-lg font-semibold text-gray-900">{fields.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Value</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrencyWithSymbol(calculateTotalValue(), watchedCurrencyId || '')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Equivalent Amount</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrencyWithSymbol(calculateTotalEquivalentAmount(), defaultCurrency?.id || '')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Adjustment Type</p>
                        <div className="flex items-center justify-center space-x-1">
                          {watchedAdjustmentType === 'add' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`font-semibold ${
                            watchedAdjustmentType === 'add' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {watchedAdjustmentType === 'add' ? 'Stock In' : 'Stock Out'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
                )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
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
                
                {currentStep === 2 && stockAdjustment && stockAdjustment.status === 'draft' && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading || !validateStep2(watch())}
                    onClick={() => {
                      const formData = watch();
                      if (validateStep2(formData)) {
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
                  onClick={async () => {
                    const formData = watch();
                    
                    // Handle step navigation directly
                    if (currentStep === 1) {
                      if (validateStep1(formData)) {
                        handleNextStep();
                      }
                    } else {
                      // For step 2, determine submission type based on whether we're editing existing adjustment
                      if (stockAdjustment && stockAdjustment.status === 'draft') {
                        // Editing existing draft adjustment - show submit option
                        await handleFormSubmit(formData, 'submitted');
                      } else {
                        // Creating new adjustment - save as draft
                        await handleFormSubmit(formData, 'draft');
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
                      <span>{currentStep === 1 ? 'Next' : (stockAdjustment && stockAdjustment.status === 'draft' ? 'Submit Adjustment' : 'Save as Draft')}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

        </>
      )}
    </div>
  );
};

export default StockAdjustmentForm;