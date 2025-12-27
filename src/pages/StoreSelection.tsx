import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import userService from '../services/userService';
import { Store, MapPin, Phone, Mail, ShoppingCart, ArrowRight, AlertCircle, Home, ChevronDown, MapPin as LocationIcon } from 'lucide-react';

const StoreSelection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleStoreSelect = (storeId: string) => {
    setSelectedStore(storeId);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleContinue = () => {
    if (selectedStore) {
      navigate(`/pos/${selectedStore}`);
    }
  };

  // Filter stores based on search term
  const filteredStores = stores?.filter((store: any) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Get selected store name
  const selectedStoreName = stores?.find((store: any) => store.id === selectedStore)?.name || '';

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Error loading stores</p>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
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
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        {/* Home Button - Top Right */}
        <div className="flex justify-end mb-8">
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

        {/* Searchable Dropdown */}
        <div className="relative" ref={dropdownRef}>
          {/* Search Input */}
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="relative bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer"
          >
            <div className="flex items-center px-4 py-3">
              <LocationIcon className="h-5 w-5 mr-3 flex-shrink-0" style={{ color: '#11224E' }} />
              <input
                type="text"
                placeholder="Search Shop..."
                value={isDropdownOpen ? searchTerm : selectedStoreName}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                readOnly={!isDropdownOpen}
              />
              <ChevronDown 
                className={`h-5 w-5 ml-3 flex-shrink-0 transition-transform ${
                  isDropdownOpen ? 'transform rotate-180' : ''
                }`}
                style={{ color: '#11224E' }}
              />
            </div>
          </div>

          {/* Dropdown List */}
          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredStores.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No shops found
                </div>
              ) : (
                filteredStores.map((store: any, index: number) => {
                  const isSelected = selectedStore === store.id;
                  const isHovered = hoveredIndex === index;
                  const shouldHighlight = isSelected || isHovered;

                  return (
                    <div
                      key={store.id}
                      onClick={() => handleStoreSelect(store.id)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        shouldHighlight
                          ? 'text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-50'
                      } ${
                        index < filteredStores.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                      style={shouldHighlight ? { backgroundColor: '#11224E' } : {}}
                    >
                      {store.name}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Continue Button */}
        {selectedStore && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleContinue}
              className="inline-flex items-center px-6 py-3 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: '#11224E' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d1a3a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#11224E'}
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreSelection;

