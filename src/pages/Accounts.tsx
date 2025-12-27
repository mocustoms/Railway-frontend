import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BarChart3, FolderOpen, Link, DollarSign, ArrowLeftRight, FileText, Scale, BookOpen } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './Accounts.css';

const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Search suggestions based on original EasyMauzo
  const suggestions = [
    { text: 'account types', icon: BarChart3 },
    { text: 'chart of accounts', icon: FolderOpen },
    { text: 'linked accounts', icon: Link },
    { text: 'opening balances', icon: DollarSign },
    { text: 'transfer money', icon: ArrowLeftRight },
    { text: 'record ledger entries', icon: FileText },
    { text: 'trial balance', icon: Scale },
    { text: 'general ledger', icon: BookOpen }
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
    // Navigate to specific module based on suggestion
    const card = accountCards.find(card => 
      card.title.toLowerCase().includes(suggestion.toLowerCase())
    );
    if (card) {
      navigate(card.href);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Account cards based on original EasyMauzo structure
  const accountCards = [
    {
      id: 'account-types',
      title: 'Account Types',
      description: 'Manage account type classifications',
      icon: BarChart3,
      href: '/accounts/account-types'
    },
    {
      id: 'chart-of-accounts',
      title: 'Chart of Accounts',
      description: 'Configure your chart of accounts structure',
      icon: FolderOpen,
      href: '/accounts/chart-of-accounts'
    },
    {
      id: 'linked-accounts',
      title: 'Linked Accounts',
      description: 'Manage linked account relationships',
      icon: Link,
      href: '/accounts/linked-accounts'
    },
    {
      id: 'opening-balances',
      title: 'Opening Balances',
      description: 'Set up account opening balances',
      icon: DollarSign,
      href: '/accounts/opening-balances'
    },
    {
      id: 'transfer-money',
      title: 'Transfer Money',
      description: 'Transfer funds between accounts',
      icon: ArrowLeftRight,
      href: '/accounts/transfer-money'
    },
    {
      id: 'record-ledger-entries',
      title: 'Record Ledger Entries',
      description: 'Create and manage ledger entries',
      icon: FileText,
      href: '/accounts/record-ledger-entries'
    },
    {
      id: 'trial-balance',
      title: 'Trial Balance',
      description: 'View and analyze trial balance',
      icon: Scale,
      href: '/accounts/trial-balance'
    },
    {
      id: 'general-ledger',
      title: 'General Ledger',
      description: 'Access general ledger reports',
      icon: BookOpen,
      href: '/accounts/general-ledger'
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
            placeholder="Search account modules..."
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
        {accountCards.map((card, index) => (
          <Card
            key={card.id}
            icon={card.icon}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            title={card.title}
            description={card.description}
            onClick={() => {
              navigate(card.href);
            }}
            className="product-card-animation"
            animationDelay={index}
          />
        ))}
      </GridLayout>
    </div>
  );
};

export default Accounts; 