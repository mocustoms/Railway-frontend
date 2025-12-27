import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import {
  X,
  Package,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { StoreRequest, StoreRequestFormData, StoreRequestItemFormData, Store, Product, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { productCatalogService } from '../services/productCatalogService';
import { storeLocationService } from '../services/storeLocationService';
import { currencyService } from '../services/currencyService';
import { getAllActiveExchangeRates } from '../services/exchangeRateService';
import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';
import Button from './Button';

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

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {isVisible && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-1 whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

interface StoreRequestFormProps {
  storeRequest?: StoreRequest | null;
  stores: Store[];
  currentUser?: User | null;
  onSubmit: (data: StoreRequestFormData, status?: 'draft' | 'submitted') => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  mode: 'create' | 'edit';
  onSubmitForApproval?: (id: string) => void;
}

const validationSchema = yup.object({
  reference_number: yup.string().optional(),
  request_date: yup.string().required('Request date is required'),
  requesting_store_id: yup.string().required('Requesting store is required'),
  requested_from_store_id: yup.string().required('Issuing store is required'),
    request_type: yup.string().oneOf(['request', 'issue']).optional(),
  priority: yup.string().oneOf(['low', 'medium', 'high', 'urgent']).required('Priority is required'),
  expected_delivery_date: yup.string().optional(),
  notes: yup.string().max(500, 'Notes must not exceed 500 characters').optional(),
  currency_id: yup.string().required('Currency is required'),
  exchange_rate: yup.number().min(0.0001, 'Exchange rate must be greater than 0').optional(),
  items: yup.array().of(
    yup.object({
      product_id: yup.string().required('Product is required'),
      requested_quantity: yup.number().min(0.001, 'Requested quantity must be greater than 0').required('Requested quantity is required'),
      unit_cost: yup.number().min(0, 'Unit cost must be non-negative').optional(),
      currency_id: yup.string().optional(),
      exchange_rate: yup.number().min(0.0001, 'Exchange rate must be greater than 0').optional(),
      equivalent_amount: yup.number().min(0, 'Equivalent amount must be non-negative').optional(),
      notes: yup.string().max(200, 'Item notes must not exceed 200 characters').optional()
    })
  ).min(1, 'At least one item is required')
});

const StoreRequestForm: React.FC<StoreRequestFormProps> = ({
  storeRequest,
  stores,
  currentUser,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
  onSubmitForApproval
}) => {
  const isEdit = mode === 'edit';
  const { stores: userStores } = useAuth();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(2);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  
  // Reference number state
  const [referenceNumber, setReferenceNumber] = useState('Pending');
  
  // State for product search and selection
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [formProducts, setFormProducts] = useState<Product[]>([]);
  
  // State for requesting store stock information
  const [requestingStoreStock, setRequestingStoreStock] = useState<{[productId: string]: number}>({});
  
  // Product filter states
  const [productFilters, setProductFilters] = useState({
    category: '',
    brand: '',
    manufacturer: '',
    color: '',
    model: '',
    packaging: '',
    storeLocation: ''
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
  
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [showMoreColumns, setShowMoreColumns] = useState(() => {
    // Load saved state from localStorage, default to false
    const saved = localStorage.getItem('storeRequest_showMoreColumns');
    return saved ? JSON.parse(saved) : false;
  });

  // Handle toggle with localStorage persistence
  const handleToggleMoreColumns = useCallback(() => {
    const newState = !showMoreColumns;
    setShowMoreColumns(newState);
    localStorage.setItem('storeRequest_showMoreColumns', JSON.stringify(newState));
  }, [showMoreColumns]);

  // Filter stores based on user assignments and capabilities
  const getUserAssignedStores = () => {
    if (!userStores || userStores.length === 0) {
      return [];
    }
    
    // Filter stores based on three criteria:
    // 1. User has been assigned to the store
    // 2. Store is active
    // 3. Store can receive from other stores
    return stores.filter(store => {
      return userStores.some(userStore => {
        return userStore.id === store.id && 
               store.is_active && 
               store.can_receive_from_store;
      });
    });
  };
  
  const getStoresWithIssueCapability = () => {
    return stores.filter(store => store.can_issue_to_store && store.is_active);
  };

  const {
    register,
    control,
    watch,
    setValue,
    reset,
    getValues,
    trigger,
    formState: { errors }
  } = useForm<StoreRequestFormData>({
    resolver: yupResolver(validationSchema) as any,
    mode: 'onChange',
    defaultValues: {
      request_date: new Date().toISOString().split('T')[0],
      requesting_store_id: '',
      requested_from_store_id: '',
      request_type: 'request', // Auto-filled for Store Request module
      priority: 'medium',
      expected_delivery_date: '',
      notes: '',
      currency_id: '',
      exchange_rate: 1.0,
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedRequestingStoreId = watch('requesting_store_id');
  const watchedIssuingStoreId = watch('requested_from_store_id');
  const watchedCurrencyId = watch('currency_id');

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

  // Update exchange rate when currency changes
  useEffect(() => {
    if (watchedCurrencyId && defaultCurrency && exchangeRates.length > 0) {
      const rate = exchangeRates.find(rate => 
        rate.from_currency_id === watchedCurrencyId && 
        rate.to_currency_id === defaultCurrency.id
      );
      
      if (rate) {
        setValue('exchange_rate', rate.rate);
      } else {
        setValue('exchange_rate', 1.0);
      }
    }
  }, [watchedCurrencyId, defaultCurrency, exchangeRates, setValue]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsInitialDataLoaded(false);
        
        // Load currencies
        setIsLoadingCurrencies(true);
        const currenciesData = await currencyService.getCurrencies(1, 1000);
        setCurrencies(currenciesData.currencies || []);
        
        // Find default currency
        const defaultCurr = currenciesData.currencies?.find(c => c.is_default);
        if (defaultCurr) {
          setDefaultCurrency(defaultCurr);
          // Only set default currency if we're in create mode and no currency is selected
          const currentCurrencyId = getValues('currency_id');
          if (!isEdit && !currentCurrencyId) {
            setValue('currency_id', defaultCurr.id);
          }
        }
        
        // Load exchange rates
        const exchangeRatesData = await getAllActiveExchangeRates();
        setExchangeRates(exchangeRatesData || []);
        
        setIsLoadingCurrencies(false);
        setIsInitialDataLoaded(true);
      } catch (error) {
        toast.error('Failed to load form data');
        setIsLoadingCurrencies(false);
      }
    };

    loadInitialData();
  }, [setValue]);

  // Initialize form with store request data when editing
  useEffect(() => {
    if (storeRequest && isEdit) {
      reset({
        reference_number: storeRequest.reference_number || '',
        request_date: storeRequest.request_date,
        requesting_store_id: storeRequest.requestingStore?.id || storeRequest.requested_by_store_id,
        requested_from_store_id: storeRequest.issuingStore?.id || storeRequest.requested_from_store_id,
        request_type: 'request', // Always set to 'request' for Store Request module
        priority: storeRequest.priority,
        expected_delivery_date: storeRequest.expected_delivery_date || '',
        notes: storeRequest.notes || '',
        currency_id: storeRequest.currency_id || '',
        exchange_rate: storeRequest.exchange_rate || 1.0,
        items: storeRequest.storeRequestItems?.map(item => ({
          product_id: item.product_id,
          requested_quantity: item.requested_quantity,
          unit_cost: item.unit_cost || 0,
          currency_id: item.currency_id || '',
          exchange_rate: item.exchange_rate || 1.0,
          equivalent_amount: item.equivalent_amount || 0,
          notes: item.notes || ''
        })) || []
      });
      setReferenceNumber(storeRequest.reference_number || 'Pending');
      
      // Populate formProducts with products from existing items
      if (storeRequest.storeRequestItems && storeRequest.storeRequestItems.length > 0) {
        const existingProducts = storeRequest.storeRequestItems
          .map(item => {
            return item.storeRequestProduct;
          })
          .filter((product): product is Product => product !== undefined);
        setFormProducts(existingProducts);
      } else {
        }
    }
  }, [storeRequest, isEdit, reset]);

  // Load stock information for the requesting store
  const loadRequestingStoreStock = useCallback(async (productIds: string[], requestingStoreId: string) => {
    if (!requestingStoreId || productIds.length === 0) return;
    
    try {
      const stockPromises = productIds.map(async (productId) => {
        try {
          const stockData = await productCatalogService.getProductStoreStock(productId, requestingStoreId);
          return { productId, quantity: stockData.quantity || 0 };
        } catch (error) {
          return { productId, quantity: 0 };
        }
      });
      
      const stockResults = await Promise.all(stockPromises);
      const stockMap = stockResults.reduce((acc, { productId, quantity }) => {
        acc[productId] = quantity;
        return acc;
      }, {} as {[productId: string]: number});
      
      setRequestingStoreStock(stockMap);
    } catch (error) {
      }
  }, []);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      // Load all filter options in parallel
      const [
        categoriesData,
        brandsData,
        manufacturersData,
        colorsData,
        modelsData,
        packagingData,
        storeLocationsData
      ] = await Promise.all([
        productCatalogService.getReferenceCategories(),
        productCatalogService.getReferenceBrands(),
        productCatalogService.getReferenceManufacturers(),
        productCatalogService.getReferenceColors(),
        productCatalogService.getReferenceModels(),
        productCatalogService.getReferencePackagings(),
        storeLocationService.getActiveStoreLocations()
      ]);

      setFilterOptions({
        categories: categoriesData || [],
        brands: brandsData || [],
        manufacturers: manufacturersData || [],
        colors: colorsData || [],
        models: modelsData || [],
        packaging: packagingData || [],
        storeLocations: storeLocationsData || []
      });
    } catch (error) {
      }
  }, []);

  // Apply filters to products
  const applyFilters = useCallback((products: Product[], filters: any) => {
    return products.filter((product: any) => {
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
      // Store Location filter (aisles/shelves within store)
      if (filters.storeLocation && product.storeLocation?.id !== filters.storeLocation) {
        return false;
      }
      return true;
    });
  }, []);

  // Load products for the requested from store
  const loadProducts = useCallback(async (searchTerm?: string, filters?: any) => {
    try {
      setIsLoadingProducts(true);
      const selectedStoreId = watchedIssuingStoreId;
      
      if (!selectedStoreId) {
        toast.error('Please select a store to request from first');
        return;
      }
      
      const data = await productCatalogService.getProductsByStore(selectedStoreId, searchTerm || '', 100);
      
      // Filter out services products
      const nonServiceProducts = data.filter((product: any) => product.product_type !== 'services');
      
      // Apply client-side filtering if filters are provided
      let filteredProducts = nonServiceProducts;
      if (filters) {
        filteredProducts = applyFilters(nonServiceProducts, filters);
      }
      
      setProducts(filteredProducts);
      
      // Load stock information for the requesting store
      const requestingStoreId = watchedRequestingStoreId;
      if (requestingStoreId && filteredProducts.length > 0) {
        const productIds = filteredProducts.map(p => p.id);
        await loadRequestingStoreStock(productIds, requestingStoreId);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [watchedIssuingStoreId, watchedRequestingStoreId, loadRequestingStoreStock, applyFilters]);

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Load products when search term or filters change
  useEffect(() => {
    if (productSearchTerm && watchedIssuingStoreId) {
      const timeoutId = setTimeout(() => {
        loadProducts(productSearchTerm, productFilters);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [productSearchTerm, watchedIssuingStoreId, loadProducts, productFilters]);

  // Apply filters when they change
  useEffect(() => {
    if (products.length > 0 && Object.values(productFilters).some(value => value !== '')) {
      const filteredProducts = applyFilters(products, productFilters);
      setProducts(filteredProducts);
    }
  }, [productFilters, applyFilters, products]);

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
      average_cost: 0,
      part_number: 'N/A',
      brand: { name: 'N/A' },
      color: { name: 'N/A' },
      manufacturer: { name: 'N/A' },
      category: { name: 'N/A' },
      model: { name: 'N/A' },
      unit: { name: 'N/A' }
    };
  }, [formProducts, products]);

  // Add product to request
  const handleAddProduct = (product: Product) => {
    // Add product to form products if not already there
    const existingFormProduct = formProducts.find(p => p.id === product.id);
    if (!existingFormProduct) {
      setFormProducts(prev => [...prev, product]);
    }

    const rate = calculateExchangeRate();
    const numericRate = rate !== null ? Number(rate) : 1.0;
    const unitCost = Number(product.average_cost) || 0;
    const equivalentAmount = unitCost * numericRate;

    const newItem: StoreRequestItemFormData = {
      product_id: product.id,
      requested_quantity: 1,
      unit_cost: unitCost, // Use product's average cost as default
      currency_id: watchedCurrencyId || '',
      exchange_rate: numericRate,
      equivalent_amount: equivalentAmount,
      notes: ''
    };
    
    append(newItem);
    toast.success(`${product.name} added to request with average cost: ${(() => {
      const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
      const currencySymbol = selectedCurrency?.symbol || '$';
      return `${currencySymbol}${(Number(product.average_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    })()}`);
  };

  // Remove product from request
  const handleRemoveProduct = (index: number) => {
    remove(index);
    toast.success('Product removed from request');
  };

  // Update item quantity
  const handleQuantityChange = (index: number, quantity: number) => {
    setValue(`items.${index}.requested_quantity`, quantity);
    // Update equivalent amount when quantity changes
    const unitCost = parseFloat(watchedItems[index]?.unit_cost?.toString() || '0');
    const rate = calculateExchangeRate();
    const numericRate = rate !== null ? Number(rate) : 1.0;
    const equivalentAmount = (quantity * unitCost) * numericRate;
    setValue(`items.${index}.exchange_rate`, numericRate);
    setValue(`items.${index}.equivalent_amount`, equivalentAmount);
  };

  // Update item unit cost
  const handleUnitCostChange = (index: number, unitCost: number) => {
    setValue(`items.${index}.unit_cost`, unitCost);
    // Update equivalent amount when unit cost changes
    const quantity = parseFloat(watchedItems[index]?.requested_quantity?.toString() || '0');
    const rate = calculateExchangeRate();
    const numericRate = rate !== null ? Number(rate) : 1.0;
    const equivalentAmount = (quantity * unitCost) * numericRate;
    setValue(`items.${index}.exchange_rate`, numericRate);
    setValue(`items.${index}.equivalent_amount`, equivalentAmount);
  };

  // Calculate total value
  const calculateTotalValue = () => {
    return watchedItems.reduce((total, item) => {
      const quantity = parseFloat(item.requested_quantity?.toString() || '0');
      const unitCost = parseFloat(item.unit_cost?.toString() || '0');
      return total + (quantity * unitCost);
    }, 0);
  };

  // Step navigation functions
  const handleNextStep = () => {
    // Validate step 1 before proceeding
    const formData = getValues();
    if (validateStep1(formData)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        // Clear any existing product search when moving to step 2
        setProductSearchTerm('');
        setProducts([]);
      }
    } else {
      toast.error('Please fill in all required fields before proceeding');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step validation
  const validateStep1 = (data: StoreRequestFormData) => {
    const requiredFields = [
      { key: 'request_date', label: 'Request Date' },
      { key: 'requesting_store_id', label: 'Requesting Store' },
      { key: 'requested_from_store_id', label: 'Issuing Store' },
      // request_type is auto-filled, not required from user input
      { key: 'priority', label: 'Priority' },
      { key: 'currency_id', label: 'Currency' }
    ];
    
    const missingFields = requiredFields.filter(field => {
      const value = data[field.key as keyof StoreRequestFormData];
      return !value || value === '';
    });
    
    if (missingFields.length > 0) {
      return false;
    }
    
    return true;
  };

  const validateStep2 = (data: StoreRequestFormData) => {
    const isValid = data.items && data.items.length > 0;
    return isValid;
  };

  // Form submission
  const handleFormSubmit = async (data: StoreRequestFormData, status: 'draft' | 'submitted' = 'draft') => {
    // Update reference number if it's still "Pending"
    if (referenceNumber === 'Pending') {
      const generatedReference = `SR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
      setReferenceNumber(generatedReference);
      setValue('reference_number', generatedReference);
      data.reference_number = generatedReference;
    }
    
    // Calculate total items and value
    const totalItems = data.items.length;
    const totalValue = calculateTotalValue();
    
    const formData = {
      ...data,
      total_items: totalItems,
      total_value: totalValue,
      status
    };
    
    // Return the promise from onSubmit so we can await it
    return onSubmit(formData, status);
  };

  const handleStepSubmit = (data: StoreRequestFormData) => {
    if (currentStep === 1) {
      if (validateStep1(data)) {
        handleNextStep();
      }
    } else {
      if (validateStep2(data)) {
        handleFormSubmit(data, 'draft');
      } else {
        }
    }
  };

  return (
    <div className="space-y-6 w-full mx-auto max-w-[70vw]">
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
                Store Request Details
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
                Store Request Items
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
              {currentStep === 1 ? 'Create Store Request' : 'Add Request Items'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const isValid = await trigger();
              if (isValid) {
                const formData = getValues();
                handleStepSubmit(formData);
              } else {
                // Try to validate each field individually
                const formData = getValues();
                for (const [fieldName, fieldValue] of Object.entries(formData)) {
                  try {
                    const fieldValid = await trigger(fieldName as keyof StoreRequestFormData);
                    } catch (error) {
                    }
                }
              }
            } catch (error) {
              }
          }} className="space-y-8" onInvalid={(e) => {
            }}>
            {/* Step 1: Store Request Details */}
            {currentStep === 1 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Store Request Details</h3>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requisition Number
                    </label>
                    <Tooltip content={referenceNumber === 'Pending' 
                      ? 'Requisition number will be generated when you create the request'
                      : 'Requisition number assigned'
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
                      Request Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register('request_date')}
                      type="date"
                      required
                    />
                    {errors.request_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.request_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requested By Store <span className="text-red-500">*</span>
                    </label>
                    <Select
                      {...register('requesting_store_id')}
                      required
                    >
                      <option value="">Select Store</option>
                      {getUserAssignedStores().map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name} - {store.location}
                        </option>
                      ))}
                    </Select>
                    {errors.requesting_store_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.requesting_store_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requested From Store <span className="text-red-500">*</span>
                    </label>
                    <Select
                      {...register('requested_from_store_id')}
                      required
                    >
                      <option value="">Select Store</option>
                      {getStoresWithIssueCapability().map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name} - {store.location}
                        </option>
                      ))}
                    </Select>
                    {errors.requested_from_store_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.requested_from_store_id.message}</p>
                    )}
                  </div>

                  {/* Request Type is auto-filled based on module context */}
                  <input type="hidden" {...register('request_type')} />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <Select
                      {...register('priority')}
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </Select>
                    {errors.priority && (
                      <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Delivery Date
                    </label>
                    <Input
                      {...register('expected_delivery_date')}
                      type="date"
                    />
                    {errors.expected_delivery_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.expected_delivery_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <Select
                      {...register('currency_id')}
                      required
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exchange Rate
                    </label>
                    <Input
                      {...register('exchange_rate')}
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      placeholder="1.0000"
                    />
                    {errors.exchange_rate && (
                      <p className="mt-1 text-sm text-red-600">{errors.exchange_rate.message}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <Textarea
                    {...register('notes')}
                    rows={3}
                    placeholder="Additional notes or comments about this request..."
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                  )}
                </div>

                {/* Step 1 Actions */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next: Add Items
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Store Request Items */}
            {currentStep === 2 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Store Request Items</h3>
                  </div>
                  <div className="ml-auto flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      Items: {fields.length}
                    </div>
                    <div className="text-lg font-bold text-gray-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      Total: {(() => {
                        const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
                        const currencySymbol = selectedCurrency?.symbol || '$';
                        return `${currencySymbol}${calculateTotalValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Product Search and Selection */}
                {watchedIssuingStoreId ? (
                  <div className="space-y-6">
                    {/* Product Search */}
                    <div>
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          Search products available in <span className="font-medium text-blue-600">
                            {stores.find(s => s.id === watchedIssuingStoreId)?.name || 'selected store'}
                          </span>
                        </p>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                          type="text"
                          placeholder="Search products by name, SKU, or description..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Product Filters */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Filter size={16} className="mr-2" />
                        Filters
                        {isFiltersExpanded ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
                      </button>
                    </div>

                    {/* Expanded Filters */}
                    {isFiltersExpanded && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {/* Category Filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                            <Select
                              value={productFilters.category}
                              onChange={(e) => setProductFilters(prev => ({ ...prev, category: e.target.value }))}
                              className="text-sm"
                            >
                              <option value="">All Categories</option>
                              {filterOptions.categories.map((category: any) => (
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
                              onChange={(e) => setProductFilters(prev => ({ ...prev, brand: e.target.value }))}
                              className="text-sm"
                            >
                              <option value="">All Brands</option>
                              {filterOptions.brands.map((brand: any) => (
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
                              onChange={(e) => setProductFilters(prev => ({ ...prev, manufacturer: e.target.value }))}
                              className="text-sm"
                            >
                              <option value="">All Manufacturers</option>
                              {filterOptions.manufacturers.map((manufacturer: any) => (
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
                              onChange={(e) => setProductFilters(prev => ({ ...prev, color: e.target.value }))}
                              className="text-sm"
                            >
                              <option value="">All Colors</option>
                              {filterOptions.colors.map((color: any) => (
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
                              onChange={(e) => setProductFilters(prev => ({ ...prev, model: e.target.value }))}
                              className="text-sm"
                            >
                              <option value="">All Models</option>
                              {filterOptions.models.map((model: any) => (
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
                              onChange={(e) => setProductFilters(prev => ({ ...prev, packaging: e.target.value }))}
                              className="text-sm"
                            >
                              <option value="">All Packaging</option>
                              {filterOptions.packaging.map((packaging: any) => (
                                <option key={packaging.id} value={packaging.id}>
                                  {packaging.name}
                                </option>
                              ))}
                            </Select>
                          </div>

                          {/* Store Location Filter (Aisles/Shelves) */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Store Location (Aisle)</label>
                            <Select
                              value={productFilters.storeLocation}
                              onChange={(e) => setProductFilters(prev => ({ ...prev, storeLocation: e.target.value }))}
                              className="text-sm"
                            >
                              <option value="">All Locations</option>
                              {filterOptions.storeLocations.map((location: any) => (
                                <option key={location.id} value={location.id}>
                                  {location.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (productSearchTerm && watchedIssuingStoreId) {
                                  loadProducts(productSearchTerm, productFilters);
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Apply Filters
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductFilters({
                                category: '',
                                brand: '',
                                manufacturer: '',
                                color: '',
                                model: '',
                                packaging: '',
                                storeLocation: ''
                              })}
                              className="text-sm text-gray-600 hover:text-gray-800 underline"
                            >
                              Clear All Filters
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {Object.values(productFilters).filter(value => value !== '').length} filter(s) active
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsFiltersExpanded(false)}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              Close Filters
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Search Results */}
                    {productSearchTerm && watchedIssuingStoreId && (
                      <div className="mb-6">
                        {isLoadingProducts ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Searching products...</span>
                          </div>
                        ) : products.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No products found in {stores.find(s => s.id === watchedIssuingStoreId)?.name}</p>
                            <p className="text-sm">Try adjusting your search terms or check if the store has products</p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Search Results ({products.length} found) from {stores.find(s => s.id === watchedIssuingStoreId)?.name}
                            </h4>
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
                                        {product.average_cost && (
                                          <p className="text-xs font-medium text-blue-600">
                                            Avg Cost: {(() => {
                                              const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
                                              const currencySymbol = selectedCurrency?.symbol || '$';
                                              return `${currencySymbol}${(Number(product.average_cost) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                            })()}
                                          </p>
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

                    {/* Request Items Table */}
                    {fields.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No products added yet</h3>
                        <p className="text-gray-600 mb-4">Search and select products from the store to add them to your request</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-700">Request Items ({fields.length})</h4>
                          <button
                            type="button"
                            onClick={handleToggleMoreColumns}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            {showMoreColumns ? (
                              <>
                                <ChevronUp size={14} className="mr-1" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} className="mr-1" />
                                Show Details
                              </>
                            )}
                          </button>
                        </div>
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Product
                                </th>
                                {showMoreColumns && (
                                  <>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Part Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Brand
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Color
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Manufacturer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Model
                                    </th>
                                  </>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Requested Qty
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Current Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  <div className="flex flex-col">
                                    <span>Unit Cost</span>
                                    <span className="text-xs font-normal text-gray-400 normal-case">(defaults to avg cost)</span>
                                  </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Total Cost
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Exchange Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Equivalent Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Notes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {fields.map((field, index) => {
                                const item = watchedItems[index];
                                const product = getProductInfo(item?.product_id);
                                const totalCost = (parseFloat(item?.requested_quantity?.toString() || '0') * parseFloat(item?.unit_cost?.toString() || '0'));
                                
                                return (
                                  <tr key={field.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {product?.name || 'Unknown Product'}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {product?.code || 'N/A'}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    {showMoreColumns && (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900">
                                            {product?.part_number || 'N/A'}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900">
                                            {product?.brand?.name || 'N/A'}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900">
                                            {product?.color?.name || 'N/A'}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900">
                                            {product?.manufacturer?.name || 'N/A'}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900">
                                            {product?.category?.name || 'N/A'}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900">
                                            {product?.model?.name || 'N/A'}
                                          </div>
                                        </td>
                                      </>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Input
                                        {...register(`items.${index}.requested_quantity`)}
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        className="w-32"
                                        onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value))}
                                      />
                                      {errors.items?.[index]?.requested_quantity && (
                                        <p className="mt-1 text-xs text-red-600">{errors.items[index]?.requested_quantity?.message}</p>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {(requestingStoreStock[product?.id || ''] || 0).toLocaleString('en-US')}
                                      </div>
                                      {product?.unit && (
                                        <div className="text-xs text-gray-500">{product.unit.name}</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Input
                                        {...register(`items.${index}.unit_cost`)}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-32"
                                        onChange={(e) => handleUnitCostChange(index, parseFloat(e.target.value))}
                                      />
                                      {errors.items?.[index]?.unit_cost && (
                                        <p className="mt-1 text-xs text-red-600">{errors.items[index]?.unit_cost?.message}</p>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="text-sm font-medium text-gray-900">
                                        {(() => {
                                          const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
                                          const currencySymbol = selectedCurrency?.symbol || '$';
                                          return `${currencySymbol}${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                        })()}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
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
                                      <div className="text-xs text-gray-500">
                                        <Tooltip content={watchedCurrencyId === defaultCurrency?.id 
                                          ? 'Same as default' 
                                          : `${currencies.find(c => c.id === watchedCurrencyId)?.code || ''} to ${defaultCurrency?.code || ''}`
                                        }>
                                          <span className="cursor-help">
                                            {watchedCurrencyId === defaultCurrency?.id 
                                              ? 'Same as default' 
                                              : `${currencies.find(c => c.id === watchedCurrencyId)?.code || ''} to ${defaultCurrency?.code || ''}`
                                            }
                                          </span>
                                        </Tooltip>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="text-sm font-medium text-gray-900">
                                        {(() => {
                                          const rate = calculateExchangeRate();
                                          if (rate === null) return 'Loading...';
                                          const numericRate = Number(rate);
                                          if (isNaN(numericRate)) return 'N/A';
                                          const equivalentAmount = totalCost * numericRate;
                                          const defaultCurrencySymbol = defaultCurrency?.symbol || '$';
                                          return `${defaultCurrencySymbol}${equivalentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                        })()}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Input
                                        {...register(`items.${index}.notes`)}
                                        placeholder="Item notes..."
                                        className="w-48 text-sm"
                                      />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveProduct(index)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                      >
                                        <X size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No store selected</h3>
                    <p className="text-gray-600 mb-4">Please go back to Step 1 and select a "Requested From Store" to search for products</p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handlePrevStep}
                      className="flex items-center space-x-2"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Details</span>
                    </Button>
                  </div>
                )}

                {/* Step 2 Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePrevStep}
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Details</span>
                  </Button>
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    {/* Save as Draft button - only show when editing a draft request */}
                    {isEdit && storeRequest?.status === 'draft' && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading || fields.length === 0}
                        className="mr-3"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const isValid = await trigger();
                            if (isValid) {
                              const formData = getValues();
                              await handleFormSubmit(formData, 'draft');
                            } else {
                              }
                          } catch (error) {
                            }
                        }}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </div>
                        ) : (
                          <>
                            <Package className="h-4 w-4 mr-2" />
                            Save as Draft
                          </>
                        )}
                      </Button>
                    )}
                    
                    {/* Submit button - only show when editing a draft request */}
                    {isEdit && storeRequest?.status === 'draft' && (
                      <Button
                        type="button"
                        disabled={isLoading || fields.length === 0}
                        className="bg-green-600 hover:bg-green-700 mr-3"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            // First, validate and save the current form data
                            const isValid = await trigger();
                            if (isValid) {
                              const formData = getValues();
                              
                              // Save the form data first (this will update the request)
                              await handleFormSubmit(formData, 'draft');
                              
                              // Then submit for approval
                              if (storeRequest?.id && onSubmitForApproval) {
                                onSubmitForApproval(storeRequest.id);
                              }
                            } else {
                              }
                          } catch (error) {
                            }
                        }}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </div>
                        ) : (
                          'Submit Request'
                        )}
                      </Button>
                    )}
                    
                    <Button
                      type="submit"
                      disabled={isLoading || fields.length === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        }}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {isEdit ? 'Updating...' : 'Creating...'}
                        </div>
                      ) : (
                        isEdit ? 'Update Request' : 'Create Request'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
};

export default StoreRequestForm;