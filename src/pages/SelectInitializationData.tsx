import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Database, Loader2 } from 'lucide-react';
import companyService from '../services/companyService';
import toast from 'react-hot-toast';

interface TableInfo {
  key: string;
  name: string;
  description: string;
  count: number;
}

const AVAILABLE_TABLES: TableInfo[] = [
  // Core foundation data (recommended order)
  { key: 'financial_years', name: 'Financial Year', description: 'Current year financial period', count: 1 },
  { key: 'currencies', name: 'Currencies', description: 'Currency configurations', count: 2 },
  { key: 'account_types', name: 'Account Types', description: 'Account type classifications', count: 5 },
  { key: 'accounts', name: 'Accounts', description: 'Chart of accounts structure', count: 43 },
  { key: 'price_categories', name: 'Price Categories', description: 'Pricing tiers', count: 4 },
  { key: 'exchange_rates', name: 'Exchange Rates', description: 'Currency exchange rates', count: 2 },
  
  // Secondary data
  { key: 'stores', name: 'Stores', description: 'Default store locations', count: 2 },
  { key: 'customer_groups', name: 'Customer Groups', description: 'Default customer categories', count: 3 },
  { key: 'linked_accounts', name: 'Linked Accounts', description: 'Account relationships', count: 12 },
  { key: 'product_categories', name: 'Product Categories', description: 'Product classification', count: 7 },
  { key: 'packaging', name: 'Packaging', description: 'Packaging units', count: 2 },
  { key: 'tax_codes', name: 'Tax Codes', description: 'Tax rate configurations', count: 5 },
  { key: 'adjustment_reasons', name: 'Adjustment Reasons', description: 'Stock adjustment reasons', count: 2 },
  { key: 'return_reasons', name: 'Return Reasons', description: 'Product return reasons', count: 3 },
  { key: 'payment_methods', name: 'Payment Methods', description: 'Payment method types', count: 2 },
  { key: 'payment_types', name: 'Payment Types', description: 'Payment type configurations', count: 2 },
];

const SelectInitializationData: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [isInitializing, setIsInitializing] = useState(false);

  const toggleTable = (tableKey: string) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableKey)) {
      newSelected.delete(tableKey);
    } else {
      newSelected.add(tableKey);
    }
    setSelectedTables(newSelected);
  };

  const selectAll = () => {
    setSelectedTables(new Set(AVAILABLE_TABLES.map(t => t.key)));
  };

  const deselectAll = () => {
    setSelectedTables(new Set());
  };

  const handleInitialize = async () => {
    if (selectedTables.size === 0) {
      toast.error('Please select at least one data type to initialize');
      return;
    }

    try {
      setIsInitializing(true);
      const tables = Array.from(selectedTables);
      const result = await companyService.initializeCompany(tables);

      if (result.success) {
        // Show detailed success message
        const successMsg = result.failed > 0 
          ? `Initialization completed! ${result.successful} records created, ${result.failed} skipped.`
          : `Selected data initialized successfully! ${result.successful} records created.`;
        toast.success(successMsg);
        
        // Show details if there were failures
        if (result.failed > 0 && result.details) {
          const failedTables = Object.entries(result.details)
            .filter(([_, detail]: [string, any]) => detail.errors && detail.errors.length > 0)
            .map(([table]) => table);
          if (failedTables.length > 0) {
            toast(`Some records were skipped in: ${failedTables.slice(0, 3).join(', ')}${failedTables.length > 3 ? '...' : ''}`, {
              icon: '⚠️',
              duration: 5000
            });
          }
        }
        
        setTimeout(() => {
          navigate('/app-main');
        }, result.failed > 0 ? 4000 : 2000);
      } else {
        toast.error(result.message || 'Initialization failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initialize data';
      toast.error(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Database className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Initial Data
          </h1>
          <p className="text-gray-600">
            Choose which data you want TenZen to initialize for your company
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedTables.size} of {AVAILABLE_TABLES.length} selected
          </div>
          <div className="space-x-2">
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={deselectAll}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-h-96 overflow-y-auto">
          {AVAILABLE_TABLES.map((table) => {
            const isSelected = selectedTables.has(table.key);
            return (
              <div
                key={table.key}
                onClick={() => toggleTable(table.key)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{table.name}</h3>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{table.description}</p>
                    <p className="text-xs text-gray-500">
                      {table.count} {table.count === 1 ? 'record' : 'records'}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleSkip}
            disabled={isInitializing}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for Now
          </button>
          <button
            onClick={handleInitialize}
            disabled={isInitializing || selectedTables.size === 0}
            className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Initializing...</span>
              </>
            ) : (
              <span>Initialize Selected Data</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectInitializationData;

