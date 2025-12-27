import React, { useState, useEffect } from 'react';
import AccountsModuleSidebar from './AccountsModuleSidebar';
import AccountsModuleHeader from './AccountsModuleHeader';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';
import './Sidebar.css';
import './Header.css';
import './Dashboard.css';

interface AccountsModuleLayoutProps {
  children: React.ReactNode;
}

const AccountsModuleLayoutContent: React.FC<AccountsModuleLayoutProps> = ({ children }) => {
  const { isSidebarCollapsed, toggleSidebar } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle mobile menu
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout">
      <AccountsModuleSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={window.innerWidth <= 768 ? toggleMobileMenu : toggleSidebar}
        isMobileOpen={isMobileMenuOpen}
      />
      
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AccountsModuleHeader isSidebarCollapsed={isSidebarCollapsed} />
        <div className="content-wrapper">
          <main className="content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

const AccountsModuleLayout: React.FC<AccountsModuleLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <AccountsModuleLayoutContent>{children}</AccountsModuleLayoutContent>
    </SidebarProvider>
  );
};

export default AccountsModuleLayout;

