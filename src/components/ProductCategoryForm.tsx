import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Palette } from 'lucide-react';
import { ProductCategory, ProductCategoryFormData, TaxCode, Account } from '../types';
import { defaultFormData, validationRules, colorPresets } from '../data/productCategoryModules';
import Button from '../components/Button';

interface ProductCategoryFormProps {
  productCategory?: ProductCategory | null;
  taxCodes: TaxCode[];
  accounts: Account[];
  isLoading?: boolean;
  onSubmit: (data: ProductCategoryFormData) => Promise<void>;
  onCancel: () => void;
}

const ProductCategoryForm: React.FC<ProductCategoryFormProps> = ({
  productCategory,
  taxCodes,
  accounts,
  isLoading = false,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductCategoryFormData>({
    defaultValues: defaultFormData,
  });

  const selectedColor = watch('color');
  const isActiveValue = watch('is_active');

  useEffect(() => {
    if (productCategory) {
      reset({
        name: productCategory.name,
        description: productCategory.description || '',
        tax_code_id: productCategory.tax_code_id || '',
        purchases_tax_id: productCategory.purchases_tax_id || '',
        cogs_account_id: productCategory.cogs_account_id || '',
        income_account_id: productCategory.income_account_id || '',
        asset_account_id: productCategory.asset_account_id || '',
        is_active: productCategory.is_active !== undefined ? productCategory.is_active : true,
        color: productCategory.color || '#2196f3',
      });
    } else {
      reset(defaultFormData);
    }
  }, [productCategory, reset]);

  const handleFormSubmit = async (data: ProductCategoryFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {productCategory ? 'Edit Product Category' : 'Add New Product Category'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code - Display only when editing */}
            {productCategory && (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Category Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={productCategory.code}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">Code is automatically generated</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                {...register('name', validationRules.name)}
                type="text"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter category name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description', validationRules.description)}
                id="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter category description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Color Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette className="h-4 w-4 inline mr-1" />
                Category Color
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                {...register('color', validationRules.color)}
                type="text"
                placeholder="#2196f3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.color && (
                <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
              )}
            </div>

            {/* Tax Code */}
            <div>
              <label htmlFor="tax_code_id" className="block text-sm font-medium text-gray-700 mb-2">
                Tax Code
              </label>
              <select
                {...register('tax_code_id')}
                id="tax_code_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Tax Code</option>
                {taxCodes.map((taxCode) => (
                  <option key={taxCode.id} value={taxCode.id}>
                    {taxCode.name} ({taxCode.rate}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Purchases Tax */}
            <div>
              <label htmlFor="purchases_tax_id" className="block text-sm font-medium text-gray-700 mb-2">
                Purchases Tax
              </label>
              <select
                {...register('purchases_tax_id')}
                id="purchases_tax_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Purchases Tax</option>
                {taxCodes.map((taxCode) => (
                  <option key={taxCode.id} value={taxCode.id}>
                    {taxCode.name} ({taxCode.rate}%)
                  </option>
                ))}
              </select>
            </div>

            {/* COGS Account */}
            <div>
              <label htmlFor="cogs_account_id" className="block text-sm font-medium text-gray-700 mb-2">
                COGS Account
              </label>
              <select
                {...register('cogs_account_id')}
                id="cogs_account_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select COGS Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Income Account */}
            <div>
              <label htmlFor="income_account_id" className="block text-sm font-medium text-gray-700 mb-2">
                Income Account
              </label>
              <select
                {...register('income_account_id')}
                id="income_account_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Income Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Account */}
            <div>
              <label htmlFor="asset_account_id" className="block text-sm font-medium text-gray-700 mb-2">
                Asset Account
              </label>
              <select
                {...register('asset_account_id')}
                id="asset_account_id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Asset Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="is_active"
                value={isActiveValue === true ? 'true' : 'false'}
                onChange={(e) => {
                  const boolValue = e.target.value === 'true';
                  setValue('is_active', boolValue, { shouldValidate: true });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
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
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              {productCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ProductCategoryForm;
