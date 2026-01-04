import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import { ReturnsOutFormData, ReturnsOutItemFormData } from '../services/returnsOutService';
import { productCatalogService } from '../services/productCatalogService';
import vendorService from '../services/vendorService';
import storeService from '../services/storeService';
import { returnReasonService } from '../services/returnReasonService';

interface ReturnsOutFormProps {
  returnsOut?: any;
  onSubmit: (data: ReturnsOutFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const schema = yup.object({
  return_date: yup.string().required('Return date is required'),
  store_id: yup.string().uuid().required('Store is required'),
  vendor_id: yup.string().uuid().required('Vendor is required'),
  return_reason_id: yup.string().uuid().optional(),
  currency_id: yup.string().uuid().optional(),
  exchange_rate: yup.number().min(0.000001).optional(),
  notes: yup.string().optional(),
  items: yup.array().of(
    yup.object({
      product_id: yup.string().uuid().required('Product is required'),
      quantity: yup.number().min(0.001).required('Quantity is required'),
      unit_price: yup.number().min(0).required('Unit price is required'),
      discount_percentage: yup.number().min(0).max(100).optional(),
      discount_amount: yup.number().min(0).optional(),
      tax_percentage: yup.number().min(0).max(100).optional(),
      tax_amount: yup.number().min(0).optional(),
      refund_amount: yup.number().min(0).optional(),
      notes: yup.string().optional()
    })
  ).min(1, 'At least one item is required')
});

const ReturnsOutForm: React.FC<ReturnsOutFormProps> = ({ returnsOut, onSubmit, onCancel, isLoading }) => {
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReturnsOutFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      return_date: returnsOut?.return_date || new Date().toISOString().split('T')[0],
      store_id: returnsOut?.store_id || '',
      vendor_id: returnsOut?.vendor_id || '',
      return_reason_id: returnsOut?.return_reason_id || '',
      currency_id: returnsOut?.currency_id || '',
      exchange_rate: returnsOut?.exchange_rate || 1,
      notes: returnsOut?.notes || '',
      items: returnsOut?.items?.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        discount_amount: item.discount_amount || 0,
        tax_percentage: item.tax_percentage || 0,
        tax_amount: item.tax_amount || 0,
        refund_amount: item.refund_amount || item.line_total || 0,
        notes: item.notes || ''
      })) || [{ product_id: '', quantity: 1, unit_price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const items = watch('items');

  // Fetch vendors, stores, return reasons
  const { data: vendors } = useQuery({
    queryKey: ['vendors-active'],
    queryFn: () => vendorService.getVendors({ page: 1, limit: 1000, status: 'active' }),
    select: (data) => data.data || []
  });

  const { data: storesResponse } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeService.getStores({ limit: 1000 }),
    select: (data) => data?.data || []
  });
  const stores = storesResponse;

  const { data: returnReasons } = useQuery({
    queryKey: ['return-reasons-active'],
    queryFn: () => returnReasonService.getAllReturnReasons(),
    select: (data) => data.filter((r: any) => r.isActive) || []
  });

  const [productSearchTerms, setProductSearchTerms] = useState<Record<number, string>>({});
  const [productOptions, setProductOptions] = useState<Record<number, any[]>>({});

  const searchProducts = async (index: number, term: string) => {
    if (term.length < 2) {
      setProductOptions(prev => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const response = await productCatalogService.getProducts(1, 50, { search: term, status: 'active' });
      setProductOptions(prev => ({ ...prev, [index]: response.products || [] }));
    } catch (error) {
      setProductOptions(prev => ({ ...prev, [index]: [] }));
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = productOptions[index]?.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.product_id`, productId);
      setValue(`items.${index}.unit_price`, product.selling_price || 0);
      setProductSearchTerms(prev => ({ ...prev, [index]: product.name }));
      setProductOptions(prev => ({ ...prev, [index]: [] }));
    }
  };

  const calculateItemTotal = (index: number) => {
    const item = items[index];
    if (!item) return 0;
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const discount = item.discount_amount || (subtotal * (item.discount_percentage || 0) / 100);
    const afterDiscount = subtotal - discount;
    const tax = item.tax_amount || (afterDiscount * (item.tax_percentage || 0) / 100);
    return afterDiscount + tax;
  };

  const handleFormSubmit = async (data: ReturnsOutFormData) => {
    const transformedData: ReturnsOutFormData = {
      ...data,
      items: data.items.map((item, index) => ({
        ...item,
        refund_amount: item.refund_amount || calculateItemTotal(index)
      }))
    };
    await onSubmit(transformedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="return_date"
          control={control}
          render={({ field }) => (
            <Input
              label="Return Date *"
              type="date"
              {...field}
              error={errors.return_date?.message}
              disabled={isLoading}
            />
          )}
        />

        <Controller
          name="store_id"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store *</label>
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                <option value="">Select Store</option>
                {stores?.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              {errors.store_id && <p className="text-sm text-red-600 mt-1">{errors.store_id.message}</p>}
            </div>
          )}
        />

        <Controller
          name="vendor_id"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                <option value="">Select Vendor</option>
                {vendors?.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.full_name}</option>
                ))}
              </select>
              {errors.vendor_id && <p className="text-sm text-red-600 mt-1">{errors.vendor_id.message}</p>}
            </div>
          )}
        />

        <Controller
          name="return_reason_id"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason</label>
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                <option value="">Select Reason</option>
                {returnReasons?.map((reason: any) => (
                  <option key={reason.id} value={reason.id}>{reason.name}</option>
                ))}
              </select>
            </div>
          )}
        />
      </div>

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <Textarea
            label="Notes"
            {...field}
            rows={3}
            disabled={isLoading}
          />
        )}
      />

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Items *</label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search product..."
                      value={productSearchTerms[index] || ''}
                      onChange={(e) => {
                        setProductSearchTerms(prev => ({ ...prev, [index]: e.target.value }));
                        searchProducts(index, e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={isLoading}
                    />
                    {productOptions[index] && productOptions[index].length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {productOptions[index].map(product => (
                          <div
                            key={product.id}
                            onClick={() => handleProductSelect(index, product.id)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {product.code} - {product.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Controller
                    name={`items.${index}.product_id`}
                    control={control}
                    render={({ field }) => <input type="hidden" {...field} />}
                  />
                  {errors.items?.[index]?.product_id && (
                    <p className="text-sm text-red-600 mt-1">{errors.items[index]?.product_id?.message}</p>
                  )}
                </div>

                <div className="col-span-6 md:col-span-2">
                  <Controller
                    name={`items.${index}.quantity`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Quantity *"
                        type="number"
                        step="0.001"
                        min="0.001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        error={errors.items?.[index]?.quantity?.message}
                        disabled={isLoading}
                      />
                    )}
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <Controller
                    name={`items.${index}.unit_price`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Unit Price *"
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        error={errors.items?.[index]?.unit_price?.message}
                        disabled={isLoading}
                      />
                    )}
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <Controller
                    name={`items.${index}.refund_amount`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Refund Amount"
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        value={field.value || calculateItemTotal(index)}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    )}
                  />
                </div>

                <div className="col-span-12 md:col-span-2 flex items-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={isLoading || fields.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-600">
                Total: {calculateItemTotal(index).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        {errors.items && typeof errors.items === 'object' && 'message' in errors.items && (
          <p className="text-sm text-red-600 mt-1">{errors.items.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} loading={isLoading}>
          {returnsOut ? 'Update' : 'Create'} Return
        </Button>
      </div>
    </form>
  );
};

export default ReturnsOutForm;

