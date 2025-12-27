import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import {
  X,
  Package,
  CheckCircle,
  Truck,
  AlertTriangle,
  XCircle
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

interface StoreRequestIssuerFormProps {
  storeRequest: StoreRequest;
  stores: Store[];
  currentUser?: User | null;
  onSubmit: (data: StoreRequestFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const validationSchema = yup.object({
  reference_number: yup.string().required('Reference number is required'),
  request_date: yup.string().required('Request date is required'),
  requesting_store_id: yup.string().required('Requesting store is required'),
  requested_from_store_id: yup.string().required('Issuing store is required'),
  request_type: yup.string().oneOf(['request', 'issue']).required('Request type is required'),
  priority: yup.string().oneOf(['low', 'medium', 'high', 'urgent']).required('Priority is required'),
  expected_delivery_date: yup.string().optional(),
  notes: yup.string().optional(),
  currency_id: yup.string().required('Currency is required'),
  exchange_rate: yup.number().min(0).optional(),
    items: yup.array().of(
      yup.object({
        product_id: yup.string().required('Product is required'),
        requested_quantity: yup.number().min(0.001).required('Requested quantity is required'),
        approved_quantity: yup.number().min(0.001).required('Approved quantity is required'),
        issuing_quantity: yup.number().min(0).optional().test(
          'not-exceed-remaining',
          'Cannot issue more than remaining quantity',
          function(value) {
            if (value === undefined || value === null) return true; // Allow undefined/null
            const { parent } = this;
            const remainingQty = parent.remaining_quantity || 0;
            return value <= remainingQty;
          }
        ),
        remaining_quantity: yup.number().min(0).optional(),
        unit_cost: yup.number().min(0).optional(),
        currency_id: yup.string().optional(),
        exchange_rate: yup.number().min(0).optional(),
        equivalent_amount: yup.number().min(0).optional(),
        notes: yup.string().optional()
      })
    ).min(1, 'At least one item is required')
});

const StoreRequestIssuerForm: React.FC<StoreRequestIssuerFormProps> = ({
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
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<any>(null);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  
  // State for product information
  const [formProducts, setFormProducts] = useState<Product[]>([]);
  const [issuingStoreStock, setIssuingStoreStock] = useState<{[productId: string]: number}>({});
  
  // State for step navigation
  const [currentStep, setCurrentStep] = useState(1);

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
    mode: 'onChange'
  });

  const { fields } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedCurrencyId = watch('currency_id');

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsInitialDataLoaded(false);
        
        // Load currencies
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
        
        setIsInitialDataLoaded(true);
      } catch (error) {
        toast.error('Failed to load form data');
        setIsInitialDataLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  // Initialize form with store request data
  useEffect(() => {
    if (storeRequest && isInitialDataLoaded) {
      reset({
        reference_number: storeRequest.reference_number || '',
        request_date: storeRequest.request_date,
        requesting_store_id: storeRequest.requested_by_store_id,
        requested_from_store_id: storeRequest.requested_from_store_id,
        request_type: 'issue', // This will be an issue from issuer perspective
        priority: storeRequest.priority,
        expected_delivery_date: storeRequest.expected_delivery_date || '',
        notes: storeRequest.notes || '',
        currency_id: storeRequest.currency_id || '',
        exchange_rate: storeRequest.exchange_rate || 1.0,
        items: storeRequest.storeRequestItems?.map(item => ({
          product_id: item.product_id,
          requested_quantity: item.requested_quantity,
          approved_quantity: item.approved_quantity,
          issued_quantity: item.issued_quantity || 0,
          remaining_quantity: item.remaining_quantity || 0,
          issuing_quantity: item.remaining_quantity || (item.approved_quantity - (item.issued_quantity || 0)), // Default to remaining quantity
          unit_cost: item.unit_cost || 0,
          currency_id: item.currency_id || '',
          exchange_rate: item.exchange_rate || 1.0,
          equivalent_amount: item.equivalent_amount || 0,
          notes: item.notes || ''
        })) || []
      });
      
      // Populate formProducts with products from existing items
      if (storeRequest.storeRequestItems && storeRequest.storeRequestItems.length > 0) {
        const existingProducts = storeRequest.storeRequestItems
          .map(item => item.storeRequestProduct)
          .filter((product): product is Product => product !== undefined);
        setFormProducts(existingProducts);
        
        // Load stock information for the issuing store
        loadIssuingStoreStock(existingProducts.map(p => p.id), storeRequest.requested_from_store_id);
      }
    }
  }, [storeRequest, isInitialDataLoaded, reset]);

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
      }
  }, []);

  // Helper function to get product information
  const getProductInfo = useCallback((productId: string) => {
    const product = formProducts.find(p => p.id === productId);
    
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

  // Calculate exchange rate between selected currency and default currency
  const calculateExchangeRate = useCallback(() => {
    if (!watchedCurrencyId || !defaultCurrency || !exchangeRates.length) {
      return null;
    }

    if (watchedCurrencyId === defaultCurrency.id) {
      return 1;
    }

    const rate = exchangeRates.find(rate => 
      rate.from_currency_id === watchedCurrencyId && 
      rate.to_currency_id === defaultCurrency.id
    );

    return rate ? rate.rate : null;
  }, [watchedCurrencyId, defaultCurrency, exchangeRates]);

  // Calculate total value
  const calculateTotalValue = () => {
    return watchedItems.reduce((total, item) => {
      const quantity = parseFloat(item.issuing_quantity?.toString() || '0');
      const unitCost = parseFloat(item.unit_cost?.toString() || '0');
      return total + (quantity * unitCost);
    }, 0);
  };

  // Step navigation functions
  const handleNextStep = async () => {
    const isValid = await trigger(['reference_number', 'request_date', 'requesting_store_id', 'requested_from_store_id', 'request_type', 'priority', 'currency_id']);
    if (isValid) {
      setCurrentStep(2);
    } else {
      toast.error('Please fix the form errors before proceeding');
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  // Form submission
  const handleFormSubmit = async (data: StoreRequestFormData) => {
    // Allow zero quantity issuing when no stock is available
    // This is a valid scenario when the issuing store doesn't have stock
    // The system will track this as a partial issue with 0 quantity
    
    // Validate that no issuing quantity exceeds approved quantity
    const hasInvalidQuantity = data.items.some(item => {
      const issuingQty = parseFloat(item.issuing_quantity?.toString() || '0');
      const approvedQty = parseFloat(item.approved_quantity?.toString() || '0');
      return issuingQty > approvedQty;
    });
    
    if (hasInvalidQuantity) {
      toast.error('Issuing quantity cannot exceed approved quantity for any item');
      return;
    }
    
    // Calculate total items and value
    const totalItems = data.items.length;
    const totalValue = calculateTotalValue();
    
    const formData = {
      ...data,
      total_items: totalItems,
      total_value: totalValue,
      status: 'fulfilled' // Mark as fulfilled when issuer submits
    };
    
    return onSubmit(formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const isValid = await trigger();
      if (!isValid) {
        toast.error('Please fix the form errors before submitting');
        return;
      }

      const formData = getValues();
      await handleFormSubmit(formData);
    } catch (error) {
      toast.error('Failed to submit form');
    }
  };

  // Get store names
  const requestingStore = stores.find(s => s.id === storeRequest.requested_by_store_id);
  const issuingStore = stores.find(s => s.id === storeRequest.requested_from_store_id);

  return (
    <div className="space-y-6 w-full mx-auto max-w-[70vw]">
      {/* Step Indicator */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Issuing Details
              </span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Issue Items
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep} of 2
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!isInitialDataLoaded && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading request details...</span>
        </div>
      )}

      {/* Form Content */}
      {isInitialDataLoaded && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Issue Store Request
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Issuing Details */}
            {currentStep === 1 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
               <div className="flex items-center mb-6">
                 <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                   <h3 className="text-lg font-semibold text-gray-900">Issuing Details</h3>
                 </div>
               </div>

              {/* Hidden required fields */}
              <input type="hidden" {...register('reference_number')} />
              <input type="hidden" {...register('request_type')} />
              <input type="hidden" {...register('exchange_rate')} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date
                  </label>
                  <Input
                    {...register('request_date')}
                    type="date"
                    required
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
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
                    {...register('requesting_store_id')}
                    value={requestingStore?.name || 'Unknown Store'}
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  {errors.requesting_store_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.requesting_store_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issuing From Store
                  </label>
                  <Input
                    {...register('requested_from_store_id')}
                    value={issuingStore?.name || 'Unknown Store'}
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  {errors.requested_from_store_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.requested_from_store_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <Input
                    {...register('priority')}
                    value={storeRequest.priority}
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed capitalize"
                  />
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
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
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
                    {...register('currency_id')}
                    value={currencies.find(c => c.id === storeRequest.currency_id)?.code || 'N/A'}
                    disabled
                    className="bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  {errors.currency_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.currency_id.message}</p>
                  )}
                </div>
              </div>

              {/* Issuer Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer Notes
                </label>
                <Textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Add any notes about the fulfillment process..."
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                )}
              </div>

                {/* Step 1 Navigation */}
                <div className="flex justify-end mt-6">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Next: Issue Items
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Issue Items */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                   <h3 className="text-lg font-semibold text-gray-900">Issue Items</h3>
                 </div>
                <div className="text-lg font-bold text-gray-900 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  Total: {(() => {
                    const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
                    const currencySymbol = selectedCurrency?.symbol || '$';
                    return `${currencySymbol}${calculateTotalValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  })()}
                </div>
              </div>

               {/* Items validation error */}
               {errors.items && (
                 <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                   <p className="text-sm text-red-600">{errors.items.message}</p>
                 </div>
               )}

               {fields.length === 0 ? (
                 <div className="text-center py-8 text-gray-500">
                   <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                   <h3 className="text-lg font-medium text-gray-900 mb-2">No items to issue</h3>
                   <p className="text-gray-600">This request has no items to issue</p>
                 </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Approved Qty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Available Stock
                          </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Issuing Qty
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Issued Qty
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remaining Qty
                            </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fields.map((field, index) => {
                          const item = watchedItems[index];
                          const product = getProductInfo(item?.product_id);
                          const availableStock = issuingStoreStock[product?.id || ''] || 0;
                          const approvedQty = parseFloat(item?.approved_quantity?.toString() || '0');
                          const issuingQty = parseFloat(item?.issuing_quantity?.toString() || '0');
                          const issuedQty = parseFloat(item?.issued_quantity?.toString() || '0');
                          const unitCost = parseFloat(item?.unit_cost?.toString() || '0');
                          const totalCost = issuingQty * unitCost;
                          const canFulfill = availableStock >= issuingQty;
                          const isFullyFulfilled = issuedQty >= approvedQty;
                          
                          return (
                            <tr key={field.id} className={isFullyFulfilled ? 'bg-gray-100 opacity-60' : ''}>
                              {/* Hidden form fields for validation */}
                              <td style={{ display: 'none' }}>
                                <input type="hidden" {...register(`items.${index}.product_id`)} />
                                <input type="hidden" {...register(`items.${index}.requested_quantity`)} />
                                <input type="hidden" {...register(`items.${index}.approved_quantity`)} />
                                <input type="hidden" {...register(`items.${index}.issuing_quantity`)} />
                                <input type="hidden" {...register(`items.${index}.unit_cost`)} />
                                <input type="hidden" {...register(`items.${index}.currency_id`)} />
                                <input type="hidden" {...register(`items.${index}.exchange_rate`)} />
                                <input type="hidden" {...register(`items.${index}.equivalent_amount`)} />
                                <input type="hidden" {...register(`items.${index}.notes`)} />
                              </td>
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
                                  {approvedQty.toLocaleString('en-US')}
                                </div>
                                {product?.unit && (
                                  <div className="text-xs text-gray-500">{product.unit.name}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${canFulfill ? 'text-green-600' : 'text-red-600'}`}>
                                  {availableStock.toLocaleString('en-US')}
                                </div>
                                {product?.unit && (
                                  <div className="text-xs text-gray-500">{product.unit.name}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-24">
                                  <Input
                                    {...register(`items.${index}.issuing_quantity`)}
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    max={Math.min(availableStock, item.remaining_quantity || 0)}
                                    disabled={isFullyFulfilled}
                                    className={`text-sm ${isFullyFulfilled ? 'bg-gray-200 cursor-not-allowed' : issuingQty > availableStock || issuingQty > (item.remaining_quantity || 0) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                    placeholder="0.000"
                                  />
                                  {product?.unit && (
                                    <div className="text-xs text-gray-500 mt-1">{product.unit.name}</div>
                                  )}
                                  {issuingQty > availableStock && (
                                    <div className="text-xs text-red-600 mt-1">Exceeds available stock</div>
                                  )}
                                  {issuingQty > (item.remaining_quantity || 0) && (
                                    <div className="text-xs text-red-600 mt-1">Exceeds remaining quantity</div>
                                  )}
                                  {availableStock === 0 && (
                                    <div className="text-xs text-orange-600 mt-1">No stock available</div>
                                  )}
                                </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {(item.issued_quantity || 0).toLocaleString('en-US')}
                                  </div>
                                  {product?.unit && (
                                    <div className="text-xs text-gray-500">{product.unit.name}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {(item.remaining_quantity || 0).toLocaleString('en-US')}
                                  </div>
                                  {product?.unit && (
                                    <div className="text-xs text-gray-500">{product.unit.name}</div>
                                  )}
                                  {issuingQty > approvedQty && (
                                    <div className="text-xs text-red-600 mt-1">Exceeds approved quantity</div>
                                  )}
                                  {issuingQty === approvedQty && (
                                    <div className="text-xs text-green-600 mt-1">Fully issued</div>
                                  )}
                                  {issuingQty < approvedQty && issuingQty > 0 && (
                                    <div className="text-xs text-orange-600 mt-1">Partial issue</div>
                                  )}
                                  {issuingQty === 0 && availableStock === 0 && (
                                    <div className="text-xs text-red-600 mt-1">No stock to issue</div>
                                  )}
                                  {isFullyFulfilled && (
                                    <div className="text-xs text-green-600 mt-1 font-semibold">✓ Fully Fulfilled</div>
                                  )}
                                </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {(() => {
                                    const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
                                    const currencySymbol = selectedCurrency?.symbol || '$';
                                    return `${currencySymbol}${unitCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  })()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {(() => {
                                    const selectedCurrency = currencies.find(c => c.id === watchedCurrencyId);
                                    const currencySymbol = selectedCurrency?.symbol || '$';
                                    return `${currencySymbol}${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  })()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {availableStock === 0 ? (
                                    <>
                                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                      <span className="text-sm text-red-600">No Stock Available</span>
                                    </>
                                  ) : canFulfill ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                      <span className="text-sm text-green-600">Can Fulfill</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                                      <span className="text-sm text-orange-600">Partial Stock</span>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

                {/* Step 2 Navigation */}
                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    onClick={handlePreviousStep}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Previous: Issuing Details
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Issuing...</span>
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        <span>Issue Stock</span>
                      </>
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

export default StoreRequestIssuerForm;
