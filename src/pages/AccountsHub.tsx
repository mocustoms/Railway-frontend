import React from 'react';
import { Search, X, BarChart3, FolderOpen } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import ContentContainer from '../components/ContentContainer';

const AccountsHub: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Search suggestions based on accounts functionality
  const suggestions = [
    { text: 'account types', icon: BarChart3 },
    { text: 'chart of accounts', icon: FolderOpen }
  ];

  // Filter suggestions based on search term
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion: { text: string; icon: any }) => {
    setSearchTerm(suggestion.text);
    setShowSuggestions(false);
    // Navigate to specific account module
    const card = accountCards.find(card => 
      card.title.toLowerCase().includes(suggestion.text.toLowerCase())
    );
    if (card) {
      navigate(card.href);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Account module cards
  const accountCards = [
    {
      id: 'account-types',
      title: 'Account Types',
      description: 'Manage account type classifications',
      icon: BarChart3,
      href: '/app-accounts/account-types',
      tags: ['Account Types', 'Classification', 'Management', 'Accounts']
    },
    {
      id: 'chart-of-accounts',
      title: 'Chart of Accounts',
      description: 'Configure your chart of accounts structure',
      icon: FolderOpen,
      href: '/app-accounts/chart-of-accounts',
      tags: ['Chart of Accounts', 'Structure', 'Configuration', 'Accounts']
    }
  ];

  // Filter account cards based on search term
  const filteredAccountCards = accountCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ContentContainer>
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
                    onClick={() => handleSuggestionClick(suggestion)}
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
          {filteredAccountCards.map((card, index) => {
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
        {searchTerm && filteredAccountCards.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Account Modules Found</h3>
            <p className="text-gray-500">
              No account modules match your search criteria. Try adjusting your search terms.
            </p>
          </div>
        )}
      </div>
    </ContentContainer>
  );
};

export default AccountsHub;
