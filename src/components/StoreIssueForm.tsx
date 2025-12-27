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
import { StoreIssue, StoreIssueFormData, StoreIssueItemFormData, Store, Product, User } from '../types';
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

interface StoreIssueFormProps {
  storeIssue?: StoreIssue | null;
  stores: Store[];
  currentUser?: User | null;
  onSubmit: (data: StoreIssueFormData, status?: 'draft' | 'submitted') => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  onSubmitForApproval?: (id: string) => void;
}

const validationSchema = yup.object({
  reference_number: yup.string().optional(),
  request_date: yup.string().required('Issue date is required'),
  requesting_store_id: yup.string().required('Issue to store is required'),
  requested_from_store_id: yup.string().required('Issue from store is required'),
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

const StoreIssueForm: React.FC<StoreIssueFormProps> = ({
  storeIssue,
  stores: availableStores,
  currentUser,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
  onSubmitForApproval
}) => {
  const { stores } = useAuth();
  
  // State for product search and selection
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [showMoreColumns, setShowMoreColumns] = useState(() => {
    // Load saved state from localStorage, default to false
    const saved = localStorage.getItem('storeIssue_showMoreColumns');
    return saved ? JSON.parse(saved) : false;
  });

  // Handle toggle with localStorage persistence
  const handleToggleMoreColumns = useCallback(() => {
    const newState = !showMoreColumns;
    setShowMoreColumns(newState);
    localStorage.setItem('storeIssue_showMoreColumns', JSON.stringify(newState));
  }, [showMoreColumns]);

  // Filter stores based on user assignments and capabilities
  const getUserAssignedStores = () => {
    if (!stores || stores.length === 0) {
      return [];
    }
    
    // Filter stores based on three criteria:
    // 1. User has been assigned to the store
    // 2. Store is active
    // 3. Store can receive from other stores
    return availableStores.filter(store => {
      return stores.some(userStore => {
        return userStore.id === store.id && 
               store.is_active && 
               store.can_receive_from_store;
      });
    });
  };
  
  const getStoresWithIssueCapability = () => {
    return availableStores.filter(store => store.can_issue_to_store && store.is_active);
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
  } = useForm<StoreIssueFormData>({
    resolver: yupResolver(validationSchema) as any,
    mode: 'onChange',
    defaultValues: {
      request_date: new Date().toISOString().split('T')[0],
      requesting_store_id: '',
      requested_from_store_id: '',
      request_type: 'issue', // Auto-filled for Store Issue module
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
  const watchedExchangeRate = watch('exchange_rate');

  // Load currencies and exchange rates on component mount
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const currenciesData = await currencyService.getCurrencies(1, 1000);
        setCurrencies(currenciesData.currencies || []);
        
        const exchangeRatesData = await getAllActiveExchangeRates();
        setExchangeRates(exchangeRatesData);
      } catch (error) {
        toast.error('Failed to load currencies');
      }
    };

    loadCurrencies();
  }, []);

  // Calculate exchange rate when currency changes
  useEffect(() => {
    if (watchedCurrencyId && exchangeRates.length > 0) {
      const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
      const defaultCurrency = currencies.find(c => c.code === 'TZS');
      
      if (selectedCurrency && defaultCurrency) {
        const exchangeRate = calculateExchangeRate(selectedCurrency.id, defaultCurrency.id);
        if (exchangeRate !== null) {
          setValue('exchange_rate', exchangeRate);
          
          // Update all item-level exchange rates and equivalent amounts
          const currentItems = getValues('items');
          const updatedItems = currentItems.map(item => {
            const itemExchangeRate = calculateExchangeRate(selectedCurrency.id, defaultCurrency.id);
            const itemEquivalentAmount = itemExchangeRate !== null ? 
              (item.requested_quantity || 0) * (item.unit_cost || 0) * itemExchangeRate : 0;
            
            return {
              ...item,
              exchange_rate: itemExchangeRate || undefined,
              equivalent_amount: itemEquivalentAmount
            };
          });
          
          setValue('items', updatedItems);
        }
      }
    }
  }, [watchedCurrencyId, currencies, exchangeRates, setValue, getValues]);

  // Calculate exchange rate between two currencies
  const calculateExchangeRate = (fromCurrencyId: string, toCurrencyId: string): number | null => {
    if (fromCurrencyId === toCurrencyId) return 1.0;
    
    const rate = exchangeRates.find(rate => 
      rate.from_currency_id === fromCurrencyId && rate.to_currency_id === toCurrencyId
    );
    
    return rate ? parseFloat(rate.rate) : null;
  };

  // Reset form when storeIssue prop changes
  useEffect(() => {
    if (storeIssue) {
      reset({
        reference_number: storeIssue.reference_number,
        request_date: storeIssue.request_date ? storeIssue.request_date.split('T')[0] : '',
        requesting_store_id: storeIssue.requested_by_store_id,
        requested_from_store_id: storeIssue.requested_from_store_id,
        request_type: 'issue', // Always set to 'issue' for Store Issue module
        priority: storeIssue.priority,
        expected_delivery_date: storeIssue.expected_delivery_date ? storeIssue.expected_delivery_date.split('T')[0] : '',
        notes: storeIssue.notes || '',
        currency_id: storeIssue.currency_id || '',
        exchange_rate: storeIssue.exchange_rate || 1.0,
        items: storeIssue.storeRequestItems?.map(item => ({
          product_id: item.product_id,
          requested_quantity: item.requested_quantity,
          unit_cost: item.unit_cost,
          currency_id: item.currency_id,
          exchange_rate: item.exchange_rate,
          equivalent_amount: item.equivalent_amount,
          notes: item.notes
        })) || []
      });
    }
  }, [storeIssue, reset]);

  // Product search handler
  const handleProductSearch = async (term: string) => {
    if (term.length < 2) {
      setProducts([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use the issuing store ID for product search
      const issuingStoreId = watchedIssuingStoreId;
      if (!issuingStoreId) {
        toast.error('Please select an issuing store first');
        return;
      }
      
      const searchResults = await productCatalogService.getProductsByStore(issuingStoreId, term, 100);
      setProducts(searchResults);
    } catch (error) {
      toast.error('Failed to search products');
    } finally {
      setIsSearching(false);
    }
  };

  // Add product to items
  const handleAddProduct = (product: Product) => {
    const currentItems = getValues('items');
    const existingItem = currentItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      toast.error('Product already added to the issue');
      return;
    }

    const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
    const defaultCurrency = currencies.find(c => c.code === 'TZS');
    const exchangeRate = calculateExchangeRate(
      selectedCurrency?.id || '', 
      defaultCurrency?.id || ''
    ) || 1.0;

    const newItem: StoreIssueItemFormData = {
      product_id: product.id,
      requested_quantity: 1,
      unit_cost: 0,
      currency_id: watchedCurrencyId,
      exchange_rate: exchangeRate,
      equivalent_amount: 0,
      notes: ''
    };

    append(newItem);
    setSelectedProduct(null);
    setSearchTerm('');
    setProducts([]);
  };

  // Handle quantity change
  const handleQuantityChange = (index: number, value: number) => {
    const currentItems = getValues('items');
    const item = currentItems[index];
    const exchangeRate = calculateExchangeRate(
      item.currency_id || watchedCurrencyId || '', 
      currencies.find(c => c.code === 'TZS')?.id || ''
    ) || 1.0;
    
    const equivalentAmount = value * (item.unit_cost || 0) * exchangeRate;
    
    setValue(`items.${index}.requested_quantity`, value);
    setValue(`items.${index}.exchange_rate`, exchangeRate);
    setValue(`items.${index}.equivalent_amount`, equivalentAmount);
  };

  // Handle unit cost change
  const handleUnitCostChange = (index: number, value: number) => {
    const currentItems = getValues('items');
    const item = currentItems[index];
    const exchangeRate = calculateExchangeRate(
      item.currency_id || watchedCurrencyId || '', 
      currencies.find(c => c.code === 'TZS')?.id || ''
    ) || 1.0;
    
    const equivalentAmount = (item.requested_quantity || 0) * value * exchangeRate;
    
    setValue(`items.${index}.unit_cost`, value);
    setValue(`items.${index}.exchange_rate`, exchangeRate);
    setValue(`items.${index}.equivalent_amount`, equivalentAmount);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const isValid = await trigger();
      if (!isValid) {
        toast.error('Please fix the form errors before submitting');
        return;
      }

      const formData = getValues();
      await onSubmit(formData, 'draft');
    } catch (error) {
      toast.error('Failed to submit form');
    }
  };

  // Submit for approval
  const handleSubmitForApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const isValid = await trigger();
      if (!isValid) {
        toast.error('Please fix the form errors before submitting');
        return;
      }

      const formData = getValues();
      await onSubmit(formData, 'submitted');
    } catch (error) {
      toast.error('Failed to submit for approval');
    }
  };

  // Calculate totals
  const totalItems = watchedItems.length;
  const totalValue = watchedItems.reduce((sum, item) => {
    return sum + ((item.requested_quantity || 0) * (item.unit_cost || 0));
  }, 0);

  const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
  const currencySymbol = selectedCurrency?.symbol || 'TSh';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Create Store Issue' : 'Edit Store Issue'}
            </h2>
            <p className="text-sm text-gray-600">
              {mode === 'create' ? 'Issue stock to stores or departments' : 'Update store issue details'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={handleSubmitForApproval}
            disabled={isLoading}
          >
            Submit for Approval
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Reference Number"
              {...register('reference_number')}
              disabled
              placeholder="Auto-generated"
              error={errors.reference_number?.message}
            />
            
            <Input
              label="Issue Date"
              type="date"
              {...register('request_date')}
              required
              error={errors.request_date?.message}
            />
            
            <Select
              label="Issue To Store"
              {...register('requesting_store_id')}
              required
              error={errors.requesting_store_id?.message}
            >
              <option value="">Select store...</option>
              {getUserAssignedStores().map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Select>
            
            <Select
              label="Issue From Store"
              {...register('requested_from_store_id')}
              required
              error={errors.requested_from_store_id?.message}
            >
              <option value="">Select store...</option>
              {getStoresWithIssueCapability().map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Select>
            
            <Select
              label="Priority"
              {...register('priority')}
              required
              error={errors.priority?.message}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            
            <Input
              label="Expected Delivery Date"
              type="date"
              {...register('expected_delivery_date')}
              error={errors.expected_delivery_date?.message}
            />
            
            <Select
              label="Currency"
              {...register('currency_id')}
              required
              error={errors.currency_id?.message}
            >
              <option value="">Select currency...</option>
              {currencies.map(currency => (
                <option key={currency.id} value={currency.id}>
                  {currency.code} ({currency.symbol})
                </option>
              ))}
            </Select>
            
            <Input
              label="Exchange Rate"
              type="number"
              step="0.0001"
              {...register('exchange_rate')}
              error={errors.exchange_rate?.message}
            />
          </div>
          
          <div className="mt-4">
            <Textarea
              label="Notes"
              {...register('notes')}
              placeholder="Additional notes or comments..."
              rows={3}
              error={errors.notes?.message}
            />
          </div>
        </div>

        {/* Issue Items */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Issue Items</h3>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleToggleMoreColumns}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <span>{showMoreColumns ? 'Show Less' : 'Show More'}</span>
                {showMoreColumns ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Product Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products to add..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleProductSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            {/* Search Results */}
            {products.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {products.map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.part_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Stock: {(product.currentQuantity || 0).toLocaleString('en-US')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items Table */}
          {fields.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    {showMoreColumns && (
                      <>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange Rate</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equivalent Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const item = watchedItems[index];
                    const product = products.find(p => p.id === item?.product_id);
                    const totalCost = (item?.requested_quantity || 0) * (item?.unit_cost || 0);
                    
                    return (
                      <tr key={field.id} className="border-b border-gray-200">
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-gray-900">{product?.name || 'Unknown Product'}</p>
                            <p className="text-sm text-gray-600">{product?.part_number || ''}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item?.requested_quantity || 0}
                            onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item?.unit_cost || 0}
                            onChange={(e) => handleUnitCostChange(index, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </td>
                        {showMoreColumns && (
                          <>
                            <td className="px-3 py-2">
                              <span className="text-sm text-gray-600 font-mono">
                                {(item?.exchange_rate || 1).toFixed(4)}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-sm text-gray-600">
                                {currencySymbol}{(item?.equivalent_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                {...register(`items.${index}.notes`)}
                                placeholder="Notes..."
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              />
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2">
                          <span className="text-sm font-medium text-gray-900">
                            {currencySymbol}{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-3 py-2 text-gray-900">Total</td>
                    <td className="px-3 py-2 text-gray-900">
                      {totalItems.toLocaleString('en-US')}
                    </td>
                    <td className="px-3 py-2 text-gray-900">-</td>
                    {showMoreColumns && (
                      <>
                        <td className="px-3 py-2 text-gray-900">-</td>
                        <td className="px-3 py-2 text-gray-900">-</td>
                        <td className="px-3 py-2 text-gray-900">-</td>
                      </>
                    )}
                    <td className="px-3 py-2 text-gray-900">
                      {currencySymbol}{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No items added yet</p>
              <p className="text-sm">Search and add products to create the issue</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default StoreIssueForm;
