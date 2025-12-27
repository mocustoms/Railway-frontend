import React from 'react';
import { Customer } from '../services/customerService';
import StatusBadge from './StatusBadge';
import Button from './Button';

interface CustomerViewProps {
  customer: Customer;
  onClose: () => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ customer, onClose }) => {
  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Customer ID
          </label>
          <p className="text-gray-900 font-mono text-sm bg-gray-50 px-3 py-2 rounded-md">
            {customer.customer_id}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Full Name
          </label>
          <p className="text-gray-900 font-medium">{customer.full_name}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Customer Group
          </label>
          <p className="text-gray-900">{customer.group_name || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Default Receivable Account
          </label>
          <p className="text-gray-900">{customer.account_receivable_name || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Loyalty Card
          </label>
          <p className="text-gray-900">{customer.loyalty_card_name || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Loyalty Card Number
          </label>
          <p className="text-gray-900">{customer.loyalty_card_number || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Phone Number
          </label>
          <p className="text-gray-900">{customer.phone_number || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Email
          </label>
          <p className="text-gray-900">{customer.email || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Website
          </label>
          <p className="text-gray-900">{customer.website || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Fax
          </label>
          <p className="text-gray-900">{customer.fax || '-'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Birthday
          </label>
          <p className="text-gray-900">
            {customer.birthday ? new Date(customer.birthday).toLocaleDateString() : '-'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Status
          </label>
          <StatusBadge status={customer.is_active ? 'active' : 'inactive'} />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Account Balance
          </label>
          <p className="text-gray-900 font-medium">
            {customer.account_balance !== undefined && customer.account_balance !== null
              ? new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }).format(parseFloat(customer.account_balance.toString()))
              : '-'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Debt Balance
          </label>
          <p className="text-red-600 font-medium">
            {customer.debt_balance !== undefined && customer.debt_balance !== null
              ? new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }).format(parseFloat(customer.debt_balance.toString()))
              : '-'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Deposit Balance
          </label>
          <p className="text-green-600 font-medium">
            {customer.deposit_balance !== undefined && customer.deposit_balance !== null
              ? new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }).format(parseFloat(customer.deposit_balance.toString()))
              : '-'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Loyalty Points
          </label>
          <p className="text-blue-600 font-medium">
            {customer.loyalty_points !== undefined && customer.loyalty_points !== null
              ? new Intl.NumberFormat('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }).format(parseFloat(customer.loyalty_points.toString()))
              : '-'}
          </p>
        </div>
      </div>

      {/* Address */}
      {customer.address && (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Address
          </label>
          <p className="text-gray-900 whitespace-pre-wrap">{customer.address}</p>
        </div>
      )}

      {/* Audit Information */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Audit Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Created By
            </label>
            <p className="text-gray-900">{customer.created_by_name || 'System'}</p>
            <p className="text-xs text-gray-500">
              {customer.created_at ? new Date(customer.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Updated By
            </label>
            <p className="text-gray-900">{customer.updated_by_name || 'Never'}</p>
            <p className="text-xs text-gray-500">
              {customer.updated_at ? new Date(customer.updated_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerView;


