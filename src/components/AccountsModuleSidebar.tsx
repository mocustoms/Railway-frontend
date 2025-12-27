import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFlaticonIcon } from '../utils/flaticonMapping';
import { apiService } from '../services/api';
import { Company } from '../types';

interface AccountsModuleSidebarProps {
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

const AccountsModuleSidebar: React.FC<AccountsModuleSidebarProps> = ({ isCollapsed, onToggle, isMobileOpen = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
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
  const [logoError, setLogoError] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Reset logo error when company data changes
  useEffect(() => {
    setLogoError(false);
  }, [companyData?.logo]);

  // Auto-expand menus based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Auto-expand Accounts menu
    if (currentPath.startsWith('/app-accounts/account-types') || 
        currentPath.startsWith('/app-accounts/chart-of-accounts')) {
      setExpandedMenus(prev => {
        const newSet = new Set(prev);
        newSet.add('/app-accounts/accounts');
        return newSet;
      });
    }
    
    // Auto-expand Transactions menu
    if (currentPath.startsWith('/app-accounts/opening-balances') || 
        currentPath.startsWith('/app-accounts/record-expenses') ||
        currentPath.startsWith('/app-accounts/record-ledger-entries') ||
        currentPath.startsWith('/app-accounts/transfer-money')) {
      setExpandedMenus(prev => {
        const newSet = new Set(prev);
        newSet.add('/app-accounts/transactions');
        return newSet;
      });
    }
    
    // Auto-expand Reports menu
    if (currentPath.startsWith('/app-accounts/trial-balance')) {
      setExpandedMenus(prev => {
        const newSet = new Set(prev);
        newSet.add('/app-accounts/reports');
        return newSet;
      });
    }
  }, [location.pathname]);

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const isMenuExpanded = (path: string) => {
    return expandedMenus.has(path);
  };

  // Accounts module menu structure
  const menuSections: MenuSection[] = [
    {
      title: '',
      items: [
        {
          path: '/app-accounts',
          title: 'Dashboard',
          icon: getFlaticonIcon('Home'),
          description: 'Accounts overview and statistics'
        },
        {
          path: '/app-accounts/accounts',
          title: 'Accounts',
          icon: getFlaticonIcon('BookOpen'),
          description: 'Account management',
          expandable: true,
          submenus: [
            {
              path: '/app-accounts/account-types',
              title: 'Account Types',
              icon: getFlaticonIcon('BarChart3'),
              description: 'Manage account type classifications'
            },
            {
              path: '/app-accounts/chart-of-accounts',
              title: 'Chart of Accounts',
              icon: getFlaticonIcon('FolderOpen'),
              description: 'Configure your chart of accounts structure'
            }
          ]
        },
        {
          path: '/app-accounts/transactions',
          title: 'Transactions',
          icon: getFlaticonIcon('FileText'),
          description: 'Transaction management',
          expandable: true,
          submenus: [
            {
              path: '/app-accounts/opening-balances',
              title: 'Opening Balances',
              icon: getFlaticonIcon('DollarSign'),
              description: 'Set up account opening balances'
            },
            {
              path: '/app-accounts/record-expenses',
              title: 'Record Expenses',
              icon: getFlaticonIcon('Receipt'),
              description: 'Record and manage expenses'
            },
            {
              path: '/app-accounts/record-ledger-entries',
              title: 'Record Ledger Entries',
              icon: getFlaticonIcon('FileText'),
              description: 'Create and manage ledger entries'
            },
            {
              path: '/app-accounts/transfer-money',
              title: 'Transfer Money',
              icon: getFlaticonIcon('ArrowLeftRight'),
              description: 'Transfer funds between accounts'
            }
          ]
        },
        {
          path: '/app-accounts/reports',
          title: 'Reports',
          icon: getFlaticonIcon('Scale'),
          description: 'Financial reports',
          expandable: true,
          submenus: [
            {
              path: '/app-accounts/trial-balance',
              title: 'Trial Balance',
              icon: getFlaticonIcon('Scale'),
              description: 'View and analyze trial balance'
            }
          ]
        }
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === '/app-accounts') {
      return location.pathname === '/app-accounts';
    }
    // Check if any submenu item is active for expandable menus
    const menuItem = menuSections[0].items.find(item => item.path === path);
    if (menuItem?.expandable && menuItem.submenus) {
      return menuItem.submenus.some(submenu => location.pathname.startsWith(submenu.path));
    }
    return location.pathname.startsWith(path);
  };

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
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000'}${companyData.logo}`}
                    alt={`${companyName} Logo`}
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 shadow-sm flex-shrink-0"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {companyName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 truncate">Accounts</h2>
                  <p className="text-xs text-gray-500 truncate">{companyName}</p>
                </div>
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
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {React.createElement(getFlaticonIcon('Menu'), { className: 'h-5 w-5' })}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={sectionIndex < menuSections.length - 1 ? 'mb-6' : ''}>
                {!isCollapsed && section.title && (
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    const expanded = isMenuExpanded(item.path);
                    
                    return (
                      <div key={item.path}>
                        <div className="flex items-center">
                          <Link
                            to={item.expandable && !isCollapsed ? '#' : item.path}
                            onClick={(e) => {
                              if (item.expandable && !isCollapsed) {
                                e.preventDefault();
                                toggleMenu(item.path);
                              }
                            }}
                            className={`flex items-center flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                              active
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? item.title : undefined}
                          >
                            {/* Active indicator bar */}
                            {active && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                            )}
                            <Icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} ${
                              active ? 'text-white' : 'text-gray-400'
                            }`} />
                            {!isCollapsed && (
                              <span className="truncate">{item.title}</span>
                            )}
                          </Link>
                          
                          {/* Expand/Collapse Button - only show when not collapsed */}
                          {item.expandable && item.submenus && !isCollapsed && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleMenu(item.path);
                              }}
                              className="px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {expanded ? (
                                React.createElement(getFlaticonIcon('ChevronDown'), { className: 'h-4 w-4' })
                              ) : (
                                React.createElement(getFlaticonIcon('ChevronRight'), { className: 'h-4 w-4' })
                              )}
                            </button>
                          )}
                        </div>
                        
                        {/* Submenu - show when expanded OR when collapsed (as icons) */}
                        {item.expandable && item.submenus && (
                          <div className={`transition-all duration-200 ${
                            expanded || isCollapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                          }`}>
                            <div className={isCollapsed ? 'space-y-1' : 'ml-8 space-y-1'}>
                              {item.submenus.map((submenu) => {
                                const SubIcon = submenu.icon;
                                const subActive = location.pathname.startsWith(submenu.path);
                                
                                return (
                                  <Link
                                    key={submenu.path}
                                    to={submenu.path}
                                    className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-2' : 'px-4 py-2'} text-sm transition-colors relative ${
                                      subActive
                                        ? 'text-white bg-blue-600'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    title={isCollapsed ? submenu.title : undefined}
                                  >
                                    {/* Active indicator bar for submenu */}
                                    {subActive && (
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                                    )}
                                    <SubIcon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4 mr-3'} ${
                                      subActive ? 'text-white' : 'text-gray-400'
                                    }`} />
                                    {!isCollapsed && (
                                      <span className="truncate">{submenu.title}</span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer - Logo */}
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

export default AccountsModuleSidebar;

