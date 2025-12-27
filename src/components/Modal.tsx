import React, { useEffect, useContext } from 'react';
import { X } from 'lucide-react';
import { SidebarContext } from '../contexts/SidebarContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'almost-full';
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = ''
}) => {
  // Safely get sidebar context - it may not be available (e.g., for UpdateNotificationModal)
  const sidebarContext = useContext(SidebarContext);
  const isSidebarCollapsed = sidebarContext?.isSidebarCollapsed ?? false;
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-[88vw]',
    'almost-full': 'max-w-[78vw]'
  };

  // Calculate left offset based on sidebar state
  // If sidebar context is not available, center the modal (for UpdateNotificationModal)
  const leftOffset = sidebarContext 
    ? (isSidebarCollapsed ? '64px' : '256px')
    : '0px';
  const modalWidth = sidebarContext 
    ? `calc(100vw - ${leftOffset})`
    : '100vw';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto" 
      style={{ 
        top: sidebarContext ? '64px' : '0px',
        left: leftOffset,
        right: 0,
        width: modalWidth
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        style={{ 
          top: sidebarContext ? '-64px' : '0px',
          left: sidebarContext ? '-64px' : '0px',
          width: '100vw',
          height: '100vh'
        }}
      />

      {/* Modal */}
      <div className={`flex ${sidebarContext ? 'min-h-[calc(100vh-64px)]' : 'min-h-screen'} items-start justify-center p-4`}>
        <div
          className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
