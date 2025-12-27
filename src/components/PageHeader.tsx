import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  path: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  onBack?: () => void;
  children?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, onBack, children, breadcrumbs }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.path}>
                    {index > 0 && <ChevronRight className="w-4 h-4" />}
                    <a
                      href={breadcrumb.path}
                      className="hover:text-gray-700 transition-colors"
                    >
                      {breadcrumb.label}
                    </a>
                  </React.Fragment>
                ))}
              </nav>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center space-x-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;