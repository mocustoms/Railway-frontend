import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Settings, Database, History, Shield, CreditCard, DollarSign, Printer, Percent, Activity, Lock, Building2, Server, Clock, Link } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './Administrative.css';

const Administrative: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Search suggestions based on original EasyMauzo
  const suggestions = [
    { text: 'system settings', icon: Settings },
    { text: 'database configuration', icon: Server },
    { text: 'scheduler management', icon: Clock },
    { text: 'data backup', icon: Database },
    { text: 'audit trail', icon: History },
    { text: 'security', icon: Shield },
    { text: 'payment types', icon: CreditCard },
    { text: 'payment methods', icon: DollarSign },
    { text: 'bank details', icon: Building2 },
    { text: 'printer setup', icon: Printer },
    { text: 'tax codes', icon: Percent },
    { text: 'linked accounts', icon: Link },
    { text: 'user activity', icon: Activity },
    { text: 'access control', icon: Lock }
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
    
    // Navigate to specific module if it matches
    if (suggestion.toLowerCase().includes('database configuration')) {
      navigate('/database-settings');
    } else if (suggestion.toLowerCase().includes('scheduler management')) {
      navigate('/scheduler-management');
    } else if (suggestion.toLowerCase().includes('linked accounts')) {
      navigate('/linked-accounts');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Administrative cards based on original EasyMauzo structure
  const adminCards = [
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'System parameters',
      icon: Settings,
      href: '/administrative/system-settings'
    },
    {
      id: 'database-settings',
      title: 'Database Configuration',
      description: 'Configure database connection settings',
      icon: Server,
      href: '/database-settings',
      requiresSystemAdmin: true
    },
    {
      id: 'scheduler-management',
      title: 'Scheduler Management',
      description: 'Manage automated invoice and birthday bonus tasks',
      icon: Clock,
      href: '/scheduler-management',
      requiresSystemAdmin: true
    },
    {
      id: 'data-backup',
      title: 'Data Backup & Restore',
      description: 'Database backups',
      icon: Database,
      href: '/administrative/data-backup'
    },
    {
      id: 'audit-trail',
      title: 'Audit Trail',
      description: 'View system activity and user actions',
      icon: History,
      href: '/administrative/audit-trail'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Manage security settings',
      icon: Shield,
      href: '/administrative/security'
    },
    {
      id: 'payment-types',
      title: 'Payment Types',
      description: 'Configure accepted payment methods',
      icon: CreditCard,
      href: '/payment-types'
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      description: 'Manage payment method configurations',
      icon: DollarSign,
      href: '/payment-methods'
    },
    {
      id: 'bank-details',
      title: 'Bank Details',
      description: 'Manage bank details and branch information',
      icon: Building2,
      href: '/bank-details'
    },
    {
      id: 'printer-setup',
      title: 'Printer Setup',
      description: 'Manage and configure receipt printers',
      icon: Printer,
      href: '/administrative/printer-setup'
    },
    {
      id: 'tax-codes',
      title: 'Tax Codes',
      description: 'Configure tax rates and codes',
      icon: Percent,
      href: '/tax-codes'
    },
    {
      id: 'linked-accounts',
      title: 'Linked Accounts',
      description: 'Link accounts for POS and payment systems',
      icon: Link,
      href: '/linked-accounts'
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
            placeholder="Search administrative modules..."
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
        {adminCards
          .filter(card => !card.requiresSystemAdmin || user?.isSystemAdmin)
          .map((card, index) => (
            <Card
              key={card.id}
              icon={card.icon}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              title={card.title}
              description={card.description}
              onClick={() => {
                navigate(card.href);
              }}
              animationDelay={index}
              className="product-card-animation"
            />
          ))}
      </GridLayout>
    </div>
  );
};

export default Administrative;