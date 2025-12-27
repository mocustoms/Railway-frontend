import React from 'react';
import { Search, X, FileText } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import './Reports.css';

const AccountReports: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const navigate = useNavigate();

  // Account reports available
  const accountReports = [
    {
      id: 'trial-balance',
      title: 'Trial Balance Report',
      description: 'View account balances with hierarchical structure showing Account Types, Accounts, and Leaf Accounts',
      icon: FileText,
      path: '/app-accounts/trial-balance',
      category: 'financial' as const,
      tags: ['trial balance', 'accounts', 'financial', 'balance', 'debit', 'credit'],
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      features: ['Account hierarchy', 'Dr/Cr balances', 'Account type grouping', 'Financial totals']
    }
  ];

  // Search suggestions
  const suggestions = [
    { text: 'trial balance', icon: FileText },
    { text: 'account reports', icon: FileText }
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
    const report = accountReports.find(r => 
      r.title.toLowerCase().includes(suggestion.toLowerCase())
    );
    if (report) {
      navigate(report.path);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Filter reports based on search term
  const filteredReports = accountReports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="content-container">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Reports</h1>
          <p className="text-gray-600 mt-1">Financial and account reporting tools</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <Search className="h-5 w-5 text-gray-400 ml-3" />
            <input
              type="text"
              placeholder="Search account reports..."
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

        {/* Reports Grid */}
        {filteredReports.length > 0 ? (
          <GridLayout cols={3} gap={6} className="product-grid-animation">
            {filteredReports.map((report, index) => {
              const IconComponent = report.icon;
              return (
                <Card
                  key={report.id}
                  icon={IconComponent}
                  iconBgColor={report.color}
                  iconColor={report.color}
                  title={report.title}
                  description={report.description}
                  onClick={() => navigate(report.path)}
                  className="product-card-animation"
                  animationDelay={index}
                />
              );
            })}
          </GridLayout>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p>No reports found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountReports;

