import React from 'react';
import { Search, X, ShoppingCart, CreditCard, Receipt, Users, FileText, UserCheck, Gift, DollarSign, RotateCcw, FileText as FileTextIcon } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './Sales.css';
import { useNavigate } from 'react-router-dom';

const Sales: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const navigate = useNavigate();

  // Search suggestions based on sales functionality
  const suggestions = [
    { text: 'sales transactions', icon: CreditCard },
    { text: 'sales receipts', icon: Receipt },
    { text: 'customer management', icon: Users },
    { text: 'customer groups', icon: Users },
    { text: 'sales invoices', icon: FileText },
    { text: 'sales agents', icon: UserCheck },
    { text: 'loyalty cards', icon: Gift },
    { text: 'customer deposits', icon: DollarSign },
    { text: 'return reasons', icon: RotateCcw },
    { text: 'proforma invoices', icon: FileTextIcon },
    { text: 'sales orders', icon: FileTextIcon }
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
    // TODO: Navigate to specific sales module
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Sales module cards
  const salesCards = [
    {
      id: 'proforma-invoices',
      title: 'Proforma Invoices',
      description: 'Create and manage proforma invoices for customers',
      icon: FileTextIcon,
      href: '/sales/proforma-invoices',
      tags: ['Invoices', 'Proforma', 'Customers', 'Quotes']
    },
    {
      id: 'sales-orders',
      title: 'Sales Orders',
      description: 'Create and manage sales orders for customers',
      icon: ShoppingCart,
      href: '/sales/sales-orders',
      tags: ['Orders', 'Sales', 'Customers', 'Fulfillment']
    },
    {
      id: 'return-reasons',
      title: 'Return Reasons',
      description: 'Manage reasons for product returns and refunds',
      icon: RotateCcw,
      href: '/sales/return-reasons',
      tags: ['Returns', 'Refunds', 'Exchanges', 'Management']
    },
    {
      id: 'customer-deposits',
      title: 'Customer Deposits',
      description: 'Manage customer deposits and account balances',
      icon: DollarSign,
      href: '/customer-deposits',
      tags: ['Deposits', 'Account Balance', 'Payments', 'Customer Accounts']
    },
    {
      id: 'sales-agents',
      title: 'Sales Agents',
      description: 'Manage sales agents and their information',
      icon: UserCheck,
      href: '/sales/agents',
      tags: ['Agents', 'Management', 'Team']
    },
    {
      id: 'customer-groups',
      title: 'Customer Groups',
      description: 'Manage customer groups and their settings',
      icon: Users,
      href: '/sales/customer-groups',
      tags: ['Groups', 'Management', 'Settings']
    },
    {
      id: 'loyalty-cards',
      title: 'Loyalty Cards',
      description: 'Manage customer loyalty cards and rewards program',
      icon: Gift,
      href: '/sales/loyalty-cards',
      tags: ['Loyalty', 'Rewards', 'Points', 'Customer Retention']
    },
    {
      id: 'sales-transactions',
      title: 'Sales Transactions',
      description: 'View and manage all sales transaction records',
      icon: CreditCard,
      href: '/sales/transactions',
      tags: ['Transactions', 'History', 'Records']
    },
    {
      id: 'sales-receipts',
      title: 'Sales Receipts',
      description: 'View and manage payment receipts for sales invoices',
      icon: Receipt,
      href: '/sales/receipts',
      tags: ['Receipts', 'Payments', 'Invoices', 'Documents']
    },
    {
      id: 'customer-management',
      title: 'Customer Management',
      description: 'Manage customer information and relationships',
      icon: Users,
      href: '/sales/customers',
      tags: ['Customers', 'CRM', 'Relationships']
    },
    {
      id: 'sales-invoices',
      title: 'Sales Invoices',
      description: 'Create and manage sales invoices and billing',
      icon: FileText,
      href: '/sales/sales-invoices',
      tags: ['Invoices', 'Billing', 'Documents']
    }
  ];

  // Filter sales cards based on search term
  const filteredSalesCards = salesCards.filter(card =>
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
            placeholder="Search sales modules..."
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
        {filteredSalesCards.map((card, index) => {
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
      {searchTerm && filteredSalesCards.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Modules Found</h3>
          <p className="text-gray-500">
            No sales modules match your search criteria. Try adjusting your search terms.
          </p>
        </div>
      )}
    </div>
  );
};

export default Sales;
