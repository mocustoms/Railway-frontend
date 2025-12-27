import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import customerService from '../../services/customerService';
import { Customer } from '../../services/customerService';
import { Search, User, UserPlus, X } from 'lucide-react';

interface POSCustomerSelectProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCreateCustomer?: () => void;
}

const POSCustomerSelect: React.FC<POSCustomerSelectProps> = ({
  selectedCustomer,
  onSelectCustomer,
  onCreateCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['pos-customers', searchTerm],
    queryFn: () => customerService.getCustomers({
      page: 1,
      limit: 20,
      search: searchTerm,
      status: 'active'
    }),
    enabled: showDropdown && searchTerm.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const customers = customersData?.data || [];

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      {selectedCustomer ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">{selectedCustomer.full_name}</p>
              {selectedCustomer.phone_number && (
                <p className="text-xs text-gray-600">{selectedCustomer.phone_number}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {onCreateCustomer && (
              <button
                onClick={onCreateCustomer}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                title="Add New Customer"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && searchTerm.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
              ) : customers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No customers found
                </div>
              ) : (
                customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelect(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="font-medium text-sm text-gray-900">{customer.full_name}</p>
                    {customer.phone_number && (
                      <p className="text-xs text-gray-500">{customer.phone_number}</p>
                    )}
                    {customer.email && (
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default POSCustomerSelect;

