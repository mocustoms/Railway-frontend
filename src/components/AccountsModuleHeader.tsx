import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getFlaticonIcon } from '../utils/flaticonMapping';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Company } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface AccountsModuleHeaderProps {
  isSidebarCollapsed: boolean;
}

// Route to label mapping for Accounts module
const routeLabels: Record<string, string> = {
  '/app-accounts': 'Dashboard',
  '/app-accounts/home': 'Accounts Home',
  '/app-accounts/account-types': 'Account Types',
  '/app-accounts/chart-of-accounts': 'Chart of Accounts',
  '/app-accounts/opening-balances': 'Opening Balances',
  '/app-accounts/record-expenses': 'Record Expenses',
  '/app-accounts/record-ledger-entries': 'Record Ledger Entries',
  '/app-accounts/transfer-money': 'Transfer Money',
  '/app-accounts/account-reports': 'Account Reports',
  '/app-accounts/trial-balance': 'Trial Balance',
};

const AccountsModuleHeader: React.FC<AccountsModuleHeaderProps> = ({ isSidebarCollapsed }) => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch company data for logo
  const { data: companyData } = useQuery<Company | null>({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await apiService.get<Company>('/company');
      return response.success && response.data ? response.data : null;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const crumbs = [
      { path: '/app-main', label: 'App Main' }
    ];

    if (paths[0] === 'app-accounts') {
      crumbs.push({ path: '/app-accounts', label: 'Accounts' });
      
      if (paths.length > 1) {
        const currentPath = `/${paths.join('/')}`;
        const label = routeLabels[currentPath] || paths[paths.length - 1].split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        crumbs.push({ path: currentPath, label });
      }
    }

    return crumbs;
  }, [location.pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get profile image URL
  useEffect(() => {
    if (user?.profile_picture) {
      const imageUrl = getImageUrl(user.profile_picture, 'users');
      setProfileImageUrl(imageUrl);
    }
  }, [user?.profile_picture]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
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
              {profileImageUrl && !profileImageError ? (
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
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.username}
                </p>
                <p className="text-xs text-gray-500">{companyData?.name || 'Company'}</p>
              </div>
              {React.createElement(getFlaticonIcon('ChevronDown'), { className: `h-4 w-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}` })}
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{companyData?.name || 'Company'}</p>
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

export default AccountsModuleHeader;

