import React from 'react';
import { Search, X, Warehouse, Calendar, Users, Gift, FileText, TrendingUp, Package } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './Reports.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { REPORT_MODULES } from '../data/reportModules';

const Reports: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which reports to show based on URL path
  const getReportsForPath = (): typeof REPORT_MODULES => {
    if (location.pathname === '/reports/stock-and-inventory') {
      return [
        {
          id: 'stock-balance',
          title: 'Stock Balance Report',
          description: 'View current stock balances by product and store location',
          icon: Warehouse,
          path: '/reports/stock-balance',
          category: 'inventory' as const,
          tags: ['stock', 'inventory', 'balance', 'warehouse', 'products'],
          color: '#8b5cf6',
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          features: ['Current stock levels', 'Store-wise breakdown', 'Product tracking', 'Balance reports']
        },
        {
          id: 'stock-balance-as-of-date',
          title: 'Stock Balance as of Date Report',
          description: 'View historical stock balances as of a specific date with detailed analysis',
          icon: Calendar,
          path: '/reports/stock-balance-as-of-date',
          category: 'inventory' as const,
          tags: ['stock', 'inventory', 'balance', 'historical', 'date'],
          color: '#06b6d4',
          gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          features: ['Historical stock levels', 'Date-based analysis', 'Store-wise breakdown', 'Trend analysis']
        }
      ];
    } else if (location.pathname === '/reports/sales') {
      return [
        {
          id: 'customer-list',
          title: 'Customer List',
          description: 'View and manage customer information and details',
          icon: Users,
          path: '/reports/sales/customer-list',
          category: 'sales' as const,
          tags: ['customer', 'sales', 'list', 'management'],
          color: '#10b981',
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          features: ['Customer details', 'Contact information', 'Sales history', 'Customer management']
        },
        {
          id: 'customer-birthdays',
          title: 'Customer Birthdays',
          description: 'Track and manage customer birthdays with upcoming birthday notifications',
          icon: Gift,
          path: '/reports/sales/customer-birthdays',
          category: 'sales' as const,
          tags: ['customer', 'birthdays', 'events', 'notifications'],
          color: '#ec4899',
          gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          features: ['Birthday tracking', 'Upcoming notifications', 'Group analysis', 'Event planning']
        },
        {
          id: 'revenue',
          title: 'Revenue Report',
          description: 'View detailed revenue transaction information with comprehensive filtering and analysis',
          icon: Calendar,
          path: '/reports/sales/revenue',
          category: 'sales' as const,
          tags: ['sales', 'transactions', 'details', 'analysis', 'reports'],
          color: '#3b82f6',
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          features: ['Transaction details', 'Multi-filter support', 'Financial analysis', 'Export capabilities']
        },
        {
          id: 'sales-details',
          title: 'Sales Details Report',
          description: 'View detailed line-item sales information showing individual products sold in invoices and orders',
          icon: Calendar,
          path: '/reports/sales/sales-details',
          category: 'sales' as const,
          tags: ['sales', 'line items', 'products', 'invoices', 'orders', 'details'],
          color: '#f59e0b',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          features: ['Line item details', 'Product breakdown', 'Invoice & order items', 'Export capabilities']
        }
      ];
    } else if (location.pathname === '/reports/account-reports') {
      return [
        {
          id: 'trial-balance',
          title: 'Trial Balance Report',
          description: 'View account balances with hierarchical structure showing Account Types, Accounts, and Leaf Accounts',
          icon: FileText,
          path: '/reports/trial-balance',
          category: 'financial' as const,
          tags: ['trial balance', 'accounts', 'financial', 'balance', 'debit', 'credit'],
          color: '#8b5cf6',
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          features: ['Account hierarchy', 'Dr/Cr balances', 'Account type grouping', 'Financial totals']
        }
      ];
    }
    return REPORT_MODULES; // Default to all reports
  };

  const currentReports = getReportsForPath();

  // Search suggestions based on available reports
  const suggestions = [
    { text: 'stock balance', icon: Warehouse },
    { text: 'stock balance as of date', icon: Calendar },
    { text: 'customer list', icon: Users },
    { text: 'customer birthdays', icon: Gift },
    { text: 'sales details', icon: Calendar },
    { text: 'account reports', icon: FileText },
    { text: 'trial balance', icon: FileText }
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
    // TODO: Navigate to specific report
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Filter report modules based on search term
  const filteredReports = currentReports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">

      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <Search className="h-5 w-5 text-gray-400 ml-3" />
          <input
            type="text"
            placeholder="Search reports..."
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
        {filteredReports.map((report, index) => {
          const IconComponent = report.icon as any;
          return (
            <Card
              key={report.id}
              title={report.title}
              description={report.description}
              icon={IconComponent}
              onClick={() => navigate(report.path)}
              className="product-card-animation"
              animationDelay={index}
            />
          );
        })}
      </GridLayout>
    </div>
  );
};

export default Reports; 