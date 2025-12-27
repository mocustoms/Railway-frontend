import React from 'react';

interface StatusConfig {
  [key: string]: {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
}

interface StatusBadgeProps {
  status?: string | null;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  config?: StatusConfig;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  variant = 'default',
  size = 'md',
  config
}) => {
  const getVariantClasses = () => {
    // Handle undefined/null status
    if (!status) {
      return 'bg-gray-100 text-gray-800';
    }
    
    // First check if config is available and has the status
    if (config && config[status]) {
      return `${config[status].bgColor} ${config[status].textColor}`;
    }

    // Fallback based on status if config is not available
    if (status === 'active' || status === 'Active') {
      return 'bg-green-100 text-green-800';
    } else if (status === 'inactive' || status === 'Inactive') {
      return 'bg-red-100 text-red-800';
    }

    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-3 py-1.5 text-sm';
      default:
        return 'px-2.5 py-1 text-xs';
    }
  };

  const getDisplayText = () => {
    // Handle undefined/null status
    if (!status) {
      return 'Unknown';
    }
    
    if (config && config[status]) {
      return config[status].label;
    }
    // Fallback text based on status
    if (status === 'active' || status === 'Active') {
      return 'Active';
    } else if (status === 'inactive' || status === 'Inactive') {
      return 'Inactive';
    }
    // Capitalize first letter of each word for better display
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${getVariantClasses()} ${getSizeClasses()}`}>
      {getDisplayText()}
    </span>
  );
};

export default StatusBadge;