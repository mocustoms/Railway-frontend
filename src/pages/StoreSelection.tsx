import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import userService from '../services/userService';
import { Store, MapPin, Phone, Mail, AlertCircle, Home, Search, X } from 'lucide-react';
import GridLayout from '../components/GridLayout';
import Card from '../components/Card';
import { getFlaticonIcon } from '../utils/flaticonMapping';

const StoreSelection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user's POS stores
  const { data: stores, isLoading, error } = useQuery({
    queryKey: ['userPOSStores', user?.id],
    queryFn: async () => {
      try {
        return await userService.getUserPOSStores(user!.id);
      } catch (error) {
        return []; // Return empty array on error
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Filter stores based on search term
  const filteredStores = stores?.filter((store: any) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleStoreSelect = (storeId: string) => {
    navigate(`/pos/${storeId}`);
    };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error loading stores</h2>
          <p className="text-gray-600 mb-4">Please try again later</p>
          <button
            onClick={() => navigate('/app-main')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No POS Stores Available</h2>
          <p className="text-gray-600 mb-4">
            You don't have access to any stores that can process sales. Please contact your administrator to assign you to a store with POS capabilities.
          </p>
          <button
            onClick={() => navigate('/app-main')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
        {/* Home Button - Top Right */}
          <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate('/app-main')}
            className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Home
          </button>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          Please select Shop
        </h1>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-6">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <Search className="h-5 w-5 text-gray-400 ml-3" />
              <input
                type="text"
                placeholder="Search shops by name, location, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
          </div>
        </div>

        {/* Stores Grid */}
        {filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found</h3>
            <p className="text-gray-500">
              No shops match your search criteria. Try adjusting your search terms.
            </p>
          </div>
        ) : (
          <GridLayout cols={4} gap={6} className="product-grid-animation">
            {filteredStores.map((store: any, index: number) => {
              // Create description with store details
              const descriptionParts = [];
              if (store.location) {
                descriptionParts.push(store.location);
              }
              if (store.phone) {
                descriptionParts.push(`Tel: ${store.phone}`);
              }
              if (store.email) {
                descriptionParts.push(`Email: ${store.email}`);
              }
              const description = descriptionParts.length > 0 
                ? descriptionParts.join(' • ') 
                : 'Select this store to start processing sales';

              return (
                <Card
                  key={store.id}
                  title={store.name}
                  description={description}
                  icon={getFlaticonIcon('Building')}
                  iconBgColor="bg-orange-100"
                  iconColor="text-orange-600"
                  onClick={() => handleStoreSelect(store.id)}
                  className="product-card-animation"
                  animationDelay={index}
                />
              );
            })}
          </GridLayout>
        )}
      </main>
    </div>
  );
};

export default StoreSelection;
