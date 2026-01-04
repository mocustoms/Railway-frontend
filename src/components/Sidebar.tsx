import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFlaticonIcon } from '../utils/flaticonMapping';
import { apiService } from '../services/api';
import { Company } from '../types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
}

interface SubmenuItem {
  path: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface MenuItem {
  path: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  expandable?: boolean;
  submenus?: SubmenuItem[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isMobileOpen = false }) => {
  const location = useLocation();
  
  // Fetch company data
  const { data: companyData } = useQuery<Company | null>({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await apiService.get<Company>('/company');
      return response.success && response.data ? response.data : null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const companyName = companyData?.name || 'Company';
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [logoError, setLogoError] = useState(false);

  // Reset logo error when company data changes
  useEffect(() => {
    setLogoError(false);
  }, [companyData?.logo]);

  // Enhanced menu structure with sections like the image
  const menuSections: MenuSection[] = [
    {
      title: 'ANALYTICS',
      items: [
        {
          path: '/dashboard',
          title: 'Dashboard',
          icon: getFlaticonIcon('BarChart3'),
          description: 'Main overview and analytics'
        },
        {
          path: '/reports',
          title: 'Reports',
          icon: getFlaticonIcon('TrendingUp'),
          description: 'Business intelligence',
          expandable: true,
          submenus: [
            {
              path: '/reports/stock-and-inventory',
              title: 'Stock Reports',
              icon: getFlaticonIcon('Stock'),
              description: 'Inventory and stock reports'
            },
            {
              path: '/reports/sales',
              title: 'Sales Reports',
              icon: getFlaticonIcon('ShoppingCart'),
              description: 'Sales analysis and reporting'
            }
          ]
        }
      ]
    },
    {
      title: 'CONTENT',
      items: [
        {
          path: '/products',
          title: 'Products',
          icon: getFlaticonIcon('Package'),
          description: 'Product management'
        },
        {
          path: '/sales',
          title: 'Sales',
          icon: getFlaticonIcon('ShoppingCart'),
          description: 'Sales management system'
        },
        {
          path: '/purchases',
          title: 'Purchases',
          icon: getFlaticonIcon('ShoppingBag'),
          description: 'Purchases management system'
        },
        {
          path: '/inventory-management',
          title: 'Inventory',
          icon: getFlaticonIcon('Inventory'),
          description: 'Stock management hub'
        }
      ]
    },
    {
      title: 'CUSTOMIZATION',
      items: [
        {
          path: '/users',
          title: 'Users',
          icon: getFlaticonIcon('Users'),
          description: 'User management'
        },
        {
          path: '/advance-setup',
          title: 'Advance Setup',
          icon: getFlaticonIcon('Settings'),
          description: 'System configuration hub'
        },
        {
          path: '/administrative',
          title: 'Administrative',
          icon: getFlaticonIcon('Shield'),
          description: 'Admin functions hub'
        },
        {
          path: '/data-importation',
          title: 'Data Importation',
          icon: getFlaticonIcon('Upload'),
          description: 'Bulk data import hub'
        }
      ]
    }
  ];

  const toggleMenu = (path: string) => {
    const newExpandedMenus = new Set(expandedMenus);
    if (newExpandedMenus.has(path)) {
      newExpandedMenus.delete(path);
    } else {
      newExpandedMenus.add(path);
    }
    setExpandedMenus(newExpandedMenus);
  };

  const isMenuExpanded = (path: string) => {
    return expandedMenus.has(path);
  };

  const isActive = (path: string) => {
    // Handle Reports module - highlight when on /reports or any /reports/* path
    if (path === '/reports') {
      return location.pathname === path || location.pathname.startsWith(path + '/');
    }
    
    // Handle specific Reports sub-modules
    if (path === '/reports/stock-and-inventory') {
      return location.pathname === '/reports/stock-and-inventory';
    }
    
    if (path === '/reports/sales') {
      return location.pathname === '/reports/sales';
    }
    
    // Handle Sales module and its sub-modules
    if (path === '/sales') {
      return location.pathname === path || 
             location.pathname.startsWith(path + '/') ||
             location.pathname === '/sales/pos' ||
             location.pathname === '/sales/agents' ||
             location.pathname === '/sales/customer-groups' ||
             location.pathname === '/sales/transactions' ||
             location.pathname === '/sales/receipts' ||
             location.pathname === '/sales/customers' ||
             location.pathname === '/sales/reports' ||
             location.pathname === '/sales/analytics' ||
             location.pathname === '/sales/daily' ||
             location.pathname === '/sales/invoices' ||
             location.pathname === '/sales/loyalty-cards' ||
             location.pathname === '/sales/return-reasons' ||
             location.pathname === '/sales/proforma-invoices' ||
             location.pathname === '/sales/sales-orders' ||
             location.pathname === '/sales/sales-invoices';
    }
    
    // Handle Purchases module and its sub-modules
    if (path === '/purchases') {
      return location.pathname === path || 
             location.pathname.startsWith(path + '/');
    }
    
    // Handle Products module and its sub-modules
    if (path === '/products') {
      return location.pathname === path || 
             location.pathname.startsWith(path + '/') ||
             location.pathname === '/product-colors' ||
             location.pathname === '/product-models' ||
             location.pathname === '/product-manufacturers' ||
             location.pathname === '/product-brand-names' ||
             location.pathname === '/packaging' ||
             location.pathname === '/price-categories' ||
             location.pathname === '/store-locations' ||
             location.pathname === '/product-catalog' ||
             location.pathname === '/product-categories' ||
             location.pathname === '/bulk-price-change' ||
             location.pathname === '/add-product';
    }
    
    // Handle Accounts module and its sub-modules
    if (path === '/accounts') {
      return location.pathname === path || 
             location.pathname.startsWith(path + '/') ||
             location.pathname === '/account-types' ||
             location.pathname === '/chart-of-accounts' ||
             location.pathname === '/opening-balances';
    }
    
    // Handle Advance Setup module and its sub-modules
    if (path === '/advance-setup') {
      return location.pathname === path || 
             location.pathname.startsWith(path + '/') ||
             location.pathname === '/company-setup' ||
             location.pathname === '/store-setup' ||
             location.pathname === '/import-stores' ||
             location.pathname === '/currency-setup' ||
             location.pathname === '/exchange-rate-setup' ||
             location.pathname === '/financial-year';
    }
    
    // Handle Inventory Management module and its sub-modules
    if (path === '/inventory-management') {
      return location.pathname === path || 
             location.pathname.startsWith(path + '/') ||
             location.pathname.startsWith('/inventory/') ||
             location.pathname === '/stock-adjustment' ||
             location.pathname === '/physical-inventory' ||
             location.pathname === '/inventory/adjustment-reasons' ||
             location.pathname === '/inventory/store-requests' ||
             location.pathname === '/inventory/store-issues' ||
             location.pathname === '/inventory/store-receipts';
    }
    
    // Handle Data Importation module and its sub-modules
    if (path === '/data-importation') {
      return location.pathname === path || 
             location.pathname.startsWith(path + '/') ||
             location.pathname === '/import-products' ||
             location.pathname === '/import-customers' ||
             location.pathname === '/import-customer-deposits';
    }
    
    // Handle Administrative module and its sub-modules
    if (path === '/administrative') {
      return location.pathname === path || 
             location.pathname.startsWith(path + '/') ||
             location.pathname === '/tax-codes' ||
             location.pathname === '/payment-methods' ||
             location.pathname === '/payment-types' ||
             location.pathname === '/bank-details' ||
             location.pathname === '/customer-deposits';
    }
    
    // Handle Users module and its sub-modules
    if (path === '/users') {
      return location.pathname === path || 
             location.pathname.startsWith(path + '/') ||
             location.pathname === '/users/management';
    }
    
    // Default behavior for other modules
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    if (window.innerWidth <= 768 && isMobileOpen) {
      onToggle();
    }
  }, [location.pathname, isMobileOpen, onToggle]);

  // Auto-expand Reports menu when on /reports or any /reports/* path, or when sidebar is collapsed
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Auto-expand Reports menu when navigating to /reports or any /reports/* path
    // Also auto-expand when sidebar is collapsed to show submenu icons
    if (currentPath === '/reports' || currentPath.startsWith('/reports/') || isCollapsed) {
      setExpandedMenus(prev => {
        const newSet = new Set(prev);
        newSet.add('/reports');
        return newSet;
      });
    }
    
    // If navigating to a main module that's not Reports, close Reports if expanded (unless collapsed)
    if (!isCollapsed && (
        currentPath.startsWith('/sales') || 
        currentPath.startsWith('/purchases') ||
        currentPath.startsWith('/products') || 
        currentPath.startsWith('/accounts') || 
        currentPath.startsWith('/advance-setup') || 
        currentPath.startsWith('/administrative') || 
        currentPath.startsWith('/inventory-management') || 
        currentPath.startsWith('/data-importation') || 
        currentPath.startsWith('/users') || 
        currentPath === '/dashboard')) {
      
      setExpandedMenus(prev => {
        const newSet = new Set(prev);
        newSet.delete('/reports');
        return newSet;
      });
    }
  }, [location.pathname, isCollapsed]);



  return (
    <>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        {/* Mobile Overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={onToggle}
          />
        )}

        {/* Sidebar Content */}
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed ? (
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {companyData?.logo && !logoError ? (
                  <img
                    id='company-logo'
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000'}${companyData.logo}`}
                    alt={`${companyName} Logo`}
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 shadow-sm flex-shrink-0"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0" id="alt-logo">
                    <span className="text-white font-bold text-lg">
                      {companyName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-end flex-1">
                {companyData?.logo && !logoError ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000'}${companyData.logo}`}
                    alt={`${companyName} Logo`}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-base">
                      {companyName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
            >
              {React.createElement(getFlaticonIcon('Menu'), { className: 'h-5 w-5 text-gray-600' })}
            </button>
          </div>
        
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuSections.map((section, sectionIndex) => (
              <div key={section.title} className={sectionIndex < menuSections.length - 1 ? 'mb-6' : ''}>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.path}>
                      <div className="flex items-center">
                        <Link
                          to={item.path}
                          onClick={() => {
                            // Auto-expand Reports menu when clicking on it
                            if (item.expandable && item.path === '/reports' && !isMenuExpanded(item.path)) {
                              toggleMenu(item.path);
                            }
                          }}
                          className={`flex items-center flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                            isActive(item.path)
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {/* Active indicator bar */}
                          {isActive(item.path) && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                          )}
                          <item.icon className={`h-5 w-5 mr-3 ${
                            isActive(item.path) ? 'text-white' : 'text-gray-400'
                          }`} />
                          {!isCollapsed && (
                            <span className="truncate">{item.title}</span>
                          )}
                        </Link>
                        
                        {/* Expand/Collapse Button (now inline) */}
                        {item.expandable && item.submenus && !isCollapsed && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleMenu(item.path);
                            }}
                            className="px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {isMenuExpanded(item.path) ? (
                              React.createElement(getFlaticonIcon('ChevronDown'), { className: 'h-4 w-4' })
                            ) : (
                              React.createElement(getFlaticonIcon('ChevronRight'), { className: 'h-4 w-4' })
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Submenu */}
                      {item.expandable && item.submenus && (
                        <div className={`transition-all duration-200 ${
                          isMenuExpanded(item.path) || isCollapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                        }`}>
                          <div className={isCollapsed ? 'space-y-1' : 'ml-8 space-y-1'}>
                            {item.submenus.map((submenu) => (
                              <Link
                                key={submenu.path}
                                to={submenu.path}
                                className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-2' : 'px-4 py-2'} text-sm transition-colors relative ${
                                  isActive(submenu.path)
                                    ? 'text-white bg-blue-600'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                                title={isCollapsed ? submenu.title : undefined}
                              >
                                {/* Active indicator bar for submenu */}
                                {isActive(submenu.path) && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                                )}
                                <submenu.icon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4 mr-3'} ${
                                  isActive(submenu.path) ? 'text-white' : 'text-gray-400'
                                }`} />
                                {!isCollapsed && (
                                  <span className="truncate">{submenu.title}</span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </nav>
        
          {/* System Name Section */}
          <div className="border-t border-gray-200 p-4">
            {!isCollapsed ? (
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold">
                  <span style={{ color: '#11224E' }}>Ten</span>
                  <span style={{ color: '#F87B1B' }}>Zen</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="text-lg font-bold">
                  <span style={{ color: '#11224E' }}>T</span>
                  <span style={{ color: '#F87B1B' }}>Z</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 