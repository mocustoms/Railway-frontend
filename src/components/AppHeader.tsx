import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getFlaticonIcon } from '../utils/flaticonMapping';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Company } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface HeaderProps {
  isSidebarCollapsed: boolean;
}

// Route to label mapping - comprehensive mapping for all routes
// This ensures proper labels for modules, sub-modules, and sub-sub-modules
const routeLabels: Record<string, string> = {
  // Main Modules
  '/app-main': 'App Main',
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/sales': 'Sales',
  '/accounts': 'Accounts',
  '/users': 'Users',
  '/reports': 'Reports',
  '/inventory-management': 'Inventory Management',
  '/advance-setup': 'Advance Setup',
  '/administrative': 'Administrative',
  '/data-importation': 'Data Importation',
  
  // Products Sub-modules
  '/product-categories': 'Product Categories',
  '/product-catalog': 'Product Catalog',
  '/product-colors': 'Product Colors',
  '/product-models': 'Product Models',
  '/product-manufacturers': 'Product Manufacturers',
  '/product-brand-names': 'Product Brand Names',
  '/packaging': 'Packaging',
  '/price-categories': 'Price Categories',
  '/store-locations': 'Store Locations',
  '/add-product': 'Add Product',
  '/bulk-price-change': 'Bulk Price Change',
  
  // Sales Sub-modules
  '/sales/agents': 'Sales Agents',
  '/sales/customer-groups': 'Customer Groups',
  '/sales/customers': 'Customers',
  '/sales/loyalty-cards': 'Loyalty Cards',
  '/sales/return-reasons': 'Return Reasons',
  '/sales/proforma-invoices': 'Proforma Invoices',
  '/sales/sales-orders': 'Sales Orders',
  '/sales/sales-invoices': 'Sales Invoices',
  '/sales/transactions': 'Transactions',
  '/sales/receipts': 'Receipts',
  '/sales/reports': 'Sales Reports',
  '/sales/analytics': 'Sales Analytics',
  '/sales/daily': 'Daily Sales',
  '/sales/invoices': 'Invoices',
  
  // Purchases Sub-modules
  '/purchases': 'Purchases',
  '/purchases/vendor-groups': 'Vendor Groups',
  '/purchases/vendors': 'Vendors',
  '/purchases/purchasing-order': 'Purchasing Order',
  '/purchases/invoice': 'Purchase Invoice',
  '/purchases/invoice-payments': 'Invoice Payments',
  '/purchases/returns-out-reasons': 'Returns Out Reasons',
  '/purchases/returns-out': 'Returns Out',
  
  // Accounts Sub-modules
  '/accounts/account-types': 'Account Types',
  '/accounts/chart-of-accounts': 'Chart of Accounts',
  '/accounts/opening-balances': 'Opening Balances',
  // Legacy routes (without /accounts prefix)
  '/account-types': 'Account Types',
  '/chart-of-accounts': 'Chart of Accounts',
  '/opening-balances': 'Opening Balances',
  '/linked-accounts': 'Linked Accounts',
  '/accounts/linked-accounts': 'Linked Accounts',
  
  // Advance Setup Sub-modules
  '/company-setup': 'Company Setup',
  '/store-setup': 'Store Setup',
  '/import-stores': 'Import Stores',
  '/currency-setup': 'Currency Setup',
  '/exchange-rate-setup': 'Exchange Rate Setup',
  '/financial-year': 'Financial Year',
  
  // Administrative Sub-modules
  '/tax-codes': 'Tax Codes',
  '/payment-types': 'Payment Types',
  '/payment-methods': 'Payment Methods',
  '/bank-details': 'Bank Details',
  '/customer-deposits': 'Customer Deposits',
  '/database-settings': 'Database Settings',
  '/scheduler-management': 'Scheduler Management',
  
  // Users Sub-modules
  '/users/management': 'User Management',
  '/users/roles': 'User Roles',
  '/profile/settings': 'Profile Settings',
  
  // Reports Sub-modules
  '/reports/stock-and-inventory': 'Stock Reports',
  '/reports/sales': 'Sales Reports',
  '/reports/stock-balance': 'Stock Balance',
  '/reports/stock-balance-as-of-date': 'Stock Balance as of Date',
  
  // Reports Sub-sub-modules (Sales Reports)
  '/reports/sales/customer-list': 'Customer List',
  '/reports/sales/customer-birthdays': 'Customer Birthdays',
  '/reports/sales/revenue': 'Revenue Report',
  '/reports/sales/sales-details': 'Sales Details Report',
  
  // Data Importation Sub-modules
  '/import-products': 'Import Products',
  '/import-customers': 'Import Customers',
  '/import-customer-deposits': 'Import Customer Deposits',
  
  // Inventory Management Sub-modules
  '/inventory/adjustment-reasons': 'Adjustment Reasons',
  '/inventory/store-requests': 'Store Requests',
  '/inventory/store-issues': 'Store Issues',
  '/inventory/store-receipts': 'Store Receipts',
  '/stock-adjustment': 'Stock Adjustment',
  '/physical-inventory': 'Physical Inventory',
};

const AppHeader: React.FC<HeaderProps> = ({ isSidebarCollapsed }) => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch company data
  const { data: companyData } = useQuery<Company | null>({
    queryKey: ['company', user?.companyId],
    queryFn: async () => {
      const response = await apiService.get<Company>('/company');
      return response.success && response.data ? response.data : null;
    },
    enabled: isAuthenticated && !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const companyName = companyData?.name || 'Company';

  // Helper function to format segment name
  const formatSegmentName = (segment: string): string => {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generate breadcrumbs from current path - shows full hierarchy
  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const crumbs: Array<{ label: string; path: string }> = [];

    // Always start with Home/App Main
    crumbs.push({ label: 'Home', path: '/app-main' });

    // Build path incrementally to show full hierarchy
    // This ensures we show: Module > Sub-Module > Sub-Sub-Module
    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      
      // Use route label if available, otherwise format the segment name
      const label = routeLabels[currentPath] || formatSegmentName(segment);
      
      // Always add the crumb to show the full path hierarchy
      crumbs.push({ label, path: currentPath });
    });

    return crumbs;
  }, [location.pathname]);

  // Generate profile picture URL when user profile picture changes
  useEffect(() => {
    if (user?.profile_picture && !profileImageError) {
      const url = getImageUrl(user.profile_picture, 'users');
      setProfileImageUrl(url || '');
    } else {
      setProfileImageUrl('');
    }
  }, [user?.profile_picture, profileImageError]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout().then(() => {
      window.location.href = '/login';
    });
  };

  // Get API base URL for company logo
  const getCompanyLogoUrl = (logoPath: string | null | undefined): string | null => {
    if (!logoPath) return null;
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000';
    return `${baseUrl}${logoPath}`;
  };

  return (
    <div className={`fixed top-0 right-0 bg-white border-b border-gray-200 z-20 transition-all duration-300 ${
      isSidebarCollapsed ? 'left-16' : 'left-64'
    }`}>
      <div className="h-20 flex items-center justify-between px-6">
        <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li key={`${crumb.path}-${index}`} className="flex items-center">
                  {index === 0 ? (
                    <Link
                      to={crumb.path}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {React.createElement(getFlaticonIcon('Home'), { className: 'h-4 w-4' })}
                    </Link>
                  ) : (
                    <>
                      {React.createElement(getFlaticonIcon('ChevronRight'), { className: 'h-4 w-4 text-gray-400 mx-2' })}
                      {isLast ? (
                        <span className="text-gray-900 font-medium" aria-current="page">
                          {crumb.label}
                        </span>
                      ) : (
                        <Link
                          to={crumb.path}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* User Profile Menu */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {user.profile_picture && !profileImageError && profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  onError={() => setProfileImageError(true)}
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                  </span>
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500">{companyName}</p>
              </div>
              {React.createElement(getFlaticonIcon('ChevronDown'), { className: `h-4 w-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}` })}
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{companyName}</p>
                </div>
                <Link
                  to="/profile/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  {React.createElement(getFlaticonIcon('Settings'), { className: 'h-4 w-4 mr-3 text-gray-400' })}
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {React.createElement(getFlaticonIcon('LogOut'), { className: 'h-4 w-4 mr-3 text-gray-400' })}
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppHeader;
