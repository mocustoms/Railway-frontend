import React from 'react';
import { Search, X, ClipboardCheck, Boxes, Sliders, Truck, Package, BarChart3, ShoppingCart } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './InventoryManagement.css';
import { useNavigate } from 'react-router-dom';

const InventoryManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const navigate = useNavigate();

  // Search suggestions based on original EasyMauzo
  const suggestions = [
    { text: 'adjustment reasons', icon: ClipboardCheck },
    { text: 'physical inventory', icon: Boxes },
    { text: 'stock adjustment', icon: Sliders },
    { text: 'store requests', icon: Truck },
    { text: 'store issues', icon: Package },
    { text: 'store receipts', icon: ShoppingCart },
    { text: 'stock balance', icon: BarChart3 },
    { text: 'inventory report', icon: Package }
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
    // TODO: Navigate to specific module
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Inventory cards based on original EasyMauzo structure
  const inventoryCards = [
    {
      id: 'adjustment-reasons',
      title: 'Adjustment Reasons',
      description: 'Manage reasons for inventory adjustments',
      icon: ClipboardCheck,
      href: '/inventory/adjustment-reasons'
    },
    {
      id: 'physical-inventory',
      title: 'Physical Inventory',
      description: 'Perform and track physical stock counts',
      icon: Boxes,
      href: '/inventory-management/physical-inventory'
    },
    {
      id: 'stock-adjustment',
      title: 'Stock Adjustment',
      description: 'Adjust stock levels for products',
      icon: Sliders,
      href: '/inventory-management/stock-adjustments'
    },
    {
      id: 'store-requests',
      title: 'Store Requests',
      description: 'Request stock from other stores or warehouses',
      icon: Truck,
      href: '/inventory/store-requests'
    },
    {
      id: 'store-issues',
      title: 'Store Issues',
      description: 'Issue stock to stores or departments',
      icon: Package,
      href: '/inventory/store-issues'
    },
    {
      id: 'store-receipts',
      title: 'Store Receipts',
      description: 'Receive stock from other stores or warehouses',
      icon: ShoppingCart,
      href: '/inventory/store-receipts'
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
            placeholder="Search inventory modules..."
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
        {inventoryCards.map((card, index) => (
          <Card
            key={card.id}
            icon={card.icon}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
            title={card.title}
            description={card.description}
            onClick={() => navigate(card.href)}
            className="product-card-animation"
            animationDelay={index}
          />
        ))}
      </GridLayout>
    </div>
  );
};

export default InventoryManagement;