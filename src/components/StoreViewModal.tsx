import React from 'react';
import { X, Store, MapPin, Phone, Mail, Building, Thermometer, Settings, Calendar, User } from 'lucide-react';
import { Store as StoreType } from '../types';
import StatusBadge from './StatusBadge';

interface StoreViewModalProps {
  store: StoreType;
  onClose: () => void;
}

const StoreViewModal: React.FC<StoreViewModalProps> = ({ store, onClose }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStoreTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Store Details</h3>
              <p className="text-sm text-gray-500">Complete information about this store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Store className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Store Name</label>
                  <p className="text-sm font-semibold text-gray-900">{store.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Store Type</label>
                  <p className="text-sm text-gray-900">{getStoreTypeLabel(store.store_type)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{store.location}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{store.phone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{store.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Default Currency</label>
                  <p className="text-sm text-gray-900">
                    {store.defaultCurrency ? `${store.defaultCurrency.code} (${store.defaultCurrency.symbol})` : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Default Price Category</label>
                  <p className="text-sm text-gray-900">
                    {store.defaultPriceCategory 
                      ? `${store.defaultPriceCategory.code} - ${store.defaultPriceCategory.name} (${store.defaultPriceCategory.price_change_type === 'increase' ? '+' : '-'}${store.defaultPriceCategory.percentage_change}%)` 
                      : 'N/A'}
                  </p>
                  {store.defaultPriceCategory?.description && (
                    <p className="text-xs text-gray-500 mt-1">{store.defaultPriceCategory.description}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <p className="text-sm text-gray-900">{store.address || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                  <p className="text-sm text-gray-900">{store.description || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <StatusBadge 
                    status={store.is_active ? 'Active' : 'Inactive'}
                    variant={store.is_active ? 'success' : 'error'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">GPS Coordinates</label>
                  <p className="text-sm text-gray-900">
                    {store.latitude && store.longitude 
                      ? `${store.latitude}, ${store.longitude}`
                      : 'N/A'
                    }
                  </p>
                </div>
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
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Manufacturing Facility</span>
                <StatusBadge 
                  status={store.is_manufacturing ? 'Yes' : 'No'}
                  variant={store.is_manufacturing ? 'success' : 'error'}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Can Receive Purchase Orders</span>
                <StatusBadge 
                  status={store.can_receive_po ? 'Yes' : 'No'}
                  variant={store.can_receive_po ? 'success' : 'error'}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Can Issue to Other Stores</span>
                <StatusBadge 
                  status={store.can_issue_to_store ? 'Yes' : 'No'}
                  variant={store.can_issue_to_store ? 'success' : 'error'}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Can Receive from Other Stores</span>
                <StatusBadge 
                  status={store.can_receive_from_store ? 'Yes' : 'No'}
                  variant={store.can_receive_from_store ? 'success' : 'error'}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Can Sale Products</span>
                <StatusBadge 
                  status={store.can_sale_products ? 'Yes' : 'No'}
                  variant={store.can_sale_products ? 'success' : 'error'}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Storage Facility</span>
                <StatusBadge 
                  status={store.is_storage_facility ? 'Yes' : 'No'}
                  variant={store.is_storage_facility ? 'success' : 'error'}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Temperature Controlled</span>
                <StatusBadge 
                  status={store.has_temperature_control ? 'Yes' : 'No'}
                  variant={store.has_temperature_control ? 'success' : 'error'}
                />
              </div>
            </div>
          </div>

          {/* Temperature Range */}
          {store.has_temperature_control && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Thermometer className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-medium text-gray-900">Temperature Range</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Minimum Temperature (°C)</label>
                  <p className="text-sm text-gray-900">{store.temperature_min || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Maximum Temperature (°C)</label>
                  <p className="text-sm text-gray-900">{store.temperature_max || 'N/A'}</p>
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
              <label className="block text-sm font-medium text-gray-500 mb-2">Custom Settings</label>
              {store.settings && Object.keys(store.settings).length > 0 ? (
                <pre className="bg-white border border-gray-200 rounded-lg p-4 text-sm font-mono text-gray-900 overflow-x-auto">
                  {JSON.stringify(store.settings, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">No custom settings configured</p>
              )}
            </div>
          </div>

          {/* Audit Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h4 className="text-lg font-medium text-gray-900">Audit Information</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {store.creator ? `${store.creator.first_name} ${store.creator.last_name}` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                  <p className="text-sm text-gray-900">{formatDate(store.createdAt)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated By</label>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {store.updater ? `${store.updater.first_name} ${store.updater.last_name}` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(store.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreViewModal; 