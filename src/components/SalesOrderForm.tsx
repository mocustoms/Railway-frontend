import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import {
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle,
  Plus,
  MoreHorizontal,
  Hash,
  Minus,
  Calendar
} from 'lucide-react';
import { SalesOrder, SalesOrderFormData, SalesOrderItemFormData, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import storeService from '../services/storeService';
import customerService from '../services/customerService';
import customerGroupService from '../services/customerGroupService';
import loyaltyCardService from '../services/loyaltyCardService';
import { productCatalogService } from '../services/productCatalogService';
import { currencyService } from '../services/currencyService';
import { getAllActiveExchangeRates } from '../services/exchangeRateService';
import { taxCodeService } from '../services/taxCodeService';
import { priceCategoryService } from '../services/priceCategoryService';
import { financialYearService } from '../services/financialYearService';
import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';
import SearchableDropdown from './SearchableDropdown';
import Modal from './Modal';
import CustomerForm from './CustomerForm';
import toast from 'react-hot-toast';
import serialBatchService from '../services/serialBatchService';

interface SalesOrderFormProps {
  salesOrder?: SalesOrder | null;
  onSubmit: (data: SalesOrderFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Step 1 validation schema (only basic fields)
const step1ValidationSchema = yup.object({
  salesOrderDate: yup.string().required('Sales order date is required'),
  storeId: yup.string().required('Store is required'),
  customerId: yup.string().required('Customer is required'),
  currencyId: yup.string().required('Currency is required'),
  exchangeRateValue: yup.number().optional(),
  priceCategoryId: yup.string().optional(),
  validUntil: yup.string().optional(),
  deliveryDate: yup.string().optional(),
  shippingAddress: yup.string().max(500, 'Shipping address must not exceed 500 characters'),
  notes: yup.string().max(500, 'Order description must not exceed 500 characters'),
  termsConditions: yup.string().max(1000, 'Terms & conditions must not exceed 1000 characters'),
  items: yup.array().optional() // Don't validate items in step 1
});

// Full validation schema (for final submission)
const fullValidationSchema = yup.object({
  salesOrderDate: yup.string().required('Sales order date is required'),
  storeId: yup.string().required('Store is required'),
  customerId: yup.string().required('Customer is required'),
  currencyId: yup.string().required('Currency is required'),
  exchangeRateValue: yup.number().optional(),
  priceCategoryId: yup.string().optional(),
  validUntil: yup.string().optional(),
  deliveryDate: yup.string().optional(),
  shippingAddress: yup.string().max(500, 'Shipping address must not exceed 500 characters'),
  notes: yup.string().max(500, 'Order description must not exceed 500 characters'),
  termsConditions: yup.string().max(1000, 'Terms & conditions must not exceed 1000 characters'),
  items: yup.array().of(
    yup.object({
      productId: yup.string().required('Product is required'),
      quantity: yup.number().min(0.001, 'Quantity must be greater than 0').required('Quantity is required'),
      unitPrice: yup.number().min(0, 'Unit price must be greater than or equal to 0').required('Unit price is required'),
      discountPercentage: yup.number()
        .min(0, 'Discount percentage must be greater than or equal to 0')
        .max(100, 'Discount percentage cannot exceed 100%')
        .typeError('Discount percentage must be a valid number'),
      discountAmount: yup.number().min(0, 'Discount amount must be greater than or equal to 0'),
      taxPercentage: yup.number().min(0, 'Tax percentage must be greater than or equal to 0').max(100, 'Tax percentage must be less than or equal to 100'),
      price_tax_inclusive: yup.boolean(),
      notes: yup.string().max(200, 'Item notes must not exceed 200 characters'),
      serialNumbers: yup.array().of(yup.string()).optional(),
      batchNumber: yup.string().optional(),
      expiryDate: yup.string().optional()
    })
  ).min(1, 'At least one item is required')
});

type FormData = yup.InferType<typeof fullValidationSchema> & {
  priceCategoryId?: string;
};

// Batch Number Dropdown Component
const BatchNumberDropdown: React.FC<{
  productId: string;
  storeId: string;
  value: string;
  onChange: (batchNumber: string, expiryDate?: string) => void;
  onClear: () => void;
}> = ({ productId, storeId, value, onChange, onClear }) => {
  const [batchNumbers, setBatchNumbers] = useState<Array<{ id: string; batch_number: string; expiry_date?: string | null; current_quantity?: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBatchNumbers = async () => {
      if (!productId || !storeId) {
        setBatchNumbers([]);
        return;
      }

      setIsLoading(true);
      try {
        const available = await serialBatchService.getAvailableBatchNumbers(productId, storeId);
        setBatchNumbers(available);
      } catch (error) {
        setBatchNumbers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatchNumbers();
  }, [productId, storeId]);

  // Prepare options for SearchableDropdown
  const batchOptions = useMemo(() => {
    return batchNumbers.map(bn => ({
      id: bn.id,
      value: bn.batch_number,
      label: `${bn.batch_number}${bn.expiry_date ? ` (Exp: ${bn.expiry_date})` : ''}${bn.current_quantity ? ` - Qty: ${bn.current_quantity}` : ''}`,
      code: bn.batch_number,
      name: bn.batch_number,
      type: bn.expiry_date ? `Exp: ${bn.expiry_date}` : undefined,
      expiry_date: bn.expiry_date
    }));
  }, [batchNumbers]);

  const handleBatchChange = (selectedValue: string) => {
    const selectedBatch = batchNumbers.find(bn => bn.batch_number === selectedValue);
    onChange(selectedValue, selectedBatch?.expiry_date || undefined);
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="flex-1 min-w-0">
        <SearchableDropdown
          options={batchOptions}
          value={value}
          onChange={handleBatchChange}
          placeholder={isLoading ? "Loading..." : batchOptions.length === 0 ? "No batches available" : "Select batch #"}
          searchPlaceholder="Search batch number..."
          disabled={isLoading || !productId || !storeId || batchOptions.length === 0}
          className="w-32 text-xs"
          maxHeight="200px"
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="text-red-500 hover:text-red-700 flex-shrink-0"
          title="Clear batch number"
        >
          <Minus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

// Serial Number Selector Component (for multiple selections)
const SerialNumberSelector: React.FC<{
  productId: string;
  storeId: string;
  value: string[];
  onChange: (serialNumbers: string[]) => void;
}> = ({ productId, storeId, value, onChange }) => {
  const [serialNumbers, setSerialNumbers] = useState<Array<{ id: string; serial_number: string; current_quantity?: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSerialNumbers = async () => {
      if (!productId || !storeId) {
        setSerialNumbers([]);
        return;
      }

      setIsLoading(true);
      try {
        const available = await serialBatchService.getAvailableSerialNumbers(productId, storeId);
        setSerialNumbers(available);
      } catch (error) {
        setSerialNumbers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSerialNumbers();
  }, [productId, storeId]);

  // Filter out already selected serial numbers
  const availableSerialNumbers = useMemo(() => {
    return serialNumbers.filter(sn => !value.includes(sn.serial_number));
  }, [serialNumbers, value]);

  // Prepare options for SearchableDropdown
  const serialOptions = useMemo(() => {
    return availableSerialNumbers.map(sn => ({
      id: sn.id,
      value: sn.serial_number,
      label: `${sn.serial_number}${sn.current_quantity ? ` (Qty: ${sn.current_quantity})` : ''}`,
      code: sn.serial_number,
      name: sn.serial_number
    }));
  }, [availableSerialNumbers]);

  const handleSerialSelect = (selectedValue: string) => {
    if (!value.includes(selectedValue)) {
      onChange([...value, selectedValue]);
    }
  };

  const handleRemoveSerial = (serialToRemove: string) => {
    onChange(value.filter(sn => sn !== serialToRemove));
  };

  return (
    <div className="flex flex-col space-y-2">
      {/* Selected serial numbers */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((serial, index) => (
            <div
              key={`${serial}-${index}`}
              className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
            >
              <span>{serial}</span>
              <button
                type="button"
                onClick={() => handleRemoveSerial(serial)}
                className="text-blue-600 hover:text-blue-800"
                title="Remove serial number"
              >
                <Minus className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown to add new serial numbers */}
      {availableSerialNumbers.length > 0 && (
        <div className="relative">
          <SearchableDropdown
            options={serialOptions}
            value=""
            onChange={handleSerialSelect}
            placeholder={isLoading ? "Loading..." : "Select serial #"}
            searchPlaceholder="Search serial number..."
            disabled={isLoading || !productId || !storeId || availableSerialNumbers.length === 0}
            className="w-32 text-xs"
            maxHeight="200px"
          />
        </div>
      )}

      {availableSerialNumbers.length === 0 && !isLoading && productId && storeId && (
        <div className="text-xs text-gray-500">No serial numbers available</div>
      )}
    </div>
  );
};

const SalesOrderForm: React.FC<SalesOrderFormProps> = ({
  salesOrder,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const formatMoney = useCallback((value: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0), []);
  const { stores: userStores } = useAuth();
  const [stores, setStores] = useState<Array<{ id: string; name: string; default_price_category_id?: string; defaultPriceCategory?: any }>>([]);
  const [customers, setCustomers] = useState<Array<{ 
    id: string; 
    full_name: string; 
    customer_id: string;
    address?: string;
    fax?: string;
    phone_number?: string;
    email?: string;
  }>>([]);
  const [formProducts, setFormProducts] = useState<Product[]>([]);
  const [addedProducts, setAddedProducts] = useState<Product[]>([]); // Track all products added to invoice
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('Pending');
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null);
  const [whtTaxCodes, setWhtTaxCodes] = useState<any[]>([]);
  const [salesTaxCodes, setSalesTaxCodes] = useState<any[]>([]);
  const [priceCategories, setPriceCategories] = useState<any[]>([]);
  const [financialYear, setFinancialYear] = useState<{ startDate: string; endDate: string } | null>(null);
  
  // Add Customer Modal state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [loyaltyCards, setLoyaltyCards] = useState<any[]>([]);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Product search and filtering states
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  
  // Track discount input mode for each item (true = percentage, false = value)
  const [discountInputMode, setDiscountInputMode] = useState<{[key: string]: boolean}>({});
  const [productFilters, setProductFilters] = useState({
    category: '',
    brand: '',
    manufacturer: '',
    color: '',
    model: '',
    packaging: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as any[],
    brands: [] as any[],
    manufacturers: [] as any[],
    colors: [] as any[],
    models: [] as any[],
    packagings: [] as any[]
  });

  // Track WHT tax code for each item
  const [whtTaxCodePerItem, setWhtTaxCodePerItem] = useState<{[key: string]: string}>({});
  // Track Sales Tax code for each item
  const [salesTaxCodePerItem, setSalesTaxCodePerItem] = useState<{[key: string]: string}>({});

  // Constants for localStorage key
  const SALES_ORDER_COLUMNS_VISIBILITY_KEY = 'easymauzo-sales-order-columns-visibility';

  // Default column visibility (WHT and Discount columns hidden by default)
  const defaultVisibleColumns = {
    product: true,
    quantity: true,
    unitPrice: true,
    discount: false, // Hidden by default
    amountAfterDiscount: false, // Hidden by default
    salesTax: true,
    vatAmount: true,
    amountAfterVAT: true,
    wht: false, // Hidden by default
    whtAmount: false, // Hidden by default
    amountAfterWHT: false, // Hidden by default
    currency: false, // Hidden by default
    exchangeRate: false, // Hidden by default
    equivalentAmount: false, // Hidden by default
    batch: false, // Hidden by default
    serial: false, // Hidden by default
    total: true,
    actions: true
  };

  // Column visibility state for items table - Initialize from localStorage or use defaults
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const savedState = localStorage.getItem(SALES_ORDER_COLUMNS_VISIBILITY_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Merge with defaults to ensure any new columns are included
        // Spread defaults first, then saved state, so new columns from defaults are included
        const merged = { ...defaultVisibleColumns, ...parsed };
        return merged;
      }
      return defaultVisibleColumns;
    } catch (error) {
      return defaultVisibleColumns;
    }
  });

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SALES_ORDER_COLUMNS_VISIBILITY_KEY, JSON.stringify(visibleColumns));
    } catch (error) {
      // Handle localStorage errors silently
    }
  }, [visibleColumns]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('sales-order-items-columns-dropdown');
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

  // Filter stores based on user access
  const filterStoresByUserAccess = useCallback((stores: Array<{ id: string; name: string }>) => {
    if (!userStores || userStores.length === 0) {
      return [];
    }
    return stores.filter(store => {
      return userStores.some(userStore => {
        return userStore.id === store.id;
      });
    });
  }, [userStores]);

  // Prepare customer options for SearchableDropdown
  const customerOptions = useMemo(() => {
    return customers.map(customer => ({
      id: customer.id,
      value: customer.id,
      label: `${customer.customer_id} - ${customer.full_name}${customer.phone_number ? ` (${customer.phone_number})` : ''}`,
      customer_id: customer.customer_id,
      full_name: customer.full_name,
      phone_number: customer.phone_number,
      email: customer.email,
      address: customer.address
    }));
  }, [customers]);

  const { control, register, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      salesOrderDate: new Date().toISOString().split('T')[0],
      storeId: '',
      customerId: '',
      currencyId: '',
      exchangeRateValue: 1,
      priceCategoryId: '',
      validUntil: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      shippingAddress: '',
      notes: '',
      termsConditions: '',
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Watch items for totals calculation
  const watchedItems = useWatch({
    control,
    name: 'items'
  });

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const [
        categoriesData,
        brandsData,
        manufacturersData,
        colorsData,
        modelsData,
        packagingData
      ] = await Promise.all([
        productCatalogService.getReferenceCategories(),
        productCatalogService.getReferenceBrands(),
        productCatalogService.getReferenceManufacturers(),
        productCatalogService.getReferenceColors(),
        productCatalogService.getReferenceModels(),
        productCatalogService.getReferencePackagings()
      ]);

      setFilterOptions({
        categories: categoriesData || [],
        brands: brandsData || [],
        manufacturers: manufacturersData || [],
        colors: colorsData || [],
        models: modelsData || [],
        packagings: packagingData || []
      });
    } catch (error) {
      // Error loading filter options - continue without them
    }
  }, []);

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Apply filters to products
  const applyFilters = useCallback((products: any[], filters: any) => {
    return products.filter((product: any) => {
      // Convert IDs to strings for comparison to handle both string and number IDs
      const compareId = (id1: any, id2: any) => String(id1) === String(id2);
      
      if (filters.category && product.category?.id && !compareId(product.category.id, filters.category)) return false;
      if (filters.brand && product.brand?.id && !compareId(product.brand.id, filters.brand)) return false;
      if (filters.manufacturer && product.manufacturer?.id && !compareId(product.manufacturer.id, filters.manufacturer)) return false;
      if (filters.color && product.color?.id && !compareId(product.color.id, filters.color)) return false;
      if (filters.model && product.model?.id && !compareId(product.model.id, filters.model)) return false;
      if (filters.packaging && product.unit?.id && !compareId(product.unit.id, filters.packaging)) return false;
      return true;
    });
  }, []);

  // Track store ID separately to avoid complex dependency
  const selectedStoreId = watch('storeId');

  // Load products when store is selected or search term changes
  useEffect(() => {
    const loadProductsForStore = async () => {
      if (!selectedStoreId) {
        setFormProducts([]);
        return;
      }

      try {
        // Trim the search term before sending to API
        const trimmedSearchTerm = productSearchTerm?.trim() || '';
        
          // Load products for the selected store with search term
        const products = await productCatalogService.getProductsByStore(selectedStoreId, trimmedSearchTerm, 1000);
          
          // Apply filters if any are set
          const hasFilters = Object.values(productFilters).some(value => value !== '');
          const filteredProducts = hasFilters ? applyFilters(products || [], productFilters) : products;
          
          setFormProducts(filteredProducts || []);
        } catch (error) {
        setFormProducts([]);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(() => {
      loadProductsForStore();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedStoreId, productSearchTerm, productFilters, applyFilters]);

  const watchedCurrencyId = watch('currencyId');

  // Track exchange rate ID and system default currency ID
  const [exchangeRateId, setExchangeRateId] = useState<string | null>(null);
  const [systemDefaultCurrencyId, setSystemDefaultCurrencyId] = useState<string | null>(null);

  // Auto-fill exchange rate when currency changes
  useEffect(() => {
    if (watchedCurrencyId && defaultCurrency && exchangeRates.length > 0) {
      // Set system default currency ID
      setSystemDefaultCurrencyId(defaultCurrency.id);
      
      // If selected currency is the same as default currency, rate is 1
      if (watchedCurrencyId === defaultCurrency.id) {
        setValue('exchangeRateValue', 1.0);
        setExchangeRateId(null); // No exchange rate record needed for same currency
      } else {
        // Find exchange rate from selected currency to default currency
        const rate = exchangeRates.find(rate => 
          rate.from_currency_id === watchedCurrencyId && 
          rate.to_currency_id === defaultCurrency.id
        );
        
        if (rate) {
          // Ensure the rate is parsed as a number
          const parsedRate = typeof rate.rate === 'string' ? parseFloat(rate.rate) : Number(rate.rate);
          if (Number.isFinite(parsedRate) && parsedRate > 0) {
            setValue('exchangeRateValue', parsedRate);
            setExchangeRateId(rate.id); // Set the exchange rate ID
          } else {
            setValue('exchangeRateValue', 1.0);
            setExchangeRateId(null);
          }
        } else {
          setValue('exchangeRateValue', 1.0);
          setExchangeRateId(null);
        }
      }
    }
  }, [watchedCurrencyId, defaultCurrency, exchangeRates, setValue]);

  // Auto-select price category when store is selected
  const watchedStoreId = watch('storeId');
  useEffect(() => {
    const autoSelectPriceCategory = async () => {
      if (watchedStoreId && isInitialDataLoaded && !salesOrder) {
        // Only auto-select for new invoices, not when editing
        try {
          // Get the selected store from the stores list
          const selectedStore = stores.find(store => store.id === watchedStoreId);
          
          if (selectedStore && selectedStore.default_price_category_id) {
            setValue('priceCategoryId', selectedStore.default_price_category_id);
          } else {
            // Clear price category if store doesn't have one
            setValue('priceCategoryId', '');
          }
        } catch (error) {
          // Error auto-selecting price category - silently handle
        }
      }
    };

    autoSelectPriceCategory();
  }, [watchedStoreId, stores, isInitialDataLoaded, salesOrder, setValue]);

  // Load current financial year
  const loadFinancialYear = async () => {
    try {
      const currentYear = await financialYearService.getCurrentFinancialYear();
      if (currentYear) {
        setFinancialYear({
          startDate: currentYear.startDate,
          endDate: currentYear.endDate
        });
      }
    } catch (error) {
      // Failed to load financial year
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load stores (only active stores)
        const storesData = await storeService.getStores({ limit: 1000, status: 'active' });
        const allStores = storesData.data || [];
        
        // Filter stores based on user access
        const filteredStores = filterStoresByUserAccess(allStores);
        setStores(filteredStores);

        // Load customers (only active customers)
        const customersData = await customerService.getCustomers({ limit: 2000, status: 'active' });
        setCustomers(customersData.data || []);

        // Products will be loaded when a store is selected

        // Load currencies
        const currenciesData = await currencyService.getCurrencies(1, 1000);
        setCurrencies(currenciesData.currencies || []);

        // Load exchange rates
        const exchangeRatesData = await getAllActiveExchangeRates();
        setExchangeRates(exchangeRatesData);

        // Set default currency
        if (currenciesData.currencies && currenciesData.currencies.length > 0) {
          const defaultCurr = currenciesData.currencies.find(c => c.is_default) || currenciesData.currencies[0];
          setDefaultCurrency(defaultCurr);
          setValue('currencyId', defaultCurr.id);
        }

        // Load customer groups and loyalty cards for Add Customer modal
        try {
          const groupsResp = await customerGroupService.getCustomerGroups(1, 1000, { search: '', status: 'active' } as any, { key: 'group_name', direction: 'asc' } as any);
          setCustomerGroups(groupsResp.data || []);
        } catch (error) {
          // Error loading customer groups - silently handle
        }
        
        try {
          const cardsResp = await loyaltyCardService.getLoyaltyCardConfigs({ page: 1, limit: 1000, status: 'active' });
          setLoyaltyCards(cardsResp.data || []);
        } catch (error) {
          // Error loading loyalty cards - silently handle
        }

        // Load WHT tax codes (filter where is_wht = true)
        try {
          const taxCodesResp = await taxCodeService.getTaxCodes(1, 1000);
          const whtCodes = taxCodesResp.taxCodes.filter(tc => tc.is_wht && tc.is_active);
          setWhtTaxCodes(whtCodes);
        } catch (error) {
          // Error loading WHT tax codes - silently handle
        }

        // Load Sales Tax codes (filter where is_wht = false or not set)
        try {
          const taxCodesResp = await taxCodeService.getTaxCodes(1, 1000);
          const salesCodes = taxCodesResp.taxCodes.filter(tc => !tc.is_wht && tc.is_active);
          setSalesTaxCodes(salesCodes);
        } catch (error) {
          // Error loading Sales Tax codes - silently handle
        }

        // Load price categories (only active)
        try {
          const priceCategoriesResp = await priceCategoryService.getPriceCategories();
          const activePriceCategories = (priceCategoriesResp.priceCategories || []).filter(
            (pc: any) => pc.is_active
          );
          setPriceCategories(activePriceCategories);
        } catch (error) {
          // Error loading price categories - silently handle
        }

        setIsInitialDataLoaded(true);
      } catch (error) {
        toast.error('Failed to load initial data');
      }
    };

    loadFinancialYear();
    loadInitialData();
  }, [setValue, filterStoresByUserAccess]);

  // Load sales order data for editing
  useEffect(() => {
    if (!salesOrder || !isInitialDataLoaded) {
      return;
    }

    const loadInvoiceData = async () => {
      try {
        setReferenceNumber(salesOrder.salesOrderRefNumber);

        // Set exchange rate ID and system default currency ID if available
        if ((salesOrder as any).exchangeRateId) {
          setExchangeRateId((salesOrder as any).exchangeRateId);
        }
        if ((salesOrder as any).systemDefaultCurrencyId) {
          setSystemDefaultCurrencyId((salesOrder as any).systemDefaultCurrencyId);
        }

        // Fetch product details for all items first
        if (salesOrder.items && salesOrder.items.length > 0) {
          const productIds = salesOrder.items.map(item => item.productId).filter(Boolean);
          
          if (productIds.length > 0) {
            try {
              const productPromises = productIds.map(async (productId: string) => {
                try {
                  const productData = await productCatalogService.getProduct(productId);
                  return productData;
                } catch (error) {
                  return null;
                }
              });
              
              const loadedProducts = await Promise.all(productPromises);
              const validProducts = loadedProducts.filter((p): p is Product => p !== null);
              
              // Add products to addedProducts state
              setAddedProducts(validProducts);
              
              // Also add products to formProducts so they can be searched/selected
              setFormProducts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newProducts = validProducts.filter(p => !existingIds.has(p.id));
                return [...prev, ...newProducts];
              });

              // Now reset the form with all data
              reset({
                salesOrderDate: salesOrder.salesOrderDate,
                storeId: salesOrder.storeId,
                customerId: salesOrder.customerId,
                currencyId: salesOrder.currencyId || '',
                exchangeRateValue: salesOrder.exchangeRateValue || 1,
                priceCategoryId: salesOrder.priceCategoryId || (salesOrder as any).priceCategory?.id || '',
                validUntil: salesOrder.validUntil || '',
                deliveryDate: salesOrder.deliveryDate || '',
                shippingAddress: salesOrder.shippingAddress || '',
                notes: salesOrder.notes || '',
                termsConditions: salesOrder.termsConditions || '',
                items: salesOrder.items.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discountPercentage: item.discountPercentage || 0,
                  discountAmount: (item as any).discountAmount || 0,
                  taxPercentage: item.taxPercentage || 0,
                  salesTaxId: (item as any).salesTaxId || (item as any).salesTaxCode?.id || null,
                  whtTaxId: (item as any).whtTaxId || (item as any).whtTaxCode?.id || null,
                  currencyId: (item as any).currencyId || salesOrder.currencyId || '',
                  exchangeRate: (item as any).exchangeRate || salesOrder.exchangeRateValue || 1.0,
                  equivalentAmount: (item as any).equivalentAmount || 0,
                  notes: item.notes || '',
                  price_tax_inclusive: (item as any).price_tax_inclusive || false,
                  serialNumbers: item.serialNumbers || [],
                  batchNumber: item.batchNumber || '',
                  expiryDate: item.expiryDate || ''
                }))
              });

            } catch (error) {
              // Error loading products, but still reset form
              reset({
                salesOrderDate: salesOrder.salesOrderDate,
                storeId: salesOrder.storeId,
                customerId: salesOrder.customerId,
                currencyId: salesOrder.currencyId || '',
                exchangeRateValue: salesOrder.exchangeRateValue || 1,
                priceCategoryId: salesOrder.priceCategoryId || (salesOrder as any).priceCategory?.id || '',
                validUntil: salesOrder.validUntil || '',
                deliveryDate: salesOrder.deliveryDate || '',
                shippingAddress: salesOrder.shippingAddress || '',
                notes: salesOrder.notes || '',
                termsConditions: salesOrder.termsConditions || '',
                items: salesOrder.items?.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discountPercentage: item.discountPercentage || 0,
                  discountAmount: (item as any).discountAmount || 0,
                  taxPercentage: item.taxPercentage || 0,
                  salesTaxId: (item as any).salesTaxId || (item as any).salesTaxCode?.id || null,
                  whtTaxId: (item as any).whtTaxId || (item as any).whtTaxCode?.id || null,
                  currencyId: (item as any).currencyId || salesOrder.currencyId || '',
                  exchangeRate: (item as any).exchangeRate || salesOrder.exchangeRateValue || 1.0,
                  equivalentAmount: (item as any).equivalentAmount || 0,
                  notes: item.notes || '',
                  price_tax_inclusive: (item as any).price_tax_inclusive || false,
                  serialNumbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
                  batchNumber: item.batchNumber ? String(item.batchNumber) : '',
                  expiryDate: item.expiryDate ? String(item.expiryDate) : ''
                })) || []
              });
            }
          } else {
            // No products, just reset form
            reset({
              salesOrderDate: salesOrder.salesOrderDate,
              storeId: salesOrder.storeId,
              customerId: salesOrder.customerId,
              currencyId: salesOrder.currencyId || '',
              exchangeRateValue: salesOrder.exchangeRateValue || 1,
              priceCategoryId: (salesOrder as any).priceCategoryId || (salesOrder as any).priceCategory?.id || '',
              validUntil: salesOrder.validUntil || '',
              notes: salesOrder.notes || '',
              termsConditions: salesOrder.termsConditions || '',
              items: []
            });
          }
        } else {
          // No items, just reset basic form
          reset({
            salesOrderDate: salesOrder.salesOrderDate,
            storeId: salesOrder.storeId,
            customerId: salesOrder.customerId,
            currencyId: salesOrder.currencyId || '',
            exchangeRateValue: salesOrder.exchangeRateValue || 1,
            priceCategoryId: (salesOrder as any).priceCategoryId || (salesOrder as any).priceCategory?.id || '',
            validUntil: salesOrder.validUntil || '',
            notes: salesOrder.notes || '',
            termsConditions: salesOrder.termsConditions || '',
            items: []
          });
        }
      } catch (error) {
        toast.error('Failed to load invoice data');
      }
    };

    loadInvoiceData();
  }, [salesOrder, isInitialDataLoaded, reset]);
  
  // Match tax percentages to sales tax codes for existing items and set tax codes for new items based on product
  useEffect(() => {
    if (fields.length > 0 && salesTaxCodes.length > 0 && salesOrder && salesOrder.items) {
      const salesTaxCodeMap: {[key: string]: string} = {};
      const whtTaxCodeMap: {[key: string]: string} = {};
      
      fields.forEach((field, index) => {
        const item = watch(`items.${index}`) as any;
        const originalItem = salesOrder?.items?.[index];
        
        // Handle sales tax code
        if (!salesTaxCodePerItem[field.id]) {
          // First try to get from saved item data (if editing existing invoice)
          if (originalItem && ((originalItem as any).salesTaxId || (originalItem as any).salesTaxCode?.id)) {
            salesTaxCodeMap[field.id] = (originalItem as any).salesTaxId || (originalItem as any).salesTaxCode?.id;
          } else if (item?.salesTaxId) {
            salesTaxCodeMap[field.id] = item.salesTaxId;
          } else if (item?.taxPercentage && item.taxPercentage > 0) {
            // Try to match by tax percentage (for existing items without saved tax code)
            const matchingTaxCode = salesTaxCodes.find(tc => {
              const tcRate = tc.rate ? (typeof tc.rate === 'number' ? tc.rate : parseFloat(tc.rate || '0')) : 0;
              return Math.abs(tcRate - item.taxPercentage) < 0.01; // Allow small floating point differences
            });
            if (matchingTaxCode) {
              salesTaxCodeMap[field.id] = matchingTaxCode.id;
            }
          } else if (field.productId && addedProducts.length > 0) {
            // If no match by rate, try to get from product's sales tax
            const product = addedProducts.find(p => p.id === field.productId);
            if (product) {
              const salesTaxId = product.sales_tax_id || product.salesTax?.id || null;
              if (salesTaxId) {
                salesTaxCodeMap[field.id] = salesTaxId;
              }
            }
          }
        }
        
        // Handle WHT tax code
        if (!whtTaxCodePerItem[field.id]) {
          // First try to get from saved item data (if editing existing invoice)
          if (originalItem && ((originalItem as any).whtTaxId || (originalItem as any).whtTaxCode?.id)) {
            whtTaxCodeMap[field.id] = (originalItem as any).whtTaxId || (originalItem as any).whtTaxCode?.id;
          } else if (item?.whtTaxId) {
            whtTaxCodeMap[field.id] = item.whtTaxId;
          }
        }
      });
      
      if (Object.keys(salesTaxCodeMap).length > 0) {
        setSalesTaxCodePerItem(prev => ({
          ...prev,
          ...salesTaxCodeMap
        }));
      }
      
      if (Object.keys(whtTaxCodeMap).length > 0) {
        setWhtTaxCodePerItem(prev => ({
          ...prev,
          ...whtTaxCodeMap
        }));
      }
    }
  }, [fields, salesTaxCodes, whtTaxCodes, addedProducts, salesTaxCodePerItem, whtTaxCodePerItem, salesOrder]);

  // Set default discount mode to Cash (amount) for new items
  useEffect(() => {
    fields.forEach(field => {
      // If discountInputMode is not set for this field, default to Cash (false = amount mode)
      if (discountInputMode[field.id] === undefined) {
        setDiscountInputMode(prev => ({ ...prev, [field.id]: false }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length]); // Only run when number of fields changes

  // Calculate line totals
  const calculateLineTotal = useCallback((item: SalesOrderItemFormData, useAmount: boolean = false) => {
    const subtotal = item.quantity * item.unitPrice;
    let discountAmount = 0;
    
    if (useAmount && item.discountAmount !== undefined && item.discountAmount > 0) {
      // Use absolute discount amount
      discountAmount = Math.min(item.discountAmount, subtotal); // Don't allow discount more than subtotal
    } else {
      // Use percentage - ensure it doesn't exceed 100%
      const discountPercent = Math.min(item.discountPercentage || 0, 100);
      discountAmount = subtotal * discountPercent / 100;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxPercentage || 0) / 100;
    return afterDiscount + taxAmount;
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalWHT = 0;

    const items = watchedItems || [];
    items.forEach((item, index) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      
      // Check which discount mode is being used for this item
      const field = fields[index];
      const useAmountMode = field && !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
      
      // Calculate discount based on selected mode
      let lineDiscount = 0;
      if (useAmountMode && item.discountAmount !== undefined && item.discountAmount > 0) {
        // Use absolute discount amount
        lineDiscount = Math.min(item.discountAmount, lineSubtotal);
      } else {
        // Use percentage - ensure it doesn't exceed 100%
        const discountPercent = Math.min(item.discountPercentage || 0, 100);
        lineDiscount = lineSubtotal * discountPercent / 100;
      }
      
      const lineAfterDiscount = lineSubtotal - lineDiscount;
      
      // Get sales tax rate from selected tax code
      const salesTaxCodeId = field ? salesTaxCodePerItem[field.id] : null;
      const salesTaxCode = salesTaxCodeId ? salesTaxCodes.find(tc => tc.id === salesTaxCodeId) : null;
      const taxPercent = salesTaxCode?.rate ? (typeof salesTaxCode.rate === 'number' ? salesTaxCode.rate : parseFloat(salesTaxCode.rate || '0')) : (item.taxPercentage || 0);
      
      // Check if this product has tax-inclusive pricing
      const product = addedProducts.find(p => p.id === item.productId);
      const isTaxInclusive = product?.price_tax_inclusive || (item as any).price_tax_inclusive || false;
      
      // Calculate amount after discount per unit
      let amountAfterDiscountPerUnit = item.unitPrice;
      if (useAmountMode && item.discountAmount !== undefined && item.discountAmount > 0) {
        const perUnitDiscount = lineDiscount / item.quantity;
        amountAfterDiscountPerUnit = Math.max(0, item.unitPrice - perUnitDiscount);
      } else {
        const discountPercent = Math.min(item.discountPercentage || 0, 100);
        amountAfterDiscountPerUnit = item.unitPrice * (1 - discountPercent / 100);
      }
      
      // Calculate VAT based on tax-inclusive or tax-exclusive pricing
      // Note: For tax-inclusive products, unitPrice is now stored as base price (exclusive)
      // So we always add VAT to the base price to get the tax-inclusive amount
      let vatAmountPerUnit = amountAfterDiscountPerUnit * taxPercent / 100;
      
      // For tax-inclusive products, we still track that it's tax-inclusive for display purposes
      // but calculations work the same since unitPrice is now base price
      const lineTax = vatAmountPerUnit * item.quantity;
      
      // Calculate WHT on amount after discount (line total)
      const whtTaxCodeId = field ? whtTaxCodePerItem[field.id] : null;
      const whtTaxCode = whtTaxCodeId ? whtTaxCodes.find(tc => tc.id === whtTaxCodeId) : null;
      const whtRate = whtTaxCode?.rate ? (typeof whtTaxCode.rate === 'number' ? whtTaxCode.rate : parseFloat(whtTaxCode.rate || '0')) : 0;
      const lineWHT = lineAfterDiscount * whtRate / 100;

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;
      totalTax += lineTax;
      totalWHT += lineWHT;
    });

    const amountAfterDiscount = subtotal - totalDiscount;
    const amountAfterWHT = amountAfterDiscount - totalWHT;
    
    // For tax-inclusive products, the amountAfterWHT already includes VAT, so we don't add totalTax back
    // For tax-exclusive products, we need to add totalTax to get the final total
    // Check if any items are tax-inclusive to determine the calculation
    const hasTaxInclusiveItems = items.some((item: any, index: number) => {
      const field = fields[index];
      if (!field) return false;
      const product = addedProducts.find(p => p.id === item.productId);
      const isTaxInclusive = product?.price_tax_inclusive || (item as any).price_tax_inclusive || false;
      return isTaxInclusive;
    });
    
    // If all items are tax-inclusive, total is just amountAfterWHT (already includes VAT)
    // If all items are tax-exclusive, total is amountAfterWHT + totalTax
    // If mixed, we need to handle it differently - for now, use the existing logic
    // Actually, we should calculate total per item and sum them
    let calculatedTotal = 0;
    items.forEach((item: any, index: number) => {
      const field = fields[index];
      if (!field) return;
      
      const lineSubtotal = item.quantity * item.unitPrice;
      const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
      
      let lineDiscount = 0;
      if (useAmountMode && item.discountAmount !== undefined && item.discountAmount > 0) {
        lineDiscount = Math.min(item.discountAmount, lineSubtotal);
      } else {
        const discountPercent = Math.min(item.discountPercentage || 0, 100);
        lineDiscount = lineSubtotal * discountPercent / 100;
      }
      
      const lineAfterDiscount = lineSubtotal - lineDiscount;
      
      // Get sales tax rate
      const salesTaxCodeId = salesTaxCodePerItem[field.id];
      const salesTaxCode = salesTaxCodeId ? salesTaxCodes.find(tc => tc.id === salesTaxCodeId) : null;
      const taxPercent = salesTaxCode?.rate ? (typeof salesTaxCode.rate === 'number' ? salesTaxCode.rate : parseFloat(salesTaxCode.rate || '0')) : (item.taxPercentage || 0);
      
      // Check if tax-inclusive
      const product = addedProducts.find(p => p.id === item.productId);
      const isTaxInclusive = product?.price_tax_inclusive || (item as any).price_tax_inclusive || false;
      
      // Calculate per-unit amounts
      let amountAfterDiscountPerUnit = item.unitPrice;
      if (useAmountMode && item.discountAmount !== undefined && item.discountAmount > 0) {
        const perUnitDiscount = lineDiscount / item.quantity;
        amountAfterDiscountPerUnit = Math.max(0, item.unitPrice - perUnitDiscount);
      } else {
        const discountPercent = Math.min(item.discountPercentage || 0, 100);
        amountAfterDiscountPerUnit = item.unitPrice * (1 - discountPercent / 100);
      }
      
      // Calculate VAT: unitPrice is now always base price (exclusive)
      const vatAmountPerUnit = amountAfterDiscountPerUnit * taxPercent / 100;
      const lineTax = vatAmountPerUnit * item.quantity;
      
      // Calculate WHT
      const whtTaxCodeId = whtTaxCodePerItem[field.id];
      const whtTaxCode = whtTaxCodeId ? whtTaxCodes.find(tc => tc.id === whtTaxCodeId) : null;
      const whtRate = whtTaxCode?.rate ? (typeof whtTaxCode.rate === 'number' ? whtTaxCode.rate : parseFloat(whtTaxCode.rate || '0')) : 0;
      const lineWHT = lineAfterDiscount * whtRate / 100;
      const lineAfterWHT = lineAfterDiscount - lineWHT;
      
      // Total = Amount After WHT + VAT Amount (for both tax-inclusive and tax-exclusive)
      calculatedTotal += lineAfterWHT + lineTax;
    });
    
    // Total = Amount After WHT + Total Tax (for both tax-inclusive and tax-exclusive, since unitPrice is now base price)
    const total = calculatedTotal > 0 ? calculatedTotal : (amountAfterWHT + totalTax);
    
    // Calculate effective VAT percentage
    const effectiveVATPercent = amountAfterDiscount > 0 
      ? (totalTax / amountAfterDiscount) * 100 
      : 0;

    return {
      subtotal,
      totalDiscount,
      totalTax,
      totalWHT,
      amountAfterDiscount,
      amountAfterWHT,
      total,
      effectiveVATPercent
    };
  }, [watchedItems, discountInputMode, fields, whtTaxCodePerItem, whtTaxCodes, salesTaxCodePerItem, salesTaxCodes, addedProducts]);

  // Filter products based on search and filters
  const getFilteredProducts = () => {
    // Products are already filtered by the API search and client-side filters
    // Just return the formProducts as they are already filtered
    return formProducts;
  };

  // Handle product search
  const handleProductSearch = (value: string) => {
    setProductSearchTerm(value);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setProductFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setProductFilters({
      category: '',
      brand: '',
      manufacturer: '',
      color: '',
      model: '',
      packaging: ''
    });
  };

  // Add product to items
  const handleAddProduct = (product: any) => {
    // Get sales tax code ID from product's salesTax configuration
    const salesTaxId = product.sales_tax_id || product.salesTax?.id || null;
    const taxPercentage = product.salesTax?.rate || 0;
    
    // Calculate price based on selected price category
    const selectedPriceCategoryId = watch('priceCategoryId');
    // Default to selling_price when no price category is selected, fallback to average_cost
    let unitPrice = product.selling_price || product.average_cost || 0;
    
    // Handle both camelCase and snake_case data structures from backend
    const priceCategories = product.ProductPriceCategories || product.priceCategories || [];
    
    // If a price category is selected, try to find the calculated price
    if (selectedPriceCategoryId && priceCategories.length > 0) {
      // Normalize the selected price category ID to string for comparison
      const normalizedSelectedId = String(selectedPriceCategoryId).trim();
      
      // Find the price for this product in the selected price category
      const priceCategoryPrice = priceCategories.find(
        (pc: any) => {
          // Handle both camelCase and snake_case
          const pcId = String(pc.price_category_id || pc.priceCategoryId || '').trim();
          return pcId === normalizedSelectedId;
        }
      );
      
      // Use calculated price if found, otherwise keep selling_price (or average_cost fallback)
      // Note: calculated_price from price category is based on selling_price, so if product is tax-inclusive,
      // the calculated_price will also be tax-inclusive
      if (priceCategoryPrice && priceCategoryPrice.calculated_price != null) {
        unitPrice = parseFloat(priceCategoryPrice.calculated_price) || unitPrice;
      }
    }
    
    // If product is tax-inclusive, convert the tax-inclusive price to base price (exclusive)
    // This applies to both regular selling_price and price category calculated_price
    // The unit price field should show the base price, not the tax-inclusive price
    const isTaxInclusive = product.price_tax_inclusive || false;
    if (isTaxInclusive && taxPercentage > 0) {
      // Convert tax-inclusive price to base price: Base = Inclusive / (1 + Tax%)
      // This works for both selling_price and price category calculated_price
      unitPrice = unitPrice / (1 + taxPercentage / 100);
    }
    
    // Add product to addedProducts if not already added
    setAddedProducts(prev => {
      if (prev.find(p => p.id === product.id)) {
        return prev; // Already in the list
      }
      return [...prev, product];
    });
    
    append({
      productId: product.id,
      quantity: 1,
      unitPrice: unitPrice, // This is now the base price (exclusive) even if product is tax-inclusive
      discountPercentage: 0,
      discountAmount: 0,
      taxPercentage: taxPercentage, // Keep for backward compatibility, will be overridden by selected tax code
      notes: '',
      price_tax_inclusive: product.price_tax_inclusive || false, // Store tax-inclusive flag
      serialNumbers: [],
      batchNumber: '',
      expiryDate: ''
    });
  };

  const handleFormSubmit = async (data: FormData) => {
    try {
      const transformedData: SalesOrderFormData = {
        salesOrderRefNumber: referenceNumber,
        salesOrderDate: data.salesOrderDate,
        storeId: data.storeId,
        customerId: data.customerId,
        currencyId: data.currencyId,
        exchangeRateValue: data.exchangeRateValue,
        exchangeRateId: exchangeRateId || undefined,
        systemDefaultCurrencyId: systemDefaultCurrencyId || undefined,
        priceCategoryId: (data as any).priceCategoryId,
        validUntil: data.validUntil,
        notes: data.notes,
        termsConditions: data.termsConditions,
        items: (data.items || []).map((item, index) => {
          const lineSubtotal = item.quantity * item.unitPrice;
          const field = watch(`items.${index}`) as any;
          // Get the field ID from the fields array (useFieldArray)
          const fieldId = fields[index]?.id;
          const useAmountMode = !discountInputMode[fieldId];
          
          let finalDiscountAmount = 0;
          if (useAmountMode && item.discountAmount) {
            finalDiscountAmount = Math.min(item.discountAmount, lineSubtotal);
          } else {
            // Ensure discount percentage doesn't exceed 100%
            const discountPercent = Math.min(item.discountPercentage || 0, 100);
            finalDiscountAmount = (lineSubtotal * discountPercent) / 100;
          }
          
          const afterDiscount = lineSubtotal - finalDiscountAmount;
          
          // Get tax-inclusive flag from product or item data
          const product = addedProducts.find(p => p.id === item.productId);
          const isTaxInclusive = product?.price_tax_inclusive || field?.price_tax_inclusive || false;
          
          // Get sales tax code ID and rate using fieldId
          const salesTaxCodeId = fieldId ? salesTaxCodePerItem[fieldId] : null;
          const salesTaxCode = salesTaxCodeId ? salesTaxCodes.find(tc => tc.id === salesTaxCodeId) : null;
          const taxPercent = salesTaxCode?.rate ? (typeof salesTaxCode.rate === 'number' ? salesTaxCode.rate : parseFloat(salesTaxCode.rate || '0')) : (item.taxPercentage || 0);
          
          // Get WHT tax code ID and calculate WHT amount using fieldId
          const whtTaxCodeId = fieldId ? whtTaxCodePerItem[fieldId] : null;
          const whtTaxCode = whtTaxCodeId ? whtTaxCodes.find(tc => tc.id === whtTaxCodeId) : null;
          const whtRate = whtTaxCode?.rate ? (typeof whtTaxCode.rate === 'number' ? whtTaxCode.rate : parseFloat(whtTaxCode.rate || '0')) : 0;
          const whtAmount = afterDiscount * whtRate / 100;
          
          // Calculate tax amount: unitPrice is now always base price (exclusive)
          // So we always add VAT to the base amount
          const taxAmount = (afterDiscount * taxPercent) / 100;
          
          const lineTotal = afterDiscount + taxAmount;
          
          // Get currency and exchange rate for this item (use invoice-level currency as default)
          const itemCurrencyId = data.currencyId || null;
          const itemExchangeRate = data.exchangeRateValue || 1.0;
          // Calculate equivalent amount: lineTotal * exchangeRate
          const itemEquivalentAmount = lineTotal * itemExchangeRate;
          
          const itemData = {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercentage: useAmountMode ? 0 : item.discountPercentage,
            discountAmount: finalDiscountAmount,
            taxPercentage: taxPercent,
            taxAmount: taxAmount,
            salesTaxId: salesTaxCodeId || null,
            whtTaxId: whtTaxCodeId || null,
            whtAmount: whtAmount,
            currencyId: itemCurrencyId,
            exchangeRate: itemExchangeRate,
            equivalentAmount: itemEquivalentAmount,
            lineTotal: lineTotal, // unitPrice is now base price, so we always add tax to get total
            price_tax_inclusive: isTaxInclusive,
            notes: item.notes,
            serialNumbers: Array.isArray(item.serialNumbers) 
              ? item.serialNumbers.filter((s): s is string => typeof s === 'string' && s.trim() !== '')
              : [],
            batchNumber: (item.batchNumber && String(item.batchNumber).trim()) || '',
            expiryDate: (item.expiryDate && String(item.expiryDate).trim()) || ''
          };
          
          return itemData;
        })
      };
      
      await onSubmit(transformedData);
    } catch (error) {
      // Error submitting form - handled by onSubmit
    }
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

  const handleStepSubmit = async (data: FormData) => {
    if (currentStep === 1) {
      // Manual validation for step 1
      const step1Data = {
        salesOrderDate: data.salesOrderDate,
        storeId: data.storeId,
        customerId: data.customerId,
        currencyId: data.currencyId,
        exchangeRateValue: data.exchangeRateValue,
        validUntil: data.validUntil,
        notes: data.notes,
        termsConditions: data.termsConditions
      };
      
      try {
        await step1ValidationSchema.validate(step1Data, { abortEarly: false });
        handleNextStep();
      } catch (error: any) {
        if (error.inner) {
          const errorMessages = error.inner.map((err: any) => err.message);
          toast.error(errorMessages.join(', '));
        } else {
          toast.error('Please fill in all required fields');
        }
      }
    } else {
      // Use full validation for step 2
      try {
        await fullValidationSchema.validate(data, { abortEarly: false });
        await handleFormSubmit(data);
      } catch (error: any) {
        if (error.inner) {
          const errorMessages = error.inner.map((err: any) => err.message);
          toast.error(errorMessages.join(', '));
        } else {
          toast.error('Please complete all required fields');
        }
      }
    }
  };



  const getSelectedCustomer = () => {
    const customerId = watch('customerId');
    return customers.find(c => c.id === customerId);
  };

  const selectedCustomer = getSelectedCustomer();

  // Handle create new customer
  const handleCreateCustomer = async (data: any) => {
    try {
      setIsCreatingCustomer(true);
      const newCustomer = await customerService.createCustomer(data);
      
      // Refresh customers list
      const customersData = await customerService.getCustomers({ limit: 2000, status: 'active' });
      setCustomers(customersData.data || []);
      
      // Auto-select the newly created customer
      setValue('customerId', newCustomer.id);
      
      // Close modal
      setShowAddCustomerModal(false);
      
      toast.success('Customer created successfully and selected');
    } catch (error) {
      toast.error('Failed to create customer');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Progress Indicator */}
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
                Sales Order Details
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
                Sales Order Items Details
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
        <h2 className="text-xl font-semibold text-gray-900">
              {currentStep === 1 
                ? (salesOrder ? 'Edit Sales Order' : 'Create Sales Order') 
                : 'Add Sales Order Items'}
        </h2>
        <div className="text-sm text-gray-500">
          Reference: {referenceNumber}
        </div>
      </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = watch();
            handleStepSubmit(formData);
          }} className="space-y-6">
            {/* Step 1: Sales Order Details */}
            {currentStep === 1 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Sales Order Details</h3>
                  </div>
                </div>

        {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sales Order Date *</label>
            <Controller
              name="salesOrderDate"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  min={financialYear?.startDate}
                  max={financialYear?.endDate}
                  error={errors.salesOrderDate?.message}
                  title={financialYear ? `Date must be between ${financialYear.startDate} and ${financialYear.endDate}` : undefined}
                />
              )}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Store *</label>
            <Controller
              name="storeId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  error={errors.storeId?.message}
                >
                  <option value="">Select store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Customer *</label>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Customer
              </button>
            </div>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                        <SearchableDropdown
                          options={customerOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search and select customer..."
                          searchPlaceholder="Search by name, ID, phone, or email..."
                          disabled={isSubmitting}
                          className={errors.customerId?.message ? 'border-red-500' : ''}
                        />
              )}
            />
            {errors.customerId && (
              <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
            )}
          </div>

          <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
            <Controller
              name="currencyId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  error={errors.currencyId?.message}
                >
                  <option value="">Select currency</option>
                  {currencies.map(currency => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Category</label>
            <Controller
              name="priceCategoryId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  error={errors.priceCategoryId?.message}
                >
                  <option value="">Select price category (optional)</option>
                  {priceCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.price_change_type === 'increase' ? '+' : '-'}{category.percentage_change}%)
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Rate</label>
            <Controller
              name="exchangeRateValue"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="1.000000"
                  error={errors.exchangeRateValue?.message}
                />
              )}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
            <Controller
              name="validUntil"
              control={control}
              render={({ field }) => {
                // Calculate minimum date (today)
                const today = new Date();
                const minDate = today.toISOString().split('T')[0];
                
                return (
                <Input
                  {...field}
                  type="date"
                    min={minDate}
                  error={errors.validUntil?.message}
                />
                );
              }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
            <Controller
              name="deliveryDate"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="date"
                  error={errors.deliveryDate?.message}
                />
              )}
            />
          </div>

          <div className="mb-4 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
            <Controller
              name="shippingAddress"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="Enter shipping address (optional)"
                  error={errors.shippingAddress?.message}
                />
              )}
            />
          </div>
        </div>

                {/* Customer Information Display */}
        {selectedCustomer && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-600">Customer ID:</label>
                        <p className="text-gray-900">{selectedCustomer?.customer_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Name:</label>
                        <p className="text-gray-900">{selectedCustomer?.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Address:</label>
                        <p className="text-gray-900">{selectedCustomer?.address || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone:</label>
                        <p className="text-gray-900">{selectedCustomer?.phone_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email:</label>
                        <p className="text-gray-900">{selectedCustomer?.email || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}
              </div>
            )}

            {/* Step 2: Sales Order Items Details */}
            {currentStep === 2 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Sales Order Items Details</h3>
                    {watch('storeId') && (
                      <span className="text-sm text-gray-500">
                        for {stores.find(s => s.id === watch('storeId'))?.name || 'Selected Store'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, code, barcode, part number, brand, manufacturer, model, color, category, or packaging..."
                      value={productSearchTerm}
                      onChange={(e) => handleProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!watch('storeId')}
                    />
                  </div>
                  {!watch('storeId') && (
                    <p className="mt-2 text-sm text-red-600">Please select a store in Step 1 to search products</p>
                  )}
                </div>

                {/* Product Filters */}
                {watch('storeId') && (
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
                          <select
                            value={productFilters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            disabled={false}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">All Categories</option>
                            {filterOptions.categories.map((category: any) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Brand Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                          <select
                            value={productFilters.brand}
                            onChange={(e) => handleFilterChange('brand', e.target.value)}
                            disabled={false}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">All Brands</option>
                            {filterOptions.brands.map((brand: any) => (
                              <option key={brand.id} value={brand.id}>
                                {brand.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Manufacturer Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Manufacturer</label>
                          <select
                            value={productFilters.manufacturer}
                            onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                            disabled={false}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">All Manufacturers</option>
                            {filterOptions.manufacturers.map((manufacturer: any) => (
                              <option key={manufacturer.id} value={manufacturer.id}>
                                {manufacturer.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Color Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                          <select
                            value={productFilters.color}
                            onChange={(e) => handleFilterChange('color', e.target.value)}
                            disabled={false}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">All Colors</option>
                            {filterOptions.colors.map((color: any) => (
                              <option key={color.id} value={color.id}>
                                {color.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Model Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                          <select
                            value={productFilters.model}
                            onChange={(e) => handleFilterChange('model', e.target.value)}
                            disabled={false}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">All Models</option>
                            {filterOptions.models.map((model: any) => (
                              <option key={model.id} value={model.id}>
                                {model.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Packaging Filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Packaging</label>
                          <select
                            value={productFilters.packaging}
                            onChange={(e) => handleFilterChange('packaging', e.target.value)}
                            disabled={false}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">All Packaging</option>
                            {filterOptions.packagings.map((packaging: any) => (
                              <option key={packaging.id} value={packaging.id}>
                                {packaging.name}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* Products Grid - Only show when search term is not empty */}
                {watch('storeId') && productSearchTerm?.trim() && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Available Products</h4>
                    {getFilteredProducts().length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {getFilteredProducts().map((product) => {
                        const isAlreadyAdded = fields.some(field => field.productId === product.id);
                        
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
                                  Stock: {product.currentQuantity || product.store_balance || 0}
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
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No products found</p>
                        <p className="text-sm">
                          {productSearchTerm?.trim() 
                            ? 'Try adjusting your search or filters' 
                            : 'Start typing to search for products'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Items Table */}
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No products added yet</p>
                    <p className="text-sm">
                      {watch('storeId') 
                        ? 'Search for products above to add them to the sales order'
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
                            const dropdown = document.getElementById('sales-order-items-columns-dropdown');
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
                          id="sales-order-items-columns-dropdown"
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
                                  if (key === 'product' || key === 'quantity' || key === 'unitPrice' || key === 'total' || key === 'actions') {
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
                                key !== 'product' && key !== 'quantity' && key !== 'unitPrice' && key !== 'total' && key !== 'actions'
                              ).every(([, v]) => v) ? 'Hide All Optional' : 'Show All'}
                            </button>
                            
                            {/* Scrollable Column List */}
                            <div className="max-h-64 overflow-y-auto">
                              {Object.entries(visibleColumns).map(([key, visible]) => {
                                const isRequired = key === 'product' || key === 'quantity' || key === 'unitPrice' || key === 'total' || key === 'actions';
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
                                      {key === 'batch' ? 'Batch Number' : 
                                       key === 'serial' ? 'Serial Numbers' :
                                       key.replace(/([A-Z])/g, ' $1').trim()}
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
                          {visibleColumns.quantity && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Quantity
                          </th>
                          )}
                          {visibleColumns.unitPrice && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Unit Price
                          </th>
                          )}
                          {visibleColumns.discount && (
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                            Discount
                          </th>
                          )}
                          {visibleColumns.amountAfterDiscount && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                            Amount After Discount
                          </th>
                          )}
                          {visibleColumns.salesTax && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Sales Tax %
                          </th>
                          )}
                          {visibleColumns.vatAmount && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                              VAT Amount
                            </th>
                          )}
                          {visibleColumns.amountAfterVAT && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                              Amount After VAT
                            </th>
                          )}
                          {visibleColumns.wht && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                            Withholding Tax
                          </th>
                          )}
                          {visibleColumns.whtAmount && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                            WHT Amount
                          </th>
                          )}
                          {visibleColumns.amountAfterWHT && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                            Amount After WHT
                          </th>
                          )}
                          {visibleColumns.total && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                              Total
                          </th>
                          )}
                          {visibleColumns.currency && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Currency
                            </th>
                          )}
                          {visibleColumns.exchangeRate && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                              Exchange Rate
                            </th>
                          )}
                          {visibleColumns.equivalentAmount && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                              Equivalent Amount
                            </th>
                          )}
                          {visibleColumns.batch && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                              Batch Number
                            </th>
                          )}
                          {visibleColumns.serial && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                              Serial Numbers
                            </th>
                          )}
                          {visibleColumns.actions && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Actions
                          </th>
                          )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                        {fields.map((field, index) => {
                          const product = addedProducts.find(p => p.id === field.productId);
                          return (
                  <tr key={field.id}>
                              {visibleColumns.product && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {product?.name || 'Unknown Product'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {product?.code || 'N/A'}
                                  </div>
                                </div>
                    </td>
                              )}
                              {visibleColumns.quantity && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                <input
                            type="number"
                            step="any"
                            min="0.001"
                                  {...register(`items.${index}.quantity`, {
                                    onChange: (e) => {
                                      const newQuantity = Math.max(parseFloat(e.target.value) || 1, 1);
                                      const currentUnitPrice = Number(watch(`items.${index}.unitPrice`)) || 0;
                                      const currentDiscountAmount = Number(watch(`items.${index}.discountAmount`)) || 0;
                                      const maxDiscount = currentUnitPrice * newQuantity;
                                      
                                      // Check if discount is in cash/amount mode and exceeds new total
                                      const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
                                      if (useAmountMode && currentDiscountAmount > maxDiscount) {
                                        setValue(`items.${index}.discountAmount`, Math.max(0, maxDiscount));
                                        toast.error('Discount amount adjusted to match the new quantity');
                                      }
                                    }
                                  })}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                                {errors.items?.[index]?.quantity && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors.items[index]?.quantity?.message}
                                  </p>
                        )}
                    </td>
                              )}
                              {visibleColumns.unitPrice && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                <input
                            type="number"
                            step="any"
                            min="0"
                                  {...register(`items.${index}.unitPrice`, {
                                    onChange: (e) => {
                                      const newUnitPrice = Math.max(parseFloat(e.target.value) || 0, 0);
                                      const currentQuantity = Math.max(Number(watch(`items.${index}.quantity`)) || 1, 1);
                                      const currentDiscountAmount = Number(watch(`items.${index}.discountAmount`)) || 0;
                                      const maxDiscount = newUnitPrice * currentQuantity;
                                      
                                      // Check if discount is in cash/amount mode and exceeds new total
                                      const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
                                      if (useAmountMode && currentDiscountAmount > maxDiscount) {
                                        setValue(`items.${index}.discountAmount`, Math.max(0, maxDiscount));
                                        toast.error('Discount amount adjusted to match the new unit price');
                                      }
                                    }
                                  })}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                                {errors.items?.[index]?.unitPrice && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors.items[index]?.unitPrice?.message}
                                  </p>
                        )}
                    </td>
                              )}
                              {visibleColumns.discount && (
                                  <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {/* Toggle between Cash ($) and Percentage (%) - Vertical on left side */}
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className={`text-[10px] font-medium ${discountInputMode[field.id] !== true ? 'text-blue-600' : 'text-gray-400'}`}>
                                      $
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentMode = discountInputMode[field.id] === true;
                                        setDiscountInputMode(prev => ({ ...prev, [field.id]: !currentMode }));
                                      }}
                                      className={`relative inline-flex w-5 h-9 flex-col items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                        discountInputMode[field.id] === true ? 'bg-blue-600' : 'bg-gray-300'
                                      }`}
                                      role="switch"
                                      aria-checked={discountInputMode[field.id] === true}
                                    >
                                      <span
                                        className={`inline-block w-3 h-3 transform rounded-full bg-white transition-transform mt-0.5 ${
                                          discountInputMode[field.id] === true ? 'translate-y-4' : 'translate-y-0.5'
                                        }`}
                                      />
                                    </button>
                                    <span className={`text-[10px] font-medium ${discountInputMode[field.id] === true ? 'text-blue-600' : 'text-gray-400'}`}>
                                      %
                                    </span>
                                  </div>
                                  {/* Input box - On the right */}
                                  <div className="flex-1">
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      max="100"
                                      {...register(`items.${index}.discountPercentage`, { 
                                        validate: (val) => {
                                          if (discountInputMode[field.id] === false && !watch(`items.${index}.discountAmount`)) {
                                            return true; // Allow empty if using amount
                                          }
                                          if (val !== undefined && val > 100) {
                                            return 'Discount percentage cannot exceed 100%';
                                          }
                                          return val === undefined || (val >= 0 && val <= 100);
                                        },
                                        onChange: (e) => {
                                          const value = parseFloat(e.target.value);
                                          if (!isNaN(value) && value > 100) {
                                            setValue(`items.${index}.discountPercentage`, 100);
                                            toast.error('Discount percentage cannot exceed 100%');
                                          }
                                        }
                                      })}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      disabled={!discountInputMode[field.id] && discountInputMode[field.id] !== undefined}
                                      hidden={discountInputMode[field.id] === false}
                                      placeholder="0"
                                    />
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      {...register(`items.${index}.discountAmount`, {
                                        validate: (val: unknown) => {
                                          // Use watch() to get latest values
                                          const currentField = watch(`items.${index}`) as any;
                                          const quantity = Math.max(Number(currentField?.quantity) || 1, 1);
                                          const unitPrice = Number(currentField?.unitPrice) || 0;
                                          const maxDiscount = unitPrice * quantity;
                                          const raw = String(val ?? '');
                                          if (raw.trim() === '') return true;
                                          const numVal = Number(val);
                                          if (isNaN(numVal) || numVal < 0) return 'Invalid discount';
                                          return numVal <= maxDiscount || `Discount cannot exceed ${maxDiscount.toFixed(2)}`;
                                        },
                                        onChange: (e) => {
                                          // Use watch() to get latest values
                                          const currentField = watch(`items.${index}`) as any;
                                          const quantity = Math.max(Number(currentField?.quantity) || 1, 1);
                                          const unitPrice = Number(currentField?.unitPrice) || 0;
                                          const maxDiscount = unitPrice * quantity;
                                          const value = parseFloat(e.target.value);
                                          if (!isNaN(value) && value > maxDiscount) {
                                            setValue(`items.${index}.discountAmount`, maxDiscount);
                                            toast.error('Discount amount cannot exceed the unit amount total');
                                          }
                                        }
                                      })}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      disabled={discountInputMode[field.id] === true}
                                      hidden={discountInputMode[field.id] === true}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                {errors.items?.[index]?.discountPercentage && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors.items[index]?.discountPercentage?.message}
                                  </p>
                                )}
                    </td>
                              )}
                              {visibleColumns.amountAfterDiscount && (
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(() => {
                                  const field2 = watch(`items.${index}`) as any;
                                  const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
                                  
                                  // Amount After Discount should be based on Unit Price - Discount (per unit)
                                  // Use watch() values for real-time updates
                                  const unitPrice = Number(field2?.unitPrice) || 0;
                                  const quantity = Math.max(Number(field2?.quantity) || 1, 1);
                                  
                                  let amountAfterDiscountPerUnit = unitPrice;
                                  if (useAmountMode) {
                                    const totalDiscountAmount = Number(field2?.discountAmount) || 0;
                                    const perUnitDiscount = totalDiscountAmount / quantity;
                                    amountAfterDiscountPerUnit = Math.max(0, unitPrice - perUnitDiscount);
                                  } else {
                                    const discountPercent = Math.min(Number(field2?.discountPercentage) || 0, 100);
                                    amountAfterDiscountPerUnit = unitPrice * (1 - discountPercent / 100);
                                  }
                                  
                                  return formatMoney(amountAfterDiscountPerUnit);
                                })()}
                    </td>
                              )}
                              {visibleColumns.salesTax && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                <select
                                  value={salesTaxCodePerItem[field.id] || ''}
                                  onChange={(e) => {
                                    setSalesTaxCodePerItem(prev => ({ ...prev, [field.id]: e.target.value }));
                                    // Update taxPercentage field with the rate from selected tax code
                                    const selectedTaxCode = salesTaxCodes.find(tc => tc.id === e.target.value);
                                    if (selectedTaxCode) {
                                      const taxRate = selectedTaxCode.rate ? (typeof selectedTaxCode.rate === 'number' ? selectedTaxCode.rate : parseFloat(selectedTaxCode.rate || '0')) : 0;
                                      setValue(`items.${index}.taxPercentage`, taxRate);
                                    } else {
                                      setValue(`items.${index}.taxPercentage`, 0);
                                    }
                                  }}
                                  className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Tax</option>
                                  {salesTaxCodes.map(tax => (
                                    <option key={tax.id} value={tax.id}>{tax.name}</option>
                                  ))}
                                </select>
                                {errors.items?.[index]?.taxPercentage && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors.items[index]?.taxPercentage?.message}
                                  </p>
                        )}
                    </td>
                              )}
                              {visibleColumns.vatAmount && (
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(() => {
                                  const field2 = watch(`items.${index}`) as any;
                                  const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
                                  
                                  // Calculate per-unit amount after discount (same as Amount After Discount column)
                                  // Use watch() values for real-time updates
                                  const unitPrice = Number(field2?.unitPrice) || 0;
                                  const quantity = Math.max(Number(field2?.quantity) || 1, 1);
                                  
                                  let amountAfterDiscountPerUnit = unitPrice;
                                  if (useAmountMode) {
                                    const totalDiscountAmount = Number(field2?.discountAmount) || 0;
                                    const perUnitDiscount = totalDiscountAmount / quantity;
                                    amountAfterDiscountPerUnit = Math.max(0, unitPrice - perUnitDiscount);
                                  } else {
                                    const discountPercent = Math.min(Number(field2?.discountPercentage) || 0, 100);
                                    amountAfterDiscountPerUnit = unitPrice * (1 - discountPercent / 100);
                                  }
                                  
                                  // Get sales tax rate from selected tax code
                                  const salesTaxCodeId = salesTaxCodePerItem[field.id];
                                  const salesTaxCode = salesTaxCodeId ? salesTaxCodes.find(tc => tc.id === salesTaxCodeId) : null;
                                  const taxPercent = salesTaxCode?.rate ? (typeof salesTaxCode.rate === 'number' ? salesTaxCode.rate : parseFloat(salesTaxCode.rate || '0')) : Math.max(Number(field2?.taxPercentage) || 0, 0);
                                  
                                  // Calculate VAT: unitPrice is now always base price (exclusive)
                                  const vatAmountPerUnit = amountAfterDiscountPerUnit * taxPercent / 100;
                                  
                                  return formatMoney(vatAmountPerUnit);
                                })()}
                                </td>
                              )}
                              {visibleColumns.amountAfterVAT && (
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(() => {
                                  const field2 = watch(`items.${index}`) as any;
                                  const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
                                  
                                  // Calculate per-unit amount after discount
                                  // Use watch() values for real-time updates
                                  const unitPrice = Number(field2?.unitPrice) || 0;
                                  const quantity = Math.max(Number(field2?.quantity) || 1, 1);
                                  
                                  let amountAfterDiscountPerUnit = unitPrice;
                                  if (useAmountMode) {
                                    const totalDiscountAmount = Number(field2?.discountAmount) || 0;
                                    const perUnitDiscount = totalDiscountAmount / quantity;
                                    amountAfterDiscountPerUnit = Math.max(0, unitPrice - perUnitDiscount);
                                  } else {
                                    const discountPercent = Math.min(Number(field2?.discountPercentage) || 0, 100);
                                    amountAfterDiscountPerUnit = unitPrice * (1 - discountPercent / 100);
                                  }
                                  
                                  // Get sales tax rate from selected tax code
                                  const salesTaxCodeId = salesTaxCodePerItem[field.id];
                                  const salesTaxCode = salesTaxCodeId ? salesTaxCodes.find(tc => tc.id === salesTaxCodeId) : null;
                                  const taxPercent = salesTaxCode?.rate ? (typeof salesTaxCode.rate === 'number' ? salesTaxCode.rate : parseFloat(salesTaxCode.rate || '0')) : Math.max(Number(field2?.taxPercentage) || 0, 0);
                                  
                                  // Calculate Amount After VAT: unitPrice is now base price, so we add VAT
                                  const vatAmountPerUnit = amountAfterDiscountPerUnit * taxPercent / 100;
                                  const amountAfterVATPerUnit = amountAfterDiscountPerUnit + vatAmountPerUnit;
                                  
                                  return formatMoney(amountAfterVATPerUnit);
                                })()}
                                </td>
                              )}
                              {visibleColumns.wht && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                <select
                                  value={whtTaxCodePerItem[field.id] || ''}
                                  onChange={(e) => setWhtTaxCodePerItem(prev => ({ ...prev, [field.id]: e.target.value }))}
                                  className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select WHT</option>
                                  {whtTaxCodes.map(tax => (
                                    <option key={tax.id} value={tax.id}>{tax.name}</option>
                                  ))}
                                </select>
                              </td>
                              )}
                              {visibleColumns.whtAmount && (
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(() => {
                                  const field2 = watch(`items.${index}`) as any;
                                  const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
                                  
                                  // Use watch() values for real-time updates
                                  const quantity = Math.max(Number(field2?.quantity) || 1, 1);
                                  const unitPrice = Number(field2?.unitPrice) || 0;
                                  const lineSubtotal = quantity * unitPrice;
                                  
                                  let lineDiscount = 0;
                                  if (useAmountMode && field2?.discountAmount) {
                                    lineDiscount = Math.min(field2.discountAmount, lineSubtotal);
                                  } else {
                                    const discountPercent = Math.min(Number(field2?.discountPercentage) || 0, 100);
                                    lineDiscount = lineSubtotal * discountPercent / 100;
                                  }
                                  
                                  const amountAfterDiscount = lineSubtotal - lineDiscount;
                                  const whtTaxCodeId = whtTaxCodePerItem[field.id];
                                  const whtTaxCode = whtTaxCodes.find(tc => tc.id === whtTaxCodeId);
                                  const whtRate = whtTaxCode?.rate ? (typeof whtTaxCode.rate === 'number' ? whtTaxCode.rate : parseFloat(whtTaxCode.rate || '0')) : 0;
                                  const whtAmount = amountAfterDiscount * whtRate / 100;
                                  
                                  return formatMoney(whtAmount);
                                })()}
                              </td>
                              )}
                              {visibleColumns.amountAfterWHT && (
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(() => {
                                  const field2 = watch(`items.${index}`) as any;
                                  const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
                                  
                                  // Use watch() values for real-time updates
                                  const quantity = Math.max(Number(field2?.quantity) || 1, 1);
                                  const unitPrice = Number(field2?.unitPrice) || 0;
                                  const lineSubtotal = quantity * unitPrice;
                                  
                                  let lineDiscount = 0;
                                  if (useAmountMode && field2?.discountAmount) {
                                    lineDiscount = Math.min(field2.discountAmount, lineSubtotal);
                                  } else {
                                    const discountPercent = Math.min(Number(field2?.discountPercentage) || 0, 100);
                                    lineDiscount = lineSubtotal * discountPercent / 100;
                                  }
                                  
                                  const amountAfterDiscount = lineSubtotal - lineDiscount;
                                  const whtTaxCodeId = whtTaxCodePerItem[field.id];
                                  const whtTaxCode = whtTaxCodes.find(tc => tc.id === whtTaxCodeId);
                                  const whtRate = whtTaxCode?.rate ? (typeof whtTaxCode.rate === 'number' ? whtTaxCode.rate : parseFloat(whtTaxCode.rate || '0')) : 0;
                                  const whtAmount = amountAfterDiscount * whtRate / 100;
                                  const amountAfterWht = amountAfterDiscount - whtAmount;
                                  
                                  return formatMoney(amountAfterWht);
                                })()}
                              </td>
                              )}
                              {visibleColumns.total && (
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(() => {
                                  const field2 = watch(`items.${index}`) as any;
                                  const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
                                  
                                  // Calculate line totals for Amount After WHT
                                  const quantity = Math.max(Number(field2?.quantity) || 1, 1);
                                  const unitPrice = Number(field2?.unitPrice) || 0;
                                  const lineSubtotal = quantity * unitPrice;
                                  
                                  let lineDiscount = 0;
                                  if (useAmountMode && field2?.discountAmount) {
                                    lineDiscount = Math.min(field2.discountAmount, lineSubtotal);
                                  } else {
                                    const discountPercent = Math.min(Number(field2?.discountPercentage) || 0, 100);
                                    lineDiscount = lineSubtotal * discountPercent / 100;
                                  }
                                  
                                  const amountAfterDiscount = lineSubtotal - lineDiscount;
                                  const whtTaxCodeId = whtTaxCodePerItem[field.id];
                                  const whtTaxCode = whtTaxCodes.find(tc => tc.id === whtTaxCodeId);
                                  const whtRate = whtTaxCode?.rate ? (typeof whtTaxCode.rate === 'number' ? whtTaxCode.rate : parseFloat(whtTaxCode.rate || '0')) : 0;
                                  const whtAmount = amountAfterDiscount * whtRate / 100;
                                  const amountAfterWht = amountAfterDiscount - whtAmount;
                                  
                                  // Calculate VAT Amount (line total)
                                  let amountAfterDiscountPerUnit = unitPrice;
                                  if (useAmountMode) {
                                    const totalDiscountAmount = Number(field2?.discountAmount) || 0;
                                    const perUnitDiscount = totalDiscountAmount / quantity;
                                    amountAfterDiscountPerUnit = Math.max(0, unitPrice - perUnitDiscount);
                                  } else {
                                    const discountPercent = Math.min(Number(field2?.discountPercentage) || 0, 100);
                                    amountAfterDiscountPerUnit = unitPrice * (1 - discountPercent / 100);
                                  }
                                  
                                  // Get sales tax rate from selected tax code
                                  const salesTaxCodeId = salesTaxCodePerItem[field.id];
                                  const salesTaxCode = salesTaxCodeId ? salesTaxCodes.find(tc => tc.id === salesTaxCodeId) : null;
                                  const taxPercent = salesTaxCode?.rate ? (typeof salesTaxCode.rate === 'number' ? salesTaxCode.rate : parseFloat(salesTaxCode.rate || '0')) : Math.max(Number(field2?.taxPercentage) || 0, 0);
                                  
                                  // Calculate VAT: unitPrice is now always base price (exclusive)
                                  const vatAmountPerUnit = amountAfterDiscountPerUnit * taxPercent / 100;
                                  const vatAmountTotal = vatAmountPerUnit * quantity;
                                  
                                  // Total = Amount After WHT + VAT Amount
                                  const total = amountAfterWht + vatAmountTotal;
                                  
                                  return formatMoney(total);
                                })()}
                    </td>
                              )}
                              {visibleColumns.currency && (
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {(() => {
                                    // Use invoice-level currency from Step 1
                                    const invoiceCurrencyId = watch('currencyId') || '';
                                    const invoiceCurrency = currencies.find(c => c.id === invoiceCurrencyId);
                                    return invoiceCurrency ? `${invoiceCurrency.code} - ${invoiceCurrency.name}` : '-';
                                  })()}
                                </td>
                              )}
                              {visibleColumns.exchangeRate && (
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {(() => {
                                    // Use invoice-level exchange rate from Step 1
                                    const exchangeRateValue = watch('exchangeRateValue');
                                    // Parse the value - it might be a string or number
                                    const invoiceExchangeRate = exchangeRateValue !== undefined && exchangeRateValue !== null 
                                      ? (typeof exchangeRateValue === 'string' ? parseFloat(exchangeRateValue) : Number(exchangeRateValue))
                                      : 1.0;
                                    
                                    // If parsed value is NaN or 0, check if there's a valid exchange rate
                                    const finalRate = (Number.isFinite(invoiceExchangeRate) && invoiceExchangeRate > 0) 
                                      ? invoiceExchangeRate 
                                      : 1.0;
                                    
                                    return new Intl.NumberFormat('en-US', { 
                                      minimumFractionDigits: 4, 
                                      maximumFractionDigits: 6 
                                    }).format(finalRate);
                                  })()}
                                </td>
                              )}
                              {visibleColumns.equivalentAmount && (
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {(() => {
                                    const field2 = watch(`items.${index}`) as any;
                                    const useAmountMode = !discountInputMode[field.id] && discountInputMode[field.id] !== undefined;
                                    
                                    // Use watch() values for real-time updates
                                    const quantity = Math.max(Number(field2?.quantity) || 1, 1);
                                    const unitPrice = Number(field2?.unitPrice) || 0;
                                    const lineSubtotal = quantity * unitPrice;
                                    
                                    let lineDiscount = 0;
                                    if (useAmountMode && field2?.discountAmount) {
                                      lineDiscount = Math.min(field2.discountAmount, lineSubtotal);
                                    } else {
                                      const discountPercent = Math.min(Number(field2?.discountPercentage) || 0, 100);
                                      lineDiscount = lineSubtotal * discountPercent / 100;
                                    }
                                    
                                    const amountAfterDiscount = lineSubtotal - lineDiscount;
                                    
                                    // Get sales tax rate
                                    const salesTaxCodeId = salesTaxCodePerItem[field.id];
                                    const salesTaxCode = salesTaxCodeId ? salesTaxCodes.find(tc => tc.id === salesTaxCodeId) : null;
                                    const taxPercent = salesTaxCode?.rate ? (typeof salesTaxCode.rate === 'number' ? salesTaxCode.rate : parseFloat(salesTaxCode.rate || '0')) : Math.max(Number(field2?.taxPercentage) || 0, 0);
                                    
                                    const taxAmount = (amountAfterDiscount * taxPercent) / 100;
                                    const lineTotal = amountAfterDiscount + taxAmount;
                                    
                                    // Use invoice-level exchange rate from Step 1
                                    const exchangeRateValue = watch('exchangeRateValue');
                                    // Parse the value - it might be a string or number
                                    const invoiceExchangeRate = exchangeRateValue !== undefined && exchangeRateValue !== null 
                                      ? (typeof exchangeRateValue === 'string' ? parseFloat(exchangeRateValue) : Number(exchangeRateValue))
                                      : 1.0;
                                    
                                    // If parsed value is NaN or 0, use 1.0 as fallback
                                    const finalRate = (Number.isFinite(invoiceExchangeRate) && invoiceExchangeRate > 0) 
                                      ? invoiceExchangeRate 
                                      : 1.0;
                                    
                                    const equivalentAmount = lineTotal * finalRate;
                                    
                                    return formatMoney(equivalentAmount);
                                  })()}
                                </td>
                              )}
                              {visibleColumns.batch && (
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Package className="h-4 w-4 text-gray-400" />
                                      <span className="text-xs text-gray-500">Batch</span>
                                    </div>
                                    <div className="space-y-1">
                                      <BatchNumberDropdown
                                        productId={field.productId}
                                        storeId={watch('storeId') || ''}
                                        value={watch(`items.${index}.batchNumber`) || ''}
                                        onChange={(batchNumber: string, expiryDate?: string) => {
                                          setValue(`items.${index}.batchNumber`, batchNumber);
                                          if (expiryDate) {
                                            setValue(`items.${index}.expiryDate`, expiryDate);
                                          }
                                        }}
                                        onClear={() => {
                                          setValue(`items.${index}.batchNumber`, '');
                                          setValue(`items.${index}.expiryDate`, '');
                                        }}
                                      />
                                      {watch(`items.${index}.batchNumber`) && (
                                        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                          {watch(`items.${index}.batchNumber`)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              )}
                              {visibleColumns.serial && (
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Hash className="h-4 w-4 text-gray-400" />
                                      <span className="text-xs text-gray-500">Serial</span>
                                    </div>
                                    <div className="space-y-1">
                                      <SerialNumberSelector
                                        productId={field.productId}
                                        storeId={watch('storeId') || ''}
                                        value={(watch(`items.${index}.serialNumbers`) || []).filter((s): s is string => typeof s === 'string' && s !== '')}
                                        onChange={(serialNumbers: string[]) => {
                                          setValue(`items.${index}.serialNumbers`, serialNumbers);
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              )}
                              {visibleColumns.actions && (
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        type="button"
                                  onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-900"
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

        {/* Totals Summary */}
                {fields.length > 0 && (
                  <div className="mt-6 bg-white border border-gray-200 rounded-lg">
                    <div className="w-full">
                      {/* Amount Row */}
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-900">Amount</span>
                        <span className="text-sm font-semibold text-gray-900">{formatMoney(totals.subtotal)}</span>
              </div>
                      
                      {/* Discount Row - Only show if discount column is visible */}
                      {visibleColumns.discount && (
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                          <span className="text-sm text-gray-600">Discount</span>
                          <span className="text-sm text-gray-900">{formatMoney(totals.totalDiscount)}</span>
              </div>
                      )}
                      
                      {/* Amount After Discount Row - Only show if amountAfterDiscount column is visible */}
                      {visibleColumns.amountAfterDiscount && (
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                          <span className="text-sm font-semibold text-gray-900">Amount After Discount</span>
                          <span className="text-sm font-semibold text-gray-900">{formatMoney(totals.amountAfterDiscount)}</span>
              </div>
                      )}
                      
                      {/* WHT Row - Only show if wht column is visible */}
                      {visibleColumns.wht && (
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                          <span className="text-sm text-gray-600">WHT</span>
                          <span className="text-sm text-gray-900">{formatMoney(totals.totalWHT)}</span>
              </div>
                      )}
                      
                      {/* Amount After WHT Row - Only show if amountAfterWHT column is visible */}
                      {visibleColumns.amountAfterWHT && (
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                          <span className="text-sm font-semibold text-gray-900">Amount After WHT</span>
                          <span className="text-sm font-semibold text-gray-900">{formatMoney(totals.amountAfterWHT)}</span>
                        </div>
                      )}
                      
                      {/* VAT Row */}
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                        <span className="text-sm text-gray-600">
                          VAT ({totals.effectiveVATPercent > 0 ? totals.effectiveVATPercent.toFixed(1) : '0'}%)
                        </span>
                        <span className="text-sm text-gray-900">{formatMoney(totals.totalTax)}</span>
                      </div>
                      
                      {/* Invoice Amount Row */}
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                        <span className="text-sm font-semibold text-gray-900">Invoice Amount</span>
                        <span className="text-sm font-semibold text-gray-900">{formatMoney(totals.total)}</span>
                      </div>
                      
                      {/* Total Amount Row */}
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                        <span className="text-sm font-semibold text-gray-900">{formatMoney(totals.total)}</span>
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
                  <button
            type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Previous
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
            onClick={onCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
          >
            Cancel
                </button>
                
                <button
            type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {currentStep === 1 
                        ? 'Next' 
                        : (salesOrder ? 'Updating...' : 'Creating...')}
                    </>
                  ) : (
                    currentStep === 1 
                      ? 'Next' 
                      : (salesOrder ? 'Update Sales Order' : 'Create Sales Order')
                  )}
                </button>
              </div>
        </div>
      </form>
        </>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add New Customer"
        size="lg"
      >
        <CustomerForm
          initialValues={undefined}
          customerGroups={customerGroups}
          loyaltyCards={loyaltyCards}
          onSubmit={handleCreateCustomer}
          onCancel={() => setShowAddCustomerModal(false)}
          isLoading={isCreatingCustomer}
        />
      </Modal>
    </div>
  );
};

export default SalesOrderForm;