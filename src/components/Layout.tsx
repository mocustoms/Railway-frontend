import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';
import './Sidebar.css';
import './Header.css';
import './Dashboard.css';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContent: React.FC<LayoutProps> = ({ children }) => {
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
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={window.innerWidth <= 768 ? toggleMobileMenu : toggleSidebar}
        isMobileOpen={isMobileMenuOpen}
      />
      
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AppHeader isSidebarCollapsed={isSidebarCollapsed} />
        <div className="content-wrapper">
          <main className="content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
};

export default Layout; 