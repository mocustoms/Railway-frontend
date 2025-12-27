import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Settings, Sparkles } from 'lucide-react';

const WelcomeInitialization: React.FC = () => {
  const navigate = useNavigate();

  const handleYes = () => {
    navigate('/initialize-company');
  };

  const handleChoose = () => {
    navigate('/select-initialization-data');
  };

  const handleNo = () => {
    navigate('/manual-configuration-steps');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to TenZen!
          </h1>
          <p className="text-gray-600 text-lg">
            Do you want TenZen to add some initial data to get you started?
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Initial data includes:</strong> Stores, Accounts, Financial Year, Customer Groups, 
              Linked Accounts, Product Categories, Packaging, Tax Codes, Adjustment Reasons, 
              Return Reasons, Price Categories, Currencies, Payment Methods, and Payment Types.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleYes}
            className="w-full flex items-center justify-center space-x-3 bg-blue-600 text-white py-4 px-6 rounded-lg text-base font-semibold transition-all duration-200 hover:bg-blue-700 shadow-md hover:shadow-lg"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Yes, add all initial data</span>
          </button>

          <button
            onClick={handleChoose}
            className="w-full flex items-center justify-center space-x-3 bg-indigo-600 text-white py-4 px-6 rounded-lg text-base font-semibold transition-all duration-200 hover:bg-indigo-700 shadow-md hover:shadow-lg"
          >
            <Settings className="w-5 h-5" />
            <span>Yes, but I want to choose</span>
          </button>

          <button
            onClick={handleNo}
            className="w-full flex items-center justify-center space-x-3 bg-gray-600 text-white py-4 px-6 rounded-lg text-base font-semibold transition-all duration-200 hover:bg-gray-700 shadow-md hover:shadow-lg"
          >
            <XCircle className="w-5 h-5" />
            <span>No, I'll configure manually</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            You can always add or modify this data later from the settings menu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeInitialization;

