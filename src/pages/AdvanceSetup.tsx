import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Building, Store, Coins, ArrowLeftRight, Calendar, Hash, FileText, Shield, Database, RefreshCw, ListChecks } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './AdvanceSetup.css';

const AdvanceSetup: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Search suggestions based on original EasyMauzo
  const suggestions = [
    { text: 'company setup', icon: Building },
    { text: 'store setup', icon: Store },
    { text: 'currency', icon: Coins },
    { text: 'exchange rates', icon: ArrowLeftRight },
    { text: 'financial year', icon: Calendar },
    { text: 'auto code', icon: Hash },
    { text: 'reference number', icon: FileText },
    { text: 'security', icon: Shield },
    { text: 'database', icon: Database },
    { text: 'initialize company', icon: RefreshCw },
    { text: 'step by step company setup', icon: ListChecks }
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
    const suggestionMap: { [key: string]: string } = {
      'company setup': '/company-setup',
      'store setup': '/advance-setup/store',
      'currency': '/advance-setup/currency',
      'exchange rates': '/advance-setup/exchange-rates',
      'financial year': '/advance-setup/financial-year',
      'auto code': '/advance-setup/auto-code',
      'reference number': '/advance-setup/reference-number',
      'initialize company': '/initialize-company',
      'step by step company setup': '/manual-step-initialization'
    };
    
    const route = suggestionMap[suggestion.toLowerCase()];
    if (route) {
      navigate(route);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Setup cards based on original EasyMauzo structure
  const setupCards = [
    {
      id: 'company-setup',
      title: 'Company Setup',
      description: 'Configure company information',
      icon: Building,
      href: '/company-setup'
    },
    {
      id: 'store-setup',
      title: 'Store Setup',
      description: 'Manage store locations and settings',
      icon: Store,
      href: '/advance-setup/store'
    },
    {
      id: 'currency',
      title: 'Currency',
      description: 'Manage currencies and exchange rates',
      icon: Coins,
      href: '/advance-setup/currency'
    },
    {
      id: 'exchange-rates',
      title: 'Exchange Rates',
      description: 'Configure currency exchange rates',
      icon: ArrowLeftRight,
      href: '/advance-setup/exchange-rates'
    },
    {
      id: 'financial-year',
      title: 'Financial Year',
      description: 'Set up financial year periods',
      icon: Calendar,
      href: '/advance-setup/financial-year'
    },
    {
      id: 'auto-code',
      title: 'Auto Code Manager',
      description: 'Manage automatic code generation',
      icon: Hash,
      href: '/advance-setup/auto-code'
    },
    {
      id: 'reference-number',
      title: 'Reference Number Manager',
      description: 'Configure reference number formats',
      icon: FileText,
      href: '/advance-setup/reference-number'
    },
    {
      id: 'initialize-company',
      title: 'Initialize Company Data',
      description: 'Initialize default data for your company',
      icon: RefreshCw,
      href: '/initialize-company'
    },
    {
      id: 'step-by-step-setup',
      title: 'Step by Step Company Setup',
      description: 'Manually add company data step by step with forms',
      icon: ListChecks,
      href: '/manual-step-initialization'
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
            placeholder="Search advance setup modules..."
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
        {setupCards.map((card, index) => (
          <Card
            key={card.id}
            icon={card.icon}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
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

export default AdvanceSetup;