import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

const ContentContainer: React.FC<ContentContainerProps> = ({ children, className = '' }) => {
  const { isSidebarCollapsed } = useSidebar();

  return (
    <div className={`content-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default ContentContainer; 