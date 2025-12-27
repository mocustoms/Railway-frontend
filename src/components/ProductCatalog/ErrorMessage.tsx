import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  details,
  onRetry,
  onDismiss,
  variant = 'error',
  className = ''
}) => {
  const variantStyles = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700',
      details: 'text-red-600',
      retryButton: 'bg-red-600 hover:bg-red-700 text-white',
      dismissButton: 'text-red-600 hover:text-red-700'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-800',
      message: 'text-amber-700',
      details: 'text-amber-600',
      retryButton: 'bg-amber-600 hover:bg-amber-700 text-white',
      dismissButton: 'text-amber-600 hover:text-amber-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700',
      details: 'text-blue-600',
      retryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      dismissButton: 'text-blue-600 hover:text-blue-700'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={`border rounded-lg p-4 ${styles.container} ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${styles.icon}`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title} mb-1`}>
              {title}
            </h3>
          )}
          
          <p className={`text-sm ${styles.message} mb-2`}>
            {message}
          </p>
          
          {details && (
            <details className="text-xs">
              <summary className={`cursor-pointer ${styles.details} hover:underline`}>
                Show details
              </summary>
              <pre className={`mt-2 p-2 bg-white bg-opacity-50 rounded text-xs ${styles.details} whitespace-pre-wrap`}>
                {details}
              </pre>
            </details>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${styles.retryButton}`}
            >
              <RefreshCw className="w-3 h-3 mr-1 inline" />
              Retry
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`p-1 rounded-md transition-colors ${styles.dismissButton}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Full page error component
export const FullPageError: React.FC<{
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}> = ({ title, message, details, onRetry, onGoBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          {title && (
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h1>
          )}
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {details && (
            <details className="text-left mb-6">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Show technical details
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-600 whitespace-pre-wrap text-left">
                {details}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                Try Again
              </button>
            )}
            
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline error for form fields
export const FieldError: React.FC<{ message: string; className?: string }> = ({ 
  message, 
  className = '' 
}) => {
  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {message}
    </p>
  );
};

// Network error component
export const NetworkError: React.FC<{
  onRetry?: () => void;
  onGoBack?: () => void;
}> = ({ onRetry, onGoBack }) => {
  return (
    <FullPageError
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      onGoBack={onGoBack}
    />
  );
};

// Permission error component
export const PermissionError: React.FC<{
  requiredPermission?: string;
  onGoBack?: () => void;
}> = ({ requiredPermission, onGoBack }) => {
  return (
    <FullPageError
      title="Access Denied"
      message={
        requiredPermission
          ? `You don't have permission to access this feature. Required permission: ${requiredPermission}`
          : "You don't have permission to access this feature."
      }
      onGoBack={onGoBack}
    />
  );
};
