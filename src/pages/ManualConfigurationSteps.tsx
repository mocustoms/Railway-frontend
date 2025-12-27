import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Settings, Store, DollarSign, Calendar, Users, Package, Receipt, CreditCard } from 'lucide-react';

interface ConfigurationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const CONFIGURATION_STEPS: ConfigurationStep[] = [
  {
    id: 'financial-year',
    title: 'Set Up Financial Year',
    description: 'Configure your financial year period (e.g., Jan 1 - Dec 31)',
    icon: <Calendar className="w-6 h-6" />,
    route: '/financial-year'
  },
  {
    id: 'stores',
    title: 'Create Store Locations',
    description: 'Add your store locations and warehouses',
    icon: <Store className="w-6 h-6" />,
    route: '/store-locations'
  },
  {
    id: 'accounts',
    title: 'Set Up Chart of Accounts',
    description: 'Configure your accounting structure and account types',
    icon: <DollarSign className="w-6 h-6" />,
    route: '/chart-of-accounts'
  },
  {
    id: 'currencies',
    title: 'Configure Currencies',
    description: 'Set up currencies and exchange rates',
    icon: <DollarSign className="w-6 h-6" />,
    route: '/currency-setup'
  },
  {
    id: 'customer-groups',
    title: 'Create Customer Groups',
    description: 'Organize customers into groups for better management',
    icon: <Users className="w-6 h-6" />,
    route: '/customer-groups'
  },
  {
    id: 'product-categories',
    title: 'Set Up Product Categories',
    description: 'Create product categories for organizing your inventory',
    icon: <Package className="w-6 h-6" />,
    route: '/product-categories'
  },
  {
    id: 'tax-codes',
    title: 'Configure Tax Codes',
    description: 'Set up tax rates and tax codes for your products',
    icon: <Receipt className="w-6 h-6" />,
    route: '/tax-codes'
  },
  {
    id: 'payment-methods',
    title: 'Set Up Payment Methods',
    description: 'Configure payment methods and payment types',
    icon: <CreditCard className="w-6 h-6" />,
    route: '/payment-methods'
  },
  {
    id: 'price-categories',
    title: 'Create Price Categories',
    description: 'Set up different pricing tiers for your products',
    icon: <DollarSign className="w-6 h-6" />,
    route: '/price-categories'
  },
  {
    id: 'company-setup',
    title: 'Complete Company Setup',
    description: 'Review and complete your company profile and settings',
    icon: <Settings className="w-6 h-6" />,
    route: '/company-setup'
  }
];

const ManualConfigurationSteps: React.FC = () => {
  const navigate = useNavigate();

  const handleStartConfiguration = () => {
    if (CONFIGURATION_STEPS.length > 0) {
      navigate(CONFIGURATION_STEPS[0].route);
    }
  };

  const handleSkip = () => {
    navigate('/app-main');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Settings className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manual Configuration Required
          </h1>
          <p className="text-gray-600">
            Follow these steps to configure your company. You can complete them in any order.
          </p>
        </div>

        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> These configurations are essential for your system to function properly. 
              You can access these settings later from the menu, but we recommend completing them now.
            </p>
          </div>

          <div className="space-y-4">
            {CONFIGURATION_STEPS.map((step, index) => (
              <div
                key={step.id}
                className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <div className="text-blue-600">{step.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-9">{step.description}</p>
                </div>
                <button
                  onClick={() => navigate(step.route)}
                  className="flex-shrink-0 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-300"
          >
            Skip for Now
          </button>
          <button
            onClick={handleStartConfiguration}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <span>Start Configuration</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualConfigurationSteps;

