import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import {
  X,
  Package,
  CheckCircle,
  ArrowLeft,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { StoreRequest, StoreRequestFormData, StoreRequestItemFormData, Store, Product, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { productCatalogService } from '../services/productCatalogService';
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

interface StoreIssueFormIssuerProps {
  storeRequest: StoreRequest; // The original request to be issued
  stores: Store[];
  currentUser?: User | null;
  onSubmit: (data: StoreRequestFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const validationSchema = yup.object({
  reference_number: yup.string().optional(),
  request_date: yup.string().required('Issue date is required'),
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

const StoreIssueFormIssuer: React.FC<StoreIssueFormIssuerProps> = ({
  storeRequest,
  stores,
  currentUser,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { stores: userStores } = useAuth();
  
  // State for currencies and exchange rates
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  
  // State for issuing store stock information
  const [issuingStoreStock, setIssuingStoreStock] = useState<{[productId: string]: number}>({});
  
  // State for form products (from the original request)
  const [formProducts, setFormProducts] = useState<Product[]>([]);

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
      reference_number: storeRequest.reference_number || '',
      request_date: new Date().toISOString().split('T')[0], // Today's date for issue
      requesting_store_id: storeRequest.requestingStore?.id || storeRequest.requested_by_store_id,
      requested_from_store_id: storeRequest.issuingStore?.id || storeRequest.requested_from_store_id,
      request_type: 'issue', // Set to 'issue' for Store Issue module
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
    }
  });

  const { fields } = useFieldArray({
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
  }, []);

  // Load stock information for the issuing store
  const loadIssuingStoreStock = useCallback(async (productIds: string[], issuingStoreId: string) => {
    if (!issuingStoreId || productIds.length === 0) return;
    
    try {
      const stockPromises = productIds.map(async (productId) => {
        try {
          const stockData = await productCatalogService.getProductStoreStock(productId, issuingStoreId);
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
      
      setIssuingStoreStock(stockMap);
    } catch (error) {
      // Silently handle errors - stock will show as 0
      }
  }, []);

  // Initialize formProducts from storeRequest items
  useEffect(() => {
    if (storeRequest?.storeRequestItems && storeRequest.storeRequestItems.length > 0) {
      const existingProducts = storeRequest.storeRequestItems
        .map(item => item.storeRequestProduct)
        .filter((product): product is Product => product !== undefined);
      setFormProducts(existingProducts);
      
      // Load stock information for the issuing store
      const issuingStoreId = storeRequest.issuingStore?.id || storeRequest.requested_from_store_id;
      if (issuingStoreId && existingProducts.length > 0) {
        loadIssuingStoreStock(existingProducts.map(p => p.id), issuingStoreId);
      }
    }
  }, [storeRequest, loadIssuingStoreStock]);

  // Load stock information when form products change
  useEffect(() => {
    if (formProducts.length > 0 && watchedIssuingStoreId) {
      const productIds = formProducts.map(p => p.id);
      loadIssuingStoreStock(productIds, watchedIssuingStoreId);
    }
  }, [formProducts, watchedIssuingStoreId, loadIssuingStoreStock]);

  // Helper function to get product information with fallback
  const getProductInfo = useCallback((productId: string) => {
    // First try to find in formProducts (existing items)
    let product = formProducts.find(p => p.id === productId);
    
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
  }, [formProducts]);

  // Calculate total value
  const calculateTotalValue = () => {
    return watchedItems.reduce((total, item) => {
      const quantity = parseFloat(item.requested_quantity?.toString() || '0');
      const unitCost = parseFloat(item.unit_cost?.toString() || '0');
      return total + (quantity * unitCost);
    }, 0);
  };

  // Form submission
  const handleFormSubmit = async (data: StoreRequestFormData) => {
    // Calculate total items and value
    const totalItems = data.items.length;
    const totalValue = calculateTotalValue();
    
    const formData = {
      ...data,
      total_items: totalItems,
      total_value: totalValue,
      status: 'fulfilled' // Set status to fulfilled when issuing
    };
    
    // Return the promise from onSubmit so we can await it
    return onSubmit(formData);
  };

  const handleStepSubmit = async (data: StoreRequestFormData) => {
    try {
      const isValid = await trigger();
      if (isValid) {
        await handleFormSubmit(data);
      } else {
        toast.error('Please fix the form errors before submitting');
      }
    } catch (error) {
      }
  };

  // Get store names for display
  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store ? `${store.name} - ${store.location}` : 'Unknown Store';
  };

  return (
    <div className="space-y-6 w-full mx-auto max-w-[70vw]">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Issue Stock</h3>
              <p className="text-sm text-gray-600">Fulfill approved store request</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Request Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900">Original Request Summary</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Request Number:</span>
              <span className="ml-2 font-medium text-gray-900">{storeRequest.reference_number}</span>
            </div>
            <div>
              <span className="text-gray-600">Requested By:</span>
              <span className="ml-2 font-medium text-gray-900">{getStoreName(storeRequest.requested_by_store_id)}</span>
            </div>
            <div>
              <span className="text-gray-600">Priority:</span>
              <span className="ml-2 font-medium text-gray-900 capitalize">{storeRequest.priority}</span>
            </div>
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
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const formData = getValues();
              await handleStepSubmit(formData);
            } catch (error) {
              }
          }} className="space-y-8">
            {/* Issue Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Issue Details</h3>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date <span className="text-red-500">*</span>
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
                    Requested By Store
                  </label>
                  <Input
                    value={getStoreName(watchedRequestingStoreId)}
                    readOnly
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <input type="hidden" {...register('requesting_store_id')} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing From Store
                  </label>
                  <Input
                    value={getStoreName(watchedIssuingStoreId)}
                    readOnly
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <input type="hidden" {...register('requested_from_store_id')} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <Input
                    value={storeRequest.priority}
                    readOnly
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed capitalize"
                  />
                  <input type="hidden" {...register('priority')} />
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
                    Currency
                  </label>
                  <Input
                    value={currencies.find(c => c.id === watchedCurrencyId)?.code || 'N/A'}
                    readOnly
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <input type="hidden" {...register('currency_id')} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Notes
                </label>
                <Textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Additional notes about this stock issue..."
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                )}
              </div>
            </div>

            {/* Items to Issue */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Items to Issue</h3>
                </div>
                <div className="text-lg font-bold text-gray-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  Total: {(() => {
                    const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
                    const currencySymbol = selectedCurrency?.symbol || '$';
                    return `${currencySymbol}${calculateTotalValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  })()}
                </div>
              </div>

              {/* Items Table */}
              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items to issue</h3>
                  <p className="text-gray-600">This request has no items to issue</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Items to Issue ({fields.length})</h4>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Requested Qty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Available Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fields.map((field, index) => {
                          const item = watchedItems[index];
                          const product = getProductInfo(item?.product_id);
                          const totalCost = (parseFloat(item?.requested_quantity?.toString() || '0') * parseFloat(item?.unit_cost?.toString() || '0'));
                          const availableStock = issuingStoreStock[product?.id || ''] || 0;
                          const requestedQty = parseFloat(item?.requested_quantity?.toString() || '0');
                          const isInsufficientStock = availableStock < requestedQty;
                          
                          return (
                            <tr key={field.id} className={isInsufficientStock ? 'bg-red-50' : ''}>
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
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {requestedQty.toLocaleString('en-US')}
                                </div>
                                {product?.unit && (
                                  <div className="text-xs text-gray-500">{product.unit.name}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${isInsufficientStock ? 'text-red-600' : 'text-gray-900'}`}>
                                  {availableStock.toLocaleString('en-US')}
                                </div>
                                {product?.unit && (
                                  <div className="text-xs text-gray-500">{product.unit.name}</div>
                                )}
                                {isInsufficientStock && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-600">Insufficient stock</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900">
                                  {(() => {
                                    const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
                                    const currencySymbol = selectedCurrency?.symbol || '$';
                                    return `${currencySymbol}${(parseFloat(item?.unit_cost?.toString() || '0')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  })()}
                                </span>
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
                                <Input
                                  {...register(`items.${index}.notes`)}
                                  placeholder="Issue notes..."
                                  className="w-48 text-sm"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || fields.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Issuing Stock...
                    </div>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Issue Stock
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

export default StoreIssueFormIssuer;