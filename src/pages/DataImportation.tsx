import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Upload, 
  Package, 
  Users,
  CreditCard,
  ArrowLeft,
  Receipt,
  Store
} from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './DataImportation.css';

const DataImportation: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search suggestions for Data Importation modules
  const suggestions = [
    { text: 'import products', icon: Package, href: '/import-products' },
    { text: 'import customers', icon: Users, href: '/import-customers' },
    { text: 'import customer deposits', icon: CreditCard, href: '/import-customer-deposits' },
    { text: 'import sales transactions', icon: Receipt, href: '/import-sales-transactions' },
    { text: 'import stores', icon: Store, href: '/advance-setup/store/import' },
    { text: 'data importation', icon: Upload, href: '/data-importation' }
  ];

  // Filter suggestions based on search term
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion: { text: string; href: string }) => {
    navigate(suggestion.href);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const importCards = [
    {
      id: 'import-products',
      title: 'Import Products',
      description: 'Bulk import products from Excel files',
      icon: Package,
      href: '/import-products'
    },
    {
      id: 'import-customers',
      title: 'Import Customers',
      description: 'Bulk import customer data from Excel files',
      icon: Users,
      href: '/import-customers'
    },
    {
      id: 'import-customer-deposits',
      title: 'Import Customer Deposits',
      description: 'Bulk import customer deposits from Excel files',
      icon: CreditCard,
      href: '/import-customer-deposits'
    },
    {
      id: 'import-sales-transactions',
      title: 'Import Sales Transactions',
      description: 'Bulk import sales invoices, receipts, and credit transactions from Excel files',
      icon: Receipt,
      href: '/import-sales-transactions'
    },
    {
      id: 'import-stores',
      title: 'Import Stores',
      description: 'Bulk import stores from CSV or Excel files',
      icon: Store,
      href: '/advance-setup/store/import'
    }
  ];

  return (
    <div className="space-y-6">

      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <Search className="h-5 w-5 text-gray-400 ml-3" />
          <input
            type="text"
            placeholder="Search import modules..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 px-3 py-2 border-0 focus:ring-0 focus:outline-none"
            autoComplete="off"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => {
              const IconComponent = suggestion.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150"
                >
                  <IconComponent className="h-4 w-4 text-gray-500 mr-3" />
                  <span className="text-gray-900">{suggestion.text}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Import Modules Grid */}
      <GridLayout cols={3}>
        {importCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card 
              key={card.id} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(card.href)}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700">
                      Start Import
                    </span>
                    <ArrowLeft className="h-4 w-4 text-blue-600 transform rotate-180 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </GridLayout>
    </div>
  );
};

export default DataImportation;
