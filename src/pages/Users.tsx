import React from 'react';
import { Search, X, Users2, Shield, UserCheck, Clock, Activity, Settings } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './Users.css';
import { useNavigate } from 'react-router-dom';

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const navigate = useNavigate();

  // Search suggestions based on original EasyMauzo
  const suggestions = [
    { text: 'active users', icon: UserCheck },
    { text: 'admin users', icon: Shield },
    { text: 'pending users', icon: Clock },
    { text: 'user activity', icon: Activity },
    { text: 'user management', icon: Users2 },
    { text: 'user roles', icon: Shield },
    { text: 'user settings', icon: Settings }
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
    if (suggestion === 'user management') {
      navigate('/users/management');
    } else if (suggestion === 'active users') {
      navigate('/users/active');
    } else if (suggestion === 'pending users') {
      navigate('/users/pending');
    } else if (suggestion === 'user roles') {
      navigate('/users/roles');
    } else if (suggestion === 'user activity') {
      navigate('/users/activity');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // User management cards based on original EasyMauzo structure
  const userCards = [
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage system users, roles, and permissions',
      icon: Users2,
      href: '/users/management'
    },
    {
      id: 'user-roles',
      title: 'User Roles',
      description: 'Configure user roles and access levels',
      icon: Shield,
      href: '/users/roles'
    },
    {
      id: 'active-users',
      title: 'Active Users',
      description: 'Manage active user accounts',
      icon: UserCheck,
      href: '/users/active'
    },
    {
      id: 'pending-users',
      title: 'Pending Users',
      description: 'Review and approve new users',
      icon: Clock,
      href: '/users/pending'
    },
    {
      id: 'user-activity',
      title: 'User Activity',
      description: 'Monitor user activity and system usage',
      icon: Activity,
      href: '/users/activity'
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
            placeholder="Search users by name, email, or role..."
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
        {userCards.map((card, index) => (
          <Card
            key={card.id}
            icon={card.icon}
            iconBgColor="bg-indigo-100"
            iconColor="text-indigo-600"
            title={card.title}
            description={card.description}
            onClick={() => navigate(card.href)}
            animationDelay={index}
            className="product-card-animation"
          />
        ))}
      </GridLayout>
    </div>
  );
};

export default Users; 