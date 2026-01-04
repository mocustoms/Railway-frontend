import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Vendor } from '../services/vendorService';
import vendorService from '../services/vendorService';
import StatusBadge from './StatusBadge';
import Button from './Button';

interface VendorViewProps {
  vendor: Vendor;
  onClose: () => void;
}

const VendorView: React.FC<VendorViewProps> = ({ vendor, onClose }) => {
  const [assignedProducts, setAssignedProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);

  // Load assigned products
  useEffect(() => {
    if (vendor.id) {
      vendorService.getVendorProducts(vendor.id).then(products => {
        setAssignedProducts(products);
      }).catch(() => {});
    }
  }, [vendor.id]);
  return (
    <div className="space-y-6">
      {/* Vendor Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Vendor ID
          </label>
          <p className="text-gray-900 font-mono text-sm bg-gray-50 px-3 py-2 rounded-md">
            {vendor.vendor_id}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Full Name
          </label>
          <p className="text-gray-900 font-medium">{vendor.full_name}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Vendor Group
          </label>
          <p className="text-gray-900">{vendor.group_name || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Default Payable Account
          </label>
          <p className="text-gray-900">{vendor.account_payable_name || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Phone Number
          </label>
          <p className="text-gray-900">{vendor.phone_number || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Email
          </label>
          <p className="text-gray-900">{vendor.email || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Website
          </label>
          <p className="text-gray-900">{vendor.website || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Fax
          </label>
          <p className="text-gray-900">{vendor.fax || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Status
          </label>
          <StatusBadge status={vendor.is_active ? 'active' : 'inactive'} />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Account Balance
          </label>
          <p className="text-gray-900 font-medium">
            {vendor.account_balance !== undefined && vendor.account_balance !== null
              ? new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }).format(parseFloat(vendor.account_balance.toString()))
              : '-'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Debt Balance
          </label>
          <p className="text-red-600 font-medium">
            {vendor.debt_balance !== undefined && vendor.debt_balance !== null
              ? new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }).format(parseFloat(vendor.debt_balance.toString()))
              : '-'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Deposit Balance
          </label>
          <p className="text-green-600 font-medium">
            {vendor.deposit_balance !== undefined && vendor.deposit_balance !== null
              ? new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }).format(parseFloat(vendor.deposit_balance.toString()))
              : '-'}
          </p>
        </div>
      </div>

      {/* Address */}
      {vendor.address && (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Address
          </label>
          <p className="text-gray-900 whitespace-pre-wrap">{vendor.address}</p>
        </div>
      )}

      {/* Assigned Products */}
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">
          Assigned Products ({assignedProducts.length})
        </label>
        {assignedProducts.length > 0 ? (
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
            {assignedProducts.map(product => (
              <div
                key={product.id}
                className="p-3 border-b border-gray-100 flex items-center space-x-3"
              >
                <Package className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.code}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-md">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No products assigned to this vendor</p>
          </div>
        )}
      </div>

      {/* Audit Information */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Audit Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Created By
            </label>
            <p className="text-gray-900">{vendor.created_by_name || 'System'}</p>
            <p className="text-xs text-gray-500">
              {vendor.created_at ? new Date(vendor.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Updated By
            </label>
            <p className="text-gray-900">{vendor.updated_by_name || 'Never'}</p>
            <p className="text-xs text-gray-500">
              {vendor.updated_at ? new Date(vendor.updated_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorView;

