import React from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContentContainer from '../components/ContentContainer';
import Card from '../components/Card';

const ReturnsOutReasons: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ContentContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/purchases')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Purchases"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Returns Out Reasons</h1>
              <p className="text-gray-600 mt-1">Manage reasons for product returns to vendors</p>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <Card className="p-8">
          <div className="text-center">
            <RotateCcw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Returns Out Reasons Module</h3>
            <p className="text-gray-600 mb-4">
              This module will allow you to manage reasons for returning products to vendors, 
              configure return categories, and track return patterns.
            </p>
            <p className="text-sm text-gray-500">
              Full CRUD functionality will be implemented here similar to Return Reasons (Sales).
            </p>
          </div>
        </Card>
      </div>
    </ContentContainer>
  );
};

export default ReturnsOutReasons;

