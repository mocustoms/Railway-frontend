import React, { useState, useEffect } from 'react';
import { X, Save, Store as StoreIcon, MapPin, Phone, Mail, Building, Thermometer, Settings } from 'lucide-react';
import { Store, StoreFormData, StoreType } from '../types';
import { useQuery } from '@tanstack/react-query';
import { currencyService } from '../services/currencyService';
import { priceCategoryService } from '../services/priceCategoryService';

interface StoreFormProps {
  store?: Store | null;
  storeTypes: StoreType[];
  onSubmit: (data: StoreFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const StoreForm: React.FC<StoreFormProps> = ({
  store,
  storeTypes,
  onSubmit,
  onClose,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    store_type: 'retail_shop',
    location: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    default_currency_id: '',
    default_price_category_id: '',
    latitude: undefined,
    longitude: undefined,
    is_manufacturing: false,
    can_receive_po: false,
    can_issue_to_store: false,
    can_receive_from_store: false,
    can_sale_products: false,
    is_storage_facility: false,
    has_temperature_control: false,
    temperature_min: undefined,
    temperature_max: undefined,
    settings: {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch currencies for dropdown
  const { data: currenciesResponse } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currencyService.getCurrencies(1, 1000), // Get all currencies
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  const currencies = currenciesResponse?.currencies || [];

  // Fetch price categories for dropdown
  const { data: priceCategoriesResponse } = useQuery({
    queryKey: ['priceCategories'],
    queryFn: () => priceCategoryService.getPriceCategories({ page: 1, limit: 1000 }), // Get all active price categories
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  const priceCategories = priceCategoriesResponse?.priceCategories || [];

  // Initialize form data when editing
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        store_type: store.store_type || 'retail_shop',
        location: store.location || '',
        phone: store.phone || '',
        email: store.email || '',
        address: store.address || '',
        description: store.description || '',
        default_currency_id: store.default_currency_id || '',
        default_price_category_id: store.default_price_category_id || '',
        latitude: store.latitude || undefined,
        longitude: store.longitude || undefined,
        is_manufacturing: store.is_manufacturing || false,
        can_receive_po: store.can_receive_po || false,
        can_issue_to_store: store.can_issue_to_store || false,
        can_receive_from_store: store.can_receive_from_store || false,
        can_sale_products: store.can_sale_products || false,
        is_storage_facility: store.is_storage_facility || false,
        has_temperature_control: store.has_temperature_control || false,
        temperature_min: store.temperature_min || undefined,
        temperature_max: store.temperature_max || undefined,
        settings: store.settings || {}
      });
    }
  }, [store]);

  const handleInputChange = (field: keyof StoreFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.latitude !== undefined && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (formData.longitude !== undefined && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    if (formData.has_temperature_control) {
      if (formData.temperature_min !== undefined && formData.temperature_max !== undefined) {
        if (formData.temperature_min >= formData.temperature_max) {
          newErrors.temperature_max = 'Maximum temperature must be greater than minimum temperature';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleCapabilityChange = (capability: keyof StoreFormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [capability]: checked }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <StoreIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {store ? 'Edit Store' : 'Add New Store'}
              </h3>
              <p className="text-sm text-gray-500">
                {store ? 'Update store information' : 'Create a new store for your business'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <StoreIcon className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter store name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Type *
                </label>
                <select
                  value={formData.store_type}
                  onChange={(e) => handleInputChange('store_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {storeTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className={`w-full pl-10 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter location"
                  />
                </div>
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Currency
                </label>
                <select
                  value={formData.default_currency_id}
                  onChange={(e) => handleInputChange('default_currency_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select currency</option>
                  {currencies?.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Price Category
                </label>
                <select
                  value={formData.default_price_category_id}
                  onChange={(e) => handleInputChange('default_price_category_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select price category</option>
                  {priceCategories?.map((priceCategory) => (
                    <option key={priceCategory.id} value={priceCategory.id}>
                      {priceCategory.code} - {priceCategory.name} ({priceCategory.price_change_type === 'increase' ? '+' : '-'}{priceCategory.percentage_change}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter store description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude || ''}
                  onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.latitude ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 40.7128"
                />
                {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude || ''}
                  onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.longitude ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., -74.0060"
                />
                {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
              </div>
            </div>
          </div>

          {/* Store Capabilities */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-medium text-gray-900">Store Capabilities</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_manufacturing}
                  onChange={(e) => handleCapabilityChange('is_manufacturing', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">Manufacturing Facility</span>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_receive_po}
                  onChange={(e) => handleCapabilityChange('can_receive_po', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">Can Receive Purchase Orders</span>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_issue_to_store}
                  onChange={(e) => handleCapabilityChange('can_issue_to_store', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">Can Issue to Other Stores</span>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_receive_from_store}
                  onChange={(e) => handleCapabilityChange('can_receive_from_store', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">Can Receive from Other Stores</span>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_sale_products}
                  onChange={(e) => handleCapabilityChange('can_sale_products', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">Can Sale Products</span>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_storage_facility}
                  onChange={(e) => handleCapabilityChange('is_storage_facility', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">Storage Facility</span>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_temperature_control}
                  onChange={(e) => handleCapabilityChange('has_temperature_control', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">Temperature Controlled</span>
              </label>
            </div>
          </div>

          {/* Temperature Range */}
          {formData.has_temperature_control && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Thermometer className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-medium text-gray-900">Temperature Range</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature_min || ''}
                    onChange={(e) => handleInputChange('temperature_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., -18"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature_max || ''}
                    onChange={(e) => handleInputChange('temperature_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.temperature_max ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 25"
                  />
                  {errors.temperature_max && <p className="mt-1 text-sm text-red-600">{errors.temperature_max}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Additional Settings */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h4 className="text-lg font-medium text-gray-900">Additional Settings</h4>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Settings (JSON)
              </label>
              <textarea
                value={JSON.stringify(formData.settings, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange('settings', parsed);
                  } catch (error) {
                    // Allow invalid JSON while typing
                  }
                }}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder='{"custom_field": "value", "feature_flag": true}'
              />
              <p className="mt-1 text-sm text-gray-500">
                Advanced JSON configuration for custom features
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : (store ? 'Update Store' : 'Create Store')}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default StoreForm; 