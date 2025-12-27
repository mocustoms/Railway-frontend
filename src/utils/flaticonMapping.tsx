import React from 'react';
import FlaticonIcon from '../components/FlaticonIcon';

// Mapping of lucide-react icon names to Flaticon icon classes
export const flaticonMap: Record<string, string> = {
  // Navigation & UI
  'Menu': 'fi-rr-menu-burger',
  'ChevronDown': 'fi-rr-angle-down',
  'ChevronRight': 'fi-rr-angle-right',
  'Home': 'fi-rr-home',
  
  // Business & Analytics
  'BarChart3': 'fi-rr-chart-histogram',
  'TrendingUp': 'fi-rr-chart-line-up',
  'FileText': 'fi-rr-document',
  
  // Products & Inventory
  'Package': 'fi-rr-box',
  'Warehouse': 'fi-rr-warehouse-alt', // Warehouse icon
  'ShoppingCart': 'fi-rr-shopping-cart',
  'Inventory': 'fi-rr-inventory-alt', // For inventory management
  'Stock': 'fi-rr-chart-histogram', // For stock reports
  
  // Users & Settings
  'Users': 'fi-rr-users',
  'Settings': 'fi-rr-settings',
  'Shield': 'fi-rr-shield-check',
  
  // Files & Upload
  'Upload': 'fi-rr-upload',
  
  // Accounts & Finance
  'BookOpen': 'fi-rr-book',
  'DollarSign': 'fi-rr-dollar',
  'ArrowLeftRight': 'fi-rr-exchange',
  'Scale': 'fi-rr-scale',
  'Receipt': 'fi-rr-receipt',
  'FolderOpen': 'fi-rr-folder',
  'Link': 'fi-rr-link',
  
  // Building & Location
  'Building': 'fi-rr-building',
  'CreditCard': 'fi-rr-credit-card',
  
  // Actions
  'LogOut': 'fi-rr-sign-out-alt',
};

// Create a React component wrapper for Flaticon icons
export const createFlaticonComponent = (iconClass: string) => {
  return React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { size?: number }>(
    ({ className = '', size, style, color, ...props }, ref) => {
      return (
        <FlaticonIcon
          icon={iconClass}
          size={size}
          className={className}
          style={style}
          color={color}
        />
      );
    }
  );
};

// Get Flaticon component for a lucide-react icon name
export const getFlaticonIcon = (lucideIconName: string): React.ComponentType<any> => {
  const iconClass = flaticonMap[lucideIconName];
  if (!iconClass) {
    // Return a default icon or the original lucide icon
    return createFlaticonComponent('fi-rr-apps');
  }
  return createFlaticonComponent(iconClass);
};

