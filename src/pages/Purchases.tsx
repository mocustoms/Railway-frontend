import React from 'react';
import { Search, X, ShoppingBag, Users, FileText, Truck, Receipt, RotateCcw, CreditCard } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './Purchases.css';
import { useNavigate } from 'react-router-dom';

const Purchases: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const navigate = useNavigate();

  // Search suggestions based on purchases functionality
  const suggestions = [
    { text: 'vendor groups', icon: Users },
    { text: 'vendors', icon: Users },
    { text: 'purchasing orders', icon: Truck },
    { text: 'purchase invoices', icon: FileText },
    { text: 'invoice payments', icon: Receipt },
    { text: 'returns out reasons', icon: RotateCcw },
    { text: 'returns out', icon: RotateCcw }
  ];

  // Filter suggestions based on search term
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    // TODO: Navigate to specific purchases module
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Purchases module cards
  const purchasesCards = [
    {
      id: 'vendor-groups',
      title: 'Vendor Groups',
      description: 'Manage vendor groups and their settings',
      icon: Users,
      href: '/purchases/vendor-groups',
      tags: ['Groups', 'Management', 'Settings', 'Vendors']
    },
    {
      id: 'vendors',
      title: 'Vendors',
      description: 'Manage vendor information and relationships',
      icon: Users,
      href: '/purchases/vendors',
      tags: ['Vendors', 'Suppliers', 'Management', 'Relationships']
    },
    {
      id: 'purchasing-order',
      title: 'Purchasing Order',
      description: 'Create and manage purchase orders from vendors',
      icon: Truck,
      href: '/purchases/purchasing-order',
      tags: ['Orders', 'Purchases', 'Vendors', 'Fulfillment']
    },
    {
      id: 'invoice',
      title: 'Purchase Invoice',
      description: 'Create and manage purchase invoices and billing',
      icon: FileText,
      href: '/purchases/invoice',
      tags: ['Invoices', 'Billing', 'Documents', 'Purchases']
    },
    {
      id: 'invoice-payments',
      title: 'Invoice Payments',
      description: 'View and manage payment records for purchase invoices',
      icon: Receipt,
      href: '/purchases/invoice-payments',
      tags: ['Payments', 'Receipts', 'Invoices', 'Documents']
    },
    {
      id: 'returns-out-reasons',
      title: 'Returns Out Reasons',
      description: 'Manage reasons for product returns to vendors',
      icon: RotateCcw,
      href: '/purchases/returns-out-reasons',
      tags: ['Returns', 'Refunds', 'Exchanges', 'Management']
    },
    {
      id: 'returns-out',
      title: 'Returns Out',
      description: 'Manage product returns to vendors',
      icon: RotateCcw,
      href: '/purchases/returns-out',
      tags: ['Returns', 'Vendors', 'Products', 'Management']
    }
  ];

  // Filter purchases cards based on search term
  const filteredPurchasesCards = purchasesCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">

      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <Search className="h-5 w-5 text-gray-400 ml-3" />
          <input
            type="text"
            placeholder="Search purchases modules..."
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {filteredSuggestions.map((suggestion, index) => {
              const IconComponent = suggestion.icon;
              return (
                <div
                  key={suggestion.text}
                  className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion.text)}
                >
                  <IconComponent className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{suggestion.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overview Section */}
      <GridLayout cols={4} gap={6} className="product-grid-animation">
        {filteredPurchasesCards.map((card, index) => {
          const IconComponent = card.icon as any;
          return (
            <Card
              key={card.id}
              title={card.title}
              description={card.description}
              icon={IconComponent}
              onClick={() => navigate(card.href)}
              className="product-card-animation"
              animationDelay={index}
            />
          );
        })}
      </GridLayout>

      {/* No Results */}
      {searchTerm && filteredPurchasesCards.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchases Modules Found</h3>
          <p className="text-gray-500">
            No purchases modules match your search criteria. Try adjusting your search terms.
          </p>
        </div>
      )}
    </div>
  );
};

export default Purchases;

