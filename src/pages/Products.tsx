import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Package, 
  Tags, 
  Upload, 
  Settings, 
  BarChart3, 
  FileText, 
  Palette,
  Package as PackageIcon,
  Building2,
  Tag,
  DollarSign,
  PackageOpen,
  MapPin
} from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import './Products.css';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Search suggestions based on original EasyMauzo
  const suggestions = [
    { text: 'product catalog', icon: Package, href: '/product-catalog' },
    { text: 'product categories', icon: Tags, href: '/product-categories' },
    { text: 'product brand names', icon: Tag, href: '/product-brand-names' },
    { text: 'product manufacturers', icon: Building2, href: '/product-manufacturers' },
    { text: 'product models', icon: PackageIcon, href: '/product-models' },
    { text: 'product colors', icon: Palette, href: '/product-colors' },
    { text: 'packaging', icon: PackageOpen, href: '/packaging' },
    { text: 'price categories', icon: DollarSign, href: '/price-categories' },

    { text: 'store locations', icon: MapPin, href: '/store-locations' },
    { text: 'product settings', icon: Settings, href: '/products' },
    { text: 'product reports', icon: FileText, href: '/reports' },

  ];

  // Filter suggestions based on search term
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion: { text: string; href: string }) => {
    setSearchTerm(suggestion.text);
    setShowSuggestions(false);
    navigate(suggestion.href);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Product cards based on original EasyMauzo structure
  const productCards = [
    {
      id: 'product-catalog',
      title: 'Product Catalog',
      description: 'Comprehensive product management with inventory tracking',
      icon: Package,
      href: '/product-catalog'
    },
    {
      id: 'product-categories',
      title: 'Product Categories',
      description: 'Organize products into categories',
      icon: Tags,
      href: '/product-categories'
    },
    {
      id: 'product-brand-names',
      title: 'Product Brand Names',
      description: 'Manage product brand names and trademarks',
      icon: Tag,
      href: '/product-brand-names'
    },
    {
      id: 'product-manufacturers',
      title: 'Product Manufacturers',
      description: 'Manage product manufacturers and company information',
      icon: Building2,
      href: '/product-manufacturers'
    },
    {
      id: 'product-models',
      title: 'Product Models',
      description: 'Manage product models and specifications',
      icon: PackageIcon,
      href: '/product-models'
    },
    {
      id: 'product-colors',
      title: 'Product Colors',
      description: 'Manage product colors and color variations',
      icon: Palette,
      href: '/product-colors'
    },
    {
      id: 'packaging',
      title: 'Packaging',
      description: 'Manage packaging codes, names and piece counts',
      icon: PackageOpen,
      href: '/packaging'
    },
    {
      id: 'price-categories',
      title: 'Price Categories',
      description: 'Manage price categories and pricing strategies',
      icon: DollarSign,
      href: '/price-categories'
    },
    {
      id: 'bulk-price-change',
      title: 'Bulk Price Change',
      description: 'Update prices for multiple products',
      icon: BarChart3,
      href: '/bulk-price-change'
    },

    {
      id: 'store-locations',
      title: 'Store Locations',
      description: 'Manage physical locations within stores',
      icon: MapPin,
      href: '/store-locations'
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
            placeholder="Search product modules..."
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
      <GridLayout cols={4} gap={6}>
        {productCards.map((card, index) => (
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

export default Products; 