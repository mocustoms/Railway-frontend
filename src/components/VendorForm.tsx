import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Package, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import { VendorFormData } from '../services/vendorService';
import vendorService from '../services/vendorService';
import { productCatalogService } from '../services/productCatalogService';

interface VendorFormProps {
  initialValues?: Partial<VendorFormData>;
  vendorGroups: { id: string; group_name: string; is_default?: boolean; account_payable_id?: string; account_payable_name?: string }[];
  onSubmit: (data: VendorFormData) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
  vendorId?: string; // For product assignment when editing
}

const schema = yup.object({
  vendor_group_id: yup.string().uuid().required('Vendor group is required'),
  full_name: yup.string().required('Full name is required'),
  address: yup.string().optional(),
  fax: yup.string().optional(),
  phone_number: yup.string().optional(),
  email: yup.string().email('Invalid email').optional(),
  website: yup.string().url('Invalid website URL').optional(),
  is_active: yup.boolean().optional()
}).required();

const VendorForm: React.FC<VendorFormProps> = ({ initialValues, vendorGroups, onSubmit, onCancel, isLoading, vendorId }) => {
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [assignedProducts, setAssignedProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isAssigningProducts, setIsAssigningProducts] = useState(false);

  // Load assigned products when editing
  useEffect(() => {
    if (vendorId) {
      vendorService.getVendorProducts(vendorId).then(products => {
        setAssignedProducts(products);
        setSelectedProductIds(products.map(p => p.id));
      }).catch(() => {});
    }
  }, [vendorId]);

  // Search products
  const { data: searchProducts, isLoading: isSearchingProducts } = useQuery({
    queryKey: ['products-search', productSearchTerm],
    queryFn: () => productCatalogService.getProducts(1, 50, { search: productSearchTerm, status: 'all' }, { column: 'name', direction: 'asc' }),
    enabled: productSearchTerm.length > 2 && !!vendorId,
    staleTime: 30000
  });

  const handleAssignProducts = async () => {
    if (!vendorId || selectedProductIds.length === 0) return;
    
    try {
      setIsAssigningProducts(true);
      const newProductIds = selectedProductIds.filter(id => !assignedProducts.some(p => p.id === id));
      if (newProductIds.length > 0) {
        await vendorService.assignProducts(vendorId, newProductIds);
        const updated = await vendorService.getVendorProducts(vendorId);
        setAssignedProducts(updated);
        toast.success(`Assigned ${newProductIds.length} product(s) to vendor`);
      }
      setProductSearchTerm('');
      setSelectedProductIds(assignedProducts.map(p => p.id));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign products');
    } finally {
      setIsAssigningProducts(false);
    }
  };

  const handleUnassignProduct = async (productId: string) => {
    if (!vendorId) return;
    
    try {
      await vendorService.unassignProduct(vendorId, productId);
      setAssignedProducts(prev => prev.filter(p => p.id !== productId));
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
      toast.success('Product unassigned from vendor');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to unassign product');
    }
  };
  const { control, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm<VendorFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      vendor_group_id: initialValues?.vendor_group_id || '',
      full_name: initialValues?.full_name || '',
      address: initialValues?.address || '',
      default_payable_account_id: initialValues?.default_payable_account_id,
      fax: initialValues?.fax || '',
      phone_number: initialValues?.phone_number || '',
      email: initialValues?.email || '',
      website: initialValues?.website || '',
      is_active: initialValues?.is_active ?? true
    }
  });

  const handleGroupChange = (groupId: string) => {
    setValue('vendor_group_id', groupId);
    const found = vendorGroups.find(g => g.id === groupId);
    if (found?.account_payable_id) {
      setValue('default_payable_account_id', found.account_payable_id);
    }
  };

  // Auto-select default vendor group on create (no initialValues provided)
  useEffect(() => {
    if (!initialValues?.vendor_group_id && vendorGroups && vendorGroups.length > 0) {
      const defaultGroup = vendorGroups.find(g => g.is_default);
      if (defaultGroup) {
        setValue('vendor_group_id', defaultGroup.id);
        if (defaultGroup.account_payable_id) {
          setValue('default_payable_account_id', defaultGroup.account_payable_id);
        }
      }
    }
  }, [vendorGroups, initialValues, setValue]);

  const selectedGroupId = watch('vendor_group_id');
  const selectedGroup = vendorGroups.find(g => g.id === selectedGroupId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vendor Group */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vendor Group *
          </label>
          <Controller
            name="vendor_group_id"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                onChange={(e) => {
                  field.onChange(e);
                  handleGroupChange(e.target.value);
                }}
                disabled={isLoading}
              >
                <option value="">Select Vendor Group</option>
                {vendorGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.group_name}</option>
                ))}
              </select>
            )}
          />
          {errors.vendor_group_id && (
            <p className="mt-1 text-sm text-red-600">{errors.vendor_group_id.message}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="md:col-span-1">
          <Controller
            name="full_name"
            control={control}
            render={({ field }) => (
              <Input
                label="Full Name *"
                {...field}
                placeholder="Enter vendor full name"
                error={errors.full_name?.message}
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Textarea
                label="Address"
                {...field}
                placeholder="Enter vendor address"
                rows={3}
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Default Payable Account */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Payable Account
          </label>
          <input 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed" 
            disabled 
            value={selectedGroup?.account_payable_name || 'Not Set'} 
          />
        </div>

        {/* Fax */}
        <div className="md:col-span-1">
          <Controller
            name="fax"
            control={control}
            render={({ field }) => (
              <Input
                label="Fax"
                {...field}
                placeholder="Enter fax number"
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Phone Number */}
        <div className="md:col-span-1">
          <Controller
            name="phone_number"
            control={control}
            render={({ field }) => (
              <Input
                label="Phone Number"
                {...field}
                placeholder="Enter phone number"
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Email */}
        <div className="md:col-span-1">
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                label="Email"
                type="email"
                {...field}
                placeholder="Enter email address"
                error={errors.email?.message}
                disabled={isLoading}
              />
            )}
          />
        </div>

        {/* Website */}
        <div className="md:col-span-1">
          <Controller
            name="website"
            control={control}
            render={({ field }) => (
              <Input
                label="Website"
                {...field}
                placeholder="Enter website URL"
                disabled={isLoading}
              />
            )}
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                disabled={isLoading}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                <div className={`w-12 h-6 rounded-full transition-colors ${
                  field.value ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    field.value ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
                <span className="text-sm font-medium">
                  {field.value ? 'Active' : 'Inactive'}
                </span>
              </button>
              <span className="text-xs text-gray-500">
                {field.value 
                  ? 'Vendor is active and can be used in transactions' 
                  : 'Vendor is inactive and cannot be used in transactions'
                }
              </span>
            </div>
          )}
        />
      </div>

      {/* Product Assignment Section - Only show when editing */}
      {vendorId && (
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Products</h3>
          <p className="text-sm text-gray-600 mb-4">
            Assign products to this vendor. These products will be available when filtering by vendor during purchases.
          </p>

          {/* Product Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name or code (min 3 characters)..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isLoading || isAssigningProducts}
              />
            </div>

            {/* Search Results */}
            {productSearchTerm.length > 2 && searchProducts?.products && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {searchProducts.products.filter((p: any) => !assignedProducts.some(ap => ap.id === p.id)).map((product: any) => (
                  <div
                    key={product.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedProductIds.includes(product.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (selectedProductIds.includes(product.id)) {
                        setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                      } else {
                        setSelectedProductIds(prev => [...prev, product.id]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.code}</p>
                      </div>
                      {selectedProductIds.includes(product.id) && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {searchProducts.products.filter((p: any) => !assignedProducts.some(ap => ap.id === p.id)).length === 0 && (
                  <div className="p-3 text-center text-gray-500">No products found</div>
                )}
              </div>
            )}

            {/* Assign Button */}
            {selectedProductIds.length > assignedProducts.length && (
              <Button
                type="button"
                onClick={handleAssignProducts}
                disabled={isAssigningProducts || isLoading}
                loading={isAssigningProducts}
                className="mt-2"
              >
                Assign {selectedProductIds.filter(id => !assignedProducts.some(ap => ap.id === id)).length} Product(s)
              </Button>
            )}
          </div>

          {/* Assigned Products List */}
          {assignedProducts.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Currently Assigned ({assignedProducts.length})</h4>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {assignedProducts.map(product => (
                  <div
                    key={product.id}
                    className="p-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.code}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnassignProduct(product.id)}
                      disabled={isLoading || isAssigningProducts}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Unassign product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No products assigned to this vendor</p>
              <p className="text-sm mt-1">Search and select products above to assign them</p>
            </div>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
          disabled={!isValid || isLoading}
          loading={isLoading}
        >
          {initialValues ? 'Update' : 'Create'} Vendor
        </Button>
      </div>
    </form>
  );
};

export default VendorForm;

